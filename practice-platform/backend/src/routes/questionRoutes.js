const express = require('express');
const router = express.Router();

const questionController = require('../controllers/questionController');
const questionVersionController = require('../controllers/questionVersionController');

// Question CRUD
router.post('/questions', questionController.createQuestion);
router.get('/questions', questionController.getQuestions);
router.get('/questions/:questionId', questionController.getQuestionById);

// Question Versioning
router.post('/questions/:questionId/versions', questionVersionController.createNextVersion);
router.get('/questions/:questionId/versions', questionVersionController.getVersionsByQuestionId);
router.get('/question-versions/:versionId', questionVersionController.getVersionById);

module.exports = router;
