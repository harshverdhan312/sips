const express = require('express');
const router = express.Router();
const superAdminController = require('../controllers/superAdminController');
const auth = require('../middleware/auth');
const superAdminOnly = require('../middleware/superAdminOnly');

// All Super Admin routes require authentication and SUPERADMIN role
router.use(auth);
router.use(superAdminOnly);

// System Overview Metrics
router.get('/stats', superAdminController.getSystemStats);

// College / Institution Approval Pipeline
router.get('/colleges/pending', superAdminController.getPendingColleges);
router.get('/colleges', superAdminController.getAllColleges);
router.post('/colleges/:id/approve', superAdminController.approveCollege);
router.post('/colleges/:id/reject', superAdminController.rejectCollege);
router.post('/colleges/:id/toggle-status', superAdminController.toggleCollegeStatus);

// Global Question Bank Management
router.get('/questions', superAdminController.getGlobalQuestions);
router.post('/questions', superAdminController.createGlobalQuestion);
router.delete('/questions/:id', superAdminController.deleteGlobalQuestion);
router.post('/questions/:id/archive', superAdminController.archiveGlobalQuestion);
router.post('/questions/:id/activate', superAdminController.activateGlobalQuestion);
router.post('/questions/bulk-delete', superAdminController.bulkDeleteGlobalQuestions);
router.post('/questions/bulk-activate', superAdminController.bulkActivateGlobalQuestions);
router.post('/questions/bulk-archive', superAdminController.bulkArchiveGlobalQuestions);

// Diagnostic SMTP status check
router.get('/email-status', superAdminController.getEmailStatus);

module.exports = router;
