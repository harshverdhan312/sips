const prisma = require('../utils/prisma');
const AppError = require('../utils/appError');
const { serializeAdminQuestionVersion } = require('../utils/serializers');

const ALLOWED_SUPER_ROLES = ['SUPERADMIN', 'SUPER_ADMIN', 'ADMIN'];

/**
 * Check if the user has access to manage a question based on college ownership
 */
function checkCollegeAccess(question, user) {
  if (!question) return;
  const isSuper = ALLOWED_SUPER_ROLES.includes((user.role || '').toUpperCase()) && !user.collegeId;
  if (isSuper) return; // Superadmin has universal access

  const userScopes = [user.collegeId, user.departmentId, user.institutionId].filter(Boolean);
  if (question.collegeId && userScopes.length > 0 && !userScopes.includes(question.collegeId)) {
    throw new AppError('Access denied: You cannot manage questions belonging to another institution.', 403, {
      code: 'FORBIDDEN_COLLEGE_ACCESS'
    });
  }
}

/**
 * Get paginated list of questions for admin portal
 */
async function getAdminQuestions(filters = {}, user = {}) {
  const {
    page = 1,
    limit = 20,
    search = '',
    type,
    category,
    difficulty,
    status,
    sourceType,
    sourceNamespace,
    scope // 'all', 'global', 'college'
  } = filters;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const where = {};

  // Status filter
  if (status && status !== 'ALL') {
    where.status = status;
  }

  // Type filter
  if (type && type !== 'ALL') {
    where.type = type;
  }

  // Category filter
  if (category && category !== 'ALL') {
    where.category = { contains: category, mode: 'insensitive' };
  }

  // Difficulty filter
  if (difficulty && difficulty !== 'ALL') {
    where.difficulty = difficulty;
  }

  // Source Type filter
  if (sourceType && sourceType !== 'ALL') {
    where.sourceType = sourceType;
  }

  // Source Namespace filter
  if (sourceNamespace && sourceNamespace !== 'ALL') {
    where.sourceNamespace = sourceNamespace;
  }

  // Scope / College filtering
  const isSuper = ALLOWED_SUPER_ROLES.includes((user.role || '').toUpperCase()) && !user.collegeId;
  if (!isSuper && user.collegeId) {
    // College admin can see global questions OR their own college questions
    if (scope === 'college') {
      where.collegeId = user.collegeId;
    } else if (scope === 'global') {
      where.collegeId = null;
    } else {
      where.OR = [
        { collegeId: null },
        { collegeId: user.collegeId }
      ];
    }
  } else if (scope === 'global') {
    where.collegeId = null;
  } else if (scope === 'college' && filters.collegeId) {
    where.collegeId = filters.collegeId;
  }

  // Search keyword across externalId, category, subcategory, tags, or latest version title
  if (search && search.trim()) {
    const q = search.trim();
    const searchConditions = [
      { externalId: { contains: q, mode: 'insensitive' } },
      { sourceNamespace: { contains: q, mode: 'insensitive' } },
      { category: { contains: q, mode: 'insensitive' } },
      { subcategory: { contains: q, mode: 'insensitive' } },
      { tags: { has: q } },
      {
        versions: {
          some: {
            title: { contains: q, mode: 'insensitive' }
          }
        }
      }
    ];

    if (where.OR) {
      where.AND = [
        { OR: where.OR },
        { OR: searchConditions }
      ];
      delete where.OR;
    } else {
      where.OR = searchConditions;
    }
  }

  const [total, questions] = await Promise.all([
    prisma.practiceQuestion.count({ where }),
    prisma.practiceQuestion.findMany({
      where,
      skip,
      take: limitNum,
      include: {
        versions: {
          orderBy: { versionNumber: 'desc' },
          take: 1
        },
        _count: {
          select: {
            versions: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
  ]);

  const items = questions.map((q) => {
    const latestVersion = q.versions[0];
    return {
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
      isGlobal: q.collegeId === null,
      versionCount: q._count.versions,
      latestVersionNumber: latestVersion ? latestVersion.versionNumber : 1,
      title: latestVersion ? latestVersion.title : 'Untitled Question',
      createdAt: q.createdAt,
      updatedAt: q.updatedAt
    };
  });

  return {
    items,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum) || 1
    }
  };
}

/**
 * Get detailed question information including full version history and reference safety metrics
 */
async function getAdminQuestionById(questionId, user = {}) {
  const question = await prisma.practiceQuestion.findUnique({
    where: { id: questionId },
    include: {
      versions: {
        orderBy: { versionNumber: 'desc' },
        include: {
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
  });

  if (!question) {
    throw new AppError(`Question not found with id: ${questionId}`, 404);
  }

  checkCollegeAccess(question, user);

  // Compute references for all versions
  const versionIds = question.versions.map((v) => v.id);

  const [practiceAttemptsCount, contestQuestionsCount, submissionsCount] = await Promise.all([
    prisma.questionResponse.count({
      where: {
        questionVersionId: { in: versionIds },
        practiceAttemptId: { not: null }
      }
    }),
    prisma.contestQuestion.count({
      where: {
        questionVersionId: { in: versionIds }
      }
    }),
    prisma.codeSubmission.count({
      where: {
        questionVersionId: { in: versionIds }
      }
    })
  ]);

  const totalReferences = practiceAttemptsCount + contestQuestionsCount + submissionsCount;

  const serializedVersions = question.versions.map((v) => serializeAdminQuestionVersion(v));

  return {
    id: question.id,
    externalId: question.externalId,
    sourceNamespace: question.sourceNamespace,
    type: question.type,
    format: question.format,
    category: question.category,
    subcategory: question.subcategory,
    difficulty: question.difficulty,
    status: question.status,
    sourceType: question.sourceType,
    sourceUrl: question.sourceUrl,
    attribution: question.attribution,
    tags: question.tags,
    collegeId: question.collegeId,
    isGlobal: question.collegeId === null,
    createdBy: question.createdBy,
    createdAt: question.createdAt,
    updatedAt: question.updatedAt,
    referenceCounts: {
      practiceAttempts: practiceAttemptsCount,
      contests: contestQuestionsCount,
      codeSubmissions: submissionsCount,
      total: totalReferences,
      hasHistoricalReferences: totalReferences > 0
    },
    latestVersion: serializedVersions[0] || null,
    versions: serializedVersions
  };
}

/**
 * Get a specific immutable QuestionVersion by ID
 */
async function getAdminQuestionVersion(questionId, versionId, user = {}) {
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

  if (!version || version.questionId !== questionId) {
    throw new AppError(`QuestionVersion not found with id: ${versionId}`, 404);
  }

  checkCollegeAccess(version.question, user);

  return serializeAdminQuestionVersion(version);
}

/**
 * Activate a question (DRAFT -> ACTIVE)
 */
async function activateQuestion(questionId, user = {}) {
  const question = await prisma.practiceQuestion.findUnique({
    where: { id: questionId },
    include: { versions: { take: 1 } }
  });

  if (!question) {
    throw new AppError(`Question not found with id: ${questionId}`, 404);
  }

  checkCollegeAccess(question, user);

  if (question.status === 'ACTIVE') {
    return {
      success: true,
      message: 'Question is already ACTIVE.',
      question
    };
  }

  if (question.versions.length === 0) {
    throw new AppError('Cannot activate a question with 0 QuestionVersions.', 422);
  }

  const updated = await prisma.practiceQuestion.update({
    where: { id: questionId },
    data: { status: 'ACTIVE' }
  });

  return {
    success: true,
    message: `Question '${question.externalId || question.id}' has been activated.`,
    question: updated
  };
}

/**
 * Archive a question (ACTIVE -> ARCHIVED or DRAFT -> ARCHIVED)
 */
async function archiveQuestion(questionId, user = {}) {
  const question = await prisma.practiceQuestion.findUnique({
    where: { id: questionId },
    include: {
      versions: {
        select: { id: true }
      }
    }
  });

  if (!question) {
    throw new AppError(`Question not found with id: ${questionId}`, 404);
  }

  checkCollegeAccess(question, user);

  if (question.status === 'ARCHIVED') {
    return {
      success: true,
      message: 'Question is already ARCHIVED.',
      question
    };
  }

  const versionIds = question.versions.map((v) => v.id);

  // Check active contest references
  const liveContestCount = await prisma.contestQuestion.count({
    where: {
      questionVersionId: { in: versionIds },
      contest: {
        status: { in: ['LIVE', 'PUBLISHED'] }
      }
    }
  });

  if (liveContestCount > 0) {
    throw new AppError(
      `Cannot archive question. It is currently pinned in ${liveContestCount} active/live contest(s).`,
      409,
      { code: 'ACTIVE_CONTEST_CONFLICT' }
    );
  }

  const updated = await prisma.practiceQuestion.update({
    where: { id: questionId },
    data: { status: 'ARCHIVED' }
  });

  return {
    success: true,
    message: `Question '${question.externalId || question.id}' has been archived. Existing attempts remain readable.`,
    question: updated
  };
}

module.exports = {
  getAdminQuestions,
  getAdminQuestionById,
  getAdminQuestionVersion,
  activateQuestion,
  archiveQuestion
};
