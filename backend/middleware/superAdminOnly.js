const SUPER_ADMIN_ROLES = ['SUPERADMIN', 'SUPER_ADMIN'];

module.exports = (req, res, next) => {
  const role = (req.user?.role || '').toUpperCase();
  const isSuper = SUPER_ADMIN_ROLES.includes(role) || req.user?.isSuperAdmin === true;

  if (!req.user || !isSuper) {
    return res.status(403).json({
      success: false,
      message: 'Access denied: Super Administrator privileges required.',
      code: 'SUPER_ADMIN_REQUIRED'
    });
  }

  next();
};
