const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const Institution = require('../models/Institution');
const Department = require('../models/Department');
const Student = require('../models/Student');
const memoryDb = require('../utils/memoryDb');
const emailService = require('../services/emailService');
const logger = require('../utils/logger');

const isModelQueryable = (model) => {
  return mongoose.connection.readyState === 1 ||
    typeof model?.findOne?.mockImplementation === 'function' ||
    typeof model?.findOne?.mockResolvedValue === 'function';
};

const crypto = require('crypto');

/**
 * Generate a random temporary password
 */
function generateRandomPassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$';
  const bytes = crypto.randomBytes(8);
  let pass = '';
  for (let i = 0; i < 8; i++) {
    pass += chars.charAt(bytes[i] % chars.length);
  }
  return pass;
}

/**
 * GET /api/super-admin/colleges/pending
 * List all institutions awaiting Super Admin verification and approval
 */
exports.getPendingColleges = async (req, res) => {
  try {
    if (!memoryDb.isMongoConnected()) {
      const pending = memoryDb.institutions.filter(i => (i.status || 'ACTIVE') === 'PENDING_APPROVAL');
      return res.json({
        success: true,
        count: pending.length,
        colleges: pending.map(inst => ({
          id: inst._id,
          name: inst.name,
          slug: inst.slug,
          code: inst.code,
          officialEmail: inst.officialEmail,
          phone: inst.phone,
          website: inst.website,
          address: inst.address,
          acceptedDomains: inst.acceptedDomains || [],
          adminName: inst.mainAdmin?.name,
          adminUsername: inst.mainAdmin?.username,
          status: inst.status,
          createdAt: inst.createdAt
        }))
      });
    }

    const pending = await Institution.find({ status: 'PENDING_APPROVAL' }).sort({ createdAt: -1 });
    return res.json({
      success: true,
      count: pending.length,
      colleges: pending.map(inst => ({
        id: inst._id,
        name: inst.name,
        slug: inst.slug,
        code: inst.code,
        officialEmail: inst.officialEmail,
        phone: inst.phone,
        website: inst.website,
        address: inst.address,
        acceptedDomains: inst.acceptedDomains || [],
        adminName: inst.mainAdmin?.name,
        adminUsername: inst.mainAdmin?.username,
        status: inst.status,
        createdAt: inst.createdAt
      }))
    });
  } catch (error) {
    logger.error('Error fetching pending colleges:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch pending approval requests.' });
  }
};

/**
 * GET /api/super-admin/colleges
 * List all institutions with optional status filter & stats
 */
