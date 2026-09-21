const mongoose = require('mongoose');

const MEMORY_ID_PREFIXES = ['std_', 'col_', 'job_', 'alt_', 'id_'];

/**
 * Check if a string is a valid ID (either MongoDB 24-hex ObjectId or memoryDb ID)
 */
function isValidId(id) {
  if (!id || typeof id !== 'string') return false;
  const trimmed = id.trim();
  if (!trimmed) return false;

  // MongoDB ObjectId check (24 hex characters)
  if (mongoose.Types.ObjectId.isValid(trimmed) && /^[0-9a-fA-F]{24}$/.test(trimmed)) {
    return true;
  }

  // MemoryDb fallback IDs
  if (MEMORY_ID_PREFIXES.some(prefix => trimmed.startsWith(prefix))) {
    return true;
  }

  return false;
}

/**
 * Middleware factory to validate an ID parameter in req.params
 * @param {string} paramName Name of the param in req.params (e.g. 'id')
 */
function validateObjectId(paramName = 'id') {
  return (req, res, next) => {
    const id = req.params[paramName];
    if (!id || !isValidId(id)) {
      return res.status(400).json({
        success: false,
        message: `Invalid resource identifier format: ${id || 'empty'}`
      });
    }
    next();
  };
}

/**
 * Middleware to sanitize and enforce bounds on pagination/query parameters
 */
function validatePagination(req, res, next) {
  if (req.query.page !== undefined) {
    const parsedPage = parseInt(req.query.page, 10);
    req.query.page = isNaN(parsedPage) || parsedPage < 1 ? 1 : parsedPage;
  }
  if (req.query.limit !== undefined) {
    const parsedLimit = parseInt(req.query.limit, 10);
    req.query.limit = isNaN(parsedLimit) || parsedLimit < 1 ? 20 : Math.min(100, parsedLimit);
  }
  next();
}

module.exports = {
  isValidId,
  validateObjectId,
  validatePagination
};
