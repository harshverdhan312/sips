const prisma = require('../utils/prisma');
const AppError = require('../utils/appError');
const sipsEligibilityService = require('./sipsEligibilityService');
const { serializeAdminQuestionVersion } = require('../utils/serializers');

const ALLOWED_SUPER_ROLES = ['SUPERADMIN', 'SUPER_ADMIN', 'ADMIN'];

/**
 * Check if the user has access to manage an assessment based on college ownership
 */
function checkAssessmentCollegeAccess(assessment, user) {
  if (!assessment) return;
  const isSuper = ALLOWED_SUPER_ROLES.includes((user.role || '').toUpperCase()) && !user.collegeId;
  if (isSuper) return; // Superadmin has universal access

  const userScopes = [user.collegeId, user.departmentId, user.institutionId].filter(Boolean);
  if (assessment.collegeId && userScopes.length > 0 && !userScopes.includes(assessment.collegeId)) {
    throw new AppError('Access denied: You cannot manage assessments belonging to another institution.', 403, {
      code: 'FORBIDDEN_COLLEGE_ACCESS'
    });
  }
}

/**
 * Calculate and update the total marks of an assessment
 */
async function syncAssessmentTotalMarks(tx, assessmentId) {
  const questions = await tx.assessmentQuestion.findMany({
    where: { assessmentId },
    select: { marks: true }
  });

  const total = questions.reduce((sum, q) => sum + Number(q.marks || 0), 0);
  const totalMarks = Math.round(total * 100) / 100;

  await tx.assessment.update({
    where: { id: assessmentId },
    data: { totalMarks }
  });

  return totalMarks;
}

/**
 * Create a new Assessment (Draft)
 */
async function createAssessment(data, user = {}) {
  const {
    title,
    description,
    type = 'PRACTICE_SET',
    durationMinutes = 60,
    collegeId,
    sipsDriveId
  } = data;

  if (!title || typeof title !== 'string' || !title.trim()) {
    throw new AppError('Assessment title is required', 400);
  }

  const isSuper = ALLOWED_SUPER_ROLES.includes((user.role || '').toUpperCase()) && !user.collegeId;
  const resolvedCollegeId = isSuper ? (collegeId || null) : (user.collegeId || null);

  const cleanDriveId = sipsDriveId ? sipsDriveId.trim() : null;

  // If a placement drive is provided, validate it against SIPS Core
  if (cleanDriveId) {
    await sipsEligibilityService.getDriveMetadata({
      driveId: cleanDriveId,
      collegeId: resolvedCollegeId
    });
  }

  const assessment = await prisma.assessment.create({
    data: {
      title: title.trim(),
      description: description ? description.trim() : null,
      type: cleanDriveId ? 'PLACEMENT_ASSESSMENT' : type,
      status: 'DRAFT',
      collegeId: resolvedCollegeId,
      createdBy: user.id || null,
      durationMinutes: Math.max(1, parseInt(durationMinutes, 10) || 60),
      totalMarks: 0.00,
      sipsDriveId: cleanDriveId
    }
  });

  return assessment;
}

/**
 * List assessments with pagination, filtering, and section metrics
 */
