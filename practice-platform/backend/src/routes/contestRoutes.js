const express = require('express');
const router = express.Router();
const contestController = require('../controllers/contestController');
const contestAttemptController = require('../controllers/contestAttemptController');
const contestLeaderboardController = require('../controllers/contestLeaderboardController');
const studentAuth = require('../middleware/studentAuth');

// ==========================================
// STUDENT CONTEST & ATTEMPT ROUTES (Authenticated)
// ==========================================
router.get('/contests/available', studentAuth, contestAttemptController.getAvailableContests);
router.get('/contests/:contestId/student', studentAuth, contestAttemptController.getStudentContest);
router.get('/contests/:contestId/leaderboard', studentAuth, contestLeaderboardController.getLeaderboard);
router.get('/contests/:contestId/leaderboard/me', studentAuth, contestLeaderboardController.getMyRank);
router.post('/contests/:contestId/attempts/start', studentAuth, contestAttemptController.startAttempt);
router.get('/contests/:contestId/attempts/:attemptId', studentAuth, contestAttemptController.getAttempt);
router.get('/contests/:contestId/attempts/:attemptId/questions', studentAuth, contestAttemptController.getAttemptQuestions);
router.post('/contests/:contestId/attempts/:attemptId/responses', studentAuth, contestAttemptController.recordResponse);
router.post('/contests/:contestId/attempts/:attemptId/submit', studentAuth, contestAttemptController.submitAttempt);
router.post('/contests/:contestId/attempts/:attemptId/finalize', studentAuth, contestAttemptController.finalizeAttempt);
router.get('/contests/:contestId/attempts/:attemptId/result', studentAuth, contestAttemptController.getAttemptResult);

// ==========================================
// CONTEST MANAGEMENT & LIFECYCLE (Admin / Internal)
// ==========================================
// Contest CRUD
router.post('/contests', contestController.createContest);
router.get('/contests', contestController.listContests);
router.get('/contests/:contestId', contestController.getContest);

// Question Management (Draft Contests)
router.post('/contests/:contestId/questions', contestController.addQuestion);
router.post('/contests/:contestId/questions/reorder', contestController.reorderQuestions);
router.delete('/contests/:contestId/questions/:contestQuestionId', contestController.removeQuestion);

// Lifecycle Transitions
router.post('/contests/:contestId/publish', contestController.publishContest);
router.post('/contests/:contestId/live', contestController.markLive);
router.post('/contests/:contestId/end', contestController.markEnded);
router.post('/contests/:contestId/evaluate', contestController.markEvaluated);
router.post('/contests/:contestId/archive', contestController.archiveContest);
router.post('/contests/:contestId/cancel', contestController.cancelContest);

module.exports = router;

