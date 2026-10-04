const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const prisma = require('../src/utils/prisma');
const config = require('../src/config');
const bulkImportService = require('../src/services/bulkImportService');
const practiceService = require('../src/services/practiceService');

describe('Phase 7B — Question Bank & Bulk Ingestion Suite', () => {
  const adminToken = jwt.sign(
    { id: 'admin-123', role: 'ADMIN', collegeId: 'college-test' },
    config.jwtSecret,
    { algorithm: 'HS256' }
  );

  const studentToken = jwt.sign(
    { id: 'student-123', role: 'STUDENT', collegeId: 'college-test' },
    config.jwtSecret,
    { algorithm: 'HS256' }
  );

  const testNamespace = `test-ns-${Date.now()}`;

  afterAll(async () => {
    // Cleanup questions created in this test namespace
    const testQuestions = await prisma.practiceQuestion.findMany({
      where: { sourceNamespace: { startsWith: 'test-ns-' } },
      select: { id: true }
    });

    for (const q of testQuestions) {
      await prisma.practiceQuestion.delete({ where: { id: q.id } }).catch(() => {});
    }

    await prisma.$disconnect();
  });

  describe('1. Security & RBAC', () => {
    test('Unauthenticated bulk-import request is rejected with 401', async () => {
      const res = await request(app)
        .post('/api/admin/questions/bulk-import')
        .send({ items: [] });

      expect(res.status).toBe(401);
    });

    test('Student token cannot invoke admin bulk-import (403 Forbidden)', async () => {
      const res = await request(app)
        .post('/api/admin/questions/bulk-import')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ items: [] });

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/Administrative role required/i);
    });

    test('Admin token can access bulk-import endpoint', async () => {
      const res = await request(app)
        .post('/api/admin/questions/bulk-import')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ items: [] });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.total).toBe(0);
    });
  });

  describe('2. Validation Engine', () => {
    test('Rejects malformed MCQ missing options', async () => {
      const payload = [
        {
          source: { type: 'ORIGINAL', namespace: testNamespace },
          externalId: 'VAL-MCQ-01',
          question: {
            type: 'APTITUDE',
            format: 'SINGLE_CHOICE',
            domain: 'APTITUDE',
            topic: 'QUANTITATIVE',
            difficulty: 'EASY',
            title: 'No Options MCQ',
            statement: 'What is 2+2?'
            // missing options & correctAnswer
          }
        }
      ];

      const res = await request(app)
        .post('/api/admin/questions/bulk-import')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ items: payload });

      expect(res.status).toBe(200);
      expect(res.body.data.failed).toBe(1);
      expect(res.body.data.inserted).toBe(0);
      expect(res.body.data.errors.length).toBeGreaterThan(0);
      expect(res.body.data.errors[0].message).toMatch(/options array/i);
    });

    test('Rejects MCQ with duplicate option IDs or invalid correctAnswer reference', async () => {
      const payload = [
        {
          source: { type: 'ORIGINAL', namespace: testNamespace },
          externalId: 'VAL-MCQ-02',
          question: {
            type: 'APTITUDE',
            format: 'SINGLE_CHOICE',
            domain: 'APTITUDE',
            topic: 'QUANTITATIVE',
            difficulty: 'EASY',
            title: 'Invalid Option MCQ',
            statement: 'Pick correct option',
            options: [
              { id: 'opt_1', text: 'Option A' },
              { id: 'opt_1', text: 'Duplicate Option A' }
            ],
            correctAnswer: { optionId: 'opt_999' }
          }
        }
      ];

      const res = await request(app)
        .post('/api/admin/questions/bulk-import')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ items: payload });

      expect(res.body.data.failed).toBe(1);
      expect(res.body.data.errors.some(e => e.message.includes('Duplicate option ID') || e.message.includes('references nonexistent'))).toBe(true);
    });

    test('Rejects coding question with zero public test cases', async () => {
      const payload = [
        {
          source: { type: 'ORIGINAL', namespace: testNamespace },
          externalId: 'VAL-CODE-01',
          question: {
            type: 'CODING',
            format: 'CODING',
            domain: 'CODING',
            topic: 'ARRAYS_HASHING',
            difficulty: 'EASY',
            title: 'Hidden Only Problem',
            statement: 'Solve problem'
          },
          coding: {
            testCases: [
              { input: '1', expectedOutput: '1', isHidden: true, weight: 10 }
            ]
          }
        }
      ];

      const res = await request(app)
        .post('/api/admin/questions/bulk-import')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ items: payload });

      expect(res.body.data.failed).toBe(1);
      expect(res.body.data.errors.some(e => e.message.includes('public test case'))).toBe(true);
    });

    test('Rejects coding question with negative or zero test case weights', async () => {
      const payload = [
        {
          source: { type: 'ORIGINAL', namespace: testNamespace },
          externalId: 'VAL-CODE-02',
          question: {
            type: 'CODING',
            format: 'CODING',
            domain: 'CODING',
            topic: 'ARRAYS_HASHING',
            difficulty: 'EASY',
            title: 'Negative Weight Problem',
            statement: 'Solve problem'
          },
          coding: {
            testCases: [
              { input: '1', expectedOutput: '1', isHidden: false, weight: -5 }
            ]
          }
        }
      ];

      const res = await request(app)
        .post('/api/admin/questions/bulk-import')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ items: payload });

      expect(res.body.data.failed).toBe(1);
      expect(res.body.data.errors.some(e => e.message.includes('positive weight'))).toBe(true);
    });
  });

  describe('3. Idempotent Ingestion & Versioning', () => {
    const validMCQ = {
      source: {
        type: 'THIRD_PARTY',
        namespace: testNamespace,
        url: 'https://example.com/math-q',
        attribution: 'Open Math Benchmark'
      },
      externalId: 'TEST-MCQ-100',
      tags: ['algebra', 'math'],
      question: {
        type: 'APTITUDE',
        format: 'SINGLE_CHOICE',
        domain: 'APTITUDE',
        topic: 'QUANTITATIVE',
        difficulty: 'MEDIUM',
        title: 'Linear Equation Solver',
        statement: 'If 3x + 5 = 20, what is x?',
        options: [
          { id: 'a', text: '5' },
          { id: 'b', text: '4' },
          { id: 'c', text: '3' },
          { id: 'd', text: '2' }
        ],
        correctAnswer: { optionId: 'a' },
        explanation: '3x = 15 => x = 5.'
      }
    };

    const validCoding = {
      source: {
        type: 'ORIGINAL',
        namespace: testNamespace
      },
      externalId: 'TEST-CODE-200',
      tags: ['strings', 'reverse'],
      question: {
        type: 'CODING',
        format: 'CODING',
        domain: 'CODING',
        topic: 'STRINGS',
        difficulty: 'EASY',
        title: 'Reverse A String',
        statement: 'Reverse the input string character by character.'
      },
      coding: {
        inputFormat: 'Single string S',
        outputFormat: 'Reversed string S',
        constraints: '1 <= |S| <= 1000',
        timeLimitMs: 2000,
        memoryLimitKb: 128000,
        maxMarks: 100,
        testCases: [
          { input: 'hello', expectedOutput: 'olleh', isHidden: false, weight: 50 },
          { input: 'world', expectedOutput: 'dlrow', isHidden: true, weight: 50 }
        ]
      }
    };

    test('Initial import inserts new questions (version 1)', async () => {
      const res = await request(app)
        .post('/api/admin/questions/bulk-import')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ items: [validMCQ, validCoding] });

      expect(res.status).toBe(200);
      expect(res.body.data.total).toBe(2);
      expect(res.body.data.inserted).toBe(2);
      expect(res.body.data.skipped).toBe(0);
      expect(res.body.data.versioned).toBe(0);
      expect(res.body.data.failed).toBe(0);

      // Verify records in database
      const q1 = await prisma.practiceQuestion.findFirst({
        where: { sourceNamespace: testNamespace, externalId: 'TEST-MCQ-100' },
        include: { versions: true }
      });
      expect(q1).toBeDefined();
      expect(q1.status).toBe('ACTIVE');
      expect(q1.sourceType).toBe('THIRD_PARTY');
      expect(q1.sourceUrl).toBe('https://example.com/math-q');
      expect(q1.attribution).toBe('Open Math Benchmark');
      expect(q1.tags).toContain('algebra');
      expect(q1.versions.length).toBe(1);
      expect(q1.versions[0].versionNumber).toBe(1);
    });

    test('Re-importing identical payload skips insertion (Idempotency)', async () => {
      const res = await request(app)
        .post('/api/admin/questions/bulk-import')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ items: [validMCQ, validCoding] });

      expect(res.status).toBe(200);
      expect(res.body.data.total).toBe(2);
      expect(res.body.data.inserted).toBe(0);
      expect(res.body.data.skipped).toBe(2);
      expect(res.body.data.versioned).toBe(0);
      expect(res.body.data.failed).toBe(0);

      // Database count for this namespace must remain 2
      const count = await prisma.practiceQuestion.count({
        where: { sourceNamespace: testNamespace }
      });
      expect(count).toBe(2);
    });

    test('Importing modified content for existing external ID creates next version (v2) immutably', async () => {
      const modifiedMCQ = {
        ...validMCQ,
        question: {
          ...validMCQ.question,
          statement: 'If 3x + 5 = 20, what is the exact value of x? (Updated clarity)'
        }
      };

      const res = await request(app)
        .post('/api/admin/questions/bulk-import')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ items: [modifiedMCQ] });

      expect(res.status).toBe(200);
      expect(res.body.data.inserted).toBe(0);
      expect(res.body.data.versioned).toBe(1);
      expect(res.body.data.skipped).toBe(0);

      // Verify versioning in DB
      const q = await prisma.practiceQuestion.findFirst({
        where: { sourceNamespace: testNamespace, externalId: 'TEST-MCQ-100' },
        include: {
          versions: { orderBy: { versionNumber: 'asc' } }
        }
      });

      expect(q.versions.length).toBe(2);
      expect(q.versions[0].versionNumber).toBe(1);
      expect(q.versions[0].statement).toBe('If 3x + 5 = 20, what is x?');
      expect(q.versions[1].versionNumber).toBe(2);
      expect(q.versions[1].statement).toBe('If 3x + 5 = 20, what is the exact value of x? (Updated clarity)');
    });
  });

  describe('4. Question Lifecycle (DRAFT, ACTIVE, ARCHIVED)', () => {
    let draftQId;
    let activeQId;
    let archivedQId;

    beforeAll(async () => {
      const dQ = await prisma.practiceQuestion.create({
        data: {
          type: 'APTITUDE',
          format: 'SINGLE_CHOICE',
          category: 'APTITUDE',
          subcategory: 'LOGICAL',
          difficulty: 'EASY',
          status: 'DRAFT',
          sourceNamespace: testNamespace,
          externalId: 'LIFECYCLE-DRAFT',
          versions: {
            create: {
              versionNumber: 1,
              title: 'Draft Lifecycle Question',
              statement: 'Draft statement',
              options: [{ id: '1', text: 'A' }, { id: '2', text: 'B' }],
              correctAnswer: { optionId: '1' }
            }
          }
        }
      });
      draftQId = dQ.id;

      const aQ = await prisma.practiceQuestion.create({
        data: {
          type: 'APTITUDE',
          format: 'SINGLE_CHOICE',
          category: 'APTITUDE',
          subcategory: 'LOGICAL',
          difficulty: 'EASY',
          status: 'ACTIVE',
          sourceNamespace: testNamespace,
          externalId: 'LIFECYCLE-ACTIVE',
          versions: {
            create: {
              versionNumber: 1,
              title: 'Active Lifecycle Question',
              statement: 'Active statement',
              options: [{ id: '1', text: 'A' }, { id: '2', text: 'B' }],
              correctAnswer: { optionId: '1' }
            }
          }
        }
      });
      activeQId = aQ.id;

      const arcQ = await prisma.practiceQuestion.create({
        data: {
          type: 'APTITUDE',
          format: 'SINGLE_CHOICE',
          category: 'APTITUDE',
          subcategory: 'LOGICAL',
          difficulty: 'EASY',
          status: 'ARCHIVED',
          sourceNamespace: testNamespace,
          externalId: 'LIFECYCLE-ARCHIVED',
          versions: {
            create: {
              versionNumber: 1,
              title: 'Archived Lifecycle Question',
              statement: 'Archived statement',
              options: [{ id: '1', text: 'A' }, { id: '2', text: 'B' }],
              correctAnswer: { optionId: '1' }
            }
          }
        }
      });
      archivedQId = arcQ.id;
    });

    test('createPracticeAttempt strictly filters out DRAFT and ARCHIVED questions', async () => {
      const attempt = await practiceService.createPracticeAttempt({
        studentId: 'student-123',
        collegeId: 'college-test',
        type: 'APTITUDE',
        category: 'APTITUDE',
        questionCount: 10
      });

      expect(attempt).toBeDefined();
      const responses = await prisma.questionResponse.findMany({
        where: { practiceAttemptId: attempt.attemptId },
        include: { questionVersion: true }
      });
      const questionIds = responses.map(r => r.questionVersion.questionId);

      // Must include ACTIVE question
      expect(questionIds).toContain(activeQId);
      // Must NOT include DRAFT or ARCHIVED questions
      expect(questionIds).not.toContain(draftQId);
      expect(questionIds).not.toContain(archivedQId);
    });
  });
});
