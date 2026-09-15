const College = require('../models/College');
const Student = require('../models/Student');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

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
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // 1. Extract domain from email
    const parts = email.toLowerCase().trim().split('@');
    if (parts.length !== 2) {
      return res.status(400).json({ message: 'Invalid email format' });
    }
    const domain = parts[1];

    // 2. Find college by domain
    const college = await College.findOne({ acceptedDomains: domain });
    if (!college) {
      return res.status(401).json({ 
        message: 'This email domain is not registered with any college.' 
      });
    }

    // 3. Check if this is an admin login
    if (email.toLowerCase().trim() === college.adminEmail) {
      const isMatch = await bcrypt.compare(password, college.masterPasswordHash);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const token = generateToken({
        id: college._id,
        role: 'COLLEGE_ADMIN',
        collegeId: college._id,
        collegeSlug: college.slug
      });

      return res.json({
        token,
        role: 'COLLEGE_ADMIN',
        collegeSlug: college.slug,
        collegeName: college.name,
        userId: college._id
      });
    }

    // 4. Student login
    const student = await Student.findOne({ 
      email: email.toLowerCase().trim(), 
      collegeId: college._id 
    });

    if (!student) {
      return res.status(401).json({ 
        message: 'You are not authorized by your college.' 
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

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};