exports.getAllColleges = async (req, res) => {
  try {
    const { status, search } = req.query;

    if (!memoryDb.isMongoConnected()) {
      let list = memoryDb.institutions;

      if (status && status !== 'ALL') {
        list = list.filter(i => (i.status || 'ACTIVE') === status);
      }

      if (search && search.trim()) {
        const q = search.trim().toLowerCase();
        list = list.filter(i =>
          (i.name && i.name.toLowerCase().includes(q)) ||
          (i.officialEmail && i.officialEmail.toLowerCase().includes(q)) ||
          (i.code && i.code.toLowerCase().includes(q)) ||
          (i.mainAdmin?.username && i.mainAdmin.username.toLowerCase().includes(q))
        );
      }

      const enhanced = list.map(inst => {
        const deptCount = memoryDb.findDepartmentsByInstitution(inst._id).length;
        const studentCount = memoryDb.students.filter(s => String(s.collegeId) === String(inst._id)).length;
        return {
          id: inst._id,
          name: inst.name,
          slug: inst.slug,
          code: inst.code,
          officialEmail: inst.officialEmail,
          phone: inst.phone,
          website: inst.website,
          address: inst.address,
          acceptedDomains: inst.acceptedDomains || [],
          adminName: inst.mainAdmin?.name,
          adminUsername: inst.mainAdmin?.username,
          status: inst.status || 'ACTIVE',
          departmentCount: deptCount,
          studentCount: studentCount,
          createdAt: inst.createdAt
        };
      });

      return res.json({
        success: true,
        count: enhanced.length,
        colleges: enhanced
      });
    }

    const filter = {};
    if (status && status !== 'ALL') {
      filter.status = status;
    }
    if (search && search.trim()) {
      const q = search.trim();
      filter.$or = [
        { name: { $regex: q, $options: 'insensitive' } },
        { officialEmail: { $regex: q, $options: 'insensitive' } },
        { code: { $regex: q, $options: 'insensitive' } },
        { 'mainAdmin.username': { $regex: q, $options: 'insensitive' } }
      ];
    }

    const institutions = await Institution.find(filter).sort({ createdAt: -1 });

    const enhanced = await Promise.all(
      institutions.map(async (inst) => {
        const deptCount = await Department.countDocuments({ institutionId: inst._id });
        const studentCount = await Student.countDocuments({ collegeId: inst._id });
        return {
          id: inst._id,
          name: inst.name,
          slug: inst.slug,
          code: inst.code,
          officialEmail: inst.officialEmail,
          phone: inst.phone,
          website: inst.website,
          address: inst.address,
          acceptedDomains: inst.acceptedDomains || [],
          adminName: inst.mainAdmin?.name,
          adminUsername: inst.mainAdmin?.username,
          status: inst.status,
          departmentCount: deptCount,
          studentCount: studentCount,
          createdAt: inst.createdAt
        };
      })
    );

    return res.json({
      success: true,
      count: enhanced.length,
      colleges: enhanced
    });
  } catch (error) {
    logger.error('Error fetching colleges:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch colleges.' });
  }
};

/**
 * POST /api/super-admin/colleges/:id/approve
 * Approve an institution application, activate account, and email login credentials
 */
exports.approveCollege = async (req, res) => {
  try {
    const { id } = req.params;
    const { tempPassword: customPass, loginUrl } = req.body;

    const tempPassword = (customPass && customPass.trim().length >= 6) ? customPass.trim() : generateRandomPassword();
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(tempPassword, salt);

    if (!memoryDb.isMongoConnected()) {
      const inst = memoryDb.findInstitutionById(id);
      if (!inst) {
        return res.status(404).json({ success: false, message: 'Institution not found.' });
      }

      inst.status = 'ACTIVE';
      inst.mainAdmin.passwordHash = passwordHash;
      inst.approvedAt = new Date();
      inst.approvedBy = req.user?.username || 'superadmin';

      // Send official onboarding approval email with credentials
      await emailService.sendCollegeApprovalEmail({
        to: inst.officialEmail,
        collegeName: inst.name,
        username: inst.mainAdmin.username,
        tempPassword,
        loginUrl
      });

      return res.json({
        success: true,
        message: `Institution '${inst.name}' has been approved successfully. Login credentials sent to ${inst.officialEmail}.`,
        college: {
          id: inst._id,
          name: inst.name,
          officialEmail: inst.officialEmail,
          username: inst.mainAdmin.username,
          status: 'ACTIVE'
        },
        credentials: {
          username: inst.mainAdmin.username,
          tempPassword,
          officialEmail: inst.officialEmail
        }
      });
    }

    const inst = await Institution.findById(id);
    if (!inst) {
      return res.status(404).json({ success: false, message: 'Institution not found.' });
    }

    inst.status = 'ACTIVE';
    inst.mainAdmin.passwordHash = passwordHash;
    inst.approvedAt = new Date();
    inst.approvedBy = req.user?.username || 'superadmin';
    await inst.save();

    // Send email
    await emailService.sendCollegeApprovalEmail({
      to: inst.officialEmail,
      collegeName: inst.name,
      username: inst.mainAdmin.username,
      tempPassword,
      loginUrl
    });

    return res.json({
      success: true,
      message: `Institution '${inst.name}' has been approved successfully. Login credentials sent to ${inst.officialEmail}.`,
      college: {
        id: inst._id,
        name: inst.name,
        officialEmail: inst.officialEmail,
        username: inst.mainAdmin.username,
        status: 'ACTIVE'
      },
      credentials: {
        username: inst.mainAdmin.username,
        tempPassword,
        officialEmail: inst.officialEmail
      }
    });
  } catch (error) {
    logger.error('Error approving college:', error);
    return res.status(500).json({ success: false, message: 'Failed to approve institution. Please try again.' });
  }
};

