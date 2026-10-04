const prisma = require('../utils/prisma');
const AppError = require('../utils/appError');
const sipsEligibilityService = require('./sipsEligibilityService');
const {
  serializeStudentContest,
  serializeContestAttempt,
  serializeContestQuestionForStudent,
  serializeContestResponse
} = require('../utils/serializers');

/**
 * Contest Attempt Service
 * Manages student contest discovery, SIPS eligibility checks, attempt creation,
 * server-side attempt timing, effective deadlines, question delivery, and response persistence.
 */

/**
 * Calculate the effective deadline for a contest attempt
 * effectiveDeadline = MIN(contest.endAt, attempt.startedAt + durationMinutes)
 */
function calculateEffectiveDeadline(contest, attempt) {
  const contestEndMs = new Date(contest.endAt).getTime();
  const attemptStartMs = new Date(attempt.startedAt).getTime();
  const durationMs = (contest.durationMinutes || 0) * 60 * 1000;
  const attemptEndMs = attemptStartMs + durationMs;

  const effectiveMs = Math.min(contestEndMs, attemptEndMs);
  return new Date(effectiveMs);
}

/**
 * Discover available PUBLISHED and LIVE contests for authenticated student
 */
async function getAvailableContestsForStudent({ studentId, collegeId, now = new Date() }) {
  if (!studentId || !collegeId) {
    throw new AppError('studentId and collegeId are required', 400);
  }

  const contests = await prisma.contest.findMany({
    where: {
      collegeId,
      status: { in: ['PUBLISHED', 'LIVE'] },
      endAt: { gt: now }
    },
    include: {
      questions: true,
      _count: {
        select: { questions: true, attempts: true }
      }
    },
    orderBy: { startAt: 'asc' }
  });

  return contests.map((c) => serializeStudentContest(c));
}

/**
 * Get student-safe contest details prior to starting
 */
async function getStudentContestDetails({ contestId, studentId, collegeId }) {
  if (!contestId) {
    throw new AppError('Contest ID is required', 400);
  }

  const contest = await prisma.contest.findUnique({
    where: { id: contestId },
    include: {
      questions: true,
      _count: {
        select: { questions: true }
      }
    }
  });

  if (!contest || contest.status === 'DRAFT') {
    throw new AppError('Contest not found', 404, { code: 'CONTEST_NOT_FOUND' });
  }

  if (contest.collegeId !== collegeId) {
    throw new AppError('Contest does not belong to your institution', 403, {
      code: 'TENANT_MISMATCH'
    });
  }

  // Check if student already has an attempt
  const existingAttempt = await prisma.contestAttempt.findUnique({
    where: {
      contestId_studentId: {
        contestId,
        studentId
      }
    }
  });

  const serialized = serializeStudentContest(contest);
  if (existingAttempt) {
    const effectiveDeadline = calculateEffectiveDeadline(contest, existingAttempt);
    const remainingMs = Math.max(0, effectiveDeadline.getTime() - Date.now());
    serialized.myAttempt = serializeContestAttempt(existingAttempt, {
      effectiveDeadline,
      remainingMs
    });
  }

  return serialized;
}

/**
 * Start an official Contest Attempt
 */
