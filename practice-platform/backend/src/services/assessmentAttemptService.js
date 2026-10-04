const prisma = require('../utils/prisma');
const AppError = require('../utils/appError');
const sipsEligibilityService = require('./sipsEligibilityService');
const { evaluateResponse } = require('../utils/evaluator');
const {
  serializeStudentAssessment,
  serializeAssessmentAttempt,
  serializeAssessmentQuestionForStudent,
  serializeAssessmentResponse,
  serializeStudentQuestionVersion
} = require('../utils/serializers');

/**
 * Assessment Attempt Service
 * Manages student assessment discovery, SIPS drive eligibility, attempt creation,
 * server-authoritative timing, questions delivery, response autosaving,
 * server-side evaluation, and result computation.
 */

/**
 * Discover available PUBLISHED assessments for authenticated student
 */
async function getAvailableAssessmentsForStudent({ studentId, collegeId, now = new Date() }) {
  if (!studentId) {
    throw new AppError('studentId is required', 400);
  }

  // Find PUBLISHED assessments: global (collegeId is null) or matching student's collegeId
  const assessments = await prisma.assessment.findMany({
    where: {
      status: 'PUBLISHED',
      OR: [
        { collegeId: null },
        { collegeId: collegeId || undefined }
      ]
    },
    include: {
      questions: {
        include: {
          questionVersion: {
            include: { question: true }
          }
        },
        orderBy: { order: 'asc' }
      },
      attempts: {
        where: { studentId }
      },
      _count: {
        select: { questions: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  const results = [];

  for (const a of assessments) {
    let isEligible = true;
    let eligibilityReasons = [];

    // Check SIPS Placement Drive eligibility if drive is attached
    if (a.sipsDriveId) {
      try {
        const eligibility = await sipsEligibilityService.checkDriveEligibility({
          studentId,
          collegeId: collegeId || a.collegeId || '',
          driveId: a.sipsDriveId
        });
        isEligible = eligibility.eligible;
        eligibilityReasons = eligibility.reasons || [];
      } catch (err) {
        // Fail closed: if eligibility service throws, mark ineligible or omit
        isEligible = false;
        eligibilityReasons = ['Eligibility verification service temporarily unavailable'];
      }
    }

    // Only include if eligible (or show with eligibility status)
    if (isEligible) {
      const serialized = serializeStudentAssessment(a);
      serialized.isEligible = true;

      const myAttempt = a.attempts && a.attempts.length > 0 ? a.attempts[0] : null;
      if (myAttempt) {
        const remainingMs = Math.max(0, new Date(myAttempt.effectiveDeadline).getTime() - Date.now());
        serialized.myAttempt = serializeAssessmentAttempt(myAttempt, {
          remainingMs
        });
      }

      results.push(serialized);
    }
  }

  return results;
}

/**
 * Get student assessment details prior to starting
 */
async function getStudentAssessmentDetails({ assessmentId, studentId, collegeId }) {
  if (!assessmentId) {
    throw new AppError('Assessment ID is required', 400);
  }

  const assessment = await prisma.assessment.findUnique({
    where: { id: assessmentId },
    include: {
      questions: {
        include: {
          questionVersion: {
            include: { question: true }
          }
        },
        orderBy: { order: 'asc' }
      },
      attempts: {
        where: { studentId }
      },
      _count: {
        select: { questions: true }
      }
    }
  });

  if (!assessment || assessment.status !== 'PUBLISHED') {
    throw new AppError('Assessment not found or not published', 404, { code: 'ASSESSMENT_NOT_FOUND' });
  }

  // Tenant isolation for college-scoped assessments
  if (assessment.collegeId && assessment.collegeId !== collegeId) {
    throw new AppError('Assessment does not belong to your institution', 403, {
      code: 'TENANT_MISMATCH'
    });
  }

  // SIPS Drive eligibility check
  let isEligible = true;
  let eligibilityReasons = [];

  if (assessment.sipsDriveId) {
    try {
      const eligibility = await sipsEligibilityService.checkDriveEligibility({
        studentId,
        collegeId: collegeId || assessment.collegeId || '',
        driveId: assessment.sipsDriveId
      });
      isEligible = eligibility.eligible;
      eligibilityReasons = eligibility.reasons || [];
    } catch (err) {
      // Fail closed
      throw new AppError('SIPS eligibility verification service temporarily unavailable', 503, {
        code: 'ELIGIBILITY_SERVICE_UNAVAILABLE'
      });
    }

    if (!isEligible) {
      throw new AppError('You are not eligible for this placement assessment.', 403, {
        code: 'ASSESSMENT_INELIGIBLE',
        reasons: eligibilityReasons
      });
    }
  }

  const serialized = serializeStudentAssessment(assessment);
  serialized.isEligible = isEligible;
  serialized.eligibilityReasons = eligibilityReasons;

  const myAttempt = assessment.attempts && assessment.attempts.length > 0 ? assessment.attempts[0] : null;
  if (myAttempt) {
    const remainingMs = Math.max(0, new Date(myAttempt.effectiveDeadline).getTime() - Date.now());
    serialized.myAttempt = serializeAssessmentAttempt(myAttempt, {
      remainingMs
    });
  }

  return serialized;
}

/**
 * Start an official Assessment Attempt
 */
async function startAssessmentAttempt({ assessmentId, studentId, collegeId, now = new Date() }) {
  if (!assessmentId) {
    throw new AppError('Assessment ID is required', 400);
  }

  const assessment = await prisma.assessment.findUnique({
    where: { id: assessmentId },
    include: {
      questions: {
        orderBy: { order: 'asc' }
      }
    }
  });

  if (!assessment) {
    throw new AppError('Assessment not found', 404, { code: 'ASSESSMENT_NOT_FOUND' });
  }

  if (assessment.status !== 'PUBLISHED') {
    throw new AppError(`Cannot start attempt. Assessment is ${assessment.status.toLowerCase()}`, 400, {
      code: 'ASSESSMENT_NOT_PUBLISHED'
    });
  }

  // Tenant validation
  if (assessment.collegeId && assessment.collegeId !== collegeId) {
    throw new AppError('Assessment does not belong to your institution', 403, {
      code: 'TENANT_MISMATCH'
    });
  }

  // SIPS Drive Eligibility Check
  if (assessment.sipsDriveId) {
    const eligibility = await sipsEligibilityService.checkDriveEligibility({
      studentId,
      collegeId: collegeId || assessment.collegeId || '',
      driveId: assessment.sipsDriveId
    });

    if (!eligibility.eligible) {
      throw new AppError('You are not eligible to attempt this placement assessment.', 403, {
        code: 'ASSESSMENT_INELIGIBLE',
        reasons: eligibility.reasons || []
      });
    }
  }

  // Check for existing attempt
  const existingAttempt = await prisma.assessmentAttempt.findUnique({
    where: {
      assessmentId_studentId: {
        assessmentId,
        studentId
      }
    }
  });

  if (existingAttempt) {
    // If IN_PROGRESS, return it
    if (existingAttempt.status === 'IN_PROGRESS') {
      const remainingMs = Math.max(0, new Date(existingAttempt.effectiveDeadline).getTime() - now.getTime());
      return {
        ...serializeAssessmentAttempt(existingAttempt, { remainingMs }),
        serverTime: now,
        sections: ['APTITUDE', 'TECHNICAL', 'CODING'],
        questionCount: assessment.questions.length
      };
    }

    // Already completed/submitted
    return {
      ...serializeAssessmentAttempt(existingAttempt, { remainingMs: 0 }),
      serverTime: now,
      sections: ['APTITUDE', 'TECHNICAL', 'CODING'],
      questionCount: assessment.questions.length
    };
  }

  // Calculate effective deadline: startedAt + durationMinutes
  const durationMs = (assessment.durationMinutes || 60) * 60 * 1000;
  const effectiveDeadline = new Date(now.getTime() + durationMs);

  const totalMarks = assessment.questions.reduce((sum, q) => sum + Number(q.marks || 0), 0);

  const attempt = await prisma.assessmentAttempt.create({
    data: {
      assessmentId,
      studentId,
      collegeId: collegeId || assessment.collegeId || 'global',
      status: 'IN_PROGRESS',
      startedAt: now,
      effectiveDeadline,
      totalMarks,
      totalScore: 0.00,
      aptitudeScore: 0.00,
      technicalScore: 0.00,
      codingScore: 0.00
    }
  });

  const remainingMs = Math.max(0, effectiveDeadline.getTime() - now.getTime());

  return {
    ...serializeAssessmentAttempt(attempt, { remainingMs, effectiveDeadline }),
    serverTime: now,
    sections: ['APTITUDE', 'TECHNICAL', 'CODING'],
    questionCount: assessment.questions.length
  };
}

/**
 * Get student attempt by ID with ownership verification
 */
async function getAssessmentAttempt({ assessmentId, attemptId, studentId, collegeId, now = new Date() }) {
  if (!attemptId || !assessmentId) {
    throw new AppError('Attempt ID and Assessment ID are required', 400);
  }

  const attempt = await prisma.assessmentAttempt.findUnique({
    where: { id: attemptId },
    include: {
      assessment: true,
      _count: {
        select: { responses: true, submissions: true }
      }
    }
  });

  if (!attempt || attempt.assessmentId !== assessmentId) {
    throw new AppError('Assessment attempt not found', 404, { code: 'ATTEMPT_NOT_FOUND' });
  }

  if (attempt.studentId !== studentId) {
    throw new AppError('Unauthorized: Attempt belongs to another student', 403, {
      code: 'UNAUTHORIZED_ATTEMPT_ACCESS'
    });
  }

  if (collegeId && attempt.collegeId !== 'global' && attempt.collegeId !== collegeId) {
    throw new AppError('Unauthorized: Attempt belongs to another institution', 403, {
      code: 'TENANT_MISMATCH'
    });
  }

  // Check deadline expiration
  if (attempt.status === 'IN_PROGRESS') {
    const deadlineMs = new Date(attempt.effectiveDeadline).getTime();
    if (now.getTime() > deadlineMs) {
      const updated = await prisma.assessmentAttempt.update({
        where: { id: attemptId },
        data: { status: 'TIMED_OUT' }
      });
      return serializeAssessmentAttempt(updated, { remainingMs: 0 });
    }
  }

  const remainingMs = Math.max(0, new Date(attempt.effectiveDeadline).getTime() - now.getTime());
  return serializeAssessmentAttempt(attempt, { remainingMs });
}

/**
 * Deliver deterministic runtime questions for an active attempt
 */
async function getAssessmentQuestions({ assessmentId, attemptId, studentId, collegeId }) {
  // Validate attempt ownership and status
  const attempt = await prisma.assessmentAttempt.findUnique({
    where: { id: attemptId }
  });

  if (!attempt || attempt.assessmentId !== assessmentId) {
    throw new AppError('Assessment attempt not found', 404);
  }

  if (attempt.studentId !== studentId) {
    throw new AppError('Unauthorized: Attempt belongs to another student', 403);
  }

  if (collegeId && attempt.collegeId !== 'global' && attempt.collegeId !== collegeId) {
    throw new AppError('Unauthorized: Attempt belongs to another institution', 403);
  }

  // Fetch assessment questions in deterministic order
  const assessmentQuestions = await prisma.assessmentQuestion.findMany({
    where: { assessmentId },
    include: {
      questionVersion: {
        include: {
          question: true,
          codingProblem: {
            include: {
              testCases: {
                where: { isHidden: false },
                orderBy: { order: 'asc' }
              }
            }
          }
        }
      }
    },
    orderBy: { order: 'asc' }
  });

  // Fetch candidate's saved responses for this attempt
  const savedResponses = await prisma.assessmentResponse.findMany({
    where: { assessmentAttemptId: attemptId }
  });

  const responseMap = new Map();
  for (const r of savedResponses) {
    responseMap.set(r.assessmentQuestionId, r);
  }

  // Fetch candidate's latest code submissions for this attempt
  const submissions = await prisma.codeSubmission.findMany({
    where: { assessmentAttemptId: attemptId },
    orderBy: { submittedAt: 'desc' }
  });

  const submissionMap = new Map();
  for (const s of submissions) {
    if (!submissionMap.has(s.questionVersionId)) {
      submissionMap.set(s.questionVersionId, s);
    }
  }

  return assessmentQuestions.map((aq) => {
    const serializedAq = serializeAssessmentQuestionForStudent(aq);
    const resp = responseMap.get(aq.id);
    const latestSub = submissionMap.get(aq.questionVersionId);

    serializedAq.response = resp ? serializeAssessmentResponse(resp) : null;
    serializedAq.latestSubmission = latestSub ? {
      id: latestSub.id,
      status: latestSub.status,
      language: latestSub.language,
      earnedMarks: Number(latestSub.earnedMarks),
      testsPassed: latestSub.testsPassed,
      testsTotal: latestSub.testsTotal,
      submittedAt: latestSub.submittedAt
    } : null;

    return serializedAq;
  });
}

/**
 * Autosave candidate response for a question
 */
async function saveAssessmentResponse({
  assessmentId,
  attemptId,
  questionVersionId,
  answerData,
  studentId,
  collegeId,
  now = new Date()
}) {
  if (!attemptId || !assessmentId || !questionVersionId) {
    throw new AppError('attemptId, assessmentId, and questionVersionId are required', 400);
  }

  const attempt = await prisma.assessmentAttempt.findUnique({
    where: { id: attemptId }
  });

  if (!attempt || attempt.assessmentId !== assessmentId) {
    throw new AppError('Assessment attempt not found', 404);
  }

  if (attempt.studentId !== studentId) {
    throw new AppError('Unauthorized: Attempt belongs to another student', 403);
  }

  if (collegeId && attempt.collegeId !== 'global' && attempt.collegeId !== collegeId) {
    throw new AppError('Unauthorized: Attempt belongs to another institution', 403);
  }

  if (attempt.status !== 'IN_PROGRESS') {
    throw new AppError(`Cannot save response. Attempt is ${attempt.status}`, 409);
  }

  // Server-authoritative deadline check
  const deadlineMs = new Date(attempt.effectiveDeadline).getTime();
  if (now.getTime() > deadlineMs) {
    await prisma.assessmentAttempt.update({
      where: { id: attemptId },
      data: { status: 'TIMED_OUT' }
    });
    throw new AppError('Assessment attempt deadline has passed. Response rejected.', 400, {
      code: 'ATTEMPT_TIMED_OUT'
    });
  }

  // Verify question belongs to this exact assessment
  const assessmentQuestion = await prisma.assessmentQuestion.findUnique({
    where: {
      assessmentId_questionVersionId: {
        assessmentId,
        questionVersionId
      }
    }
  });

  if (!assessmentQuestion) {
    throw new AppError('This question does not belong to the specified assessment', 400);
  }

  // Idempotent upsert of AssessmentResponse
  const response = await prisma.assessmentResponse.upsert({
    where: {
      assessmentAttemptId_assessmentQuestionId: {
        assessmentAttemptId: attemptId,
        assessmentQuestionId: assessmentQuestion.id
      }
    },
    update: {
      answerData: answerData !== undefined ? answerData : null,
      answeredAt: now
    },
    create: {
      assessmentAttemptId: attemptId,
      assessmentQuestionId: assessmentQuestion.id,
      questionVersionId,
      answerData: answerData !== undefined ? answerData : null,
      answeredAt: now
    }
  });

  return serializeAssessmentResponse(response);
}

/**
 * Submit and Evaluate Assessment Attempt
 */
async function submitAssessment({ assessmentId, attemptId, studentId, collegeId, now = new Date() }) {
  if (!attemptId || !assessmentId) {
    throw new AppError('attemptId and assessmentId are required', 400);
  }

  const attempt = await prisma.assessmentAttempt.findUnique({
    where: { id: attemptId },
    include: {
      assessment: true
    }
  });

  if (!attempt || attempt.assessmentId !== assessmentId) {
    throw new AppError('Assessment attempt not found', 404);
  }

  if (attempt.studentId !== studentId) {
    throw new AppError('Unauthorized: Attempt belongs to another student', 403);
  }

  if (collegeId && attempt.collegeId !== 'global' && attempt.collegeId !== collegeId) {
    throw new AppError('Unauthorized: Attempt belongs to another institution', 403);
  }

  // Idempotent return if already submitted or finalized
  if (['SUBMITTED', 'FINALIZED'].includes(attempt.status)) {
    return getAssessmentResult({ assessmentId, attemptId, studentId, collegeId });
  }

  // Fetch all assessment questions with versions
  const assessmentQuestions = await prisma.assessmentQuestion.findMany({
    where: { assessmentId },
    include: {
      questionVersion: {
        include: {
          question: true,
          codingProblem: true
        }
      }
    }
  });

  // Fetch all saved responses
  const savedResponses = await prisma.assessmentResponse.findMany({
    where: { assessmentAttemptId: attemptId }
  });

  const responseMap = new Map();
  for (const r of savedResponses) {
    responseMap.set(r.assessmentQuestionId, r);
  }

  // Fetch latest SUBMIT code submissions for coding questions
  const submissions = await prisma.codeSubmission.findMany({
    where: {
      assessmentAttemptId: attemptId,
      mode: 'SUBMIT'
    },
    orderBy: { submittedAt: 'desc' }
  });

  const latestSubMap = new Map();
  for (const s of submissions) {
    if (!latestSubMap.has(s.questionVersionId)) {
      latestSubMap.set(s.questionVersionId, s);
    }
  }

  let aptitudeScore = 0.0;
  let technicalScore = 0.0;
  let codingScore = 0.0;

  for (const aq of assessmentQuestions) {
    const section = aq.section;
    const version = aq.questionVersion;
    const qMarks = Number(aq.marks || 0);
    const qNegMarks = Number(aq.negativeMarks || 0);

    if (section === 'CODING' || version.question.type === 'CODING') {
      const sub = latestSubMap.get(version.id);
      const earned = sub ? Number(sub.earnedMarks || 0) : 0.0;
      codingScore += earned;

      // Ensure AssessmentResponse is recorded
      const existingResp = responseMap.get(aq.id);
      if (sub) {
        if (existingResp) {
          await prisma.assessmentResponse.update({
            where: { id: existingResp.id },
            data: {
              isCorrect: sub.status === 'ACCEPTED',
              marksAwarded: earned,
              answerData: { language: sub.language, sourceCode: sub.sourceCode, submissionId: sub.id }
            }
          });
        } else {
          await prisma.assessmentResponse.create({
            data: {
              assessmentAttemptId: attemptId,
              assessmentQuestionId: aq.id,
              questionVersionId: version.id,
              isCorrect: sub.status === 'ACCEPTED',
              marksAwarded: earned,
              answerData: { language: sub.language, sourceCode: sub.sourceCode, submissionId: sub.id }
            }
          });
        }
      }
    } else {
      // Objective MCQ Question (APTITUDE / TECHNICAL)
      const resp = responseMap.get(aq.id);

      if (resp && resp.answerData !== null && resp.answerData !== undefined) {
        const isCorrect = evaluateResponse(version.question.format, version.correctAnswer, resp.answerData);
        let marksAwarded = 0.0;

        if (isCorrect) {
          marksAwarded = qMarks;
        } else {
          marksAwarded = qNegMarks > 0 ? -qNegMarks : 0.0;
        }

        if (section === 'APTITUDE') {
          aptitudeScore += marksAwarded;
        } else if (section === 'TECHNICAL') {
          technicalScore += marksAwarded;
        }

        await prisma.assessmentResponse.update({
          where: { id: resp.id },
          data: {
            isCorrect,
            marksAwarded
          }
        });
      }
    }
  }

  // Round section scores to 2 decimal places
  aptitudeScore = Math.round(aptitudeScore * 100) / 100;
  technicalScore = Math.round(technicalScore * 100) / 100;
  codingScore = Math.round(codingScore * 100) / 100;
  const totalScore = Math.round((aptitudeScore + technicalScore + codingScore) * 100) / 100;

  const finalizedAttempt = await prisma.assessmentAttempt.update({
    where: { id: attemptId },
    data: {
      status: 'FINALIZED',
      submittedAt: attempt.submittedAt || now,
      finalizedAt: now,
      aptitudeScore,
      technicalScore,
      codingScore,
      totalScore
    }
  });

  return getAssessmentResult({ assessmentId, attemptId, studentId, collegeId });
}

/**
 * Get assessment result post-submission
 */
async function getAssessmentResult({ assessmentId, attemptId, studentId, collegeId }) {
  if (!attemptId || !assessmentId) {
    throw new AppError('attemptId and assessmentId are required', 400);
  }

  const attempt = await prisma.assessmentAttempt.findUnique({
    where: { id: attemptId },
    include: {
      assessment: true
    }
  });

  if (!attempt || attempt.assessmentId !== assessmentId) {
    throw new AppError('Assessment attempt not found', 404);
  }

  if (attempt.studentId !== studentId) {
    throw new AppError('Unauthorized: Attempt belongs to another student', 403);
  }

  if (collegeId && attempt.collegeId !== 'global' && attempt.collegeId !== collegeId) {
    throw new AppError('Unauthorized: Attempt belongs to another institution', 403);
  }

  const assessmentQuestions = await prisma.assessmentQuestion.findMany({
    where: { assessmentId },
    include: {
      questionVersion: {
        include: {
          question: true,
          codingProblem: {
            include: {
              testCases: {
                where: { isHidden: false },
                orderBy: { order: 'asc' }
              }
            }
          }
        }
      }
    },
    orderBy: { order: 'asc' }
  });

  const responses = await prisma.assessmentResponse.findMany({
    where: { assessmentAttemptId: attemptId }
  });

  const responseMap = new Map();
  for (const r of responses) {
    responseMap.set(r.assessmentQuestionId, r);
  }

  const submissions = await prisma.codeSubmission.findMany({
    where: {
      assessmentAttemptId: attemptId,
      mode: 'SUBMIT'
    },
    orderBy: { submittedAt: 'desc' }
  });

  const submissionMap = new Map();
  for (const s of submissions) {
    if (!submissionMap.has(s.questionVersionId)) {
      submissionMap.set(s.questionVersionId, s);
    }
  }

  const questionResults = assessmentQuestions.map((aq) => {
    const resp = responseMap.get(aq.id);
    const sub = submissionMap.get(aq.questionVersionId);

    return {
      id: aq.id,
      assessmentId: aq.assessmentId,
      questionVersionId: aq.questionVersionId,
      section: aq.section,
      order: aq.order,
      marks: Number(aq.marks),
      negativeMarks: Number(aq.negativeMarks),
      questionVersion: {
        id: aq.questionVersion.id,
        title: aq.questionVersion.title,
        statement: aq.questionVersion.statement,
        options: aq.questionVersion.options,
        type: aq.questionVersion.question.type,
        format: aq.questionVersion.question.format
      },
      response: resp ? {
        id: resp.id,
        answerData: resp.answerData,
        isCorrect: resp.isCorrect,
        marksAwarded: Number(resp.marksAwarded),
        answeredAt: resp.answeredAt
      } : null,
      submission: sub ? {
        id: sub.id,
        status: sub.status,
        language: sub.language,
        testsPassed: sub.testsPassed,
        testsTotal: sub.testsTotal,
        earnedMarks: Number(sub.earnedMarks),
        submittedAt: sub.submittedAt
      } : null
    };
  });

  return {
    assessment: serializeStudentAssessment(attempt.assessment),
    attempt: serializeAssessmentAttempt(attempt),
    scores: {
      aptitudeScore: Number(attempt.aptitudeScore),
      technicalScore: Number(attempt.technicalScore),
      codingScore: Number(attempt.codingScore),
      totalScore: Number(attempt.totalScore),
      totalMarks: Number(attempt.totalMarks)
    },
    questions: questionResults
  };
}

module.exports = {
  getAvailableAssessmentsForStudent,
  getStudentAssessmentDetails,
  startAssessmentAttempt,
  getAssessmentAttempt,
  getAssessmentQuestions,
  saveAssessmentResponse,
  submitAssessment,
  getAssessmentResult
};
