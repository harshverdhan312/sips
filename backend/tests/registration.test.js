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
    test('should reject student self-registration with 403 (disabled per requirements)', async () => {
      const req = createMockReq({
        name: 'Aarav Sharma',
        email: 'aarav@rvce.edu',
        password: 'Password123',
        rollNo: '1RV21CS001'
      });
      const res = createMockRes();

      await authController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.body.message).toContain('Student self-registration is disabled');
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
