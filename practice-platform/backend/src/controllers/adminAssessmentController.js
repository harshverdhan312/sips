const assessmentService = require('../services/assessmentService');
const { success } = require('../utils/response');

/**
 * POST /api/admin/assessments
 * Create a new draft assessment
 */
async function createAssessment(req, res, next) {
  try {
    const assessment = await assessmentService.createAssessment(req.body, req.user);
    return success(res, assessment, 'Assessment created successfully', 201);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/admin/assessments
 * List assessments with pagination & filters
 */
async function getAssessments(req, res, next) {
  try {
    const result = await assessmentService.getAssessments(req.query, req.user);
    return res.status(200).json({
      success: true,
      message: 'Assessments retrieved successfully',
      data: result.items,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/admin/assessments/:assessmentId
 * Full assessment details with questions and section breakdown
 */
async function getAssessmentById(req, res, next) {
  try {
    const { assessmentId } = req.params;
    const assessment = await assessmentService.getAssessmentById(assessmentId, req.user);
    return success(res, assessment, 'Assessment retrieved successfully', 200);
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/admin/assessments/:assessmentId/questions
 * Pin a QuestionVersion to an assessment
 */
async function addQuestion(req, res, next) {
  try {
    const { assessmentId } = req.params;
    const result = await assessmentService.addQuestionToAssessment(assessmentId, req.body, req.user);
    return success(res, result, 'Question added to assessment successfully', 201);
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/admin/assessments/:assessmentId/questions/:assessmentQuestionId
 * Remove a pinned question from an assessment
 */
async function removeQuestion(req, res, next) {
  try {
    const { assessmentId, assessmentQuestionId } = req.params;
    const result = await assessmentService.removeQuestionFromAssessment(assessmentId, assessmentQuestionId, req.user);
    return success(res, result, 'Question removed from assessment successfully', 200);
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/admin/assessments/:assessmentId/questions/reorder
 * Reorder questions within an assessment
 */
async function reorderQuestions(req, res, next) {
  try {
    const { assessmentId } = req.params;
    const result = await assessmentService.reorderAssessmentQuestions(assessmentId, req.body.questionOrders, req.user);
    return success(res, result, 'Questions reordered successfully', 200);
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/admin/assessments/:assessmentId/publish
 * Validate and publish an assessment (DRAFT -> PUBLISHED)
 */
async function publishAssessment(req, res, next) {
  try {
    const { assessmentId } = req.params;
    const result = await assessmentService.publishAssessment(assessmentId, req.user);
    return success(res, result.assessment, result.message, 200);
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/admin/assessments/:assessmentId/archive
 * Archive an assessment
 */
async function archiveAssessment(req, res, next) {
  try {
    const { assessmentId } = req.params;
    const result = await assessmentService.archiveAssessment(assessmentId, req.user);
    return success(res, result.assessment, result.message, 200);
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/admin/assessments/:assessmentId/associate-drive
 * Associate a SIPS placement drive with an assessment
 */
async function associateDrive(req, res, next) {
  try {
    const { assessmentId } = req.params;
    const result = await assessmentService.associateDriveToAssessment(assessmentId, req.body, req.user);
    return success(res, result.assessment, result.message, 200);
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE or POST /api/admin/assessments/:assessmentId/associate-drive
 * Disassociate placement drive from an assessment
 */
async function disassociateDrive(req, res, next) {
  try {
    const { assessmentId } = req.params;
    const result = await assessmentService.disassociateDriveFromAssessment(assessmentId, req.user);
    return success(res, result.assessment, result.message, 200);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/admin/assessments/:assessmentId/results
 * Aggregated candidate results and leaderboard
 */
async function getAssessmentResults(req, res, next) {
  try {
    const { assessmentId } = req.params;
    const result = await assessmentService.getAssessmentResults(assessmentId, req.query, req.user);
    return res.status(200).json({
      success: true,
      message: 'Assessment results retrieved successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/admin/assessments/:assessmentId/results/:attemptId
 * Detailed candidate attempt scorecard & answers
 */
async function getCandidateDetail(req, res, next) {
  try {
    const { assessmentId, attemptId } = req.params;
    const result = await assessmentService.getAssessmentCandidateDetail(assessmentId, attemptId, req.user);
    return res.status(200).json({
      success: true,
      message: 'Candidate attempt details retrieved successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createAssessment,
  getAssessments,
  getAssessmentById,
  associateDrive,
  disassociateDrive,
  addQuestion,
  removeQuestion,
  reorderQuestions,
  publishAssessment,
  archiveAssessment,
  getAssessmentResults,
  getCandidateDetail
};
