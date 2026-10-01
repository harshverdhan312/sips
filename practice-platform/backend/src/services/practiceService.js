const prisma = require('../utils/prisma');
const AppError = require('../utils/appError');
const { validateCreatePracticeAttempt, validateSubmitResponse } = require('../validators/practiceValidator');
const { serializeStudentQuestionVersion } = require('../utils/serializers');
const { evaluateResponse } = require('../utils/evaluator');

/**
 * Practice Service
 * Handles self-paced practice session lifecycle, delivery, and scoring.
 */

async function createPracticeAttempt(data) {
  validateCreatePracticeAttempt(data);

  const { studentId, collegeId, type, category, questionCount = 10 } = data;

  const where = {};
  if (type) where.type = type;
  if (category) where.category = { contains: category, mode: 'insensitive' };
  if (collegeId) {
    where.OR = [{ collegeId }, { collegeId: null }];
  }

  // Find eligible questions
  const questions = await prisma.practiceQuestion.findMany({
    where,
    take: questionCount,
    include: {
      versions: {
        orderBy: { versionNumber: 'desc' },
        take: 1,
        include: {
          codingProblem: {
            include: {
              testCases: true
            }
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  if (!questions.length) {
    throw new AppError('No questions available matching the requested criteria', 404);
  }

  // Select the latest version for each question to lock into this attempt
  const selectedVersions = questions
    .filter((q) => q.versions.length > 0)
    .map((q) => q.versions[0]);

  if (!selectedVersions.length) {
    throw new AppError('No usable question versions found', 404);
  }

  // Transactionally create practice attempt and question response placeholders
  const attempt = await prisma.$transaction(async (tx) => {
    const newAttempt = await tx.practiceAttempt.create({
      data: {
        studentId: studentId.trim(),
        collegeId: collegeId.trim(),
        category: category || type || 'GENERAL',
        status: 'IN_PROGRESS',
        score: 0.0,
        totalMarks: 0.0
      }
    });

    // Create a QuestionResponse record for each delivered question
    for (const version of selectedVersions) {
      await tx.questionResponse.create({
        data: {
          practiceAttemptId: newAttempt.id,
          contestAttemptId: null, // Strictly null for practice
          questionVersionId: version.id,
          answerData: {},
          isCorrect: null,
          marksAwarded: 0.0
        }
      });
    }

    return newAttempt;
  });

  return {
    attemptId: attempt.id,
    studentId: attempt.studentId,
    collegeId: attempt.collegeId,
    category: attempt.category,
    status: attempt.status,
    questionCount: selectedVersions.length,
    startedAt: attempt.startedAt
  };
}

async function getPracticeAttemptById(attemptId) {
  const attempt = await prisma.practiceAttempt.findUnique({
    where: { id: attemptId }
  });

  if (!attempt) {
    throw new AppError(`PracticeAttempt not found with id: ${attemptId}`, 404);
  }

  return attempt;
}

async function getDeliveredQuestions(attemptId) {
  const attempt = await prisma.practiceAttempt.findUnique({
    where: { id: attemptId },
    include: {
      responses: {
        include: {
          questionVersion: {
            include: {
              question: true,
              codingProblem: {
                include: {
                  testCases: {
                    orderBy: { order: 'asc' }
                  }
                }
              }
            }
          }
        }
      }
    }
  });

  if (!attempt) {
    throw new AppError(`PracticeAttempt not found with id: ${attemptId}`, 404);
  }

  // Return questions with student-safe serialization (EXCLUDES correctAnswer & hidden tests)
  const questions = attempt.responses.map((resp) => {
    const qv = resp.questionVersion;
    const safeVersion = serializeStudentQuestionVersion(qv);
    return {
      ...safeVersion,
      responseId: resp.id,
      answered: Object.keys(resp.answerData || {}).length > 0,
      currentAnswer: resp.answerData || null
    };
  });

  return {
    attemptId: attempt.id,
    status: attempt.status,
    questionCount: questions.length,
    questions
  };
}

async function recordResponse(attemptId, data) {
  validateSubmitResponse(data);
  const { questionVersionId, answerData } = data;

  const attempt = await prisma.practiceAttempt.findUnique({
    where: { id: attemptId }
  });

  if (!attempt) {
    throw new AppError(`PracticeAttempt not found with id: ${attemptId}`, 404);
  }

  if (attempt.status !== 'IN_PROGRESS') {
    throw new AppError(`Cannot submit response. PracticeAttempt is ${attempt.status}.`, 409);
  }

  // Verify that the question version belongs to this delivered attempt
  const responseRecord = await prisma.questionResponse.findFirst({
    where: {
      practiceAttemptId: attemptId,
      questionVersionId
    }
  });

  if (!responseRecord) {
    throw new AppError('The specified question does not belong to this practice attempt.', 404);
  }

  // Update response record
  const updatedResponse = await prisma.questionResponse.update({
    where: { id: responseRecord.id },
    data: {
      answerData,
      answeredAt: new Date()
    }
  });

  return {
    responseId: updatedResponse.id,
    questionVersionId: updatedResponse.questionVersionId,
    saved: true,
    answeredAt: updatedResponse.answeredAt
  };
}

async function submitPracticeAttempt(attemptId) {
  // Transactionally evaluate and finalize attempt
  const finalized = await prisma.$transaction(async (tx) => {
    const attempt = await tx.practiceAttempt.findUnique({
      where: { id: attemptId },
      include: {
        responses: {
          include: {
            questionVersion: {
              include: {
                question: true,
                codingProblem: true
              }
            }
          }
        }
      }
    });

    if (!attempt) {
      throw new AppError(`PracticeAttempt not found with id: ${attemptId}`, 404);
    }

    if (attempt.status !== 'IN_PROGRESS') {
      throw new AppError(`PracticeAttempt has already been finalized (status: ${attempt.status})`, 409);
    }

    let calculatedScore = 0.0;
    let calculatedTotalMarks = 0.0;

    for (const resp of attempt.responses) {
      const qv = resp.questionVersion;
      const format = qv.question.format;
      const maxMarks = qv.codingProblem ? Number(qv.codingProblem.maxMarks) : 1.0;
      calculatedTotalMarks += maxMarks;

      let isCorrect = false;
      let marksAwarded = 0.0;

      const hasAnswer = resp.answerData && Object.keys(resp.answerData).length > 0;

      if (hasAnswer) {
        isCorrect = evaluateResponse(format, qv.correctAnswer, resp.answerData);
        if (isCorrect) {
          marksAwarded = maxMarks;
          calculatedScore += maxMarks;
        }
      }

      await tx.questionResponse.update({
        where: { id: resp.id },
        data: {
          isCorrect,
          marksAwarded
        }
      });
    }

    const submittedAt = new Date();

    const updatedAttempt = await tx.practiceAttempt.update({
      where: { id: attemptId },
      data: {
        status: 'SUBMITTED',
        submittedAt,
        score: calculatedScore,
        totalMarks: calculatedTotalMarks
      }
    });

    return updatedAttempt;
  });

  return {
    attemptId: finalized.id,
    status: finalized.status,
    score: Number(finalized.score),
    totalMarks: Number(finalized.totalMarks),
    submittedAt: finalized.submittedAt
  };
}

async function getPracticeResult(attemptId) {
  const attempt = await prisma.practiceAttempt.findUnique({
    where: { id: attemptId },
    include: {
      responses: {
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

  if (!attempt) {
    throw new AppError(`PracticeAttempt not found with id: ${attemptId}`, 404);
  }

  if (attempt.status !== 'SUBMITTED') {
    throw new AppError(`PracticeAttempt has not been submitted yet (current status: ${attempt.status})`, 400);
  }

  const breakdown = attempt.responses.map((resp) => ({
    responseId: resp.id,
    questionId: resp.questionVersion.questionId,
    questionVersionId: resp.questionVersion.id,
    title: resp.questionVersion.title,
    statement: resp.questionVersion.statement,
    format: resp.questionVersion.question.format,
    candidateAnswer: resp.answerData,
    isCorrect: resp.isCorrect,
    marksAwarded: Number(resp.marksAwarded),
    explanation: resp.questionVersion.explanation
  }));

  return {
    attemptId: attempt.id,
    studentId: attempt.studentId,
    collegeId: attempt.collegeId,
    category: attempt.category,
    status: attempt.status,
    score: Number(attempt.score),
    totalMarks: Number(attempt.totalMarks),
    startedAt: attempt.startedAt,
    submittedAt: attempt.submittedAt,
    breakdown
  };
}

module.exports = {
  createPracticeAttempt,
  getPracticeAttemptById,
  getDeliveredQuestions,
  recordResponse,
  submitPracticeAttempt,
  getPracticeResult
};