/**
 * POST /api/super-admin/colleges/:id/reject
 * Reject an institution application and notify via email
 */
exports.rejectCollege = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!memoryDb.isMongoConnected()) {
      const inst = memoryDb.findInstitutionById(id);
      if (!inst) {
        return res.status(404).json({ success: false, message: 'Institution not found.' });
      }

      inst.status = 'REJECTED';
      inst.rejectionReason = (reason || '').trim();
      inst.rejectedAt = new Date();
      inst.rejectedBy = req.user?.username || 'superadmin';

      await emailService.sendCollegeRejectionEmail({
        to: inst.officialEmail,
        collegeName: inst.name,
        reason
      });

      return res.json({
        success: true,
        message: `Institution '${inst.name}' application rejected. Notification email sent.`,
        college: {
          id: inst._id,
          name: inst.name,
          status: 'REJECTED',
          rejectionReason: inst.rejectionReason
        }
      });
    }

    const inst = await Institution.findById(id);
    if (!inst) {
      return res.status(404).json({ success: false, message: 'Institution not found.' });
    }

    inst.status = 'REJECTED';
    inst.rejectionReason = (reason || '').trim();
    inst.rejectedAt = new Date();
    inst.rejectedBy = req.user?.username || 'superadmin';
    await inst.save();

    await emailService.sendCollegeRejectionEmail({
      to: inst.officialEmail,
      collegeName: inst.name,
      reason
    });

    return res.json({
      success: true,
      message: `Institution '${inst.name}' application rejected. Notification email sent.`,
      college: {
        id: inst._id,
        name: inst.name,
        status: 'REJECTED',
        rejectionReason: inst.rejectionReason
      }
    });
  } catch (error) {
    logger.error('Error rejecting college:', error);
    return res.status(500).json({ success: false, message: 'Failed to reject institution application.' });
  }
};

/**
 * POST /api/super-admin/colleges/:id/toggle-status
 * Activate or Deactivate an approved institution
 */
exports.toggleCollegeStatus = async (req, res) => {
  try {
    const { id } = req.params;

    if (!memoryDb.isMongoConnected()) {
      const inst = memoryDb.findInstitutionById(id);
      if (!inst) {
        return res.status(404).json({ success: false, message: 'Institution not found.' });
      }

      inst.status = inst.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      return res.json({
        success: true,
        message: `Institution status updated to '${inst.status}'.`,
        college: {
          id: inst._id,
          name: inst.name,
          status: inst.status
        }
      });
    }

    const inst = await Institution.findById(id);
    if (!inst) {
      return res.status(404).json({ success: false, message: 'Institution not found.' });
    }

    inst.status = inst.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    await inst.save();

    return res.json({
      success: true,
      message: `Institution status updated to '${inst.status}'.`,
      college: {
        id: inst._id,
        name: inst.name,
        status: inst.status
      }
    });
  } catch (error) {
    logger.error('Error toggling college status:', error);
    return res.status(500).json({ success: false, message: 'Failed to update institution status.' });
  }
};

/**
 * GET /api/super-admin/stats
 * Overview summary metrics for the Super Administrator Dashboard
 */
