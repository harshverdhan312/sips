const prisma = require('../utils/prisma');
const AppError = require('../utils/appError');
const { validateCreateQuestion } = require('../validators/questionValidator');

/**
 * Question Service
 * Handles PracticeQuestion stable identity creation and retrieval.
 */

async function createQuestion(data) {
  validateCreateQuestion(data);

  const {
    type,
    format,
    category,
    subcategory,
    difficulty,
    status = 'ACTIVE',
    sourceType = 'CURATED',
    sourceNamespace,
    externalId,
    sourceUrl,
    attribution,
    tags = [],
    collegeId,
    createdBy,
    title,
    statement,
    options,
    correctAnswer,
    explanation,
    metadata
  } = data;

  // Create Question and initial QuestionVersion 1 transactionally
  const created = await prisma.$transaction(async (tx) => {
    const question = await tx.practiceQuestion.create({
      data: {
        type,
        format,
        category: category.trim(),
        subcategory: subcategory ? subcategory.trim() : null,
        difficulty,
        status,
        sourceType,
        sourceNamespace: sourceNamespace ? sourceNamespace.trim() : null,
        externalId: externalId ? externalId.trim() : null,
        sourceUrl: sourceUrl || null,
        attribution: attribution || null,
        tags: Array.isArray(tags) ? tags : [],
        collegeId: collegeId || null,
        createdBy: createdBy || null
      }
    });

    const initialVersion = await tx.questionVersion.create({
      data: {
        questionId: question.id,
        versionNumber: 1,
        title: title.trim(),
        statement: statement.trim(),
        options: options || null,
        correctAnswer: correctAnswer !== undefined ? correctAnswer : null,
        explanation: explanation || null,
        metadata: metadata || null
      }
    });

    return {
      ...question,
      currentVersionNumber: 1,
      versions: [initialVersion]
    };
  });

  return created;
}

async function getQuestions(filters = {}) {
  const { type, category, difficulty, sourceType, collegeId, status, sourceNamespace, externalId } = filters;
  const where = {};

  if (status) {
    if (status !== 'ALL') where.status = status;
  } else {
    where.status = 'ACTIVE';
  }

  if (type) where.type = type;
  if (category) where.category = { contains: category, mode: 'insensitive' };
  if (difficulty) where.difficulty = difficulty;
  if (sourceType) where.sourceType = sourceType;
  if (sourceNamespace) where.sourceNamespace = sourceNamespace;
  if (externalId) where.externalId = externalId;
  if (collegeId) where.collegeId = collegeId;

  const questions = await prisma.practiceQuestion.findMany({
    where,
    include: {
      versions: {
        orderBy: { versionNumber: 'desc' },
        take: 1
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return questions.map((q) => ({
    id: q.id,
    externalId: q.externalId,
    sourceNamespace: q.sourceNamespace,
    type: q.type,
    format: q.format,
    category: q.category,
    subcategory: q.subcategory,
    difficulty: q.difficulty,
    status: q.status,
    sourceType: q.sourceType,
    sourceUrl: q.sourceUrl,
    attribution: q.attribution,
    tags: q.tags,
    collegeId: q.collegeId,
    createdBy: q.createdBy,
    createdAt: q.createdAt,
    updatedAt: q.updatedAt,
    latestVersionNumber: q.versions[0] ? q.versions[0].versionNumber : 1,
    latestTitle: q.versions[0] ? q.versions[0].title : ''
  }));
}

async function getQuestionById(questionId) {
  const question = await prisma.practiceQuestion.findUnique({
    where: { id: questionId },
    include: {
      versions: {
        orderBy: { versionNumber: 'asc' }
      }
    }
  });

  if (!question) {
    throw new AppError(`PracticeQuestion not found with id: ${questionId}`, 404);
  }

  return question;
}

module.exports = {
  createQuestion,
  getQuestions,
  getQuestionById
};
