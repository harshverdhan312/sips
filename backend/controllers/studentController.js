const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const Student = require('../models/Student');
const Match = require('../models/Match');
const JobDescription = require('../models/JobDescription');
const Application = require('../models/Application');
const Notification = require('../models/Notification');
const PlacementPrediction = require('../models/PlacementPrediction');
const { calculateMatch, extractSkillsFromText } = require('../utils/matchingEngine');
const { checkJobEligibility } = require('../utils/eligibilityChecker');
const { sendNotification } = require('../utils/notificationService');
const { mapStudentToPlacementInput } = require('../utils/placementDataMapper');
const mlService = require('../services/mlService');
const githubService = require('../services/githubService');
const memoryDb = require('../utils/memoryDb');
const config = require('../config');
const logger = require('../utils/logger');
const resumeExtractor = require('../utils/resumeExtractor');
const { validateUsername, validateLinkedInUrl } = require('../utils/usernameValidator');

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
 * Helper to verify if a file has valid image magic bytes (JPEG, PNG, GIF, WEBP)
 */
function verifyImageMagicBytes(filePath) {
  try {
    const fd = fs.openSync(filePath, 'r');
    const buffer = Buffer.alloc(12);
    const bytesRead = fs.readSync(fd, buffer, 0, 12, 0);
    fs.closeSync(fd);

    if (bytesRead < 4) return false;

    // JPEG: FF D8 FF
    if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
      return true;
    }
    // PNG: 89 50 4E 47
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
      return true;
    }
    // GIF: 47 49 46 38 (GIF8)
    if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38) {
      return true;
    }
    // WEBP: RIFF....WEBP
    if (bytesRead >= 12 &&
        buffer.toString('ascii', 0, 4) === 'RIFF' &&
        buffer.toString('ascii', 8, 12) === 'WEBP') {
      return true;
    }

    return false;
  } catch (err) {
    logger.error('Error verifying image magic bytes:', err.message);
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
    const { skills, github, linkedin, newPassword, password, name, tags, notes, age, internships, hostel, historyOfBacklogs, cgpa, batch, branch } = req.body;
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

    // Validate age if supplied
    let sanitizedAge = undefined;
    if (age !== undefined) {
      if (age === null) {
        sanitizedAge = null;
      } else if (typeof age !== 'number' || !Number.isInteger(age) || age < 16 || age > 100) {
        return res.status(400).json({
          success: false,
          message: 'Invalid age: Age must be an integer between 16 and 100.'
        });
      } else {
        sanitizedAge = age;
      }
    }

    // Validate internships if supplied
    let sanitizedInternships = undefined;
    if (internships !== undefined) {
      if (internships === null) {
        sanitizedInternships = null;
      } else if (typeof internships !== 'number' || !Number.isInteger(internships) || internships < 0 || internships > 20) {
        return res.status(400).json({
          success: false,
          message: 'Invalid internships: Internships must be a non-negative integer.'
        });
      } else {
        sanitizedInternships = internships;
      }
    }

    // Validate hostel if supplied
    let sanitizedHostel = undefined;
    if (hostel !== undefined) {
      if (hostel === null) {
        sanitizedHostel = null;
      } else if (typeof hostel !== 'boolean') {
        return res.status(400).json({
          success: false,
          message: 'Invalid hostel value: Hostel must be a boolean (true or false).'
        });
      } else {
        sanitizedHostel = hostel;
      }
    }

    // Validate historyOfBacklogs if supplied
    let sanitizedHistoryOfBacklogs = undefined;
    if (historyOfBacklogs !== undefined) {
      if (historyOfBacklogs === null) {
        sanitizedHistoryOfBacklogs = null;
      } else if (typeof historyOfBacklogs !== 'number' || !Number.isInteger(historyOfBacklogs) || historyOfBacklogs < 0 || historyOfBacklogs > 50) {
        return res.status(400).json({
          success: false,
          message: 'Invalid historyOfBacklogs: History of backlogs must be a non-negative integer.'
        });
      } else {
        sanitizedHistoryOfBacklogs = historyOfBacklogs;
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

    // Validate LinkedIn if supplied
    let sanitizedLinkedin = undefined;
    if (linkedin !== undefined) {
      if (linkedin === '' || linkedin === null) {
        sanitizedLinkedin = '';
      } else {
        const { isValid, error, sanitized } = validateLinkedInUrl(linkedin);
        if (!isValid) {
          return res.status(400).json({
            success: false,
            message: error || 'Invalid LinkedIn profile URL.'
          });
        }
        sanitizedLinkedin = sanitized;
      }
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

    // Validate CGPA if supplied
    let sanitizedCgpa = undefined;
    if (cgpa !== undefined) {
      if (cgpa === null || cgpa === '') {
        sanitizedCgpa = 0;
      } else {
        const parsed = parseFloat(cgpa);
        if (isNaN(parsed) || parsed < 0 || parsed > 10) {
          return res.status(400).json({
            success: false,
            message: 'Invalid CGPA: CGPA must be a number between 0 and 10.'
          });
        }
        sanitizedCgpa = Math.round(parsed * 100) / 100;
      }
    }

    // Validate Batch / Graduation Year if supplied
    let sanitizedBatch = undefined;
    if (batch !== undefined) {
      if (typeof batch !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'Batch / Graduation Year must be a string.'
        });
      }
      sanitizedBatch = batch.trim().slice(0, 30);
    }

    // Validate Branch / Department if supplied
    let sanitizedBranch = undefined;
    if (branch !== undefined) {
      if (typeof branch !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'Branch must be a string.'
        });
      }
      sanitizedBranch = branch.trim().slice(0, 100);
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
      if (sanitizedLinkedin !== undefined) updates.linkedin = sanitizedLinkedin;
      if (sanitizedName !== undefined) updates.name = sanitizedName;
      if (sanitizedTags !== undefined) updates.tags = sanitizedTags;
      if (sanitizedNotes !== undefined) updates.notes = sanitizedNotes;
      if (sanitizedAge !== undefined) updates.age = sanitizedAge;
      if (sanitizedInternships !== undefined) updates.internships = sanitizedInternships;
      if (sanitizedHostel !== undefined) updates.hostel = sanitizedHostel;
      if (sanitizedHistoryOfBacklogs !== undefined) updates.historyOfBacklogs = sanitizedHistoryOfBacklogs;
      if (sanitizedCgpa !== undefined) updates.cgpa = sanitizedCgpa;
      if (sanitizedBatch !== undefined) updates.batch = sanitizedBatch;
      if (sanitizedBranch !== undefined) updates.branch = sanitizedBranch;
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
    if (sanitizedLinkedin !== undefined) {
      student.linkedin = sanitizedLinkedin;
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
    if (sanitizedAge !== undefined) {
      student.age = sanitizedAge;
    }
    if (sanitizedInternships !== undefined) {
      student.internships = sanitizedInternships;
    }
    if (sanitizedHostel !== undefined) {
      student.hostel = sanitizedHostel;
    }
    if (sanitizedHistoryOfBacklogs !== undefined) {
      student.historyOfBacklogs = sanitizedHistoryOfBacklogs;
    }
    if (sanitizedCgpa !== undefined) {
      student.cgpa = sanitizedCgpa;
    }
    if (sanitizedBatch !== undefined) {
      student.batch = sanitizedBatch;
    }
    if (sanitizedBranch !== undefined) {
      student.branch = sanitizedBranch;
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
    const pdfBuffer = await fs.promises.readFile(uploadedFilePath);

    // Extract academic details (CGPA and Graduation Year) and raw text from PDF resume
    let extractedCgpa = null;
    let extractedBatch = null;
    let rawPdfText = '';
    try {
      rawPdfText = resumeExtractor.extractTextFromPdfBuffer(pdfBuffer);
      const extracted = resumeExtractor.extractFromPdfBuffer(pdfBuffer);
      if (extracted.extractedCgpa !== null) extractedCgpa = extracted.extractedCgpa;
      if (extracted.extractedBatch !== null) extractedBatch = extracted.extractedBatch;
    } catch (parseErr) {
      logger.warn('Resume academic extraction error:', parseErr.message);
    }

    // Extract local skills using matchingEngine dictionary
    const localExtractedSkills = extractSkillsFromText(rawPdfText);

    // Trigger FastAPI ML resume skill extraction safely
    let mlAnalysis = {
      status: 'unavailable',
      extracted_skills: []
    };

    try {
      const extractionResult = await mlService.extractResumeSkills(pdfBuffer, req.file.originalname || req.file.filename);
      if (extractionResult && Array.isArray(extractionResult.extracted_skills)) {
        mlAnalysis = {
          status: 'completed',
          extracted_skills: extractionResult.extracted_skills
        };
      }
    } catch (mlErr) {
      logger.warn('ML resume skill extraction skipped/unavailable:', { error: mlErr.message });
      mlAnalysis = {
        status: 'unavailable',
        extracted_skills: [],
        message: 'ML skill extraction service is currently offline. Resume was saved successfully.'
      };
    }

    // Combine all extracted skills (local dictionary + ML extracted)
    const combinedExtractedSkills = Array.from(new Set([
      ...localExtractedSkills,
      ...mlAnalysis.extracted_skills
    ].map(s => String(s).trim()).filter(Boolean)));

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
      if (extractedCgpa !== null) {
        student.cgpa = extractedCgpa;
      }
      if (extractedBatch !== null) {
        student.batch = extractedBatch;
      }

      // Merge skills from resume
      if (combinedExtractedSkills.length > 0) {
        const existing = student.skills || [];
        student.skills = Array.from(new Set([...existing, ...combinedExtractedSkills]));
      }

      // Calculate verified readiness scores upon resume upload
      const totalSkillCount = (student.skills || []).length;
      student.resumeScore = Math.min(95, Math.max(70, 65 + totalSkillCount * 2));
      student.technicalScore = Math.min(95, Math.max(55, 50 + totalSkillCount * 3));
      student.softSkillScore = 70;
      student.readinessScore = Math.round(
        student.technicalScore * 0.4 +
        student.resumeScore * 0.3 +
        student.softSkillScore * 0.3
      );

      // Clean up previous resume file if different
      if (oldResume && oldResume !== newResumeUrl) {
        safeDeleteUploadFile(oldResume);
      }

      return res.json({
        success: true,
        message: 'Resume uploaded and analyzed successfully',
        resumeUrl: student.resumeUrl,
        extractedCgpa,
        extractedBatch,
        cgpa: student.cgpa,
        batch: student.batch,
        skills: student.skills,
        readinessScore: student.readinessScore,
        technicalScore: student.technicalScore,
        softSkillScore: student.softSkillScore,
        resumeScore: student.resumeScore,
        mlAnalysis
      });
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
    if (extractedCgpa !== null) {
      student.cgpa = extractedCgpa;
    }
    if (extractedBatch !== null) {
      student.batch = extractedBatch;
    }

    // Merge skills from resume
    if (combinedExtractedSkills.length > 0) {
      const existing = student.skills || [];
      student.skills = Array.from(new Set([...existing, ...combinedExtractedSkills]));
    }

    // Calculate verified readiness scores upon resume upload
    const totalSkillCount = (student.skills || []).length;
    student.resumeScore = Math.min(95, Math.max(70, 65 + totalSkillCount * 2));
    student.technicalScore = Math.min(95, Math.max(55, 50 + totalSkillCount * 3));
    student.softSkillScore = 70;
    student.readinessScore = Math.round(
      student.technicalScore * 0.4 +
      student.resumeScore * 0.3 +
      student.softSkillScore * 0.3
    );

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

    res.json({
      success: true,
      message: 'Resume uploaded and analyzed successfully',
      resumeUrl: student.resumeUrl,
      extractedCgpa,
      extractedBatch,
      cgpa: student.cgpa,
      batch: student.batch,
      skills: student.skills,
      readinessScore: student.readinessScore,
      technicalScore: student.technicalScore,
      softSkillScore: student.softSkillScore,
      resumeScore: student.resumeScore,
      mlAnalysis
    });
  } catch (error) {
    if (uploadedFilePath) {
      safeDeleteUploadFile(path.basename(uploadedFilePath));
    }
    logger.error('Upload resume error:', error);
    res.status(500).json({ message: 'Server error uploading resume' });
  }
};

/**
 * DELETE /api/student/resume
 * Student-only — delete uploaded resume and cleanly reset resume-derived scores and analysis
 */
exports.deleteResume = async (req, res) => {
  try {
    if (!memoryDb.isMongoConnected()) {
      const student = memoryDb.findStudentById(req.user.id);
      if (!student) {
        return res.status(404).json({ success: false, message: 'Profile not found' });
      }

      if (student.resumeUrl) {
        safeDeleteUploadFile(student.resumeUrl);
      }

      student.resumeUrl = '';
      student.resumeScore = 0;
      student.readinessScore = 0;
      student.technicalScore = 0;
      student.softSkillScore = 0;
      student.skills = [];

      return res.status(200).json({
        success: true,
        message: 'Resume removed successfully. Skill and readiness analysis reset.',
        student: {
          resumeUrl: '',
          readinessScore: 0,
          technicalScore: 0,
          resumeScore: 0,
          softSkillScore: 0,
          skills: []
        }
      });
    }

    const student = await Student.findOne({
      _id: req.user.id,
      collegeId: req.collegeId
    });

    if (!student) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    if (student.resumeUrl) {
      safeDeleteUploadFile(student.resumeUrl);
    }

    student.resumeUrl = '';
    student.resumeScore = 0;
    student.readinessScore = 0;
    student.technicalScore = 0;
    student.softSkillScore = 0;
    student.skills = [];

    await student.save();

    return res.status(200).json({
      success: true,
      message: 'Resume removed successfully. Skill and readiness analysis reset.',
      student: {
        resumeUrl: '',
        readinessScore: 0,
        technicalScore: 0,
        resumeScore: 0,
        softSkillScore: 0,
        skills: []
      }
    });
  } catch (error) {
    logger.error('Delete resume error:', error);
    res.status(500).json({ success: false, message: 'Server error removing resume' });
  }
};

/**
 * GET /api/student/resume
 * Student-only — download or view authenticated student's own resume
 */
exports.getResume = async (req, res, next) => {
  try {
    let student = null;
    if (!memoryDb.isMongoConnected()) {
      student = memoryDb.findStudentById(req.user.id);
    } else {
      student = await Student.findOne({
        _id: req.user.id,
        collegeId: req.collegeId
      }).select('resumeUrl name');
    }

    if (!student || !student.resumeUrl) {
      return res.status(404).json({
        success: false,
        message: 'No resume found for this student.'
      });
    }

    const filename = path.basename(student.resumeUrl);
    const uploadDirectory = path.resolve(config.uploadDir || path.join(__dirname, '../uploads'));
    const resolvedPath = path.resolve(uploadDirectory, filename);

    if (!resolvedPath.startsWith(uploadDirectory)) {
      logger.warn(`Path traversal attempt on authenticated resume: ${student.resumeUrl}`);
      return res.status(404).json({
        success: false,
        message: 'Resume file cannot be located.'
      });
    }

    if (!fs.existsSync(resolvedPath)) {
      return res.status(404).json({
        success: false,
        message: 'Resume file not found on server.'
      });
    }

    const safeDownloadName = `${(student.name || 'student').replace(/[^a-zA-Z0-9_-]/g, '_')}-resume.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${safeDownloadName}"`);

    return res.sendFile(resolvedPath);
  } catch (error) {
    logger.error('Authenticated resume access error:', error);
    next(error);
  }
};

