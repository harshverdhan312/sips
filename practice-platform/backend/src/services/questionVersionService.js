const prisma = require('../utils/prisma');
const AppError = require('../utils/appError');
const { validateCreateVersion } = require('../validators/questionValidator');

/**
 * Question Version Service
 * Handles immutable version creation and retrieval.
 */

async function createNextVersion(questionId, data) {
  // Ensure question exists
  const question = await prisma.practiceQuestion.findUnique({
    where: { id: questionId }
  });

  if (!question) {
    throw new AppError(`PracticeQuestion not found with id: ${questionId}`, 404);
  }

  validateCreateVersion(data, question);

  const { title, statement, options, correctAnswer, explanation, metadata } = data;

  const createdVersion = await prisma.$transaction(async (tx) => {
    // Find latest version number for this question
    const latestVersion = await tx.questionVersion.findFirst({
      where: { questionId },
      orderBy: { versionNumber: 'desc' },
      select: { versionNumber: true }
    });

    const nextVersionNumber = latestVersion ? latestVersion.versionNumber + 1 : 1;

    const version = await tx.questionVersion.create({
      data: {
        questionId,
        versionNumber: nextVersionNumber,
        title: title.trim(),
        statement: statement.trim(),
        options: options || null,
        correctAnswer: correctAnswer !== undefined ? correctAnswer : null,
        explanation: explanation || null,
        metadata: metadata || null
      },
      include: {
        question: true
      }
    });

    return version;
  });

  return createdVersion;
}

async function getVersionsByQuestionId(questionId) {
  const question = await prisma.practiceQuestion.findUnique({
    where: { id: questionId }
  });

  if (!question) {
    throw new AppError(`PracticeQuestion not found with id: ${questionId}`, 404);
  }

  const versions = await prisma.questionVersion.findMany({
    where: { questionId },
    orderBy: { versionNumber: 'asc' },
    include: {
      codingProblem: {
        include: {
          testCases: {
            orderBy: { order: 'asc' }
          }
        }
      }
    }
  });

  return versions;
}

async function getVersionById(versionId) {
  const version = await prisma.questionVersion.findUnique({
    where: { id: versionId },
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
  });

  if (!version) {
    throw new AppError(`QuestionVersion not found with id: ${versionId}`, 404);
  }

  return version;
}

module.exports = {
  createNextVersion,
  getVersionsByQuestionId,
  getVersionById
};
