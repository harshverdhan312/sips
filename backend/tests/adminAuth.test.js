const auth = require('../middleware/auth');
const tenant = require('../middleware/tenant');
const adminOnly = require('../middleware/adminOnly');
const { createAdminToken, createStudentToken } = require('./helpers');

describe('Admin Authentication & Authorization Middleware', () => {
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

  test('should reject request without Authorization header with 401', () => {
    const req = { headers: {} };
    const res = createMockRes();
    const next = jest.fn();

    auth(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringMatching(/Authentication required/i) })
    );
    expect(next).not.toHaveBeenCalled();
  });

  test('should reject malformed Authorization header with 401', () => {
    const req = { headers: { authorization: 'Basic 12345' } };
    const res = createMockRes();
    const next = jest.fn();

    auth(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('should reject invalid token with 401', () => {
    const req = { headers: { authorization: 'Bearer invalid.fake.token' } };
    const res = createMockRes();
    const next = jest.fn();

    auth(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringMatching(/Invalid or expired token/i) })
    );
    expect(next).not.toHaveBeenCalled();
  });

  test('should populate req.user on valid token', () => {
    const token = createAdminToken('507f1f77bcf86cd799439011');
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = createMockRes();
    const next = jest.fn();

    auth(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.user).toBeDefined();
    expect(req.user.role).toBe('COLLEGE_ADMIN');
    expect(req.user.collegeId).toBe('507f1f77bcf86cd799439011');
  });

  test('tenant middleware sets req.collegeId from req.user', () => {
    const req = { user: { collegeId: '507f1f77bcf86cd799439011' } };
    const res = createMockRes();
    const next = jest.fn();

    tenant(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.collegeId).toBe('507f1f77bcf86cd799439011');
  });

  test('tenant middleware rejects request missing college context with 401', () => {
    const req = { user: {} };
    const res = createMockRes();
    const next = jest.fn();

    tenant(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('adminOnly middleware rejects student role with 403 Forbidden', () => {
    const req = { user: { role: 'STUDENT', collegeId: '507f1f77bcf86cd799439011' } };
    const res = createMockRes();
    const next = jest.fn();

    adminOnly(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringMatching(/Admin access required/i) })
    );
    expect(next).not.toHaveBeenCalled();
  });

  test('adminOnly middleware allows COLLEGE_ADMIN role', () => {
    const req = { user: { role: 'COLLEGE_ADMIN', collegeId: '507f1f77bcf86cd799439011' } };
    const res = createMockRes();
    const next = jest.fn();

    adminOnly(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});
