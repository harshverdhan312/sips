const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const config = require('../src/config');
const prisma = require('../src/utils/prisma');
const { cleanDatabase, createTestToken } = require('./testHelper');

describe('SIPS JWT Authentication & CORS Security Boundary', () => {
  let publishedContestId;
  const collegeA = 'college_rvce_01';

  beforeAll(async () => {
    await cleanDatabase(prisma);

    // Create and publish a test contest for authenticated student discovery
    const contest = await prisma.contest.create({
      data: {
        title: 'Auth Verification Contest',
        description: 'Contest used to test student authentication',
        collegeId: collegeA,
        sipsDriveId: 'sips_auth_drive_101',
        startAt: new Date(Date.now() - 3600000), // 1 hour ago
        endAt: new Date(Date.now() + 7200000),   // 2 hours in future
        durationMinutes: 60,
        status: 'PUBLISHED'
      }
    });
    publishedContestId = contest.id;
  });

  afterAll(async () => {
    await cleanDatabase(prisma);
    await prisma.$disconnect();
  });

  describe('1. Valid JWT Verification', () => {
    test('Correctly signed SIPS-style JWT authenticates student and retrieves available contests', async () => {
      const validToken = createTestToken({
        id: 'student_auth_01',
        role: 'STUDENT',
        collegeId: collegeA,
        collegeSlug: 'rvce'
      });

      const res = await request(app)
        .get('/api/contests/available')
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('2. Invalid & Malformed JWT Rejection', () => {
    test('Token signed with wrong secret is rejected with HTTP 401', async () => {
      const wrongSecretToken = jwt.sign(
        { id: 'student_fake_01', role: 'STUDENT', collegeId: collegeA },
        'wrong-secret-key-1234567890',
        { expiresIn: '1h' }
      );

      const res = await request(app)
        .get('/api/contests/available')
        .set('Authorization', `Bearer ${wrongSecretToken}`);

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/invalid.*token/i);
    });

    test('Tampered or malformed JWT is rejected with HTTP 401', async () => {
      const validToken = createTestToken();
      const tamperedToken = validToken.substring(0, validToken.length - 8) + 'ABCDEFGH';

      const res = await request(app)
        .get('/api/contests/available')
        .set('Authorization', `Bearer ${tamperedToken}`);

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/invalid.*token/i);
    });
  });

  describe('3. Expired JWT Rejection', () => {
    test('Expired JWT is rejected with HTTP 401 TOKEN_EXPIRED', async () => {
      const expiredToken = createTestToken(
        { id: 'student_exp_01' },
        { expiresIn: '-10s' }
      );

      const res = await request(app)
        .get('/api/contests/available')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/token has expired/i);
    });
  });

  describe('4. Missing & Malformed Authorization Header', () => {
    test('Missing Authorization header without dev fallback fails in production simulation', async () => {
      const originalIsProd = config.isProduction;
      config.isProduction = true;
      try {
        const res = await request(app).get('/api/contests/available');

        expect(res.statusCode).toBe(401);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toMatch(/authentication required/i);
      } finally {
        config.isProduction = originalIsProd;
      }
    });

    test('Wrong authorization scheme (e.g. Basic) is rejected with HTTP 401', async () => {
      const res = await request(app)
        .get('/api/contests/available')
        .set('Authorization', 'Basic dXNlcm5hbWU6cGFzc3dvcmQ=');

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/invalid authorization scheme/i);
    });

    test('Empty Bearer token is rejected with HTTP 401', async () => {
      const res = await request(app)
        .get('/api/contests/available')
        .set('Authorization', 'Bearer ');

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/empty bearer token/i);
    });
  });

  describe('5. Identity & Claims Validation', () => {
    test('Token missing student identity claim (id) is rejected with HTTP 401', async () => {
      const tokenWithoutId = jwt.sign(
        { role: 'STUDENT', collegeId: collegeA },
        config.jwtSecret,
        { expiresIn: '1h' }
      );

      const res = await request(app)
        .get('/api/contests/available')
        .set('Authorization', `Bearer ${tokenWithoutId}`);

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/missing student identity/i);
    });

    test('Token missing collegeId claim is rejected with HTTP 401', async () => {
      const tokenWithoutCollege = jwt.sign(
        { id: 'student_no_college', role: 'STUDENT' },
        config.jwtSecret,
        { expiresIn: '1h' }
      );

      const res = await request(app)
        .get('/api/contests/available')
        .set('Authorization', `Bearer ${tokenWithoutCollege}`);

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/missing college context/i);
    });
  });

  describe('6. Role Validation & Access Control', () => {
    test('Non-student role (COLLEGE_ADMIN) is rejected on student routes with HTTP 403', async () => {
      const adminToken = createTestToken({
        id: 'admin_user_01',
        role: 'COLLEGE_ADMIN',
        collegeId: collegeA
      });

      const res = await request(app)
        .get('/api/contests/available')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/access denied.*student/i);
    });
  });

  describe('7. Identity Forgery Prevention', () => {
    test('Client cannot forge student identity using x-student-id when valid JWT is provided', async () => {
      const authenticStudentId = 'student_genuine_01';
      const forgedStudentId = 'student_attacker_99';

      const validToken = createTestToken({
        id: authenticStudentId,
        role: 'STUDENT',
        collegeId: collegeA
      });

      // Start contest attempt with forged header and forged body
      const res = await request(app)
        .post(`/api/contests/${publishedContestId}/attempts/start`)
        .set('Authorization', `Bearer ${validToken}`)
        .set('x-student-id', forgedStudentId)
        .send({
          studentId: forgedStudentId,
          collegeId: 'college_hacked_99'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);

      // Verify the persisted attempt belongs to the genuine student in the JWT, NOT the forged header/body
      const attempt = await prisma.contestAttempt.findUnique({
        where: { id: res.body.data.attempt.id }
      });
      expect(attempt.studentId).toBe(authenticStudentId);
      expect(attempt.collegeId).toBe(collegeA);
    });

    test('Client cannot override collegeId when valid JWT has a different collegeId', async () => {
      const authenticCollegeId = collegeA;
      const forgedCollegeId = 'college_other_02';

      const validToken = createTestToken({
        id: 'student_multi_college_01',
        role: 'STUDENT',
        collegeId: authenticCollegeId
      });

      const res = await request(app)
        .post(`/api/contests/${publishedContestId}/attempts/start`)
        .set('Authorization', `Bearer ${validToken}`)
        .set('x-college-id', forgedCollegeId)
        .send({
          collegeId: forgedCollegeId
        });

      expect(res.statusCode).toBe(201);
      const attempt = await prisma.contestAttempt.findUnique({
        where: { id: res.body.data.attempt.id }
      });
      expect(attempt.collegeId).toBe(authenticCollegeId);
    });
  });

  describe('8. Production Mode Security Enforcement', () => {
    test('Legacy development headers (x-student-id / x-college-id) are strictly rejected in production', async () => {
      const originalIsProd = config.isProduction;
      config.isProduction = true;
      try {
        const res = await request(app)
          .get('/api/contests/available')
          .set('x-student-id', 'student_dev_01')
          .set('x-college-id', collegeA);

        expect(res.statusCode).toBe(401);
        expect(res.body.success).toBe(false);
      } finally {
        config.isProduction = originalIsProd;
      }
    });

    test('Legacy Bearer colon-separated format (Bearer id:college) is strictly rejected in production', async () => {
      const originalIsProd = config.isProduction;
      config.isProduction = true;
      try {
        const res = await request(app)
          .get('/api/contests/available')
          .set('Authorization', `Bearer student_dev_01:${collegeA}`);

        expect(res.statusCode).toBe(401);
        expect(res.body.success).toBe(false);
      } finally {
        config.isProduction = originalIsProd;
      }
    });
  });

  describe('9. CORS Configuration', () => {
    test('CORS preflight from React development origin (http://localhost:5173) is accepted', async () => {
      const res = await request(app)
        .options('/api/contests/available')
        .set('Origin', 'http://localhost:5173')
        .set('Access-Control-Request-Method', 'GET')
        .set('Access-Control-Request-Headers', 'authorization,content-type');

      expect(res.statusCode).toBe(204);
      expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
      expect(res.headers['access-control-allow-credentials']).toBe('true');
    });

    test('CORS preflight from Practice dev origin (http://localhost:5174) is accepted', async () => {
      const res = await request(app)
        .options('/api/contests/available')
        .set('Origin', 'http://localhost:5174')
        .set('Access-Control-Request-Method', 'GET')
        .set('Access-Control-Request-Headers', 'authorization,content-type');

      expect(res.statusCode).toBe(204);
      expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5174');
      expect(res.headers['access-control-allow-credentials']).toBe('true');
    });
  });
});
