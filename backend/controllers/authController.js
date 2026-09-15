const College = require('../models/College');
const Student = require('../models/Student');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const memoryDb = require('../utils/memoryDb');

const generateToken = (payload) => {
  const secret = process.env.JWT_SECRET || 'sips-dev-secret-key-2025';
  return jwt.sign(payload, secret, { expiresIn: '7d' });
};

/**
 * POST /api/auth/login
 * Domain-based authentication for both admin and student
 */
exports.login = async (req, res) => {
  try {
    const { email, identifier, password, collegeSlug } = req.body;
    const loginId = (email || identifier || '').toLowerCase().trim();

    if (!loginId || !password) {
      return res.status(400).json({ message: 'Email/ID and password are required' });
    }

    // ----------------------------------------------------
    // Resilient In-Memory Mode (when MongoDB is offline)
    // ----------------------------------------------------
    if (!memoryDb.isMongoConnected()) {
      if (loginId.includes('@')) {
        const parts = loginId.split('@');
        if (parts.length !== 2) {
          return res.status(400).json({ message: 'Invalid email format' });
        }
        const domain = parts[1];
        let college = memoryDb.findCollegeByDomain(domain) || (collegeSlug ? memoryDb.findCollegeBySlug(collegeSlug) : null);
        if (!college) {
          college = memoryDb.findCollegeByAdminEmail(loginId);
        }

        if (!college) {
          return res.status(401).json({ 
            message: 'This email domain is not registered with any college.' 
          });
        }

        if (loginId === college.adminEmail) {
          const isMatch = await bcrypt.compare(password, college.masterPasswordHash);
          if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
          }

          const token = generateToken({
            id: college._id,
            role: 'COLLEGE_ADMIN',
            collegeId: college._id,
            collegeSlug: college.slug,
            email: college.adminEmail
          });

          return res.json({
            token,
            role: 'COLLEGE_ADMIN',
            collegeSlug: college.slug,
            collegeName: college.name,
            userId: college._id
          });
        }

        const student = memoryDb.findStudentByEmail(loginId, college._id);
        if (!student) {
          return res.status(401).json({ 
            message: 'Student account not found in your institution. Please contact your Placement Cell.' 
          });
        }

        const isMatch = await bcrypt.compare(password, student.passwordHash);
        if (!isMatch) {
          return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = generateToken({
          id: student._id,
          role: 'STUDENT',
          collegeId: college._id,
          collegeSlug: college.slug
        });

        return res.json({
          token,
          role: 'STUDENT',
          collegeSlug: college.slug,
          collegeName: college.name,
          userId: student._id,
          studentName: student.name
        });
      }

      // Login by Roll No / USN
      const college = collegeSlug ? memoryDb.findCollegeBySlug(collegeSlug) : null;
      const student = memoryDb.findStudentByRollNo(loginId, college ? college._id : null);

      if (!student) {
        return res.status(401).json({ 
          message: 'No student found with this Roll Number or USN. Please contact your Placement Cell.' 
        });
      }

      const isMatch = await bcrypt.compare(password, student.passwordHash);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const studentCollege = memoryDb.findCollegeById(student.collegeId) || college;

      const token = generateToken({
        id: student._id,
        role: 'STUDENT',
        collegeId: student.collegeId,
        collegeSlug: studentCollege ? studentCollege.slug : ''
      });

      return res.json({
        token,
        role: 'STUDENT',
        collegeSlug: studentCollege ? studentCollege.slug : '',
        collegeName: studentCollege ? studentCollege.name : 'College',
        userId: student._id,
        studentName: student.name
      });
    }

    // 1. Check if loginId is an email address
    if (loginId.includes('@')) {
      const parts = loginId.split('@');
      if (parts.length !== 2) {
        return res.status(400).json({ message: 'Invalid email format' });
      }
      const domain = parts[1];

      // Find college by accepted domain, or fallback to adminEmail
      let college = await College.findOne({ acceptedDomains: domain });
      if (!college) {
        college = await College.findOne({ adminEmail: loginId });
      }

      if (!college) {
        return res.status(401).json({ 
          message: 'This email domain is not registered with any college.' 
        });
      }

      // Check if this is an admin login
      if (loginId === college.adminEmail) {
        const isMatch = await bcrypt.compare(password, college.masterPasswordHash);
        if (!isMatch) {
          return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = generateToken({
          id: college._id,
          role: 'COLLEGE_ADMIN',
          collegeId: college._id,
          collegeSlug: college.slug,
          email: college.adminEmail
        });

        return res.json({
          token,
          role: 'COLLEGE_ADMIN',
          collegeSlug: college.slug,
          collegeName: college.name,
          userId: college._id
        });
      }

      // Student login by email
      const student = await Student.findOne({ 
        email: loginId, 
        collegeId: college._id 
      });

      if (!student) {
        return res.status(401).json({ 
          message: 'Student account not found in your institution. Please contact your Placement Cell.' 
        });
      }

      const isMatch = await student.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const token = generateToken({
        id: student._id,
        role: 'STUDENT',
        collegeId: college._id,
        collegeSlug: college.slug
      });

      return res.json({
        token,
        role: 'STUDENT',
        collegeSlug: college.slug,
        collegeName: college.name,
        userId: student._id,
        studentName: student.name
      });
    }

    // 2. Otherwise, loginId is a Roll Number or USN
    const studentQuery = {
      $or: [
        { rollNo: new RegExp(`^${loginId}$`, 'i') },
        { usn: new RegExp(`^${loginId}$`, 'i') }
      ]
    };

    if (collegeSlug) {
      const col = await College.findOne({ slug: collegeSlug.toLowerCase().trim() });
      if (col) studentQuery.collegeId = col._id;
    }

    const student = await Student.findOne(studentQuery);
    if (!student) {
      return res.status(401).json({ 
        message: 'No student found with this Roll Number or USN. Please contact your Placement Cell.' 
      });
    }

    const isMatch = await student.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const college = await College.findById(student.collegeId);

    const token = generateToken({
      id: student._id,
      role: 'STUDENT',
      collegeId: student.collegeId,
      collegeSlug: college ? college.slug : ''
    });

    return res.json({
      token,
      role: 'STUDENT',
      collegeSlug: college ? college.slug : '',
      collegeName: college ? college.name : 'College',
      userId: student._id,
      studentName: student.name
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

/**
 * POST /api/auth/register
 * Student self-registration is disabled per institutional requirements.
 * Students are provisioned by the Placement Administrator.
 */
exports.register = async (req, res) => {
  return res.status(403).json({
    message: 'Student self-registration is disabled. Please contact your College Placement Administrator to obtain your login ID and password.'
  });
};

exports.registerStudent = exports.register;


