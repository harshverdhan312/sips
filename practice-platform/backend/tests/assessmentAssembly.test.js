const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const prisma = require('../src/utils/prisma');
const config = require('../src/config');
const { cleanDatabase } = require('./testHelper');

describe('Phase 7F — Assessment & Question Set Assembly Test Suite', () => {
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

  let activeCodingQ, activeMcqQ, draftMcqQ, archivedMcqQ, collegeBPrivateQ;
  let activeCodingV1Id, activeMcqV1Id;

  beforeAll(async () => {
    await cleanDatabase(prisma);

    // 1. ACTIVE Global Coding Question
    activeCodingQ = await prisma.practiceQuestion.create({
      data: {
        externalId: 'ASSESS-CODE-001',
        sourceNamespace: 'sips-internal',
        type: 'CODING',
        format: 'CODING',
        category: 'DSA',
        subcategory: 'ARRAYS',
        difficulty: 'MEDIUM',
        status: 'ACTIVE',
        sourceType: 'ORIGINAL',
        collegeId: null,
        versions: {
          create: {
            versionNumber: 1,
            title: 'Two Sum Problem V1',
            statement: 'Find pair with target sum.',
            codingProblem: {
              create: {
                constraints: '1 <= N <= 1000',
                timeLimitMs: 2000,
                memoryLimitKb: 128000,
                maxMarks: 50,
                testCases: {
                  create: [
                    { input: '4 9\n2 7 11 15', expectedOutput: '0 1', isHidden: false, weight: 25, order: 1 },
                    { input: '3 6\n3 2 4', expectedOutput: '1 2', isHidden: true, weight: 25, order: 2 }
                  ]
                }
              }
            }
          }
        }
      },
      include: { versions: true }
    });
    activeCodingV1Id = activeCodingQ.versions[0].id;

    // 2. ACTIVE Global MCQ Question
    activeMcqQ = await prisma.practiceQuestion.create({
      data: {
        externalId: 'ASSESS-MCQ-001',
        sourceNamespace: 'sips-internal',
        type: 'APTITUDE',
        format: 'SINGLE_CHOICE',
        category: 'QUANTITATIVE',
        difficulty: 'EASY',
        status: 'ACTIVE',
        sourceType: 'CURATED',
        collegeId: null,
        versions: {
          create: {
            versionNumber: 1,
            title: 'Speed & Distance',
            statement: 'A train moves at 60 km/h...',
            options: [{ id: 'A', text: '100m' }, { id: 'B', text: '200m' }],
            correctAnswer: { id: 'A' }
          }
        }
      },
      include: { versions: true }
    });
    activeMcqV1Id = activeMcqQ.versions[0].id;

    // 3. DRAFT Question (Ineligible for assembly)
    draftMcqQ = await prisma.practiceQuestion.create({
      data: {
        externalId: 'DRAFT-MCQ-001',
        sourceNamespace: 'sips-internal',
        type: 'APTITUDE',
        format: 'SINGLE_CHOICE',
        category: 'LOGICAL',
        difficulty: 'EASY',
        status: 'DRAFT',
        sourceType: 'CURATED',
        collegeId: null,
        versions: {
          create: {
            versionNumber: 1,
            title: 'Draft Syllogism',
            statement: 'All cats are mammals...',
            options: [{ id: 'A', text: 'True' }]
          }
        }
      },
      include: { versions: true }
    });

    // 4. ARCHIVED Question (Ineligible for assembly)
    archivedMcqQ = await prisma.practiceQuestion.create({
      data: {
        externalId: 'ARCHIVED-MCQ-001',
        sourceNamespace: 'sips-internal',
        type: 'TECHNICAL',
        format: 'SINGLE_CHOICE',
        category: 'OS',
        difficulty: 'MEDIUM',
        status: 'ARCHIVED',
        sourceType: 'CURATED',
        collegeId: null,
        versions: {
          create: {
            versionNumber: 1,
            title: 'Deadlock Detection',
            statement: 'What is a deadlock condition?',
            options: [{ id: 'A', text: 'Mutual Exclusion' }]
          }
        }
      },
      include: { versions: true }
    });

    // 5. College B Private Question
    collegeBPrivateQ = await prisma.practiceQuestion.create({
      data: {
        externalId: 'PES-PRIVATE-001',
        sourceNamespace: 'pes-internal',
        type: 'TECHNICAL',
        format: 'SINGLE_CHOICE',
        category: 'NETWORKS',
        difficulty: 'HARD',
        status: 'ACTIVE',
        sourceType: 'COLLEGE_CREATED',
        collegeId: 'college-pes',
        versions: {
          create: {
            versionNumber: 1,
            title: 'PES Private BGP Routing',
            statement: 'Explain BGP path vectoring.',
            options: [{ id: 'A', text: 'AS path' }]
          }
        }
      },
      include: { versions: true }
    });
  });

  afterAll(async () => {
    await cleanDatabase(prisma);
    await prisma.$disconnect();
  });

  describe('1. Assessment Creation & RBAC', () => {
    test('Unauthenticated request to POST /api/admin/assessments returns 401', async () => {
      const res = await request(app)
        .post('/api/admin/assessments')
        .send({ title: 'Unauthorized Test' });
      expect(res.status).toBe(401);
    });

    test('Student token to POST /api/admin/assessments is rejected with 403', async () => {
      const res = await request(app)
        .post('/api/admin/assessments')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ title: 'Student Attempting Creation' });
      expect(res.status).toBe(403);
    });

    test('Superadmin creates Global Assessment in DRAFT status', async () => {
      const res = await request(app)
        .post('/api/admin/assessments')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          title: 'TCS National Qualifier Screening',
          description: 'Comprehensive screening covering Aptitude, Technical and Coding sections.',
          type: 'PLACEMENT_ASSESSMENT',
          durationMinutes: 90
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.status).toBe('DRAFT');
      expect(res.body.data.durationMinutes).toBe(90);
      expect(res.body.data.collegeId).toBeNull();
    });

    test('Missing title returns 400 Bad Request', async () => {
      const res = await request(app)
        .post('/api/admin/assessments')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ durationMinutes: 60 });

      expect(res.status).toBe(400);
    });
  });

  describe('2. Question Assembly & Ineligibility Guards', () => {
    let testAssessmentId;

    beforeAll(async () => {
      const res = await request(app)
        .post('/api/admin/assessments')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          title: 'Campus Screening Mock Assessment',
          type: 'MOCK_ASSESSMENT',
          durationMinutes: 60
        });
      testAssessmentId = res.body.data.id;
    });

    test('Adds ACTIVE QuestionVersion to assessment with section and marks', async () => {
      const res = await request(app)
        .post(`/api/admin/assessments/${testAssessmentId}/questions`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          questionVersionId: activeMcqV1Id,
          section: 'APTITUDE',
          marks: 2.0,
          negativeMarks: 0.5
        });

      expect(res.status).toBe(201);
      expect(res.body.data.assessmentId).toBe(testAssessmentId);
      expect(res.body.data.questionVersionId).toBe(activeMcqV1Id);
      expect(Number(res.body.data.marks)).toBe(2.0);
      expect(Number(res.body.data.negativeMarks)).toBe(0.5);

      // Verify totalMarks updated on parent assessment
      const getRes = await request(app)
        .get(`/api/admin/assessments/${testAssessmentId}`)
        .set('Authorization', `Bearer ${superAdminToken}`);
      expect(getRes.body.data.totalMarks).toBe(2.0);
      expect(getRes.body.data.questionCount).toBe(1);
    });

    test('Adds CODING QuestionVersion to CODING section', async () => {
      const res = await request(app)
        .post(`/api/admin/assessments/${testAssessmentId}/questions`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          questionVersionId: activeCodingV1Id,
          section: 'CODING',
          marks: 50.0,
          negativeMarks: 0.0
        });

      expect(res.status).toBe(201);
      expect(res.body.data.section).toBe('CODING');

      // Verify section breakdown
      const getRes = await request(app)
        .get(`/api/admin/assessments/${testAssessmentId}`)
        .set('Authorization', `Bearer ${superAdminToken}`);
      expect(getRes.body.data.totalMarks).toBe(52.0);
      expect(getRes.body.data.sectionBreakdown.APTITUDE.count).toBe(1);
      expect(getRes.body.data.sectionBreakdown.CODING.count).toBe(1);
      expect(getRes.body.data.sectionBreakdown.CODING.marks).toBe(50.0);
    });

    test('Rejects DRAFT question with 422 INELIGIBLE_QUESTION_STATUS', async () => {
      const res = await request(app)
        .post(`/api/admin/assessments/${testAssessmentId}/questions`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          questionVersionId: draftMcqQ.versions[0].id,
          section: 'APTITUDE',
          marks: 2.0
        });

      expect(res.status).toBe(422);
    });

    test('Rejects ARCHIVED question with 422 INELIGIBLE_QUESTION_STATUS', async () => {
      const res = await request(app)
        .post(`/api/admin/assessments/${testAssessmentId}/questions`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          questionVersionId: archivedMcqQ.versions[0].id,
          section: 'TECHNICAL',
          marks: 2.0
        });

      expect(res.status).toBe(422);
    });

    test('Rejects duplicate QuestionVersion in same assessment with 409', async () => {
      const res = await request(app)
        .post(`/api/admin/assessments/${testAssessmentId}/questions`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          questionVersionId: activeMcqV1Id,
          section: 'APTITUDE',
          marks: 2.0
        });

      expect(res.status).toBe(409);
    });

    test('Rejects invalid marks (marks <= 0) with 400 Bad Request', async () => {
      const res = await request(app)
        .post(`/api/admin/assessments/${testAssessmentId}/questions`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          questionVersionId: activeCodingV1Id,
          marks: 0
        });

      expect(res.status).toBe(400);
    });
  });

  describe('3. Tenancy & Cross-College Isolation', () => {
    let collegeAAssessmentId;

    beforeAll(async () => {
      const res = await request(app)
        .post('/api/admin/assessments')
        .set('Authorization', `Bearer ${collegeAdminAToken}`)
        .send({
          title: 'RVCE Internal Technical Assessment',
          type: 'PLACEMENT_ASSESSMENT',
          durationMinutes: 45
        });
      collegeAAssessmentId = res.body.data.id;
    });

    test('College Admin A can add Global questions to their College Assessment', async () => {
      const res = await request(app)
        .post(`/api/admin/assessments/${collegeAAssessmentId}/questions`)
        .set('Authorization', `Bearer ${collegeAdminAToken}`)
        .send({
          questionVersionId: activeMcqV1Id,
          section: 'APTITUDE',
          marks: 1.0
        });

      expect(res.status).toBe(201);
    });

    test('College Admin A CANNOT add College B Private question to Assessment (403)', async () => {
      const res = await request(app)
        .post(`/api/admin/assessments/${collegeAAssessmentId}/questions`)
        .set('Authorization', `Bearer ${collegeAdminAToken}`)
        .send({
          questionVersionId: collegeBPrivateQ.versions[0].id,
          section: 'TECHNICAL',
          marks: 2.0
        });

      expect(res.status).toBe(403);
    });

    test('College Admin B CANNOT manage or modify College A Assessment (403)', async () => {
      const res = await request(app)
        .get(`/api/admin/assessments/${collegeAAssessmentId}`)
        .set('Authorization', `Bearer ${collegeAdminBToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('4. Publishing & Immutability Lock', () => {
    let emptyAssessmentId, publishableAssessmentId;

    beforeAll(async () => {
      const res1 = await request(app)
        .post('/api/admin/assessments')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ title: 'Empty Assessment' });
      emptyAssessmentId = res1.body.data.id;

      const res2 = await request(app)
        .post('/api/admin/assessments')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ title: 'Publishable Test Assessment' });
      publishableAssessmentId = res2.body.data.id;

      await request(app)
        .post(`/api/admin/assessments/${publishableAssessmentId}/questions`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          questionVersionId: activeMcqV1Id,
          section: 'APTITUDE',
          marks: 10.0
        });
    });

    test('Publishing an empty assessment (0 questions) is rejected with 422', async () => {
      const res = await request(app)
        .post(`/api/admin/assessments/${emptyAssessmentId}/publish`)
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(422);
    });

    test('Publishing valid assessment transitions DRAFT -> PUBLISHED', async () => {
      const res = await request(app)
        .post(`/api/admin/assessments/${publishableAssessmentId}/publish`)
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('PUBLISHED');
    });

    test('Modifications to a PUBLISHED assessment are rejected with 409 Locked', async () => {
      // Attempt to add another question
      const res = await request(app)
        .post(`/api/admin/assessments/${publishableAssessmentId}/questions`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          questionVersionId: activeCodingV1Id,
          section: 'CODING',
          marks: 50.0
        });

      expect(res.status).toBe(409);
    });
  });

  describe('5. Immutable Version Pinning Verification', () => {
    test('Assessment pins specific QuestionVersion 1 even if PracticeQuestion gets Version 2', async () => {
      // 1. Create Assessment pinning activeCodingV1Id
      const assessRes = await request(app)
        .post('/api/admin/assessments')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ title: 'Version Pinning Invariant Assessment' });
      const assessId = assessRes.body.data.id;

      await request(app)
        .post(`/api/admin/assessments/${assessId}/questions`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          questionVersionId: activeCodingV1Id,
          section: 'CODING',
          marks: 100.0
        });

      // 2. Add Version 2 to the underlying PracticeQuestion
      const version2 = await prisma.questionVersion.create({
        data: {
          questionId: activeCodingQ.id,
          versionNumber: 2,
          title: 'Two Sum Problem V2 (Updated Algorithm)',
          statement: 'Solve two sum with O(N) constraint.',
          codingProblem: {
            create: {
              constraints: '1 <= N <= 10^5',
              maxMarks: 100
            }
          }
        }
      });

      // 3. Inspect Assessment questions
      const getRes = await request(app)
        .get(`/api/admin/assessments/${assessId}`)
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(getRes.status).toBe(200);
      const pinnedQuestion = getRes.body.data.questions[0];
      expect(pinnedQuestion.questionVersionId).toBe(activeCodingV1Id);
      expect(pinnedQuestion.questionVersion.versionNumber).toBe(1);
      expect(pinnedQuestion.questionVersion.title).toBe('Two Sum Problem V1');
      expect(pinnedQuestion.questionVersionId).not.toBe(version2.id);
    });
  });
});
