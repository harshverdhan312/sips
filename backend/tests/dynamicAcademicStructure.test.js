const collegeController = require('../controllers/collegeController');
const adminStudentController = require('../controllers/adminStudentController');
const studentController = require('../controllers/studentController');
const College = require('../models/College');
const Student = require('../models/Student');
const AuditLog = require('../models/AuditLog');
const bcrypt = require('bcryptjs');

jest.mock('../models/College');
jest.mock('../models/Student');
jest.mock('../models/AuditLog');
jest.mock('bcryptjs');

describe('Dynamic Academic Structure & Zero Initial Score Enforcement', () => {
  const mockCollegeId = '507f1f77bcf86cd799439011';

  const createMockReq = (body = {}, user = null, collegeId = mockCollegeId, params = {}) => ({
    body,
    user: user || { id: 'admin1', email: 'admin@rvce.edu', role: 'COLLEGE_ADMIN' },
    collegeId,
    params
  });

  const createMockRes = () => {
    const res = {};
    res.statusCode = 200;
    res.status = jest.fn().mockImplementation((code) => {
      res.statusCode = code;
      return res;
    });
    res.json = jest.fn().mockImplementation((data) => {
      res.body = data;
      return res;
    });
    return res;
  };

  const sampleAcademicStructure = [
    {
      courseName: 'B.Tech',
      branches: [
        { branchName: 'Computer Science', sections: ['A', 'B'] },
        { branchName: 'Electronics & Communication', sections: ['A'] }
      ]
    },
    {
      courseName: 'MBA',
      branches: [
        { branchName: 'Finance', sections: ['A'] }
      ]
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    bcrypt.genSalt.mockResolvedValue('mocksalt');
    bcrypt.hash.mockResolvedValue('mockhashedpassword');
    AuditLog.create.mockResolvedValue({});
  });

  describe('Academic Structure Validation Helper', () => {
    test('should validate valid academic structure hierarchy and return structured array', () => {
      const result = collegeController.validateAcademicStructure(sampleAcademicStructure);
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(2);
      expect(result[0].courseName).toBe('B.Tech');
      expect(result[0].branches[0].sections).toEqual(['A', 'B']);
    });

    test('should reject invalid structure missing course name or branches by throwing Error', () => {
      const invalid = [{ courseName: '', branches: [] }];
      expect(() => {
        collegeController.validateAcademicStructure(invalid);
      }).toThrow('requires a valid course/program name');
    });

    test('should validate student fields against structure', () => {
      const validCheck = collegeController.validateStudentAgainstStructure(
        sampleAcademicStructure,
        { course: 'B.Tech', branch: 'Computer Science', section: 'A' }
      );
      expect(validCheck.valid).toBe(true);

      const invalidCourseCheck = collegeController.validateStudentAgainstStructure(
        sampleAcademicStructure,
        { course: 'MBBS', branch: 'Medicine', section: 'A' }
      );
      expect(invalidCourseCheck.valid).toBe(false);
      expect(invalidCourseCheck.message).toContain('not offered at this institution');

      const invalidSectionCheck = collegeController.validateStudentAgainstStructure(
        sampleAcademicStructure,
        { course: 'B.Tech', branch: 'Computer Science', section: 'Z' }
      );
      expect(invalidSectionCheck.valid).toBe(false);
      expect(invalidSectionCheck.message).toContain('Section "Z" is not defined');
    });
  });

  describe('College Academic Structure API Endpoints', () => {
    test('getAcademicStructure should return academicStructure and branch list', async () => {
      College.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue({
          _id: mockCollegeId,
          academicStructure: sampleAcademicStructure
        })
      });

      const req = createMockReq();
      const res = createMockRes();

      await collegeController.getAcademicStructure(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.body.success).toBe(true);
      expect(res.body.academicStructure).toHaveLength(2);
      expect(res.body.branches).toContain('Computer Science');
      expect(res.body.branches).toContain('Finance');
    });

    test('updateAcademicStructure should update and persist valid structure', async () => {
      College.findByIdAndUpdate.mockReturnValue({
        select: jest.fn().mockResolvedValue({
          _id: mockCollegeId,
          academicStructure: sampleAcademicStructure
        })
      });

      const req = createMockReq({ academicStructure: sampleAcademicStructure });
      const res = createMockRes();

      await collegeController.updateAcademicStructure(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(College.findByIdAndUpdate).toHaveBeenCalled();
      expect(res.body.success).toBe(true);
      expect(res.body.academicStructure).toHaveLength(2);
    });
  });

  describe('Student Provisioning with Zero Initial Scores and Structure Validation', () => {
    test('createStudent should validate structure and initialize scores to 0 without fabricated skills', async () => {
      Student.findOne.mockResolvedValue(null);
      College.findById.mockResolvedValue({
        _id: mockCollegeId,
        name: 'RV College of Engineering',
        academicStructure: sampleAcademicStructure
      });

      let capturedInstance = null;
      Student.mockImplementation(function (doc) {
        capturedInstance = this;
        Object.assign(this, doc, {
          _id: 'mockstudent123',
          save: jest.fn().mockResolvedValue(true)
        });
        return this;
      });

      const req = createMockReq({
        name: 'Aarav Sharma',
        email: 'aarav@rvce.edu',
        rollNo: '1RV21CS001',
        course: 'B.Tech',
        branch: 'Computer Science',
        section: 'A',
        batch: '2025',
        cgpa: 8.9
      });
      const res = createMockRes();

      await adminStudentController.createStudent(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.body.success).toBe(true);
      expect(res.body.student.course).toBe('B.Tech');
      expect(res.body.student.branch).toBe('Computer Science');
      expect(res.body.student.section).toBe('A');
      // Crucial: scores must be 0, not 65
      expect(res.body.student.readinessScore).toBe(0);
      expect(res.body.student.technicalScore).toBe(0);
      expect(res.body.student.softSkillScore).toBe(0);
      expect(res.body.student.resumeScore).toBe(0);
      expect(res.body.student.skills).toEqual([]);
    });

    test('createStudent should reject student if course does not match college academic structure', async () => {
      Student.findOne.mockResolvedValue(null);
      College.findById.mockResolvedValue({
        _id: mockCollegeId,
        name: 'RV College of Engineering',
        academicStructure: sampleAcademicStructure
      });

      const req = createMockReq({
        name: 'Invalid Student',
        email: 'invalid@rvce.edu',
        rollNo: '1RV21CS999',
        course: 'NonExistentDegree',
        branch: 'Computer Science',
        section: 'A'
      });
      const res = createMockRes();

      await adminStudentController.createStudent(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.body.message).toContain('not offered at this institution');
    });
  });

  describe('Student Resume Deletion and Skill Reset', () => {
    test('deleteResume should reset resumeUrl, scores to 0, and clear resume-derived skills', async () => {
      const mockStudent = {
        _id: 'stud123',
        collegeId: mockCollegeId,
        resumeUrl: '/uploads/resumes/sample-resume.pdf',
        readinessScore: 78,
        technicalScore: 80,
        softSkillScore: 75,
        resumeScore: 85,
        skills: ['Python', 'React', 'MongoDB'],
        save: jest.fn().mockResolvedValue(true)
      };

      Student.findOne.mockResolvedValue(mockStudent);

      const req = {
        user: { id: 'stud123', role: 'student' },
        collegeId: mockCollegeId
      };
      const res = createMockRes();

      await studentController.deleteResume(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(mockStudent.resumeUrl).toBe('');
      expect(mockStudent.readinessScore).toBe(0);
      expect(mockStudent.technicalScore).toBe(0);
      expect(mockStudent.softSkillScore).toBe(0);
      expect(mockStudent.resumeScore).toBe(0);
      expect(mockStudent.skills).toEqual([]);
      expect(mockStudent.save).toHaveBeenCalled();
      expect(res.body.message).toContain('Resume removed successfully');
    });
  });
});
