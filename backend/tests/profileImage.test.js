const studentController = require('../controllers/studentController');
const collegeController = require('../controllers/collegeController');
const Student = require('../models/Student');
const College = require('../models/College');
const memoryDb = require('../utils/memoryDb');
const fs = require('fs');
const path = require('path');
const config = require('../config');

jest.mock('../models/Student');
jest.mock('../models/College');

describe('Unified Profile Image System Tests', () => {
  const mockCollegeId = '507f1f77bcf86cd799439011';
  const mockStudentId = '507f1f77bcf86cd799439022';
  const otherCollegeId = '507f1f77bcf86cd799439999';

  const testTempDir = path.join(__dirname, 'temp_test_uploads');

  beforeAll(() => {
    if (!fs.existsSync(testTempDir)) {
      fs.mkdirSync(testTempDir, { recursive: true });
    }
  });

  afterAll(() => {
    if (fs.existsSync(testTempDir)) {
      fs.rmSync(testTempDir, { recursive: true, force: true });
    }
  });

  const createMockReq = (overrides = {}) => ({
    collegeId: mockCollegeId,
    user: { id: mockStudentId, role: 'STUDENT', email: 'kushagra@college.edu' },
    query: {},
    params: {},
    body: {},
    file: null,
    ...overrides
  });

  const createMockRes = () => {
    const res = {};
    res.statusCode = 200;
    res.status = jest.fn().mockImplementation(code => {
      res.statusCode = code;
      return res;
    });
    res.json = jest.fn().mockImplementation(data => {
      res.data = data;
      return res;
    });
    return res;
  };

  // Helper to create valid image file for tests
  const createTestImage = (filename, type = 'png') => {
    const filePath = path.join(config.uploadDir, filename);
    if (!fs.existsSync(config.uploadDir)) {
      fs.mkdirSync(config.uploadDir, { recursive: true });
    }

    let header;
    if (type === 'png') {
      header = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D]);
    } else if (type === 'jpeg') {
      header = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01]);
    } else if (type === 'gif') {
      header = Buffer.from([0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00, 0x80, 0x00]);
    } else if (type === 'webp') {
      header = Buffer.from([0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50]);
    } else {
      header = Buffer.from('NOT_AN_IMAGE_FILE');
    }

    fs.writeFileSync(filePath, header);
    return {
      filename,
      path: filePath,
      size: header.length,
      mimetype: `image/${type}`
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('1. Student Profile Image Upload & Lifecycle', () => {
    it('uploads valid PNG profile image and persists profileImageUrl', async () => {
      const testFile = createTestImage('test-student-avatar.png', 'png');

      const mockStudentDoc = {
        _id: mockStudentId,
        collegeId: mockCollegeId,
        name: 'Kushagra Shukla',
        profileImageUrl: null,
        save: jest.fn().mockResolvedValue(true)
      };

      Student.findOne.mockResolvedValue(mockStudentDoc);

      const req = createMockReq({ file: testFile });
      const res = createMockRes();

      await studentController.uploadProfileImage(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.data.success).toBe(true);
      expect(res.data.profileImageUrl).toBe('/uploads/test-student-avatar.png');
      expect(mockStudentDoc.profileImageUrl).toBe('/uploads/test-student-avatar.png');
      expect(mockStudentDoc.save).toHaveBeenCalledTimes(1);

      // Cleanup
      if (fs.existsSync(testFile.path)) {
        fs.unlinkSync(testFile.path);
      }
    });

    it('rejects invalid image missing valid magic bytes and deletes file', async () => {
      const invalidFile = createTestImage('fake-image.jpg', 'invalid');

      const req = createMockReq({ file: invalidFile });
      const res = createMockRes();

      await studentController.uploadProfileImage(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.data.success).toBe(false);
      expect(res.data.message).toMatch(/Invalid image file/i);

      // Verify file was deleted from disk
      expect(fs.existsSync(invalidFile.path)).toBe(false);
    });

    it('replaces previous profile image and cleans up old file', async () => {
      const oldFile = createTestImage('old-avatar.png', 'png');
      const newFile = createTestImage('new-avatar.png', 'png');

      const mockStudentDoc = {
        _id: mockStudentId,
        collegeId: mockCollegeId,
        name: 'Kushagra Shukla',
        profileImageUrl: '/uploads/old-avatar.png',
        save: jest.fn().mockResolvedValue(true)
      };

      Student.findOne.mockResolvedValue(mockStudentDoc);

      const req = createMockReq({ file: newFile });
      const res = createMockRes();

      await studentController.uploadProfileImage(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(mockStudentDoc.profileImageUrl).toBe('/uploads/new-avatar.png');
      // Old file should have been deleted
      expect(fs.existsSync(oldFile.path)).toBe(false);

      // Cleanup new file
      if (fs.existsSync(newFile.path)) {
        fs.unlinkSync(newFile.path);
      }
    });

    it('deletes newly uploaded file if database persistence fails', async () => {
      const testFile = createTestImage('failed-save-avatar.png', 'png');

      const mockStudentDoc = {
        _id: mockStudentId,
        collegeId: mockCollegeId,
        name: 'Kushagra Shukla',
        profileImageUrl: null,
        save: jest.fn().mockRejectedValue(new Error('Database disk error'))
      };

      Student.findOne.mockResolvedValue(mockStudentDoc);

      const req = createMockReq({ file: testFile });
      const res = createMockRes();

      await studentController.uploadProfileImage(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(fs.existsSync(testFile.path)).toBe(false);
    });

    it('deletes student profile image and resets profileImageUrl to null', async () => {
      const avatarFile = createTestImage('avatar-to-delete.png', 'png');

      const mockStudentDoc = {
        _id: mockStudentId,
        collegeId: mockCollegeId,
        name: 'Kushagra Shukla',
        profileImageUrl: '/uploads/avatar-to-delete.png',
        save: jest.fn().mockResolvedValue(true)
      };

      Student.findOne.mockResolvedValue(mockStudentDoc);

      const req = createMockReq();
      const res = createMockRes();

      await studentController.deleteProfileImage(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.data.success).toBe(true);
      expect(res.data.profileImageUrl).toBeNull();
      expect(mockStudentDoc.profileImageUrl).toBeNull();
      expect(fs.existsSync(avatarFile.path)).toBe(false);
    });

    it('enforces tenant isolation on student profile image upload', async () => {
      const testFile = createTestImage('tenant-iso-avatar.png', 'png');
      Student.findOne.mockResolvedValue(null);

      const req = createMockReq({ collegeId: otherCollegeId, file: testFile });
      const res = createMockRes();

      await studentController.uploadProfileImage(req, res);

      expect(Student.findOne).toHaveBeenCalledWith({
        _id: mockStudentId,
        collegeId: otherCollegeId
      });
      expect(res.status).toHaveBeenCalledWith(404);
      expect(fs.existsSync(testFile.path)).toBe(false);
    });
  });

  describe('2. College Logo Upload & Lifecycle', () => {
    it('uploads valid JPEG college logo and persists logoUrl', async () => {
      const logoFile = createTestImage('college-logo.jpeg', 'jpeg');

      const mockCollegeDoc = {
        _id: mockCollegeId,
        name: 'National Institute of Technology',
        slug: 'nit',
        logoUrl: null,
        save: jest.fn().mockResolvedValue(true)
      };

      College.findById.mockResolvedValue(mockCollegeDoc);

      const req = createMockReq({
        collegeId: mockCollegeId,
        user: { id: 'admin_1', role: 'COLLEGE_ADMIN' },
        file: logoFile
      });
      const res = createMockRes();

      await collegeController.uploadLogo(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.data.success).toBe(true);
      expect(res.data.logoUrl).toBe('/uploads/college-logo.jpeg');
      expect(mockCollegeDoc.logoUrl).toBe('/uploads/college-logo.jpeg');

      if (fs.existsSync(logoFile.path)) {
        fs.unlinkSync(logoFile.path);
      }
    });

    it('deletes college logo and resets logoUrl to null', async () => {
      const logoFile = createTestImage('logo-to-delete.png', 'png');

      const mockCollegeDoc = {
        _id: mockCollegeId,
        name: 'NIT',
        logoUrl: '/uploads/logo-to-delete.png',
        save: jest.fn().mockResolvedValue(true)
      };

      College.findById.mockResolvedValue(mockCollegeDoc);

      const req = createMockReq({
        collegeId: mockCollegeId,
        user: { id: 'admin_1', role: 'COLLEGE_ADMIN' }
      });
      const res = createMockRes();

      await collegeController.deleteLogo(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.data.success).toBe(true);
      expect(res.data.logoUrl).toBeNull();
      expect(mockCollegeDoc.logoUrl).toBeNull();
      expect(fs.existsSync(logoFile.path)).toBe(false);
    });

    it('GET /api/admin/college/profile returns college info with logoUrl', async () => {
      const mockCollegeDoc = {
        _id: mockCollegeId,
        name: 'NIT Calicut',
        slug: 'nitc',
        adminEmail: 'admin@nitc.ac.in',
        acceptedDomains: ['nitc.ac.in'],
        logoUrl: '/uploads/nitc-logo.png',
        createdAt: new Date('2026-01-01')
      };

      College.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockCollegeDoc)
      });

      const req = createMockReq({
        collegeId: mockCollegeId,
        user: { id: 'admin_1', role: 'COLLEGE_ADMIN' }
      });
      const res = createMockRes();

      await collegeController.getCollegeProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.data.success).toBe(true);
      expect(res.data.college.logoUrl).toBe('/uploads/nitc-logo.png');
      expect(res.data.college.name).toBe('NIT Calicut');
    });
  });

  describe('3. In-Memory Mode Resilient Profile Image Operations', () => {
    it('manages student profileImageUrl in memoryDb', () => {
      const student = memoryDb.saveStudent({
        collegeId: mockCollegeId,
        name: 'Harsh Verdhan Singh',
        rollNo: 'CS001',
        email: 'harsh@college.edu',
        passwordHash: 'hash'
      });

      expect(student.profileImageUrl).toBeNull();

      memoryDb.updateStudentProfileImage(student._id, '/uploads/harsh-avatar.png');
      const updated = memoryDb.findStudentById(student._id);
      expect(updated.profileImageUrl).toBe('/uploads/harsh-avatar.png');

      memoryDb.updateStudentProfileImage(student._id, null);
      const cleared = memoryDb.findStudentById(student._id);
      expect(cleared.profileImageUrl).toBeNull();
    });

    it('manages college logoUrl in memoryDb', () => {
      const college = memoryDb.saveCollege({
        name: 'IIT Bombay',
        slug: 'iitb',
        adminEmail: 'admin@iitb.ac.in',
        masterPasswordHash: 'hash'
      });

      expect(college.logoUrl).toBeNull();

      memoryDb.updateCollegeLogo(college._id, '/uploads/iitb-logo.png');
      const updated = memoryDb.findCollegeById(college._id);
      expect(updated.logoUrl).toBe('/uploads/iitb-logo.png');

      memoryDb.updateCollegeLogo(college._id, null);
      const cleared = memoryDb.findCollegeById(college._id);
      expect(cleared.logoUrl).toBeNull();
    });
  });
});
