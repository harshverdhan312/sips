const codingProblemService = require('../services/codingProblemService');
const { success } = require('../utils/response');

/**
 * Coding Problem Controller
 */

exports.createCodingProblem = async (req, res, next) => {
  try {
    const codingProblem = await codingProblemService.createCodingProblem(req.params.versionId, req.body);
    return success(res, codingProblem, 'CodingProblem created successfully', 201);
  } catch (err) {
    next(err);
  }
};

exports.getCodingProblemByVersionId = async (req, res, next) => {
  try {
    const codingProblem = await codingProblemService.getCodingProblemByVersionId(req.params.versionId);
    return success(res, codingProblem, 'CodingProblem retrieved successfully', 200);
  } catch (err) {
    next(err);
  }
};
