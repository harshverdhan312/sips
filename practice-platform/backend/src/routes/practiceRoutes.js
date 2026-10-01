const express = require('express');
const router = express.Router();

const practiceController = require('../controllers/practiceController');

// Practice Attempt Workflows
router.post('/practice/attempts', practiceController.createPracticeAttempt);
router.get('/practice/attempts/:attemptId', practiceController.getPracticeAttemptById);
router.get('/practice/attempts/:attemptId/questions', practiceController.getDeliveredQuestions);
router.post('/practice/attempts/:attemptId/responses', practiceController.recordResponse);
router.post('/practice/attempts/:attemptId/submit', practiceController.submitPracticeAttempt);
router.get('/practice/attempts/:attemptId/result', practiceController.getPracticeResult);

module.exports = router;
