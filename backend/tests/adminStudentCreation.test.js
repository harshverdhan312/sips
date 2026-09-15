const adminStudentController = require('../controllers/adminStudentController');
const authController = require('../controllers/authController');
const College = require('../models/College');
const Student = require('../models/Student');
const AuditLog = require('../models/AuditLog');
const bcrypt = require('bcryptjs');

jest.mock('../models/College');
jest.mock('../models/Student');
jest.mock('../models/AuditLog');
jest.mock('bcryptjs');

describe('Placement Admin Student Provisioning & Dual Login', () => {
  const mockCollegeId = '507f1f77bcf86cd799439011';

  const createMockReq = (body = {}, user = null, collegeId = mockCollegeId) => ({
    body,
    user: user || { id: 'admin1', email: 'placement@rvce.edu', role: 'COLLEGE_ADMIN' },
    collegeId
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

  beforeEach(() => {
    jest.clearAllMocks();
    bcrypt.genSalt.mockResolvedValue('mocksalt');
    bcrypt.hash.mockResolvedValue('mockhashedpassword');
    bcrypt.compare.mockResolvedValue(true);
    AuditLog.create.mockResolvedValue({});
  });

  describe('Placement Admin Student Creation (adminStudentController.createStudent)', () => {
    test('should allow placement admin to create student with custom password', async () => {
      Student.findOne.mockResolvedValue(null);

      const mockSavedStudent = {
        _id: '507f1f77bcf86cd799439099',
        collegeId: mockCollegeId,
        name: 'Rohan Deshmukh',
        rollNo: '1RV21CS088',
        usn: '1RV21CS088',
        email: 'rohan@rvce.edu',
        branch: 'Computer Science & Engineering',
        batch: '2025',
        cgpa: 8.5,
        placementStatus: 'UNPLACED',
        readinessScore: 65,
        skills: ['Python', 'SQL'],
        save: jest.fn().mockResolvedValue(true)
      };

      Student.mockImplementation(() => mockSavedStudent);

      const req = createMockReq({
        name: 'Rohan Deshmukh',
        email: 'rohan@rvce.edu',
        rollNo: '1RV21CS088',
        password: 'custompassword123',
        branch: 'Computer Science & Engineering',
        batch: '2025',
        cgpa: 8.5
      });
      const res = createMockRes();

      await adminStudentController.createStudent(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.body.success).toBe(true);
      expect(res.body.student.email).toBe('rohan@rvce.edu');
      expect(res.body.student.initialPassword).toBe('custompassword123');
      expect(mockSavedStudent.save).toHaveBeenCalled();
    });

    test('should default initial password to rollNo if no password provided', async () => {
      Student.findOne.mockResolvedValue(null);

      const mockSavedStudent = {
        _id: '507f1f77bcf86cd799439099',
        collegeId: mockCollegeId,
        name: 'Sneha Patel',
        rollNo: '1RV21CS099',
        usn: '1RV21CS099',
        email: 'sneha@rvce.edu',
        branch: 'Computer Science & Engineering',
        batch: '2025',
        cgpa: 8.0,
        placementStatus: 'UNPLACED',
        readinessScore: 65,
        skills: [],
        save: jest.fn().mockResolvedValue(true)
      };

      Student.mockImplementation(() => mockSavedStudent);

      const req = createMockReq({
        name: 'Sneha Patel',
        email: 'sneha@rvce.edu',
        rollNo: '1RV21CS099',
        branch: 'Computer Science & Engineering',
        batch: '2025'
      });
      const res = createMockRes();

      await adminStudentController.createStudent(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.body.student.initialPassword).toBe('1RV21CS099');
    });

    test('should reject if required fields are missing', async () => {
      const req = createMockReq({ name: 'Sneha' });
      const res = createMockRes();

      await adminStudentController.createStudent(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.body.message).toContain('required');
    });

    test('should reject duplicate email or roll number with 409', async () => {
      Student.findOne.mockResolvedValue({ email: 'rohan@rvce.edu', rollNo: '1RV21CS088' });

      const req = createMockReq({
        name: 'Rohan Deshmukh',
        email: 'rohan@rvce.edu',
        rollNo: '1RV21CS088'
      });
      const res = createMockRes();

      await adminStudentController.createStudent(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.body.message).toContain('already registered');
    });
  });

  describe('Dual Login (Email or Roll Number)', () => {
    test('should log in student using institutional email', async () => {
      const mockCollege = {
        _id: mockCollegeId,
        slug: 'rvce',
        name: 'RV College of Engineering',
        adminEmail: 'placement@rvce.edu',
        acceptedDomains: ['rvce.edu']
      };
      College.findOne.mockResolvedValue(mockCollege);

      const mockStudent = {
        _id: '507f1f77bcf86cd799439099',
        name: 'Rohan Deshmukh',
        email: 'rohan@rvce.edu',
        collegeId: mockCollegeId,
        comparePassword: jest.fn().mockResolvedValue(true)
      };
      Student.findOne.mockResolvedValue(mockStudent);

      const req = createMockReq({
        email: 'rohan@rvce.edu',
        password: 'custompassword123'
      });
      const res = createMockRes();

      await authController.login(req, res);

      expect(res.body.role).toBe('STUDENT');
      expect(res.body.token).toBeDefined();
      expect(res.body.studentName).toBe('Rohan Deshmukh');
    });

    test('should log in student using Roll Number / USN (no @ in identifier)', async () => {
      const mockStudent = {
        _id: '507f1f77bcf86cd799439099',
        name: 'Rohan Deshmukh',
        rollNo: '1RV21CS088',
        email: 'rohan@rvce.edu',
        collegeId: mockCollegeId,
        comparePassword: jest.fn().mockResolvedValue(true)
      };
      Student.findOne.mockResolvedValue(mockStudent);

      const mockCollege = {
        _id: mockCollegeId,
        slug: 'rvce',
        name: 'RV College of Engineering'
      };
      College.findById.mockResolvedValue(mockCollege);

      const req = createMockReq({
        identifier: '1RV21CS088',
        password: '1RV21CS088'
      });
      const res = createMockRes();

      await authController.login(req, res);

      expect(res.body.role).toBe('STUDENT');
      expect(res.body.token).toBeDefined();
      expect(res.body.studentName).toBe('Rohan Deshmukh');
    });

    test('should reject student login with invalid password', async () => {
      const mockCollege = {
        _id: mockCollegeId,
        slug: 'rvce',
        adminEmail: 'placement@rvce.edu',
        acceptedDomains: ['rvce.edu']
      };
      College.findOne.mockResolvedValue(mockCollege);

      const mockStudent = {
        _id: '507f1f77bcf86cd799439099',
        email: 'rohan@rvce.edu',
        collegeId: mockCollegeId,
        comparePassword: jest.fn().mockResolvedValue(false)
      };
      Student.findOne.mockResolvedValue(mockStudent);

      const req = createMockReq({
        email: 'rohan@rvce.edu',
        password: 'wrongpassword'
      });
      const res = createMockRes();

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.body.message).toBe('Invalid credentials');
    });
  });
});
