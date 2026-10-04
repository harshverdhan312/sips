const express = require('express');
const router = express.Router();

const codingProblemController = require('../controllers/codingProblemController');
const codingTestCaseController = require('../controllers/codingTestCaseController');
const codeExecutionController = require('../controllers/codeExecutionController');
const studentAuth = require('../middleware/studentAuth');

// Coding Problem Management
router.post('/question-versions/:versionId/coding-problem', codingProblemController.createCodingProblem);
router.get('/question-versions/:versionId/coding-problem', codingProblemController.getCodingProblemByVersionId);

// Coding Test Cases Management
router.post('/coding-problems/:codingProblemId/test-cases', codingTestCaseController.createCodingTestCase);
router.get('/coding-problems/:codingProblemId/test-cases', codingTestCaseController.getTestCasesByCodingProblemId);

// Code Execution Sandbox Pipelines (RUN & SUBMIT) - Authenticated Student Identity Required
router.post('/coding/execute/run', studentAuth, codeExecutionController.runCode);
router.post('/coding/execute/submit', studentAuth, codeExecutionController.submitCode);
router.get('/coding/submissions/:submissionId', studentAuth, codeExecutionController.getSubmissionById);

module.exports = router;
