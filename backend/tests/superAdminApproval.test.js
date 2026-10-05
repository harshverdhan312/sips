const request = require('supertest');
const app = require('../server');
const memoryDb = require('../utils/memoryDb');

describe('Super Admin College Verification & Global Question Governance Flow', () => {
  let superAdminToken;
  let collegeAdminToken;
  let collegeId;
  let generatedTempPassword;
  const collegeUsername = `testuniv_${Date.now()}`;
  const collegeEmail = `${collegeUsername}@university.edu`;

  it('Step 1: College submits onboarding request -> status PENDING_APPROVAL', async () => {
    const res = await request(app)
      .post('/api/institution/onboard')
      .send({
        name: 'Apex Institute of Technology',
        code: 'AIT',
        officialEmail: collegeEmail,
        adminUsername: collegeUsername,
        adminPassword: 'InitialPass@123',
        address: 'Knowledge Park, Tech City',
        website: 'https://apex.edu'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.pendingApproval).toBe(true);
    expect(res.body.institution.status).toBe('PENDING_APPROVAL');
    expect(res.body.token).toBeUndefined(); // Cannot log in yet

    collegeId = res.body.institutionId || res.body.institution._id || res.body.institution.id;
  });

  it('Step 2: College admin cannot log in while in PENDING_APPROVAL status', async () => {
    const res = await request(app)
      .post('/api/auth/institution-login')
      .send({
        identifier: collegeUsername,
        password: 'InitialPass@123'
      });

    expect(res.status).toBe(403);
    expect(res.body.status).toBe('PENDING_APPROVAL');
  });

  it('Step 3: Super Admin logs in and views pending approval queue', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        identifier: 'superadmin',
        password: process.env.SUPERADMIN_PASSWORD || 'test_superadmin_auth'
      });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.role).toBe('SUPERADMIN');
    expect(loginRes.body.isSuperAdmin).toBe(true);
    expect(loginRes.body.token).toBeDefined();

    superAdminToken = loginRes.body.token;

    const pendingRes = await request(app)
      .get('/api/super-admin/colleges/pending')
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(pendingRes.status).toBe(200);
    expect(pendingRes.body.success).toBe(true);
    const found = pendingRes.body.colleges.find(c => c.officialEmail === collegeEmail || c.adminUsername === collegeUsername);
    expect(found).toBeDefined();
    expect(found.status).toBe('PENDING_APPROVAL');
  });

  it('Step 4: Super Admin approves the college and dispatches credentials', async () => {
    const approveRes = await request(app)
      .post(`/api/super-admin/colleges/${collegeId}/approve`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        tempPassword: 'SipsSecurePass@99',
        loginUrl: 'http://localhost:5173/login'
      });

    expect(approveRes.status).toBe(200);
    expect(approveRes.body.success).toBe(true);
    expect(approveRes.body.college.status).toBe('ACTIVE');
    expect(approveRes.body.credentials.tempPassword).toBe('SipsSecurePass@99');

    generatedTempPassword = approveRes.body.credentials.tempPassword;
  });

  it('Step 5: College logs in with temporary password and receives needsPasswordReset: true', async () => {
    const loginRes = await request(app)
      .post('/api/auth/institution-login')
      .send({
        identifier: collegeUsername,
        password: generatedTempPassword
      });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.role).toBe('MAIN_UNIVERSITY_ADMIN');
    expect(loginRes.body.token).toBeDefined();
    expect(loginRes.body.needsPasswordReset).toBe(true);

    collegeAdminToken = loginRes.body.token;
  });

  it('Step 6: College updates password via /api/auth/change-password', async () => {
    const changeRes = await request(app)
      .post('/api/auth/change-password')
      .set('Authorization', `Bearer ${collegeAdminToken}`)
      .send({
        currentPassword: generatedTempPassword,
        newPassword: 'MyPermanentPass@2026'
      });

    expect(changeRes.status).toBe(200);
    expect(changeRes.body.success).toBe(true);

    // Verify login with new password
    const newLoginRes = await request(app)
      .post('/api/auth/institution-login')
      .send({
        identifier: collegeUsername,
        password: 'MyPermanentPass@2026'
      });

    expect(newLoginRes.status).toBe(200);
    expect(newLoginRes.body.needsPasswordReset).toBe(false);
  });

  it('Step 7: Super Admin manages global question bank (create, list, archive)', async () => {
    // 7.1 Create global question
    const createRes = await request(app)
      .post('/api/super-admin/questions')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        title: 'Global Binary Search Implementation',
        statement: 'Implement standard binary search in an ascending sorted array of integers.',
        type: 'CODING',
        category: 'Algorithms',
        difficulty: 'EASY',
        tags: ['binary-search', 'algorithms'],
        testCases: [{ input: '5\n1 2 3 4 5\n3', output: '2' }]
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.success).toBe(true);
    const createdId = createRes.body.data?.id || createRes.body.data?._id;

    // 7.2 List global questions
    const listRes = await request(app)
      .get('/api/super-admin/questions?type=CODING')
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(listRes.status).toBe(200);
    expect(listRes.body.success).toBe(true);
    expect(Array.isArray(listRes.body.data)).toBe(true);

    // 7.3 Archive global question
    if (createdId) {
      const archiveRes = await request(app)
        .post(`/api/super-admin/questions/${createdId}/archive`)
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(archiveRes.status).toBe(200);
      expect(archiveRes.body.success).toBe(true);
    }
  });
});