exports.getSystemStats = async (req, res) => {
  try {
    if (!memoryDb.isMongoConnected()) {
      const institutions = memoryDb.institutions;
      const totalInstitutions = institutions.length;
      const pendingApprovals = institutions.filter(i => (i.status || 'ACTIVE') === 'PENDING_APPROVAL').length;
      const activeInstitutions = institutions.filter(i => (i.status || 'ACTIVE') === 'ACTIVE').length;
      const rejectedInstitutions = institutions.filter(i => i.status === 'REJECTED').length;
      const totalDepartments = memoryDb.departments.length;
      const totalStudents = memoryDb.students.length;

      return res.json({
        success: true,
        stats: {
          totalInstitutions,
          pendingApprovals,
          activeInstitutions,
          rejectedInstitutions,
          totalDepartments,
          totalStudents
        }
      });
    }

    const [
      totalInstitutions,
      pendingApprovals,
      activeInstitutions,
      rejectedInstitutions,
      totalDepartments,
      totalStudents
    ] = await Promise.all([
      Institution.countDocuments({}),
      Institution.countDocuments({ status: 'PENDING_APPROVAL' }),
      Institution.countDocuments({ status: 'ACTIVE' }),
      Institution.countDocuments({ status: 'REJECTED' }),
      Department.countDocuments({}),
      Student.countDocuments({})
    ]);

    return res.json({
      success: true,
      stats: {
        totalInstitutions,
        pendingApprovals,
        activeInstitutions,
        rejectedInstitutions,
        totalDepartments,
        totalStudents
      }
    });
  } catch (error) {
    logger.error('Error fetching super admin stats:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch statistics.' });
  }
};

const path = require('path');
const fs = require('fs');

let inMemoryGlobalQuestions = null;

function loadLocalGlobalQuestions() {
  if (inMemoryGlobalQuestions) return inMemoryGlobalQuestions;

  const questions = [];
  const baseDir = path.resolve(__dirname, '../../practice-platform/backend/data/question-bank');

  try {
    const appsPath = path.join(baseDir, 'coding/apps_1000_coding_questions.json');
    if (fs.existsSync(appsPath)) {
      const data = JSON.parse(fs.readFileSync(appsPath, 'utf8'));
      if (Array.isArray(data)) {
        data.forEach(item => {
          questions.push({
            id: item.id || `apps_${item.externalId || Math.random().toString(36).substr(2, 9)}`,
            externalId: item.externalId || item.slug,
            type: 'CODING',
            format: 'CODING_PROBLEM',
            category: item.category || 'Algorithms',
            subcategory: item.subcategory || 'Coding',
            difficulty: item.difficulty || 'MEDIUM',
            status: item.status || 'ACTIVE',
            sourceType: 'BENCHMARK',
            sourceNamespace: 'codeparrot/apps',
            tags: item.tags || [],
            isGlobal: true,
            collegeId: null,
            latestTitle: item.title || item.latestTitle || item.name,
            statement: item.statement || item.problemStatement || item.description,
            createdAt: item.createdAt || new Date().toISOString()
          });
        });
      }
    }
  } catch (e) {
    logger.warn('Failed to load APPS questions for fallback:', e.message);
  }

  try {
    const neetcodePath = path.join(baseDir, 'coding/neetcode_150_coding_questions.json');
    if (fs.existsSync(neetcodePath)) {
      const data = JSON.parse(fs.readFileSync(neetcodePath, 'utf8'));
      if (Array.isArray(data)) {
        data.forEach(item => {
          questions.push({
            id: item.id || `nc_${item.externalId || Math.random().toString(36).substr(2, 9)}`,
            externalId: item.externalId || item.slug,
            type: 'CODING',
            format: 'CODING_PROBLEM',
            category: item.category || 'Data Structures',
            subcategory: item.subcategory || 'Coding',
            difficulty: item.difficulty || 'MEDIUM',
            status: item.status || 'ACTIVE',
            sourceType: 'CURATED',
            sourceNamespace: 'neetcode-150',
            tags: item.tags || [],
            isGlobal: true,
            collegeId: null,
            latestTitle: item.title || item.latestTitle || item.name,
            statement: item.statement || item.problemStatement || item.description,
            createdAt: item.createdAt || new Date().toISOString()
          });
        });
      }
    }
  } catch (e) {
    logger.warn('Failed to load NeetCode questions for fallback:', e.message);
  }

  try {
    const mcqPath = path.join(baseDir, 'mcq/mcq_questions.json');
    if (fs.existsSync(mcqPath)) {
      const data = JSON.parse(fs.readFileSync(mcqPath, 'utf8'));
      if (Array.isArray(data)) {
        data.forEach(item => {
          questions.push({
            id: item.id || `mcq_${Math.random().toString(36).substr(2, 9)}`,
            externalId: item.externalId || item.id,
            type: 'MCQ',
            format: 'SINGLE_CHOICE',
            category: item.category || 'Aptitude',
            subcategory: item.subcategory || 'MCQ',
            difficulty: item.difficulty || 'MEDIUM',
            status: item.status || 'ACTIVE',
            sourceType: 'CURATED',
            tags: item.tags || [],
            isGlobal: true,
            collegeId: null,
            latestTitle: item.title || item.latestTitle || item.question,
            statement: item.statement || item.question,
            options: item.options || [],
            createdAt: item.createdAt || new Date().toISOString()
          });
        });
      }
    }
  } catch (e) {
    logger.warn('Failed to load MCQ questions for fallback:', e.message);
  }

  inMemoryGlobalQuestions = questions;
  return inMemoryGlobalQuestions;
}

