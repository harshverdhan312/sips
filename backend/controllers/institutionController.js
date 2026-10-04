const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const Institution = require('../models/Institution');
const Department = require('../models/Department');
const College = require('../models/College');
const Student = require('../models/Student');
const JobDescription = require('../models/JobDescription');
const Application = require('../models/Application');
const memoryDb = require('../utils/memoryDb');
const config = require('../config');
const logger = require('../utils/logger');

const generateToken = (payload) => {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
};

const isModelQueryable = (model) => {
  return mongoose.connection.readyState === 1 ||
    typeof model?.findOne?.mockImplementation === 'function' ||
    typeof model?.findOne?.mockResolvedValue === 'function';
};

/**
 * POST /api/institution/onboard
 * Public onboarding endpoint to register a new University / Institute and Main Admin
 */
exports.onboardInstitution = async (req, res) => {
  try {
    const {
      name,
      code,
      address,
      officialEmail,
      phone,
      website,
      adminName,
      adminUsername,
      adminPassword,
      acceptedDomains
    } = req.body;

    const cleanName = (name || req.body.institutionName || '').trim();
    const cleanUsername = (adminUsername || req.body.username || '').toLowerCase().trim();
    const cleanPassword = adminPassword || req.body.password || '';

    if (!cleanName) {
      return res.status(400).json({ success: false, message: 'University/Institution name is required' });
    }
    if (!cleanUsername) {
      return res.status(400).json({ success: false, message: 'Main Administrator username is required' });
    }
    if (!cleanPassword || cleanPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long' });
    }

    const cleanEmail = (officialEmail || `${cleanUsername}@university.edu`).toLowerCase().trim();
    const cleanCode = (code || cleanName.slice(0, 4)).toUpperCase().trim();
    const cleanSlug = (
      req.body.slug ||
      cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') ||
      cleanUsername.replace(/[^a-z0-9]/g, '') ||
      `inst-${Date.now()}`
    );
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(cleanPassword, salt);

    // 1. In-Memory Mode
    if (!memoryDb.isMongoConnected()) {
      const existingUser = memoryDb.findInstitutionByMainAdminUsername(cleanUsername) || memoryDb.findDepartmentByUsername(cleanUsername);
      if (existingUser) {
        return res.status(409).json({ success: false, message: 'Username is already taken by another account.' });
      }

      const inst = memoryDb.saveInstitution({
        name: cleanName,
        slug: cleanSlug,
        code: cleanCode,
        address: (address || '').trim(),
        officialEmail: cleanEmail,
        phone: (phone || '').trim(),
        website: (website || '').trim(),
        acceptedDomains: Array.isArray(acceptedDomains) ? acceptedDomains : [cleanEmail.split('@')[1] || 'university.edu'],
        mainAdmin: {
          name: (adminName || 'Main Admin').trim(),
          username: cleanUsername,
          email: cleanEmail,
          passwordHash,
          role: 'MAIN_UNIVERSITY_ADMIN'
        }
      });

      const token = generateToken({
        id: inst._id,
        role: 'MAIN_UNIVERSITY_ADMIN',
        institutionId: inst._id,
        institutionName: inst.name,
        username: inst.mainAdmin.username,
        email: inst.officialEmail
      });

      return res.status(201).json({
        success: true,
        message: 'University onboarded successfully',
        token,
        role: 'MAIN_UNIVERSITY_ADMIN',
        institutionId: inst._id,
        institutionName: inst.name,
        institution: {
          id: inst._id,
          _id: inst._id,
          name: inst.name,
          slug: inst.slug || cleanSlug,
          code: inst.code,
          officialEmail: inst.officialEmail,
          address: inst.address
        }
      });
    }

    // 2. MongoDB Mode
    const existing = await Institution.findOne({
      $or: [
        { 'mainAdmin.username': cleanUsername },
        { officialEmail: cleanEmail },
        { code: cleanCode },
        { slug: cleanSlug }
      ]
    });

    if (existing) {
      if (existing.mainAdmin?.username === cleanUsername) {
        return res.status(409).json({ success: false, message: 'Administrator username is already in use.' });
      }
      if (existing.officialEmail === cleanEmail) {
        return res.status(409).json({ success: false, message: 'Official institution email is already registered.' });
      }
      if (existing.code === cleanCode) {
        return res.status(409).json({ success: false, message: 'Institution code is already in use.' });
      }
      if (existing.slug === cleanSlug) {
        return res.status(409).json({ success: false, message: 'Institution name/slug is already in use.' });
      }
    }

    const newInst = new Institution({
      name: cleanName,
      slug: cleanSlug,
      code: cleanCode,
      address: (address || '').trim(),
      officialEmail: cleanEmail,
      phone: (phone || '').trim(),
      website: (website || '').trim(),
      acceptedDomains: Array.isArray(acceptedDomains) && acceptedDomains.length > 0
        ? acceptedDomains.map(d => d.toLowerCase().trim())
        : [cleanEmail.split('@')[1] || 'university.edu'],
      mainAdmin: {
        name: (adminName || 'Main Admin').trim(),
        username: cleanUsername,
        email: cleanEmail,
        passwordHash,
        role: 'MAIN_UNIVERSITY_ADMIN'
      },
      status: 'ACTIVE'
    });

    await newInst.save();

    // Create companion College record for legacy compatibility
    try {
      const slug = cleanUsername.replace(/[^a-z0-9]/g, '');
      const existingCol = await College.findOne({ slug });
      if (!existingCol) {
        await College.create({
          _id: newInst._id,
          name: newInst.name,
          slug: slug || `univ-${Date.now()}`,
          adminEmail: cleanEmail,
          masterPasswordHash: passwordHash,
          acceptedDomains: newInst.acceptedDomains
        });
      }
    } catch (_) {
      // Ignore college sync duplicate if exists
    }

    const token = generateToken({
      id: newInst._id,
      role: 'MAIN_UNIVERSITY_ADMIN',
      institutionId: newInst._id,
      institutionName: newInst.name,
      username: newInst.mainAdmin.username,
      email: newInst.officialEmail
    });

    return res.status(201).json({
      success: true,
      message: 'University onboarded successfully',
      token,
      role: 'MAIN_UNIVERSITY_ADMIN',
      institutionId: newInst._id,
      institutionName: newInst.name,
      institution: {
        _id: newInst._id,
        name: newInst.name,
        code: newInst.code,
        officialEmail: newInst.officialEmail,
        address: newInst.address
      }
    });
  } catch (error) {
    logger.error('Onboard institution error:', error);
    res.status(500).json({ success: false, message: 'Failed to onboard university. Please try again.' });
  }
};

