const bulkImportService = require('../services/bulkImportService');
const adminQuestionService = require('../services/adminQuestionService');
const { success } = require('../utils/response');

/**
 * Handle bulk question import
 * POST /api/admin/questions/bulk-import
 */
async function bulkImport(req, res, next) {
  try {
    const { items } = req.body;
    
    if (!Array.isArray(items)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request body. "items" array is required.'
      });
    }

    const context = {
      collegeId: req.user?.collegeId || null,
      userId: req.user?.id || null,
      role: req.user?.role || null
    };

    const result = await bulkImportService.importQuestions(items, context);

    return res.status(200).json({
      success: true,
      message: `Bulk import completed: ${result.inserted} inserted, ${result.versioned} versioned, ${result.skipped} skipped, ${result.failed} failed.`,
      data: result
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/admin/questions
 * Paginated admin question list with filters
 */
async function getQuestions(req, res, next) {
  try {
    const result = await adminQuestionService.getAdminQuestions(req.query, req.user);
    return res.status(200).json({
      success: true,
      message: 'Questions retrieved successfully',
      data: result.items,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/admin/questions/:questionId
 * Full question detail with all versions, test cases, and reference counts
 */
async function getQuestionById(req, res, next) {
  try {
    const { questionId } = req.params;
    const question = await adminQuestionService.getAdminQuestionById(questionId, req.user);
    return success(res, question, 'Question details retrieved successfully', 200);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/admin/questions/:questionId/versions/:versionId
 * Specific immutable version snapshot
 */
async function getQuestionVersion(req, res, next) {
  try {
    const { questionId, versionId } = req.params;
    const version = await adminQuestionService.getAdminQuestionVersion(questionId, versionId, req.user);
    return success(res, version, 'Question version retrieved successfully', 200);
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/admin/questions/:questionId/activate
 * Activate question (DRAFT -> ACTIVE)
 */
async function activateQuestion(req, res, next) {
  try {
    const { questionId } = req.params;
    const result = await adminQuestionService.activateQuestion(questionId, req.user);
    return success(res, result.question, result.message, 200);
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/admin/questions/:questionId/archive
 * Archive question (ACTIVE -> ARCHIVED or DRAFT -> ARCHIVED)
 */
async function archiveQuestion(req, res, next) {
  try {
    const { questionId } = req.params;
    const result = await adminQuestionService.archiveQuestion(questionId, req.user);
    return success(res, result.question, result.message, 200);
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/admin/questions
 * Create a new question (single question creation)
 */
async function createQuestion(req, res, next) {
  try {
    const isSuper = ['SUPERADMIN', 'SUPER_ADMIN', 'ADMIN'].includes((req.user?.role || '').toUpperCase()) && !req.user?.collegeId;
    const data = {
      ...req.body,
      collegeId: isSuper ? (req.body.isGlobal ? null : (req.body.collegeId || null)) : (req.user?.collegeId || null),
      createdBy: req.user?.id || req.user?.username || 'admin'
    };
    const question = await questionService.createQuestion(data);
    return success(res, question, 'Question created successfully', 201);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createQuestion,
  bulkImport,
  getQuestions,
  getQuestionById,
  getQuestionVersion,
  activateQuestion,
  archiveQuestion
};
