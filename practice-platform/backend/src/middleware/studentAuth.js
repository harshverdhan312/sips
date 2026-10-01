const AppError = require('../utils/appError');

/**
 * Development Student Identity Middleware / Adapter
 * Extracts student identity strictly from trusted headers / token context.
 * In development / testing:
 *   - 'x-student-id' (required)
 *   - 'x-college-id' (required)
 * Sets req.user = { id, collegeId, role: 'STUDENT' }
 * Rejects unauthenticated requests with 401.
 * Ensures body parameters cannot forge student or college identity.
 */
function studentAuth(req, res, next) {
  let studentId = req.headers['x-student-id'];
  let collegeId = req.headers['x-college-id'];

  // Support Bearer token formatted as "Bearer studentId:collegeId" or "Bearer studentId"
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    if (token.includes(':')) {
      const parts = token.split(':');
      if (!studentId) studentId = parts[0];
      if (!collegeId) collegeId = parts[1];
    } else if (!studentId) {
      studentId = token;
    }
  }

  if (!studentId || typeof studentId !== 'string' || studentId.trim().length === 0) {
    return next(
      new AppError('Authentication required. Missing student identity header (x-student-id).', 401, {
        code: 'AUTHENTICATION_REQUIRED'
      })
    );
  }

  if (!collegeId || typeof collegeId !== 'string' || collegeId.trim().length === 0) {
    return next(
      new AppError('Authentication required. Missing institution context header (x-college-id).', 401, {
        code: 'TENANT_CONTEXT_REQUIRED'
      })
    );
  }

  req.user = {
    id: studentId.trim(),
    collegeId: collegeId.trim(),
    role: 'STUDENT'
  };

  // Sanitization: delete any attempt body overrides to ensure server-side authority
  if (req.body && typeof req.body === 'object') {
    delete req.body.studentId;
    delete req.body.collegeId;
  }

  next();
}

module.exports = studentAuth;
