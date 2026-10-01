const codeExecutionService = require('../services/codeExecutionService');
const { success } = require('../utils/response');

/**
 * Code Execution Controller
 * Handles RUN and SUBMIT endpoints and submission status retrieval.
 */

exports.runCode = async (req, res, next) => {
  try {
    const result = await codeExecutionService.executeCode(
      { ...req.body, mode: 'RUN' },
      { isAdmin: Boolean(req.query.admin === 'true') }
    );
    return success(res, result, 'Code executed successfully against public test cases', 200);
  } catch (err) {
    next(err);
  }
};

exports.submitCode = async (req, res, next) => {
  try {
    const result = await codeExecutionService.executeCode(
      { ...req.body, mode: 'SUBMIT' },
      { isAdmin: Boolean(req.query.admin === 'true') }
    );
    return success(res, result, 'Code submitted and evaluated successfully against all test cases', 200);
  } catch (err) {
    next(err);
  }
};

exports.getSubmissionById = async (req, res, next) => {
  try {
    const result = await codeExecutionService.getSubmissionById(
      req.params.submissionId,
      { isAdmin: Boolean(req.query.admin === 'true') }
    );
    return success(res, result, 'Code submission details retrieved successfully', 200);
  } catch (err) {
    next(err);
  }
};
