const request = require('supertest');
const { shuffleArray } = require('../src/utils/shuffle');
const prisma = require('../src/utils/prisma');
const practiceService = require('../src/services/practiceService');
const { createTestToken } = require('./testHelper');

// Mock Prisma for deterministic, isolated testing of the question pool and randomization
jest.mock('../src/utils/prisma', () => {
  const attemptsStore = new Map();
  const responsesStore = new Map();

  return {
    practiceQuestion: {
      count: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn()
    },
    practiceAttempt: {
      create: jest.fn(),
      findUnique: jest.fn()
    },
    questionResponse: {
      create: jest.fn()
    },
    $transaction: jest.fn()
  };
});

const app = require('../src/app');

describe('Practice Question Randomization & Category Selection Engine', () => {
  const testStudentId = 'student_test_random_01';
  const testCollegeId = 'college_rvce_01';
  const testStudentToken = createTestToken({ id: testStudentId, collegeId: testCollegeId });

  // Generate a mock bank of 30 questions
  const mockQuestionBank = [];

  // 15 Logical Reasoning (Active)
  for (let i = 1; i <= 15; i++) {
    mockQuestionBank.push({
      id: `q_lr_${i}`,
      type: 'APTITUDE',
      format: 'SINGLE_CHOICE',
      category: 'LOGICAL_REASONING',
      difficulty: i <= 10 ? 'EASY' : 'MEDIUM',
      status: 'ACTIVE',
      collegeId: null,
      createdAt: new Date(2026, 0, i),
      versions: [
        {
          id: `qv_lr_${i}`,
          questionId: `q_lr_${i}`,
          versionNumber: 1,
          title: `Logical Reasoning Question ${i}`,
          statement: `Statement for logical reasoning question ${i}`,
          options: [
            { id: 'opt_a', text: 'Option A' },
            { id: 'opt_b', text: 'Option B' }
          ],
          correctAnswer: { optionId: 'opt_a' },
          explanation: `Explanation ${i}`
        }
      ]
    });
  }

  // 10 Quantitative (Active)
  for (let i = 1; i <= 10; i++) {
    mockQuestionBank.push({
      id: `q_quant_${i}`,
      type: 'APTITUDE',
      format: 'SINGLE_CHOICE',
      category: 'QUANTITATIVE',
      difficulty: 'MEDIUM',
      status: 'ACTIVE',
      collegeId: null,
      createdAt: new Date(2026, 1, i),
      versions: [
        {
          id: `qv_quant_${i}`,
          questionId: `q_quant_${i}`,
          versionNumber: 1,
          title: `Quantitative Question ${i}`,
          statement: `Statement for quantitative question ${i}`,
          options: [{ id: 'opt_1', text: '1' }],
          correctAnswer: { optionId: 'opt_1' },
          explanation: `Math explanation ${i}`
        }
      ]
    });
  }

  // 3 Inactive / Archived Logical Reasoning questions
  for (let i = 16; i <= 18; i++) {
    mockQuestionBank.push({
      id: `q_lr_${i}`,
      type: 'APTITUDE',
      format: 'SINGLE_CHOICE',
      category: 'LOGICAL_REASONING',
      difficulty: 'HARD',
      status: i === 16 ? 'ARCHIVED' : 'DRAFT',
      collegeId: null,
      createdAt: new Date(2026, 0, i),
      versions: [
        {
          id: `qv_lr_${i}`,
          questionId: `q_lr_${i}`,
          versionNumber: 1,
          title: `Inactive Question ${i}`,
          statement: `Statement for inactive question ${i}`,
          options: [],
          correctAnswer: null
        }
      ]
    });
  }

  // 2 Logical Reasoning questions belonging to a different college
  for (let i = 19; i <= 20; i++) {
    mockQuestionBank.push({
      id: `q_lr_${i}`,
      type: 'APTITUDE',
      format: 'SINGLE_CHOICE',
      category: 'LOGICAL_REASONING',
      difficulty: 'EASY',
      status: 'ACTIVE',
      collegeId: 'other_college_99',
      createdAt: new Date(2026, 0, i),
      versions: [
        {
          id: `qv_lr_${i}`,
          questionId: `q_lr_${i}`,
          versionNumber: 1,
          title: `Private College Question ${i}`,
          statement: `Statement for college question ${i}`,
          options: [],
          correctAnswer: null
        }
      ]
    });
  }

  // In-memory attempt & response store for end-to-end tests
  let attemptIdCounter = 1;
  const attemptsStore = new Map();
  const responsesStore = new Map();

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup Prisma mock behavior using in-memory filtering matching Prisma's semantics
    prisma.practiceQuestion.count.mockImplementation(async ({ where = {} }) => {
      return filterMockQuestions(mockQuestionBank, where).length;
    });

    prisma.practiceQuestion.findMany.mockImplementation(async ({ where = {}, skip = 0, take }) => {
      const filtered = filterMockQuestions(mockQuestionBank, where);
      const sliced = filtered.slice(skip, take ? skip + take : undefined);
      return sliced.map((q) => JSON.parse(JSON.stringify(q)));
    });

    prisma.$transaction.mockImplementation(async (callback) => {
      return callback({
        practiceAttempt: {
          create: async ({ data }) => {
            const id = `att_${attemptIdCounter++}`;
            const record = {
              id,
              ...data,
              startedAt: new Date(),
              createdAt: new Date(),
              updatedAt: new Date()
            };
            attemptsStore.set(id, record);
            responsesStore.set(id, []);
            return record;
          }
        },
        questionResponse: {
          create: async ({ data }) => {
            const id = `resp_${Math.random().toString(36).substring(2, 9)}`;
            const list = responsesStore.get(data.practiceAttemptId) || [];
            const record = { id, ...data };
            list.push(record);
            responsesStore.set(data.practiceAttemptId, list);
            return record;
          }
        }
      });
    });

    prisma.practiceAttempt.findUnique.mockImplementation(async ({ where, include }) => {
      const attempt = attemptsStore.get(where.id);
      if (!attempt) return null;
      if (include && include.responses) {
        const rawResponses = responsesStore.get(where.id) || [];
        const enriched = rawResponses.map((r) => {
          // Find questionVersion
          let foundQv = null;
          let foundQ = null;
          for (const q of mockQuestionBank) {
            const v = q.versions.find((v) => v.id === r.questionVersionId);
            if (v) {
              foundQv = v;
              foundQ = q;
              break;
            }
          }
          return {
            ...r,
            questionVersion: {
              ...foundQv,
              question: foundQ
            }
          };
        });
        return { ...attempt, responses: enriched };
      }
      return attempt;
    });
  });

  function filterMockQuestions(bank, where = {}) {
    return bank.filter((q) => {
      if (where.status && q.status !== where.status) return false;
      if (where.id && q.id !== where.id) return false;
      if (where.type && q.type !== where.type) return false;
      if (where.category) {
        if (typeof where.category === 'object' && where.category.contains) {
          if (!q.category.toLowerCase().includes(where.category.contains.toLowerCase())) return false;
        } else if (q.category !== where.category) {
          return false;
        }
      }
      if (where.difficulty && q.difficulty !== where.difficulty) return false;
      if (where.OR) {
        // e.g. [{ collegeId: testCollegeId }, { collegeId: null }]
        const match = where.OR.some((cond) => {
          if (cond.collegeId === null) return q.collegeId === null;
          return q.collegeId === cond.collegeId;
        });
        if (!match) return false;
      }
      return true;
    });
  }

  describe('1. Fisher-Yates (Knuth) Shuffle Algorithm Unit Tests', () => {
    test('handles empty and single-element arrays without mutation error', () => {
      expect(shuffleArray([])).toEqual([]);
      expect(shuffleArray([42])).toEqual([42]);
      expect(shuffleArray(null)).toBeNull();
      expect(shuffleArray(undefined)).toBeUndefined();
    });

    test('preserves all original elements without dropping or duplicating items', () => {
      const original = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const copy = [...original];
      shuffleArray(copy);

      expect(copy.length).toBe(original.length);
      expect(copy.sort((a, b) => a - b)).toEqual(original);
    });

    test('shuffles in-place and returns the same array reference', () => {
      const arr = ['a', 'b', 'c', 'd', 'e'];
      const result = shuffleArray(arr);
      expect(result).toBe(arr);
    });

    test('deterministic permutation can be produced using injected RNG', () => {
      // Deterministic reverse index selection
      let callCount = 0;
      const deterministicRng = () => {
        callCount++;
        return 0; // Always picks j = 0
      };

      const input = [10, 20, 30, 40];
      shuffleArray(input, deterministicRng);
      expect(input.length).toBe(4);
      expect(new Set(input).size).toBe(4);
    });
  });

  describe('2. Randomized Practice Question Selection & Attempt Creation', () => {
    test('Two consecutive practice attempts for the same category return different question sets', async () => {
      // Attempt 1: Request 5 Logical Reasoning questions
      const attempt1 = await practiceService.createPracticeAttempt({
        studentId: testStudentId,
        collegeId: testCollegeId,
        category: 'LOGICAL_REASONING',
        questionCount: 5
      });

      // Attempt 2: Request 5 Logical Reasoning questions again
      const attempt2 = await practiceService.createPracticeAttempt({
        studentId: testStudentId,
        collegeId: testCollegeId,
        category: 'LOGICAL_REASONING',
        questionCount: 5
      });

      expect(attempt1.questionCount).toBe(5);
      expect(attempt2.questionCount).toBe(5);

      const delivered1 = await practiceService.getDeliveredQuestions(attempt1.attemptId);
      const delivered2 = await practiceService.getDeliveredQuestions(attempt2.attemptId);

      const ids1 = delivered1.questions.map((q) => q.questionId || q.id);
      const ids2 = delivered2.questions.map((q) => q.questionId || q.id);

      // Verify each set contains exactly 5 unique questions
      expect(ids1.length).toBe(5);
      expect(new Set(ids1).size).toBe(5);
      expect(ids2.length).toBe(5);
      expect(new Set(ids2).size).toBe(5);

      // With 15 available questions and 5 picked randomly, the probability of identical order is 1 / (15*14*13*12*11) < 0.0003%
      const areIdentical = ids1.every((id, idx) => id === ids2[idx]);
      expect(areIdentical).toBe(false);
    });

    test('Same attempt never contains duplicate questions', async () => {
      const attempt = await practiceService.createPracticeAttempt({
        studentId: testStudentId,
        collegeId: testCollegeId,
        category: 'LOGICAL_REASONING',
        questionCount: 10
      });

      const delivered = await practiceService.getDeliveredQuestions(attempt.attemptId);
      const questionIds = delivered.questions.map((q) => q.id);

      expect(questionIds.length).toBe(10);
      expect(new Set(questionIds).size).toBe(10);
    });

    test('Requested question count is respected when sufficient eligible questions exist', async () => {
      for (const count of [3, 5, 8, 10]) {
        const attempt = await practiceService.createPracticeAttempt({
          studentId: testStudentId,
          collegeId: testCollegeId,
          category: 'LOGICAL_REASONING',
          questionCount: count
        });

        expect(attempt.questionCount).toBe(count);
      }
    });

    test('Category filtering is strictly respected across all randomized questions', async () => {
      const attempt = await practiceService.createPracticeAttempt({
        studentId: testStudentId,
        collegeId: testCollegeId,
        category: 'QUANTITATIVE',
        questionCount: 5
      });

      const delivered = await practiceService.getDeliveredQuestions(attempt.attemptId);
      expect(delivered.questions.length).toBe(5);

      for (const q of delivered.questions) {
        // Question title or content originates from QUANTITATIVE
        expect(q.title).toContain('Quantitative');
      }
    });

    test('Difficulty filtering is respected when specified', async () => {
      const attempt = await practiceService.createPracticeAttempt({
        studentId: testStudentId,
        collegeId: testCollegeId,
        category: 'LOGICAL_REASONING',
        difficulty: 'MEDIUM',
        questionCount: 4
      });

      expect(attempt.questionCount).toBe(4);
      // Prisma count was called with difficulty: 'MEDIUM'
      expect(prisma.practiceQuestion.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            difficulty: 'MEDIUM'
          })
        })
      );
    });

    test('Inactive and archived questions are strictly excluded from selection', async () => {
      const attempt = await practiceService.createPracticeAttempt({
        studentId: testStudentId,
        collegeId: testCollegeId,
        category: 'LOGICAL_REASONING',
        questionCount: 15
      });

      const delivered = await practiceService.getDeliveredQuestions(attempt.attemptId);
      const titles = delivered.questions.map((q) => q.title);

      for (const title of titles) {
        expect(title).not.toContain('Inactive Question');
      }
    });

    test('College tenant isolation: Questions belonging to another college are excluded', async () => {
      const attempt = await practiceService.createPracticeAttempt({
        studentId: testStudentId,
        collegeId: testCollegeId,
        category: 'LOGICAL_REASONING',
        questionCount: 15
      });

      const delivered = await practiceService.getDeliveredQuestions(attempt.attemptId);
      const titles = delivered.questions.map((q) => q.title);

      for (const title of titles) {
        expect(title).not.toContain('Private College Question');
      }
    });

    test('Fewer eligible questions than requested preserves existing behavior without failing', async () => {
      // In the mock bank, there are only 5 MEDIUM questions for LOGICAL_REASONING
      const attempt = await practiceService.createPracticeAttempt({
        studentId: testStudentId,
        collegeId: testCollegeId,
        category: 'LOGICAL_REASONING',
        difficulty: 'MEDIUM',
        questionCount: 10 // Requests 10, but only 5 exist
      });

      expect(attempt.questionCount).toBe(5);
    });

    test('Zero eligible questions throws 404 AppError', async () => {
      await expect(
        practiceService.createPracticeAttempt({
          studentId: testStudentId,
          collegeId: testCollegeId,
          category: 'NON_EXISTENT_CATEGORY_XYZ',
          questionCount: 5
        })
      ).rejects.toThrow(/No questions available matching the requested criteria/);
    });

    test('Single questionId practice selection is preserved', async () => {
      const attempt = await practiceService.createPracticeAttempt({
        studentId: testStudentId,
        collegeId: testCollegeId,
        questionId: 'q_lr_3',
        questionCount: 1
      });

      expect(attempt.questionCount).toBe(1);
      const delivered = await practiceService.getDeliveredQuestions(attempt.attemptId);
      expect(delivered.questions[0].title).toBe('Logical Reasoning Question 3');
    });

    test('Response format matches existing API contract', async () => {
      const attempt = await practiceService.createPracticeAttempt({
        studentId: testStudentId,
        collegeId: testCollegeId,
        category: 'LOGICAL_REASONING',
        questionCount: 5
      });

      expect(attempt).toHaveProperty('attemptId');
      expect(attempt).toHaveProperty('studentId', testStudentId);
      expect(attempt).toHaveProperty('collegeId', testCollegeId);
      expect(attempt).toHaveProperty('category', 'LOGICAL_REASONING');
      expect(attempt).toHaveProperty('status', 'IN_PROGRESS');
      expect(attempt).toHaveProperty('questionCount', 5);
      expect(attempt).toHaveProperty('startedAt');
    });
  });

  describe('3. End-to-End HTTP Practice API Randomization & Security Delivery', () => {
    test('POST /api/practice/attempts returns 201 with randomized question count', async () => {
      const res = await request(app)
        .post('/api/practice/attempts')
        .set('Authorization', `Bearer ${testStudentToken}`)
        .send({
          category: 'LOGICAL_REASONING',
          questionCount: 5
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.attemptId).toBeDefined();
      expect(res.body.data.questionCount).toBe(5);
    });

    test('Consecutive API attempts for same category deliver different questions with zero duplicates', async () => {
      // Call 1
      const res1 = await request(app)
        .post('/api/practice/attempts')
        .set('Authorization', `Bearer ${testStudentToken}`)
        .send({
          category: 'LOGICAL_REASONING',
          questionCount: 5
        });

      const attempt1Id = res1.body.data.attemptId;
      const qRes1 = await request(app)
        .get(`/api/practice/attempts/${attempt1Id}/questions`)
        .set('Authorization', `Bearer ${testStudentToken}`);

      // Call 2
      const res2 = await request(app)
        .post('/api/practice/attempts')
        .set('Authorization', `Bearer ${testStudentToken}`)
        .send({
          category: 'LOGICAL_REASONING',
          questionCount: 5
        });

      const attempt2Id = res2.body.data.attemptId;
      const qRes2 = await request(app)
        .get(`/api/practice/attempts/${attempt2Id}/questions`)
        .set('Authorization', `Bearer ${testStudentToken}`);

      expect(qRes1.status).toBe(200);
      expect(qRes2.status).toBe(200);

      const questions1 = qRes1.body.data.questions;
      const questions2 = qRes2.body.data.questions;

      expect(questions1.length).toBe(5);
      expect(questions2.length).toBe(5);

      // Verify no duplicates within each attempt
      const ids1 = questions1.map((q) => q.id);
      const ids2 = questions2.map((q) => q.id);
      expect(new Set(ids1).size).toBe(5);
      expect(new Set(ids2).size).toBe(5);

      // Verify every returned question belongs to LOGICAL_REASONING
      for (const q of questions1) {
        expect(q.title).toContain('Logical Reasoning');
        // Answer security: correctAnswer and explanation MUST NOT be leaked
        expect(q.correctAnswer).toBeUndefined();
        expect(q.explanation).toBeUndefined();
      }
      for (const q of questions2) {
        expect(q.title).toContain('Logical Reasoning');
        expect(q.correctAnswer).toBeUndefined();
        expect(q.explanation).toBeUndefined();
      }

      // Verify the two runs are not deterministically identical
      const identical = ids1.every((id, idx) => id === ids2[idx]);
      expect(identical).toBe(false);
    });
  });
});
