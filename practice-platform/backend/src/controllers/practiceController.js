const practiceService = require('../services/practiceService');
const { success } = require('../utils/response');
const AppError = require('../utils/appError');

/**
 * Practice Controller
 * Handles student self-paced practice workflows, history, progress, and streaks.
 */

exports.createPracticeAttempt = async (req, res, next) => {
  try {
    const studentId = req.user?.id;
    const collegeId = req.user?.collegeId;
    if (!studentId || !collegeId) {
      throw new AppError('Authentication required. Missing student identity.', 401);
    }
    const attempt = await practiceService.createPracticeAttempt({
      ...req.body,
      studentId,
      collegeId
    });
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
    const studentId = req.user?.id;
    const result = await practiceService.getPracticeResult(req.params.attemptId, { studentId });
    return success(res, result, 'Practice result retrieved successfully', 200);
  } catch (err) {
    next(err);
  }
};

exports.getPracticeHistory = async (req, res, next) => {
  try {
    const studentId = req.user?.id;
    if (!studentId) {
      throw new AppError('Authentication required. Missing student identity.', 401);
    }
    const history = await practiceService.getPracticeHistory(studentId, req.query);
    return success(res, history, 'Practice history retrieved successfully', 200);
  } catch (err) {
    next(err);
  }
};

exports.getPracticeProgress = async (req, res, next) => {
  try {
    const studentId = req.user?.id;
    if (!studentId) {
      throw new AppError('Authentication required. Missing student identity.', 401);
    }
    const progress = await practiceService.getPracticeProgress(studentId);
    return success(res, progress, 'Practice progress summary retrieved successfully', 200);
  } catch (err) {
    next(err);
  }
};

exports.getPracticeStreak = async (req, res, next) => {
  try {
    const studentId = req.user?.id;
    if (!studentId) {
      throw new AppError('Authentication required. Missing student identity.', 401);
    }
    const streak = await practiceService.getPracticeStreak(studentId);
    return success(res, streak, 'Practice streak retrieved successfully', 200);
  } catch (err) {
    next(err);
  }
};

exports.getCodingSolveStatus = async (req, res, next) => {
  try {
    const studentId = req.user?.id;
    if (!studentId) {
      return success(res, { solvedQuestionIds: [], attemptedQuestionIds: [], totalSolved: 0, totalAttempted: 0 });
    }
    const status = await practiceService.getCodingSolveStatus(studentId);
    return success(res, status, 'Coding solve status retrieved successfully', 200);
  } catch (err) {
    next(err);
  }
};