/**
 * POST /api/student/profile/image
 * Student-only — upload profile image (multipart form with 'image' or 'profileImage')
 */
exports.uploadProfileImage = async (req, res) => {
  let uploadedFilePath = null;
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file uploaded' });
    }

    uploadedFilePath = req.file.path;

    // Validate image magic bytes
    if (!verifyImageMagicBytes(uploadedFilePath)) {
      safeDeleteUploadFile(req.file.filename);
      return res.status(400).json({
        success: false,
        message: 'Invalid image file: Missing valid image signature (JPEG, PNG, GIF, WEBP).'
      });
    }

    const newImageUrl = `/uploads/${req.file.filename}`;

    // ----------------------------------------------------
    // Resilient In-Memory Mode
    // ----------------------------------------------------
    if (!memoryDb.isMongoConnected() && !Student.findOne.mock) {
      const student = memoryDb.findStudentById(req.user.id);
      if (!student || (student.collegeId && String(student.collegeId) !== String(req.collegeId))) {
        safeDeleteUploadFile(req.file.filename);
        return res.status(404).json({ success: false, message: 'Profile not found' });
      }

      const oldImage = student.profileImageUrl;
      student.profileImageUrl = newImageUrl;

      // Clean up previous image file if different
      if (oldImage && oldImage !== newImageUrl) {
        safeDeleteUploadFile(oldImage);
      }

      return res.status(200).json({
        success: true,
        message: 'Profile image updated successfully',
        profileImageUrl: student.profileImageUrl
      });
    }

    // ----------------------------------------------------
    // MongoDB / Mongoose Mode
    // ----------------------------------------------------
    const student = await Student.findOne({
      _id: req.user.id,
      collegeId: req.collegeId
    });

    if (!student) {
      safeDeleteUploadFile(req.file.filename);
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    const oldImage = student.profileImageUrl;
    student.profileImageUrl = newImageUrl;

    try {
      await student.save();
    } catch (saveErr) {
      safeDeleteUploadFile(req.file.filename);
      throw saveErr;
    }

    // Clean up previous image file if successfully replaced
    if (oldImage && oldImage !== newImageUrl) {
      safeDeleteUploadFile(oldImage);
    }

    res.status(200).json({
      success: true,
      message: 'Profile image updated successfully',
      profileImageUrl: student.profileImageUrl
    });
  } catch (error) {
    if (uploadedFilePath) {
      safeDeleteUploadFile(path.basename(uploadedFilePath));
    }
    logger.error('Upload profile image error:', error);
    res.status(500).json({ success: false, message: 'Server error uploading profile image' });
  }
};

