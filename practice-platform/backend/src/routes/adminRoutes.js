const express = require('express');
const router = express.Router();
const adminAuth = require('../middleware/adminAuth');
const adminQuestionController = require('../controllers/adminQuestionController');
const adminAssessmentController = require('../controllers/adminAssessmentController');

// All admin routes are protected by adminAuth
router.use(adminAuth);

// Bulk Import
router.post('/questions/bulk-import', adminQuestionController.bulkImport);

// Question Management
router.get('/questions', adminQuestionController.getQuestions);
router.get('/questions/:questionId', adminQuestionController.getQuestionById);
router.get('/questions/:questionId/versions/:versionId', adminQuestionController.getQuestionVersion);
router.post('/questions/:questionId/activate', adminQuestionController.activateQuestion);
router.post('/questions/:questionId/archive', adminQuestionController.archiveQuestion);

// Reusable Assessments & Question Set Assembly
router.post('/assessments', adminAssessmentController.createAssessment);
router.get('/assessments', adminAssessmentController.getAssessments);
router.get('/assessments/:assessmentId', adminAssessmentController.getAssessmentById);
router.post('/assessments/:assessmentId/questions', adminAssessmentController.addQuestion);
router.delete('/assessments/:assessmentId/questions/:assessmentQuestionId', adminAssessmentController.removeQuestion);
router.post('/assessments/:assessmentId/questions/reorder', adminAssessmentController.reorderQuestions);
router.post('/assessments/:assessmentId/publish', adminAssessmentController.publishAssessment);
router.post('/assessments/:assessmentId/archive', adminAssessmentController.archiveAssessment);
router.post('/assessments/:assessmentId/associate-drive', adminAssessmentController.associateDrive);
router.delete('/assessments/:assessmentId/associate-drive', adminAssessmentController.disassociateDrive);
router.post('/assessments/:assessmentId/disassociate-drive', adminAssessmentController.disassociateDrive);

// Assessment Candidate Results & Submissions
router.get('/assessments/:assessmentId/results', adminAssessmentController.getAssessmentResults);
router.get('/assessments/:assessmentId/results/:attemptId', adminAssessmentController.getCandidateDetail);

module.exports = router;