/**
 * GET /api/super-admin/questions
 * List global questions with pagination and search filters
 */
exports.getGlobalQuestions = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      type,
      difficulty,
      status
    } = req.query;

    // Try proxying to practice-platform if available
    const practiceUrl = process.env.PRACTICE_PLATFORM_URL || 'http://localhost:5050';
    try {
      const queryParams = new URLSearchParams({
        scope: 'global',
        page,
        limit,
        search,
        ...(type && type !== 'ALL' ? { type } : {}),
        ...(difficulty && difficulty !== 'ALL' ? { difficulty } : {}),
        ...(status && status !== 'ALL' ? { status } : {})
      });

      const response = await fetch(`${practiceUrl}/api/admin/questions?${queryParams.toString()}`, {
        headers: {
          'Authorization': req.headers.authorization || '',
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(2000)
      });

      if (response.ok) {
        const data = await response.json();
        return res.json(data);
      }
    } catch (_) {
      // Fallback to local files
    }

    let list = loadLocalGlobalQuestions();

    if (status && status !== 'ALL') {
      list = list.filter(q => q.status === status);
    }
    if (type && type !== 'ALL') {
      list = list.filter(q => q.type === type);
    }
    if (difficulty && difficulty !== 'ALL') {
      list = list.filter(q => q.difficulty === difficulty);
    }
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(item =>
        (item.latestTitle && item.latestTitle.toLowerCase().includes(q)) ||
        (item.category && item.category.toLowerCase().includes(q)) ||
        (item.externalId && item.externalId.toLowerCase().includes(q)) ||
        (item.tags && item.tags.some(t => t.toLowerCase().includes(q)))
      );
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const total = list.length;
    const totalPages = Math.ceil(total / limitNum);
    const start = (pageNum - 1) * limitNum;
    const items = list.slice(start, start + limitNum);

    return res.json({
      success: true,
      message: 'Global questions retrieved successfully',
      data: items,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages
      }
    });
  } catch (error) {
    logger.error('Error fetching global questions:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch global questions.' });
  }
};

/**
 * POST /api/super-admin/questions
 * Add a new global question
 */