/**
 * DELETE /api/student/profile/image
 * Student-only — delete own profile image
 */
exports.deleteProfileImage = async (req, res) => {
  try {
    if (!memoryDb.isMongoConnected() && !Student.findOne.mock) {
      const student = memoryDb.findStudentById(req.user.id);
      if (!student || (student.collegeId && String(student.collegeId) !== String(req.collegeId))) {
        return res.status(404).json({ success: false, message: 'Profile not found' });
      }

      const oldImage = student.profileImageUrl;
      student.profileImageUrl = null;
      if (oldImage) {
        safeDeleteUploadFile(oldImage);
      }

      return res.status(200).json({
        success: true,
        message: 'Profile image removed successfully',
        profileImageUrl: null
      });
    }

    const student = await Student.findOne({
      _id: req.user.id,
      collegeId: req.collegeId
    });

    if (!student) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    const oldImage = student.profileImageUrl;
    student.profileImageUrl = null;
    await student.save();

    if (oldImage) {
      safeDeleteUploadFile(oldImage);
    }

    res.status(200).json({
      success: true,
      message: 'Profile image removed successfully',
      profileImageUrl: null
    });
  } catch (error) {
    logger.error('Delete profile image error:', error);
    res.status(500).json({ success: false, message: 'Server error deleting profile image' });
  }
};

/**
 * GET /api/student/jobs
 * Student-only — list all JDs with match scores and authoritative application state
 */