async function startContestAttempt({ contestId, studentId, collegeId, now = new Date() }) {
  if (!contestId) {
    throw new AppError('Contest ID is required', 400);
  }

  // 1. Fetch contest and verify existence
  const contest = await prisma.contest.findUnique({
    where: { id: contestId },
    include: {
      questions: {
        orderBy: { order: 'asc' }
      }
    }
  });

  if (!contest) {
    throw new AppError('Contest not found', 404, { code: 'CONTEST_NOT_FOUND' });
  }

  // 2. Tenant validation (College isolation)
  if (contest.collegeId !== collegeId) {
    throw new AppError('Contest does not belong to your institution', 403, {
      code: 'TENANT_MISMATCH'
    });
  }

  // 3. State & Timing validation
  if (contest.status === 'CANCELLED') {
    throw new AppError('This contest has been cancelled and cannot be attempted.', 400, {
      code: 'CONTEST_CANCELLED'
    });
  }

  if (contest.status === 'DRAFT') {
    throw new AppError('Contest is in draft configuration and has not been published.', 400, {
      code: 'CONTEST_NOT_STARTED'
    });
  }

  const nowMs = now.getTime();
  const startMs = new Date(contest.startAt).getTime();
  const endMs = new Date(contest.endAt).getTime();

  if (nowMs < startMs) {
    throw new AppError('Contest has not started yet. Please wait until the start time.', 400, {
      code: 'CONTEST_NOT_STARTED'
    });
  }

  if (nowMs >= endMs || ['ENDED', 'EVALUATED', 'ARCHIVED'].includes(contest.status)) {
    throw new AppError('Contest has already ended.', 400, {
      code: 'CONTEST_ENDED'
    });
  }

  // 4. SIPS Drive Eligibility Check
  if (contest.sipsDriveId) {
    const eligibility = await sipsEligibilityService.checkDriveEligibility({
      studentId,
      collegeId,
      driveId: contest.sipsDriveId
    });

    if (!eligibility.eligible) {
      throw new AppError(
        'You are not eligible to participate in this placement drive contest.',
        403,
        {
          code: 'CONTEST_INELIGIBLE',
          reasons: eligibility.reasons || []
        }
      );
    }
  }

  // 5. One Attempt Rule (Concurrency-safe)
  const existingAttempt = await prisma.contestAttempt.findUnique({
    where: {
      contestId_studentId: {
        contestId,
        studentId
      }
    }
  });

  if (existingAttempt) {
    throw new AppError('An official contest attempt already exists for this student.', 409, {
      code: 'ATTEMPT_ALREADY_EXISTS'
    });
  }

  // Calculate total marks across pinned questions
  const totalMarks = contest.questions.reduce((sum, q) => sum + Number(q.marks || 0), 0);

  try {
    const attempt = await prisma.$transaction(async (tx) => {
      // Create ContestAttempt
      const newAttempt = await tx.contestAttempt.create({
        data: {
          contestId,
          studentId,
          collegeId,
          status: 'IN_PROGRESS',
          startedAt: now,
          totalMarks,
          totalScore: 0.00,
          codingScore: 0.00,
          aptitudeScore: 0.00,
          technicalScore: 0.00
        }
      });

      return newAttempt;
    });

    const effectiveDeadline = calculateEffectiveDeadline(contest, attempt);
    const remainingMs = Math.max(0, effectiveDeadline.getTime() - nowMs);

    return {
      attempt: serializeContestAttempt(attempt, { effectiveDeadline, remainingMs }),
      effectiveDeadline,
      remainingMs,
      questionCount: contest.questions.length
    };
  } catch (err) {
    // Handle Prisma unique constraint race condition
    if (err.code === 'P2002') {
      throw new AppError('An official contest attempt already exists for this student.', 409, {
        code: 'ATTEMPT_ALREADY_EXISTS'
      });
    }
    throw err;
  }
}

/**
 * Get Contest Attempt state and timing (for reconnect/resume)
 */
async function getContestAttempt({ contestId, attemptId, studentId, collegeId, now = new Date() }) {
  if (!attemptId) {
    throw new AppError('Attempt ID is required', 400);
  }

  const attempt = await prisma.contestAttempt.findUnique({
    where: { id: attemptId },
    include: {
      contest: true,
      responses: true
    }
  });

  if (!attempt) {
    throw new AppError('Contest attempt not found', 404, { code: 'ATTEMPT_NOT_FOUND' });
  }

  if (contestId && attempt.contestId !== contestId) {
    throw new AppError('Attempt does not belong to the specified contest', 404, {
      code: 'ATTEMPT_NOT_FOUND'
    });
  }

  if (attempt.collegeId !== collegeId) {
    throw new AppError('Attempt does not belong to your institution', 403, {
      code: 'TENANT_MISMATCH'
    });
  }

  if (attempt.studentId !== studentId) {
    throw new AppError('You do not have access to this contest attempt', 403, {
      code: 'ATTEMPT_ACCESS_DENIED'
    });
  }

  const effectiveDeadline = calculateEffectiveDeadline(attempt.contest, attempt);
  const nowMs = now.getTime();
  const isExpired = nowMs > effectiveDeadline.getTime();

  // Automatic timeout status transition
  if (isExpired && attempt.status === 'IN_PROGRESS') {
    const updated = await prisma.contestAttempt.update({
      where: { id: attemptId },
      data: { status: 'TIMED_OUT' }
    });
    attempt.status = updated.status;
  }

  const remainingMs = Math.max(0, effectiveDeadline.getTime() - nowMs);

  return serializeContestAttempt(attempt, { effectiveDeadline, remainingMs });
}

/**
 * Deliver student-safe contest questions for an active attempt
 */
async function getContestAttemptQuestions({ contestId, attemptId, studentId, collegeId, now = new Date() }) {
  const attempt = await prisma.contestAttempt.findUnique({
    where: { id: attemptId },
    include: {
      contest: {
        include: {
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
          }
        }
      },
      responses: true
    }
  });

  if (!attempt) {
    throw new AppError('Contest attempt not found', 404, { code: 'ATTEMPT_NOT_FOUND' });
  }

  if (contestId && attempt.contestId !== contestId) {
    throw new AppError('Attempt does not belong to the specified contest', 404, {
      code: 'ATTEMPT_NOT_FOUND'
    });
  }

  if (attempt.collegeId !== collegeId) {
    throw new AppError('Attempt does not belong to your institution', 403, {
      code: 'TENANT_MISMATCH'
    });
  }

  if (attempt.studentId !== studentId) {
    throw new AppError('You do not have access to this contest attempt', 403, {
      code: 'ATTEMPT_ACCESS_DENIED'
    });
  }

  if (attempt.contest.status === 'CANCELLED') {
    throw new AppError('Contest has been cancelled.', 400, { code: 'CONTEST_CANCELLED' });
  }

  const effectiveDeadline = calculateEffectiveDeadline(attempt.contest, attempt);
  const nowMs = now.getTime();
  const isExpired = nowMs > effectiveDeadline.getTime();

  if (isExpired && attempt.status === 'IN_PROGRESS') {
    const updated = await prisma.contestAttempt.update({
      where: { id: attemptId },
      data: { status: 'TIMED_OUT' }
    });
    attempt.status = updated.status;
  }

  const remainingMs = Math.max(0, effectiveDeadline.getTime() - nowMs);

  const serializedQuestions = attempt.contest.questions.map((cq) =>
    serializeContestQuestionForStudent(cq)
  );

  const responseMap = {};
  for (const resp of attempt.responses || []) {
    responseMap[resp.questionVersionId] = serializeContestResponse(resp);
  }

  return {
    attemptId: attempt.id,
    contestId: attempt.contestId,
    status: attempt.status,
    effectiveDeadline,
    remainingMs,
    totalQuestions: serializedQuestions.length,
    questions: serializedQuestions,
    savedResponses: responseMap
  };
}

