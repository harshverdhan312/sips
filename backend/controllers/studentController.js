const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const Student = require('../models/Student');
const Match = require('../models/Match');
const JobDescription = require('../models/JobDescription');
const Application = require('../models/Application');
const Notification = require('../models/Notification');
const { calculateMatch } = require('../utils/matchingEngine');
const { sendNotification } = require('../utils/notificationService');
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
    const { skills, github, newPassword, password, name, tags, notes, age, internships, hostel, historyOfBacklogs } = req.body;
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
      if (sanitizedAge !== undefined) updates.age = sanitizedAge;
      if (sanitizedInternships !== undefined) updates.internships = sanitizedInternships;
      if (sanitizedHostel !== undefined) updates.hostel = sanitizedHostel;
      if (sanitizedHistoryOfBacklogs !== undefined) updates.historyOfBacklogs = sanitizedHistoryOfBacklogs;
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
        return {
          ...jd,
          matchScore: match.score,
          matchedSkills: match.matchedSkills,
          missingSkills: match.missingSkills,
          hasApplied: !!app,
          applicationStatus: app ? app.status : null
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
      return {
        ...jd.toObject(),
        matchScore: match ? match.score : 0,
        matchedSkills: match ? match.matchedSkills : [],
        missingSkills: match ? match.missingSkills : [],
        hasApplied: !!app,
        applicationStatus: app ? app.status : null
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
        return {
          ...jd,
          matchScore: match.score,
          matchedSkills: match.matchedSkills,
          missingSkills: match.missingSkills,
          hasApplied: !!app,
          applicationStatus: app ? app.status : null
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
        return {
          ...jdObj,
          matchScore: m.score,
          matchedSkills: m.matchedSkills,
          missingSkills: m.missingSkills,
          hasApplied: !!app,
          applicationStatus: app ? app.status : null
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

      if (job.status && job.status === 'CLOSED') {
        return res.status(400).json({ success: false, message: 'This job posting is closed' });
      }

      if (job.deadline && new Date(job.deadline) < new Date()) {
        return res.status(400).json({ success: false, message: 'The application deadline for this job has passed' });
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

    if (job.status && job.status === 'CLOSED') {
      return res.status(400).json({ success: false, message: 'This job posting is closed' });
    }

    if (job.deadline && new Date(job.deadline) < new Date()) {
      return res.status(400).json({ success: false, message: 'The application deadline for this job has passed' });
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
