const express = require('express');
const router = express.Router();

const auth = require('../middleware/auth');
const tenant = require('../middleware/tenant');
const adminOnly = require('../middleware/adminOnly');
const { validateObjectId, validatePagination } = require('../middleware/validate');

const adminAnalyticsController = require('../controllers/adminAnalyticsController');
const adminStudentController = require('../controllers/adminStudentController');
const adminJobController = require('../controllers/adminJobController');
const adminSkillController = require('../controllers/adminSkillController');
const alertController = require('../controllers/alertController');
const collegeController = require('../controllers/collegeController');
const multer = require('multer');
const path = require('path');
const config = require('../config');

// Configure multer for college logo uploads (JPEG, PNG, WebP, GIF)
const logoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, config.uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const uniqueName = `logo-${req.collegeId || 'college'}-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, uniqueName);
  }
});

const logoUpload = multer({
  storage: logoStorage,
  limits: { fileSize: config.uploadLimitBytes }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedExts = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedMimes.includes(file.mimetype) && allowedExts.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (JPEG, PNG, WebP, GIF) are allowed'), false);
    }
  }
});

// Enforce authentication, tenant context, and admin role for all admin routes
router.use(auth, tenant, adminOnly);

// ==========================================
// 0. College Profile & Logo Identity
// ==========================================
router.get('/college/profile', collegeController.getCollegeProfile);
router.put('/college/profile', collegeController.updateCollegeProfile);
router.post('/college/profile/image', logoUpload.single('image'), collegeController.uploadLogo);
router.delete('/college/profile/image', collegeController.deleteLogo);

// ==========================================
// 1. Overview & Institutional KPIs
// ==========================================
router.get('/overview', adminAnalyticsController.getOverview);

// ==========================================
// 2. Student Management & Bulk Operations
// ==========================================
router.get('/students', validatePagination, adminStudentController.getStudents);
router.post('/students', adminStudentController.createStudent);
router.post('/students/upload', adminStudentController.uploadStudentsCSV);
router.get('/students/export', adminStudentController.exportStudentsCSV);
router.get('/students/:id', validateObjectId('id'), adminStudentController.getStudentById);
router.put('/students/:id', validateObjectId('id'), adminStudentController.updateStudent);
router.delete('/students/:id', validateObjectId('id'), adminStudentController.deleteStudent);

// ==========================================
// 3. Analytics
// ==========================================
router.get('/analytics/students', adminAnalyticsController.getStudentAnalytics);
router.get('/analytics/placement', adminAnalyticsController.getPlacementAnalytics);

// ==========================================
// 4. Jobs & Campus Recruitment Drives
// ==========================================
router.get('/jobs', adminJobController.getJobs);
router.post('/jobs', adminJobController.createJob);
router.get('/jobs/:id', validateObjectId('id'), adminJobController.getJobById);
router.put('/jobs/:id', validateObjectId('id'), adminJobController.updateJob);
router.delete('/jobs/:id', validateObjectId('id'), adminJobController.deleteJob);
router.get('/jobs/:id/matches', validateObjectId('id'), adminJobController.getJobMatches);
router.get('/jobs/:id/applicants', validateObjectId('id'), adminJobController.getJobApplicants);
router.get('/jobs/:id/applications', validateObjectId('id'), adminJobController.getJobApplicants);
router.get('/jobs/:id/matched/export', validateObjectId('id'), adminJobController.exportJobMatchedCSV);
router.get('/jobs/:id/applications/export', validateObjectId('id'), adminJobController.exportJobApplicationsCSV);
router.get('/jobs/:id/applicants/export', validateObjectId('id'), adminJobController.exportJobApplicationsCSV);
router.post('/jobs/:id/recompute', validateObjectId('id'), adminJobController.recomputeJobMatches);
router.patch('/applications/:id/status', validateObjectId('id'), adminJobController.updateApplicationStatus);

// ==========================================
// 5. Skill Intelligence
// ==========================================
router.get('/skills/intelligence', adminSkillController.getSkillIntelligence);

// ==========================================
// 6. Placement Alerts & Announcements
// ==========================================
router.get('/alerts', alertController.getAlerts);
router.post('/alerts', alertController.createAlert);
router.put('/alerts/:id', validateObjectId('id'), alertController.updateAlert);
router.delete('/alerts/:id', validateObjectId('id'), alertController.deleteAlert);

module.exports = router;
