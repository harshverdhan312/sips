const Student = require('../models/Student');
const memoryDb = require('../utils/memoryDb');
const logger = require('../utils/logger');

/**
 * Middleware: studentAccountAccess
 * Enforces immediate account lifecycle access checks for authenticated students (protecting against stale JWTs).
 * - Identifies authenticated student from req.user
 * - Checks current accountStatus in real-time
 * - Blocks PASSOUT students with 403 (student portal access concluded)
 * - Blocks DEACTIVATED students with 403 (account deactivated, contact Placement Cell)
 * - Passes through ACTIVE students (and defaults unassigned status to ACTIVE)
 * - Safely passes through non-student roles without database lookups
 */
module.exports = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'STUDENT') {
      return next();
    }

    const studentId = req.user.id;
    const collegeId = req.user.collegeId || req.collegeId;

    let student = null;

    if (!memoryDb.isMongoConnected()) {
      student = memoryDb.findStudentById(studentId);
    } else {
      student = await Student.findOne({
        _id: studentId,
        collegeId: collegeId
      }).select('accountStatus name email rollNo');
    }

    if (!student) {
      return res.status(401).json({
        message: 'Student account not found in institution or access has been revoked.'
      });
    }

    const accountStatus = student.accountStatus || 'ACTIVE';

    if (accountStatus === 'PASSOUT') {
      return res.status(403).json({
        message: 'Your student portal access has concluded as a graduated student. Your public career profile may remain available.'
      });
    }

    if (accountStatus === 'DEACTIVATED') {
      return res.status(403).json({
        message: 'Your student account has been deactivated. Please contact your Placement Cell.'
      });
    }

    req.studentAccount = student;
    next();
  } catch (error) {
    logger.error('studentAccountAccess middleware error:', error);
    res.status(500).json({ message: 'Error verifying student access credentials.' });
  }
};
