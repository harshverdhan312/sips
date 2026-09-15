const Student = require('../models/Student');
const Match = require('../models/Match');
const AuditLog = require('../models/AuditLog');
const bcrypt = require('bcryptjs');
const { parseCSV } = require('../utils/csvParser');
const memoryDb = require('../utils/memoryDb');

/**
 * GET /api/admin/students
 * List students with search, filters, pagination, and sorting
 */
exports.getStudents = async (req, res) => {
  try {
    const {
      search,
      branch,
      batch,
      status,
      readiness,
      page = 1,
      limit = 20,
      sortBy = 'name',
      sortOrder = 'asc'
    } = req.query;

    if (!memoryDb.isMongoConnected()) {
      const allStudents = memoryDb.getStudents(req.collegeId, { search, branch, status, readiness });
      return res.json({
        success: true,
        students: allStudents,
        pagination: {
          total: allStudents.length,
          page: 1,
          limit: 20,
          totalPages: 1
        }
      });
    }

    const query = { collegeId: req.collegeId };

    // Search by name, rollNo/usn, or email
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { name: searchRegex },
        { rollNo: searchRegex },
        { usn: searchRegex },
        { email: searchRegex },
        { branch: searchRegex }
      ];
    }

    // Branch filter
    if (branch && branch !== 'All') {
      query.branch = new RegExp(`^${branch.trim()}$`, 'i');
    }

    // Batch filter
    if (batch && batch !== 'All') {
      query.batch = batch.trim();
    }

    // Placement status filter
    if (status && status !== 'All') {
      query.placementStatus = status.trim().toUpperCase();
    }

    // Readiness score filter
    if (readiness && readiness !== 'All') {
      const r = readiness.toLowerCase();
      if (r === 'ready') {
        query.readinessScore = { $gte: 75 };
      } else if (r === 'needs_improvement' || r === 'needs improvement') {
        query.readinessScore = { $gte: 50, $lt: 75 };
      } else if (r === 'at_risk' || r === 'at risk') {
        query.readinessScore = { $lt: 50 };
      }
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    // Sorting
    const sort = {};
    const validSortFields = ['name', 'rollNo', 'usn', 'email', 'branch', 'batch', 'cgpa', 'readinessScore', 'placementStatus', 'createdAt'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'name';
    sort[sortField] = sortOrder.toLowerCase() === 'desc' ? -1 : 1;

    const [students, total] = await Promise.all([
      Student.find(query)
        .select('-passwordHash')
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Student.countDocuments(query)
    ]);

    res.json({
      success: true,
      students,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum) || 1
      }
    });
  } catch (error) {
    console.error('Admin getStudents error:', error);
    res.status(500).json({ message: 'Server error retrieving students' });
  }
};

/**
 * GET /api/admin/students/:id
 * Get complete student details including match scores and readiness
 */
exports.getStudentById = async (req, res) => {
  try {
    if (!memoryDb.isMongoConnected()) {
      const student = memoryDb.findStudentById(req.params.id);
      if (!student) {
        return res.status(404).json({ message: 'Student not found' });
      }
      return res.json({
        success: true,
        student,
        matches: []
      });
    }

    const student = await Student.findOne({
      _id: req.params.id,
      collegeId: req.collegeId
    }).select('-passwordHash');

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Get job matches for this student
    const matches = await Match.find({
      studentId: student._id,
      collegeId: req.collegeId
    })
      .populate('jdId', 'title company department ctc status')
      .sort({ score: -1 })
      .lean();

    const formattedMatches = matches
      .filter(m => m.jdId)
      .map(m => ({
        jobId: m.jdId._id,
        title: m.jdId.title,
        company: m.jdId.company,
        department: m.jdId.department,
        ctc: m.jdId.ctc,
        status: m.jdId.status,
        matchScore: m.score,
        matchedSkills: m.matchedSkills,
        missingSkills: m.missingSkills
      }));

    res.json({
      success: true,
      student,
      matches: formattedMatches
    });
  } catch (error) {
    console.error('Admin getStudentById error:', error);
    res.status(500).json({ message: 'Server error retrieving student details' });
  }
};

/**
 * PUT /api/admin/students/:id
 * Update student details, placement status, readiness, tags, notes
 */
