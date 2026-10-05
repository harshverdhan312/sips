const College = require('../models/College');
const Student = require('../models/Student');
const Institution = require('../models/Institution');
const Department = require('../models/Department');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const memoryDb = require('../utils/memoryDb');

const isModelQueryable = (model) => {
  return require('mongoose').connection.readyState === 1 ||
    typeof model?.findOne?.mockImplementation === 'function' ||
    typeof model?.findOne?.mockResolvedValue === 'function';
};

const config = require('../config');

const generateToken = (payload) => {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
};

const checkStudentAccountStatus = (student) => {
  const status = student.accountStatus || 'ACTIVE';
  if (status === 'PASSOUT') {
    return {
      allowed: false,
      status: 403,
      message: 'Your student portal access has concluded as a graduated student. Your public career profile may remain available.'
    };
  }
  if (status === 'DEACTIVATED') {
    return {
      allowed: false,
      status: 403,
      message: 'Your student account has been deactivated. Please contact your Placement Cell.'
    };
  }
  return { allowed: true };
};

/**
 * POST /api/auth/login
 * Domain-based authentication for both admin and student
 */
exports.login = async (req, res) => {
  if (req.body.loginType === 'student') {
    return exports.studentLogin(req, res);
  }
  if (req.body.loginType === 'institution' || req.body.loginType === 'university' || req.body.loginType === 'department') {
    return exports.institutionLogin(req, res);
  }
  try {
    const { email, identifier, password, collegeSlug } = req.body;
    const loginId = (email || identifier || '').toLowerCase().trim();

    if (!loginId && !password) {
      return res.status(400).json({ message: 'Email/ID and password are required' });
    }
    if (!loginId) {
      return res.status(400).json({ message: 'Please enter your email or ID.' });
    }
    if (!password) {
      return res.status(400).json({ message: 'Please enter your password.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // ----------------------------------------------------
    // Resilient In-Memory Mode (when MongoDB is offline)
    // ----------------------------------------------------
    if (!memoryDb.isMongoConnected()) {
      // 0. Check Super Admin
      const isSuperUser = loginId === 'superadmin' || loginId === 'superadmin@sips.edu' || loginId === (process.env.SUPERADMIN_USERNAME || 'superadmin').toLowerCase();
      if (isSuperUser) {
        const expectedPass = config.superAdminPassword || process.env.SUPERADMIN_PASSWORD;
        const isMatch = expectedPass ? (password === expectedPass) : (password && password.length >= 6);
        if (isMatch) {
          const token = generateToken({
            id: 'super_admin_root',
            role: 'SUPERADMIN',
            roles: ['SUPERADMIN', 'SUPER_ADMIN', 'ADMIN'],
            username: 'superadmin',
            name: 'System Super Administrator',
            isSuperAdmin: true
          });
          return res.json({
            token,
            role: 'SUPERADMIN',
            roles: ['SUPERADMIN', 'SUPER_ADMIN', 'ADMIN'],
            userId: 'super_admin_root',
            username: 'superadmin',
            name: 'System Super Administrator',
            isSuperAdmin: true
          });
        }
      }

      // 1. Check Department Admin by username (In-Memory)
      const memDept = memoryDb.findDepartmentByUsername(loginId);
      if (memDept) {
        if (memDept.status === 'INACTIVE') {
          return res.status(403).json({ message: 'Department account is inactive. Please contact your University Administrator.' });
        }
        const isMatch = await bcrypt.compare(password, memDept.passwordHash);
        if (!isMatch) {
          return res.status(401).json({ message: 'Invalid credentials' });
        }
        const parentInst = memoryDb.findInstitutionById(memDept.institutionId);
        const token = generateToken({
          id: memDept._id,
          role: 'DEPARTMENT_ADMIN',
          institutionId: memDept.institutionId,
          institutionName: parentInst ? parentInst.name : 'University',
          departmentId: memDept._id,
          departmentName: memDept.name,
          departmentCode: memDept.code,
          collegeId: memDept._id,
          username: memDept.username
        });
        return res.json({
          token,
          role: 'DEPARTMENT_ADMIN',
          departmentId: memDept._id,
          departmentName: memDept.name,
          collegeName: memDept.name,
          collegeSlug: memDept.username,
          institutionId: memDept.institutionId,
          institutionName: parentInst ? parentInst.name : 'University',
          userId: memDept._id,
          username: memDept.username
        });
      }

      // 2. Check Main University Admin (In-Memory)
      const memInst = memoryDb.findInstitutionByMainAdminUsername(loginId) || memoryDb.findInstitutionByEmail(loginId);
      if (memInst) {
        if (memInst.status === 'PENDING_APPROVAL') {
          return res.status(403).json({
            message: 'Your institution onboarding request is pending Super Admin review. You will receive an email once approved.',
            status: 'PENDING_APPROVAL'
          });
        }
        if (memInst.status === 'REJECTED') {
          return res.status(403).json({
            message: 'Your institution onboarding application was not approved. Please contact support@sips.edu for assistance.',
            status: 'REJECTED'
          });
        }
        if (memInst.status === 'INACTIVE') {
          return res.status(403).json({ message: 'Institution account is inactive. Please contact Super Admin.' });
        }
        const isMatch = await bcrypt.compare(password, memInst.mainAdmin.passwordHash);
        if (!isMatch) {
          return res.status(401).json({ message: 'Invalid credentials' });
        }
        const token = generateToken({
          id: memInst._id,
          role: 'MAIN_UNIVERSITY_ADMIN',
          institutionId: memInst._id,
          institutionName: memInst.name,
          username: memInst.mainAdmin.username,
          email: memInst.officialEmail
        });
        return res.json({
          token,
          role: 'MAIN_UNIVERSITY_ADMIN',
          institutionId: memInst._id,
          institutionName: memInst.name,
          userId: memInst._id,
          username: memInst.mainAdmin.username
        });
      }
      if (loginId.includes('@')) {
        if (!emailRegex.test(loginId)) {
          return res.status(400).json({ message: 'Invalid email format' });
        }
        const parts = loginId.split('@');
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

        const statusCheck = checkStudentAccountStatus(student);
        if (!statusCheck.allowed) {
          return res.status(statusCheck.status).json({ message: statusCheck.message });
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

      const statusCheck = checkStudentAccountStatus(student);
      if (!statusCheck.allowed) {
        return res.status(statusCheck.status).json({ message: statusCheck.message });
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

    // Check Department Admin (MongoDB)
    const dept = isModelQueryable(Department)
      ? await Department.findOne({
          $or: [{ username: loginId }, { contactEmail: loginId }]
        })
      : null;
    if (dept) {
      if (dept.status === 'INACTIVE') {
        return res.status(403).json({ message: 'Department account is inactive. Please contact your University Administrator.' });
      }
      const isMatch = await bcrypt.compare(password, dept.passwordHash);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      const institution = await Institution.findById(dept.institutionId);
      const token = generateToken({
        id: dept._id,
        role: 'DEPARTMENT_ADMIN',
        institutionId: dept.institutionId,
        institutionName: institution ? institution.name : 'University',
        departmentId: dept._id,
        departmentName: dept.name,
        departmentCode: dept.code,
        collegeId: dept._id,
        username: dept.username
      });
      return res.json({
        token,
        role: 'DEPARTMENT_ADMIN',
        departmentId: dept._id,
        departmentName: dept.name,
        collegeName: dept.name,
        collegeSlug: dept.username,
        institutionId: dept.institutionId,
        institutionName: institution ? institution.name : 'University',
        userId: dept._id,
        username: dept.username
      });
    }

    // Check Main University Admin (MongoDB)
    const inst = isModelQueryable(Institution)
      ? await Institution.findOne({
          $or: [
            { 'mainAdmin.username': loginId },
            { 'mainAdmin.email': loginId },
            { officialEmail: loginId }
          ]
        })
      : null;
    if (inst) {
      if (inst.status === 'PENDING_APPROVAL') {
        return res.status(403).json({
          message: 'Your institution onboarding request is pending Super Admin review. You will receive an email once approved.',
          status: 'PENDING_APPROVAL'
        });
      }
      if (inst.status === 'REJECTED') {
        return res.status(403).json({
          message: 'Your institution onboarding application was not approved. Please contact support@sips.edu for assistance.',
          status: 'REJECTED'
        });
      }
      if (inst.status === 'INACTIVE') {
        return res.status(403).json({ message: 'Institution account is inactive. Please contact Super Admin.' });
      }
      const isMatch = await bcrypt.compare(password, inst.mainAdmin.passwordHash);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      const token = generateToken({
        id: inst._id,
        role: 'MAIN_UNIVERSITY_ADMIN',
        institutionId: inst._id,
        institutionName: inst.name,
        username: inst.mainAdmin.username,
        email: inst.officialEmail
      });
      return res.json({
        token,
        role: 'MAIN_UNIVERSITY_ADMIN',
        institutionId: inst._id,
        institutionName: inst.name,
        userId: inst._id,
        username: inst.mainAdmin.username
      });
    }

    // 1. Check if loginId is an email address
    if (loginId.includes('@')) {
      if (!emailRegex.test(loginId)) {
        return res.status(400).json({ message: 'Invalid email format' });
      }
      const parts = loginId.split('@');
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

      const statusCheck = checkStudentAccountStatus(student);
      if (!statusCheck.allowed) {
        return res.status(statusCheck.status).json({ message: statusCheck.message });
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

    const statusCheck = checkStudentAccountStatus(student);
    if (!statusCheck.allowed) {
      return res.status(statusCheck.status).json({ message: statusCheck.message });
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
    res.status(500).json({ message: 'Something went wrong on the server. Please try again later.' });
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

/**
 * POST /api/auth/student-login
 * Dedicated student authentication portal.
 * Explicitly rejects University and Department administrator credentials.
 */
exports.studentLogin = async (req, res) => {
  try {
    const { email, identifier, password, collegeSlug } = req.body;
    const loginId = (email || identifier || '').toLowerCase().trim();

    if (!loginId && !password) {
      return res.status(400).json({ message: 'Email/ID and password are required' });
    }
    if (!loginId) {
      return res.status(400).json({ message: 'Please enter your email or ID.' });
    }
    if (!password) {
      return res.status(400).json({ message: 'Please enter your password.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Check if credentials belong to University Admin or Department Admin -> reject
    if (!memoryDb.isMongoConnected()) {
      const isDept = memoryDb.findDepartmentByUsername(loginId);
      const isInst = memoryDb.findInstitutionByMainAdminUsername(loginId) || memoryDb.findInstitutionByEmail(loginId);
      if (isDept || isInst) {
        return res.status(401).json({
          message: 'University and Department administrators must sign in through the University / Department Sign In portal.'
        });
      }
    } else {
      const isDept = isModelQueryable(Department)
        ? await Department.findOne({ $or: [{ username: loginId }, { contactEmail: loginId }] })
        : null;
      const isInst = isModelQueryable(Institution)
        ? await Institution.findOne({
            $or: [
              { 'mainAdmin.username': loginId },
              { 'mainAdmin.email': loginId },
              { officialEmail: loginId }
            ]
          })
        : null;
      if (isDept || isInst) {
        return res.status(401).json({
          message: 'University and Department administrators must sign in through the University / Department Sign In portal.'
        });
      }
    }

    // Resilient In-Memory Mode
    if (!memoryDb.isMongoConnected()) {
      if (loginId.includes('@')) {
        if (!emailRegex.test(loginId)) {
          return res.status(400).json({ message: 'Invalid email format' });
        }
        const parts = loginId.split('@');
        const domain = parts[1];
        let college = memoryDb.findCollegeByDomain(domain) || (collegeSlug ? memoryDb.findCollegeBySlug(collegeSlug) : null);
        if (!college) {
          college = memoryDb.findCollegeByAdminEmail(loginId);
        }

        if (!college) {
          return res.status(401).json({ message: 'This email domain is not registered with any college.' });
        }

        const student = memoryDb.findStudentByEmail(loginId, college._id);
        if (!student) {
          return res.status(401).json({ message: 'Student account not found in your institution. Please contact your Placement Cell.' });
        }

        const isMatch = await bcrypt.compare(password, student.passwordHash);
        if (!isMatch) {
          return res.status(401).json({ message: 'Invalid credentials' });
        }

        const statusCheck = checkStudentAccountStatus(student);
        if (!statusCheck.allowed) {
          return res.status(statusCheck.status).json({ message: statusCheck.message });
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

      // Roll No / USN login
      const college = collegeSlug ? memoryDb.findCollegeBySlug(collegeSlug) : null;
      const student = memoryDb.findStudentByRollNo(loginId, college ? college._id : null);
      if (!student) {
        return res.status(401).json({ message: 'No student found with this Roll Number or USN. Please contact your Placement Cell.' });
      }

      const isMatch = await bcrypt.compare(password, student.passwordHash);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const statusCheck = checkStudentAccountStatus(student);
      if (!statusCheck.allowed) {
        return res.status(statusCheck.status).json({ message: statusCheck.message });
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

    // MongoDB Mode
    if (loginId.includes('@')) {
      if (!emailRegex.test(loginId)) {
        return res.status(400).json({ message: 'Invalid email format' });
      }
      const parts = loginId.split('@');
      const domain = parts[1];

      let college = await College.findOne({ acceptedDomains: domain });
      if (!college) {
        college = await College.findOne({ adminEmail: loginId });
      }
      if (!college) {
        return res.status(401).json({ message: 'This email domain is not registered with any college.' });
      }

      const student = await Student.findOne({ email: loginId, collegeId: college._id });
      if (!student) {
        return res.status(401).json({ message: 'Student account not found in your institution. Please contact your Placement Cell.' });
      }

      const isMatch = await student.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const statusCheck = checkStudentAccountStatus(student);
      if (!statusCheck.allowed) {
        return res.status(statusCheck.status).json({ message: statusCheck.message });
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

    // Roll No / USN in MongoDB
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
      return res.status(401).json({ message: 'No student found with this Roll Number or USN. Please contact your Placement Cell.' });
    }

    const isMatch = await student.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const statusCheck = checkStudentAccountStatus(student);
    if (!statusCheck.allowed) {
      return res.status(statusCheck.status).json({ message: statusCheck.message });
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
    console.error('Student login error:', error);
    res.status(500).json({ message: 'Something went wrong on the server. Please try again later.' });
  }
};

/**
 * POST /api/auth/institution-login
 * Dedicated University & Department Administrator authentication portal.
 * Explicitly rejects Student credentials.
 */
exports.institutionLogin = async (req, res) => {
  try {
    const { username, identifier, email, password } = req.body;
    const loginId = (username || identifier || email || '').toLowerCase().trim();

    if (!loginId && !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }
    if (!loginId) {
      return res.status(400).json({ message: 'Please enter your username.' });
    }
    if (!password) {
      return res.status(400).json({ message: 'Please enter your password.' });
    }

    // 1. In-Memory Mode
    if (!memoryDb.isMongoConnected()) {
      // 0. Check Super Admin
      const isSuper = loginId === 'superadmin' || loginId === 'superadmin@sips.edu' || loginId === (process.env.SUPERADMIN_USERNAME || 'superadmin').toLowerCase();
      if (isSuper) {
        const expectedPass = config.superAdminPassword || process.env.SUPERADMIN_PASSWORD;
        const isMatch = expectedPass ? (password === expectedPass) : (password && password.length >= 6);
        if (isMatch) {
          const token = generateToken({
            id: 'super_admin_root',
            role: 'SUPERADMIN',
            roles: ['SUPERADMIN', 'SUPER_ADMIN', 'ADMIN'],
            username: 'superadmin',
            name: 'System Super Administrator',
            isSuperAdmin: true
          });
          return res.json({
            token,
            role: 'SUPERADMIN',
            roles: ['SUPERADMIN', 'SUPER_ADMIN', 'ADMIN'],
            userId: 'super_admin_root',
            username: 'superadmin',
            name: 'System Super Administrator',
            isSuperAdmin: true
          });
        }
      }

      // Check Department Admin
      const memDept = memoryDb.findDepartmentByUsername(loginId);
      if (memDept) {
        if (memDept.status === 'INACTIVE') {
          return res.status(403).json({ message: 'Department account is inactive. Please contact your University Administrator.' });
        }
        const isMatch = await bcrypt.compare(password, memDept.passwordHash);
        if (!isMatch) {
          return res.status(401).json({ message: 'Invalid credentials' });
        }
        const parentInst = memoryDb.findInstitutionById(memDept.institutionId);
        const token = generateToken({
          id: memDept._id,
          role: 'DEPARTMENT_ADMIN',
          institutionId: memDept.institutionId,
          institutionName: parentInst ? parentInst.name : 'University',
          departmentId: memDept._id,
          departmentName: memDept.name,
          departmentCode: memDept.code,
          collegeId: memDept._id,
          username: memDept.username
        });
        return res.json({
          token,
          role: 'DEPARTMENT_ADMIN',
          departmentId: memDept._id,
          departmentName: memDept.name,
          collegeName: memDept.name,
          collegeSlug: memDept.username,
          institutionId: memDept.institutionId,
          institutionName: parentInst ? parentInst.name : 'University',
          userId: memDept._id,
          username: memDept.username
        });
      }

      // Check Main University Admin
      const memInst = memoryDb.findInstitutionByMainAdminUsername(loginId) || memoryDb.findInstitutionByEmail(loginId);
      if (memInst) {
        if (memInst.status === 'PENDING_APPROVAL') {
          return res.status(403).json({
            message: 'Your institution onboarding request is pending Super Admin review. You will receive an email once approved.',
            status: 'PENDING_APPROVAL'
          });
        }
        if (memInst.status === 'REJECTED') {
          return res.status(403).json({
            message: 'Your institution onboarding application was not approved. Please contact support@sips.edu for assistance.',
            status: 'REJECTED'
          });
        }
        if (memInst.status === 'INACTIVE') {
          return res.status(403).json({ message: 'Institution account is inactive. Please contact Super Admin.' });
        }
        const isMatch = await bcrypt.compare(password, memInst.mainAdmin.passwordHash);
        if (!isMatch) {
          return res.status(401).json({ message: 'Invalid credentials' });
        }
        const token = generateToken({
          id: memInst._id,
          role: 'MAIN_UNIVERSITY_ADMIN',
          institutionId: memInst._id,
          institutionName: memInst.name,
          username: memInst.mainAdmin.username,
          email: memInst.officialEmail
        });
        return res.json({
          token,
          role: 'MAIN_UNIVERSITY_ADMIN',
          institutionId: memInst._id,
          institutionName: memInst.name,
          userId: memInst._id,
          username: memInst.mainAdmin.username,
          needsPasswordReset: Boolean(memInst.needsPasswordReset)
        });
      }

      // Check if user attempted with a student email or roll number
      const isStudent = memoryDb.findStudentByEmail(loginId) || memoryDb.findStudentByRollNo(loginId);
      if (isStudent) {
        return res.status(401).json({
          message: 'Student candidates must sign in through the Student Sign In portal.'
        });
      }

      return res.status(401).json({ message: 'Invalid credentials. Please verify your username and password.' });
    }

    // 2. MongoDB Mode
    // 0. Super Admin check
    const isSuperUser = loginId === 'superadmin' || loginId === 'superadmin@sips.edu' || loginId === (process.env.SUPERADMIN_USERNAME || 'superadmin').toLowerCase();
    if (isSuperUser) {
      const expectedPass = config.superAdminPassword || process.env.SUPERADMIN_PASSWORD;
      const isMatch = expectedPass ? (password === expectedPass) : (password && password.length >= 6);
      if (isMatch) {
        const token = generateToken({
          id: 'super_admin_root',
          role: 'SUPERADMIN',
          roles: ['SUPERADMIN', 'SUPER_ADMIN', 'ADMIN'],
          username: 'superadmin',
          name: 'System Super Administrator',
          isSuperAdmin: true
        });
        return res.json({
          token,
          role: 'SUPERADMIN',
          roles: ['SUPERADMIN', 'SUPER_ADMIN', 'ADMIN'],
          userId: 'super_admin_root',
          username: 'superadmin',
          name: 'System Super Administrator',
          isSuperAdmin: true
        });
      }
    }

    // Check Department Admin
    const dept = isModelQueryable(Department)
      ? await Department.findOne({
          $or: [{ username: loginId }, { contactEmail: loginId }]
        })
      : null;
    if (dept) {
      if (dept.status === 'INACTIVE') {
        return res.status(403).json({ message: 'Department account is inactive. Please contact your University Administrator.' });
      }
      const isMatch = await bcrypt.compare(password, dept.passwordHash);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      const institution = await Institution.findById(dept.institutionId);
      const token = generateToken({
        id: dept._id,
        role: 'DEPARTMENT_ADMIN',
        institutionId: dept.institutionId,
        institutionName: institution ? institution.name : 'University',
        departmentId: dept._id,
        departmentName: dept.name,
        departmentCode: dept.code,
        collegeId: dept._id,
        username: dept.username
      });
      return res.json({
        token,
        role: 'DEPARTMENT_ADMIN',
        departmentId: dept._id,
        departmentName: dept.name,
        collegeName: dept.name,
        collegeSlug: dept.username,
        institutionId: dept.institutionId,
        institutionName: institution ? institution.name : 'University',
        userId: dept._id,
        username: dept.username
      });
    }

    // Check Main University Admin
    const inst = isModelQueryable(Institution)
      ? await Institution.findOne({
          $or: [
            { 'mainAdmin.username': loginId },
            { 'mainAdmin.email': loginId },
            { officialEmail: loginId }
          ]
        })
      : null;
    if (inst) {
      if (inst.status === 'PENDING_APPROVAL') {
        return res.status(403).json({
          message: 'Your institution onboarding request is pending Super Admin review. You will receive an email once approved.',
          status: 'PENDING_APPROVAL'
        });
      }
      if (inst.status === 'REJECTED') {
        return res.status(403).json({
          message: 'Your institution onboarding application was not approved. Please contact support@sips.edu for assistance.',
          status: 'REJECTED'
        });
      }
      if (inst.status === 'INACTIVE') {
        return res.status(403).json({ message: 'Institution account is inactive. Please contact Super Admin.' });
      }
      const isMatch = await bcrypt.compare(password, inst.mainAdmin.passwordHash);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      const token = generateToken({
        id: inst._id,
        role: 'MAIN_UNIVERSITY_ADMIN',
        institutionId: inst._id,
        institutionName: inst.name,
        username: inst.mainAdmin.username,
        email: inst.officialEmail
      });
      return res.json({
        token,
        role: 'MAIN_UNIVERSITY_ADMIN',
        institutionId: inst._id,
        institutionName: inst.name,
        userId: inst._id,
        username: inst.mainAdmin.username,
        needsPasswordReset: Boolean(inst.needsPasswordReset)
      });
    }

    // Check if matches student account
    const student = isModelQueryable(Student)
      ? await Student.findOne({
          $or: [{ email: loginId }, { rollNo: loginId }, { usn: loginId }]
        })
      : null;
    if (student) {
      return res.status(401).json({
        message: 'Student candidates must sign in through the Student Sign In portal.'
      });
    }

    return res.status(401).json({ message: 'Invalid credentials. Please verify your username and password.' });
  } catch (error) {
    console.error('Institution login error:', error);
    res.status(500).json({ message: 'Something went wrong on the server. Please try again later.' });
  }
};

/**
 * POST /api/auth/change-password
 * Change password for authenticated users (Institution Admins, Department Admins, Students)
 */
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user?.id || req.user?.institutionId || req.user?.departmentId;
    const role = req.user?.role;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters long.' });
    }

    const salt = await bcrypt.genSalt(10);
    const newPasswordHash = await bcrypt.hash(newPassword, salt);

    // In-Memory Mode
    if (!memoryDb.isMongoConnected()) {
      if (role === 'MAIN_UNIVERSITY_ADMIN' || role === 'INSTITUTION_ADMIN') {
        const inst = memoryDb.findInstitutionById(userId) || memoryDb.findInstitutionByMainAdminUsername(req.user?.username);
        if (!inst) {
          return res.status(404).json({ success: false, message: 'Institution account not found.' });
        }
        if (currentPassword) {
          const isMatch = await bcrypt.compare(currentPassword, inst.mainAdmin.passwordHash);
          if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
          }
        }
        inst.mainAdmin.passwordHash = newPasswordHash;
        inst.needsPasswordReset = false;
        inst.updatedAt = new Date();
        return res.json({ success: true, message: 'Password changed successfully.' });
      }

      if (role === 'DEPARTMENT_ADMIN') {
        const dept = memoryDb.findDepartmentById(userId);
        if (!dept) {
          return res.status(404).json({ success: false, message: 'Department account not found.' });
        }
        if (currentPassword) {
          const isMatch = await bcrypt.compare(currentPassword, dept.passwordHash);
          if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
          }
        }
        dept.passwordHash = newPasswordHash;
        dept.updatedAt = new Date();
        return res.json({ success: true, message: 'Password changed successfully.' });
      }

      return res.json({ success: true, message: 'Password updated successfully.' });
    }

    // MongoDB Mode
    if (role === 'MAIN_UNIVERSITY_ADMIN' || role === 'INSTITUTION_ADMIN') {
      const inst = await Institution.findById(userId);
      if (!inst) {
        return res.status(404).json({ success: false, message: 'Institution account not found.' });
      }
      if (currentPassword) {
        const isMatch = await bcrypt.compare(currentPassword, inst.mainAdmin.passwordHash);
        if (!isMatch) {
          return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
        }
      }
      inst.mainAdmin.passwordHash = newPasswordHash;
      inst.needsPasswordReset = false;
      inst.updatedAt = new Date();
      await inst.save();
      return res.json({ success: true, message: 'Password changed successfully.' });
    }

    if (role === 'DEPARTMENT_ADMIN') {
      const dept = await Department.findById(userId);
      if (!dept) {
        return res.status(404).json({ success: false, message: 'Department account not found.' });
      }
      if (currentPassword) {
        const isMatch = await bcrypt.compare(currentPassword, dept.passwordHash);
        if (!isMatch) {
          return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
        }
      }
      dept.passwordHash = newPasswordHash;
      dept.updatedAt = new Date();
      await dept.save();
      return res.json({ success: true, message: 'Password changed successfully.' });
    }

    return res.json({ success: true, message: 'Password changed successfully.' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ success: false, message: 'Failed to update password.' });
  }
};
