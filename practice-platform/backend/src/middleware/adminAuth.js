const jwt = require('jsonwebtoken');
const config = require('../config');
const AppError = require('../utils/appError');

const ALLOWED_ADMIN_ROLES = ['ADMIN', 'COLLEGE_ADMIN', 'SUPERADMIN', 'SUPER_ADMIN', 'PLACEMENT', 'STAFF'];

/**
 * Admin Authentication Middleware
 * 
 * Verifies JWT token and checks if user has administrative privileges.
 * In dev/test mode (!config.isProduction), allows dev admin headers or dev bearer tokens.
 */
function adminAuth(req, res, next) {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];

  // 1. If Authorization header is provided
  if (authHeader) {
    const trimmedHeader = typeof authHeader === 'string' ? authHeader.trim() : '';

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

        const userId = decoded.id || decoded.userId || decoded.sub;
        const role = (decoded.role || '').toUpperCase();
        const collegeId = decoded.collegeId || null;
        const collegeSlug = decoded.collegeSlug || '';

        if (!userId || typeof userId !== 'string' || !userId.trim()) {
          return next(
            new AppError('Invalid token payload. Missing user identity claim.', 401, {
              code: 'INVALID_TOKEN_CLAIMS'
            })
          );
        }

        if (!ALLOWED_ADMIN_ROLES.includes(role)) {
          return next(
            new AppError(`Access denied. Administrative role required, found '${decoded.role || 'NONE'}'.`, 403, {
              code: 'FORBIDDEN_ROLE'
            })
          );
        }

        req.user = {
          id: userId.trim(),
          collegeId: collegeId ? collegeId.trim() : null,
          role,
          collegeSlug: collegeSlug.trim()
        };

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

    // Dev/Test fallback for legacy Bearer token
    if (!config.isProduction) {
      const parts = token.split(':');
      const devUserId = parts[0];
      const devRole = (parts[1] || req.headers['x-user-role'] || 'ADMIN').toUpperCase();
      const devCollegeId = parts[2] || req.headers['x-college-id'] || null;

      if (!ALLOWED_ADMIN_ROLES.includes(devRole)) {
        return next(
          new AppError(`Access denied. Administrative role required, found '${devRole}'.`, 403, {
            code: 'FORBIDDEN_ROLE'
          })
        );
      }

      req.user = {
        id: devUserId.trim(),
        collegeId: devCollegeId ? devCollegeId.trim() : null,
        role: devRole,
        collegeSlug: ''
      };

      return next();
    }
  }

  // 2. Fallback to dev headers strictly in non-production environments
  if (!config.isProduction) {
    const adminId = req.headers['x-admin-id'] || req.headers['x-user-id'];
    const role = (req.headers['x-user-role'] || (req.headers['x-admin-id'] ? 'ADMIN' : '')).toUpperCase();
    const collegeId = req.headers['x-college-id'] || null;

    if (adminId && ALLOWED_ADMIN_ROLES.includes(role)) {
      req.user = {
        id: adminId.trim(),
        collegeId: collegeId ? collegeId.trim() : null,
        role,
        collegeSlug: ''
      };
      return next();
    }

    if (adminId && !ALLOWED_ADMIN_ROLES.includes(role)) {
      return next(
        new AppError(`Access denied. Administrative role required, found '${role || 'NONE'}'.`, 403, {
          code: 'FORBIDDEN_ROLE'
        })
      );
    }
  }

  // 3. Reject unauthenticated request
  return next(
    new AppError('Authentication required. Missing Bearer token in Authorization header.', 401, {
      code: 'AUTHENTICATION_REQUIRED'
    })
  );
}

module.exports = adminAuth;
