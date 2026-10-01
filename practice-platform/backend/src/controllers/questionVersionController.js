const questionVersionService = require('../services/questionVersionService');
const { success } = require('../utils/response');
const { serializeAdminQuestionVersion } = require('../utils/serializers');

/**
 * Question Version Controller
 */

exports.createNextVersion = async (req, res, next) => {
  try {
    const version = await questionVersionService.createNextVersion(req.params.questionId, req.body);
    return success(res, serializeAdminQuestionVersion(version), 'New QuestionVersion created successfully', 201);
  } catch (err) {
    next(err);
  }
};

exports.getVersionsByQuestionId = async (req, res, next) => {
  try {
    const versions = await questionVersionService.getVersionsByQuestionId(req.params.questionId);
    return success(res, versions.map(serializeAdminQuestionVersion), 'Versions retrieved successfully', 200);
  } catch (err) {
    next(err);
  }
};

exports.getVersionById = async (req, res, next) => {
  try {
    const version = await questionVersionService.getVersionById(req.params.versionId);
    return success(res, serializeAdminQuestionVersion(version), 'QuestionVersion retrieved successfully', 200);
  } catch (err) {
    next(err);
  }
};