exports.updateStudent = async (req, res) => {
  try {
    if (!memoryDb.isMongoConnected()) {
      const updated = memoryDb.updateStudent(req.params.id, req.body);
      if (!updated) {
        return res.status(404).json({ message: 'Student not found' });
      }
      return res.json({
        success: true,
        message: 'Student updated successfully',
        student: updated
      });
    }

    const student = await Student.findOne({
      _id: req.params.id,
      collegeId: req.collegeId
    });

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const {
      name,
      rollNo,
      usn,
      branch,
      batch,
      cgpa,
      placementStatus,
      companyPlaced,
      packageOffered,
      readinessScore,
      technicalScore,
      softSkillScore,
      resumeScore,
      skills,
      tags,
      notes
    } = req.body;

    if (name !== undefined) student.name = name.trim();
    if (rollNo !== undefined) student.rollNo = rollNo.trim();
    if (usn !== undefined) student.usn = usn.trim();
    if (branch !== undefined) student.branch = branch.trim();
    if (batch !== undefined) student.batch = batch.trim();
    if (cgpa !== undefined) student.cgpa = Math.max(0, Math.min(10, parseFloat(cgpa) || 0));
    if (placementStatus !== undefined) {
      student.placementStatus = placementStatus.toUpperCase();
      if (student.placementStatus === 'PLACED') {
        if (companyPlaced !== undefined) student.companyPlaced = companyPlaced.trim();
        if (packageOffered !== undefined) student.packageOffered = parseFloat(packageOffered) || 0;
      }
    }
    if (companyPlaced !== undefined && student.placementStatus === 'PLACED') {
      student.companyPlaced = companyPlaced.trim();
    }
    if (packageOffered !== undefined) {
      student.packageOffered = parseFloat(packageOffered) || 0;
    }
    if (readinessScore !== undefined) {
      student.readinessScore = Math.max(0, Math.min(100, parseInt(readinessScore, 10) || 0));
    }
    if (technicalScore !== undefined) {
      student.technicalScore = Math.max(0, Math.min(100, parseInt(technicalScore, 10) || 0));
    }
    if (softSkillScore !== undefined) {
      student.softSkillScore = Math.max(0, Math.min(100, parseInt(softSkillScore, 10) || 0));
    }
    if (resumeScore !== undefined) {
      student.resumeScore = Math.max(0, Math.min(100, parseInt(resumeScore, 10) || 0));
    }
    if (skills !== undefined && Array.isArray(skills)) {
      student.skills = skills.map(s => s.trim().toLowerCase()).filter(Boolean);
    }
    if (tags !== undefined && Array.isArray(tags)) {
      student.tags = tags.map(t => t.trim()).filter(Boolean);
    }
    if (notes !== undefined) {
      student.notes = notes;
    }

    await student.save();

    // Log administrative action
    await AuditLog.create({
      collegeId: req.collegeId,
      action: 'UPDATE_STUDENT',
      actor: req.user.email || 'Admin',
      target: student.email,
      details: { updatedFields: Object.keys(req.body) }
    }).catch(err => console.error('AuditLog error:', err));

    res.json({
      success: true,
      message: 'Student updated successfully',
      student
    });
  } catch (error) {
    console.error('Admin updateStudent error:', error);
    res.status(500).json({ message: 'Server error updating student' });
  }
};

/**
 * DELETE /api/admin/students/:id
 * Remove student record and corresponding matches
 */
exports.deleteStudent = async (req, res) => {
  try {
    if (!memoryDb.isMongoConnected()) {
      const deleted = memoryDb.deleteStudent(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: 'Student not found' });
      }
      return res.json({
        success: true,
        message: 'Student deleted successfully'
      });
    }

    const student = await Student.findOneAndDelete({
      _id: req.params.id,
      collegeId: req.collegeId
    });

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Clean up matches
    await Match.deleteMany({
      studentId: student._id,
      collegeId: req.collegeId
    });

    // Log action
    await AuditLog.create({
      collegeId: req.collegeId,
      action: 'DELETE_STUDENT',
      actor: req.user.email || 'Admin',
      target: `${student.name} (${student.email})`
    }).catch(err => console.error('AuditLog error:', err));

    res.json({
      success: true,
      message: 'Student deleted successfully'
    });
  } catch (error) {
    console.error('Admin deleteStudent error:', error);
    res.status(500).json({ message: 'Server error deleting student' });
  }
};

/**
 * POST /api/admin/students/upload
 * Bulk upload students via CSV
 */
