const request = require('supertest');
const app = require('../server');
const config = require('../config');
const JobDescription = require('../models/JobDescription');
const Student = require('../models/Student');

jest.mock('../models/JobDescription');
jest.mock('../models/Student');

describe('Internal Placement Drive Eligibility API', () => {
  const secret = config.internalApiSecret || 'sips-dev-internal-secret-2025';

  const collegeId = '507f1f77bcf86cd799439011';
  const otherCollegeId = '507f1f77bcf86cd799439099';
  const driveId = '507f1f77bcf86cd799439044';
  const studentId = '507f1f77bcf86cd799439022';

  const mockDrive = {
    _id: driveId,
    collegeId,
    title: 'Software Development Engineer',
    company: 'Acme Corp',
    minCgpa: 7.5,
    allowedBranches: ['Computer Science & Engineering', 'Information Technology'],
    status: 'ACTIVE',
    deadline: new Date(Date.now() + 86400000) // tomorrow
  };

  const mockStudent = {
    _id: studentId,
    collegeId,
    name: 'Alice Smith',
    rollNo: 'CS001',
    branch: 'Computer Science & Engineering',
    cgpa: 8.5,
    placementStatus: 'UNPLACED',
    accountStatus: 'ACTIVE'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    JobDescription.findById.mockResolvedValue({ ...mockDrive });
    Student.findById.mockResolvedValue({ ...mockStudent });
  });

  describe('1. Authentication via X-Internal-Service-Secret', () => {
    test('missing secret header should return 401', async () => {
      const res = await request(app)
        .post(`/api/internal/placement-drives/${driveId}/eligibility`)
        .send({ studentId, collegeId });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/secret/i);
    });

    test('incorrect secret header should return 401', async () => {
      const res = await request(app)
        .post(`/api/internal/placement-drives/${driveId}/eligibility`)
        .set('X-Internal-Service-Secret', 'wrong-secret')
        .send({ studentId, collegeId });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    test('correct secret header should be accepted', async () => {
      const res = await request(app)
        .post(`/api/internal/placement-drives/${driveId}/eligibility`)
        .set('X-Internal-Service-Secret', secret)
        .send({ studentId, collegeId });

      expect(res.status).toBe(200);
      expect(res.body.eligible).toBe(true);
      expect(res.body.reasons).toEqual([]);
    });
  });

  describe('2. Parameter Validation', () => {
    test('missing studentId in request body returns 400', async () => {
      const res = await request(app)
        .post(`/api/internal/placement-drives/${driveId}/eligibility`)
        .set('X-Internal-Service-Secret', secret)
        .send({ collegeId });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/studentId/i);
    });

    test('missing collegeId in request body returns 400', async () => {
      const res = await request(app)
        .post(`/api/internal/placement-drives/${driveId}/eligibility`)
        .set('X-Internal-Service-Secret', secret)
        .send({ studentId });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/collegeId/i);
    });

    test('invalid ObjectId driveId returns 404', async () => {
      const res = await request(app)
        .post('/api/internal/placement-drives/invalid-id/eligibility')
        .set('X-Internal-Service-Secret', secret)
        .send({ studentId, collegeId });

      expect(res.status).toBe(404);
    });

    test('nonexistent drive returns 404', async () => {
      JobDescription.findById.mockResolvedValue(null);

      const res = await request(app)
        .post(`/api/internal/placement-drives/${driveId}/eligibility`)
        .set('X-Internal-Service-Secret', secret)
        .send({ studentId, collegeId });

      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/placement drive not found/i);
    });

    test('nonexistent student returns 404', async () => {
      Student.findById.mockResolvedValue(null);

      const res = await request(app)
        .post(`/api/internal/placement-drives/${driveId}/eligibility`)
        .set('X-Internal-Service-Secret', secret)
        .send({ studentId, collegeId });

      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/student not found/i);
    });
  });

  describe('3. College Tenancy & Isolation', () => {
    test('student from college B querying drive from college A returns 403', async () => {
      Student.findById.mockResolvedValue({
        ...mockStudent,
        collegeId: otherCollegeId
      });

      const res = await request(app)
        .post(`/api/internal/placement-drives/${driveId}/eligibility`)
        .set('X-Internal-Service-Secret', secret)
        .send({ studentId, collegeId });

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/mismatch/i);
    });

    test('request collegeId mismatching drive collegeId returns 403', async () => {
      const res = await request(app)
        .post(`/api/internal/placement-drives/${driveId}/eligibility`)
        .set('X-Internal-Service-Secret', secret)
        .send({ studentId, collegeId: otherCollegeId });

      expect(res.status).toBe(403);
    });
  });

  describe('4. Eligibility Rules Evaluation', () => {
    test('eligible student returns 200 { eligible: true, reasons: [] }', async () => {
      const res = await request(app)
        .post(`/api/internal/placement-drives/${driveId}/eligibility`)
        .set('X-Internal-Service-Secret', secret)
        .send({ studentId, collegeId });

      expect(res.status).toBe(200);
      expect(res.body.eligible).toBe(true);
      expect(res.body.reasons).toEqual([]);
    });

    test('insufficient CGPA returns { eligible: false, reasons: [...] }', async () => {
      Student.findById.mockResolvedValue({
        ...mockStudent,
        cgpa: 6.8
      });

      const res = await request(app)
        .post(`/api/internal/placement-drives/${driveId}/eligibility`)
        .set('X-Internal-Service-Secret', secret)
        .send({ studentId, collegeId });

      expect(res.status).toBe(200);
      expect(res.body.eligible).toBe(false);
      expect(res.body.reasons.some((r) => r.includes('CGPA'))).toBe(true);
    });

    test('ineligible branch returns { eligible: false, reasons: [...] }', async () => {
      Student.findById.mockResolvedValue({
        ...mockStudent,
        branch: 'Mechanical Engineering'
      });

      const res = await request(app)
        .post(`/api/internal/placement-drives/${driveId}/eligibility`)
        .set('X-Internal-Service-Secret', secret)
        .send({ studentId, collegeId });

      expect(res.status).toBe(200);
      expect(res.body.eligible).toBe(false);
      expect(res.body.reasons.some((r) => r.includes('branch'))).toBe(true);
    });

    test('closed or inactive placement drive returns { eligible: false }', async () => {
      JobDescription.findById.mockResolvedValue({
        ...mockDrive,
        status: 'CLOSED'
      });

      const res = await request(app)
        .post(`/api/internal/placement-drives/${driveId}/eligibility`)
        .set('X-Internal-Service-Secret', secret)
        .send({ studentId, collegeId });

      expect(res.status).toBe(200);
      expect(res.body.eligible).toBe(false);
      expect(res.body.reasons.some((r) => r.includes('closed'))).toBe(true);
    });

    test('expired drive deadline returns { eligible: false }', async () => {
      JobDescription.findById.mockResolvedValue({
        ...mockDrive,
        deadline: new Date(Date.now() - 86400000) // yesterday
      });

      const res = await request(app)
        .post(`/api/internal/placement-drives/${driveId}/eligibility`)
        .set('X-Internal-Service-Secret', secret)
        .send({ studentId, collegeId });

      expect(res.status).toBe(200);
      expect(res.body.eligible).toBe(false);
      expect(res.body.reasons.some((r) => r.includes('deadline'))).toBe(true);
    });

    test('debarred student returns { eligible: false } with debarment reason', async () => {
      Student.findById.mockResolvedValue({
        ...mockStudent,
        accountStatus: 'DEBARRED'
      });

      const res = await request(app)
        .post(`/api/internal/placement-drives/${driveId}/eligibility`)
        .set('X-Internal-Service-Secret', secret)
        .send({ studentId, collegeId });

      expect(res.status).toBe(200);
      expect(res.body.eligible).toBe(false);
      expect(res.body.reasons.some((r) => r.includes('debarred'))).toBe(true);
    });

    test('passout student returns { eligible: false }', async () => {
      Student.findById.mockResolvedValue({
        ...mockStudent,
        accountStatus: 'PASSOUT'
      });

      const res = await request(app)
        .post(`/api/internal/placement-drives/${driveId}/eligibility`)
        .set('X-Internal-Service-Secret', secret)
        .send({ studentId, collegeId });

      expect(res.status).toBe(200);
      expect(res.body.eligible).toBe(false);
      expect(res.body.reasons.some((r) => r.includes('PASSOUT'))).toBe(true);
    });

    test('opted-out student returns { eligible: false }', async () => {
      Student.findById.mockResolvedValue({
        ...mockStudent,
        placementStatus: 'OPTED_OUT'
      });

      const res = await request(app)
        .post(`/api/internal/placement-drives/${driveId}/eligibility`)
        .set('X-Internal-Service-Secret', secret)
        .send({ studentId, collegeId });

      expect(res.status).toBe(200);
      expect(res.body.eligible).toBe(false);
      expect(res.body.reasons.some((r) => r.includes('opted out'))).toBe(true);
    });
  });
});
