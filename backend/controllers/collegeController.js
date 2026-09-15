const College = require('../models/College');
const Student = require('../models/Student');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { parseCSV } = require('../utils/csvParser');

/**
 * POST /api/auth/register-college
 * Public endpoint — registers a new college tenant
 */
exports.registerCollege = async (req, res) => {
  try {
    const { name, slug, adminEmail, masterPassword, acceptedDomains } = req.body;

    // Validate required fields
    if (!name || !slug || !adminEmail || !masterPassword || !acceptedDomains?.length) {
      return res.status(400).json({ 
        message: 'All fields are required: name, slug, adminEmail, masterPassword, acceptedDomains' 
      });
    }

    // Validate slug format
    if (!/^[a-z0-9-]+$/.test(slug)) {
      return res.status(400).json({ 
        message: 'Slug must contain only lowercase letters, numbers, and hyphens' 
      });
    }

    // Validate admin email domain matches one of the accepted domains
    const adminDomain = adminEmail.toLowerCase().split('@')[1];
    const normalizedDomains = acceptedDomains.map(d => d.toLowerCase().trim());
    
    if (!normalizedDomains.includes(adminDomain)) {
      return res.status(400).json({ 
        message: 'Admin email domain must match one of the accepted domains' 
      });
    }

    // Check slug uniqueness
    const existingSlug = await College.findOne({ slug: slug.toLowerCase() });
    if (existingSlug) {
      return res.status(400).json({ message: 'This slug is already taken' });
    }

    // Check domain uniqueness across all colleges
    const existingDomain = await College.findOne({ 
      acceptedDomains: { $in: normalizedDomains } 
    });
    if (existingDomain) {
      return res.status(400).json({ 
        message: 'One or more domains are already registered by another college' 
      });
    }

    // Hash master password
    const salt = await bcrypt.genSalt(12);
    const masterPasswordHash = await bcrypt.hash(masterPassword, salt);

    const college = new College({
      name: name.trim(),
      slug: slug.toLowerCase().trim(),
      adminEmail: adminEmail.toLowerCase().trim(),
      masterPasswordHash,
      acceptedDomains: normalizedDomains
    });

    await college.save();

    const secret = process.env.JWT_SECRET || 'sips-dev-secret-key-2025';
    const token = jwt.sign(
      {
        id: college._id,
        role: 'COLLEGE_ADMIN',
        collegeId: college._id,
        collegeSlug: college.slug,
        email: college.adminEmail
      },
      secret,
      { expiresIn: '7d' }
    );

    res.status(201).json({ 
      success: true,
      message: 'College registered successfully',
      token,
      role: 'COLLEGE_ADMIN',
      collegeSlug: college.slug,
      collegeName: college.name,
      userId: college._id
    });
  } catch (error) {
    console.error('Registration error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'College name, slug, or domain already exists' });
    }
    res.status(500).json({ message: 'Server error during registration' });
  }
};

/**
 * POST /api/college/upload-students
 * Admin-only — uploads students via CSV text or parsed array
 */
exports.uploadStudents = async (req, res) => {
  try {
    const collegeId = req.collegeId;
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
    res.status(500).json({ message: 'Server error during student upload' });
  }
};

/**
 * GET /api/college/students
 * Admin-only — list all students for this college
 */
exports.getStudents = async (req, res) => {
  try {
    const students = await Student.find({ collegeId: req.collegeId })
      .select('-passwordHash')
      .sort({ name: 1 });
    res.json(students);
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * GET /api/college/info/:slug
 * Public — get college info by slug (for login page)
 */
exports.getCollegeBySlug = async (req, res) => {
  try {
    const college = await College.findOne({ slug: req.params.slug })
      .select('name slug acceptedDomains');
    if (!college) {
      return res.status(404).json({ message: 'College not found' });
    }
    res.json(college);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