/**
 * Record or update a student response for a question in an active attempt
 */
async function recordContestResponse({
  contestId,
  attemptId,
  studentId,
  collegeId,
  questionVersionId,
  answerData,
  now = new Date()
}) {
  if (!attemptId || !questionVersionId) {
    throw new AppError('attemptId and questionVersionId are required', 400);
  }

  if (answerData === undefined || answerData === null) {
    throw new AppError('answerData is required', 400);
  }

  const attempt = await prisma.contestAttempt.findUnique({
    where: { id: attemptId },
    include: {
      contest: {
        include: {
          questions: {
            select: { id: true, questionVersionId: true, section: true }
          }
        }
      }
    }
  });

  if (!attempt) {
    throw new AppError('Contest attempt not found', 404, { code: 'ATTEMPT_NOT_FOUND' });
  }

  if (contestId && attempt.contestId !== contestId) {
    throw new AppError('Attempt does not belong to the specified contest', 404, {
      code: 'ATTEMPT_NOT_FOUND'
    });
  }

  if (attempt.collegeId !== collegeId) {
    throw new AppError('Attempt does not belong to your institution', 403, {
      code: 'TENANT_MISMATCH'
    });
  }

  if (attempt.studentId !== studentId) {
    throw new AppError('You do not have access to this contest attempt', 403, {
      code: 'ATTEMPT_ACCESS_DENIED'
    });
  }

  if (['CANCELLED', 'DRAFT', 'ENDED', 'EVALUATED', 'ARCHIVED'].includes(attempt.contest.status)) {
    throw new AppError(`Cannot submit response. Contest is ${attempt.contest.status.toLowerCase()}.`, 400, {
      code: 'CONTEST_NOT_ACTIVE'
    });
  }

  // Check deadline
  const effectiveDeadline = calculateEffectiveDeadline(attempt.contest, attempt);
  const nowMs = now.getTime();
  if (nowMs > effectiveDeadline.getTime()) {
    if (attempt.status === 'IN_PROGRESS') {
      await prisma.contestAttempt.update({
        where: { id: attemptId },
        data: { status: 'TIMED_OUT' }
      });
    }
    throw new AppError('Attempt deadline has passed. Response rejected.', 400, {
      code: 'ATTEMPT_TIMED_OUT'
    });
  }

  if (attempt.status !== 'IN_PROGRESS') {
    throw new AppError(`Cannot submit response. Attempt status is '${attempt.status}'.`, 400, {
      code: 'ATTEMPT_NOT_IN_PROGRESS'
    });
  }

  // Verify that questionVersionId belongs to this contest's pinned questions
  const isQuestionInContest = attempt.contest.questions.some(
    (q) => q.questionVersionId === questionVersionId
  );

  if (!isQuestionInContest) {
    throw new AppError(
      'Question does not belong to this contest attempt.',
      404,
      { code: 'QUESTION_NOT_IN_ATTEMPT' }
    );
  }

  // Upsert candidate response (ignoring client-supplied scores, correctness, or marks)
  const existingResponse = await prisma.questionResponse.findFirst({
    where: {
      contestAttemptId: attemptId,
      questionVersionId
    }
  });

  let savedResponse;
  if (existingResponse) {
    savedResponse = await prisma.questionResponse.update({
      where: { id: existingResponse.id },
      data: {
        answerData,
        answeredAt: now
      }
    });
  } else {
    savedResponse = await prisma.questionResponse.create({
      data: {
        contestAttemptId: attemptId,
        questionVersionId,
        answerData,
        answeredAt: now,
        marksAwarded: 0.00
      }
    });
  }

  return serializeContestResponse(savedResponse);
}

module.exports = {
  calculateEffectiveDeadline,
  getAvailableContestsForStudent,
  getStudentContestDetails,
  startContestAttempt,
  getContestAttempt,
  getContestAttemptQuestions,
  recordContestResponse
};
