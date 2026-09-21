const path = require('path');
const fs = require('fs');
const College = require('../models/College');
const Student = require('../models/Student');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { parseCSV } = require('../utils/csvParser');
const memoryDb = require('../utils/memoryDb');
const config = require('../config');
const logger = require('../utils/logger');

/**
 * Helper to verify if a file has valid image magic bytes (JPEG, PNG, GIF, WEBP)
 */
function verifyImageMagicBytes(filePath) {
  try {
    const fd = fs.openSync(filePath, 'r');
    const buffer = Buffer.alloc(12);
    const bytesRead = fs.readSync(fd, buffer, 0, 12, 0);
    fs.closeSync(fd);

    if (bytesRead < 4) return false;

    // JPEG: FF D8 FF
    if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
      return true;
    }
    // PNG: 89 50 4E 47
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
      return true;
    }
    // GIF: 47 49 46 38 (GIF8)
    if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38) {
      return true;
    }
    // WEBP: RIFF....WEBP
    if (bytesRead >= 12 &&
        buffer.toString('ascii', 0, 4) === 'RIFF' &&
        buffer.toString('ascii', 8, 12) === 'WEBP') {
      return true;
    }

    return false;
  } catch (err) {
    logger.error('Error verifying image magic bytes:', err.message);
    return false;
  }
}

/**
 * Safely delete a file inside config.uploadDir
 */
function safeDeleteUploadFile(fileUrlOrName) {
  if (!fileUrlOrName || typeof fileUrlOrName !== 'string') return;
  try {
    const filename = path.basename(fileUrlOrName);
    const fullPath = path.join(config.uploadDir, filename);
    if (fullPath.startsWith(config.uploadDir) && fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      logger.info('Cleaned up previous file:', filename);
    }
  } catch (err) {
    logger.warn('Failed to clean up file:', err.message);
  }
}

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
      .select('name slug acceptedDomains logoUrl');
    if (!college) {
      return res.status(404).json({ message: 'College not found' });
    }
    res.json(college);
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong on the server. Please try again later.' });
  }
};

/**
 * GET /api/admin/college/profile
 * Admin-only — get authenticated college details including logoUrl and metadata
 */
exports.getCollegeProfile = async (req, res) => {
  try {
    if (!memoryDb.isMongoConnected() && !College.findById.mock) {
      const college = memoryDb.findCollegeById(req.collegeId);
      if (!college) {
        return res.status(404).json({ success: false, message: 'College profile not found' });
      }
      return res.status(200).json({
        success: true,
        college: {
          _id: college._id,
          name: college.name,
          slug: college.slug,
          adminEmail: college.adminEmail,
          acceptedDomains: college.acceptedDomains || [],
          logoUrl: college.logoUrl || null,
          code: college.code || '',
          address: college.address || '',
          city: college.city || '',
          state: college.state || '',
          website: college.website || '',
          contactEmail: college.contactEmail || '',
          contactPhone: college.contactPhone || '',
          establishedYear: typeof college.establishedYear === 'number' ? college.establishedYear : null,
          createdAt: college.createdAt
        }
      });
    }

    const college = await College.findById(req.collegeId).select('-masterPasswordHash');
    if (!college) {
      return res.status(404).json({ success: false, message: 'College profile not found' });
    }

    res.status(200).json({
      success: true,
      college
    });
  } catch (error) {
    logger.error('Get college profile error:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving college profile' });
  }
};

/**
 * PUT /api/admin/college/profile
 * Admin-only — update authenticated college profile metadata
 */
exports.updateCollegeProfile = async (req, res) => {
  try {
    const {
      name,
      code,
      address,
      city,
      state,
      website,
      contactEmail,
      contactPhone,
      establishedYear,
      acceptedDomains
    } = req.body;

    const updates = {};

    // Validate name
    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim() === '') {
        return res.status(400).json({ success: false, message: 'College name cannot be empty' });
      }
      updates.name = name.trim();
    }

    // Optional string fields
    if (code !== undefined) {
      updates.code = typeof code === 'string' ? code.trim() : '';
    }
    if (address !== undefined) {
      updates.address = typeof address === 'string' ? address.trim() : '';
    }
    if (city !== undefined) {
      updates.city = typeof city === 'string' ? city.trim() : '';
    }
    if (state !== undefined) {
      updates.state = typeof state === 'string' ? state.trim() : '';
    }
    if (website !== undefined) {
      updates.website = typeof website === 'string' ? website.trim() : '';
    }
    if (contactPhone !== undefined) {
      updates.contactPhone = typeof contactPhone === 'string' ? contactPhone.trim() : '';
    }

    // Validate contactEmail if provided
    if (contactEmail !== undefined) {
      const emailStr = String(contactEmail || '').trim().toLowerCase();
      if (emailStr.length > 0) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailStr)) {
          return res.status(400).json({ success: false, message: 'Invalid contact email address format' });
        }
      }
      updates.contactEmail = emailStr;
    }

    // Validate establishedYear
    if (establishedYear !== undefined) {
      if (establishedYear === null || establishedYear === '') {
        updates.establishedYear = null;
      } else {
        const yearNum = Number(establishedYear);
        const currentYear = new Date().getFullYear();
        if (!Number.isInteger(yearNum) || yearNum < 1800 || yearNum > currentYear + 1) {
          return res.status(400).json({
            success: false,
            message: `Established year must be a valid 4-digit year between 1800 and ${currentYear + 1}`
          });
        }
        updates.establishedYear = yearNum;
      }
    }

    // Validate acceptedDomains if provided
    if (acceptedDomains !== undefined) {
      let domainList = Array.isArray(acceptedDomains) ? acceptedDomains : String(acceptedDomains || '').split(',');
      const normalizedDomains = domainList
        .map(d => String(d || '').toLowerCase().trim())
        .filter(Boolean);

      if (normalizedDomains.length === 0) {
        return res.status(400).json({ success: false, message: 'At least one valid accepted domain is required' });
      }

      const domainRegex = /^[a-z0-9.-]+\.[a-z]{2,}$/;
      for (const d of normalizedDomains) {
        if (!domainRegex.test(d)) {
          return res.status(400).json({ success: false, message: `Invalid domain format: ${d}` });
        }
      }
      updates.acceptedDomains = normalizedDomains;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, message: 'No valid editable fields provided for update' });
    }

    if (!memoryDb.isMongoConnected() && !College.findByIdAndUpdate.mock) {
      const college = memoryDb.updateCollege(req.collegeId, updates);
      if (!college) {
        return res.status(404).json({ success: false, message: 'College profile not found' });
      }
      return res.status(200).json({
        success: true,
        message: 'College profile updated successfully',
        college: {
          _id: college._id,
          name: college.name,
          slug: college.slug,
          adminEmail: college.adminEmail,
          acceptedDomains: college.acceptedDomains || [],
          logoUrl: college.logoUrl || null,
          code: college.code || '',
          address: college.address || '',
          city: college.city || '',
          state: college.state || '',
          website: college.website || '',
          contactEmail: college.contactEmail || '',
          contactPhone: college.contactPhone || '',
          establishedYear: typeof college.establishedYear === 'number' ? college.establishedYear : null,
          createdAt: college.createdAt
        }
      });
    }

    const updated = await College.findByIdAndUpdate(
      req.collegeId,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-masterPasswordHash');

    if (!updated) {
      return res.status(404).json({ success: false, message: 'College profile not found' });
    }

    res.status(200).json({
      success: true,
      message: 'College profile updated successfully',
      college: updated
    });
  } catch (error) {
    logger.error('Update college profile error:', error);
    res.status(500).json({ success: false, message: 'Server error updating college profile' });
  }
};

