const College = require('../models/College');

/**
 * Tenant isolation middleware.
 * For authenticated routes: validates that req.user.collegeId exists.
 * Sets req.collegeId for downstream controllers.
 */
module.exports = (req, res, next) => {
  if (!req.user || !req.user.collegeId) {
    return res.status(401).json({ message: 'Authentication required with college context' });
  }
  req.collegeId = req.user.collegeId;
  next();
};