/**
 * GET /api/institution/profile
 * Get authenticated university / institute profile
 */
exports.getInstitutionProfile = async (req, res) => {
  try {
    const institutionId = req.institutionId || req.user.institutionId;

    if (!memoryDb.isMongoConnected()) {
      const inst = memoryDb.findInstitutionById(institutionId);
      if (!inst) {
        return res.status(404).json({ success: false, message: 'Institution profile not found' });
      }
      const { mainAdmin, ...clean } = inst;
      return res.json({
        success: true,
        institution: {
          ...clean,
          adminName: mainAdmin?.name,
          adminUsername: mainAdmin?.username,
          adminEmail: mainAdmin?.email
        }
      });
    }

    const inst = await Institution.findById(institutionId).select('-mainAdmin.passwordHash');
    if (!inst) {
      return res.status(404).json({ success: false, message: 'Institution profile not found' });
    }

    return res.json({
      success: true,
      institution: inst
    });
  } catch (error) {
    logger.error('Get institution profile error:', error);
    res.status(500).json({ success: false, message: 'Error retrieving institution profile' });
  }
};

/**
 * PUT /api/institution/profile
 * Update authenticated university / institute profile
 */
exports.updateInstitutionProfile = async (req, res) => {
  try {
    const institutionId = req.institutionId || req.user.institutionId;
    const { name, code, address, city, state, phone, website, officialEmail, acceptedDomains } = req.body;

    const updates = {};
    if (name) updates.name = name.trim();
    if (code !== undefined) updates.code = code.trim();
    if (address !== undefined) updates.address = address.trim();
    if (city !== undefined) updates.city = city.trim();
    if (state !== undefined) updates.state = state.trim();
    if (phone !== undefined) updates.phone = phone.trim();
    if (website !== undefined) updates.website = website.trim();
    if (officialEmail) updates.officialEmail = officialEmail.toLowerCase().trim();
    if (Array.isArray(acceptedDomains)) updates.acceptedDomains = acceptedDomains.map(d => d.toLowerCase().trim());

    if (!memoryDb.isMongoConnected()) {
      const updated = memoryDb.updateInstitution(institutionId, updates);
      if (!updated) {
        return res.status(404).json({ success: false, message: 'Institution not found' });
      }
      return res.json({ success: true, message: 'Institution profile updated', institution: updated });
    }

    const inst = await Institution.findByIdAndUpdate(institutionId, { $set: updates }, { new: true }).select('-mainAdmin.passwordHash');
    if (!inst) {
      return res.status(404).json({ success: false, message: 'Institution not found' });
    }

    return res.json({ success: true, message: 'Institution profile updated', institution: inst });
  } catch (error) {
    logger.error('Update institution profile error:', error);
    res.status(500).json({ success: false, message: 'Error updating institution profile' });
  }
};

