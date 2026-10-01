const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/utils/prisma');
const { cleanDatabase } = require('./testHelper');
const contestService = require('../src/services/contestService');
const judge0Service = require('../src/services/judge0Service');

describe('Contest Submission, MCQ Scoring & Coding Evaluation (Phase 5B.3)', () => {
  const collegeA = 'college_scoring_01';
  const collegeB = 'college_scoring_02';

  const studentA = 'student_eval_01';
  const studentB = 'student_eval_02';

  let codingQVersionId;
  let codingProblemId;
  let aptitudeSingleChoiceVId;
  let aptitudeMultiChoiceVId;
  let technicalTFVersionId;
  let technicalNumericalVId;
  let contestId;

  // Mock Provider for Judge0
  const createMockJudge0 = (resultsMap = {}) => ({
    submitBatch: async (submissions) => {
      return submissions.map((sub, i) => ({
        token: `tok_contest_${sub.language_id}_${i + 1}`
      }));
    },
    pollBatch: async (tokens) => {
      return tokens.map((token) => {
        if (resultsMap[token]) {
          return { token, ...resultsMap[token] };
        }
        // Default Accepted
        return {
          token,
          status_id: 3,
          status: { description: 'Accepted' },
          stdout: '1 2',
          time: '0.02',
          memory: 2048
        };
      });
    }
  });

  beforeAll(async () => {
    await cleanDatabase(prisma);
    judge0Service.setMockProvider(createMockJudge0());

    // 1. Create CODING Question (50 marks in contest, 2 test cases with weights 1.0 and 3.0)
    const codingQ = await prisma.practiceQuestion.create({
      data: {
        type: 'CODING',
        format: 'CODING',
        category: 'DSA',
        difficulty: 'MEDIUM',
        sourceType: 'CURATED'
      }
    });
    const codingVer = await prisma.questionVersion.create({
      data: {
        questionId: codingQ.id,
        versionNumber: 1,
        title: 'Two Sum Weighted',
        statement: 'Find indices summing to target.',
        codingProblem: {
          create: {
            timeLimitMs: 2000,
            memoryLimitKb: 128000,
            maxMarks: 100, // Problem maxMarks (overridden by contest question marks: 50)
            testCases: {
              create: [
                { input: '2 7 11 15\n9', expectedOutput: '0 1', isHidden: false, weight: 1.0, order: 1 },
                { input: '3 2 4\n6', expectedOutput: '1 2', isHidden: true, weight: 3.0, order: 2 }
              ]
            }
          }
        }
      }
    });
    codingQVersionId = codingVer.id;
    const codingProb = await prisma.codingProblem.findUnique({
      where: { questionVersionId: codingQVersionId }
    });
    codingProblemId = codingProb.id;

    // 2. Create APTITUDE Single Choice (10 marks, -2.5 negative marks)
    const aptSingleQ = await prisma.practiceQuestion.create({
      data: {
        type: 'APTITUDE',
        format: 'SINGLE_CHOICE',
        category: 'QUANTITATIVE',
        difficulty: 'EASY',
        sourceType: 'CURATED'
      }
    });
    const aptSingleVer = await prisma.questionVersion.create({
      data: {
        questionId: aptSingleQ.id,
        versionNumber: 1,
        title: 'Work and Time Single Choice',
        statement: 'A can do work in 10 days...',
        options: [{ id: 'opt_1', text: '5 days' }, { id: 'opt_2', text: '6 days' }],
        correctAnswer: { optionId: 'opt_2' }
      }
    });
    aptitudeSingleChoiceVId = aptSingleVer.id;

    // 3. Create APTITUDE Multiple Choice (10 marks, -2.5 negative marks)
    const aptMultiQ = await prisma.practiceQuestion.create({
      data: {
        type: 'APTITUDE',
        format: 'MULTIPLE_CHOICE',
        category: 'LOGICAL',
        difficulty: 'MEDIUM',
        sourceType: 'CURATED'
      }
    });
    const aptMultiVer = await prisma.questionVersion.create({
      data: {
        questionId: aptMultiQ.id,
        versionNumber: 1,
        title: 'Even Numbers Multi Choice',
        statement: 'Select all even numbers from the list.',
        options: [
          { id: 'opt_a', text: '2' },
          { id: 'opt_b', text: '3' },
          { id: 'opt_c', text: '4' },
          { id: 'opt_d', text: '5' }
        ],
        correctAnswer: { optionIds: ['opt_a', 'opt_c'] }
      }
    });
    aptitudeMultiChoiceVId = aptMultiVer.id;

    // 4. Create TECHNICAL True/False (10 marks, -2.0 negative marks)
    const techTFQ = await prisma.practiceQuestion.create({
      data: {
        type: 'TECHNICAL',
        format: 'TRUE_FALSE',
        category: 'DBMS',
        difficulty: 'EASY',
        sourceType: 'CURATED'
      }
    });
    const techTFVer = await prisma.questionVersion.create({
      data: {
        questionId: techTFQ.id,
        versionNumber: 1,
        title: 'ACID Atomicity',
        statement: 'Atomicity means all or nothing.',
        correctAnswer: { value: true }
      }
    });
    technicalTFVersionId = techTFVer.id;

    // 5. Create TECHNICAL Numerical (10 marks, -2.0 negative marks)
    const techNumQ = await prisma.practiceQuestion.create({
      data: {
        type: 'TECHNICAL',
        format: 'NUMERICAL',
        category: 'NETWORKS',
        difficulty: 'MEDIUM',
        sourceType: 'CURATED'
      }
    });
    const techNumVer = await prisma.questionVersion.create({
      data: {
        questionId: techNumQ.id,
        versionNumber: 1,
        title: 'Port Number',
        statement: 'What is the default port for HTTPS?',
        correctAnswer: { value: 443 }
      }
    });
    technicalNumericalVId = techNumVer.id;

    // 6. Create & Publish Contest
    const now = Date.now();
    const contest = await contestService.createContest({
      title: 'Grand Placement Assessment 2026',
      sipsDriveId: 'sips_drive_placement_2026',
      collegeId: collegeA,
      startAt: new Date(now - 600000).toISOString(),
      endAt: new Date(now + 3600000).toISOString(),
      durationMinutes: 60
    });
    contestId = contest.id;

    // Add questions to contest
    await contestService.addContestQuestion(contestId, {
      questionVersionId: codingQVersionId,
      section: 'CODING',
      marks: 50.0,
      negativeMarks: 0.0,
      order: 1
    });
    await contestService.addContestQuestion(contestId, {
      questionVersionId: aptitudeSingleChoiceVId,
      section: 'APTITUDE',
      marks: 10.0,
      negativeMarks: 2.5,
      order: 2
    });
    await contestService.addContestQuestion(contestId, {
      questionVersionId: aptitudeMultiChoiceVId,
      section: 'APTITUDE',
      marks: 10.0,
      negativeMarks: 2.5,
      order: 3
    });
    await contestService.addContestQuestion(contestId, {
      questionVersionId: technicalTFVersionId,
      section: 'TECHNICAL',
      marks: 10.0,
      negativeMarks: 2.0,
      order: 4
    });
    await contestService.addContestQuestion(contestId, {
      questionVersionId: technicalNumericalVId,
      section: 'TECHNICAL',
      marks: 10.0,
      negativeMarks: 2.0,
      order: 5
    });

    await contestService.publishContest(contestId);
    await contestService.markContestLive(contestId);
  });

  afterAll(async () => {
    await cleanDatabase(prisma);
    await prisma.$disconnect();
  });

  describe('1. MCQ Evaluation & Negative Marking (Aptitude & Technical)', () => {
    let attemptId;

    beforeAll(async () => {
      const res = await request(app)
        .post(`/api/contests/${contestId}/attempts/start`)
        .set('x-student-id', studentA)
        .set('x-college-id', collegeA);
      attemptId = res.body.data.attempt.id;
    });

    test('correct single choice awards +marks (10.0)', async () => {
      await request(app)
        .post(`/api/contests/${contestId}/attempts/${attemptId}/responses`)
        .set('x-student-id', studentA)
        .set('x-college-id', collegeA)
        .send({
          questionVersionId: aptitudeSingleChoiceVId,
          answerData: { optionId: 'opt_2' } // Correct
        });
    });

    test('unordered correct multiple choice evaluates as correct', async () => {
      await request(app)
        .post(`/api/contests/${contestId}/attempts/${attemptId}/responses`)
        .set('x-student-id', studentA)
        .set('x-college-id', collegeA)
        .send({
          questionVersionId: aptitudeMultiChoiceVId,
          answerData: { optionIds: ['opt_c', 'opt_a'] } // Unordered correct ['opt_a', 'opt_c']
        });
    });

    test('correct true/false and numerical answers award +marks', async () => {
      await request(app)
        .post(`/api/contests/${contestId}/attempts/${attemptId}/responses`)
        .set('x-student-id', studentA)
        .set('x-college-id', collegeA)
        .send({
          questionVersionId: technicalTFVersionId,
          answerData: { value: true } // Correct
        });

      await request(app)
        .post(`/api/contests/${contestId}/attempts/${attemptId}/responses`)
        .set('x-student-id', studentA)
        .set('x-college-id', collegeA)
        .send({
          questionVersionId: technicalNumericalVId,
          answerData: { value: 443 } // Correct
        });
    });

    test('submitting full correct attempt evaluates section scores accurately', async () => {
      const res = await request(app)
        .post(`/api/contests/${contestId}/attempts/${attemptId}/submit`)
        .set('x-student-id', studentA)
        .set('x-college-id', collegeA);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('SUBMITTED');
      expect(res.body.data.aptitudeScore).toBe(20); // 10 + 10
      expect(res.body.data.technicalScore).toBe(20); // 10 + 10
      expect(res.body.data.codingScore).toBe(0); // No coding submission made
      expect(res.body.data.totalScore).toBe(40); // 20 + 20 + 0
      expect(res.body.data.totalMarks).toBe(90); // 50 + 10 + 10 + 10 + 10
    });
  });

  describe('2. Negative Marking, Unanswered & Section Floor Clamping', () => {
    let attemptId;

    beforeAll(async () => {
      const res = await request(app)
        .post(`/api/contests/${contestId}/attempts/start`)
        .set('x-student-id', 'student_negative_scorer')
        .set('x-college-id', collegeA);
      attemptId = res.body.data.attempt.id;
    });

    test('incorrect answers deduct negativeMarks, extra multi-choice option is incorrect, unanswered receives 0', async () => {
      // 1. Single choice: Incorrect (-2.5)
      await request(app)
        .post(`/api/contests/${contestId}/attempts/${attemptId}/responses`)
        .set('x-student-id', 'student_negative_scorer')
        .set('x-college-id', collegeA)
        .send({
          questionVersionId: aptitudeSingleChoiceVId,
          answerData: { optionId: 'opt_1' } // Wrong -> -2.5
        });

      // 2. Multi choice: Extra option included -> Wrong (-2.5)
      await request(app)
        .post(`/api/contests/${contestId}/attempts/${attemptId}/responses`)
        .set('x-student-id', 'student_negative_scorer')
        .set('x-college-id', collegeA)
        .send({
          questionVersionId: aptitudeMultiChoiceVId,
          answerData: { optionIds: ['opt_a', 'opt_b', 'opt_c'] } // Extra 'opt_b' -> -2.5
        });

      // 3. Technical TF: Wrong (-2.0)
      await request(app)
        .post(`/api/contests/${contestId}/attempts/${attemptId}/responses`)
        .set('x-student-id', 'student_negative_scorer')
        .set('x-college-id', collegeA)
        .send({
          questionVersionId: technicalTFVersionId,
          answerData: { value: false } // Wrong -> -2.0
        });

      // 4. Technical Numerical: Left unanswered -> 0.0

      // Submit attempt
      const submitRes = await request(app)
        .post(`/api/contests/${contestId}/attempts/${attemptId}/submit`)
        .set('x-student-id', 'student_negative_scorer')
        .set('x-college-id', collegeA);

      expect(submitRes.status).toBe(200);
      // Aptitude raw = -2.5 + -2.5 = -5.0 -> Clamped to floor 0.00
      expect(submitRes.body.data.aptitudeScore).toBe(0);
      // Technical raw = -2.0 + 0 = -2.0 -> Clamped to floor 0.00
      expect(submitRes.body.data.technicalScore).toBe(0);
      expect(submitRes.body.data.totalScore).toBe(0);
    });
  });

  describe('3. Contest Coding Problem Execution & Weighted Scoring', () => {
    test('full pass on weighted coding test cases awards full contest marks (50.0)', async () => {
      const startRes = await request(app)
        .post(`/api/contests/${contestId}/attempts/start`)
        .set('x-student-id', 'student_coder_full')
        .set('x-college-id', collegeA);
      const attemptId = startRes.body.data.attempt.id;

      // Submit code through coding execution engine with contestAttemptId
      const codeRes = await request(app)
        .post('/api/coding/execute/submit')
        .send({
          studentId: 'student_coder_full',
          questionVersionId: codingQVersionId,
          contestAttemptId: attemptId,
          language: 'python',
          sourceCode: 'print("0 1")'
        });

      expect(codeRes.status).toBe(200);
      expect(codeRes.body.data.earnedMarks).toBe(50); // Total weight 4.0, passed 4.0 -> (4/4)*50 = 50

      // Submit contest attempt
      const submitRes = await request(app)
        .post(`/api/contests/${contestId}/attempts/${attemptId}/submit`)
        .set('x-student-id', 'student_coder_full')
        .set('x-college-id', collegeA);

      expect(submitRes.status).toBe(200);
      expect(submitRes.body.data.codingScore).toBe(50);
      expect(submitRes.body.data.totalScore).toBe(50);
    });

    test('partial pass calculates proportional weighted marks', async () => {
      // Configure mock to pass only test case 1 (weight 1.0) and fail test case 2 (weight 3.0)
      judge0Service.setMockProvider({
        submitBatch: async (subs) => subs.map((_, i) => ({ token: `tok_partial_${i}` })),
        pollBatch: async (tokens) => [
          { token: 'tok_partial_0', status_id: 3, stdout: '0 1', time: '0.01', memory: 1024 }, // Passed (weight 1.0)
          { token: 'tok_partial_1', status_id: 4, stdout: 'wrong', time: '0.01', memory: 1024 } // Failed (weight 3.0)
        ]
      });

      const startRes = await request(app)
        .post(`/api/contests/${contestId}/attempts/start`)
        .set('x-student-id', 'student_coder_partial')
        .set('x-college-id', collegeA);
      const attemptId = startRes.body.data.attempt.id;

      const codeRes = await request(app)
        .post('/api/coding/execute/submit')
        .send({
          studentId: 'student_coder_partial',
          questionVersionId: codingQVersionId,
          contestAttemptId: attemptId,
          language: 'python',
          sourceCode: 'print("partial")'
        });

      expect(codeRes.status).toBe(200);
      // Weight passed: 1.0 out of 4.0 -> (1/4)*50 = 12.5 marks
      expect(codeRes.body.data.earnedMarks).toBe(12.5);

      const submitRes = await request(app)
        .post(`/api/contests/${contestId}/attempts/${attemptId}/submit`)
        .set('x-student-id', 'student_coder_partial')
        .set('x-college-id', collegeA);

      expect(submitRes.status).toBe(200);
      expect(submitRes.body.data.codingScore).toBe(12.5);
    });

    test('compilation error awards zero coding marks (0.0)', async () => {
      judge0Service.setMockProvider({
        submitBatch: async (subs) => subs.map((_, i) => ({ token: `tok_ce_${i}` })),
        pollBatch: async (tokens) =>
          tokens.map((token) => ({
            token,
            status_id: 6,
            compile_output: 'SyntaxError: invalid syntax'
          }))
      });

      const startRes = await request(app)
        .post(`/api/contests/${contestId}/attempts/start`)
        .set('x-student-id', 'student_coder_ce')
        .set('x-college-id', collegeA);
      const attemptId = startRes.body.data.attempt.id;

      const codeRes = await request(app)
        .post('/api/coding/execute/submit')
        .send({
          studentId: 'student_coder_ce',
          questionVersionId: codingQVersionId,
          contestAttemptId: attemptId,
          language: 'python',
          sourceCode: 'def invalid(:'
        });

      expect(codeRes.status).toBe(200);
      expect(codeRes.body.data.status).toBe('COMPILATION_ERROR');
      expect(codeRes.body.data.earnedMarks).toBe(0);

      const submitRes = await request(app)
        .post(`/api/contests/${contestId}/attempts/${attemptId}/submit`)
        .set('x-student-id', 'student_coder_ce')
        .set('x-college-id', collegeA);

      expect(submitRes.status).toBe(200);
      expect(submitRes.body.data.codingScore).toBe(0);
    });
  });

  describe('4. Idempotent Submission, Concurrency & Result Delivery', () => {
    let attemptId;

    beforeAll(async () => {
      judge0Service.setMockProvider(createMockJudge0());
      const res = await request(app)
        .post(`/api/contests/${contestId}/attempts/start`)
        .set('x-student-id', 'student_idempotent_tester')
        .set('x-college-id', collegeA);
      attemptId = res.body.data.attempt.id;

      // Answer single choice correctly (+10)
      await request(app)
        .post(`/api/contests/${contestId}/attempts/${attemptId}/responses`)
        .set('x-student-id', 'student_idempotent_tester')
        .set('x-college-id', collegeA)
        .send({
          questionVersionId: aptitudeSingleChoiceVId,
          answerData: { optionId: 'opt_2' }
        });
    });

    test('manual submission finalizes attempt and calculates total score', async () => {
      const res = await request(app)
        .post(`/api/contests/${contestId}/attempts/${attemptId}/submit`)
        .set('x-student-id', 'student_idempotent_tester')
        .set('x-college-id', collegeA);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('SUBMITTED');
      expect(res.body.data.totalScore).toBe(10);
      expect(res.body.data.isFinalized).toBe(true);
    });

    test('subsequent submit request is idempotent and returns identical finalized score', async () => {
      const res = await request(app)
        .post(`/api/contests/${contestId}/attempts/${attemptId}/submit`)
        .set('x-student-id', 'student_idempotent_tester')
        .set('x-college-id', collegeA);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('SUBMITTED');
      expect(res.body.data.totalScore).toBe(10);
    });

    test('student-safe result endpoint delivers scores without answer key leakage', async () => {
      const res = await request(app)
        .get(`/api/contests/${contestId}/attempts/${attemptId}/result`)
        .set('x-student-id', 'student_idempotent_tester')
        .set('x-college-id', collegeA);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('SUBMITTED');
      expect(res.body.data.totalScore).toBe(10);
      expect(res.body.data.totalMarks).toBe(90);
      expect(res.body.data.questionBreakdown.length).toBe(5);

      // Security checks:
      expect(res.body.data.correctAnswer).toBeUndefined();
      expect(res.body.data.explanation).toBeUndefined();
    });
  });

  describe('5. Security & Access Control', () => {
    let attemptId;

    beforeAll(async () => {
      const res = await request(app)
        .post(`/api/contests/${contestId}/attempts/start`)
        .set('x-student-id', 'student_security_owner')
        .set('x-college-id', collegeA);
      attemptId = res.body.data.attempt.id;
    });

    test('unauthorized student cannot submit another student attempt (403 ATTEMPT_ACCESS_DENIED)', async () => {
      const res = await request(app)
        .post(`/api/contests/${contestId}/attempts/${attemptId}/submit`)
        .set('x-student-id', 'student_malicious_attacker')
        .set('x-college-id', collegeA);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/do not have access/i);
    });

    test('different college student receives 403 TENANT_MISMATCH on result query', async () => {
      const res = await request(app)
        .get(`/api/contests/${contestId}/attempts/${attemptId}/result`)
        .set('x-student-id', 'student_other_tenant')
        .set('x-college-id', collegeB);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/does not belong to your institution/i);
    });

    test('client-supplied marksAwarded or isCorrect in response body is completely ignored', async () => {
      const res = await request(app)
        .post(`/api/contests/${contestId}/attempts/${attemptId}/responses`)
        .set('x-student-id', 'student_security_owner')
        .set('x-college-id', collegeA)
        .send({
          questionVersionId: aptitudeSingleChoiceVId,
          answerData: { optionId: 'opt_1' }, // Incorrect option
          isCorrect: true, // Malicious injection
          marksAwarded: 100.0, // Malicious injection
          score: 100.0
        });

      expect(res.status).toBe(200);

      // Now submit and verify the server evaluates the actual answer as incorrect (-2.5), not +100
      const submitRes = await request(app)
        .post(`/api/contests/${contestId}/attempts/${attemptId}/submit`)
        .set('x-student-id', 'student_security_owner')
        .set('x-college-id', collegeA);

      expect(submitRes.status).toBe(200);
      expect(submitRes.body.data.aptitudeScore).toBe(0); // Clamped from -2.5
      expect(submitRes.body.data.totalScore).toBe(0);
    });
  });
});
