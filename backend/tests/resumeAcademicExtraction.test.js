const path = require('path');
const fs = require('fs');
const resumeExtractor = require('../utils/resumeExtractor');
const studentController = require('../controllers/studentController');
const Student = require('../models/Student');
const config = require('../config');

jest.mock('../models/Student');
jest.mock('../models/Match');
jest.mock('../models/JobDescription');
jest.mock('../models/Application');

describe('Resume Academic Extraction & Profile Management', () => {
  describe('resumeExtractor Unit Tests', () => {
    test('should extract CGPA from various text formats', () => {
      expect(resumeExtractor.extractCgpaFromText('Education: B.Tech in CSE, CGPA: 8.85')).toBe(8.85);
      expect(resumeExtractor.extractCgpaFromText('Academics: CGPA : 8.4 / 10')).toBe(8.4);
      expect(resumeExtractor.extractCgpaFromText('Current GPA: 9.1')).toBe(9.1);
      expect(resumeExtractor.extractCgpaFromText('Cumulative Grade Point Average: 7.90')).toBe(7.9);
      expect(resumeExtractor.extractCgpaFromText('B.Tech with 8.75/10 CGPA')).toBe(8.75);
      expect(resumeExtractor.extractCgpaFromText('GPA: 3.6 / 4.0')).toBe(9.0);
    });

    test('should extract Graduation Year / Batch from text', () => {
      expect(resumeExtractor.extractBatchFromText('RVCE, B.Tech CSE (2021-2025)')).toBe('2025');
      expect(resumeExtractor.extractBatchFromText('Graduation Year: 2026')).toBe('2026');
      expect(resumeExtractor.extractBatchFromText('Class of 2024')).toBe('2024');
      expect(resumeExtractor.extractBatchFromText('Batch: 2023 - 2027')).toBe('2027');
      expect(resumeExtractor.extractBatchFromText('Year of Passing: 2025')).toBe('2025');
    });

    test('should return null when no CGPA or Batch is present', () => {
      expect(resumeExtractor.extractCgpaFromText('Skills: React, Node.js, Python')).toBeNull();
      expect(resumeExtractor.extractBatchFromText('Developer with experience in web')).toBeNull();
    });
  });

  describe('studentController updateProfile with Academic Fields', () => {
    const studentId = '507f1f77bcf86cd799439011';
    const collegeId = '507f1f77bcf86cd799439022';

    afterEach(() => {
      jest.clearAllMocks();
    });

    test('should update student CGPA, batch, and branch successfully', async () => {
      const mockStudent = {
        _id: studentId,
        collegeId,
        name: 'Harsh Singh',
        branch: 'Computer Science & Engineering',
        batch: '',
        cgpa: 0,
        skills: [],
        save: jest.fn().mockResolvedValue(true)
      };

      Student.findOne.mockResolvedValue(mockStudent);
      Student.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue({
          _id: studentId,
          name: 'Harsh Verdhan Singh',
          branch: 'Information Science & Engineering',
          batch: '2026',
          cgpa: 8.85
        })
      });

      const req = {
        collegeId,
        user: { id: studentId, email: 'harsh@college.edu' },
        body: {
          name: 'Harsh Verdhan Singh',
          branch: 'Information Science & Engineering',
          batch: '2026',
          cgpa: 8.85
        }
      };

      let statusCode = 200;
      let responseBody = null;
      const res = {
        status(code) {
          statusCode = code;
          return this;
        },
        json(data) {
          responseBody = data;
          return this;
        }
      };

      await studentController.updateProfile(req, res);

      expect(statusCode).toBe(200);
      expect(mockStudent.cgpa).toBe(8.85);
      expect(mockStudent.batch).toBe('2026');
      expect(mockStudent.branch).toBe('Information Science & Engineering');
      expect(mockStudent.name).toBe('Harsh Verdhan Singh');
      expect(mockStudent.save).toHaveBeenCalled();
    });

    test('should reject invalid CGPA values', async () => {
      const req = {
        collegeId,
        user: { id: studentId, email: 'harsh@college.edu' },
        body: {
          cgpa: 11.5
        }
      };

      let statusCode = 200;
      let responseBody = null;
      const res = {
        status(code) {
          statusCode = code;
          return this;
        },
        json(data) {
          responseBody = data;
          return this;
        }
      };

      await studentController.updateProfile(req, res);

      expect(statusCode).toBe(400);
      expect(responseBody.success).toBe(false);
      expect(responseBody.message).toMatch(/Invalid CGPA/i);
    });
  });

  describe('studentController uploadResume Academic Extraction', () => {
    const studentId = '507f1f77bcf86cd799439011';
    const collegeId = '507f1f77bcf86cd799439022';
    let testPdfPath;

    beforeAll(() => {
      if (!fs.existsSync(config.uploadDir)) {
        fs.mkdirSync(config.uploadDir, { recursive: true });
      }
      testPdfPath = path.join(config.uploadDir, `test_resume_${Date.now()}.pdf`);
      // Minimal valid PDF structure with plaintext resume details
      const pdfContent = `%PDF-1.4
1 0 obj
<< /Length 120 >>
stream
(Aarav Sharma - Student Resume) Tj
(Degree: B.Tech Computer Science, Batch: 2022-2026) Tj
(Academic CGPA: 9.15 / 10) Tj
endstream
endobj
xref
0 2
0000000000 65535 f 
0000000010 00000 n 
trailer
<< /Size 2 /Root 1 0 R >>
startxref
120
%%EOF`;
      fs.writeFileSync(testPdfPath, pdfContent);
    });

    afterAll(() => {
      if (fs.existsSync(testPdfPath)) {
        try { fs.unlinkSync(testPdfPath); } catch (_) {}
      }
    });

    test('should extract CGPA and batch from PDF and update student profile', async () => {
      const mockStudent = {
        _id: studentId,
        collegeId,
        name: 'Aarav Sharma',
        resumeUrl: '',
        branch: 'Computer Science',
        batch: '',
        cgpa: 0,
        save: jest.fn().mockResolvedValue(true)
      };

      Student.findOne.mockResolvedValue(mockStudent);

      const req = {
        collegeId,
        user: { id: studentId, email: 'aarav@college.edu' },
        file: {
          filename: path.basename(testPdfPath),
          path: testPdfPath,
          originalname: 'resume.pdf'
        }
      };

      let responseBody = null;
      const res = {
        status(code) { return this; },
        json(data) {
          responseBody = data;
          return this;
        }
      };

      await studentController.uploadResume(req, res);

      expect(responseBody).toBeDefined();
      expect(responseBody.extractedCgpa).toBe(9.15);
      expect(responseBody.extractedBatch).toBe('2026');
      expect(mockStudent.cgpa).toBe(9.15);
      expect(mockStudent.batch).toBe('2026');
      expect(mockStudent.save).toHaveBeenCalled();
    });
  });
});
