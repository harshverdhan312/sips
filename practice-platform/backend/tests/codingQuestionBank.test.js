const fs = require('fs');
const path = require('path');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const prisma = require('../src/utils/prisma');
const config = require('../src/config');
const bulkImportService = require('../src/services/bulkImportService');
const codeExecutionService = require('../src/services/codeExecutionService');
const judge0Service = require('../src/services/judge0Service');
const { validateImportItem } = require('../src/validators/bulkImportValidator');
const { serializeStudentQuestionVersion } = require('../src/utils/serializers');

describe('Phase 7D — Coding Question Bank Ingestion & Execution Suite', () => {
  const adminToken = jwt.sign(
    { id: 'admin-coding-bank', role: 'ADMIN', collegeId: 'canonical-college' },
    config.jwtSecret,
    { algorithm: 'HS256' }
  );

  const studentToken = jwt.sign(
    { id: 'student-coding-tester', role: 'STUDENT', collegeId: 'canonical-college' },
    config.jwtSecret,
    { algorithm: 'HS256' }
  );

  const codingDatasetPath = path.join(__dirname, '../data/question-bank/coding/coding_questions.json');
  const codingQuestions = JSON.parse(fs.readFileSync(codingDatasetPath, 'utf8'));

  async function cleanupTestQuestions(externalIds) {
    const questions = await prisma.practiceQuestion.findMany({
      where: { externalId: { in: externalIds } },
      include: { versions: true }
    });
    const versionIds = questions.flatMap(q => q.versions.map(v => v.id));
    const questionIds = questions.map(q => q.id);

    if (versionIds.length > 0) {
      await prisma.codeSubmissionTestResult.deleteMany({
        where: { submission: { questionVersionId: { in: versionIds } } }
      }).catch(() => {});
      await prisma.codeSubmission.deleteMany({
        where: { questionVersionId: { in: versionIds } }
      }).catch(() => {});
      await prisma.questionResponse.deleteMany({
        where: { questionVersionId: { in: versionIds } }
      }).catch(() => {});
      await prisma.codingTestCase.deleteMany({
        where: { codingProblem: { questionVersionId: { in: versionIds } } }
      }).catch(() => {});
      await prisma.codingProblem.deleteMany({
        where: { questionVersionId: { in: versionIds } }
      }).catch(() => {});
      await prisma.questionVersion.deleteMany({
        where: { id: { in: versionIds } }
      }).catch(() => {});
    }
    if (questionIds.length > 0) {
      await prisma.practiceQuestion.deleteMany({
        where: { id: { in: questionIds } }
      }).catch(() => {});
    }
  }

  beforeAll(async () => {
    const externalIds = codingQuestions.map(q => q.externalId);
    await cleanupTestQuestions(externalIds);
  });

  afterAll(async () => {
    const externalIds = codingQuestions.map(q => q.externalId);
    await cleanupTestQuestions(externalIds);
    await prisma.$disconnect();
  });

  describe('1. Dataset Integrity & Schema Compliance', () => {
    test('Dataset contains exactly 20 canonical coding problems', () => {
      expect(codingQuestions.length).toBe(20);
    });

    test('All 20 coding problems pass the bulk-import validator without errors', () => {
      codingQuestions.forEach((item, idx) => {
        const validation = validateImportItem(item, idx);
        expect(validation.isValid).toBe(true);
        expect(validation.data).toBeDefined();
        expect(validation.data.question.type).toBe('CODING');
        expect(validation.data.coding).toBeDefined();
        expect(validation.data.coding.testCases.length).toBeGreaterThanOrEqual(4);
      });
    });

    test('All problems contain valid starter code for python, cpp, java, and javascript', () => {
      codingQuestions.forEach((item) => {
        const starterCode = item.coding.starterCode;
        expect(starterCode).toBeDefined();
        expect(starterCode.python).toBeDefined();
        expect(starterCode.cpp).toBeDefined();
        expect(starterCode.java).toBeDefined();
        expect(starterCode.javascript).toBeDefined();
      });
    });

    test('All problems contain at least 2 public and 2 hidden test cases with total weight 100', () => {
      codingQuestions.forEach((item) => {
        const testCases = item.coding.testCases;
        const publicCases = testCases.filter(tc => !tc.isHidden);
        const hiddenCases = testCases.filter(tc => tc.isHidden);

        expect(publicCases.length).toBeGreaterThanOrEqual(2);
        expect(hiddenCases.length).toBeGreaterThanOrEqual(2);

        const totalWeight = testCases.reduce((sum, tc) => sum + tc.weight, 0);
        expect(totalWeight).toBe(100);
      });
    });
  });

  describe('2. Canonical Batch Ingestion (20 Coding Problems)', () => {
    test('Initial bulk import successfully inserts all 20 coding problems', async () => {
      const res = await request(app)
        .post('/api/admin/questions/bulk-import')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ items: codingQuestions });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.total).toBe(20);
      expect(res.body.data.inserted).toBe(20);
      expect(res.body.data.versioned).toBe(0);
      expect(res.body.data.skipped).toBe(0);
      expect(res.body.data.failed).toBe(0);
    });

    test('Database confirms 20 CodingProblem and associated CodingTestCase records created', async () => {
      const externalIds = codingQuestions.map(q => q.externalId);
      const dbQuestions = await prisma.practiceQuestion.findMany({
        where: { externalId: { in: externalIds } },
        include: {
          versions: {
            include: {
              codingProblem: {
                include: { testCases: true }
              }
            }
          }
        }
      });

      expect(dbQuestions.length).toBe(20);
      dbQuestions.forEach(q => {
        expect(q.type).toBe('CODING');
        expect(q.status).toBe('ACTIVE');
        expect(q.versions.length).toBe(1);
        const cp = q.versions[0].codingProblem;
        expect(cp).toBeDefined();
        expect(cp.testCases.length).toBeGreaterThanOrEqual(4);
      });
    });
  });

  describe('3. Idempotency & Replay Protection', () => {
    test('Re-importing identical 20 coding problems skips all 20 with 0 duplicates', async () => {
      const res = await request(app)
        .post('/api/admin/questions/bulk-import')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ items: codingQuestions });

      expect(res.status).toBe(200);
      expect(res.body.data.total).toBe(20);
      expect(res.body.data.inserted).toBe(0);
      expect(res.body.data.versioned).toBe(0);
      expect(res.body.data.skipped).toBe(20);
      expect(res.body.data.failed).toBe(0);
    });
  });

  describe('4. Immutable Versioning on Problem Modification', () => {
    test('Updating coding problem constraints/starter code creates Version 2 immutably', async () => {
      const target = { ...codingQuestions[0] };
      const modified = {
        ...target,
        coding: {
          ...target.coding,
          constraints: '2 <= N <= 2 * 10^4\n-10^9 <= nums[i] <= 10^9 (Updated constraint limit)'
        }
      };

      const res = await request(app)
        .post('/api/admin/questions/bulk-import')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ items: [modified] });

      expect(res.status).toBe(200);
      expect(res.body.data.inserted).toBe(0);
      expect(res.body.data.versioned).toBe(1);
      expect(res.body.data.skipped).toBe(0);

      // Verify DB version history
      const dbQ = await prisma.practiceQuestion.findFirst({
        where: { externalId: target.externalId },
        include: {
          versions: {
            orderBy: { versionNumber: 'asc' },
            include: { codingProblem: true }
          }
        }
      });

      expect(dbQ.versions.length).toBe(2);
      expect(dbQ.versions[0].versionNumber).toBe(1);
      expect(dbQ.versions[0].codingProblem.constraints).toBe(target.coding.constraints);
      expect(dbQ.versions[1].versionNumber).toBe(2);
      expect(dbQ.versions[1].codingProblem.constraints).toBe('2 <= N <= 2 * 10^4\n-10^9 <= nums[i] <= 10^9 (Updated constraint limit)');
    });
  });

  describe('5. Student-Safety & Information Hiding Audit', () => {
    test('Student serializer strictly filters hidden test cases and hides secret inputs/outputs', async () => {
      const q = await prisma.practiceQuestion.findFirst({
        where: { externalId: 'CODE-ARR-001' },
        include: {
          versions: {
            take: 1,
            include: {
              codingProblem: {
                include: { testCases: true }
              }
            }
          }
        }
      });

      const rawVersion = q.versions[0];
      const serialized = serializeStudentQuestionVersion(rawVersion);

      expect(serialized.codingProblem).toBeDefined();
      expect(serialized.codingProblem.testCases.length).toBe(2); // Only the 2 public test cases
      serialized.codingProblem.testCases.forEach(tc => {
        expect(tc.isHidden).toBe(false);
      });
    });
  });

  describe('6. Code Execution & Scoring Verification', () => {
    let testVersionId;
    let practiceAttemptId;

    beforeAll(async () => {
      const q = await prisma.practiceQuestion.findFirst({
        where: { externalId: 'CODE-ARR-001' },
        include: {
          versions: {
            orderBy: { versionNumber: 'desc' },
            take: 1,
            include: { codingProblem: { include: { testCases: true } } }
          }
        }
      });
      testVersionId = q.versions[0].id;

      // Create an active practice attempt containing this question version
      const attempt = await prisma.practiceAttempt.create({
        data: {
          studentId: 'student-coding-tester',
          collegeId: 'canonical-college',
          status: 'IN_PROGRESS',
          responses: {
            create: {
              questionVersionId: testVersionId,
              answerData: {}
            }
          }
        }
      });
      practiceAttemptId = attempt.id;
    });

    test('RUN mode executes only public test cases without affecting official attempt marks', async () => {
      // Mock Judge0 provider to simulate Accepted output for public tests
      judge0Service.setMockProvider({
        submitBatch: async (submissions) => {
          return submissions.map((_, i) => ({ token: `tok_run_${i + 1}` }));
        },
        pollBatch: async (tokens) => {
          return tokens.map((token) => ({
            token,
            status_id: 3,
            status: { description: 'Accepted' },
            stdout: '0 1\n',
            time: '0.05',
            memory: 1024
          }));
        }
      });

      const res = await codeExecutionService.executeCode({
        studentId: 'student-coding-tester',
        collegeId: 'canonical-college',
        questionVersionId: testVersionId,
        language: 'python',
        sourceCode: 'import sys\nprint("0 1")',
        mode: 'RUN'
      });

      expect(res.mode).toBe('RUN');
      expect(res.testResults.length).toBe(2); // Only 2 public tests
      expect(res.earnedMarks).toBe(0); // RUN never awards official marks

      judge0Service.clearMockProvider();
    });

    test('SUBMIT mode executes all 4 test cases and calculates weighted score', async () => {
      judge0Service.setMockProvider({
        submitBatch: async (submissions) => {
          return submissions.map((_, i) => ({ token: `tok_sub_${i + 1}` }));
        },
        pollBatch: async (tokens) => {
          return tokens.map((token, idx) => ({
            token,
            status_id: 3,
            status: { description: 'Accepted' },
            stdout: idx === 0 ? '0 1\n' : idx === 1 ? '1 2\n' : idx === 2 ? '0 4\n' : '1 4\n',
            time: '0.05',
            memory: 1024
          }));
        }
      });

      const res = await codeExecutionService.executeCode({
        studentId: 'student-coding-tester',
        collegeId: 'canonical-college',
        practiceAttemptId,
        questionVersionId: testVersionId,
        language: 'python',
        sourceCode: 'import sys\n# accepted solution',
        mode: 'SUBMIT'
      });

      expect(res.mode).toBe('SUBMIT');
      expect(res.status).toBe('ACCEPTED');
      expect(res.earnedMarks).toBe(100);
      expect(res.testsPassed).toBe(4);
      expect(res.testsTotal).toBe(4);

      // Verify CodeSubmission was persisted in DB
      expect(res.id).toBeDefined();
      const dbSub = await prisma.codeSubmission.findUnique({
        where: { id: res.id }
      });
      expect(dbSub).toBeDefined();
      expect(dbSub.status).toBe('ACCEPTED');

      judge0Service.clearMockProvider();
    });

    test('SUBMIT with partial success awards proportional weighted score', async () => {
      judge0Service.setMockProvider({
        submitBatch: async (submissions) => {
          return submissions.map((_, i) => ({ token: `tok_part_${i + 1}` }));
        },
        pollBatch: async (tokens) => {
          return tokens.map((token, idx) => {
            const isPassing = idx < 2;
            return {
              token,
              status_id: isPassing ? 3 : 4,
              status: { description: isPassing ? 'Accepted' : 'Wrong Answer' },
              stdout: isPassing ? (idx === 0 ? '0 1\n' : '1 2\n') : '0 0\n',
              time: '0.05',
              memory: 1024
            };
          });
        }
      });

      const res = await codeExecutionService.executeCode({
        studentId: 'student-coding-tester',
        collegeId: 'canonical-college',
        practiceAttemptId,
        questionVersionId: testVersionId,
        language: 'python',
        sourceCode: 'import sys\n# partial solution',
        mode: 'SUBMIT'
      });

      expect(res.status).toBe('PARTIAL');
      expect(res.earnedMarks).toBe(50); // 25 + 25 = 50 marks
      expect(res.testsPassed).toBe(2);
      expect(res.testsTotal).toBe(4);

      judge0Service.clearMockProvider();
    });
  });

  describe('7. Multi-Language Validation (Python, C++, Java, JavaScript)', () => {
    test('Validates language support and portability for Python, C++, Java, JS', () => {
      ['python', 'cpp', 'java', 'javascript'].forEach(lang => {
        expect(judge0Service.isLanguageSupported(lang)).toBe(true);
        expect(judge0Service.getLanguageId(lang)).toBeGreaterThan(0);
      });
    });
  });
});