/**
 * GET /api/institution/departments
 * List all departments in the authenticated institution with metrics
 */
exports.getDepartments = async (req, res) => {
  try {
    const institutionId = req.institutionId || req.user.institutionId;

    if (!memoryDb.isMongoConnected()) {
      const depts = memoryDb.findDepartmentsByInstitution(institutionId);
      const deptsWithStats = depts.map(d => {
        const dId = String(d._id);
        const students = memoryDb.students.filter(s => String(s.departmentId) === dId || String(s.collegeId) === dId);
        const jobs = memoryDb.jobs.filter(j => String(j.departmentId) === dId || String(j.collegeId) === dId);
        const apps = memoryDb.applications.filter(a => String(a.collegeId) === dId);
        return {
          ...d,
          studentCount: students.length,
          jobCount: jobs.length,
          applicationCount: apps.length
        };
      });
      return res.json({ success: true, departments: deptsWithStats });
    }

    const departments = await Department.find({ institutionId })
      .select('-passwordHash')
      .sort({ createdAt: -1 })
      .lean();

    const deptsWithStats = await Promise.all(
      departments.map(async (dept) => {
        const deptId = dept._id;
        const [studentCount, jobCount, applicationCount] = await Promise.all([
          Student.countDocuments({ $or: [{ departmentId: deptId }, { collegeId: deptId }] }),
          JobDescription.countDocuments({ $or: [{ departmentId: deptId }, { collegeId: deptId }] }),
          Application.countDocuments({ collegeId: deptId })
        ]);
        return {
          ...dept,
          studentCount,
          jobCount,
          applicationCount
        };
      })
    );

    return res.json({ success: true, departments: deptsWithStats });
  } catch (error) {
    logger.error('Get departments error:', error);
    res.status(500).json({ success: false, message: 'Error retrieving departments' });
  }
};

/**
 * POST /api/institution/departments
 * University Admin creates a new department account with credentials
 */