exports.getJobs = async (req, res) => {
  try {
    if (!memoryDb.isMongoConnected()) {
      const jds = memoryDb.getJobs(req.collegeId);
      const student = memoryDb.findStudentById(req.user.id);
      const studentApps = memoryDb.getStudentApplications(req.collegeId, req.user.id);
      const appMap = {};
      studentApps.forEach(a => { appMap[String(a.jobId)] = a; });

      const jobsWithScores = jds.map(jd => {
        const match = student ? calculateMatch(student.skills || [], jd.requiredSkills || []) : { score: 0, matchedSkills: [], missingSkills: [] };
        const app = appMap[String(jd._id)];
        const eligibilityReasons = student ? checkJobEligibility(student, jd) : [];
        return {
          ...jd,
          matchScore: match.score,
          matchedSkills: match.matchedSkills,
          missingSkills: match.missingSkills,
          hasApplied: !!app,
          applicationStatus: app ? app.status : null,
          isEligible: eligibilityReasons.length === 0,
          eligibilityReasons
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
    const matches = student ? await Match.find({ 
      studentId: student._id, 
      collegeId: req.collegeId 
    }) : [];
    const matchMap = {};
    matches.forEach(m => { matchMap[m.jdId.toString()] = m; });

    // Get applications for this student
    const applications = await Application.find({
      studentId: req.user.id,
      collegeId: req.collegeId
    });
    const appMap = {};
    applications.forEach(a => { appMap[a.jobId.toString()] = a; });

    const jobsWithScores = jds.map(jd => {
      const match = matchMap[jd._id.toString()];
      const app = appMap[jd._id.toString()];
      const eligibilityReasons = student ? checkJobEligibility(student, jd) : [];
      return {
        ...jd.toObject(),
        matchScore: match ? match.score : 0,
        matchedSkills: match ? match.matchedSkills : [],
        missingSkills: match ? match.missingSkills : [],
        hasApplied: !!app,
        applicationStatus: app ? app.status : null,
        isEligible: eligibilityReasons.length === 0,
        eligibilityReasons
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
 * Student-only — top matching JDs sorted by score descending with application state
 */
exports.getPreferredJobs = async (req, res) => {
  try {
    if (!memoryDb.isMongoConnected()) {
      const jds = memoryDb.getJobs(req.collegeId);
      const student = memoryDb.findStudentById(req.user.id);
      const studentApps = memoryDb.getStudentApplications(req.collegeId, req.user.id);
      const appMap = {};
      studentApps.forEach(a => { appMap[String(a.jobId)] = a; });

      const preferred = jds.map(jd => {
        const match = student ? calculateMatch(student.skills || [], jd.requiredSkills || []) : { score: 0, matchedSkills: [], missingSkills: [] };
        const app = appMap[String(jd._id)];
        const eligibilityReasons = student ? checkJobEligibility(student, jd) : [];
        return {
          ...jd,
          matchScore: match.score,
          matchedSkills: match.matchedSkills,
          missingSkills: match.missingSkills,
          hasApplied: !!app,
          applicationStatus: app ? app.status : null,
          isEligible: eligibilityReasons.length === 0,
          eligibilityReasons
        };
      }).filter(j => j.matchScore > 0).sort((a, b) => b.matchScore - a.matchScore);
      return res.json(preferred);
    }

    const student = await Student.findOne({ 
      _id: req.user.id, 
      collegeId: req.collegeId 
    });

    if (!student) {
      return res.json([]);
    }

    const matches = await Match.find({ 
      studentId: student._id, 
      collegeId: req.collegeId,
      score: { $gt: 0 }
    })
      .sort({ score: -1 })
      .populate('jdId');

    const applications = await Application.find({
      studentId: req.user.id,
      collegeId: req.collegeId
    });
    const appMap = {};
    applications.forEach(a => { appMap[a.jobId.toString()] = a; });

    const preferredJobs = matches
      .filter(m => m.jdId)
      .map(m => {
        const jdObj = m.jdId.toObject ? m.jdId.toObject() : m.jdId;
        const app = appMap[jdObj._id.toString()];
        const eligibilityReasons = student ? checkJobEligibility(student, jdObj) : [];
        return {
          ...jdObj,
          matchScore: m.score,
          matchedSkills: m.matchedSkills,
          missingSkills: m.missingSkills,
          hasApplied: !!app,
          applicationStatus: app ? app.status : null,
          isEligible: eligibilityReasons.length === 0,
          eligibilityReasons
        };
      });

    res.json(preferredJobs);
  } catch (error) {
    logger.error('Get preferred jobs error:', error);
    res.status(500).json({ message: 'Server error retrieving preferred jobs' });
  }
};

/**
 * POST /api/student/jobs/:id/apply
 * Student-only — submit persistent application for a job
 */
exports.applyToJob = async (req, res) => {
  try {
    const jobId = req.params.id;

    // ----------------------------------------------------
    // Resilient In-Memory Mode
    // ----------------------------------------------------
    if (!memoryDb.isMongoConnected()) {
      const job = memoryDb.findJobById(jobId);
      if (!job || String(job.collegeId) !== String(req.collegeId)) {
        return res.status(404).json({ success: false, message: 'Job not found' });
      }

      if (job.status && job.status.toUpperCase() === 'CLOSED') {
        return res.status(400).json({ success: false, message: 'This job posting is closed' });
      }

      if (job.status && job.status.toUpperCase() !== 'ACTIVE') {
        return res.status(400).json({ success: false, message: `This job posting is not active (status: ${job.status})` });
      }

      if (job.deadline && new Date(job.deadline) < new Date()) {
        return res.status(400).json({ success: false, message: 'The application deadline for this job has passed' });
      }

      const student = memoryDb.findStudentById(req.user.id);
      if (!student || String(student.collegeId) !== String(req.collegeId)) {
        return res.status(404).json({ success: false, message: 'Student profile not found' });
      }

      const accountStatus = (student.accountStatus || 'ACTIVE').toUpperCase();
      if (accountStatus === 'DEBARRED') {
        return res.status(403).json({
          success: false,
          message: 'You have been debarred from applying to placement drives. Please contact your Placement Cell.'
        });
      }
      if (accountStatus === 'PASSOUT' || accountStatus === 'DEACTIVATED') {
        return res.status(403).json({
          success: false,
          message: 'You are not permitted to apply for placement drives.'
        });
      }

      const reasons = checkJobEligibility(student, job);
      if (reasons.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'You are not eligible for this job.',
          reasons
        });
      }

      const existing = memoryDb.findApplication(req.collegeId, req.user.id, jobId);
      if (existing) {
        return res.status(409).json({ success: false, message: 'You have already applied for this job' });
      }

      const application = memoryDb.saveApplication({
        collegeId: req.collegeId,
        studentId: req.user.id,
        jobId: job._id,
        status: 'APPLIED',
        appliedAt: new Date()
      });

      sendNotification({
        collegeId: req.collegeId,
        studentId: req.user.id,
        title: 'Application Submitted',
        message: `Your application for ${job.title} at ${job.company} has been submitted.`,
        type: 'APPLICATION_SUBMITTED',
        applicationId: application._id,
        jobId: job._id
      });

      return res.status(201).json({
        success: true,
        message: 'Application submitted successfully',
        application
      });
    }

    // ----------------------------------------------------
    // MongoDB Mode
    // ----------------------------------------------------
    const job = await JobDescription.findOne({
      _id: jobId,
      collegeId: req.collegeId
    });

    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    if (job.status && job.status.toUpperCase() === 'CLOSED') {
      return res.status(400).json({ success: false, message: 'This job posting is closed' });
    }

    if (job.status && job.status.toUpperCase() !== 'ACTIVE') {
      return res.status(400).json({ success: false, message: `This job posting is not active (status: ${job.status})` });
    }

    if (job.deadline && new Date(job.deadline) < new Date()) {
      return res.status(400).json({ success: false, message: 'The application deadline for this job has passed' });
    }

    // Check student profile & eligibility
    const student = await Student.findOne({
      _id: req.user.id,
      collegeId: req.collegeId
    });

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found' });
    }

    const mongoAccountStatus = (student.accountStatus || 'ACTIVE').toUpperCase();
    if (mongoAccountStatus === 'DEBARRED') {
      return res.status(403).json({
        success: false,
        message: 'You have been debarred from applying to placement drives. Please contact your Placement Cell.'
      });
    }
    if (mongoAccountStatus === 'PASSOUT' || mongoAccountStatus === 'DEACTIVATED') {
      return res.status(403).json({
        success: false,
        message: 'You are not permitted to apply for placement drives.'
      });
    }

    const reasons = checkJobEligibility(student, job);
    if (reasons.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'You are not eligible for this job.',
        reasons
      });
    }

    // Check duplicate application
    const existing = await Application.findOne({
      collegeId: req.collegeId,
      studentId: req.user.id,
      jobId: job._id
    });

    if (existing) {
      return res.status(409).json({ success: false, message: 'You have already applied for this job' });
    }

    const application = new Application({
      collegeId: req.collegeId,
      studentId: req.user.id,
      jobId: job._id,
      status: 'APPLIED',
      appliedAt: new Date()
    });

    await application.save();

    // Send persistent event notification (non-blocking)
    sendNotification({
      collegeId: req.collegeId,
      studentId: req.user.id,
      title: 'Application Submitted',
      message: `Your application for ${job.title} at ${job.company} has been submitted.`,
      type: 'APPLICATION_SUBMITTED',
      applicationId: application._id,
      jobId: job._id
    });

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      application
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'You have already applied for this job' });
    }
    logger.error('Apply to job error:', error);
    res.status(500).json({ success: false, message: 'Server error submitting application' });
  }
};

/**
 * GET /api/student/applications
 * Student-only — list all applications submitted by the student
 */
exports.getApplications = async (req, res) => {
  try {
    if (!memoryDb.isMongoConnected()) {
      const apps = memoryDb.getStudentApplications(req.collegeId, req.user.id);
      const populated = apps.map(app => {
        const job = memoryDb.findJobById(app.jobId);
        return {
          ...app,
          jobId: job || null
        };
      });

      return res.json({
        success: true,
        count: populated.length,
        applications: populated
      });
    }

    const applications = await Application.find({
      collegeId: req.collegeId,
      studentId: req.user.id
    })
      .sort({ appliedAt: -1 })
      .populate('jobId', 'title company role department location ctc ctcValue type deadline status');

    res.json({
      success: true,
      count: applications.length,
      applications
    });
  } catch (error) {
    logger.error('Get student applications error:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving applications' });
  }
};

