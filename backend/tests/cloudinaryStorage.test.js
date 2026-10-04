const cloudinary = require('cloudinary').v2;
const cloudinaryService = require('../services/cloudinaryService');
const studentController = require('../controllers/studentController');
const Student = require('../models/Student');
const fs = require('fs');
const path = require('path');
const config = require('../config');

jest.mock('../models/Student');

describe('Cloudinary Native Configuration & Secure Upload Pipeline', () => {
  const originalEnv = process.env;
  const mockCollegeId = '507f1f77bcf86cd799439011';
  const mockStudentId = '507f1f77bcf86cd799439022';

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
      res.body = data;
      return res;
    });
    return res;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('A. Cloudinary Native Configuration', () => {
    it('initializes natively and returns true when valid CLOUDINARY_URL is present', () => {
      process.env.CLOUDINARY_URL = 'cloudinary://757373323224156:mockSecretKey123@dylls4r88';
      const configured = cloudinaryService.isCloudinaryConfigured();
      expect(configured).toBe(true);

      const cfg = cloudinary.config();
      expect(cfg.cloud_name).toBe('dylls4r88');
      expect(cfg.api_key).toBe('757373323224156');
    });

    it('returns false when CLOUDINARY_URL is absent and no separate variables exist', () => {
      delete process.env.CLOUDINARY_URL;
      delete process.env.CLOUDINARY_CLOUD_NAME;
      delete process.env.CLOUDINARY_API_KEY;
      delete process.env.CLOUDINARY_API_SECRET;

      // Force config to not use env
      const origUrl = config.cloudinaryUrl;
      config.cloudinaryUrl = '';
      config.cloudinaryCloudName = '';
      config.cloudinaryApiKey = '';
      config.cloudinaryApiSecret = '';

      const configured = cloudinaryService.isCloudinaryConfigured();
      expect(configured).toBe(false);

      config.cloudinaryUrl = origUrl;
    });

    it('sanitizes status report without exposing api_secret', async () => {
      const pingSpy = jest.spyOn(cloudinary.api, 'ping').mockResolvedValue({ status: 'ok' });
      process.env.CLOUDINARY_URL = 'cloudinary://757373323224156:mockSecretKey123@dylls4r88';
      const status = await cloudinaryService.getCloudinaryStatus();
      expect(status.isConfigured).toBe(true);
      expect(status.cloudName).toBe('dylls4r88');
      expect(status.hasApiKey).toBe(true);
      expect(status.hasApiSecret).toBe(true);
      expect(status).not.toHaveProperty('apiSecret');
      expect(status).not.toHaveProperty('api_secret');
      pingSpy.mockRestore();
    });
  });

  describe('B. Profile Image Upload — Cloudinary Success', () => {
    it('persists Cloudinary secure_url in MongoDB and unlinks local file', async () => {
      const filename = `test_avatar_${Date.now()}.png`;
      const filePath = path.join(config.uploadDir, filename);
      if (!fs.existsSync(config.uploadDir)) fs.mkdirSync(config.uploadDir, { recursive: true });
      // Write valid PNG header
      fs.writeFileSync(filePath, Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52]));

      const mockStudent = {
        _id: mockStudentId,
        collegeId: mockCollegeId,
        profileImageUrl: null,
        save: jest.fn().mockResolvedValue(true)
      };
      Student.findOne.mockResolvedValue(mockStudent);

      // Spy on cloudinaryService methods
      jest.spyOn(cloudinaryService, 'isCloudinaryConfigured').mockReturnValue(true);
      jest.spyOn(cloudinaryService, 'uploadImage').mockResolvedValue({
        secure_url: 'https://res.cloudinary.com/dylls4r88/image/upload/v1/sips/avatars/profile-123.png',
        public_id: 'sips/avatars/profile-123'
      });

      const req = createMockReq({
        file: { filename, path: filePath, originalname: filename, mimetype: 'image/png' }
      });
      const res = createMockRes();

      await studentController.uploadProfileImage(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.data.success).toBe(true);
      expect(res.data.profileImageUrl).toBe('https://res.cloudinary.com/dylls4r88/image/upload/v1/sips/avatars/profile-123.png');
      expect(mockStudent.profileImageUrl).toBe('https://res.cloudinary.com/dylls4r88/image/upload/v1/sips/avatars/profile-123.png');
      expect(mockStudent.save).toHaveBeenCalled();
      // Local file cleaned up
      expect(fs.existsSync(filePath)).toBe(false);

      cloudinaryService.isCloudinaryConfigured.mockRestore();
      cloudinaryService.uploadImage.mockRestore();
    });
  });

  describe('C. Profile Image Upload — Cloudinary Failure (Fallback Removal)', () => {
    it('returns 502, deletes temporary file, and does NOT save /uploads/... to MongoDB', async () => {
      const filename = `fail_avatar_${Date.now()}.png`;
      const filePath = path.join(config.uploadDir, filename);
      if (!fs.existsSync(config.uploadDir)) fs.mkdirSync(config.uploadDir, { recursive: true });
      fs.writeFileSync(filePath, Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52]));

      const previousValidUrl = 'https://res.cloudinary.com/dylls4r88/image/upload/v1/sips/avatars/old-avatar.png';
      const mockStudent = {
        _id: mockStudentId,
        collegeId: mockCollegeId,
        profileImageUrl: previousValidUrl,
        save: jest.fn().mockResolvedValue(true)
      };
      Student.findOne.mockResolvedValue(mockStudent);

      jest.spyOn(cloudinaryService, 'isCloudinaryConfigured').mockReturnValue(true);
      jest.spyOn(cloudinaryService, 'uploadImage').mockRejectedValue(new Error('Cloudinary 403 Forbidden'));

      const req = createMockReq({
        file: { filename, path: filePath, originalname: filename, mimetype: 'image/png' }
      });
      const res = createMockRes();

      await studentController.uploadProfileImage(req, res);

      expect(res.status).toHaveBeenCalledWith(502);
      expect(res.data.success).toBe(false);
      expect(res.data.message).toMatch(/File storage service is temporarily unavailable/i);
      // Mongo must NOT be updated with local path
      expect(mockStudent.profileImageUrl).toBe(previousValidUrl);
      expect(mockStudent.save).not.toHaveBeenCalled();
      // Temporary file cleaned up
      expect(fs.existsSync(filePath)).toBe(false);

      cloudinaryService.isCloudinaryConfigured.mockRestore();
      cloudinaryService.uploadImage.mockRestore();
    });
  });

  describe('D. Resume Upload — Cloudinary Success', () => {
    it('persists Cloudinary secure_url in MongoDB, preserves skill review, and cleans up local file', async () => {
      const filename = `test_resume_${Date.now()}.pdf`;
      const filePath = path.join(config.uploadDir, filename);
      if (!fs.existsSync(config.uploadDir)) fs.mkdirSync(config.uploadDir, { recursive: true });
      fs.writeFileSync(filePath, '%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF');

      const mockStudent = {
        _id: mockStudentId,
        collegeId: mockCollegeId,
        resumeUrl: '',
        skills: ['React'],
        save: jest.fn().mockResolvedValue(true)
      };
      Student.findOne.mockResolvedValue(mockStudent);

      jest.spyOn(cloudinaryService, 'isCloudinaryConfigured').mockReturnValue(true);
      jest.spyOn(cloudinaryService, 'uploadResume').mockResolvedValue({
        secure_url: 'https://res.cloudinary.com/dylls4r88/raw/upload/v1/sips/resumes/resume-123.pdf',
        public_id: 'sips/resumes/resume-123'
      });

      const req = createMockReq({
        file: { filename, path: filePath, originalname: filename, mimetype: 'application/pdf' }
      });
      const res = createMockRes();

      await studentController.uploadResume(req, res);

      expect(res.status).not.toHaveBeenCalledWith(502);
      expect(res.data.success).toBe(true);
      expect(res.data.resumeUrl).toBe('https://res.cloudinary.com/dylls4r88/raw/upload/v1/sips/resumes/resume-123.pdf');
      expect(mockStudent.resumeUrl).toBe('https://res.cloudinary.com/dylls4r88/raw/upload/v1/sips/resumes/resume-123.pdf');
      expect(mockStudent.save).toHaveBeenCalled();
      expect(fs.existsSync(filePath)).toBe(false);

      cloudinaryService.isCloudinaryConfigured.mockRestore();
      cloudinaryService.uploadResume.mockRestore();
    });
  });

  describe('E. Resume Upload — Cloudinary Failure (Fallback Removal)', () => {
    it('returns 502, deletes temporary file, and does NOT save /uploads/... to MongoDB', async () => {
      const filename = `fail_resume_${Date.now()}.pdf`;
      const filePath = path.join(config.uploadDir, filename);
      if (!fs.existsSync(config.uploadDir)) fs.mkdirSync(config.uploadDir, { recursive: true });
      fs.writeFileSync(filePath, '%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF');

      const previousValidUrl = 'https://res.cloudinary.com/dylls4r88/raw/upload/v1/sips/resumes/old-resume.pdf';
      const mockStudent = {
        _id: mockStudentId,
        collegeId: mockCollegeId,
        resumeUrl: previousValidUrl,
        skills: ['React'],
        save: jest.fn().mockResolvedValue(true)
      };
      Student.findOne.mockResolvedValue(mockStudent);

      jest.spyOn(cloudinaryService, 'isCloudinaryConfigured').mockReturnValue(true);
      jest.spyOn(cloudinaryService, 'uploadResume').mockRejectedValue(new Error('Cloudinary 403 Forbidden'));

      const req = createMockReq({
        file: { filename, path: filePath, originalname: filename, mimetype: 'application/pdf' }
      });
      const res = createMockRes();

      await studentController.uploadResume(req, res);

      expect(res.status).toHaveBeenCalledWith(502);
      expect(res.data.success).toBe(false);
      expect(res.data.message).toMatch(/File storage service is temporarily unavailable/i);
      // Mongo must NOT be updated with local path
      expect(mockStudent.resumeUrl).toBe(previousValidUrl);
      expect(mockStudent.save).not.toHaveBeenCalled();
      // Temporary file cleaned up
      expect(fs.existsSync(filePath)).toBe(false);

      cloudinaryService.isCloudinaryConfigured.mockRestore();
      cloudinaryService.uploadResume.mockRestore();
    });
  });
});
