const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../server');
const config = require('../config');
const { isValidId, validateObjectId, validatePagination } = require('../middleware/validate');
const logger = require('../utils/logger');
const AppError = require('../utils/appError');
const errorHandler = require('../middleware/errorHandler');
const adminStudentController = require('../controllers/adminStudentController');
const Student = require('../models/Student');

jest.mock('../models/Student');
jest.mock('../models/Match');
jest.mock('../models/AuditLog');

describe('Phase 1: Backend Foundation Hardening', () => {

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

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('1. Centralized Configuration Layer', () => {
    it('should export all required configuration parameters with defaults', () => {
      expect(config).toBeDefined();
      expect(config.env).toBeDefined();
      expect(typeof config.port).toBe('number');
      expect(typeof config.jwtSecret).toBe('string');
      expect(typeof config.jwtExpiresIn).toBe('string');
      expect(typeof config.mongoUri).toBe('string');
      expect(typeof config.frontendUrl).toBe('string');
      expect(typeof config.uploadLimitBytes).toBe('number');
      expect(typeof config.uploadDir).toBe('string');
    });
  });

  describe('2. Parameter Safety & ObjectId Validation', () => {
    it('should recognize valid MongoDB 24-hex ObjectIds', () => {
      expect(isValidId('507f1f77bcf86cd799439011')).toBe(true);
      expect(isValidId('60d5ecb8b392d40015f8a7e1')).toBe(true);
    });

    it('should recognize valid in-memory DB fallback IDs', () => {
      expect(isValidId('std_1700000000_1001')).toBe(true);
      expect(isValidId('job_1700000000_1002')).toBe(true);
      expect(isValidId('col_1700000000_1003')).toBe(true);
      expect(isValidId('alt_1700000000_1004')).toBe(true);
    });

    it('should reject malformed or dangerous ID strings', () => {
      expect(isValidId('')).toBe(false);
      expect(isValidId('invalid-id')).toBe(false);
      expect(isValidId('12345')).toBe(false);
      expect(isValidId('../etc/passwd')).toBe(false);
      expect(isValidId('{"$gt":""}')).toBe(false);
      expect(isValidId(null)).toBe(false);
      expect(isValidId(undefined)).toBe(false);
    });

    it('should reject malformed :id with 400 via validateObjectId middleware', () => {
      const middleware = validateObjectId('id');
      const req = { params: { id: 'invalid-id-xyz' } };
      const res = createMockRes();
      const next = jest.fn();

      middleware(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Invalid resource identifier format/i);
      expect(next).not.toHaveBeenCalled();
    });

    it('should pass valid 24-hex ObjectId via validateObjectId middleware', () => {
      const middleware = validateObjectId('id');
      const req = { params: { id: '507f1f77bcf86cd799439011' } };
      const res = createMockRes();
      const next = jest.fn();

      middleware(req, res, next);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('validatePagination should clamp query parameters correctly', () => {
      const req = { query: { page: '-5', limit: '500' } };
      const res = createMockRes();
      const next = jest.fn();

      validatePagination(req, res, next);
      expect(req.query.page).toBe(1);
      expect(req.query.limit).toBe(100);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('3. AppError & Centralized Error Handling', () => {
    it('AppError creates operational error with status and statusCode', () => {
      const err = new AppError('Resource not found', 404);
      expect(err).toBeInstanceOf(Error);
      expect(err.statusCode).toBe(404);
      expect(err.status).toBe('fail');
      expect(err.isOperational).toBe(true);
      expect(err.message).toBe('Resource not found');
    });

    it('errorHandler should handle malformed JSON syntax errors with 400', () => {
      const syntaxErr = new SyntaxError('Unexpected token in JSON');
      syntaxErr.status = 400;
      syntaxErr.body = '{ malformed';

      const req = { originalUrl: '/api/test', method: 'POST' };
      const res = createMockRes();
      const next = jest.fn();

      errorHandler(syntaxErr, req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Malformed JSON payload/i);
    });

    it('errorHandler should handle Mongoose CastError with 400', () => {
      const castErr = new Error('Cast to ObjectId failed');
      castErr.name = 'CastError';

      const req = { originalUrl: '/api/test', method: 'GET' };
      const res = createMockRes();
      const next = jest.fn();

      errorHandler(castErr, req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Invalid resource identifier/i);
    });

    it('errorHandler should handle Mongoose duplicate key error (11000) with 409', () => {
      const dupErr = new Error('Duplicate key');
      dupErr.code = 11000;
      dupErr.keyValue = { email: 'duplicate@college.edu' };

      const req = { originalUrl: '/api/test', method: 'POST' };
      const res = createMockRes();
      const next = jest.fn();

      errorHandler(dupErr, req, res, next);
      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/already exists/i);
    });

    it('should return standardized 404 for unknown endpoints', async () => {
      const res = await request(app).get('/api/non-existent-route-xyz');
      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/not found/i);
    });
  });

  describe('4. Safe Logging & Data Sanitization', () => {
    it('should redact sensitive authentication keys', () => {
      const raw = {
        email: 'admin@college.edu',
        password: 'superSecretPassword',
        passwordHash: '$2a$10$xyz',
        token: 'eyJhbGciOi...',
        masterPassword: 'collegeMasterPassword',
        nested: {
          jwtSecret: 'topsecret',
          safeField: 'visible'
        }
      };

      const sanitized = logger.sanitize(raw);
      expect(sanitized.email).toBe('admin@college.edu');
      expect(sanitized.password).toBe('[REDACTED]');
      expect(sanitized.passwordHash).toBe('[REDACTED]');
      expect(sanitized.token).toBe('[REDACTED]');
      expect(sanitized.masterPassword).toBe('[REDACTED]');
      expect(sanitized.nested.jwtSecret).toBe('[REDACTED]');
      expect(sanitized.nested.safeField).toBe('visible');
    });
  });

  describe('5. Authentication & Role Boundaries', () => {
    it('should reject forged JWT signed with wrong secret', async () => {
      const forgedToken = jwt.sign(
        { id: '507f1f77bcf86cd799439022', role: 'STUDENT', collegeId: '507f1f77bcf86cd799439011' },
        'wrong-secret-key'
      );

      const res = await request(app)
        .get('/api/student/profile')
        .set('Authorization', `Bearer ${forgedToken}`);

      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/Invalid or expired token/i);
    });

    it('should prevent student token from accessing admin routes', async () => {
      const studentToken = jwt.sign(
        { id: '507f1f77bcf86cd799439022', role: 'STUDENT', collegeId: '507f1f77bcf86cd799439011' },
        config.jwtSecret,
        { expiresIn: '1h' }
      );

      const res = await request(app)
        .get('/api/admin/overview')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/Admin access required/i);
    });
  });

  describe('6. Multi-Tenant Isolation Protection', () => {
    it('should enforce collegeId tenant isolation on student lookup and return 404 for cross-college access', async () => {
      const collegeAId = '507f1f77bcf86cd799439011';
      const studentBId = '507f1f77bcf86cd799439088';

      Student.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(null) // Not found in College A
      });

      const req = {
        params: { id: studentBId },
        collegeId: collegeAId,
        user: { id: collegeAId, role: 'COLLEGE_ADMIN', collegeId: collegeAId }
      };
      const res = createMockRes();

      await adminStudentController.getStudentById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.body.message).toBe('Student not found');
      expect(Student.findOne).toHaveBeenCalledWith(expect.objectContaining({
        _id: studentBId,
        collegeId: collegeAId
      }));
    });
  });

});
