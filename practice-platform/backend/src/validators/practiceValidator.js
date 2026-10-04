const AppError = require('../utils/appError');

function validateCreatePracticeAttempt(data) {
  const errors = [];

  if (!data.studentId || typeof data.studentId !== 'string' || !data.studentId.trim()) {
    errors.push('studentId is required');
  }

  if (!data.collegeId || typeof data.collegeId !== 'string' || !data.collegeId.trim()) {
    errors.push('collegeId is required');
  }

  if (data.questionCount !== undefined) {
    if (!Number.isInteger(data.questionCount) || data.questionCount <= 0 || data.questionCount > 100) {
      errors.push('questionCount must be an integer between 1 and 100');
    }
  }

  if (errors.length > 0) {
    throw new AppError('PracticeAttempt validation failed', 400, errors);
  }
}

function validateSubmitResponse(data) {
  const errors = [];

  if (!data.questionVersionId || typeof data.questionVersionId !== 'string') {
    errors.push('questionVersionId is required');
  }

  if (data.answerData === undefined || data.answerData === null) {
    errors.push('answerData is required');
  }

  if (errors.length > 0) {
    throw new AppError('Response validation failed', 400, errors);
  }
}

module.exports = {
  validateCreatePracticeAttempt,
  validateSubmitResponse
};
