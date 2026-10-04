const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/utils/prisma');
const judge0Service = require('../src/services/judge0Service');
const { cleanDatabase, createTestToken } = require('./testHelper');

describe('Phase 6D.5 — Submission Hardening & Anti-Cheating Security Suite', () => {
  const collegeA = 'college_rvce_01';
  const collegeB = 'college_bmsit_02';

  const studentA = 'student_rvce_001';
  const studentB = 'student_rvce_002';
  const studentC_otherCollege = 'student_bmsit_003';

  const tokenA = createTestToken({ id: studentA, collegeId: collegeA });
  const tokenB = createTestToken({ id: studentB, collegeId: collegeA });
  const tokenC = createTestToken({ id: studentC_otherCollege, collegeId: collegeB });

  let qvMcq1, qvMcq2, qvCoding, qvUnrelated;
  let contestA, contestB;
  let attemptA;

  beforeEach(async () => {
    await cleanDatabase(prisma);

    // Set deterministic mock provider for Judge0
    judge0Service.setMockProvider({
      submitBatch: async (submissions) => {
        return submissions.map((sub, i) => ({
          token: `mock-token-${i + 1}`
        }));
      },
      pollBatch: async (tokens) => {
        return tokens.map((token) => ({
          token,
          status_id: 3, // Accepted
          status: { description: 'Accepted' },
          stdout: 'output_mock\n',
          stderr: null,
          compile_output: null,
          time: '0.05',
          memory: 1024
        }));
      }
    });

    // 1. Seed MCQ 1
    const q1 = await prisma.practiceQuestion.create({
      data: {
        type: 'APTITUDE',
        format: 'SINGLE_CHOICE',
        category: 'QUANTITATIVE',
        difficulty: 'EASY',
        sourceType: 'CURATED'
      }
    });
    qvMcq1 = await prisma.questionVersion.create({
      data: {
        questionId: q1.id,
        versionNumber: 1,
        title: 'Aptitude Math Question',
        statement: 'What is 2 + 2?',
        options: [{ id: 'opt_1', text: '4' }, { id: 'opt_2', text: '5' }],
        correctAnswer: { optionId: 'opt_1' }
      }
    });

    // 2. Seed MCQ 2
    const q2 = await prisma.practiceQuestion.create({
      data: {
        type: 'TECHNICAL',
        format: 'SINGLE_CHOICE',
        category: 'CORE_CS',
        difficulty: 'MEDIUM',
        sourceType: 'CURATED'
      }
    });
    qvMcq2 = await prisma.questionVersion.create({
      data: {
        questionId: q2.id,
        versionNumber: 1,
        title: 'Technical JS Question',
        statement: 'typeof NaN is?',
        options: [{ id: 'opt_a', text: 'number' }, { id: 'opt_b', text: 'object' }],
        correctAnswer: { optionId: 'opt_a' }
      }
    });

    // 3. Seed Coding
    const qCoding = await prisma.practiceQuestion.create({
      data: {
        type: 'CODING',
        format: 'CODING',
        category: 'DSA',
        difficulty: 'EASY',
        sourceType: 'CURATED'
      }
    });
    qvCoding = await prisma.questionVersion.create({
      data: {
        questionId: qCoding.id,
        versionNumber: 1,
        title: 'Two Sum Problem',
        statement: 'Solve Two Sum',
        codingProblem: {
          create: {
            timeLimitMs: 2000,
            memoryLimitKb: 262144,
            maxMarks: 50.0,
            testCases: {
              create: [
                {
                  input: '1 2\n',
                  expectedOutput: 'output_mock\n',
                  isHidden: false,
                  weight: 20.0,
                  order: 1
                },
                {
                  input: '3 4\n',
                  expectedOutput: 'output_mock\n',
                  isHidden: true,
                  weight: 30.0,
                  order: 2
                }
              ]
            }
          }
        }
      }
    });

    // 4. Unrelated question not in contest
    const qUnrelated = await prisma.practiceQuestion.create({
      data: {
        type: 'APTITUDE',
        format: 'SINGLE_CHOICE',
        category: 'LOGICAL',
        difficulty: 'HARD',
        sourceType: 'CURATED'
      }
    });
    qvUnrelated = await prisma.questionVersion.create({
      data: {
        questionId: qUnrelated.id,
        versionNumber: 1,
        title: 'Unrelated Question',
        statement: 'Secret question',
        options: [{ id: 'opt_x', text: 'secret' }],
        correctAnswer: { optionId: 'opt_x' }
      }
    });

    // 5. Seed active contest for college A
    contestA = await prisma.contest.create({
      data: {
        collegeId: collegeA,
        title: 'College A Hackathon',
        status: 'LIVE',
        startAt: new Date(Date.now() - 30 * 60 * 1000), // Started 30 mins ago
        endAt: new Date(Date.now() + 60 * 60 * 1000),   // Ends in 60 mins
        durationMinutes: 60,
        questions: {
          create: [
            {
              questionVersionId: qvMcq1.id,
              section: 'APTITUDE',
              order: 1,
              marks: 25.0,
              negativeMarks: 5.0
            },
            {
              questionVersionId: qvMcq2.id,
              section: 'TECHNICAL',
              order: 2,
              marks: 25.0,
              negativeMarks: 5.0
            },
            {
              questionVersionId: qvCoding.id,
              section: 'CODING',
              order: 3,
              marks: 50.0,
              negativeMarks: 0.0
            }
          ]
        }
      }
    });

    // 6. Seed contest for college B
    contestB = await prisma.contest.create({
      data: {
        collegeId: collegeB,
        title: 'College B Contest',
        status: 'LIVE',
        startAt: new Date(Date.now() - 30 * 60 * 1000),
        endAt: new Date(Date.now() + 60 * 60 * 1000),
        durationMinutes: 60
      }
    });

    // 7. Seed attempt for student A
    attemptA = await prisma.contestAttempt.create({
      data: {
        contestId: contestA.id,
        studentId: studentA,
        collegeId: collegeA,
        status: 'IN_PROGRESS',
        startedAt: new Date(Date.now() - 10 * 60 * 1000), // Started 10 mins ago
        totalMarks: 100.0
      }
    });
  });

  afterEach(() => {
    judge0Service.clearMockProvider();
  });

  describe('1. Identity & Student Isolation', () => {
    test('Student A token cannot manipulate body to act as Student B', async () => {
      const res = await request(app)
        .post(`/api/contests/${contestA.id}/attempts/${attemptA.id}/responses`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          studentId: studentB, // Attempted identity spoof
          questionVersionId: qvMcq1.id,
          answerData: { selectedOptionId: 'opt_1' }
        });

      expect(res.status).toBe(200);
      // Response must belong to Student A's attempt, server ignores body.studentId
      const savedResp = await prisma.questionResponse.findFirst({
        where: { contestAttemptId: attemptA.id }
      });
      expect(savedResp.contestAttemptId).toBe(attemptA.id);
    });

    test('Student B cannot record response on Student A attempt', async () => {
      const res = await request(app)
        .post(`/api/contests/${contestA.id}/attempts/${attemptA.id}/responses`)
        .set('Authorization', `Bearer ${tokenB}`)
        .send({
          questionVersionId: qvMcq1.id,
          answerData: { selectedOptionId: 'opt_1' }
        });

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/access/i);
    });

    test('Student B cannot submit or finalize Student A attempt', async () => {
      const res = await request(app)
        .post(`/api/contests/${contestA.id}/attempts/${attemptA.id}/submit`)
        .set('Authorization', `Bearer ${tokenB}`)
        .send({});

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/access/i);
    });
  });

  describe('2. Cross-College Tenant Isolation', () => {
    test('Student from College B cannot access Contest of College A', async () => {
      const res = await request(app)
        .get(`/api/contests/${contestA.id}/student`)
        .set('Authorization', `Bearer ${tokenC}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/institution/i);
    });

    test('Student from College B cannot start attempt on College A contest', async () => {
      const res = await request(app)
        .post(`/api/contests/${contestA.id}/attempts/start`)
        .set('Authorization', `Bearer ${tokenC}`)
        .send({});

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/institution/i);
    });

    test('Student from College B cannot execute code against College A contest attempt', async () => {
      const res = await request(app)
        .post('/api/coding/execute/submit')
        .set('Authorization', `Bearer ${tokenC}`)
        .send({
          questionVersionId: qvCoding.id,
          contestAttemptId: attemptA.id,
          language: 'python',
          sourceCode: 'print("hacked")'
        });

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/institution|another student/i);
    });
  });

  describe('3. Contest Question Pinning & Question Tampering', () => {
    test('Rejects response for questionVersionId not pinned in the contest', async () => {
      const res = await request(app)
        .post(`/api/contests/${contestA.id}/attempts/${attemptA.id}/responses`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          questionVersionId: qvUnrelated.id,
          answerData: { selectedOptionId: 'opt_x' }
        });

      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/not belong/i);
    });

    test('Rejects coding execution for question not in contest attempt', async () => {
      const res = await request(app)
        .post('/api/coding/execute/submit')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          questionVersionId: qvUnrelated.id,
          contestAttemptId: attemptA.id,
          language: 'python',
          sourceCode: 'print("hello")'
        });

      expect([400, 404]).toContain(res.status);
    });
  });

  describe('4. Server-Authoritative Scoring Manipulation', () => {
    test('Client-provided marks, isCorrect, and totalMarks are ignored for MCQ', async () => {
      const res = await request(app)
        .post(`/api/contests/${contestA.id}/attempts/${attemptA.id}/responses`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          questionVersionId: qvMcq1.id,
          answerData: { selectedOptionId: 'opt_1' }, // Correct answer
          marksAwarded: 99999, // Injected marks
          isCorrect: true,
          totalScore: 99999
        });

      expect(res.status).toBe(200);

      // Finalize and check authoritative evaluation
      const finalizeRes = await request(app)
        .post(`/api/contests/${contestA.id}/attempts/${attemptA.id}/submit`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({});

      expect(finalizeRes.status).toBe(200);
      expect(finalizeRes.body.data.aptitudeScore).toBe(25.0); // Exact pinned marks
      expect(finalizeRes.body.data.totalScore).toBe(25.0);
    });

    test('Client-provided weights and earnedMarks are ignored for coding SUBMIT', async () => {
      const res = await request(app)
        .post('/api/coding/execute/submit')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          questionVersionId: qvCoding.id,
          contestAttemptId: attemptA.id,
          language: 'python',
          sourceCode: 'print("output_mock")',
          earnedMarks: 9999,
          testsPassed: 100,
          weight: 1000
        });

      expect(res.status).toBe(200);
      expect(res.body.data.earnedMarks).toBe(50.0); // Pinned contest question marks (50.0)
    });

    test('Coding RUN mode NEVER awards official marks or alters contest score', async () => {
      const runRes = await request(app)
        .post('/api/coding/execute/run')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          questionVersionId: qvCoding.id,
          contestAttemptId: attemptA.id,
          language: 'python',
          sourceCode: 'print("output_mock")'
        });

      expect(runRes.status).toBe(200);
      expect(runRes.body.data.earnedMarks).toBe(0.0);

      // Verify no QuestionResponse with marks was created from RUN
      const resp = await prisma.questionResponse.findFirst({
        where: { contestAttemptId: attemptA.id, questionVersionId: qvCoding.id }
      });
      expect(resp).toBeNull();
    });
  });

  describe('5. Hidden Test & Token Sanitization', () => {
    test('Coding RUN returns only public tests; SUBMIT scrubs hidden test inputs/outputs and tokens', async () => {
      const submitRes = await request(app)
        .post('/api/coding/execute/submit')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          questionVersionId: qvCoding.id,
          contestAttemptId: attemptA.id,
          language: 'python',
          sourceCode: 'print("output_mock")'
        });

      expect(submitRes.status).toBe(200);
      const testResults = submitRes.body.data.testResults;
      expect(testResults.length).toBe(2);

      const publicTest = testResults.find((t) => !t.isHidden);
      const hiddenTest = testResults.find((t) => t.isHidden);

      expect(publicTest.input).toBeDefined();
      expect(hiddenTest.input).toBeUndefined();
      expect(hiddenTest.expectedOutput).toBeUndefined();
      expect(hiddenTest.stdout).toBeUndefined();
      expect(hiddenTest.judge0Token).toBeUndefined(); // Token stripped from public response
    });
  });

  describe('6. Deadline Enforcement & Mutation Prevention', () => {
    test('Rejects response after effective deadline and marks attempt TIMED_OUT', async () => {
      // Fast-forward attempt startedAt to beyond duration
      await prisma.contestAttempt.update({
        where: { id: attemptA.id },
        data: {
          startedAt: new Date(Date.now() - 70 * 60 * 1000) // 70 mins ago (duration 60 mins)
        }
      });

      const res = await request(app)
        .post(`/api/contests/${contestA.id}/attempts/${attemptA.id}/responses`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          questionVersionId: qvMcq1.id,
          answerData: { selectedOptionId: 'opt_1' }
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/deadline/i);

      const updatedAttempt = await prisma.contestAttempt.findUnique({
        where: { id: attemptA.id }
      });
      expect(updatedAttempt.status).toBe('TIMED_OUT');
    });

    test('Rejects coding execution after deadline has passed', async () => {
      await prisma.contestAttempt.update({
        where: { id: attemptA.id },
        data: {
          startedAt: new Date(Date.now() - 70 * 60 * 1000)
        }
      });

      const res = await request(app)
        .post('/api/coding/execute/submit')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          questionVersionId: qvCoding.id,
          contestAttemptId: attemptA.id,
          language: 'python',
          sourceCode: 'print("hello")'
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/deadline/i);
    });
  });

  describe('7. Finalized Attempt Immutability & Replay Idempotency', () => {
    test('Finalized SUBMITTED attempt cannot be mutated by new responses or code submissions', async () => {
      // First finalize attempt
      await request(app)
        .post(`/api/contests/${contestA.id}/attempts/${attemptA.id}/submit`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({});

      // Attempt to add new response
      const mutateRes = await request(app)
        .post(`/api/contests/${contestA.id}/attempts/${attemptA.id}/responses`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          questionVersionId: qvMcq1.id,
          answerData: { selectedOptionId: 'opt_1' }
        });

      expect(mutateRes.status).toBe(400);
      expect(mutateRes.body.message).toMatch(/status|in_progress/i);

      // Attempt to submit code
      const codeRes = await request(app)
        .post('/api/coding/execute/submit')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          questionVersionId: qvCoding.id,
          contestAttemptId: attemptA.id,
          language: 'python',
          sourceCode: 'print("hello")'
        });

      expect(codeRes.status).toBe(409);
    });

    test('Re-submitting a finalized attempt is idempotent and returns consistent score', async () => {
      // Record answer
      await request(app)
        .post(`/api/contests/${contestA.id}/attempts/${attemptA.id}/responses`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          questionVersionId: qvMcq1.id,
          answerData: { selectedOptionId: 'opt_1' }
        });

      // Submit 1
      const res1 = await request(app)
        .post(`/api/contests/${contestA.id}/attempts/${attemptA.id}/submit`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({});

      expect(res1.status).toBe(200);
      const score1 = res1.body.data.totalScore;

      // Submit 2 (Replay)
      const res2 = await request(app)
        .post(`/api/contests/${contestA.id}/attempts/${attemptA.id}/submit`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({});

      expect(res2.status).toBe(200);
      expect(res2.body.data.totalScore).toBe(score1);
      expect(res2.body.data.isFinalized).toBe(true);
    });
  });

  describe('8. Contest Lifecycle Protection', () => {
    test('Cannot start DRAFT contest', async () => {
      const draftContest = await prisma.contest.create({
        data: {
          collegeId: collegeA,
          title: 'Draft Contest',
          status: 'DRAFT',
          startAt: new Date(Date.now() - 1000),
          endAt: new Date(Date.now() + 100000),
          durationMinutes: 60
        }
      });

      const res = await request(app)
        .post(`/api/contests/${draftContest.id}/attempts/start`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/draft|not been published/i);
    });

    test('Cannot execute code or submit responses against CANCELLED contest', async () => {
      await prisma.contest.update({
        where: { id: contestA.id },
        data: { status: 'CANCELLED' }
      });

      const respRes = await request(app)
        .post(`/api/contests/${contestA.id}/attempts/${attemptA.id}/responses`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          questionVersionId: qvMcq1.id,
          answerData: { selectedOptionId: 'opt_1' }
        });

      expect(respRes.status).toBe(400);

      const codeRes = await request(app)
        .post('/api/coding/execute/submit')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          questionVersionId: qvCoding.id,
          contestAttemptId: attemptA.id,
          language: 'python',
          sourceCode: 'print("hello")'
        });

      expect(codeRes.status).toBe(400);
    });
  });
});
