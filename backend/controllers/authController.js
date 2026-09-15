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

/**
 * POST /api/auth/register
 * Student self-registration (public)
 * Accepts: name, email, password, rollNo, usn, branch, batch, collegeSlug
 */
exports.register = async (req, res) => {
  try {
    const { name, email, password, rollNo, usn, branch, batch, collegeSlug } = req.body;

    // 1. Validation
    if (!name || !email || !password || (!rollNo && !usn)) {
      return res.status(400).json({
        message: 'Name, email, password, and roll number (or USN) are required'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: 'Password must be at least 6 characters long'
      });
    }

    const emailClean = email.toLowerCase().trim();
    const parts = emailClean.split('@');
    if (parts.length !== 2) {
      return res.status(400).json({ message: 'Invalid email format' });
    }
    const domain = parts[1];

    // 2. Find college by domain or fallback to collegeSlug
    let college = await College.findOne({ acceptedDomains: domain });
    if (!college && collegeSlug) {
      college = await College.findOne({ slug: collegeSlug.toLowerCase().trim() });
    }

    if (!college) {
      return res.status(400).json({
        message: `Email domain "@${domain}" is not registered with any institution in SIPS. Please register your college first or contact your placement cell.`
      });
    }

    const finalRollNo = (rollNo || usn).trim();

    // 3. Check for duplicates within this college
    const existing = await Student.findOne({
      $or: [
        { email: emailClean, collegeId: college._id },
        { rollNo: finalRollNo, collegeId: college._id }
      ]
    });

    if (existing) {
      if (existing.email === emailClean) {
        return res.status(409).json({ message: 'A student with this email is already registered.' });
      }
      return res.status(409).json({ message: 'A student with this roll number/USN is already registered.' });
    }

    // 4. Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 5. Create student
    const student = new Student({
      collegeId: college._id,
      name: name.trim(),
      rollNo: finalRollNo,
      usn: (usn || finalRollNo).trim(),
      email: emailClean,
      passwordHash,
      branch: (branch || 'Computer Science & Engineering').trim(),
      batch: (batch || '2025').trim(),
      placementStatus: 'UNPLACED',
      skills: []
    });

    await student.save();

    // 6. Generate JWT token
    const token = generateToken({
      id: student._id,
      role: 'STUDENT',
      collegeId: college._id,
      collegeSlug: college.slug
    });

    res.status(201).json({
      success: true,
      message: 'Student registered successfully',
      token,
      role: 'STUDENT',
      collegeSlug: college.slug,
      collegeName: college.name,
      userId: student._id,
      studentName: student.name,
      student: {
        id: student._id,
        name: student.name,
        rollNo: student.rollNo,
        usn: student.usn,
        email: student.email,
        branch: student.branch,
        batch: student.batch,
        placementStatus: student.placementStatus
      }
    });
  } catch (error) {
    console.error('Student registration error:', error);
    res.status(500).json({ message: 'Server error during student registration' });
  }
};

exports.registerStudent = exports.register;

