const authController = require('../controllers/authController');
const collegeController = require('../controllers/collegeController');
const College = require('../models/College');
const Student = require('../models/Student');
const bcrypt = require('bcryptjs');

jest.mock('../models/College');
jest.mock('../models/Student');
jest.mock('bcryptjs');

describe('Registration Functionality (Student & College)', () => {
  const mockCollegeId = '507f1f77bcf86cd799439011';

  const createMockReq = (body = {}) => ({
    body
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
  });

  describe('Student Registration (authController.register)', () => {
    test('should register student successfully and return token with role STUDENT', async () => {
      const mockCollege = {
        _id: mockCollegeId,
        name: 'RV College of Engineering',
        slug: 'rvce',
        acceptedDomains: ['rvce.edu']
      };

      College.findOne.mockResolvedValue(mockCollege);
      Student.findOne.mockResolvedValue(null);

      const mockSavedStudent = {
        _id: '507f1f77bcf86cd799439099',
        name: 'Aarav Sharma',
        rollNo: '1RV21CS001',
        usn: '1RV21CS001',
        email: 'aarav@rvce.edu',
        branch: 'Computer Science & Engineering',
        batch: '2025',
        placementStatus: 'UNPLACED',
        save: jest.fn().mockResolvedValue(true)
      };

      Student.mockImplementation(() => mockSavedStudent);

      const req = createMockReq({
        name: 'Aarav Sharma',
        email: 'aarav@rvce.edu',
        password: 'Password123',
        rollNo: '1RV21CS001',
        branch: 'Computer Science & Engineering',
        batch: '2025'
      });
      const res = createMockRes();

      await authController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.role).toBe('STUDENT');
      expect(res.body.student.name).toBe('Aarav Sharma');
      expect(mockSavedStudent.save).toHaveBeenCalled();
    });

    test('should reject registration if required fields are missing', async () => {
      const req = createMockReq({ name: 'Aarav', email: 'aarav@rvce.edu' });
      const res = createMockRes();

      await authController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.body.message).toContain('required');
    });

    test('should reject registration if password is under 6 characters', async () => {
      const req = createMockReq({
        name: 'Aarav',
        email: 'aarav@rvce.edu',
        password: '123',
        rollNo: 'CS01'
      });
      const res = createMockRes();

      await authController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.body.message).toContain('6 characters');
    });

    test('should reject if email domain is not registered with any college', async () => {
      College.findOne.mockResolvedValue(null);

      const req = createMockReq({
        name: 'Aarav',
        email: 'aarav@unknowncollege.edu',
        password: 'Password123',
        rollNo: 'CS01'
      });
      const res = createMockRes();

      await authController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.body.message).toContain('not registered with any institution');
    });

    test('should reject if student with email already exists in college with 409', async () => {
      const mockCollege = { _id: mockCollegeId, slug: 'rvce' };
      College.findOne.mockResolvedValue(mockCollege);
      Student.findOne.mockResolvedValue({ email: 'aarav@rvce.edu', rollNo: 'CS01' });

      const req = createMockReq({
        name: 'Aarav',
        email: 'aarav@rvce.edu',
        password: 'Password123',
        rollNo: 'CS01'
      });
      const res = createMockRes();

      await authController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.body.message).toContain('already registered');
    });
  });

  describe('College Registration (collegeController.registerCollege)', () => {
    test('should register college tenant and return admin JWT token', async () => {
      College.findOne.mockResolvedValue(null);

      const mockSavedCollege = {
        _id: mockCollegeId,
        name: 'PES University',
        slug: 'pes',
        adminEmail: 'admin@pes.edu',
        acceptedDomains: ['pes.edu'],
        save: jest.fn().mockResolvedValue(true)
      };

      College.mockImplementation(() => mockSavedCollege);

      const req = createMockReq({
        name: 'PES University',
        slug: 'pes',
        adminEmail: 'admin@pes.edu',
        masterPassword: 'SecureMasterPassword123',
        acceptedDomains: ['pes.edu']
      });
      const res = createMockRes();

      await collegeController.registerCollege(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.role).toBe('COLLEGE_ADMIN');
      expect(res.body.collegeSlug).toBe('pes');
      expect(mockSavedCollege.save).toHaveBeenCalled();
    });

    test('should reject if admin email domain does not match acceptedDomains', async () => {
      const req = createMockReq({
        name: 'PES University',
        slug: 'pes',
        adminEmail: 'admin@gmail.com',
        masterPassword: 'Password123',
        acceptedDomains: ['pes.edu']
      });
      const res = createMockRes();

      await collegeController.registerCollege(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.body.message).toContain('Admin email domain must match');
    });
  });
});
