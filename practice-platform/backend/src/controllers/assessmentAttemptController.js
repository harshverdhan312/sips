const assessmentAttemptService = require('../services/assessmentAttemptService');
const assessmentService = require('../services/assessmentService');

/**
 * Controller for student Assessment Runtime & Attempts
 */

async function getAvailableAssessments(req, res, next) {
  try {
    const studentId = req.user.id;
    const collegeId = req.user.collegeId;

    const assessments = await assessmentAttemptService.getAvailableAssessmentsForStudent({
      studentId,
      collegeId
    });

    res.json({
      success: true,
      data: assessments
    });
  } catch (err) {
    next(err);
  }
}

async function getAssessmentDetails(req, res, next) {
  try {
    const { assessmentId } = req.params;
    const studentId = req.user.id;
    const collegeId = req.user.collegeId;

    const assessment = await assessmentAttemptService.getStudentAssessmentDetails({
      assessmentId,
      studentId,
      collegeId
    });

    res.json({
      success: true,
      data: assessment
    });
  } catch (err) {
    next(err);
  }
}

async function startAttempt(req, res, next) {
  try {
    const { assessmentId } = req.params;
    const studentId = req.user.id;
    const collegeId = req.user.collegeId;

    const attempt = await assessmentAttemptService.startAssessmentAttempt({
      assessmentId,
      studentId,
      collegeId
    });

    res.status(201).json({
      success: true,
      data: attempt
    });
  } catch (err) {
    next(err);
  }
}

async function getAttempt(req, res, next) {
  try {
    const { assessmentId, attemptId } = req.params;
    const studentId = req.user.id;
    const collegeId = req.user.collegeId;

    const attempt = await assessmentAttemptService.getAssessmentAttempt({
      assessmentId,
      attemptId,
      studentId,
      collegeId
    });

    res.json({
      success: true,
      data: attempt
    });
  } catch (err) {
    next(err);
  }
}

async function getQuestions(req, res, next) {
  try {
    const { assessmentId, attemptId } = req.params;
    const studentId = req.user.id;
    const collegeId = req.user.collegeId;

    const questions = await assessmentAttemptService.getAssessmentQuestions({
      assessmentId,
      attemptId,
      studentId,
      collegeId
    });

    res.json({
      success: true,
      data: questions
    });
  } catch (err) {
    next(err);
  }
}

async function saveResponse(req, res, next) {
  try {
    const { assessmentId, attemptId } = req.params;
    const { questionVersionId, answerData } = req.body;
    const studentId = req.user.id;
    const collegeId = req.user.collegeId;

    const response = await assessmentAttemptService.saveAssessmentResponse({
      assessmentId,
      attemptId,
      questionVersionId,
      answerData,
      studentId,
      collegeId
    });

    res.json({
      success: true,
      data: response
    });
  } catch (err) {
    next(err);
  }
}

async function submitAttempt(req, res, next) {
  try {
    const { assessmentId, attemptId } = req.params;
    const studentId = req.user.id;
    const collegeId = req.user.collegeId;

    const result = await assessmentAttemptService.submitAssessment({
      assessmentId,
      attemptId,
      studentId,
      collegeId
    });

    res.json({
      success: true,
      data: result
    });
  } catch (err) {
    next(err);
  }
}

async function finalizeAttempt(req, res, next) {
  try {
    const { assessmentId, attemptId } = req.params;
    const studentId = req.user.id;
    const collegeId = req.user.collegeId;

    const result = await assessmentAttemptService.submitAssessment({
      assessmentId,
      attemptId,
      studentId,
      collegeId
    });

    res.json({
      success: true,
      data: result
    });
  } catch (err) {
    next(err);
  }
}

async function getResult(req, res, next) {
  try {
    const { assessmentId, attemptId } = req.params;
    const studentId = req.user.id;
    const collegeId = req.user.collegeId;

    const result = await assessmentAttemptService.getAssessmentResult({
      assessmentId,
      attemptId,
      studentId,
      collegeId
    });

    res.json({
      success: true,
      data: result
    });
  } catch (err) {
    next(err);
  }
}

async function getAssessmentByDrive(req, res, next) {
  try {
    const { driveId } = req.params;
    const assessment = await assessmentService.getAssessmentByDriveId(driveId, req.user);

    res.json({
      success: true,
      data: assessment
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAvailableAssessments,
  getAssessmentDetails,
  getAssessmentByDrive,
  startAttempt,
  getAttempt,
  getQuestions,
  saveResponse,
  submitAttempt,
  finalizeAttempt,
  getResult
};