/**
 * POST /api/admin/college/profile/image
 * Admin-only — upload college logo (multipart form with 'image' or 'logo')
 */
exports.uploadLogo = async (req, res) => {
  let uploadedFilePath = null;
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file uploaded' });
    }

    uploadedFilePath = req.file.path;

    // Validate image magic bytes
    if (!verifyImageMagicBytes(uploadedFilePath)) {
      safeDeleteUploadFile(req.file.filename);
      return res.status(400).json({
        success: false,
        message: 'Invalid image file: Missing valid image signature (JPEG, PNG, GIF, WEBP).'
      });
    }

    const newLogoUrl = `/uploads/${req.file.filename}`;

    // ----------------------------------------------------
    // Resilient In-Memory Mode
    // ----------------------------------------------------
    if (!memoryDb.isMongoConnected() && !College.findById.mock) {
      const college = memoryDb.findCollegeById(req.collegeId);
      if (!college) {
        safeDeleteUploadFile(req.file.filename);
        return res.status(404).json({ success: false, message: 'College not found' });
      }

      const oldLogo = college.logoUrl;
      college.logoUrl = newLogoUrl;

      // Clean up previous logo file if different
      if (oldLogo && oldLogo !== newLogoUrl) {
        safeDeleteUploadFile(oldLogo);
      }

      return res.status(200).json({
        success: true,
        message: 'College logo updated successfully',
        logoUrl: college.logoUrl
      });
    }

    // ----------------------------------------------------
    // MongoDB / Mongoose Mode
    // ----------------------------------------------------
    const college = await College.findById(req.collegeId);
    if (!college) {
      safeDeleteUploadFile(req.file.filename);
      return res.status(404).json({ success: false, message: 'College not found' });
    }

    const oldLogo = college.logoUrl;
    college.logoUrl = newLogoUrl;

    try {
      await college.save();
    } catch (saveErr) {
      safeDeleteUploadFile(req.file.filename);
      throw saveErr;
    }

    // Clean up previous logo file if successfully replaced
    if (oldLogo && oldLogo !== newLogoUrl) {
      safeDeleteUploadFile(oldLogo);
    }

    res.status(200).json({
      success: true,
      message: 'College logo updated successfully',
      logoUrl: college.logoUrl
    });
  } catch (error) {
    if (uploadedFilePath) {
      safeDeleteUploadFile(path.basename(uploadedFilePath));
    }
    logger.error('Upload college logo error:', error);
    res.status(500).json({ success: false, message: 'Server error uploading college logo' });
  }
};

/**
 * DELETE /api/admin/college/profile/image
 * Admin-only — delete college logo
 */
exports.deleteLogo = async (req, res) => {
  try {
    if (!memoryDb.isMongoConnected() && !College.findById.mock) {
      const college = memoryDb.findCollegeById(req.collegeId);
      if (!college) {
        return res.status(404).json({ success: false, message: 'College not found' });
      }

      const oldLogo = college.logoUrl;
      college.logoUrl = null;
      if (oldLogo) {
        safeDeleteUploadFile(oldLogo);
      }

      return res.status(200).json({
        success: true,
        message: 'College logo removed successfully',
        logoUrl: null
      });
    }

    const college = await College.findById(req.collegeId);
    if (!college) {
      return res.status(404).json({ success: false, message: 'College not found' });
    }

    const oldLogo = college.logoUrl;
    college.logoUrl = null;
    await college.save();

    if (oldLogo) {
      safeDeleteUploadFile(oldLogo);
    }

    res.status(200).json({
      success: true,
      message: 'College logo removed successfully',
      logoUrl: null
    });
  } catch (error) {
    logger.error('Delete college logo error:', error);
    res.status(500).json({ success: false, message: 'Server error deleting college logo' });
  }
};
