const bulkImportService = require('../services/bulkImportService');
const adminQuestionService = require('../services/adminQuestionService');
const { success } = require('../utils/response');

/**
 * Handle single question creation
 * POST /api/admin/questions
 */
async function createQuestion(req, res, next) {
  try {
    const data = req.body;
    const context = {
      collegeId: req.user?.role === 'SUPERADMIN' || data.isGlobal ? null : (req.user?.collegeId || null),
      userId: req.user?.id || null,
      role: req.user?.role || null
    };

    const isCoding = (data.type === 'CODING' || data.format === 'CODING');
    const difficulty = (data.difficulty || 'MEDIUM').toUpperCase();
    const defaultMarks = difficulty === 'HARD' ? 100 : difficulty === 'MEDIUM' ? 50 : 20;

    const item = data.question ? data : {
      type: isCoding ? 'CODING' : 'MCQ',
      format: data.format || (isCoding ? 'CODING' : 'MULTIPLE_CHOICE'),
      difficulty: difficulty,
      category: data.category || 'General',
      subcategory: data.subcategory || null,
      tags: Array.isArray(data.tags) ? data.tags : [],
      sourceType: data.sourceType || 'MANUAL',
      sourceNamespace: data.sourceNamespace || 'custom',
      externalId: data.externalId || null,
      collegeId: context.collegeId,
      question: {
        title: data.title || '',
        statement: data.statement || '',
        options: data.options || null,
        correctAnswer: data.correctAnswer !== undefined ? data.correctAnswer : null,
        explanation: data.explanation || null
      },
      coding: isCoding ? {
        inputFormat: data.inputFormat || data.codingProblem?.inputFormat || null,
        outputFormat: data.outputFormat || data.codingProblem?.outputFormat || null,
        constraints: data.constraints || data.codingProblem?.constraints || null,
        timeLimitMs: data.timeLimitMs || data.codingProblem?.timeLimitMs || 2000,
        memoryLimitKb: data.memoryLimitKb || data.codingProblem?.memoryLimitKb || 128000,
        maxMarks: data.maxMarks || data.codingProblem?.maxMarks || defaultMarks,
        starterCode: data.starterCode || data.codingProblem?.starterCode || null,
        testCases: data.testCases || data.codingProblem?.testCases || []
      } : null
    };

    const result = await bulkImportService.importQuestions([item], context);
    if (result.errors && result.errors.length > 0 && result.inserted === 0 && result.versioned === 0) {
      return res.status(400).json({
        success: false,
        message: result.errors[0]?.reason || 'Failed to create question',
        errors: result.errors
      });
    }

    return success(res, result, 'Question created successfully', 201);
  } catch (error) {
    next(error);
  }
}

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
 * DELETE /api/admin/questions/:questionId
 * Delete a question and cascade child records
 */
async function deleteQuestion(req, res, next) {
  try {
    const { questionId } = req.params;
    const result = await adminQuestionService.deleteQuestion(questionId, req.user);
    return success(res, null, result.message, 200);
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/admin/questions/bulk-delete
 * Bulk delete questions
 */
async function bulkDelete(req, res, next) {
  try {
    const { ids } = req.body;
    const result = await adminQuestionService.bulkDeleteQuestions(ids, req.user);
    return success(res, result, result.message, 200);
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/admin/questions/bulk-activate
 * Bulk activate questions
 */
async function bulkActivate(req, res, next) {
  try {
    const { ids } = req.body;
    const result = await adminQuestionService.bulkActivateQuestions(ids, req.user);
    return success(res, result, result.message, 200);
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/admin/questions/bulk-archive
 * Bulk archive questions
 */
async function bulkArchive(req, res, next) {
  try {
    const { ids } = req.body;
    const result = await adminQuestionService.bulkArchiveQuestions(ids, req.user);
    return success(res, result, result.message, 200);
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
  archiveQuestion,
  deleteQuestion,
  bulkDelete,
  bulkActivate,
  bulkArchive
};
