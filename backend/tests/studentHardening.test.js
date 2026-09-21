const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const studentController = require('../controllers/studentController');
const Student = require('../models/Student');
const Match = require('../models/Match');
const JobDescription = require('../models/JobDescription');
const config = require('../config');

jest.mock('../models/Student');
jest.mock('../models/Match');
jest.mock('../models/JobDescription');

describe('Phase 2: Student / Profile / Resume Hardening', () => {
  const mockCollegeId = '507f1f77bcf86cd799439011';
  const mockStudentId = '507f1f77bcf86cd799439022';
  const otherCollegeId = '507f1f77bcf86cd799439999';

  let testPdfPath;
  let fakePdfPath;
  let testDir;

  beforeAll(() => {
    testDir = path.join(__dirname, 'temp_test_files');
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }

    // 1. Valid PDF file (starts with %PDF-)
    testPdfPath = path.join(testDir, 'valid_test_resume.pdf');
    fs.writeFileSync(testPdfPath, '%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF');

    // 2. Fake disguised PDF (text file named .pdf without %PDF-)
    fakePdfPath = path.join(testDir, 'fake_disguised.pdf');
    fs.writeFileSync(fakePdfPath, 'This is a plaintext file pretending to be a PDF.');
  });

  afterAll(() => {
    if (fs.existsSync(testDir)) {
      try {
        fs.rmSync(testDir, { recursive: true, force: true });
      } catch (_) {}
    }
  });

  const createMockReq = (overrides = {}) => ({
    collegeId: mockCollegeId,
    user: { id: mockStudentId, role: 'STUDENT', email: 'priya@college.edu' },
    query: {},
    params: {},
    body: {},
    file: null,
    ...overrides
  });

  const createMockRes = () => {
    const res = {};
    res.statusCode = 200;
    res.headers = {};
    res.status = jest.fn().mockImplementation((code) => {
      res.statusCode = code;
      return res;
    });
    res.json = jest.fn().mockImplementation((data) => {
      res.body = data;
      return res;
    });
    res.send = jest.fn().mockImplementation((data) => {
      res.body = data;
      return res;
    });
    return res;
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ==========================================
  // 1. Profile Retrieval & Ownership
  // ==========================================
  describe('GET /api/student/profile (getProfile)', () => {
    test('should retrieve own profile and exclude passwordHash', async () => {
      const mockStudentData = {
        _id: mockStudentId,
        collegeId: mockCollegeId,
        name: 'Priya Sharma',
        email: 'priya@college.edu',
        skills: ['java', 'sql'],
        placementStatus: 'UNPLACED',
        readinessScore: 78
      };

      Student.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockStudentData)
      });

      const req = createMockReq();
      const res = createMockRes();

      await studentController.getProfile(req, res);

      expect(Student.findOne).toHaveBeenCalledWith({
        _id: mockStudentId,
        collegeId: mockCollegeId
      });
      expect(res.body.name).toBe('Priya Sharma');
      expect(res.body.passwordHash).toBeUndefined();
    });

    test('should return 404 if profile not found or cross-college access attempt', async () => {
      Student.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(null)
      });

      const req = createMockReq({ collegeId: otherCollegeId });
      const res = createMockRes();

      await studentController.getProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.body.message).toMatch(/Profile not found/i);
    });
  });

  // ==========================================
  // 2. Profile Update & Mass Assignment Protection
  // ==========================================
  describe('PUT /api/student/profile (updateProfile)', () => {
    test('should update allowed fields (skills, github, name, tags, notes) and recompute matching jobs', async () => {
      const existingStudent = {
        _id: mockStudentId,
        collegeId: mockCollegeId,
        name: 'Priya Sharma',
        skills: ['java'],
        github: '',
        tags: [],
        notes: '',
        save: jest.fn().mockResolvedValue(true)
      };

      Student.findOne.mockResolvedValue(existingStudent);
      Student.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue({
          _id: mockStudentId,
          name: 'Priya S.',
          skills: ['python', 'django'],
          github: 'https://github.com/priya-dev',
          tags: ['backend', 'web'],
          notes: 'Looking for remote roles'
        })
      });

      JobDescription.find.mockResolvedValue([
        { _id: 'job1', requiredSkills: ['python', 'react'] }
      ]);
      Match.findOneAndUpdate.mockResolvedValue({});

      const req = createMockReq({
        body: {
          skills: ['Python', 'Django'],
          github: 'https://github.com/priya-dev',
          name: 'Priya S.',
          tags: ['backend', 'web'],
          notes: 'Looking for remote roles'
        }
      });
      const res = createMockRes();

      await studentController.updateProfile(req, res);

      expect(res.body.message).toBe('Profile updated');
      expect(existingStudent.name).toBe('Priya S.');
      expect(existingStudent.skills).toEqual(['python', 'django']);
      expect(existingStudent.github).toBe('https://github.com/priya-dev');
      expect(existingStudent.tags).toEqual(['backend', 'web']);
      expect(existingStudent.notes).toBe('Looking for remote roles');
      expect(existingStudent.save).toHaveBeenCalled();
      expect(JobDescription.find).toHaveBeenCalledWith({ collegeId: mockCollegeId });
      expect(Match.findOneAndUpdate).toHaveBeenCalled();
    });

    test('should strictly ignore protected fields from body (mass assignment prevention)', async () => {
      const existingStudent = {
        _id: mockStudentId,
        collegeId: mockCollegeId,
        name: 'Priya Sharma',
        role: 'STUDENT',
        placementStatus: 'UNPLACED',
        readinessScore: 78,
        technicalScore: 80,
        softSkillScore: 75,
        resumeScore: 75,
        packageOffered: 0,
        email: 'priya@college.edu',
        rollNo: '1RV21CS045',
        passwordHash: '$2a$10$originalPasswordHash',
        resumeUrl: '/uploads/original.pdf',
        skills: ['java'],
        save: jest.fn().mockResolvedValue(true)
      };

      Student.findOne.mockResolvedValue(existingStudent);
      Student.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(existingStudent)
      });
      JobDescription.find.mockResolvedValue([]);

      const req = createMockReq({
        body: {
          skills: ['java', 'spring'],
          collegeId: otherCollegeId, // Attempted tenant escape
          role: 'COLLEGE_ADMIN',     // Attempted privilege escalation
          placementStatus: 'PLACED', // Attempted placement forge
          readinessScore: 100,       // Attempted score forgery
          technicalScore: 100,
          softSkillScore: 100,
          resumeScore: 100,
          packageOffered: 50,
          email: 'hacker@evil.com',
          rollNo: 'HACKED999',
          passwordHash: 'forgedHash123',
          resumeUrl: '/evil/exploit.php'
        }
      });
      const res = createMockRes();

      await studentController.updateProfile(req, res);

      expect(res.body.message).toBe('Profile updated');
      // Protected fields must not be touched
      expect(existingStudent.collegeId).toBe(mockCollegeId);
      expect(existingStudent.role).toBe('STUDENT');
      expect(existingStudent.placementStatus).toBe('UNPLACED');
      expect(existingStudent.readinessScore).toBe(78);
      expect(existingStudent.technicalScore).toBe(80);
      expect(existingStudent.packageOffered).toBe(0);
      expect(existingStudent.email).toBe('priya@college.edu');
      expect(existingStudent.rollNo).toBe('1RV21CS045');
      expect(existingStudent.passwordHash).toBe('$2a$10$originalPasswordHash');
      expect(existingStudent.resumeUrl).toBe('/uploads/original.pdf');
    });

    test('should reject password update with fewer than 4 characters', async () => {
      const req = createMockReq({ body: { newPassword: 'abc' } });
      const res = createMockRes();

      await studentController.updateProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/at least 4 characters/i);
    });

    test('should hash new password using bcrypt and save hash', async () => {
      const existingStudent = {
        _id: mockStudentId,
        collegeId: mockCollegeId,
        passwordHash: 'oldHash',
        save: jest.fn().mockResolvedValue(true)
      };

      Student.findOne.mockResolvedValue(existingStudent);
      Student.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue({
          _id: mockStudentId,
          name: 'Priya Sharma'
        })
      });

      const req = createMockReq({ body: { newPassword: 'securePassword2026' } });
      const res = createMockRes();

      await studentController.updateProfile(req, res);

      expect(existingStudent.save).toHaveBeenCalled();
      expect(existingStudent.passwordHash).not.toBe('oldHash');
      expect(existingStudent.passwordHash).not.toBe('securePassword2026');
      const isMatch = await bcrypt.compare('securePassword2026', existingStudent.passwordHash);
      expect(isMatch).toBe(true);
    });

    test('should reject invalid skills formats and excessive counts', async () => {
      // 1. Invalid object format
      const req1 = createMockReq({ body: { skills: { not: 'array' } } });
      const res1 = createMockRes();
      await studentController.updateProfile(req1, res1);
      expect(res1.status).toHaveBeenCalledWith(400);
      expect(res1.body.message).toMatch(/Skills must be/i);

      // 2. More than 50 skills
      const req2 = createMockReq({
        body: { skills: Array.from({ length: 55 }, (_, i) => `skill_${i}`) }
      });
      const res2 = createMockRes();
      await studentController.updateProfile(req2, res2);
      expect(res2.status).toHaveBeenCalledWith(400);
      expect(res2.body.message).toMatch(/Maximum of 50 skills/i);
    });
  });

  // ==========================================
  // 3. Resume Upload & PDF Verification
  // ==========================================
  describe('POST /api/student/resume (uploadResume)', () => {
    test('should reject when no file is uploaded', async () => {
      const req = createMockReq({ file: null });
      const res = createMockRes();

      await studentController.uploadResume(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.body.message).toMatch(/No file uploaded/i);
    });

    test('should reject disguised non-PDF file missing %PDF- signature and delete it', async () => {
      // Create a test fake file inside uploads to test deletion
      const fakeUploadName = `fake_${Date.now()}.pdf`;
      const fakeUploadPath = path.join(config.uploadDir, fakeUploadName);
      if (!fs.existsSync(config.uploadDir)) {
        fs.mkdirSync(config.uploadDir, { recursive: true });
      }
      fs.writeFileSync(fakeUploadPath, 'This is definitely not a PDF file.');

      const req = createMockReq({
        file: {
          filename: fakeUploadName,
          path: fakeUploadPath
        }
      });
      const res = createMockRes();

      await studentController.uploadResume(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Missing valid %PDF- header signature/i);
      // File should have been safely deleted
      expect(fs.existsSync(fakeUploadPath)).toBe(false);
    });

    test('should upload valid PDF, update student resumeUrl, and clean up previous resume', async () => {
      if (!fs.existsSync(config.uploadDir)) {
        fs.mkdirSync(config.uploadDir, { recursive: true });
      }

      // Old resume file
      const oldFilename = `old_resume_${Date.now()}.pdf`;
      const oldFilePath = path.join(config.uploadDir, oldFilename);
      fs.writeFileSync(oldFilePath, '%PDF-1.4\nold resume content');

      // New uploaded file
      const newFilename = `new_resume_${Date.now()}.pdf`;
      const newFilePath = path.join(config.uploadDir, newFilename);
      fs.writeFileSync(newFilePath, '%PDF-1.4\nnew resume content');

      const existingStudent = {
        _id: mockStudentId,
        collegeId: mockCollegeId,
        resumeUrl: `/uploads/${oldFilename}`,
        save: jest.fn().mockResolvedValue(true)
      };

      Student.findOne.mockResolvedValue(existingStudent);

      const req = createMockReq({
        file: {
          filename: newFilename,
          path: newFilePath
        }
      });
      const res = createMockRes();

      await studentController.uploadResume(req, res);

      expect(res.body.message).toBe('Resume uploaded');
      expect(res.body.resumeUrl).toBe(`/uploads/${newFilename}`);
      expect(existingStudent.resumeUrl).toBe(`/uploads/${newFilename}`);
      expect(existingStudent.save).toHaveBeenCalled();

      // Old file should be unlinked
      expect(fs.existsSync(oldFilePath)).toBe(false);
      // New file exists
      expect(fs.existsSync(newFilePath)).toBe(true);

      // Clean up new file
      if (fs.existsSync(newFilePath)) {
        fs.unlinkSync(newFilePath);
      }
    });

    test('should delete newly uploaded file if student database save fails', async () => {
      const newFilename = `fail_save_${Date.now()}.pdf`;
      const newFilePath = path.join(config.uploadDir, newFilename);
      fs.writeFileSync(newFilePath, '%PDF-1.4\ncontent');

      const existingStudent = {
        _id: mockStudentId,
        collegeId: mockCollegeId,
        resumeUrl: '/uploads/preserved.pdf',
        save: jest.fn().mockRejectedValue(new Error('Database error'))
      };

      Student.findOne.mockResolvedValue(existingStudent);

      const req = createMockReq({
        file: {
          filename: newFilename,
          path: newFilePath
        }
      });
      const res = createMockRes();

      await studentController.uploadResume(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.body.message).toMatch(/Server error uploading resume/i);
      // New file must be cleaned up on failure
      expect(fs.existsSync(newFilePath)).toBe(false);
    });
  });

  // ==========================================
  // 4. Job & Preferred Job Endpoints
  // ==========================================
  describe('GET /api/student/jobs & /api/student/preferred-jobs', () => {
    test('should return jobs with match scores computed for the student', async () => {
      const mockStudent = {
        _id: mockStudentId,
        skills: ['python', 'react']
      };
      const mockJobs = [
        {
          _id: 'job1',
          title: 'Full Stack Dev',
          company: 'Initech',
          requiredSkills: ['python', 'react'],
          toObject: function() { return { ...this }; }
        }
      ];
      const mockMatches = [
        {
          jdId: 'job1',
          score: 100,
          matchedSkills: ['python', 'react'],
          missingSkills: []
        }
      ];

      JobDescription.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockJobs)
      });
      Student.findOne.mockResolvedValue(mockStudent);
      Match.find.mockResolvedValue(mockMatches);

      const req = createMockReq();
      const res = createMockRes();

      await studentController.getJobs(req, res);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body[0].title).toBe('Full Stack Dev');
      expect(res.body[0].matchScore).toBe(100);
    });
  });
});