/**
 * GET /api/student/applications/:id
 * Student-only — get single application details
 */
exports.getApplicationById = async (req, res) => {
  try {
    if (!memoryDb.isMongoConnected()) {
      const app = memoryDb.findApplicationById(req.params.id);
      if (!app || String(app.collegeId) !== String(req.collegeId) || String(app.studentId) !== String(req.user.id)) {
        return res.status(404).json({ success: false, message: 'Application not found' });
      }
      const job = memoryDb.findJobById(app.jobId);
      return res.json({
        success: true,
        application: { ...app, jobId: job || null }
      });
    }

    const application = await Application.findOne({
      _id: req.params.id,
      collegeId: req.collegeId,
      studentId: req.user.id
    }).populate('jobId', 'title company role department location ctc ctcValue type deadline status');

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    res.json({
      success: true,
      application
    });
  } catch (error) {
    logger.error('Get application by ID error:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving application' });
  }
};

/**
 * PATCH /api/student/applications/:id/withdraw
 * Student-only — withdraw active application
 */
exports.withdrawApplication = async (req, res) => {
  try {
    if (!memoryDb.isMongoConnected()) {
      const app = memoryDb.findApplicationById(req.params.id);
      if (!app || String(app.collegeId) !== String(req.collegeId) || String(app.studentId) !== String(req.user.id)) {
        return res.status(404).json({ success: false, message: 'Application not found' });
      }

      if (app.status === 'WITHDRAWN') {
        return res.status(400).json({ success: false, message: 'Application is already withdrawn' });
      }

      if (app.status === 'REJECTED' || app.status === 'SELECTED') {
        return res.status(400).json({ success: false, message: `Cannot withdraw a finalized application (${app.status})` });
      }

      const updated = memoryDb.updateApplication(app._id, { status: 'WITHDRAWN' });

      sendNotification({
        collegeId: req.collegeId,
        studentId: req.user.id,
        title: 'Application Withdrawn',
        message: 'You have withdrawn your job application.',
        type: 'APPLICATION_WITHDRAWN',
        applicationId: app._id,
        jobId: app.jobId
      });

      return res.json({
        success: true,
        message: 'Application withdrawn successfully',
        application: updated
      });
    }

    const application = await Application.findOne({
      _id: req.params.id,
      collegeId: req.collegeId,
      studentId: req.user.id
    });

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    if (application.status === 'WITHDRAWN') {
      return res.status(400).json({ success: false, message: 'Application is already withdrawn' });
    }

    if (application.status === 'REJECTED' || application.status === 'SELECTED') {
      return res.status(400).json({ success: false, message: `Cannot withdraw a finalized application (${application.status})` });
    }

    application.status = 'WITHDRAWN';
    await application.save();

    sendNotification({
      collegeId: req.collegeId,
      studentId: req.user.id,
      title: 'Application Withdrawn',
      message: 'You have withdrawn your job application.',
      type: 'APPLICATION_WITHDRAWN',
      applicationId: application._id,
      jobId: application.jobId
    });

    res.json({
      success: true,
      message: 'Application withdrawn successfully',
      application
    });
  } catch (error) {
    logger.error('Withdraw application error:', error);
    res.status(500).json({ success: false, message: 'Server error withdrawing application' });
  }
};

/**
 * GET /api/student/analytics/placement
 * Student-only — get placement telemetry for authenticated student
 */
exports.getPlacementTelemetry = async (req, res) => {
  try {
    if (!memoryDb.isMongoConnected()) {
      const stats = memoryDb.getStudentApplicationStats(req.collegeId, req.user.id);
      return res.json({
        success: true,
        data: stats
      });
    }

    const applications = await Application.find({
      collegeId: req.collegeId,
      studentId: req.user.id
    });

    const byStatus = {
      APPLIED: 0,
      SHORTLISTED: 0,
      REJECTED: 0,
      SELECTED: 0,
      WITHDRAWN: 0
    };

    applications.forEach(app => {
      if (byStatus[app.status] !== undefined) {
        byStatus[app.status]++;
      }
    });

    const totalApplications = applications.length;
    const activeApplications = byStatus.APPLIED + byStatus.SHORTLISTED;
    const selectedApplications = byStatus.SELECTED;
    const shortlistedApplications = byStatus.SHORTLISTED;
    const rejectedApplications = byStatus.REJECTED;
    const withdrawnApplications = byStatus.WITHDRAWN;

    res.json({
      success: true,
      data: {
        totalApplications,
        activeApplications,
        selectedApplications,
        shortlistedApplications,
        rejectedApplications,
        withdrawnApplications,
        byStatus
      }
    });
  } catch (error) {
    logger.error('Get student telemetry error:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving placement telemetry' });
  }
};

/**
 * POST /api/student/analytics/placement/predict
 * Authenticated student — calculate and persist ML placement prediction
 */
