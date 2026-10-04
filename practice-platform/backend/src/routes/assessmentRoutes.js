const express = require('express');
const router = express.Router();
const assessmentAttemptController = require('../controllers/assessmentAttemptController');
const studentAuth = require('../middleware/studentAuth');

// ==========================================
// STUDENT ASSESSMENT & ATTEMPT ROUTES (Authenticated)
// ==========================================
router.get('/assessments/available', studentAuth, assessmentAttemptController.getAvailableAssessments);
router.get('/assessments/by-drive/:driveId', studentAuth, assessmentAttemptController.getAssessmentByDrive);
router.get('/assessments/:assessmentId/student', studentAuth, assessmentAttemptController.getAssessmentDetails);
router.get('/assessments/:assessmentId', studentAuth, assessmentAttemptController.getAssessmentDetails);
router.post('/assessments/:assessmentId/attempts/start', studentAuth, assessmentAttemptController.startAttempt);
router.get('/assessments/:assessmentId/attempts/:attemptId', studentAuth, assessmentAttemptController.getAttempt);
router.get('/assessments/:assessmentId/attempts/:attemptId/questions', studentAuth, assessmentAttemptController.getQuestions);
router.post('/assessments/:assessmentId/attempts/:attemptId/responses', studentAuth, assessmentAttemptController.saveResponse);
router.post('/assessments/:assessmentId/attempts/:attemptId/submit', studentAuth, assessmentAttemptController.submitAttempt);
router.post('/assessments/:assessmentId/attempts/:attemptId/finalize', studentAuth, assessmentAttemptController.finalizeAttempt);
router.get('/assessments/:assessmentId/attempts/:attemptId/result', studentAuth, assessmentAttemptController.getResult);

module.exports = router;
