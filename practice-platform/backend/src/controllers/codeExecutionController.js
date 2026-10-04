const codeExecutionService = require('../services/codeExecutionService');
const { success } = require('../utils/response');
const AppError = require('../utils/appError');

/**
 * Code Execution Controller
 * Handles RUN and SUBMIT endpoints and submission status retrieval.
 * Student identity is derived strictly from verified JWT req.user.id.
 */

exports.runCode = async (req, res, next) => {
  try {
    const studentId = req.user?.id;
    const collegeId = req.user?.collegeId;
    if (!studentId) {
      throw new AppError('Authentication required. Missing student identity.', 401);
    }

    const result = await codeExecutionService.executeCode(
      { ...req.body, studentId, collegeId, mode: 'RUN' },
      { isAdmin: Boolean(req.query.admin === 'true') }
    );
    return success(res, result, 'Code executed successfully against public test cases', 200);
  } catch (err) {
    next(err);
  }
};

exports.submitCode = async (req, res, next) => {
  try {
    const studentId = req.user?.id;
    const collegeId = req.user?.collegeId;
    if (!studentId) {
      throw new AppError('Authentication required. Missing student identity.', 401);
    }

    const result = await codeExecutionService.executeCode(
      { ...req.body, studentId, collegeId, mode: 'SUBMIT' },
      { isAdmin: Boolean(req.query.admin === 'true') }
    );
    return success(res, result, 'Code submitted and evaluated successfully against all test cases', 200);
  } catch (err) {
    next(err);
  }
};

exports.getSubmissionById = async (req, res, next) => {
  try {
    const studentId = req.user?.id;
    const collegeId = req.user?.collegeId;
    const result = await codeExecutionService.getSubmissionById(
      req.params.submissionId,
      { isAdmin: Boolean(req.query.admin === 'true'), studentId, collegeId }
    );
    return success(res, result, 'Code submission details retrieved successfully', 200);
  } catch (err) {
    next(err);
  }
};
