const prisma = require('../utils/prisma');
const AppError = require('../utils/appError');
const {
  validateCreateContest,
  validateAddContestQuestion,
  validateReorderContestQuestions
} = require('../validators/contestValidator');

/**
 * Contest Service
 * Handles contest creation, question configuration, publication, and lifecycle state transitions.
 */

// Lifecycle transition maps
const VALID_TRANSITIONS = {
  DRAFT: ['PUBLISHED', 'CANCELLED'],
  PUBLISHED: ['LIVE', 'CANCELLED'],
  LIVE: ['ENDED', 'CANCELLED'],
  ENDED: ['EVALUATED'],
  EVALUATED: ['ARCHIVED'],
  ARCHIVED: [],
  CANCELLED: []
};

/**
 * Determine the temporal lifecycle state of a contest based on startAt/endAt and current time
 * Pure function: does NOT overwrite terminal states (EVALUATED, ARCHIVED, CANCELLED) or DRAFT.
 */
function determineTemporalStatus(contest, now = new Date()) {
  if (!contest) return null;

  const currentStatus = contest.status;

  // Terminal and pre-published states are never overridden by temporal calculation
  if (['DRAFT', 'EVALUATED', 'ARCHIVED', 'CANCELLED'].includes(currentStatus)) {
    return currentStatus;
  }

  const currentTime = now instanceof Date ? now.getTime() : new Date(now).getTime();
  const startTime = new Date(contest.startAt).getTime();
  const endTime = new Date(contest.endAt).getTime();

  if (currentTime < startTime) {
    return 'PUBLISHED';
  } else if (currentTime >= startTime && currentTime < endTime) {
    return 'LIVE';
  } else {
    return 'ENDED';
  }
}

/**
 * Create a new contest in DRAFT state
 */
async function createContest(data) {
  validateCreateContest(data);

  const {
    title,
    sipsDriveId,
    collegeId,
    description,
    instructions,
    startAt,
    endAt,
    durationMinutes,
    createdBy
  } = data;

  const contest = await prisma.contest.create({
    data: {
      title: title.trim(),
      sipsDriveId: sipsDriveId.trim(),
      collegeId: collegeId.trim(),
      description: description ? description.trim() : null,
      instructions: instructions ? instructions.trim() : null,
      startAt: new Date(startAt),
      endAt: new Date(endAt),
      durationMinutes: Number(durationMinutes),
      status: 'DRAFT', // Always starts as DRAFT
      createdBy: createdBy ? createdBy.trim() : null
    },
    include: {
      questions: {
        include: {
          questionVersion: {
            include: {
              question: true
            }
          }
        },
        orderBy: { order: 'asc' }
      }
    }
  });

  return contest;
}

/**
 * Get contest by ID with questions and version details
 */
async function getContestById(contestId, { includeQuestions = true } = {}) {
  if (!contestId) {
    throw new AppError('Contest ID is required', 400);
  }

  const contest = await prisma.contest.findUnique({
    where: { id: contestId },
    include: includeQuestions
      ? {
          questions: {
            include: {
              questionVersion: {
                include: {
                  question: true,
                  codingProblem: {
                    include: {
                      testCases: true
                    }
                  }
                }
              }
            },
            orderBy: [{ section: 'asc' }, { order: 'asc' }]
          },
          _count: {
            select: {
              questions: true,
              attempts: true
            }
          }
        }
      : {
          _count: {
            select: {
              questions: true,
              attempts: true
            }
          }
        }
  });

  if (!contest) {
    throw new AppError('Contest not found', 404, { code: 'CONTEST_NOT_FOUND' });
  }

  return contest;
}

/**
 * List contests with optional filters
 */
