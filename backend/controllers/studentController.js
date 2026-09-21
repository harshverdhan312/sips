const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const Student = require('../models/Student');
const Match = require('../models/Match');
const JobDescription = require('../models/JobDescription');
const { calculateMatch } = require('../utils/matchingEngine');
const memoryDb = require('../utils/memoryDb');
const config = require('../config');
const logger = require('../utils/logger');

/**
 * Helper to verify if a file starts with PDF magic bytes (%PDF-)
 */
function verifyPdfMagicBytes(filePath) {
  try {
    const fd = fs.openSync(filePath, 'r');
    const buffer = Buffer.alloc(5);
    fs.readSync(fd, buffer, 0, 5, 0);
    fs.closeSync(fd);
    return buffer.toString('utf-8') === '%PDF-';
  } catch (err) {
    logger.error('Error verifying PDF magic bytes:', err.message);
    return false;
  }
}

/**
 * Safely delete a file inside config.uploadDir
 */
function safeDeleteUploadFile(fileUrlOrName) {
  if (!fileUrlOrName || typeof fileUrlOrName !== 'string') return;
  try {
    const filename = path.basename(fileUrlOrName);
    const fullPath = path.join(config.uploadDir, filename);
    // Ensure path cannot escape uploadDir
    if (fullPath.startsWith(config.uploadDir) && fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      logger.info('Cleaned up previous resume file:', filename);
    }
  } catch (err) {
    logger.warn('Failed to clean up file:', err.message);
  }
}

/**
 * GET /api/student/profile
 * Student-only — get own profile
 */
exports.getProfile = async (req, res) => {
  try {
    if (!memoryDb.isMongoConnected()) {
      const student = memoryDb.findStudentById(req.user.id);
      if (!student) {
        return res.status(404).json({ message: 'Profile not found' });
      }
      const { passwordHash, ...clean } = student;
      return res.json(clean);
    }

    const student = await Student.findOne({ 
      _id: req.user.id, 
      collegeId: req.collegeId 
    }).select('-passwordHash');

    if (!student) {
      return res.status(404).json({ message: 'Profile not found' });
    }
    res.json(student);
  } catch (error) {
    logger.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error retrieving profile' });
  }
};

/**
 * PUT /api/student/profile
 * Student-only — update editable fields with strict mass assignment protection
 */
