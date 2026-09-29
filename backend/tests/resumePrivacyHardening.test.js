const request = require('supertest');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

jest.mock('../models/Student');
const Student = require('../models/Student');
const app = require('../server');
const config = require('../config');
const memoryDb = require('../utils/memoryDb');

describe('Resume Privacy Hardening & Access Control Tests', () => {
  const uploadDir = path.resolve(config.uploadDir || path.join(__dirname, '../uploads'));
  const studentAId = new mongoose.Types.ObjectId().toString();
  const studentBId = new mongoose.Types.ObjectId().toString();
  const collegeId = new mongoose.Types.ObjectId().toString();

  const studentAToken = jwt.sign(
    { id: studentAId, role: 'STUDENT', collegeId },
    config.jwtSecret,
    { expiresIn: '1h' }
  );

  const studentBToken = jwt.sign(
    { id: studentBId, role: 'STUDENT', collegeId },
    config.jwtSecret,
    { expiresIn: '1h' }
  );

  const resumeAFilename = 'test-student-a-resume.pdf';
  const resumeBFilename = 'test-student-b-resume.pdf';
  const avatarFilename = 'test-avatar.png';

  const resumeAPath = path.join(uploadDir, resumeAFilename);
  const resumeBPath = path.join(uploadDir, resumeBFilename);
  const avatarPath = path.join(uploadDir, avatarFilename);

  beforeAll(() => {
    jest.spyOn(memoryDb, 'isMongoConnected').mockReturnValue(false);

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    fs.writeFileSync(resumeAPath, '%PDF-1.4 Student A Resume Content');
    fs.writeFileSync(resumeBPath, '%PDF-1.4 Student B Confidential Resume');
    fs.writeFileSync(avatarPath, '\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR');

    // Seed memoryDb
    memoryDb.clearAll();
    memoryDb.saveStudent({
      _id: studentAId,
      collegeId,
      name: 'Student A',
      email: 'studenta@college.edu',
      resumeUrl: `/uploads/${resumeAFilename}`,
      publicProfile: {
        enabled: true,
        username: 'student-a',
        showResume: true,
        showGithub: true,
        showLinkedIn: true,
        showSkills: true,
        showProjects: true
      }
    });

    memoryDb.saveStudent({
      _id: studentBId,
      collegeId,
      name: 'Student B',
      email: 'studentb@college.edu',
      resumeUrl: `/uploads/${resumeBFilename}`,
      publicProfile: {
        enabled: true,
        username: 'student-b',
        showResume: false, // showResume disabled
        showGithub: true,
        showLinkedIn: true,
        showSkills: true,
        showProjects: true
      }
    });
  });

  afterAll(() => {
    memoryDb.isMongoConnected.mockRestore();
    if (fs.existsSync(resumeAPath)) fs.unlinkSync(resumeAPath);
    if (fs.existsSync(resumeBPath)) fs.unlinkSync(resumeBPath);
    if (fs.existsSync(avatarPath)) fs.unlinkSync(avatarPath);
  });

  describe('A. showResume=true → public resume endpoint works', () => {
    test('GET /api/public/students/student-a/resume returns PDF when enabled and showResume=true', async () => {
      const res = await request(app).get('/api/public/students/student-a/resume');
      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toMatch(/application\/pdf/i);
      expect(res.headers['content-disposition']).toMatch(/inline; filename="student-a-resume.pdf"/i);
      expect((res.body && Buffer.isBuffer(res.body) ? res.body.toString() : res.text || '')).toContain('Student A Resume Content');
    });
  });

  describe('B. showResume=false → public resume endpoint returns 404', () => {
    test('GET /api/public/students/student-b/resume returns 404 when showResume is false', async () => {
      const res = await request(app).get('/api/public/students/student-b/resume');
      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/not found or not publicly available/i);
    });
  });

  describe('C. disabled public profile → 404', () => {
    test('GET /api/public/students/student-c/resume returns 404 when profile disabled or nonexistent', async () => {
      const res = await request(app).get('/api/public/students/student-c/resume');
      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
    });

    test('GET /api/public/students/student-a/resume returns 404 if profile is disabled', async () => {
      const studentA = memoryDb.findStudentById(studentAId);
      studentA.publicProfile.enabled = false;

      const res = await request(app).get('/api/public/students/student-a/resume');
      expect(res.statusCode).toBe(404);

      // Restore
      studentA.publicProfile.enabled = true;
    });
  });

  describe('D. direct old resume URL cannot bypass showResume', () => {
    test('GET /uploads/test-student-b-resume.pdf unauthenticated returns 404 (blocks direct static bypass)', async () => {
      const res = await request(app).get(`/uploads/${resumeBFilename}`);
      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
    });

    test('GET /uploads/test-student-a-resume.pdf unauthenticated returns 404', async () => {
      const res = await request(app).get(`/uploads/${resumeAFilename}`);
      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe("E. another student's resume cannot be accessed", () => {
    test('Student A with valid token cannot access Student B resume file via /uploads', async () => {
      const res = await request(app)
        .get(`/uploads/${resumeBFilename}`)
        .set('Authorization', `Bearer ${studentAToken}`);

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('F. existing authenticated resume workflow still works', () => {
    test('Student A can access own resume via authenticated GET /api/student/resume', async () => {
      const res = await request(app)
        .get('/api/student/resume')
        .set('Authorization', `Bearer ${studentAToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toMatch(/application\/pdf/i);
      expect((res.body && Buffer.isBuffer(res.body) ? res.body.toString() : res.text || '')).toContain('Student A Resume Content');
    });

    test('Student A can access own resume file via authenticated /uploads URL', async () => {
      const res = await request(app)
        .get(`/uploads/${resumeAFilename}`)
        .set('Authorization', `Bearer ${studentAToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toMatch(/application\/pdf/i);
      expect((res.body && Buffer.isBuffer(res.body) ? res.body.toString() : res.text || '')).toContain('Student A Resume Content');
    });

    test('Student A can access own resume file via URL query token (?token=...) in browser new tab', async () => {
      const res = await request(app)
        .get(`/uploads/${resumeAFilename}?token=${studentAToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toMatch(/application\/pdf/i);
      expect((res.body && Buffer.isBuffer(res.body) ? res.body.toString() : res.text || '')).toContain('Student A Resume Content');
    });
  });

  describe('G. profile image / static asset behavior remains intact', () => {
    test('Public unauthenticated request to /uploads/test-avatar.png returns 200 with image', async () => {
      const res = await request(app).get(`/uploads/${avatarFilename}`);
      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toMatch(/image\/png/i);
    });
  });
});
