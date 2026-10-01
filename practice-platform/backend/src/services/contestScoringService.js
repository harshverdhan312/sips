const prisma = require('../utils/prisma');
const AppError = require('../utils/appError');
const { evaluateResponse } = require('../utils/evaluator');
const { calculateEffectiveDeadline } = require('./contestAttemptService');

/**
 * Contest Scoring Service
 * Authoritative server-side evaluation for MCQ questions (Aptitude & Technical),
 * negative marking, weighted coding problem aggregation, section floor clamping,
 * and transactional contest attempt finalization.
 */

/**
 * Evaluate a single MCQ question response against its server-side correctAnswer
 * @param {object} params
 * @param {object} params.contestQuestion
 * @param {object|null} params.candidateResponse
 * @returns {{ isAnswered: boolean, isCorrect: boolean, marksAwarded: number }}
 */
function evaluateMCQQuestion({ contestQuestion, candidateResponse }) {
  const qMarks = Number(contestQuestion.marks || 0);
  const negativeMarks = Number(contestQuestion.negativeMarks || 0);
  const format = contestQuestion.questionVersion.question.format;
  const correctAnswer = contestQuestion.questionVersion.correctAnswer;

  if (!candidateResponse || candidateResponse.answerData === undefined || candidateResponse.answerData === null) {
    return {
      isAnswered: false,
      isCorrect: false,
      marksAwarded: 0.00
    };
  }

  const isCorrect = evaluateResponse(format, correctAnswer, candidateResponse.answerData);
  const marksAwarded = isCorrect ? qMarks : -negativeMarks;

  return {
    isAnswered: true,
    isCorrect,
    marksAwarded
  };
}

/**
 * Finalize and evaluate a ContestAttempt
 * Evaluates Aptitude MCQs, Technical MCQs, and latest CodeSubmissions transactionally.
 * @param {object} params
 * @param {string} params.contestId
 * @param {string} params.attemptId
 * @param {string} params.studentId
 * @param {string} params.collegeId
 * @param {Date} [params.now]
 * @returns {Promise<object>} Finalized ContestAttempt result
 */
