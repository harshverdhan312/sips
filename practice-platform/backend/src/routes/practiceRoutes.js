const express = require('express');
const router = express.Router();
const studentAuth = require('../middleware/studentAuth');
const practiceController = require('../controllers/practiceController');

// Practice Attempt Workflows
router.post('/practice/attempts', studentAuth, practiceController.createPracticeAttempt);
router.get('/practice/attempts/:attemptId', studentAuth, practiceController.getPracticeAttemptById);
router.get('/practice/attempts/:attemptId/questions', studentAuth, practiceController.getDeliveredQuestions);
router.post('/practice/attempts/:attemptId/responses', studentAuth, practiceController.recordResponse);
router.post('/practice/attempts/:attemptId/submit', studentAuth, practiceController.submitPracticeAttempt);
router.get('/practice/attempts/:attemptId/result', studentAuth, practiceController.getPracticeResult);

// Practice Progress, History & Streaks
router.get('/practice/history', studentAuth, practiceController.getPracticeHistory);
router.get('/practice/progress', studentAuth, practiceController.getPracticeProgress);
router.get('/practice/streak', studentAuth, practiceController.getPracticeStreak);
router.get('/practice/coding-status', studentAuth, practiceController.getCodingSolveStatus);

module.exports = router;
