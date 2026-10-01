const codingProblemService = require('../services/codingProblemService');
const { success } = require('../utils/response');

/**
 * Coding Test Case Controller
 */

exports.createCodingTestCase = async (req, res, next) => {
  try {
    const testCase = await codingProblemService.createCodingTestCase(req.params.codingProblemId, req.body);
    return success(res, testCase, 'CodingTestCase created successfully', 201);
  } catch (err) {
    next(err);
  }
};

exports.getTestCasesByCodingProblemId = async (req, res, next) => {
  try {
    const testCases = await codingProblemService.getTestCasesByCodingProblemId(req.params.codingProblemId);
    return success(res, testCases, 'Test cases retrieved successfully', 200);
  } catch (err) {
    next(err);
  }
};