exports.uploadStudentsCSV = async (req, res) => {
  try {
    const { csvData } = req.body;

    if (!csvData) {
      return res.status(400).json({ message: 'CSV data is required in the request body' });
    }

    let parsed;
    try {
      parsed = parseCSV(csvData);
    } catch (parseErr) {
      return res.status(400).json({ message: parseErr.message });
    }

    const { students: parsedStudents, errors: parseErrors } = parsed;
    const results = {
      total: parsedStudents.length,
      success: 0,
      failed: 0,
      errors: [...parseErrors]
    };

    const salt = await bcrypt.genSalt(10);

    if (!memoryDb.isMongoConnected()) {
      for (const s of parsedStudents) {
        const cleanEmail = (s.email || '').toLowerCase().trim();
        const cleanRoll = (s.rollNo || s.usn || '').trim();
        const existing = memoryDb.findStudentByEmail(cleanEmail, req.collegeId) ||
          memoryDb.findStudentByRollNo(cleanRoll, req.collegeId);

        if (existing) {
          results.failed++;
          results.errors.push(`${s.email} / ${s.rollNo}: Student already exists`);
          continue;
        }

        const passwordHash = await bcrypt.hash(cleanRoll || '123456', salt);
        memoryDb.saveStudent({
          collegeId: req.collegeId,
          name: s.name,
          rollNo: cleanRoll,
          usn: s.usn || cleanRoll,
          email: cleanEmail,
          passwordHash,
          branch: s.branch,
          batch: s.batch,
          cgpa: s.cgpa !== undefined ? s.cgpa : 7.5,
          skills: s.skills || []
        });
        results.success++;
      }

      return res.json({
        success: true,
        message: `Imported ${results.success} of ${results.total} students`,
        results
      });
    }

    for (const s of parsedStudents) {
      try {
        const existing = await Student.findOne({
          $or: [
            { email: s.email, collegeId: req.collegeId },
            { rollNo: s.rollNo, collegeId: req.collegeId }
          ]
        });

        if (existing) {
          results.failed++;
          results.errors.push(`${s.email} / ${s.rollNo}: Student already exists`);
          continue;
        }

        const passwordHash = await bcrypt.hash(s.rollNo, salt);

        const student = new Student({
          collegeId: req.collegeId,
          name: s.name,
          rollNo: s.rollNo,
          usn: s.usn || s.rollNo,
          email: s.email,
          passwordHash,
          branch: s.branch || 'Computer Science & Engineering',
          batch: s.batch || '2025',
          cgpa: s.cgpa !== undefined ? s.cgpa : 7.5,
          skills: s.skills || [],
          github: '',
          resumeUrl: ''
        });

        await student.save();
        results.success++;
      } catch (err) {
        results.failed++;
        results.errors.push(`${s.email || 'unknown'}: ${err.message}`);
      }
    }

    await AuditLog.create({
      collegeId: req.collegeId,
      action: 'BULK_STUDENT_IMPORT',
      actor: req.user.email || 'Admin',
      target: `${results.success} students imported`,
      details: results
    }).catch(err => console.error('AuditLog error:', err));

    res.json({
      success: true,
      message: `Imported ${results.success} of ${results.total} students`,
      results
    });
  } catch (error) {
    console.error('Admin uploadStudentsCSV error:', error);
    res.status(500).json({ message: 'Server error during CSV upload' });
  }
};

/**
 * GET /api/admin/students/export
 * Export students as CSV
 */