exports.createDepartment = async (req, res) => {
  try {
    const institutionId = req.institutionId || req.user.institutionId;
    const {
      name,
      code,
      username,
      password,
      programs,
      description,
      contactEmail,
      contactPhone
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Department name is required' });
    }
    if (!username || !username.trim()) {
      return res.status(400).json({ success: false, message: 'Department username is required' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long' });
    }

    const cleanUsername = username.toLowerCase().trim();
    const cleanCode = (code || name.slice(0, 3)).toUpperCase().trim();
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    if (!memoryDb.isMongoConnected()) {
      const existing = memoryDb.findDepartmentByUsername(cleanUsername) || memoryDb.findInstitutionByMainAdminUsername(cleanUsername);
      if (existing) {
        return res.status(409).json({ success: false, message: 'Username is already taken by another account.' });
      }

      const newDept = memoryDb.saveDepartment({
        institutionId,
        name: name.trim(),
        code: cleanCode,
        username: cleanUsername,
        passwordHash,
        programs: Array.isArray(programs) ? programs : [{ name: name.trim(), branches: [] }],
        description: (description || '').trim(),
        contactEmail: (contactEmail || `${cleanUsername}@institution.edu`).toLowerCase().trim(),
        contactPhone: (contactPhone || '').trim(),
        status: 'ACTIVE'
      });

      const { passwordHash: _, ...clean } = newDept;
      return res.status(201).json({
        success: true,
        message: `Department ${newDept.name} created successfully`,
        department: { ...clean, id: newDept._id, _id: newDept._id }
      });
    }

    const existing = await Department.findOne({
      $or: [{ username: cleanUsername }, { code: cleanCode, institutionId }]
    });

    if (existing) {
      if (existing.username === cleanUsername) {
        return res.status(409).json({ success: false, message: 'Username is already taken by another department.' });
      }
      return res.status(409).json({ success: false, message: `Department code ${cleanCode} is already used in this institution.` });
    }

    const dept = new Department({
      institutionId,
      name: name.trim(),
      code: cleanCode,
      username: cleanUsername,
      passwordHash,
      programs: Array.isArray(programs) && programs.length > 0 ? programs : [{ name: name.trim(), branches: [] }],
      description: (description || '').trim(),
      contactEmail: (contactEmail || `${cleanUsername}@institution.edu`).toLowerCase().trim(),
      contactPhone: (contactPhone || '').trim(),
      status: 'ACTIVE'
    });

    await dept.save();

    // Create shadow College record so legacy routes referencing collegeId work seamlessly
    try {
      const parentInst = await Institution.findById(institutionId);
      const existingCol = await College.findById(dept._id);
      if (!existingCol) {
        await College.create({
          _id: dept._id,
          name: dept.name,
          slug: dept.username,
          adminEmail: dept.contactEmail,
          masterPasswordHash: dept.passwordHash,
          acceptedDomains: parentInst?.acceptedDomains || []
        });
      }
    } catch (_) {
      // Ignore if shadow college exists
    }

    const cleanDept = dept.toObject();
    delete cleanDept.passwordHash;

    return res.status(201).json({
      success: true,
      message: `Department ${dept.name} created successfully`,
      department: cleanDept
    });
  } catch (error) {
    logger.error('Create department error:', error);
    res.status(500).json({ success: false, message: 'Error creating department' });
  }
};

/**
 * PUT /api/institution/departments/:id
 * Update department details or reset password
 */
exports.updateDepartment = async (req, res) => {
  try {
    const institutionId = req.institutionId || req.user.institutionId;
    const deptId = req.params.id;
    const { name, code, password, programs, description, contactEmail, contactPhone, status } = req.body;

    const updates = {};
    if (name) updates.name = name.trim();
    if (code) updates.code = code.toUpperCase().trim();
    if (description !== undefined) updates.description = description.trim();
    if (contactEmail) updates.contactEmail = contactEmail.toLowerCase().trim();
    if (contactPhone !== undefined) updates.contactPhone = contactPhone.trim();
    if (Array.isArray(programs)) updates.programs = programs;
    if (status && ['ACTIVE', 'INACTIVE'].includes(status.toUpperCase())) {
      updates.status = status.toUpperCase();
    }

    if (password && password.length >= 6) {
      const salt = await bcrypt.genSalt(10);
      updates.passwordHash = await bcrypt.hash(password, salt);
    }

    if (!memoryDb.isMongoConnected()) {
      const dept = memoryDb.findDepartmentById(deptId);
      if (!dept || String(dept.institutionId) !== String(institutionId)) {
        return res.status(404).json({ success: false, message: 'Department not found' });
      }
      const updated = memoryDb.updateDepartment(deptId, updates);
      const { passwordHash, ...clean } = updated;
      return res.json({ success: true, message: 'Department updated successfully', department: clean });
    }

    const dept = await Department.findOne({ _id: deptId, institutionId });
    if (!dept) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }

    Object.assign(dept, updates);
    await dept.save();

    // Sync shadow college record if name or password changed
    try {
      const colUpdates = {};
      if (updates.name) colUpdates.name = updates.name;
      if (updates.passwordHash) colUpdates.masterPasswordHash = updates.passwordHash;
      if (Object.keys(colUpdates).length > 0) {
        await College.findByIdAndUpdate(dept._id, { $set: colUpdates });
      }
    } catch (_) {}

    const cleanDept = dept.toObject();
    delete cleanDept.passwordHash;

    return res.json({
      success: true,
      message: 'Department updated successfully',
      department: cleanDept
    });
  } catch (error) {
    logger.error('Update department error:', error);
    res.status(500).json({ success: false, message: 'Error updating department' });
  }
};

/**
 * PATCH /api/institution/departments/:id/status
 * Toggle department active/inactive status
 */
exports.toggleDepartmentStatus = async (req, res) => {
  try {
    const institutionId = req.institutionId || req.user.institutionId;
    const deptId = req.params.id;
    const { status } = req.body;

    const newStatus = status ? status.toUpperCase() : null;

    if (!memoryDb.isMongoConnected()) {
      const dept = memoryDb.findDepartmentById(deptId);
      if (!dept || String(dept.institutionId) !== String(institutionId)) {
        return res.status(404).json({ success: false, message: 'Department not found' });
      }
      dept.status = newStatus || (dept.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE');
      return res.json({
        success: true,
        message: `Department status updated to ${dept.status}`,
        status: dept.status
      });
    }

    const dept = await Department.findOne({ _id: deptId, institutionId });
    if (!dept) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }

    dept.status = newStatus || (dept.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE');
    await dept.save();

    return res.json({
      success: true,
      message: `Department status updated to ${dept.status}`,
      status: dept.status
    });
  } catch (error) {
    logger.error('Toggle department status error:', error);
    res.status(500).json({ success: false, message: 'Error changing department status' });
  }
};

/**
 * DELETE /api/institution/departments/:id
 * Remove a department from an institution
 */
exports.deleteDepartment = async (req, res) => {
  try {
    const institutionId = req.institutionId || req.user.institutionId;
    const deptId = req.params.id;

    if (!memoryDb.isMongoConnected()) {
      const dept = memoryDb.findDepartmentById(deptId);
      if (!dept || String(dept.institutionId) !== String(institutionId)) {
        return res.status(404).json({ success: false, message: 'Department not found' });
      }
      memoryDb.deleteDepartment(deptId);
      return res.json({ success: true, message: 'Department removed successfully' });
    }

    const dept = await Department.findOne({ _id: deptId, institutionId });
    if (!dept) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }

    await Department.deleteOne({ _id: deptId, institutionId });
    await College.deleteOne({ _id: deptId }).catch(() => {});

    return res.json({ success: true, message: 'Department removed successfully' });
  } catch (error) {
    logger.error('Delete department error:', error);
    res.status(500).json({ success: false, message: 'Error deleting department' });
  }
};

/**
 * GET /api/institution/department/profile
 * Get authenticated department profile
 */
exports.getDepartmentOwnProfile = async (req, res) => {
  try {
    const departmentId = req.departmentId || req.user.departmentId || req.user.id;
    if (!memoryDb.isMongoConnected()) {
      const dept = memoryDb.findDepartmentById(departmentId);
      if (!dept) {
        return res.status(404).json({ success: false, message: 'Department profile not found' });
      }
      return res.json({ success: true, department: dept });
    }

    const dept = await Department.findById(departmentId).select('-passwordHash');
    if (!dept) {
      return res.status(404).json({ success: false, message: 'Department profile not found' });
    }
    return res.json({ success: true, department: dept });
  } catch (error) {
    logger.error('Get department own profile error:', error);
    res.status(500).json({ success: false, message: 'Error retrieving department profile' });
  }
};

/**
 * PUT /api/institution/department/profile
 * Update authenticated department profile
 */
exports.updateDepartmentOwnProfile = async (req, res) => {
  try {
    const departmentId = req.departmentId || req.user.departmentId || req.user.id;
    const { name, code, description, contactEmail, contactPhone } = req.body;

    const updates = {};
    if (name) updates.name = name.trim();
    if (code !== undefined) updates.code = code.trim();
    if (description !== undefined) updates.description = description.trim();
    if (contactEmail !== undefined) updates.contactEmail = contactEmail.toLowerCase().trim();
    if (contactPhone !== undefined) updates.contactPhone = contactPhone.trim();

    if (!memoryDb.isMongoConnected()) {
      const updated = memoryDb.updateDepartment(departmentId, updates);
      if (!updated) {
        return res.status(404).json({ success: false, message: 'Department not found' });
      }
      return res.json({ success: true, message: 'Department profile updated', department: updated });
    }

    const dept = await Department.findByIdAndUpdate(departmentId, { $set: updates, updatedAt: Date.now() }, { new: true }).select('-passwordHash');
    if (!dept) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }
    return res.json({ success: true, message: 'Department profile updated', department: dept });
  } catch (error) {
    logger.error('Update department own profile error:', error);
    res.status(500).json({ success: false, message: 'Error updating department profile' });
  }
};