async function submitAndEvaluateContestAttempt({
  contestId,
  attemptId,
  studentId,
  collegeId,
  now = new Date()
}) {
  if (!attemptId) {
    throw new AppError('Attempt ID is required', 400);
  }

  // 1. Fetch attempt with full relations
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
      responses: true,
      submissions: {
        where: { mode: 'SUBMIT' },
        include: {
          testResults: {
            include: { testCase: true }
          }
        },
        orderBy: { submittedAt: 'desc' }
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

  if (attempt.contest.status === 'CANCELLED') {
    throw new AppError('Contest has been cancelled. Cannot submit attempt.', 400, {
      code: 'CONTEST_CANCELLED'
    });
  }

  // Idempotency: If already SUBMITTED and finalized, return existing score
  if (attempt.status === 'SUBMITTED') {
    return {
      attemptId: attempt.id,
      status: attempt.status,
      submittedAt: attempt.submittedAt,
      codingScore: Number(attempt.codingScore),
      aptitudeScore: Number(attempt.aptitudeScore),
      technicalScore: Number(attempt.technicalScore),
      totalScore: Number(attempt.totalScore),
      totalMarks: Number(attempt.totalMarks),
      isFinalized: true
    };
  }

  // 2. Check for Pending Judge0 Executions
  const hasPendingSubmissions = (attempt.submissions || []).some((s) =>
    ['QUEUED', 'RUNNING'].includes(s.status)
  );

  if (hasPendingSubmissions) {
    return {
      attemptId: attempt.id,
      status: attempt.status,
      isPending: true,
      message: 'Judge0 code executions are still in progress. Please finalize once complete.'
    };
  }

  // 3. Evaluate Section by Section
  let aptitudeRaw = 0.00;
  let aptitudeMax = 0.00;
  let technicalRaw = 0.00;
  let technicalMax = 0.00;
  let codingScore = 0.00;
  let codingMax = 0.00;

  const responseUpdates = [];

  for (const cq of attempt.contest.questions) {
    const qMarks = Number(cq.marks || 0);
    const qVersionId = cq.questionVersionId;

    if (cq.section === 'APTITUDE') {
      aptitudeMax += qMarks;
      const resp = (attempt.responses || []).find((r) => r.questionVersionId === qVersionId);
      const evalRes = evaluateMCQQuestion({ contestQuestion: cq, candidateResponse: resp });
      aptitudeRaw += evalRes.marksAwarded;

      responseUpdates.push({
        id: resp ? resp.id : null,
        questionVersionId: qVersionId,
        isCorrect: evalRes.isCorrect,
        marksAwarded: evalRes.marksAwarded,
        answerData: resp ? resp.answerData : null
      });
    } else if (cq.section === 'TECHNICAL') {
      technicalMax += qMarks;
      const resp = (attempt.responses || []).find((r) => r.questionVersionId === qVersionId);
      const evalRes = evaluateMCQQuestion({ contestQuestion: cq, candidateResponse: resp });
      technicalRaw += evalRes.marksAwarded;

      responseUpdates.push({
        id: resp ? resp.id : null,
        questionVersionId: qVersionId,
        isCorrect: evalRes.isCorrect,
        marksAwarded: evalRes.marksAwarded,
        answerData: resp ? resp.answerData : null
      });
    } else if (cq.section === 'CODING') {
      codingMax += qMarks;

      // Find latest SUBMIT code submission for this question
      const codingSubmissions = (attempt.submissions || []).filter(
        (s) => s.questionVersionId === qVersionId
      );
      const latestSub = codingSubmissions[0]; // Already ordered by submittedAt desc

      let earnedCodingMarks = 0.00;
      let isCodingAccepted = false;

      if (latestSub && latestSub.testResults && latestSub.testResults.length > 0) {
        const testCases = cq.questionVersion.codingProblem?.testCases || [];
        const totalWeight = testCases.reduce((sum, tc) => sum + Number(tc.weight || 0), 0);

        if (totalWeight <= 0) {
          throw new AppError(
            `Total test case weight cannot be zero for coding problem ${qVersionId}`,
            400
          );
        }

        const earnedWeight = latestSub.testResults
          .filter((tr) => tr.passed)
          .reduce((sum, tr) => sum + Number(tr.earnedWeight || (tr.testCase ? tr.testCase.weight : 0)), 0);

        earnedCodingMarks = (earnedWeight / totalWeight) * qMarks;
        earnedCodingMarks = Math.round(earnedCodingMarks * 100) / 100;
        isCodingAccepted = latestSub.status === 'ACCEPTED';
      }

      codingScore += earnedCodingMarks;

      const resp = (attempt.responses || []).find((r) => r.questionVersionId === qVersionId);
      responseUpdates.push({
        id: resp ? resp.id : null,
        questionVersionId: qVersionId,
        isCorrect: isCodingAccepted,
        marksAwarded: earnedCodingMarks,
        answerData: latestSub ? { language: latestSub.language, sourceCode: latestSub.sourceCode } : (resp ? resp.answerData : null)
      });
    }
  }

  // 4. Clamping and Section Floor Protection (MCQ losses cannot drop below 0 or affect other sections)
  const finalAptitudeScore = Math.max(0, Math.min(aptitudeMax, Math.round(aptitudeRaw * 100) / 100));
  const finalTechnicalScore = Math.max(0, Math.min(technicalMax, Math.round(technicalRaw * 100) / 100));
  const finalCodingScore = Math.max(0, Math.min(codingMax, Math.round(codingScore * 100) / 100));

  const totalScore = Math.round((finalAptitudeScore + finalTechnicalScore + finalCodingScore) * 100) / 100;
  const totalMarks = Math.round((aptitudeMax + technicalMax + codingMax) * 100) / 100;

  // Determine final attempt status:
  // If timed out, record as TIMED_OUT; otherwise SUBMITTED
  const targetStatus = attempt.status === 'TIMED_OUT' ? 'TIMED_OUT' : 'SUBMITTED';

  // 5. Transactional Persistence
  await prisma.$transaction(async (tx) => {
    // Update or create QuestionResponse records
    for (const update of responseUpdates) {
      if (update.id) {
        await tx.questionResponse.update({
          where: { id: update.id },
          data: {
            isCorrect: update.isCorrect,
            marksAwarded: update.marksAwarded,
            answeredAt: now
          }
        });
      } else if (update.answerData !== null) {
        await tx.questionResponse.create({
          data: {
            contestAttemptId: attempt.id,
            questionVersionId: update.questionVersionId,
            isCorrect: update.isCorrect,
            marksAwarded: update.marksAwarded,
            answerData: update.answerData,
            answeredAt: now
          }
        });
      }
    }

    // Update ContestAttempt
    await tx.contestAttempt.update({
      where: { id: attempt.id },
      data: {
        status: targetStatus,
        submittedAt: attempt.submittedAt || now,
        codingScore: finalCodingScore,
        aptitudeScore: finalAptitudeScore,
        technicalScore: finalTechnicalScore,
        totalScore,
        totalMarks
      }
    });
  });

  return {
    attemptId: attempt.id,
    status: targetStatus,
    submittedAt: attempt.submittedAt || now,
    codingScore: finalCodingScore,
    aptitudeScore: finalAptitudeScore,
    technicalScore: finalTechnicalScore,
    totalScore,
    totalMarks,
    isFinalized: true
  };
}

/**
 * Get student-safe contest result and score breakdown
 */
async function getStudentContestResult({ contestId, attemptId, studentId, collegeId }) {
  if (!attemptId) {
    throw new AppError('Attempt ID is required', 400);
  }

  const attempt = await prisma.contestAttempt.findUnique({
    where: { id: attemptId },
    include: {
      contest: {
        include: {
          questions: {
            include: {
              questionVersion: {
                include: { question: true }
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

  const isFinalized = ['SUBMITTED', 'TIMED_OUT', 'DISQUALIFIED'].includes(attempt.status);

  const responseMap = {};
  for (const r of attempt.responses || []) {
    responseMap[r.questionVersionId] = {
      marksAwarded: Number(r.marksAwarded || 0),
      isCorrect: Boolean(r.isCorrect)
    };
  }

  const questionBreakdown = attempt.contest.questions.map((cq) => ({
    questionVersionId: cq.questionVersionId,
    section: cq.section,
    order: cq.order,
    marksAvailable: Number(cq.marks),
    marksAwarded: isFinalized && responseMap[cq.questionVersionId] ? responseMap[cq.questionVersionId].marksAwarded : 0.00,
    isCorrect: isFinalized && responseMap[cq.questionVersionId] ? responseMap[cq.questionVersionId].isCorrect : false
  }));

  return {
    contestAttemptId: attempt.id,
    contestId: attempt.contestId,
    status: attempt.status,
    startedAt: attempt.startedAt,
    submittedAt: attempt.submittedAt,
    isFinalized,
    codingScore: Number(attempt.codingScore),
    aptitudeScore: Number(attempt.aptitudeScore),
    technicalScore: Number(attempt.technicalScore),
    totalScore: Number(attempt.totalScore),
    totalMarks: Number(attempt.totalMarks),
    questionBreakdown
  };
}

module.exports = {
  evaluateMCQQuestion,
  submitAndEvaluateContestAttempt,
  getStudentContestResult
};
