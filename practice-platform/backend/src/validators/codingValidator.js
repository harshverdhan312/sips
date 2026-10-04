const AppError = require('../utils/appError');

function validateCreateCodingProblem(data) {
  const errors = [];

  if (data.timeLimitMs !== undefined) {
    if (typeof data.timeLimitMs !== 'number' || data.timeLimitMs <= 0 || data.timeLimitMs > 15000) {
      errors.push('timeLimitMs must be a positive number up to 15000 ms');
    }
  }

  if (data.memoryLimitKb !== undefined) {
    if (typeof data.memoryLimitKb !== 'number' || data.memoryLimitKb <= 0 || data.memoryLimitKb > 1048576) {
      errors.push('memoryLimitKb must be a positive number up to 1048576 KB (1GB)');
    }
  }

  if (data.maxMarks !== undefined) {
    if (isNaN(Number(data.maxMarks)) || Number(data.maxMarks) <= 0) {
      errors.push('maxMarks must be a positive number');
    }
  }

  if (errors.length > 0) {
    throw new AppError('CodingProblem validation failed', 400, errors);
  }
}

function validateCreateCodingTestCase(data) {
  const errors = [];

  if (data.input === undefined || data.input === null || typeof data.input !== 'string') {
    errors.push('input is required and must be a string');
  }

  if (data.expectedOutput === undefined || data.expectedOutput === null || typeof data.expectedOutput !== 'string') {
    errors.push('expectedOutput is required and must be a string');
  }

  if (data.weight !== undefined) {
    if (isNaN(Number(data.weight)) || Number(data.weight) <= 0) {
      errors.push('weight must be a positive number');
    }
  }

  if (data.order !== undefined) {
    if (!Number.isInteger(data.order) || data.order < 0) {
      errors.push('order must be a non-negative integer');
    }
  }

  if (errors.length > 0) {
    throw new AppError('CodingTestCase validation failed', 400, errors);
  }
}

module.exports = {
  validateCreateCodingProblem,
  validateCreateCodingTestCase
};
