const express = require('express');
const router = express.Router();

const auth = require('../middleware/auth');
const tenant = require('../middleware/tenant');
const adminOnly = require('../middleware/adminOnly');

const adminAnalyticsController = require('../controllers/adminAnalyticsController');
const adminStudentController = require('../controllers/adminStudentController');
const adminJobController = require('../controllers/adminJobController');
const adminSkillController = require('../controllers/adminSkillController');
const alertController = require('../controllers/alertController');

// Enforce authentication, tenant context, and admin role for all admin routes
router.use(auth, tenant, adminOnly);

// ==========================================
// 1. Overview & Institutional KPIs
// ==========================================
router.get('/overview', adminAnalyticsController.getOverview);

// ==========================================
// 2. Student Management & Bulk Operations
// ==========================================
router.get('/students', adminStudentController.getStudents);
router.post('/students/upload', adminStudentController.uploadStudentsCSV);
router.get('/students/export', adminStudentController.exportStudentsCSV);
router.get('/students/:id', adminStudentController.getStudentById);
router.put('/students/:id', adminStudentController.updateStudent);
router.delete('/students/:id', adminStudentController.deleteStudent);

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
router.get('/jobs/:id', adminJobController.getJobById);
router.put('/jobs/:id', adminJobController.updateJob);
router.delete('/jobs/:id', adminJobController.deleteJob);
router.get('/jobs/:id/matches', adminJobController.getJobMatches);
router.post('/jobs/:id/recompute', adminJobController.recomputeJobMatches);

// ==========================================
// 5. Skill Intelligence
// ==========================================
router.get('/skills/intelligence', adminSkillController.getSkillIntelligence);

// ==========================================
// 6. Placement Alerts & Announcements
// ==========================================
router.get('/alerts', alertController.getAlerts);
router.post('/alerts', alertController.createAlert);
router.put('/alerts/:id', alertController.updateAlert);
router.delete('/alerts/:id', alertController.deleteAlert);

module.exports = router;
