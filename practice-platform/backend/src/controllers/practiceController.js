const practiceService = require('../services/practiceService');
const { success } = require('../utils/response');

/**
 * Practice Controller
 * Handles student self-paced practice workflows.
 */

exports.createPracticeAttempt = async (req, res, next) => {
  try {
    const attempt = await practiceService.createPracticeAttempt(req.body);
    return success(res, attempt, 'Practice attempt started successfully', 201);
  } catch (err) {
    next(err);
  }
};

exports.getPracticeAttemptById = async (req, res, next) => {
  try {
    const attempt = await practiceService.getPracticeAttemptById(req.params.attemptId);
    return success(res, attempt, 'Practice attempt details retrieved', 200);
  } catch (err) {
    next(err);
  }
};

exports.getDeliveredQuestions = async (req, res, next) => {
  try {
    const delivered = await practiceService.getDeliveredQuestions(req.params.attemptId);
    return success(res, delivered, 'Practice questions delivered successfully', 200);
  } catch (err) {
    next(err);
  }
};

exports.recordResponse = async (req, res, next) => {
  try {
    const result = await practiceService.recordResponse(req.params.attemptId, req.body);
    return success(res, result, 'Response recorded successfully', 200);
  } catch (err) {
    next(err);
  }
};

exports.submitPracticeAttempt = async (req, res, next) => {
  try {
    const result = await practiceService.submitPracticeAttempt(req.params.attemptId);
    return success(res, result, 'Practice attempt submitted and evaluated successfully', 200);
  } catch (err) {
    next(err);
  }
};

exports.getPracticeResult = async (req, res, next) => {
  try {
    const result = await practiceService.getPracticeResult(req.params.attemptId);
    return success(res, result, 'Practice result retrieved successfully', 200);
  } catch (err) {
    next(err);
  }
};
