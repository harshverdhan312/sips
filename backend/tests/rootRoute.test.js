const request = require('supertest');
const app = require('../server');

describe('Backend Root (/) Route & Landing Page Integration', () => {
  test('GET / should serve landing page HTML when Accept header includes text/html', async () => {
    const res = await request(app)
      .get('/')
      .set('Accept', 'text/html');

    // Either 200 (if frontend/dist/index.html exists) or 302 (redirect to landing page)
    expect([200, 302]).toContain(res.statusCode);
    if (res.statusCode === 200) {
      expect(res.headers['content-type']).toMatch(/html/i);
    } else {
      expect(res.headers.location).toBeDefined();
    }
  });

  test('GET / should return JSON metadata pointing to landing page for API clients', async () => {
    const res = await request(app)
      .get('/')
      .set('Accept', 'application/json');

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('status', 'online');
    expect(res.body).toHaveProperty('landingPage');
    expect(res.body.landingPage).toBeDefined();
  });

  test('GET /health should return 200 ok', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
  });

  test('GET /api/unknown-endpoint should return 404', async () => {
    const res = await request(app).get('/api/unknown-endpoint');
    expect(res.statusCode).toBe(404);
  });
});
