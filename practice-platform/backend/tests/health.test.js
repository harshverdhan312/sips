const request = require('supertest');
const app = require('../src/app');

describe('API Foundation & Health Check', () => {
  test('GET /health returns healthy status', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      success: true,
      service: 'practice-platform',
      status: 'healthy'
    });
  });

  test('GET /api/health returns healthy status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      success: true,
      service: 'practice-platform',
      status: 'healthy'
    });
  });

  test('GET /unknown-route returns 404 with structured error', async () => {
    const res = await request(app).get('/unknown-route');
    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Cannot find /unknown-route on this server');
  });
});
