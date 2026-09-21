const ALLOWED_ADMIN_ROLES = ['COLLEGE_ADMIN', 'ADMIN', 'SUPERADMIN'];

module.exports = (req, res, next) => {
  if (!req.user || !ALLOWED_ADMIN_ROLES.includes(req.user.role)) {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};