exports.predictPlacement = async (req, res, next) => {
  try {
    let student = null;

    if (memoryDb.isMongoConnected() || Student.findOne.mock) {
      student = await Student.findOne({
        _id: req.user.id,
        collegeId: req.collegeId
      });
    } else {
      student = memoryDb.findStudentById(req.user.id);
      if (student && student.collegeId && String(student.collegeId) !== String(req.collegeId)) {
        student = null;
      }
    }

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found' });
    }

    // Map student profile data to strict ML schema
    const { isComplete, missingFields, payload } = mapStudentToPlacementInput(student);

    if (!isComplete) {
      return res.status(422).json({
        success: false,
        message: `Placement prediction requires complete profile information. Missing fields: ${missingFields.join(', ')}.`,
        missingFields
      });
    }

    // Call FastAPI ML microservice via resilient client
    const mlResponse = await mlService.predictPlacement(payload);

    const predictionData = {
      collegeId: req.collegeId,
      studentId: req.user.id,
      placementProbability: mlResponse.placement_probability,
      decisionThreshold: mlResponse.decision_threshold,
      predictedClass: mlResponse.predicted_class,
      predictedLabel: mlResponse.predicted_label,
      modelVersion: mlResponse.model_version,
      inputSnapshot: {
        age: payload.Age,
        internships: payload.Internships,
        cgpa: payload.CGPA,
        hostel: payload.Hostel,
        historyOfBacklogs: payload.HistoryOfBacklogs,
        stream: payload.Stream
      }
    };

    let savedRecord = null;
    if (memoryDb.isMongoConnected() || PlacementPrediction.create.mock) {
      savedRecord = await PlacementPrediction.create(predictionData);
    } else {
      savedRecord = memoryDb.savePlacementPrediction(predictionData);
    }

    res.status(200).json({
      success: true,
      message: 'Placement prediction calculated successfully',
      prediction: savedRecord
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/student/analytics/placement/prediction
 * Authenticated student — get latest persisted placement prediction
 */
exports.getLatestPlacementPrediction = async (req, res, next) => {
  try {
    let prediction = null;

    if (memoryDb.isMongoConnected() || PlacementPrediction.findOne.mock) {
      prediction = await PlacementPrediction.findOne({
        studentId: req.user.id,
        collegeId: req.collegeId
      }).sort({ createdAt: -1 });
    } else {
      prediction = memoryDb.getLatestPlacementPrediction(req.collegeId, req.user.id);
    }

    if (!prediction) {
      return res.status(200).json({
        success: true,
        prediction: null,
        message: 'No placement prediction available yet. Please complete your placement profile and request a prediction.'
      });
    }

    res.status(200).json({
      success: true,
      prediction
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/student/jobs/:id/analyze-match
 * Authenticated student — analyze job match with student profile using FastAPI hybrid matching
 */
exports.analyzeJobMatch = async (req, res, next) => {
  try {
    const jobId = req.params.id;
    let student = null;
    let jd = null;

    if (!memoryDb.isMongoConnected() && !Student.findOne.mock) {
      student = memoryDb.findStudentById(req.user.id);
      const allJobs = memoryDb.getJobs(req.collegeId);
      jd = allJobs.find(j => String(j._id || j.id) === String(jobId));
    } else {
      student = await Student.findOne({
        _id: req.user.id,
        collegeId: req.collegeId
      });
      jd = await JobDescription.findOne({
        _id: jobId,
        collegeId: req.collegeId
      });
    }

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found' });
    }
    if (!jd) {
      return res.status(404).json({ success: false, message: 'Job opportunity not found' });
    }

    const studentSkills = Array.isArray(student.skills) ? student.skills : [];
    const requiredSkills = Array.isArray(jd.requiredSkills) ? jd.requiredSkills : [];
    const jobText = [jd.title, jd.company, jd.description].filter(Boolean).join('. ');
    const resumeText = studentSkills.length > 0 ? studentSkills.join(', ') : 'Student technical profile';

    try {
      const hybridResult = await mlService.hybridMatchResume({
        studentSkills,
        requiredSkills,
        resumeText,
        jobText,
        skillWeight: 0.6,
        semanticWeight: 0.4
      });

      return res.status(200).json({
        success: true,
        jobId: jd._id || jd.id,
        jobTitle: jd.title,
        company: jd.company,
        mlStatus: 'completed',
        hybridMatch: {
          matched_skills: hybridResult.matched_skills,
          missing_skills: hybridResult.missing_skills,
          skill_coverage_score: hybridResult.skill_coverage_score,
          semantic_similarity: hybridResult.semantic_similarity,
          semantic_score: hybridResult.semantic_score,
          hybrid_match_score: hybridResult.hybrid_match_score,
          skill_weight: hybridResult.skill_weight,
          semantic_weight: hybridResult.semantic_weight
        }
      });
    } catch (mlErr) {
      logger.warn('FastAPI hybrid match unavailable, falling back to deterministic matching:', { error: mlErr.message });
      const localMatch = calculateMatch(studentSkills, requiredSkills);

      return res.status(200).json({
        success: true,
        jobId: jd._id || jd.id,
        jobTitle: jd.title,
        company: jd.company,
        mlStatus: 'offline',
        message: 'FastAPI ML engine is currently offline. Showing local deterministic match.',
        hybridMatch: {
          matched_skills: localMatch.matchedSkills || [],
          missing_skills: localMatch.missingSkills || [],
          skill_coverage_score: localMatch.score || 0,
          semantic_similarity: null,
          semantic_score: null,
          hybrid_match_score: localMatch.score || 0,
          skill_weight: 1.0,
          semantic_weight: 0.0
        }
      });
    }
  } catch (error) {
    logger.error('Analyze job match error:', error);
    next(error);
  }
};

/**
 * GET /api/student/github/repos
 * Fetch available public repositories for student's linked GitHub account
 */
exports.getGithubRepos = async (req, res, next) => {
  try {
    let student;
    if (!memoryDb.isMongoConnected()) {
      student = memoryDb.findStudentById(req.user.id);
    } else {
      student = await Student.findOne({ _id: req.user.id, collegeId: req.collegeId });
    }

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found' });
    }

    if (!student.github || !student.github.trim()) {
      return res.status(400).json({
        success: false,
        message: 'No GitHub handle linked to your profile. Please connect your GitHub account in profile settings.'
      });
    }

    const repos = await githubService.fetchUserRepositories(student.github);
    
    // Mark currently selected repositories
    const selectedRepoIds = new Set((student.projects || []).map(p => Number(p.repoId)));
    const repositoriesWithSelection = repos.map(repo => ({
      ...repo,
      isSelected: selectedRepoIds.has(repo.repoId)
    }));

    return res.json({
      success: true,
      githubHandle: githubService.extractUsername(student.github),
      total: repositoriesWithSelection.length,
      repositories: repositoriesWithSelection
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    }
    logger.error('Get GitHub repositories error:', error);
    next(error);
  }
};

/**
 * GET /api/student/projects
 * Get featured projects for authenticated student
 */
exports.getProjects = async (req, res, next) => {
  try {
    let student;
    if (!memoryDb.isMongoConnected()) {
      student = memoryDb.findStudentById(req.user.id);
    } else {
      student = await Student.findOne({ _id: req.user.id, collegeId: req.collegeId });
    }

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found' });
    }

    const projects = (student.projects || []).sort((a, b) => (a.order || 0) - (b.order || 0));

    return res.json({
      success: true,
      projects
    });
  } catch (error) {
    logger.error('Get student projects error:', error);
    next(error);
  }
};

/**
 * PUT /api/student/projects
 * Save/update featured projects (up to 3) for authenticated student
 */
exports.updateProjects = async (req, res, next) => {
  try {
    const { repoIds } = req.body;

    if (!Array.isArray(repoIds)) {
      return res.status(400).json({
        success: false,
        message: 'repoIds must be an array of numeric repository IDs.'
      });
    }

    if (repoIds.length > 3) {
      return res.status(400).json({
        success: false,
        message: 'Maximum of 3 featured projects allowed.'
      });
    }

    // Check duplicates
    const uniqueIds = new Set(repoIds);
    if (uniqueIds.size !== repoIds.length) {
      return res.status(400).json({
        success: false,
        message: 'Duplicate repository IDs are not allowed.'
      });
    }

    // Validate ID types
    for (const id of repoIds) {
      if (typeof id !== 'number' || isNaN(id) || id <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Each repoId must be a valid positive integer.'
        });
      }
    }

    let student;
    if (!memoryDb.isMongoConnected()) {
      student = memoryDb.findStudentById(req.user.id);
    } else {
      student = await Student.findOne({ _id: req.user.id, collegeId: req.collegeId });
    }

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found' });
    }

    // If clearing all projects
    if (repoIds.length === 0) {
      if (!memoryDb.isMongoConnected()) {
        memoryDb.updateStudent(req.user.id, { projects: [] });
      } else {
        student.projects = [];
        await student.save();
      }
      return res.json({
        success: true,
        message: 'Featured projects cleared successfully.',
        projects: []
      });
    }

    // For selecting projects, student must have a GitHub handle
    if (!student.github || !student.github.trim()) {
      return res.status(400).json({
        success: false,
        message: 'No GitHub handle linked to your profile. Please connect your GitHub account before selecting projects.'
      });
    }

    // Fetch verified repos from GitHub
    const verifiedRepos = await githubService.fetchUserRepositories(student.github);
    const repoMap = new Map(verifiedRepos.map(r => [r.repoId, r]));

    // Verify all requested repoIds belong to the authenticated student's GitHub account
    const selectedSnapshots = [];
    for (let i = 0; i < repoIds.length; i++) {
      const id = repoIds[i];
      const verifiedRepo = repoMap.get(id);
      if (!verifiedRepo) {
        return res.status(400).json({
          success: false,
          message: `Repository ID ${id} does not exist or does not belong to linked GitHub account '${student.github}'.`
        });
      }

      // Fetch detailed language breakdown for this featured repo
      let detailedLanguages = verifiedRepo.languages || [];
      try {
        const langs = await githubService.fetchRepoLanguages(verifiedRepo.owner, verifiedRepo.name);
        if (langs && langs.length > 0) {
          detailedLanguages = langs;
        }
      } catch (err) {
        logger.warn(`Could not fetch languages for ${verifiedRepo.owner}/${verifiedRepo.name}:`, err.message);
      }

      selectedSnapshots.push({
        repoId: verifiedRepo.repoId,
        name: verifiedRepo.name,
        fullName: verifiedRepo.fullName,
        owner: verifiedRepo.owner,
        htmlUrl: verifiedRepo.htmlUrl,
        description: verifiedRepo.description || '',
        primaryLanguage: verifiedRepo.primaryLanguage || '',
        languages: detailedLanguages,
        topics: verifiedRepo.topics || [],
        stars: verifiedRepo.stars || 0,
        forks: verifiedRepo.forks || 0,
        isFork: verifiedRepo.isFork || false,
        order: i + 1,
        updatedAt: verifiedRepo.updatedAt,
        selectedAt: new Date(),
        syncedAt: new Date()
      });
    }

    if (!memoryDb.isMongoConnected()) {
      memoryDb.updateStudent(req.user.id, { projects: selectedSnapshots });
    } else {
      student.projects = selectedSnapshots;
      await student.save();
    }

    return res.json({
      success: true,
      message: 'Featured projects updated successfully.',
      projects: selectedSnapshots
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    }
    logger.error('Update student projects error:', error);
    next(error);
  }
};

/**
 * POST /api/student/projects/sync
 * Refresh stored metadata for already-selected featured projects directly from GitHub
 */
exports.syncProjects = async (req, res, next) => {
  try {
    let student;
    if (!memoryDb.isMongoConnected()) {
      student = memoryDb.findStudentById(req.user.id);
    } else {
      student = await Student.findOne({ _id: req.user.id, collegeId: req.collegeId });
    }

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found' });
    }

    if (!student.github || !student.github.trim()) {
      return res.status(400).json({
        success: false,
        message: 'No GitHub handle linked to your profile. Please connect your GitHub account before syncing projects.'
      });
    }

    const currentProjects = student.projects || [];
    if (currentProjects.length === 0) {
      const now = new Date();
      return res.json({
        success: true,
        message: 'No featured projects currently selected to sync.',
        projects: [],
        syncedAt: now,
        updatedCount: 0,
        missingCount: 0,
        missingProjects: []
      });
    }

    // Fetch fresh repositories from GitHub (bypassCache = true to ensure fresh data)
    const verifiedRepos = await githubService.fetchUserRepositories(student.github, true);
    const repoMap = new Map(verifiedRepos.map(r => [r.repoId, r]));

    const refreshedProjects = [];
    const missingProjects = [];
    const syncTimestamp = new Date();
    let updatedCount = 0;

    // Preserve project order and iterate through existing selected projects
    const sortedCurrent = [...currentProjects].sort((a, b) => (a.order || 0) - (b.order || 0));

    for (let i = 0; i < sortedCurrent.length; i++) {
      const savedProj = sortedCurrent[i];
      const verifiedRepo = repoMap.get(Number(savedProj.repoId));

      if (verifiedRepo) {
        // Fetch detailed languages breakdown if available
        let detailedLanguages = verifiedRepo.languages || [];
        try {
          const langs = await githubService.fetchRepoLanguages(verifiedRepo.owner, verifiedRepo.name);
          if (langs && langs.length > 0) {
            detailedLanguages = langs;
          }
        } catch (err) {
          logger.warn(`Could not fetch languages during sync for ${verifiedRepo.owner}/${verifiedRepo.name}:`, err.message);
        }

        refreshedProjects.push({
          repoId: verifiedRepo.repoId,
          name: verifiedRepo.name,
          fullName: verifiedRepo.fullName,
          owner: verifiedRepo.owner,
          htmlUrl: verifiedRepo.htmlUrl,
          description: verifiedRepo.description || '',
          primaryLanguage: verifiedRepo.primaryLanguage || '',
          languages: detailedLanguages.length > 0 ? detailedLanguages : (savedProj.languages || []),
          topics: verifiedRepo.topics || [],
          stars: verifiedRepo.stars || 0,
          forks: verifiedRepo.forks || 0,
          isFork: verifiedRepo.isFork || false,
          order: savedProj.order || (i + 1),
          updatedAt: verifiedRepo.updatedAt,
          selectedAt: savedProj.selectedAt || new Date(),
          syncedAt: syncTimestamp
        });
        updatedCount++;
      } else {
        // Repository missing on GitHub (renamed, made private, deleted, etc.)
        // Keep existing saved snapshot so student selection is not destroyed!
        const snapshot = savedProj.toObject ? savedProj.toObject() : { ...savedProj };
        refreshedProjects.push({
          ...snapshot,
          order: savedProj.order || (i + 1)
        });
        missingProjects.push({
          repoId: savedProj.repoId,
          name: savedProj.name,
          reason: 'NOT_FOUND'
        });
      }
    }

    if (!memoryDb.isMongoConnected()) {
      memoryDb.updateStudent(req.user.id, { projects: refreshedProjects });
    } else {
      student.projects = refreshedProjects;
      await student.save();
    }

    return res.json({
      success: true,
      message: `Successfully synchronized ${updatedCount} featured project(s).`,
      projects: refreshedProjects,
      syncedAt: syncTimestamp,
      updatedCount,
      missingCount: missingProjects.length,
      missingProjects
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    }
    logger.error('Sync student projects error:', error);
    next(error);
  }
};

/**
 * GET /api/student/public-profile
 * Get authenticated student's public career profile configuration
 */
exports.getPublicProfileConfig = async (req, res, next) => {
  try {
    let student = null;

    if (!memoryDb.isMongoConnected()) {
      student = memoryDb.findStudentById(req.user.id);
    } else {
      student = await Student.findOne({
        _id: req.user.id,
        collegeId: req.collegeId
      }).select('publicProfile linkedin github resumeUrl name');
    }

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found.'
      });
    }

    const pub = student.publicProfile || {};

    return res.json({
      success: true,
      publicProfile: {
        enabled: pub.enabled === true,
        username: pub.username || '',
        bio: typeof pub.bio === 'string' ? pub.bio : '',
        showResume: pub.showResume === true,
        showGithub: pub.showGithub !== false,
        showLinkedIn: pub.showLinkedIn !== false,
        showSkills: pub.showSkills !== false,
        showProjects: pub.showProjects !== false
      },
      linkedin: student.linkedin || '',
      github: student.github || '',
      hasResume: Boolean(student.resumeUrl)
    });
  } catch (error) {
    logger.error('Get public profile config error:', error);
    next(error);
  }
};