async function getAssessments(filters = {}, user = {}) {
  const {
    page = 1,
    limit = 20,
    search = '',
    type,
    status,
    scope // 'all', 'global', 'college'
  } = filters;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const where = {};

  if (status && status !== 'ALL') {
    where.status = status;
  }

  if (type && type !== 'ALL') {
    where.type = type;
  }

  const isSuper = ALLOWED_SUPER_ROLES.includes((user.role || '').toUpperCase()) && !user.collegeId;
  if (!isSuper && user.collegeId) {
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

  if (search && search.trim()) {
    const q = search.trim();
    const searchConditions = [
      { title: { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } }
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

  const [total, assessments] = await Promise.all([
    prisma.assessment.count({ where }),
    prisma.assessment.findMany({
      where,
      skip,
      take: limitNum,
      include: {
        questions: {
          select: {
            id: true,
            section: true,
            marks: true
          }
        },
        _count: {
          select: { questions: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
  ]);

  const items = assessments.map((a) => {
    const sectionCounts = {
      APTITUDE: 0,
      TECHNICAL: 0,
      CODING: 0
    };

    a.questions.forEach((q) => {
      if (sectionCounts[q.section] !== undefined) {
        sectionCounts[q.section]++;
      }
    });

    return {
      id: a.id,
      title: a.title,
      description: a.description,
      type: a.type,
      status: a.status,
      collegeId: a.collegeId,
      isGlobal: a.collegeId === null,
      durationMinutes: a.durationMinutes,
      totalMarks: Number(a.totalMarks),
      questionCount: a._count.questions,
      sectionCounts,
      sipsDriveId: a.sipsDriveId,
      createdAt: a.createdAt,
      updatedAt: a.updatedAt
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
 * Get detailed assessment with all pinned questions, versions, and section summaries
 */
async function getAssessmentById(assessmentId, user = {}) {
  const assessment = await prisma.assessment.findUnique({
    where: { id: assessmentId },
    include: {
      questions: {
        orderBy: [
          { section: 'asc' },
          { order: 'asc' }
        ],
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

  if (!assessment) {
    throw new AppError(`Assessment not found with id: ${assessmentId}`, 404);
  }

  checkAssessmentCollegeAccess(assessment, user);

  const sectionBreakdown = {
    APTITUDE: { count: 0, marks: 0 },
    TECHNICAL: { count: 0, marks: 0 },
    CODING: { count: 0, marks: 0 }
  };

  const serializedQuestions = assessment.questions.map((aq) => {
    const marks = Number(aq.marks);
    const negativeMarks = Number(aq.negativeMarks);

    if (sectionBreakdown[aq.section]) {
      sectionBreakdown[aq.section].count++;
      sectionBreakdown[aq.section].marks += marks;
    }

    return {
      id: aq.id,
      assessmentId: aq.assessmentId,
      questionVersionId: aq.questionVersionId,
      section: aq.section,
      order: aq.order,
      marks,
      negativeMarks,
      createdAt: aq.createdAt,
      questionVersion: serializeAdminQuestionVersion(aq.questionVersion)
    };
  });

  let placementDrive = null;
  if (assessment.sipsDriveId) {
    try {
      placementDrive = await sipsEligibilityService.getDriveMetadata({
        driveId: assessment.sipsDriveId,
        collegeId: assessment.collegeId
      });
    } catch (_) {
      // Non-blocking for assessment inspection if SIPS metadata fetch fails
      placementDrive = {
        id: assessment.sipsDriveId,
        title: 'Placement Drive Assessment',
        company: 'Campus Placement',
        status: 'UNKNOWN'
      };
    }
  }

  return {
    id: assessment.id,
    title: assessment.title,
    description: assessment.description,
    type: assessment.type,
    status: assessment.status,
    collegeId: assessment.collegeId,
    isGlobal: assessment.collegeId === null,
    createdBy: assessment.createdBy,
    durationMinutes: assessment.durationMinutes,
    totalMarks: Number(assessment.totalMarks),
    sipsDriveId: assessment.sipsDriveId,
    placementDrive,
    createdAt: assessment.createdAt,
    updatedAt: assessment.updatedAt,
    questionCount: serializedQuestions.length,
    sectionBreakdown,
    questions: serializedQuestions
  };
}

/**
 * Associate a SIPS Placement Drive to an Assessment
 */
async function associateDriveToAssessment(assessmentId, payload = {}, user = {}) {
  const { sipsDriveId } = payload;

  const assessment = await prisma.assessment.findUnique({
    where: { id: assessmentId }
  });

  if (!assessment) {
    throw new AppError(`Assessment not found with id: ${assessmentId}`, 404);
  }

  checkAssessmentCollegeAccess(assessment, user);

  if (assessment.status !== 'DRAFT') {
    throw new AppError(
      `Cannot modify drive association for an assessment with status '${assessment.status}'. Assessment is immutable after publishing.`,
      409,
      { code: 'ASSESSMENT_MUTATION_LOCKED' }
    );
  }

  if (!sipsDriveId || typeof sipsDriveId !== 'string' || !sipsDriveId.trim()) {
    throw new AppError('sipsDriveId is required', 400);
  }

  const cleanDriveId = sipsDriveId.trim();

  // Validate drive existence, tenancy and status against SIPS Core
  const drive = await sipsEligibilityService.getDriveMetadata({
    driveId: cleanDriveId,
    collegeId: assessment.collegeId
  });

  const updated = await prisma.assessment.update({
    where: { id: assessmentId },
    data: {
      sipsDriveId: cleanDriveId,
      type: 'PLACEMENT_ASSESSMENT'
    }
  });

  return {
    success: true,
    message: `Placement drive '${drive.company} - ${drive.title}' associated successfully.`,
    assessment: updated,
    drive
  };
}

/**
 * Disassociate a SIPS Placement Drive from an Assessment
 */
async function disassociateDriveFromAssessment(assessmentId, user = {}) {
  const assessment = await prisma.assessment.findUnique({
    where: { id: assessmentId }
  });

  if (!assessment) {
    throw new AppError(`Assessment not found with id: ${assessmentId}`, 404);
  }

  checkAssessmentCollegeAccess(assessment, user);

  if (assessment.status !== 'DRAFT') {
    throw new AppError(
      `Cannot modify drive association for an assessment with status '${assessment.status}'. Assessment is immutable after publishing.`,
      409,
      { code: 'ASSESSMENT_MUTATION_LOCKED' }
    );
  }

  const updated = await prisma.assessment.update({
    where: { id: assessmentId },
    data: {
      sipsDriveId: null,
      type: 'PRACTICE_SET'
    }
  });

  return {
    success: true,
    message: 'Placement drive disassociated successfully.',
    assessment: updated
  };
}

/**
 * Add an active QuestionVersion to an assessment
 */
async function addQuestionToAssessment(assessmentId, payload, user = {}) {
  const {
    questionVersionId,
    section = 'APTITUDE',
    order,
    marks = 1.00,
    negativeMarks = 0.00
  } = payload;

  if (!questionVersionId || typeof questionVersionId !== 'string') {
    throw new AppError('questionVersionId is required', 400);
  }

  const assessment = await prisma.assessment.findUnique({
    where: { id: assessmentId }
  });

  if (!assessment) {
    throw new AppError(`Assessment not found with id: ${assessmentId}`, 404);
  }

  checkAssessmentCollegeAccess(assessment, user);

  if (assessment.status !== 'DRAFT') {
    throw new AppError(`Cannot add questions to an assessment with status '${assessment.status}'. Assessment is immutable after publishing.`, 409, {
      code: 'ASSESSMENT_MUTATION_LOCKED'
    });
  }

  // 1. Fetch QuestionVersion and parent PracticeQuestion
  const version = await prisma.questionVersion.findUnique({
    where: { id: questionVersionId },
    include: { question: true, codingProblem: true }
  });

  if (!version) {
    throw new AppError(`QuestionVersion not found with id: ${questionVersionId}`, 404);
  }

  // 2. Question Status Rule: Only ACTIVE questions eligible for new assembly
  if (version.question.status !== 'ACTIVE') {
    throw new AppError(
      `Cannot add question. Question is ${version.question.status}. Only ACTIVE questions are eligible for assessment assembly.`,
      422,
      { code: 'INELIGIBLE_QUESTION_STATUS' }
    );
  }

  // 3. College Isolation Rule
  if (assessment.collegeId && version.question.collegeId && assessment.collegeId !== version.question.collegeId) {
    throw new AppError('Cannot add question belonging to another institution to this assessment.', 403, {
      code: 'FORBIDDEN_COLLEGE_QUESTION'
    });
  }

  if (!assessment.collegeId && version.question.collegeId) {
    throw new AppError('Cannot add a college-private question to a Global assessment.', 422, {
      code: 'GLOBAL_ASSESSMENT_PRIVATE_QUESTION_REJECTED'
    });
  }

  // Marks validation
  const numMarks = parseFloat(marks);
  if (isNaN(numMarks) || numMarks <= 0) {
    throw new AppError('Marks must be a positive number greater than zero', 400);
  }

  const numNegMarks = parseFloat(negativeMarks);
  if (isNaN(numNegMarks) || numNegMarks < 0) {
    throw new AppError('Negative marks cannot be negative', 400);
  }

  // 4. Duplicate Check
  const existing = await prisma.assessmentQuestion.findUnique({
    where: {
      assessmentId_questionVersionId: {
        assessmentId,
        questionVersionId
      }
    }
  });

  if (existing) {
    throw new AppError('This QuestionVersion is already included in this assessment.', 409, {
      code: 'DUPLICATE_ASSESSMENT_QUESTION'
    });
  }

  // 6. Compute Order
  let resolvedOrder = parseInt(order, 10);
  if (isNaN(resolvedOrder) || resolvedOrder < 1) {
    const highestOrder = await prisma.assessmentQuestion.findFirst({
      where: { assessmentId, section },
      orderBy: { order: 'desc' },
      select: { order: true }
    });
    resolvedOrder = (highestOrder?.order || 0) + 1;
  }

  // 7. Transactionally create question and sync total marks
  const result = await prisma.$transaction(async (tx) => {
    const created = await tx.assessmentQuestion.create({
      data: {
        assessmentId,
        questionVersionId,
        section,
        order: resolvedOrder,
        marks: numMarks,
        negativeMarks: numNegMarks
      },
      include: {
        questionVersion: {
          include: {
            question: true,
            codingProblem: true
          }
        }
      }
    });

    await syncAssessmentTotalMarks(tx, assessmentId);
    return created;
  });

  return result;
}

/**
 * Remove a question from an assessment
 */
async function removeQuestionFromAssessment(assessmentId, assessmentQuestionId, user = {}) {
  const assessment = await prisma.assessment.findUnique({
    where: { id: assessmentId }
  });

  if (!assessment) {
    throw new AppError(`Assessment not found with id: ${assessmentId}`, 404);
  }

  checkAssessmentCollegeAccess(assessment, user);

  if (assessment.status !== 'DRAFT') {
    throw new AppError(`Cannot remove questions from an assessment with status '${assessment.status}'. Assessment is immutable after publishing.`, 409, {
      code: 'ASSESSMENT_MUTATION_LOCKED'
    });
  }

  const aq = await prisma.assessmentQuestion.findUnique({
    where: { id: assessmentQuestionId }
  });

  if (!aq || aq.assessmentId !== assessmentId) {
    throw new AppError(`AssessmentQuestion not found with id: ${assessmentQuestionId}`, 404);
  }

  await prisma.$transaction(async (tx) => {
    await tx.assessmentQuestion.delete({
      where: { id: assessmentQuestionId }
    });
    await syncAssessmentTotalMarks(tx, assessmentId);
  });

  return { success: true, message: 'Question removed from assessment successfully.' };
}

/**
 * Reorder questions within an assessment
 */
async function reorderAssessmentQuestions(assessmentId, questionOrders = [], user = {}) {
  const assessment = await prisma.assessment.findUnique({
    where: { id: assessmentId }
  });

  if (!assessment) {
    throw new AppError(`Assessment not found with id: ${assessmentId}`, 404);
  }

  checkAssessmentCollegeAccess(assessment, user);

  if (assessment.status !== 'DRAFT') {
    throw new AppError(`Cannot reorder questions in an assessment with status '${assessment.status}'. Assessment is immutable after publishing.`, 409, {
      code: 'ASSESSMENT_MUTATION_LOCKED'
    });
  }

  if (!Array.isArray(questionOrders) || questionOrders.length === 0) {
    throw new AppError('questionOrders array is required', 400);
  }

  await prisma.$transaction(async (tx) => {
    for (const item of questionOrders) {
      if (item.id && item.order !== undefined) {
        await tx.assessmentQuestion.updateMany({
          where: { id: item.id, assessmentId },
          data: { order: parseInt(item.order, 10) || 1 }
        });
      }
    }
  });

  return { success: true, message: 'Questions reordered successfully.' };
}

/**
 * Publish an assessment (DRAFT -> PUBLISHED)
 * Validates question completeness, placement drive validity, and locks the assessment against mutations.
 */
async function publishAssessment(assessmentId, user = {}) {
  const assessment = await prisma.assessment.findUnique({
    where: { id: assessmentId },
    include: {
      questions: {
        include: {
          questionVersion: {
            include: {
              codingProblem: {
                include: { testCases: true }
              },
              question: true
            }
          }
        }
      }
    }
  });

  if (!assessment) {
    throw new AppError(`Assessment not found with id: ${assessmentId}`, 404);
  }

  checkAssessmentCollegeAccess(assessment, user);

  if (assessment.status === 'PUBLISHED') {
    return { success: true, message: 'Assessment is already PUBLISHED.', assessment };
  }

  if (assessment.status === 'ARCHIVED') {
    throw new AppError('Cannot publish an ARCHIVED assessment.', 409);
  }

  // 1. Minimum 1 question validation
  if (!assessment.questions || assessment.questions.length === 0) {
    throw new AppError('Cannot publish assessment with 0 questions. Please add at least 1 question.', 422, {
      code: 'EMPTY_ASSESSMENT_REJECTED'
    });
  }

  // 2. PLACEMENT_ASSESSMENT Drive Validation
  if (assessment.type === 'PLACEMENT_ASSESSMENT') {
    if (!assessment.sipsDriveId) {
      throw new AppError(
        'Placement assessments must be associated with a valid SIPS placement drive before publishing.',
        422,
        { code: 'PLACEMENT_ASSESSMENT_MISSING_DRIVE' }
      );
    }

    // Verify referenced drive exists and matches college ownership
    const drive = await sipsEligibilityService.getDriveMetadata({
      driveId: assessment.sipsDriveId,
      collegeId: assessment.collegeId
    });

    if (drive.status === 'CLOSED') {
      throw new AppError(
        `Cannot publish placement assessment. Referenced placement drive '${drive.title}' is CLOSED.`,
        422,
        { code: 'PLACEMENT_DRIVE_CLOSED' }
      );
    }
  }

  // 3. Validate all questions & marks
  for (const aq of assessment.questions) {
    if (!aq.questionVersion) {
      throw new AppError(`Assessment references an invalid QuestionVersion (${aq.questionVersionId}).`, 422);
    }

    if (Number(aq.marks) <= 0) {
      throw new AppError(`Question '${aq.questionVersion.title}' has invalid marks (${aq.marks}). Marks must be greater than 0.`, 422);
    }

    if (aq.questionVersion.question.type === 'CODING') {
      const cp = aq.questionVersion.codingProblem;
      if (!cp || !cp.testCases || cp.testCases.length === 0) {
        throw new AppError(`Coding question '${aq.questionVersion.title}' does not have configured test cases.`, 422);
      }
    }
  }

  // 4. Lock & publish assessment
  const updated = await prisma.assessment.update({
    where: { id: assessmentId },
    data: { status: 'PUBLISHED' }
  });

  return {
    success: true,
    message: `Assessment '${assessment.title}' has been successfully PUBLISHED and locked for delivery.`,
    assessment: updated
  };
}

/**
 * Archive an assessment
 */
async function archiveAssessment(assessmentId, user = {}) {
  const assessment = await prisma.assessment.findUnique({
    where: { id: assessmentId }
  });

  if (!assessment) {
    throw new AppError(`Assessment not found with id: ${assessmentId}`, 404);
  }

  checkAssessmentCollegeAccess(assessment, user);

  if (assessment.status === 'ARCHIVED') {
    return { success: true, message: 'Assessment is already ARCHIVED.', assessment };
  }

  const updated = await prisma.assessment.update({
    where: { id: assessmentId },
    data: { status: 'ARCHIVED' }
  });

  return {
    success: true,
    message: `Assessment '${assessment.title}' has been ARCHIVED.`,
    assessment: updated
  };
}

/**
 * Get published placement assessment by SIPS Drive ID (for student drive page)
 */
async function getAssessmentByDriveId(driveId, user = {}) {
  if (!driveId) {
    throw new AppError('driveId is required', 400);
  }

  const assessment = await prisma.assessment.findFirst({
    where: {
      sipsDriveId: driveId,
      status: 'PUBLISHED',
      OR: [
        { collegeId: null },
        { collegeId: user.collegeId || undefined }
      ]
    },
    include: {
      _count: {
        select: { questions: true }
      }
    }
  });

  if (!assessment) {
    return null;
  }

  return {
    id: assessment.id,
    title: assessment.title,
    description: assessment.description,
    type: assessment.type,
    status: assessment.status,
    durationMinutes: assessment.durationMinutes,
    totalMarks: Number(assessment.totalMarks),
    questionCount: assessment._count.questions,
    sipsDriveId: assessment.sipsDriveId
  };
}

/**
 * Get aggregated candidate results and leaderboard for an assessment (Admin/Placement)
 */
async function getAssessmentResults(assessmentId, query = {}, user = {}) {
  const assessment = await prisma.assessment.findUnique({
    where: { id: assessmentId },
    select: { id: true, title: true, type: true, status: true, collegeId: true, durationMinutes: true, totalMarks: true }
  });

  if (!assessment) {
    throw new AppError('Assessment not found', 404);
  }

  checkAssessmentCollegeAccess(assessment, user);

  const {
    page = 1,
    limit = 20,
    search = '',
    status = 'ALL'
  } = query;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const where = {
    assessmentId: assessment.id
  };

  const isSuper = ALLOWED_SUPER_ROLES.includes((user.role || '').toUpperCase()) && !user.collegeId;
  if (!isSuper && user.collegeId) {
    where.collegeId = user.collegeId;
  }

  if (status && status !== 'ALL') {
    where.status = status;
  }

  if (search && search.trim()) {
    where.studentId = { contains: search.trim(), mode: 'insensitive' };
  }

  // Fetch all attempts matching assessment to compute aggregate stats
  const allAttempts = await prisma.assessmentAttempt.findMany({
    where: {
      assessmentId: assessment.id,
      ...(!isSuper && user.collegeId ? { collegeId: user.collegeId } : {})
    },
    select: {
      id: true,
      status: true,
      totalScore: true,
      totalMarks: true
    }
  });

  const totalAttempts = allAttempts.length;
  const submittedAttempts = allAttempts.filter(a => a.status === 'SUBMITTED' || a.status === 'FINALIZED');
  const submittedCount = submittedAttempts.length;
  const inProgressCount = allAttempts.filter(a => a.status === 'IN_PROGRESS').length;
  const timedOutCount = allAttempts.filter(a => a.status === 'TIMED_OUT').length;

  let averageScore = 0;
  let highestScore = 0;
  let passCount = 0;

  if (submittedCount > 0) {
    const scores = submittedAttempts.map(a => Number(a.totalScore || 0));
    highestScore = Math.max(...scores);
    const sum = scores.reduce((acc, s) => acc + s, 0);
    averageScore = Math.round((sum / submittedCount) * 100) / 100;

    const maxMarks = Number(assessment.totalMarks || 100);
    passCount = submittedAttempts.filter(a => Number(a.totalScore || 0) >= (maxMarks * 0.5)).length;
  }

  const passRate = submittedCount > 0 ? Math.round((passCount / submittedCount) * 100) : 0;

  // Paginated query for table
  const [items, totalFiltered] = await Promise.all([
    prisma.assessmentAttempt.findMany({
      where,
      orderBy: [
        { totalScore: 'desc' },
        { submittedAt: 'asc' },
        { startedAt: 'asc' }
      ],
      skip,
      take: limitNum
    }),
    prisma.assessmentAttempt.count({ where })
  ]);

  const candidates = items.map((att, idx) => {
    const totalScoreNum = Number(att.totalScore || 0);
    const totalMarksNum = Number(att.totalMarks || assessment.totalMarks || 0);
    const pct = totalMarksNum > 0 ? Math.round((totalScoreNum / totalMarksNum) * 100) : 0;

    return {
      rank: skip + idx + 1,
      attemptId: att.id,
      studentId: att.studentId,
      collegeId: att.collegeId,
      status: att.status,
      startedAt: att.startedAt,
      submittedAt: att.submittedAt,
      finalizedAt: att.finalizedAt,
      aptitudeScore: Number(att.aptitudeScore || 0),
      technicalScore: Number(att.technicalScore || 0),
      codingScore: Number(att.codingScore || 0),
      totalScore: totalScoreNum,
      totalMarks: totalMarksNum,
      percentage: pct
    };
  });

  return {
    assessment: {
      id: assessment.id,
      title: assessment.title,
      type: assessment.type,
      status: assessment.status,
      durationMinutes: assessment.durationMinutes,
      totalMarks: Number(assessment.totalMarks)
    },
    metrics: {
      totalAttempts,
      submittedCount,
      inProgressCount,
      timedOutCount,
      averageScore,
      highestScore,
      passCount,
      passRate
    },
    candidates,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total: totalFiltered,
      totalPages: Math.ceil(totalFiltered / limitNum) || 1
    }
  };
}

/**
 * Get detailed scorecard for an individual student candidate attempt
 */
async function getAssessmentCandidateDetail(assessmentId, attemptId, user = {}) {
  const assessment = await prisma.assessment.findUnique({
    where: { id: assessmentId },
    select: { id: true, title: true, collegeId: true, totalMarks: true }
  });

  if (!assessment) {
    throw new AppError('Assessment not found', 404);
  }

  checkAssessmentCollegeAccess(assessment, user);

  const attempt = await prisma.assessmentAttempt.findUnique({
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
      },
      submissions: {
        include: {
          questionVersion: {
            include: {
              question: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  if (!attempt || attempt.assessmentId !== assessmentId) {
    throw new AppError('Candidate attempt not found for this assessment', 404);
  }

  // Also fetch full assessment questions to show any unanswered ones
  const assessmentQuestions = await prisma.assessmentQuestion.findMany({
    where: { assessmentId },
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
    orderBy: [
      { section: 'asc' },
      { order: 'asc' }
    ]
  });

  const responseMap = new Map();
  attempt.responses.forEach(r => responseMap.set(r.questionVersionId, r));

  const submissionMap = new Map();
  attempt.submissions.forEach(s => {
    if (!submissionMap.has(s.questionVersionId)) {
      submissionMap.set(s.questionVersionId, s);
    }
  });

  const questionBreakdown = assessmentQuestions.map((aq, idx) => {
    const qv = aq.questionVersion;
    const q = qv.question;
    const resp = responseMap.get(qv.id);
    const sub = submissionMap.get(qv.id);

    return {
      order: aq.order || idx + 1,
      section: aq.section,
      marks: Number(aq.marks),
      negativeMarks: Number(aq.negativeMarks),
      questionId: q.id,
      questionVersionId: qv.id,
      title: qv.title,
      statement: qv.statement,
      type: q.type,
      category: q.category,
      subcategory: q.subcategory,
      difficulty: q.difficulty,
      options: qv.options,
      correctAnswer: qv.correctAnswer,
      explanation: qv.explanation,
      // Candidate's specific attempt data
      isAnswered: Boolean(resp || sub),
      response: resp ? {
        chosenOptionId: resp.chosenOptionId,
        isCorrect: resp.isCorrect,
        marksAwarded: Number(resp.marksAwarded || 0)
      } : null,
      submission: sub ? {
        status: sub.status,
        language: sub.language,
        code: sub.code,
        score: Number(sub.score || 0),
        passedTestCases: sub.passedTestCases,
        totalTestCases: sub.totalTestCases
      } : null
    };
  });

  return {
    attempt: {
      id: attempt.id,
      studentId: attempt.studentId,
      collegeId: attempt.collegeId,
      status: attempt.status,
      startedAt: attempt.startedAt,
      submittedAt: attempt.submittedAt,
      finalizedAt: attempt.finalizedAt,
      aptitudeScore: Number(attempt.aptitudeScore),
      technicalScore: Number(attempt.technicalScore),
      codingScore: Number(attempt.codingScore),
      totalScore: Number(attempt.totalScore),
      totalMarks: Number(attempt.totalMarks)
    },
    questionBreakdown
  };
}

module.exports = {
  createAssessment,
  getAssessments,
  getAssessmentById,
  associateDriveToAssessment,
  disassociateDriveFromAssessment,
  addQuestionToAssessment,
  removeQuestionFromAssessment,
  reorderAssessmentQuestions,
  publishAssessment,
  archiveAssessment,
  getAssessmentByDriveId,
  getAssessmentResults,
  getAssessmentCandidateDetail
};

