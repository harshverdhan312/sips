const contestAttemptService = require('../services/contestAttemptService');
const contestScoringService = require('../services/contestScoringService');
const { success } = require('../utils/response');

/**
 * Contest Attempt Controller
 * Handles student-facing contest discovery, attempt initiation, question delivery, answer recording,
 * submission, and scoring.
 */

async function getAvailableContests(req, res, next) {
  try {
    const studentId = req.user.id;
    const collegeId = req.user.collegeId;

    const contests = await contestAttemptService.getAvailableContestsForStudent({
      studentId,
      collegeId
    });

    return success(res, contests, 'Available contests retrieved successfully');
  } catch (err) {
    next(err);
  }
}

async function getStudentContest(req, res, next) {
  try {
    const { contestId } = req.params;
    const studentId = req.user.id;
    const collegeId = req.user.collegeId;

    const contest = await contestAttemptService.getStudentContestDetails({
      contestId,
      studentId,
      collegeId
    });

    return success(res, contest, 'Contest details retrieved successfully');
  } catch (err) {
    next(err);
  }
}

async function startAttempt(req, res, next) {
  try {
    const { contestId } = req.params;
    const studentId = req.user.id;
    const collegeId = req.user.collegeId;

    const result = await contestAttemptService.startContestAttempt({
      contestId,
      studentId,
      collegeId
    });

    return success(res, result, 'Contest attempt started successfully', 201);
  } catch (err) {
    next(err);
  }
}

async function getAttempt(req, res, next) {
  try {
    const { contestId, attemptId } = req.params;
    const studentId = req.user.id;
    const collegeId = req.user.collegeId;

    const result = await contestAttemptService.getContestAttempt({
      contestId,
      attemptId,
      studentId,
      collegeId
    });

    return success(res, result, 'Contest attempt retrieved successfully');
  } catch (err) {
    next(err);
  }
}

async function getAttemptQuestions(req, res, next) {
  try {
    const { contestId, attemptId } = req.params;
    const studentId = req.user.id;
    const collegeId = req.user.collegeId;

    const result = await contestAttemptService.getContestAttemptQuestions({
      contestId,
      attemptId,
      studentId,
      collegeId
    });

    return success(res, result, 'Contest attempt questions retrieved successfully');
  } catch (err) {
    next(err);
  }
}

async function recordResponse(req, res, next) {
  try {
    const { contestId, attemptId } = req.params;
    const { questionVersionId, answerData } = req.body;
    const studentId = req.user.id;
    const collegeId = req.user.collegeId;

    const result = await contestAttemptService.recordContestResponse({
      contestId,
      attemptId,
      studentId,
      collegeId,
      questionVersionId,
      answerData
    });

    return success(res, result, 'Response recorded successfully');
  } catch (err) {
    next(err);
  }
}

async function submitAttempt(req, res, next) {
  try {
    const { contestId, attemptId } = req.params;
    const studentId = req.user.id;
    const collegeId = req.user.collegeId;

    const result = await contestScoringService.submitAndEvaluateContestAttempt({
      contestId,
      attemptId,
      studentId,
      collegeId
    });

    return success(res, result, 'Contest attempt evaluated and submitted successfully');
  } catch (err) {
    next(err);
  }
}

async function finalizeAttempt(req, res, next) {
  try {
    const { contestId, attemptId } = req.params;
    const studentId = req.user.id;
    const collegeId = req.user.collegeId;

    const result = await contestScoringService.submitAndEvaluateContestAttempt({
      contestId,
      attemptId,
      studentId,
      collegeId
    });

    return success(res, result, 'Contest attempt finalized successfully');
  } catch (err) {
    next(err);
  }
}

async function getAttemptResult(req, res, next) {
  try {
    const { contestId, attemptId } = req.params;
    const studentId = req.user.id;
    const collegeId = req.user.collegeId;

    const result = await contestScoringService.getStudentContestResult({
      contestId,
      attemptId,
      studentId,
      collegeId
    });

    return success(res, result, 'Contest attempt result retrieved successfully');
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAvailableContests,
  getStudentContest,
  startAttempt,
  getAttempt,
  getAttemptQuestions,
  recordResponse,
  submitAttempt,
  finalizeAttempt,
  getAttemptResult
};

