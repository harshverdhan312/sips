const AppError = require('../utils/appError');

const VALID_SECTIONS = ['CODING', 'APTITUDE', 'TECHNICAL'];
const VALID_STATUSES = ['DRAFT', 'PUBLISHED', 'LIVE', 'ENDED', 'EVALUATED', 'ARCHIVED', 'CANCELLED'];

function validateCreateContest(data) {
  if (!data || typeof data !== 'object') {
    throw new AppError('Contest payload must be an object', 400);
  }

  const { title, sipsDriveId, collegeId, startAt, endAt, durationMinutes } = data;

  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    throw new AppError('Contest title is required', 400);
  }

  if (!sipsDriveId || typeof sipsDriveId !== 'string' || sipsDriveId.trim().length === 0) {
    throw new AppError('External sipsDriveId is required', 400);
  }

  if (!collegeId || typeof collegeId !== 'string' || collegeId.trim().length === 0) {
    throw new AppError('College ID is required', 400);
  }

  if (!startAt) {
    throw new AppError('Contest start time (startAt) is required', 400);
  }

  const startDate = new Date(startAt);
  if (isNaN(startDate.getTime())) {
    throw new AppError('Invalid startAt datetime format', 400);
  }

  if (!endAt) {
    throw new AppError('Contest end time (endAt) is required', 400);
  }

  const endDate = new Date(endAt);
  if (isNaN(endDate.getTime())) {
    throw new AppError('Invalid endAt datetime format', 400);
  }

  if (endDate.getTime() <= startDate.getTime()) {
    throw new AppError('Contest end time (endAt) must be strictly after start time (startAt)', 400);
  }

  if (durationMinutes === undefined || durationMinutes === null) {
    throw new AppError('Contest durationMinutes is required', 400);
  }

  const duration = Number(durationMinutes);
  if (!Number.isInteger(duration) || duration <= 0) {
    throw new AppError('Contest durationMinutes must be a positive integer', 400);
  }
}

function validateAddContestQuestion(data) {
  if (!data || typeof data !== 'object') {
    throw new AppError('Contest question payload must be an object', 400);
  }

  const { questionVersionId, section, order, marks, negativeMarks } = data;

  if (!questionVersionId || typeof questionVersionId !== 'string' || questionVersionId.trim().length === 0) {
    throw new AppError('questionVersionId is required', 400);
  }

  if (!section || !VALID_SECTIONS.includes(section)) {
    throw new AppError(`Valid section is required (${VALID_SECTIONS.join(', ')})`, 400);
  }

  if (order !== undefined && order !== null) {
    const orderNum = Number(order);
    if (!Number.isInteger(orderNum) || orderNum <= 0) {
      throw new AppError('Question order must be a positive integer', 400);
    }
  }

  if (marks !== undefined && marks !== null) {
    const marksNum = Number(marks);
    if (isNaN(marksNum) || marksNum < 0) {
      throw new AppError('Question marks must be a non-negative number', 400);
    }
  }

  if (negativeMarks !== undefined && negativeMarks !== null) {
    const negMarksNum = Number(negativeMarks);
    if (isNaN(negMarksNum) || negMarksNum < 0) {
      throw new AppError('Question negativeMarks must be a non-negative number', 400);
    }
  }
}

function validateReorderContestQuestions(data) {
  if (!data || typeof data !== 'object') {
    throw new AppError('Reorder payload must be an object', 400);
  }

  const { questionOrders } = data;

  if (!Array.isArray(questionOrders) || questionOrders.length === 0) {
    throw new AppError('questionOrders array is required and must not be empty', 400);
  }

  const seenIds = new Set();
  const seenOrders = new Set();

  for (const item of questionOrders) {
    if (!item || typeof item !== 'object') {
      throw new AppError('Each reorder item must be an object with id and order', 400);
    }

    const { id, order } = item;
    if (!id || typeof id !== 'string') {
      throw new AppError('Each reorder item must have a valid contestQuestionId (id)', 400);
    }

    const orderNum = Number(order);
    if (!Number.isInteger(orderNum) || orderNum <= 0) {
      throw new AppError('Each reorder item must have a positive integer order', 400);
    }

    if (seenIds.has(id)) {
      throw new AppError(`Duplicate contestQuestionId '${id}' in reorder payload`, 400);
    }
    seenIds.add(id);

    if (seenOrders.has(orderNum)) {
      throw new AppError(`Duplicate order value '${orderNum}' in reorder payload`, 400);
    }
    seenOrders.add(orderNum);
  }
}

module.exports = {
  VALID_SECTIONS,
  VALID_STATUSES,
  validateCreateContest,
  validateAddContestQuestion,
  validateReorderContestQuestions
};