exports.exportStudentsCSV = async (req, res) => {
  try {
    const { branch, batch, status } = req.query;
    const query = { collegeId: req.collegeId };

    if (branch && branch !== 'All') query.branch = new RegExp(`^${branch.trim()}$`, 'i');
    if (batch && batch !== 'All') query.batch = batch.trim();
    if (status && status !== 'All') query.placementStatus = status.trim().toUpperCase();

    const students = await Student.find(query)
      .select('name rollNo usn email branch batch cgpa placementStatus companyPlaced packageOffered readinessScore skills')
      .sort({ name: 1 })
      .lean();

    const headers = ['Name', 'Roll No', 'USN', 'Email', 'Branch', 'Batch', 'CGPA', 'Placement Status', 'Company Placed', 'Package Offered (LPA)', 'Readiness Score', 'Skills'];
    const rows = students.map(s => [
      `"${(s.name || '').replace(/"/g, '""')}"`,
      `"${(s.rollNo || '').replace(/"/g, '""')}"`,
      `"${(s.usn || s.rollNo || '').replace(/"/g, '""')}"`,
      `"${(s.email || '').replace(/"/g, '""')}"`,
      `"${(s.branch || '').replace(/"/g, '""')}"`,
      `"${(s.batch || '').replace(/"/g, '""')}"`,
      s.cgpa !== undefined ? s.cgpa : '',
      `"${(s.placementStatus || 'UNPLACED').replace(/"/g, '""')}"`,
      `"${(s.companyPlaced || '').replace(/"/g, '""')}"`,
      s.packageOffered !== undefined ? s.packageOffered : 0,
      s.readinessScore !== undefined ? s.readinessScore : 0,
      `"${(s.skills || []).join(', ').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="sips-students-export.csv"');
    res.status(200).send(csvContent);
  } catch (error) {
    console.error('Admin exportStudentsCSV error:', error);
    res.status(500).json({ message: 'Server error exporting students' });
  }
};

/**
 * POST /api/admin/students
 * Placement Administrator provisions an individual student account with initial password
 */
exports.createStudent = async (req, res) => {
  try {
    const {
      name,
      email,
      rollNo,
      usn,
      password,
      branch,
      batch,
      cgpa,
      skills
    } = req.body;

    if (!name || !email || (!rollNo && !usn)) {
      return res.status(400).json({
        message: 'Name, email, and roll number (or USN) are required'
      });
    }

    const emailClean = email.toLowerCase().trim();
    const finalRollNo = (rollNo || usn).trim();

    if (!memoryDb.isMongoConnected()) {
      const existingEmail = memoryDb.findStudentByEmail(emailClean, req.collegeId);
      const existingRoll = memoryDb.findStudentByRollNo(finalRollNo, req.collegeId);

      if (existingEmail) {
        return res.status(409).json({ message: 'A student with this email is already registered in your institution.' });
      }
      if (existingRoll) {
        return res.status(409).json({ message: 'A student with this roll number/USN is already registered in your institution.' });
      }

      const initialPassword = (password && password.trim().length >= 4) ? password.trim() : finalRollNo;
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(initialPassword, salt);

      const student = memoryDb.saveStudent({
        collegeId: req.collegeId,
        name: name.trim(),
        rollNo: finalRollNo,
        usn: (usn || finalRollNo).trim(),
        email: emailClean,
        passwordHash,
        branch: (branch || 'Computer Science & Engineering').trim(),
        batch: (batch || '2025').trim(),
        cgpa: cgpa !== undefined ? Math.max(0, Math.min(10, parseFloat(cgpa) || 7.0)) : 7.0,
        skills: Array.isArray(skills) ? skills.map(s => s.trim()).filter(Boolean) : [],
        placementStatus: 'UNPLACED',
        readinessScore: 65,
        technicalScore: 65,
        softSkillScore: 65,
        resumeScore: 65
      });

      return res.status(201).json({
        success: true,
        message: 'Student account created successfully',
        student: {
          id: student._id,
          _id: student._id,
          name: student.name,
          email: student.email,
          rollNo: student.rollNo,
          usn: student.usn,
          branch: student.branch,
          batch: student.batch,
          cgpa: student.cgpa,
          placementStatus: student.placementStatus,
          readinessScore: student.readinessScore,
          skills: student.skills,
          initialPassword: initialPassword
        }
      });
    }

    // Check for duplicate email or roll number within this college
    const existing = await Student.findOne({
      $or: [
        { email: emailClean, collegeId: req.collegeId },
        { rollNo: finalRollNo, collegeId: req.collegeId }
      ]
    });

    if (existing) {
      if (existing.email === emailClean) {
        return res.status(409).json({ message: 'A student with this email is already registered in your institution.' });
      }
      return res.status(409).json({ message: 'A student with this roll number/USN is already registered in your institution.' });
    }

    // Default password to provided password or student roll number
    const initialPassword = (password && password.trim().length >= 4) ? password.trim() : finalRollNo;
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(initialPassword, salt);

    const student = new Student({
      collegeId: req.collegeId,
      name: name.trim(),
      rollNo: finalRollNo,
      usn: (usn || finalRollNo).trim(),
      email: emailClean,
      passwordHash,
      branch: (branch || 'Computer Science & Engineering').trim(),
      batch: (batch || '2025').trim(),
      cgpa: cgpa !== undefined ? Math.max(0, Math.min(10, parseFloat(cgpa) || 7.0)) : 7.0,
      skills: Array.isArray(skills) ? skills.map(s => s.trim()).filter(Boolean) : [],
      placementStatus: 'UNPLACED',
      readinessScore: 65,
      technicalScore: 65,
      softSkillScore: 65,
      resumeScore: 65
    });

    await student.save();

    // Log administrative action
    await AuditLog.create({
      collegeId: req.collegeId,
      action: 'CREATE_STUDENT',
      actor: req.user?.email || 'Placement Admin',
      target: `${student.name} (${student.email})`,
      details: { rollNo: student.rollNo, branch: student.branch, batch: student.batch }
    }).catch(err => console.error('AuditLog error:', err));

    res.status(201).json({
      success: true,
      message: 'Student account created successfully',
      student: {
        id: student._id,
        _id: student._id,
        name: student.name,
        email: student.email,
        rollNo: student.rollNo,
        usn: student.usn,
        branch: student.branch,
        batch: student.batch,
        cgpa: student.cgpa,
        placementStatus: student.placementStatus,
        readinessScore: student.readinessScore,
        skills: student.skills,
        initialPassword: initialPassword
      }
    });
  } catch (error) {
    console.error('Admin createStudent error:', error);
    res.status(500).json({ message: 'Server error creating student' });
  }
};