/**
 * POST /api/institution/profile/image
 * Upload institution logo
 */
exports.uploadLogo = async (req, res) => {
  const fs = require('fs');
  const path = require('path');
  const { verifyImageMagicBytes } = require('../utils/fileSecurity');
  const cloudinaryService = require('../utils/cloudinary');
  const safeDeleteUploadFile = (filename) => {
    try {
      const p = filename.startsWith('/uploads/') ? path.join(__dirname, '..', filename) : path.join(__dirname, '../uploads', filename);
      if (fs.existsSync(p)) fs.unlinkSync(p);
    } catch(e) {}
  };

  let uploadedFilePath = null;
  try {
    const institutionId = req.institutionId || req.user.institutionId;
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file uploaded' });
    }

    uploadedFilePath = req.file.path;

    if (!verifyImageMagicBytes(uploadedFilePath)) {
      safeDeleteUploadFile(req.file.filename);
      return res.status(400).json({
        success: false,
        message: 'Invalid image file: Missing valid image signature (JPEG, PNG, GIF, WEBP).'
      });
    }

    let newLogoUrl = `/uploads/${req.file.filename}`;

    if (cloudinaryService.isCloudinaryConfigured()) {
      try {
        const cloudResult = await cloudinaryService.uploadImage(uploadedFilePath, {
          folder: 'sips/institutions',
          public_id: `inst-logo-${institutionId}-${Date.now()}`
        });
        newLogoUrl = cloudResult.secure_url;
        safeDeleteUploadFile(req.file.filename);
      } catch (cloudErr) {
        logger.warn('Cloudinary logo upload failed, falling back to local storage:', cloudErr.message);
        newLogoUrl = `/uploads/${req.file.filename}`;
      }
    }

    if (!memoryDb.isMongoConnected()) {
      const inst = memoryDb.findInstitutionById(institutionId);
      if (!inst) {
        safeDeleteUploadFile(req.file.filename);
        return res.status(404).json({ success: false, message: 'Institution not found' });
      }

      const oldLogo = inst.logoUrl;
      inst.logoUrl = newLogoUrl;

      if (oldLogo && oldLogo !== newLogoUrl) {
        if (oldLogo.includes('cloudinary.com')) {
          cloudinaryService.deleteImage(oldLogo);
        } else {
          safeDeleteUploadFile(oldLogo.replace('/uploads/', ''));
        }
      }

      return res.status(200).json({
        success: true,
        message: 'Institution logo updated successfully',
        logoUrl: inst.logoUrl
      });
    }

    const inst = await Institution.findById(institutionId);
    if (!inst) {
      safeDeleteUploadFile(req.file.filename);
      return res.status(404).json({ success: false, message: 'Institution not found' });
    }

    const oldLogo = inst.logoUrl;
    inst.logoUrl = newLogoUrl;
    await inst.save();

    if (oldLogo && oldLogo !== newLogoUrl) {
      if (oldLogo.includes('cloudinary.com')) {
        cloudinaryService.deleteImage(oldLogo);
      } else {
        safeDeleteUploadFile(oldLogo.replace('/uploads/', ''));
      }
    }

    res.status(200).json({
      success: true,
      message: 'Institution logo updated successfully',
      logoUrl: inst.logoUrl
    });
  } catch (error) {
    if (uploadedFilePath) {
      try {
        const fs = require('fs');
        if(fs.existsSync(uploadedFilePath)) fs.unlinkSync(uploadedFilePath);
      } catch(e) {}
    }
    logger.error('Upload institution logo error:', error);
    res.status(500).json({ success: false, message: 'Server error uploading institution logo' });
  }
};