async function listContests({ collegeId, sipsDriveId, status, limit = 50, offset = 0 } = {}) {
  const where = {};

  if (collegeId) where.collegeId = collegeId;
  if (sipsDriveId) where.sipsDriveId = sipsDriveId;
  if (status) where.status = status;

  const [contests, total] = await Promise.all([
    prisma.contest.findMany({
      where,
      include: {
        _count: {
          select: {
            questions: true,
            attempts: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: Math.min(Number(limit) || 50, 100),
      skip: Number(offset) || 0
    }),
    prisma.contest.count({ where })
  ]);

  return { contests, total };
}

/**
 * Add a QuestionVersion to a DRAFT contest
 */
async function addContestQuestion(contestId, data) {
  validateAddContestQuestion(data);

  const { questionVersionId, section, order, marks = 1.0, negativeMarks = 0.0 } = data;

  // 1. Fetch contest and verify it is DRAFT
  const contest = await prisma.contest.findUnique({
    where: { id: contestId },
    include: {
      questions: {
        select: { id: true, questionVersionId: true, order: true }
      }
    }
  });

  if (!contest) {
    throw new AppError('Contest not found', 404, { code: 'CONTEST_NOT_FOUND' });
  }

  if (contest.status !== 'DRAFT') {
    throw new AppError(
      `Cannot modify questions. Contest is in '${contest.status}' state and configuration is locked.`,
      400,
      { code: 'CONTEST_CONFIGURATION_LOCKED' }
    );
  }

  // 2. Fetch QuestionVersion and underlying PracticeQuestion
  const questionVersion = await prisma.questionVersion.findUnique({
    where: { id: questionVersionId },
    include: {
      question: true
    }
  });

  if (!questionVersion) {
    throw new AppError('QuestionVersion not found', 404, { code: 'QUESTION_VERSION_NOT_FOUND' });
  }

  // 3. Section and Question Type cross-validation
  if (section === 'CODING' && questionVersion.question.type !== 'CODING') {
    throw new AppError(
      `Section 'CODING' requires a CODING question. Provided question type is '${questionVersion.question.type}'.`,
      400,
      { code: 'QUESTION_TYPE_SECTION_MISMATCH' }
    );
  }

  if (section === 'APTITUDE' && questionVersion.question.type !== 'APTITUDE') {
    throw new AppError(
      `Section 'APTITUDE' requires an APTITUDE question. Provided question type is '${questionVersion.question.type}'.`,
      400,
      { code: 'QUESTION_TYPE_SECTION_MISMATCH' }
    );
  }

  if (section === 'TECHNICAL' && questionVersion.question.type !== 'TECHNICAL') {
    throw new AppError(
      `Section 'TECHNICAL' requires a TECHNICAL question. Provided question type is '${questionVersion.question.type}'.`,
      400,
      { code: 'QUESTION_TYPE_SECTION_MISMATCH' }
    );
  }

  // 4. Check for duplicate questionVersion in this contest
  const isDuplicate = contest.questions.some((q) => q.questionVersionId === questionVersionId);
  if (isDuplicate) {
    throw new AppError(
      'QuestionVersion is already added to this contest',
      409,
      { code: 'DUPLICATE_CONTEST_QUESTION' }
    );
  }

  // 5. Determine order if not specified
  let assignedOrder = order !== undefined && order !== null ? Number(order) : null;
  if (!assignedOrder) {
    const maxOrder = contest.questions.reduce((max, q) => Math.max(max, q.order || 0), 0);
    assignedOrder = maxOrder + 1;
  }

  // 6. Create ContestQuestion record
  const contestQuestion = await prisma.contestQuestion.create({
    data: {
      contestId,
      questionVersionId,
      section,
      order: assignedOrder,
      marks: Number(marks),
      negativeMarks: Number(negativeMarks)
    },
    include: {
      questionVersion: {
        include: {
          question: true,
          codingProblem: {
            include: {
              testCases: true
            }
          }
        }
      }
    }
  });

  return contestQuestion;
}

/**
 * Reorder questions in a DRAFT contest
 */
async function reorderContestQuestions(contestId, data) {
  validateReorderContestQuestions(data);

  const { questionOrders } = data;

  const contest = await prisma.contest.findUnique({
    where: { id: contestId },
    include: { questions: true }
  });

  if (!contest) {
    throw new AppError('Contest not found', 404, { code: 'CONTEST_NOT_FOUND' });
  }

  if (contest.status !== 'DRAFT') {
    throw new AppError(
      `Cannot reorder questions. Contest is in '${contest.status}' state and configuration is locked.`,
      400,
      { code: 'CONTEST_CONFIGURATION_LOCKED' }
    );
  }

  const existingIds = new Set(contest.questions.map((q) => q.id));
  for (const item of questionOrders) {
    if (!existingIds.has(item.id)) {
      throw new AppError(
        `ContestQuestion ID '${item.id}' does not belong to contest '${contestId}'`,
        400,
        { code: 'INVALID_CONTEST_QUESTION_ID' }
      );
    }
  }

  // Execute reorder transactionally
  await prisma.$transaction(
    questionOrders.map((item) =>
      prisma.contestQuestion.update({
        where: { id: item.id },
        data: { order: Number(item.order) }
      })
    )
  );

  return getContestById(contestId);
}

/**
 * Remove a question from a DRAFT contest
 */
async function removeContestQuestion(contestId, contestQuestionId) {
  if (!contestId || !contestQuestionId) {
    throw new AppError('contestId and contestQuestionId are required', 400);
  }

  const contest = await prisma.contest.findUnique({
    where: { id: contestId },
    include: { questions: true }
  });

  if (!contest) {
    throw new AppError('Contest not found', 404, { code: 'CONTEST_NOT_FOUND' });
  }

  if (contest.status !== 'DRAFT') {
    throw new AppError(
      `Cannot remove questions. Contest is in '${contest.status}' state and configuration is locked.`,
      400,
      { code: 'CONTEST_CONFIGURATION_LOCKED' }
    );
  }

  const targetQuestion = contest.questions.find((q) => q.id === contestQuestionId);
  if (!targetQuestion) {
    throw new AppError('ContestQuestion not found in this contest', 404, { code: 'QUESTION_NOT_FOUND' });
  }

  await prisma.contestQuestion.delete({
    where: { id: contestQuestionId }
  });

  return { success: true, message: 'Question removed from contest successfully' };
}

/**
 * Publish a DRAFT contest (Configuration lock)
 */
async function publishContest(contestId) {
  if (!contestId) {
    throw new AppError('Contest ID is required', 400);
  }

  const contest = await prisma.contest.findUnique({
    where: { id: contestId },
    include: {
      questions: {
        include: {
          questionVersion: {
            include: {
              question: true
            }
          }
        }
      }
    }
  });

  if (!contest) {
    throw new AppError('Contest not found', 404, { code: 'CONTEST_NOT_FOUND' });
  }

  if (contest.status !== 'DRAFT') {
    throw new AppError(
      `Cannot publish contest. Current status is '${contest.status}', expected 'DRAFT'.`,
      400,
      { code: 'INVALID_CONTEST_STATE' }
    );
  }

  if (!contest.questions || contest.questions.length === 0) {
    throw new AppError('Cannot publish an empty contest. Add at least one question.', 400, {
      code: 'CONTEST_EMPTY'
    });
  }

  // Validate timing
  const startMs = new Date(contest.startAt).getTime();
  const endMs = new Date(contest.endAt).getTime();
  if (endMs <= startMs) {
    throw new AppError('Contest endAt must be strictly after startAt', 400, {
      code: 'INVALID_CONTEST_TIMING'
    });
  }

  if (!contest.durationMinutes || contest.durationMinutes <= 0) {
    throw new AppError('Contest durationMinutes must be a positive integer', 400, {
      code: 'INVALID_CONTEST_DURATION'
    });
  }

  // Validate every question
  for (const q of contest.questions) {
    if (!q.questionVersion || !q.questionVersion.question) {
      throw new AppError(`Contest question '${q.id}' references an invalid QuestionVersion.`, 400, {
        code: 'INVALID_QUESTION_VERSION'
      });
    }

    if (q.section === 'CODING' && q.questionVersion.question.type !== 'CODING') {
      throw new AppError(`Contest question '${q.id}' has section/type mismatch.`, 400, {
        code: 'QUESTION_TYPE_SECTION_MISMATCH'
      });
    }
    if (q.section === 'APTITUDE' && q.questionVersion.question.type !== 'APTITUDE') {
      throw new AppError(`Contest question '${q.id}' has section/type mismatch.`, 400, {
        code: 'QUESTION_TYPE_SECTION_MISMATCH'
      });
    }
    if (q.section === 'TECHNICAL' && q.questionVersion.question.type !== 'TECHNICAL') {
      throw new AppError(`Contest question '${q.id}' has section/type mismatch.`, 400, {
        code: 'QUESTION_TYPE_SECTION_MISMATCH'
      });
    }

    if (Number(q.marks) < 0 || Number(q.negativeMarks) < 0) {
      throw new AppError(`Contest question '${q.id}' has invalid negative or zero marks.`, 400, {
        code: 'INVALID_MARKS'
      });
    }
  }

  // Transactionally publish
  const published = await prisma.contest.update({
    where: { id: contestId },
    data: { status: 'PUBLISHED' },
    include: {
      questions: {
        include: {
          questionVersion: {
            include: { question: true }
          }
        },
        orderBy: { order: 'asc' }
      }
    }
  });

  return published;
}

/**
 * Lifecycle State Transition Helper
 */
async function transitionContestState(contestId, targetStatus) {
  if (!contestId || !targetStatus) {
    throw new AppError('Contest ID and target status are required', 400);
  }

  const contest = await prisma.contest.findUnique({
    where: { id: contestId }
  });

  if (!contest) {
    throw new AppError('Contest not found', 404, { code: 'CONTEST_NOT_FOUND' });
  }

  const currentStatus = contest.status;
  const allowedTransitions = VALID_TRANSITIONS[currentStatus] || [];

  if (!allowedTransitions.includes(targetStatus)) {
    throw new AppError(
      `Invalid state transition: Cannot move contest from '${currentStatus}' to '${targetStatus}'. Allowed: [${allowedTransitions.join(', ')}]`,
      400,
      { code: 'INVALID_CONTEST_STATE_TRANSITION' }
    );
  }

  const updated = await prisma.contest.update({
    where: { id: contestId },
    data: { status: targetStatus }
  });

  return updated;
}

/**
 * Explicit Lifecycle Transition Methods
 */
async function markContestLive(contestId) {
  return transitionContestState(contestId, 'LIVE');
}

async function markContestEnded(contestId) {
  return transitionContestState(contestId, 'ENDED');
}

async function markContestEvaluated(contestId) {
  return transitionContestState(contestId, 'EVALUATED');
}

async function archiveContest(contestId) {
  return transitionContestState(contestId, 'ARCHIVED');
}

/**
 * Cancel a contest (allowed from DRAFT, PUBLISHED, or LIVE)
 */
async function cancelContest(contestId) {
  return transitionContestState(contestId, 'CANCELLED');
}

/**
 * Synchronize contest temporal state based on current time
 * Safely updates PUBLISHED -> LIVE -> ENDED without touching terminal states
 */
async function syncContestTemporalState(contestId, now = new Date()) {
  const contest = await prisma.contest.findUnique({
    where: { id: contestId }
  });

  if (!contest) {
    throw new AppError('Contest not found', 404, { code: 'CONTEST_NOT_FOUND' });
  }

  const expectedStatus = determineTemporalStatus(contest, now);
  if (expectedStatus && expectedStatus !== contest.status) {
    const allowed = (VALID_TRANSITIONS[contest.status] || []).includes(expectedStatus);
    if (allowed) {
      return prisma.contest.update({
        where: { id: contestId },
        data: { status: expectedStatus }
      });
    }
  }

  return contest;
}

module.exports = {
  VALID_TRANSITIONS,
  determineTemporalStatus,
  createContest,
  getContestById,
  listContests,
  addContestQuestion,
  reorderContestQuestions,
  removeContestQuestion,
  publishContest,
  markContestLive,
  markContestEnded,
  markContestEvaluated,
  archiveContest,
  cancelContest,
  syncContestTemporalState
};
