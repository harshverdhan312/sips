const AppError = require('../utils/appError');

const VALID_TYPES = ['CODING', 'APTITUDE', 'TECHNICAL'];
const VALID_FORMATS = ['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'TRUE_FALSE', 'NUMERICAL', 'CODING'];
const VALID_DIFFICULTIES = ['EASY', 'MEDIUM', 'HARD'];
const VALID_SOURCE_TYPES = ['COLLEGE_CREATED', 'PUBLIC_SOURCE', 'CURATED'];

function validateCreateQuestion(data) {
  const errors = [];

  if (!data.type || !VALID_TYPES.includes(data.type)) {
    errors.push(`Invalid type. Allowed: ${VALID_TYPES.join(', ')}`);
  }

  if (!data.format || !VALID_FORMATS.includes(data.format)) {
    errors.push(`Invalid format. Allowed: ${VALID_FORMATS.join(', ')}`);
  }

  if (data.type === 'CODING' && data.format !== 'CODING') {
    errors.push('CODING type question must have format=CODING');
  }

  if (data.type !== 'CODING' && data.format === 'CODING') {
    errors.push('Non-coding question cannot have format=CODING');
  }

  if (!data.category || typeof data.category !== 'string' || !data.category.trim()) {
    errors.push('category is required');
  }

  if (!data.difficulty || !VALID_DIFFICULTIES.includes(data.difficulty)) {
    errors.push(`Invalid difficulty. Allowed: ${VALID_DIFFICULTIES.join(', ')}`);
  }

  if (data.sourceType && !VALID_SOURCE_TYPES.includes(data.sourceType)) {
    errors.push(`Invalid sourceType. Allowed: ${VALID_SOURCE_TYPES.join(', ')}`);
  }

  // Provenance validation for PUBLIC_SOURCE
  if (data.sourceType === 'PUBLIC_SOURCE') {
    if (!data.sourceUrl && !data.attribution) {
      errors.push('PUBLIC_SOURCE question must provide sourceUrl or attribution');
    }
  }

  // Initial version fields validation
  if (!data.title || typeof data.title !== 'string' || !data.title.trim()) {
    errors.push('title is required for initial version');
  }

  if (!data.statement || typeof data.statement !== 'string' || !data.statement.trim()) {
    errors.push('statement is required for initial version');
  }

  // Format-specific content validation
  if (['SINGLE_CHOICE', 'MULTIPLE_CHOICE'].includes(data.format)) {
    if (!Array.isArray(data.options) || data.options.length < 2) {
      errors.push('MCQ format requires an options array with at least 2 options');
    }
    if (!data.correctAnswer) {
      errors.push('correctAnswer is required for MCQ questions');
    }
  }

  if (data.format === 'TRUE_FALSE' && data.correctAnswer === undefined) {
    errors.push('correctAnswer is required for TRUE_FALSE questions');
  }

  if (data.format === 'NUMERICAL' && data.correctAnswer === undefined) {
    errors.push('correctAnswer is required for NUMERICAL questions');
  }

  if (errors.length > 0) {
    throw new AppError('Question validation failed', 400, errors);
  }
}

function validateCreateVersion(data, question) {
  const errors = [];

  if (!data.title || typeof data.title !== 'string' || !data.title.trim()) {
    errors.push('title is required');
  }

  if (!data.statement || typeof data.statement !== 'string' || !data.statement.trim()) {
    errors.push('statement is required');
  }

  if (question && ['SINGLE_CHOICE', 'MULTIPLE_CHOICE'].includes(question.format)) {
    if (!Array.isArray(data.options) || data.options.length < 2) {
      errors.push('MCQ format requires an options array with at least 2 options');
    }
    if (!data.correctAnswer) {
      errors.push('correctAnswer is required for MCQ questions');
    }
  }

  if (question && question.format === 'TRUE_FALSE' && data.correctAnswer === undefined) {
    errors.push('correctAnswer is required for TRUE_FALSE questions');
  }

  if (question && question.format === 'NUMERICAL' && data.correctAnswer === undefined) {
    errors.push('correctAnswer is required for NUMERICAL questions');
  }

  if (errors.length > 0) {
    throw new AppError('QuestionVersion validation failed', 400, errors);
  }
}

module.exports = {
  validateCreateQuestion,
  validateCreateVersion
};
