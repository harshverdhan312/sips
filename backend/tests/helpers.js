const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'sips-dev-secret-key-2025';

const createAdminToken = (collegeId = '507f1f77bcf86cd799439011', collegeSlug = 'test-college') => {
  return jwt.sign(
    {
      id: collegeId,
      role: 'COLLEGE_ADMIN',
      collegeId,
      collegeSlug,
      email: 'admin@testcollege.edu'
    },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
};

const createStudentToken = (
  studentId = '507f1f77bcf86cd799439022',
  collegeId = '507f1f77bcf86cd799439011',
  collegeSlug = 'test-college'
) => {
  return jwt.sign(
    {
      id: studentId,
      role: 'STUDENT',
      collegeId,
      collegeSlug,
      email: 'student@testcollege.edu'
    },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
};

module.exports = {
  createAdminToken,
  createStudentToken,
  JWT_SECRET
};
