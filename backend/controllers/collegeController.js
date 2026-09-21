const College = require('../models/College');
const Student = require('../models/Student');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { parseCSV } = require('../utils/csvParser');
const memoryDb = require('../utils/memoryDb');

/**
 * POST /api/auth/register-college
 * Public endpoint — registers a new college tenant
 */
exports.registerCollege = async (req, res) => {
  try {
    const { name, slug, adminEmail, masterPassword, acceptedDomains } = req.body;

    // Validate required fields
    if (!name || !adminEmail || !masterPassword) {
      return res.status(400).json({ 
        message: 'Name, admin email, and master password are required' 
      });
    }

    if (masterPassword.length < 4) {
      return res.status(400).json({
        message: 'Password must be at least 4 characters long'
      });
    }

    // Auto-sanitize slug (lowercase, alphanumeric, hyphens)
    const cleanSlug = (slug || name || 'college')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    // Normalize accepted domains
    const rawDomains = Array.isArray(acceptedDomains) 
      ? acceptedDomains 
      : String(acceptedDomains || '').split(',');
    
    const normalizedDomains = rawDomains
      .map(d => d.toLowerCase().trim().replace(/^@/, ''))
      .filter(Boolean);

    const emailParts = adminEmail.toLowerCase().trim().split('@');
    if (emailParts.length !== 2) {
      return res.status(400).json({ message: 'Invalid admin email address format' });
    }
    const adminDomain = emailParts[1];

    // Admin domain must match one of the accepted domains
    if (!normalizedDomains.includes(adminDomain)) {
      return res.status(400).json({ 
        message: `Admin email domain must match one of the accepted domains (${normalizedDomains.join(', ')})` 
      });
    }

    const salt = await bcrypt.genSalt(10);
    const masterPasswordHash = await bcrypt.hash(masterPassword, salt);
    const config = require('../config');

    // 1. Mongoose Connected Mode
    if (memoryDb.isMongoConnected()) {
      const existingSlug = await College.findOne({ slug: cleanSlug });
      if (existingSlug) {
        return res.status(400).json({ 
          message: `Institution slug "${cleanSlug}" is already registered. Please choose a different slug or sign in.` 
        });
      }

      const existingDomain = await College.findOne({ 
        acceptedDomains: { $in: normalizedDomains } 
      });
      if (existingDomain && existingDomain.adminEmail !== adminEmail.toLowerCase().trim()) {
        return res.status(400).json({ 
          message: 'One or more of these domains are already registered by another institution.' 
        });
      }

      const college = new College({
        name: name.trim(),
        slug: cleanSlug,
        adminEmail: adminEmail.toLowerCase().trim(),
        masterPasswordHash,
        acceptedDomains: normalizedDomains
      });

      await college.save();

      const token = jwt.sign(
        {
          id: college._id,
          role: 'COLLEGE_ADMIN',
          collegeId: college._id,
          collegeSlug: college.slug,
          email: college.adminEmail
        },
        config.jwtSecret,
        { expiresIn: config.jwtExpiresIn }
      );

      return res.status(201).json({ 
        success: true,
        message: 'College registered successfully',
        token,
        role: 'COLLEGE_ADMIN',
        collegeSlug: college.slug,
        collegeName: college.name,
        userId: college._id
      });
    }

    // 2. Resilient In-Memory Mode (when MongoDB is offline)
    const existingMemorySlug = memoryDb.findCollegeBySlug(cleanSlug);
    if (existingMemorySlug && existingMemorySlug.adminEmail !== adminEmail.toLowerCase().trim()) {
      return res.status(400).json({ 
        message: `Institution slug "${cleanSlug}" is already registered. Please sign in or use a different slug.` 
      });
    }

    const memoryCollege = memoryDb.saveCollege({
      name: name.trim(),
      slug: cleanSlug,
      adminEmail: adminEmail.toLowerCase().trim(),
      masterPasswordHash,
      acceptedDomains: normalizedDomains
    });

    const token = jwt.sign(
      {
        id: memoryCollege._id,
        role: 'COLLEGE_ADMIN',
        collegeId: memoryCollege._id,
        collegeSlug: memoryCollege.slug,
        email: memoryCollege.adminEmail
      },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );

    return res.status(201).json({ 
      success: true,
      message: 'College registered successfully',
      token,
      role: 'COLLEGE_ADMIN',
      collegeSlug: memoryCollege.slug,
      collegeName: memoryCollege.name,
      userId: memoryCollege._id
    });

  } catch (error) {
    console.error('Registration error:', error);
    if (error.code === 11000) {
      return res.status(409).json({ message: 'College name, slug, or domain already exists. Please choose another.' });
    }
    res.status(500).json({ message: 'Something went wrong on the server. Please try again later.' });
  }
};

/**
 * POST /api/college/upload-students
 * Admin-only — uploads students via CSV text or parsed array
 */