exports.createGlobalQuestion = async (req, res) => {
  try {
    const {
      title,
      statement,
      type = 'CODING',
      category = 'Algorithms',
      subcategory,
      difficulty = 'MEDIUM',
      tags = [],
      options,
      correctAnswer,
      explanation,
      testCases,
      initialCodeTemplate
    } = req.body;

    if (!title || !statement) {
      return res.status(400).json({ success: false, message: 'Question title and problem statement are required.' });
    }

    const practiceUrl = process.env.PRACTICE_PLATFORM_URL || 'http://localhost:5050';
    try {
      const response = await fetch(`${practiceUrl}/api/admin/questions`, {
        method: 'POST',
        headers: {
          'Authorization': req.headers.authorization || '',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title,
          statement,
          type,
          format: type === 'CODING' ? 'CODING_PROBLEM' : 'SINGLE_CHOICE',
          category,
          subcategory,
          difficulty,
          tags,
          options,
          correctAnswer,
          explanation,
          isGlobal: true,
          collegeId: null,
          metadata: {
            testCases,
            initialCodeTemplate
          }
        }),
        signal: AbortSignal.timeout(3000)
      });

      if (response.ok) {
        const data = await response.json();
        return res.status(201).json(data);
      }
    } catch (_) {
      // Fallback in-memory
    }

    const list = loadLocalGlobalQuestions();
    const newQ = {
      id: `global_${Date.now()}`,
      externalId: `glob-${Date.now()}`,
      type,
      format: type === 'CODING' ? 'CODING_PROBLEM' : 'SINGLE_CHOICE',
      category,
      subcategory: subcategory || '',
      difficulty,
      status: 'ACTIVE',
      sourceType: 'CURATED',
      tags: Array.isArray(tags) ? tags : [],
      isGlobal: true,
      collegeId: null,
      latestTitle: title,
      statement,
      options: options || [],
      createdAt: new Date().toISOString()
    };

    list.unshift(newQ);

    return res.status(201).json({
      success: true,
      message: 'Global question created successfully',
      data: newQ
    });
  } catch (error) {
    logger.error('Error creating global question:', error);
    return res.status(500).json({ success: false, message: 'Failed to create global question.' });
  }
};

/**
 * POST /api/super-admin/questions/:id/archive
 * Archive / remove a global question
 */
exports.archiveGlobalQuestion = async (req, res) => {
  try {
    const { id } = req.params;

    const practiceUrl = process.env.PRACTICE_PLATFORM_URL || 'http://localhost:5050';
    try {
      const response = await fetch(`${practiceUrl}/api/admin/questions/${id}/archive`, {
        method: 'POST',
        headers: {
          'Authorization': req.headers.authorization || '',
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(3000)
      });

      if (response.ok) {
        const data = await response.json();
        return res.json(data);
      }
    } catch (_) {
      // Fallback
    }

    const list = loadLocalGlobalQuestions();
    const q = list.find(item => item.id === id || item.externalId === id);
    if (q) {
      q.status = 'ARCHIVED';
    }

    return res.json({
      success: true,
      message: `Question '${id}' has been archived successfully.`
    });
  } catch (error) {
    logger.error('Error archiving global question:', error);
    return res.status(500).json({ success: false, message: 'Failed to archive global question.' });
  }
};

/**
 * POST /api/super-admin/questions/:id/activate
 * Activate a global question
 */
exports.activateGlobalQuestion = async (req, res) => {
  try {
    const { id } = req.params;

    const practiceUrl = process.env.PRACTICE_PLATFORM_URL || 'http://localhost:5050';
    try {
      const response = await fetch(`${practiceUrl}/api/admin/questions/${id}/activate`, {
        method: 'POST',
        headers: {
          'Authorization': req.headers.authorization || '',
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(3000)
      });

      if (response.ok) {
        const data = await response.json();
        return res.json(data);
      }
    } catch (_) {
      // Fallback
    }

    const list = loadLocalGlobalQuestions();
    const q = list.find(item => item.id === id || item.externalId === id);
    if (q) {
      q.status = 'ACTIVE';
    }

    return res.json({
      success: true,
      message: `Question '${id}' has been activated successfully.`
    });
  } catch (error) {
    logger.error('Error activating global question:', error);
    return res.status(500).json({ success: false, message: 'Failed to activate global question.' });
  }
};

/**
 * GET /api/super-admin/email-status
 * Live diagnostic check for SMTP configuration and connectivity
 */
exports.getEmailStatus = async (req, res) => {
  try {
    const status = await emailService.verifySmtpConnection();
    return res.json({ success: true, ...status });
  } catch (error) {
    logger.error('Error verifying email status:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

