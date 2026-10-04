const request = require('supertest');
const express = require('express');
const internalRoutes = require('../routes/internal');
const JobDescription = require('../models/JobDescription');
const Student = require('../models/Student');
const config = require('../config');

jest.mock('../models/JobDescription');
jest.mock('../models/Student');
jest.mock('../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn()
}));

describe('SIPS Internal Drive Metadata Endpoint', () => {
  let app;
  const validSecret = config.internalApiSecret || 'test-internal-secret';
  const mockCollegeId = '507f1f77bcf86cd799439011';
  const mockDriveId = '507f1f77bcf86cd799439022';
  const otherCollegeId = '507f1f77bcf86cd799439033';

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/internal', internalRoutes);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should reject request without X-Internal-Service-Secret header', async () => {
    const res = await request(app)
      .get(`/api/internal/placement-drives/${mockDriveId}`);

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('should reject request with invalid secret', async () => {
    const res = await request(app)
      .get(`/api/internal/placement-drives/${mockDriveId}`)
      .set('X-Internal-Service-Secret', 'wrong-secret');

    expect(res.status).toBe(401);
  });

  test('should return 404 for invalid ObjectId format', async () => {
    const res = await request(app)
      .get('/api/internal/placement-drives/not-an-object-id')
      .set('X-Internal-Service-Secret', validSecret);

    expect(res.status).toBe(404);
  });

  test('should return 404 when placement drive does not exist', async () => {
    JobDescription.findById.mockResolvedValue(null);

    const res = await request(app)
      .get(`/api/internal/placement-drives/${mockDriveId}`)
      .set('X-Internal-Service-Secret', validSecret);

    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/not found/i);
  });

  test('should return 403 when collegeId query param mismatches drive college', async () => {
    JobDescription.findById.mockResolvedValue({
      _id: mockDriveId,
      title: 'Software Engineer',
      company: 'Amazon',
      collegeId: mockCollegeId,
      status: 'ACTIVE'
    });

    const res = await request(app)
      .get(`/api/internal/placement-drives/${mockDriveId}?collegeId=${otherCollegeId}`)
      .set('X-Internal-Service-Secret', validSecret);

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/tenant college mismatch/i);
  });

  test('should return drive metadata for valid drive and matching college', async () => {
    JobDescription.findById.mockResolvedValue({
      _id: mockDriveId,
      title: 'Full Stack Engineer',
      role: 'Full Stack Engineer',
      company: 'Google',
      collegeId: mockCollegeId,
      status: 'ACTIVE',
      deadline: new Date('2026-12-31'),
      minCgpa: 8.0,
      allowedBranches: ['Computer Science & Engineering']
    });

    const res = await request(app)
      .get(`/api/internal/placement-drives/${mockDriveId}?collegeId=${mockCollegeId}`)
      .set('X-Internal-Service-Secret', validSecret);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.drive).toBeDefined();
    expect(res.body.drive.id).toBe(mockDriveId);
    expect(res.body.drive.company).toBe('Google');
    expect(res.body.drive.collegeId).toBe(mockCollegeId);
    expect(res.body.drive.minCgpa).toBe(8.0);
  });
});
