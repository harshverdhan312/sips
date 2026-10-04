const jwt = require('jsonwebtoken');
const config = require('../config');
const AppError = require('../utils/appError');

/**
 * Student Authentication Middleware
 * 
 * Production path:
 * - Requires 'Authorization: Bearer <sips_jwt>'
 * - Verifies token cryptographically using server-side config.jwtSecret (HS256)
 * - Extracts { id, collegeId, role, collegeSlug }
 * - Rejects non-student roles and forged client headers
 * - Sets req.user = { id, collegeId, role, collegeSlug }
 * 
 * Development / Test fallback (!config.isProduction):
 * - Accepts legacy 'Bearer studentId:collegeId' or 'x-student-id' / 'x-college-id' headers
 *   strictly when a standard JWT is not supplied.
 * - In production mode, all legacy fallbacks are strictly rejected.
 */
function studentAuth(req, res, next) {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];

  // 1. If Authorization header is provided
  if (authHeader) {
    const trimmedHeader = typeof authHeader === 'string' ? authHeader.trim() : '';
    
    // Check for Bearer scheme (case-insensitive)
    if (!trimmedHeader.toLowerCase().startsWith('bearer ') && trimmedHeader.toLowerCase() !== 'bearer') {
      return next(
        new AppError('Authentication required. Invalid authorization scheme, expected Bearer token.', 401, {
          code: 'INVALID_AUTH_SCHEME'
        })
      );
    }

    const token = trimmedHeader.length > 6 ? trimmedHeader.substring(6).trim() : '';
    if (!token) {
      return next(
        new AppError('Authentication required. Empty Bearer token provided.', 401, {
          code: 'AUTHENTICATION_REQUIRED'
        })
      );
    }

    // Check if token has JWT structure (3 base64url parts separated by dot)
    const isJwtStructure = token.split('.').length === 3;

    if (isJwtStructure || config.isProduction) {
      try {
        const decoded = jwt.verify(token, config.jwtSecret, { algorithms: ['HS256'] });

        if (!decoded || typeof decoded !== 'object') {
          return next(
            new AppError('Invalid token payload.', 401, {
              code: 'INVALID_TOKEN'
            })
          );
        }

        const studentId = decoded.id || decoded.userId || decoded.sub;
        const collegeId = decoded.collegeId;
        const role = (decoded.role || '').toUpperCase();
        const collegeSlug = decoded.collegeSlug || '';

        if (!studentId || typeof studentId !== 'string' || !studentId.trim()) {
          return next(
            new AppError('Invalid token payload. Missing student identity claim (id).', 401, {
              code: 'INVALID_TOKEN_CLAIMS'
            })
          );
        }

        if (!collegeId || typeof collegeId !== 'string' || !collegeId.trim()) {
          return next(
            new AppError('Invalid token payload. Missing college context claim (collegeId).', 401, {
              code: 'INVALID_TOKEN_CLAIMS'
            })
          );
        }

        // Student-only route enforcement
        if (role !== 'STUDENT') {
          return next(
            new AppError(`Access denied. Route requires STUDENT role, found '${decoded.role || 'NONE'}'.`, 403, {
              code: 'FORBIDDEN_ROLE'
            })
          );
        }

        req.user = {
          id: studentId.trim(),
          collegeId: collegeId.trim(),
          role: 'STUDENT',
          collegeSlug: collegeSlug.trim()
        };

        // Sanitization: strip client body parameters to guarantee server-side authority
        if (req.body && typeof req.body === 'object') {
          delete req.body.studentId;
          delete req.body.collegeId;
        }

        return next();
      } catch (err) {
        if (err.name === 'TokenExpiredError') {
          return next(
            new AppError('Authentication token has expired. Please log in again.', 401, {
              code: 'TOKEN_EXPIRED'
            })
          );
        }
        return next(
          new AppError('Invalid authentication token signature or malformed token.', 401, {
            code: 'INVALID_TOKEN'
          })
        );
      }
    }

    // Non-production fallback for legacy Bearer token (e.g. "Bearer studentId:collegeId")
    if (!config.isProduction) {
      let devStudentId = null;
      let devCollegeId = req.headers['x-college-id'];

      if (token.includes(':')) {
        const parts = token.split(':');
        devStudentId = parts[0];
        devCollegeId = parts[1] || devCollegeId;
      } else {
        devStudentId = token;
      }

      if (devStudentId && devCollegeId) {
        req.user = {
          id: devStudentId.trim(),
          collegeId: devCollegeId.trim(),
          role: 'STUDENT',
          collegeSlug: ''
        };

        if (req.body && typeof req.body === 'object') {
          delete req.body.studentId;
          delete req.body.collegeId;
        }

        return next();
      }
    }
  }

  // 2. Fallback to legacy dev headers strictly in non-production environments
  if (!config.isProduction) {
    const studentId = req.headers['x-student-id'];
    const collegeId = req.headers['x-college-id'];

    if (!studentId || typeof studentId !== 'string' || !studentId.trim()) {
      return next(
        new AppError('Authentication required. Missing student identity header (x-student-id).', 401, {
          code: 'AUTHENTICATION_REQUIRED'
        })
      );
    }

    if (!collegeId || typeof collegeId !== 'string' || !collegeId.trim()) {
      return next(
        new AppError('Authentication required. Missing institution context header (x-college-id).', 401, {
          code: 'TENANT_CONTEXT_REQUIRED'
        })
      );
    }

    req.user = {
      id: studentId.trim(),
      collegeId: collegeId.trim(),
      role: 'STUDENT',
      collegeSlug: ''
    };

    if (req.body && typeof req.body === 'object') {
      delete req.body.studentId;
      delete req.body.collegeId;
    }

    return next();
  }

  // 3. Reject unauthenticated request in production
  return next(
    new AppError('Authentication required. Missing Bearer token in Authorization header.', 401, {
      code: 'AUTHENTICATION_REQUIRED'
    })
  );
}

module.exports = studentAuth;