exports.updateProfile = async (req, res) => {
  try {
    const { skills, github, newPassword, password, name, tags, notes } = req.body;
    const pwd = newPassword || password;

    // Validate password if supplied
    if (pwd !== undefined) {
      if (typeof pwd !== 'string' || pwd.trim().length < 4) {
        return res.status(400).json({
          success: false,
          message: 'Password must be a string with at least 4 characters.'
        });
      }
    }

    // Validate skills if supplied
    let sanitizedSkills = undefined;
    if (skills !== undefined) {
      if (Array.isArray(skills)) {
        sanitizedSkills = skills
          .map(s => (typeof s === 'string' ? s.trim().toLowerCase() : ''))
          .filter(Boolean);
      } else if (typeof skills === 'string') {
        sanitizedSkills = skills
          .split(',')
          .map(s => s.trim().toLowerCase())
          .filter(Boolean);
      } else {
        return res.status(400).json({
          success: false,
          message: 'Skills must be an array of strings.'
        });
      }

      if (sanitizedSkills.length > 50) {
        return res.status(400).json({
          success: false,
          message: 'Maximum of 50 skills allowed.'
        });
      }
    }

    // Validate GitHub if supplied
    let sanitizedGithub = undefined;
    if (github !== undefined) {
      if (typeof github !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'GitHub handle/URL must be a string.'
        });
      }
      sanitizedGithub = github.trim().slice(0, 100);
    }

    // Validate Name if supplied
    let sanitizedName = undefined;
    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Name must be at least 2 characters.'
        });
      }
      sanitizedName = name.trim().slice(0, 100);
    }

    // Validate Tags if supplied
    let sanitizedTags = undefined;
    if (tags !== undefined) {
      if (!Array.isArray(tags)) {
        return res.status(400).json({
          success: false,
          message: 'Tags must be an array of strings.'
        });
      }
      sanitizedTags = tags
        .map(t => (typeof t === 'string' ? t.trim() : ''))
        .filter(Boolean)
        .slice(0, 20);
    }

    // Validate Notes if supplied
    let sanitizedNotes = undefined;
    if (notes !== undefined) {
      if (typeof notes !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'Notes must be a string.'
        });
      }
      sanitizedNotes = notes.trim().slice(0, 500);
    }

    // ----------------------------------------------------
    // Resilient In-Memory Mode
    // ----------------------------------------------------
    if (!memoryDb.isMongoConnected()) {
      const student = memoryDb.findStudentById(req.user.id);
      if (!student) {
        return res.status(404).json({ message: 'Profile not found' });
      }

      const updates = {};
      if (sanitizedSkills !== undefined) updates.skills = sanitizedSkills;
      if (sanitizedGithub !== undefined) updates.github = sanitizedGithub;
      if (sanitizedName !== undefined) updates.name = sanitizedName;
      if (sanitizedTags !== undefined) updates.tags = sanitizedTags;
      if (sanitizedNotes !== undefined) updates.notes = sanitizedNotes;
      if (pwd) {
        const salt = await bcrypt.genSalt(10);
        updates.passwordHash = await bcrypt.hash(pwd.trim(), salt);
      }

      const updated = memoryDb.updateStudent(req.user.id, updates);
      const { passwordHash, ...clean } = updated;
      return res.json({ message: 'Profile updated', student: clean });
    }

    // ----------------------------------------------------
    // MongoDB Mode (Authenticated Student & Tenant Authoritative)
    // ----------------------------------------------------
    const student = await Student.findOne({ 
      _id: req.user.id, 
      collegeId: req.collegeId 
    });

    if (!student) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    if (sanitizedSkills !== undefined) {
      student.skills = sanitizedSkills;
    }
    if (sanitizedGithub !== undefined) {
      student.github = sanitizedGithub;
    }
    if (sanitizedName !== undefined) {
      student.name = sanitizedName;
    }
    if (sanitizedTags !== undefined) {
      student.tags = sanitizedTags;
    }
    if (sanitizedNotes !== undefined) {
      student.notes = sanitizedNotes;
    }
    if (pwd) {
      const salt = await bcrypt.genSalt(10);
      student.passwordHash = await bcrypt.hash(pwd.trim(), salt);
    }

    await student.save();

    // Recompute matches for this student after skill update
    if (sanitizedSkills !== undefined) {
      const jds = await JobDescription.find({ collegeId: req.collegeId });
      for (const jd of jds) {
        const result = calculateMatch(student.skills, jd.requiredSkills);
        await Match.findOneAndUpdate(
          { studentId: student._id, jdId: jd._id },
          {
            studentId: student._id,
            jdId: jd._id,
            score: result.score,
            matchedSkills: result.matchedSkills,
            missingSkills: result.missingSkills,
            collegeId: req.collegeId
          },
          { upsert: true, new: true }
        );
      }
    }

    const updated = await Student.findById(student._id).select('-passwordHash');
    res.json({ message: 'Profile updated', student: updated });
  } catch (error) {
    logger.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error updating profile' });
  }
};

/**
 * POST /api/student/resume
 * Student-only — upload resume (expects multipart form with 'resume' field)
 */
exports.uploadResume = async (req, res) => {
  let uploadedFilePath = null;
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    uploadedFilePath = req.file.path;

    // Validate PDF magic bytes (%PDF-)
    if (!verifyPdfMagicBytes(uploadedFilePath)) {
      safeDeleteUploadFile(req.file.filename);
      return res.status(400).json({
        success: false,
        message: 'Invalid PDF file: Missing valid %PDF- header signature.'
      });
    }

    const newResumeUrl = `/uploads/${req.file.filename}`;

    // ----------------------------------------------------
    // Resilient In-Memory Mode
    // ----------------------------------------------------
    if (!memoryDb.isMongoConnected()) {
      const student = memoryDb.findStudentById(req.user.id);
      if (!student) {
        safeDeleteUploadFile(req.file.filename);
        return res.status(404).json({ message: 'Profile not found' });
      }

      const oldResume = student.resumeUrl;
      student.resumeUrl = newResumeUrl;

      // Clean up previous resume file if different
      if (oldResume && oldResume !== newResumeUrl) {
        safeDeleteUploadFile(oldResume);
      }

      return res.json({ message: 'Resume uploaded', resumeUrl: student.resumeUrl });
    }

    // ----------------------------------------------------
    // MongoDB Mode
    // ----------------------------------------------------
    const student = await Student.findOne({ 
      _id: req.user.id, 
      collegeId: req.collegeId 
    });

    if (!student) {
      safeDeleteUploadFile(req.file.filename);
      return res.status(404).json({ message: 'Profile not found' });
    }

    const oldResume = student.resumeUrl;
    student.resumeUrl = newResumeUrl;

    try {
      await student.save();
    } catch (saveErr) {
      safeDeleteUploadFile(req.file.filename);
      throw saveErr;
    }

    // Clean up previous resume file if successfully replaced
    if (oldResume && oldResume !== newResumeUrl) {
      safeDeleteUploadFile(oldResume);
    }

    res.json({ message: 'Resume uploaded', resumeUrl: student.resumeUrl });
  } catch (error) {
    if (uploadedFilePath) {
      safeDeleteUploadFile(path.basename(uploadedFilePath));
    }
    logger.error('Upload resume error:', error);
    res.status(500).json({ message: 'Server error uploading resume' });
  }
};

