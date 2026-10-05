const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const prisma = require('../src/utils/prisma');
const config = require('../src/config');
const { cleanDatabase } = require('./testHelper');

describe('Phase 7E — Admin Question Management Test Suite', () => {
  const superAdminToken = jwt.sign(
    { id: 'super-admin-01', role: 'SUPERADMIN', collegeId: null },
    config.jwtSecret,
    { algorithm: 'HS256' }
  );

  const collegeAdminAToken = jwt.sign(
    { id: 'college-admin-a', role: 'COLLEGE_ADMIN', collegeId: 'college-rvce' },
    config.jwtSecret,
    { algorithm: 'HS256' }
  );

  const collegeAdminBToken = jwt.sign(
    { id: 'college-admin-b', role: 'COLLEGE_ADMIN', collegeId: 'college-pes' },
    config.jwtSecret,
    { algorithm: 'HS256' }
  );

  const studentToken = jwt.sign(
    { id: 'student-tester', role: 'STUDENT', collegeId: 'college-rvce' },
    config.jwtSecret,
    { algorithm: 'HS256' }
  );

  let globalCodingQId, globalMcqQId, collegeAQId, collegeBQId;
  let globalCodingV1Id, globalCodingV2Id;

  beforeAll(async () => {
    await cleanDatabase(prisma);

    // 1. Create Global Coding Question with 2 versions
    const globalCodingQ = await prisma.practiceQuestion.create({
      data: {
        externalId: 'ADMIN-CODE-001',
        sourceNamespace: 'sips-internal',
        type: 'CODING',
        format: 'CODING',
        category: 'DSA',
        subcategory: 'ARRAYS',
        difficulty: 'MEDIUM',
        status: 'ACTIVE',
        sourceType: 'ORIGINAL',
        tags: ['array', 'two-pointers'],
        collegeId: null,
        versions: {
          create: [
            {
              versionNumber: 1,
              title: 'Global Array Challenge V1',
              statement: 'Solve this array problem V1.',
              metadata: { starterCode: { python: 'print("v1")' } },
              codingProblem: {
                create: {
                  constraints: '1 <= N <= 100',
                  timeLimitMs: 2000,
                  memoryLimitKb: 128000,
                  maxMarks: 100,
                  testCases: {
                    create: [
                      { input: '10', expectedOutput: '20', isHidden: false, weight: 50, order: 1 },
                      { input: '20', expectedOutput: '40', isHidden: true, weight: 50, order: 2 }
                    ]
                  }
                }
              }
            },
            {
              versionNumber: 2,
              title: 'Global Array Challenge V2',
              statement: 'Solve this array problem V2 with updated constraints.',
              metadata: { starterCode: { python: 'print("v2")' } },
              codingProblem: {
                create: {
                  constraints: '1 <= N <= 1000',
                  timeLimitMs: 2000,
                  memoryLimitKb: 128000,
                  maxMarks: 100,
                  testCases: {
                    create: [
                      { input: '10', expectedOutput: '20', isHidden: false, weight: 50, order: 1 },
                      { input: '30', expectedOutput: '60', isHidden: true, weight: 50, order: 2 }
                    ]
                  }
                }
              }
            }
          ]
        }
      },
      include: { versions: { orderBy: { versionNumber: 'asc' } } }
    });

    globalCodingQId = globalCodingQ.id;
    globalCodingV1Id = globalCodingQ.versions[0].id;
    globalCodingV2Id = globalCodingQ.versions[1].id;

    // 2. Create Global MCQ Question in DRAFT
    const globalMcqQ = await prisma.practiceQuestion.create({
      data: {
        externalId: 'ADMIN-MCQ-001',
        sourceNamespace: 'sips-internal',
        type: 'APTITUDE',
        format: 'SINGLE_CHOICE',
        category: 'QUANTITATIVE',
        subcategory: 'PROBABILITY',
        difficulty: 'EASY',
        status: 'DRAFT',
        sourceType: 'CURATED',
        tags: ['probability', 'math'],
        collegeId: null,
        versions: {
          create: {
            versionNumber: 1,
            title: 'Coin Toss Probability',
            statement: 'What is the probability of 2 heads in 2 coin tosses?',
            options: [
              { id: 'A', text: '1/4' },
              { id: 'B', text: '1/2' },
              { id: 'C', text: '3/4' },
              { id: 'D', text: '1' }
            ],
            correctAnswer: { id: 'A' },
            explanation: 'P(HH) = 1/2 * 1/2 = 1/4'
          }
        }
      }
    });
    globalMcqQId = globalMcqQ.id;

    // 3. Create College A Specific Question
    const colAQ = await prisma.practiceQuestion.create({
      data: {
        externalId: 'RVCE-TECH-001',
        sourceNamespace: 'rvce-internal',
        type: 'TECHNICAL',
        format: 'SINGLE_CHOICE',
        category: 'DBMS',
        difficulty: 'HARD',
        status: 'ACTIVE',
        sourceType: 'COLLEGE_CREATED',
        tags: ['sql', 'indexing'],
        collegeId: 'college-rvce',
        versions: {
          create: {
            versionNumber: 1,
            title: 'B+ Tree Fanout',
            statement: 'Calculate B+ tree fanout with block size 4KB.',
            options: [{ id: 'A', text: '100' }, { id: 'B', text: '200' }],
            correctAnswer: { id: 'B' }
          }
        }
      }
    });
    collegeAQId = colAQ.id;

    // 4. Create College B Specific Question
    const colBQ = await prisma.practiceQuestion.create({
      data: {
        externalId: 'PES-TECH-001',
        sourceNamespace: 'pes-internal',
        type: 'TECHNICAL',
        format: 'SINGLE_CHOICE',
        category: 'NETWORKS',
        difficulty: 'MEDIUM',
        status: 'ACTIVE',
        sourceType: 'COLLEGE_CREATED',
        tags: ['tcp', 'congestion'],
        collegeId: 'college-pes',
        versions: {
          create: {
            versionNumber: 1,
            title: 'TCP Congestion Window',
            statement: 'Describe AIMD behavior in TCP Reno.',
            options: [{ id: 'A', text: 'Additive Increase' }],
            correctAnswer: { id: 'A' }
          }
        }
      }
    });
    collegeBQId = colBQ.id;
  });

  afterAll(async () => {
    await cleanDatabase(prisma);
    await prisma.$disconnect();
  });

  describe('1. Security & RBAC Enforcement', () => {
    test('Unauthenticated request to GET /api/admin/questions returns 401', async () => {
      const res = await request(app).get('/api/admin/questions');
      expect(res.status).toBe(401);
    });

    test('Student token to GET /api/admin/questions is rejected with 403 FORBIDDEN_ROLE', async () => {
      const res = await request(app)
        .get('/api/admin/questions')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(403);
    });

    test('Student token to POST /api/admin/questions/:id/activate is rejected with 403', async () => {
      const res = await request(app)
        .post(`/api/admin/questions/${globalMcqQId}/activate`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('2. Question List Pagination & Filters', () => {
    test('Superadmin retrieves paginated question list with all questions', async () => {
      const res = await request(app)
        .get('/api/admin/questions?page=1&limit=10')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(4);
      expect(res.body.pagination.total).toBe(4);
      expect(res.body.pagination.page).toBe(1);
    });

    test('Filter by type=CODING returns only coding questions', async () => {
      const res = await request(app)
        .get('/api/admin/questions?type=CODING')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].id).toBe(globalCodingQId);
      expect(res.body.data[0].type).toBe('CODING');
      expect(res.body.data[0].versionCount).toBe(2);
    });

    test('Filter by status=DRAFT returns only draft questions', async () => {
      const res = await request(app)
        .get('/api/admin/questions?status=DRAFT')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].id).toBe(globalMcqQId);
      expect(res.body.data[0].status).toBe('DRAFT');
    });

    test('Search by keyword filters matching titles and tags', async () => {
      const res = await request(app)
        .get('/api/admin/questions?search=Probability')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].id).toBe(globalMcqQId);
    });

    test('College Admin sees only global questions and their own college questions', async () => {
      const res = await request(app)
        .get('/api/admin/questions')
        .set('Authorization', `Bearer ${collegeAdminAToken}`);

      expect(res.status).toBe(200);
      // 2 global questions + 1 RVCE question = 3 (PES question excluded)
      expect(res.body.data.length).toBe(3);
      const questionIds = res.body.data.map(q => q.id);
      expect(questionIds).toContain(globalCodingQId);
      expect(questionIds).toContain(globalMcqQId);
      expect(questionIds).toContain(collegeAQId);
      expect(questionIds).not.toContain(collegeBQId);
    });
  });

  describe('3. Question Details & Full Admin Serialization', () => {
    test('Superadmin retrieves complete question details with all versions and test cases', async () => {
      const res = await request(app)
        .get(`/api/admin/questions/${globalCodingQId}`)
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      const data = res.body.data;
      expect(data.id).toBe(globalCodingQId);
      expect(data.versions.length).toBe(2);
      expect(data.referenceCounts).toBeDefined();
      expect(data.referenceCounts.hasHistoricalReferences).toBe(false);

      // Verify admin test case serialization includes hidden tests with expectedOutput and weight
      const latestCp = data.latestVersion.codingProblem;
      expect(latestCp.testCases.length).toBe(2);
      expect(latestCp.testCases[1].isHidden).toBe(true);
      expect(latestCp.testCases[1].expectedOutput).toBe('60'); // Admin serializer exposes full test data
    });

    test('Admin retrieves specific immutable QuestionVersion snapshot', async () => {
      const res = await request(app)
        .get(`/api/admin/questions/${globalCodingQId}/versions/${globalCodingV1Id}`)
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      const v1 = res.body.data;
      expect(v1.versionNumber).toBe(1);
      expect(v1.title).toBe('Global Array Challenge V1');
      expect(v1.codingProblem.constraints).toBe('1 <= N <= 100');
    });

    test('MCQ question details expose admin answer key and explanation', async () => {
      const res = await request(app)
        .get(`/api/admin/questions/${globalMcqQId}`)
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      const data = res.body.data;
      expect(data.latestVersion.correctAnswer).toEqual({ id: 'A' });
      expect(data.latestVersion.explanation).toBe('P(HH) = 1/2 * 1/2 = 1/4');
    });
  });

  describe('4. Lifecycle Management (Activate & Archive)', () => {
    test('Activate transition updates question from DRAFT to ACTIVE', async () => {
      const res = await request(app)
        .post(`/api/admin/questions/${globalMcqQId}/activate`)
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('ACTIVE');

      // Verify in DB
      const dbQ = await prisma.practiceQuestion.findUnique({ where: { id: globalMcqQId } });
      expect(dbQ.status).toBe('ACTIVE');
    });

    test('Archive transition updates question from ACTIVE to ARCHIVED', async () => {
      const res = await request(app)
        .post(`/api/admin/questions/${globalMcqQId}/archive`)
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('ARCHIVED');

      // Verify in DB
      const dbQ = await prisma.practiceQuestion.findUnique({ where: { id: globalMcqQId } });
      expect(dbQ.status).toBe('ARCHIVED');
    });
  });

  describe('5. Tenancy & Cross-College Protection', () => {
    test('College Admin A cannot activate or archive College B question', async () => {
      const res = await request(app)
        .post(`/api/admin/questions/${collegeBQId}/archive`)
        .set('Authorization', `Bearer ${collegeAdminAToken}`);

      expect(res.status).toBe(403);
    });

    test('College Admin A can archive their own college question', async () => {
      const res = await request(app)
        .post(`/api/admin/questions/${collegeAQId}/archive`)
        .set('Authorization', `Bearer ${collegeAdminAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('ARCHIVED');
    });

    test('Department Admin can access question bank and create assessments', async () => {
      const deptAdminToken = jwt.sign(
        {
          id: 'dept-admin-cs',
          role: 'DEPARTMENT_ADMIN',
          departmentId: 'dept_cs_01',
          institutionId: 'inst_rvce_01',
          collegeId: 'dept_cs_01'
        },
        config.jwtSecret,
        { algorithm: 'HS256' }
      );

      // 1. Get Questions
      const qRes = await request(app)
        .get('/api/admin/questions')
        .set('Authorization', `Bearer ${deptAdminToken}`);

      expect(qRes.status).toBe(200);
      expect(qRes.body.success).toBe(true);

      // 2. Create Assessment
      const aRes = await request(app)
        .post('/api/admin/assessments')
        .set('Authorization', `Bearer ${deptAdminToken}`)
        .send({
          title: 'CS Dept Technical MCQ Assessment',
          type: 'PRACTICE_SET',
          durationMinutes: 45
        });

      expect(aRes.status).toBe(201);
      expect(aRes.body.data.title).toBe('CS Dept Technical MCQ Assessment');
      expect(aRes.body.data.collegeId).toBe('dept_cs_01');
    });

    test('Main University Admin can access question bank and list assessments', async () => {
      const uniAdminToken = jwt.sign(
        {
          id: 'uni-admin-root',
          role: 'MAIN_UNIVERSITY_ADMIN',
          institutionId: 'inst_rvce_01',
          collegeId: 'inst_rvce_01'
        },
        config.jwtSecret,
        { algorithm: 'HS256' }
      );

      const res = await request(app)
        .get('/api/admin/assessments')
        .set('Authorization', `Bearer ${uniAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