/**
 * PUT /api/student/public-profile
 * Update authenticated student's public career profile configuration
 */
exports.updatePublicProfileConfig = async (req, res, next) => {
  try {
    const {
      enabled,
      username,
      bio,
      showResume,
      showGithub,
      showLinkedIn,
      showSkills,
      showProjects,
      linkedin
    } = req.body;

    let student = null;

    if (!memoryDb.isMongoConnected()) {
      student = memoryDb.findStudentById(req.user.id);
    } else {
      student = await Student.findOne({
        _id: req.user.id,
        collegeId: req.collegeId
      });
    }

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found.'
      });
    }

    const currentPublic = student.publicProfile || {
      enabled: false,
      username: '',
      bio: '',
      showResume: false,
      showGithub: true,
      showLinkedIn: true,
      showSkills: true,
      showProjects: true
    };

    const targetEnabled = enabled !== undefined ? Boolean(enabled) : (currentPublic.enabled === true);

    // Validate username if supplied or if profile is being enabled
    let normalizedUsername = currentPublic.username || '';
    if (username !== undefined) {
      if (typeof username !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'Username must be a string.'
        });
      }

      const trimmed = username.trim();
      if (trimmed) {
        const { isValid, error, normalized } = validateUsername(trimmed);
        if (!isValid) {
          return res.status(400).json({
            success: false,
            message: error || 'Invalid username format.'
          });
        }
        normalizedUsername = normalized;
      } else {
        normalizedUsername = '';
      }
    }

    if (targetEnabled && !normalizedUsername) {
      return res.status(400).json({
        success: false,
        message: 'A valid public username is required to enable your public career profile.'
      });
    }

    // Check username uniqueness if changed or enabling
    if (normalizedUsername && normalizedUsername !== currentPublic.username) {
      if (!memoryDb.isMongoConnected()) {
        if (memoryDb.isPublicUsernameTaken(normalizedUsername, req.user.id)) {
          return res.status(400).json({
            success: false,
            message: 'Username is already taken. Please choose another username.'
          });
        }
      } else {
        const existing = await Student.findOne({
          'publicProfile.username': normalizedUsername,
          _id: { $ne: req.user.id }
        });
        if (existing) {
          return res.status(400).json({
            success: false,
            message: 'Username is already taken. Please choose another username.'
          });
        }
      }
    }

    // Validate bio
    let sanitizedBio = currentPublic.bio || '';
    if (bio !== undefined) {
      if (bio === null) {
        sanitizedBio = '';
      } else if (typeof bio !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'Bio must be a plain text string.'
        });
      } else {
        sanitizedBio = bio.trim().slice(0, 500);
      }
    }

    // Validate LinkedIn
    let sanitizedLinkedin = student.linkedin || '';
    if (linkedin !== undefined) {
      if (linkedin === null || linkedin === '') {
        sanitizedLinkedin = '';
      } else {
        const { isValid, error, sanitized } = validateLinkedInUrl(linkedin);
        if (!isValid) {
          return res.status(400).json({
            success: false,
            message: error || 'Invalid LinkedIn URL.'
          });
        }
        sanitizedLinkedin = sanitized;
      }
    }

    const updatedPublicProfile = {
      enabled: targetEnabled,
      username: normalizedUsername,
      bio: sanitizedBio,
      showResume: showResume !== undefined ? Boolean(showResume) : (currentPublic.showResume === true),
      showGithub: showGithub !== undefined ? Boolean(showGithub) : (currentPublic.showGithub !== false),
      showLinkedIn: showLinkedIn !== undefined ? Boolean(showLinkedIn) : (currentPublic.showLinkedIn !== false),
      showSkills: showSkills !== undefined ? Boolean(showSkills) : (currentPublic.showSkills !== false),
      showProjects: showProjects !== undefined ? Boolean(showProjects) : (currentPublic.showProjects !== false)
    };

    if (!memoryDb.isMongoConnected()) {
      memoryDb.updateStudent(req.user.id, {
        publicProfile: updatedPublicProfile,
        linkedin: sanitizedLinkedin
      });
    } else {
      student.publicProfile = updatedPublicProfile;
      student.linkedin = sanitizedLinkedin;
      try {
        await student.save();
      } catch (saveError) {
        if (saveError.code === 11000 || (saveError.keyPattern && saveError.keyPattern['publicProfile.username'])) {
          return res.status(400).json({
            success: false,
            message: 'Username is already taken. Please choose another username.'
          });
        }
        throw saveError;
      }
    }

    return res.json({
      success: true,
      message: 'Public profile settings updated successfully.',
      publicProfile: updatedPublicProfile,
      linkedin: sanitizedLinkedin
    });
  } catch (error) {
    logger.error('Update public profile config error:', error);
    next(error);
  }
};