/**
 * GET /api/student/jobs
 * Student-only — list all JDs with match scores for this student
 */
exports.getJobs = async (req, res) => {
  try {
    if (!memoryDb.isMongoConnected()) {
      const jds = memoryDb.getJobs(req.collegeId);
      const student = memoryDb.findStudentById(req.user.id);
      const jobsWithScores = jds.map(jd => {
        const match = student ? calculateMatch(student.skills || [], jd.requiredSkills || []) : { score: 0, matchedSkills: [], missingSkills: [] };
        return {
          ...jd,
          matchScore: match.score,
          matchedSkills: match.matchedSkills,
          missingSkills: match.missingSkills
        };
      });
      return res.json(jobsWithScores);
    }

    const jds = await JobDescription.find({ collegeId: req.collegeId })
      .sort({ createdAt: -1 });

    const student = await Student.findOne({ 
      _id: req.user.id, 
      collegeId: req.collegeId 
    });

    // Get matches for this student
    const matches = await Match.find({ 
      studentId: student._id, 
      collegeId: req.collegeId 
    });
    const matchMap = {};
    matches.forEach(m => { matchMap[m.jdId.toString()] = m; });

    const jobsWithScores = jds.map(jd => {
      const match = matchMap[jd._id.toString()];
      return {
        ...jd.toObject(),
        matchScore: match ? match.score : 0,
        matchedSkills: match ? match.matchedSkills : [],
        missingSkills: match ? match.missingSkills : []
      };
    });

    res.json(jobsWithScores);
  } catch (error) {
    logger.error('Get jobs error:', error);
    res.status(500).json({ message: 'Server error retrieving jobs' });
  }
};

/**
 * GET /api/student/preferred-jobs
 * Student-only — top matching JDs sorted by score descending
 */
exports.getPreferredJobs = async (req, res) => {
  try {
    if (!memoryDb.isMongoConnected()) {
      const jds = memoryDb.getJobs(req.collegeId);
      const student = memoryDb.findStudentById(req.user.id);
      const preferred = jds.map(jd => {
        const match = student ? calculateMatch(student.skills || [], jd.requiredSkills || []) : { score: 0, matchedSkills: [], missingSkills: [] };
        return {
          ...jd,
          matchScore: match.score,
          matchedSkills: match.matchedSkills,
          missingSkills: match.missingSkills
        };
      }).filter(j => j.matchScore > 0).sort((a, b) => b.matchScore - a.matchScore);
      return res.json(preferred);
    }

    const student = await Student.findOne({ 
      _id: req.user.id, 
      collegeId: req.collegeId 
    });

    const matches = await Match.find({ 
      studentId: student._id, 
      collegeId: req.collegeId,
      score: { $gt: 0 }
    })
      .sort({ score: -1 })
      .populate('jdId');

    const preferredJobs = matches.map(m => ({
      ...m.jdId.toObject(),
      matchScore: m.score,
      matchedSkills: m.matchedSkills,
      missingSkills: m.missingSkills
    }));

    res.json(preferredJobs);
  } catch (error) {
    logger.error('Get preferred jobs error:', error);
    res.status(500).json({ message: 'Server error retrieving preferred jobs' });
  }
};