/**
 * DELETE /api/institution/profile/image
 * Delete institution logo
 */
exports.deleteLogo = async (req, res) => {
  try {
    const institutionId = req.institutionId || req.user.institutionId;
    const fs = require('fs');
    const path = require('path');
    const cloudinaryService = require('../utils/cloudinary');
    const safeDeleteUploadFile = (filename) => {
      try {
        const p = filename.startsWith('/uploads/') ? path.join(__dirname, '..', filename) : path.join(__dirname, '../uploads', filename);
        if (fs.existsSync(p)) fs.unlinkSync(p);
      } catch(e) {}
    };

    if (!memoryDb.isMongoConnected()) {
      const inst = memoryDb.findInstitutionById(institutionId);
      if (!inst) {
        return res.status(404).json({ success: false, message: 'Institution not found' });
      }

      const oldLogo = inst.logoUrl;
      inst.logoUrl = null;
      if (oldLogo) {
        if (oldLogo.includes('cloudinary.com')) {
          cloudinaryService.deleteImage(oldLogo);
        } else {
          safeDeleteUploadFile(oldLogo.replace('/uploads/', ''));
        }
      }

      return res.status(200).json({
        success: true,
        message: 'Institution logo removed successfully',
        logoUrl: null
      });
    }

    const inst = await Institution.findById(institutionId);
    if (!inst) {
      return res.status(404).json({ success: false, message: 'Institution not found' });
    }

    const oldLogo = inst.logoUrl;
    inst.logoUrl = null;
    await inst.save();

    if (oldLogo) {
      if (oldLogo.includes('cloudinary.com')) {
        cloudinaryService.deleteImage(oldLogo);
      } else {
        safeDeleteUploadFile(oldLogo.replace('/uploads/', ''));
      }
    }

    res.status(200).json({
      success: true,
      message: 'Institution logo removed successfully',
      logoUrl: null
    });
  } catch (error) {
    logger.error('Delete institution logo error:', error);
    res.status(500).json({ success: false, message: 'Server error deleting institution logo' });
  }
};