exports.uploadStudents = async (req, res) => {
  try {
    const collegeId = req.collegeId;

    if (!memoryDb.isMongoConnected()) {
      const college = memoryDb.findCollegeById(collegeId);
      if (!college) {
        return res.status(404).json({ message: 'College not found' });
      }

      let studentsData;
      let parseErrors = [];

      if (req.body.csvText) {
        const parsed = parseCSV(req.body.csvText);
        studentsData = parsed.students;
        parseErrors = parsed.errors;
      } else if (req.body.students && Array.isArray(req.body.students)) {
        studentsData = req.body.students;
      } else {
        return res.status(400).json({ message: 'Provide csvText or students array' });
      }

      const results = { success: 0, failed: 0, errors: [...parseErrors], total: studentsData.length };
      const salt = await bcrypt.genSalt(10);

      for (const s of studentsData) {
        const domain = (s.email || '').toLowerCase().split('@')[1];
        if (college.acceptedDomains.length > 0 && !college.acceptedDomains.includes(domain)) {
          results.failed++;
          results.errors.push(`${s.email}: Domain "${domain}" not in accepted domains`);
          continue;
        }

        const existing = memoryDb.findStudentByEmail(s.email, collegeId);
        if (existing) {
          results.failed++;
          results.errors.push(`${s.email}: Already exists`);
          continue;
        }

        const passwordHash = await bcrypt.hash(s.rollNo, salt);
        memoryDb.saveStudent({
          collegeId,
          name: s.name.trim(),
          rollNo: s.rollNo.trim(),
          usn: s.usn || s.rollNo.trim(),
          email: s.email.toLowerCase().trim(),
          passwordHash,
          branch: s.branch || 'Computer Science & Engineering',
          batch: s.batch || '2025',
          cgpa: s.cgpa !== undefined ? s.cgpa : 7.5,
          skills: s.skills || []
        });
        results.success++;
      }

      return res.json(results);
    }

    const college = await College.findById(collegeId);
    if (!college) {
      return res.status(404).json({ message: 'College not found' });
    }

    let studentsData;
    let parseErrors = [];

    // Accept either raw CSV text or pre-parsed array
    if (req.body.csvText) {
      const parsed = parseCSV(req.body.csvText);
      studentsData = parsed.students;
      parseErrors = parsed.errors;
    } else if (req.body.students && Array.isArray(req.body.students)) {
      studentsData = req.body.students;
    } else {
      return res.status(400).json({ message: 'Provide csvText or students array' });
    }

    const results = { success: 0, failed: 0, errors: [...parseErrors], total: studentsData.length };

    for (const s of studentsData) {
      try {
        // Validate email domain
        const domain = s.email.toLowerCase().split('@')[1];
        if (!college.acceptedDomains.includes(domain)) {
          results.failed++;
          results.errors.push(`${s.email}: Domain "${domain}" not in accepted domains`);
          continue;
        }

        // Check duplicate
        const existing = await Student.findOne({ 
          email: s.email.toLowerCase(), 
          collegeId 
        });
        if (existing) {
          results.failed++;
          results.errors.push(`${s.email}: Already exists`);
          continue;
        }

        // Hash password (default = rollNo)
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(s.rollNo, salt);

        const student = new Student({
          collegeId,
          name: s.name.trim(),
          rollNo: s.rollNo.trim(),
          usn: s.usn || s.rollNo.trim(),
          email: s.email.toLowerCase().trim(),
          passwordHash,
          branch: s.branch || 'Computer Science & Engineering',
          batch: s.batch || '2025',
          cgpa: s.cgpa !== undefined ? s.cgpa : 7.5,
          skills: s.skills || [],
          github: '',
          resumeUrl: ''
        });

        await student.save();
        results.success++;
      } catch (err) {
        results.failed++;
        results.errors.push(`${s.email || 'unknown'}: ${err.message}`);
      }
    }

    res.json(results);
  } catch (error) {
    console.error('Upload students error:', error);
    res.status(500).json({ message: 'Something went wrong on the server. Please try again later.' });
  }
};

/**
 * GET /api/college/students
 * Admin-only — list all students for this college
 */
exports.getStudents = async (req, res) => {
  try {
    if (!memoryDb.isMongoConnected()) {
      const students = memoryDb.getStudents(req.collegeId);
      return res.json(students);
    }

    const students = await Student.find({ collegeId: req.collegeId })
      .select('-passwordHash')
      .sort({ name: 1 });
    res.json(students);
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({ message: 'Something went wrong on the server. Please try again later.' });
  }
};

/**
 * GET /api/college/info/:slug
 * Public — get college info by slug (for login page)
 */
exports.getCollegeBySlug = async (req, res) => {
  try {
    if (!memoryDb.isMongoConnected()) {
      const college = memoryDb.findCollegeBySlug(req.params.slug);
      if (!college) {
        return res.status(404).json({ message: 'College not found' });
      }
      return res.json({
        name: college.name,
        slug: college.slug,
        acceptedDomains: college.acceptedDomains
      });
    }

    const college = await College.findOne({ slug: req.params.slug })
      .select('name slug acceptedDomains');
    if (!college) {
      return res.status(404).json({ message: 'College not found' });
    }
    res.json(college);
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong on the server. Please try again later.' });
  }
};
