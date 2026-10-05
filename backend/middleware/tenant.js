const College = require('../models/College');

/**
 * Tenant isolation middleware.
 * For authenticated routes: validates that req.user.collegeId exists.
 * Sets req.collegeId for downstream controllers.
 */
module.exports = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  // Allow SUPERADMIN (global administrator)
  if (req.user.role === 'SUPERADMIN' || req.user.role === 'SUPER_ADMIN' || req.user.isSuperAdmin === true) {
    req.institutionId = req.user.institutionId || null;
    req.departmentId = req.user.departmentId || null;
    req.collegeId = req.user.collegeId || null;
    return next();
  }

  // Allow MAIN_UNIVERSITY_ADMIN with institution context
  if (req.user.role === 'MAIN_UNIVERSITY_ADMIN') {
    if (!req.user.institutionId) {
      return res.status(401).json({ message: 'Authentication required with institution context' });
    }
    req.institutionId = req.user.institutionId;
    req.collegeId = req.user.institutionId;
    return next();
  }

  // For department admin or student, require department/college context
  const activeTenantId = req.user.departmentId || req.user.collegeId;
  if (!activeTenantId) {
    return res.status(401).json({ message: 'Authentication required with department/college context' });
  }

  req.institutionId = req.user.institutionId || null;
  req.departmentId = req.user.departmentId || activeTenantId;
  req.collegeId = activeTenantId;
  next();
};
