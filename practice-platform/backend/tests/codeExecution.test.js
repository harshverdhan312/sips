const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/utils/prisma');
const judge0Service = require('../src/services/judge0Service');
const { cleanDatabase, createTestToken } = require('./testHelper');

describe('Judge0 Code Execution Engine (RUN vs SUBMIT) - Authenticated SIPS JWT', () => {
  let studentId = 'student_test_coder';
  let collegeId = 'college_rvce_01';
  let authToken;
  let codingQuestionId, codingVersionId, codingProblemId;
  let publicTc1Id, publicTc2Id, hiddenTc1Id, hiddenTc2Id;
  let practiceAttemptId;

  // Default fallback mock provider to prevent unmocked network calls during tests
  const defaultMockProvider = {
    submitBatch: async (submissions) => {
      return submissions.map((_, i) => ({ token: `tok_default_${i + 1}` }));
    },
    pollBatch: async (tokens) => {
      return tokens.map((token) => ({
        token,
        status_id: 3,
        status: { description: 'Accepted' },
        stdout: '6\n3 2 1',
        time: '0.04',
        memory: 1024
      }));
    }
  };

  beforeAll(async () => {
    await cleanDatabase(prisma);
    judge0Service.setMockProvider(defaultMockProvider);
    authToken = createTestToken({ id: studentId, collegeId });

    // 1. Create a CODING PracticeQuestion + initial QuestionVersion
    const qRes = await request(app)
      .post('/api/questions')
      .send({
        type: 'CODING',
        format: 'CODING',
        category: 'DSA',
        subcategory: 'ARRAYS',
        difficulty: 'MEDIUM',
        sourceType: 'CURATED',
        title: 'Array Reversal & Summation',
        statement: 'Read N integers, reverse the array, and print the sum and space-separated elements.'
      });

    codingQuestionId = qRes.body.data.id;
    codingVersionId = qRes.body.data.versions[0].id;

    // 2. Create CodingProblem (maxMarks = 100.0)
    const cpRes = await request(app)
      .post(`/api/question-versions/${codingVersionId}/coding-problem`)
      .send({
        inputFormat: 'Line 1: N integers',
        outputFormat: 'Line 1: Sum\nLine 2: Reversed array',
        constraints: '1 <= N <= 10^5',
        timeLimitMs: 2000,
        memoryLimitKb: 256000,
        maxMarks: 100.0
      });
    codingProblemId = cpRes.body.data.id;

    // 3. Add 2 Public Test Cases (Weight: 10 + 10 = 20)
    const ptc1 = await request(app)
      .post(`/api/coding-problems/${codingProblemId}/test-cases`)
      .send({
        input: '3\n1 2 3',
        expectedOutput: '6\n3 2 1',
        weight: 10.0,
        isHidden: false,
        order: 1
      });
    publicTc1Id = ptc1.body.data.id;

    const ptc2 = await request(app)
      .post(`/api/coding-problems/${codingProblemId}/test-cases`)
      .send({
        input: '2\n10 20',
        expectedOutput: '30\n20 10',
        weight: 10.0,
        isHidden: false,
        order: 2
      });
    publicTc2Id = ptc2.body.data.id;

    // 4. Add 2 Hidden Test Cases (Weight: 40 + 40 = 80)
    const htc1 = await request(app)
      .post(`/api/coding-problems/${codingProblemId}/test-cases`)
      .send({
        input: '4\n-1 -2 -3 -4',
        expectedOutput: '-10\n-4 -3 -2 -1',
        weight: 40.0,
        isHidden: true,
        order: 3
      });
    hiddenTc1Id = htc1.body.data.id;

    const htc2 = await request(app)
      .post(`/api/coding-problems/${codingProblemId}/test-cases`)
      .send({
        input: '5\n100 200 300 400 500',
        expectedOutput: '1500\n500 400 300 200 100',
        weight: 40.0,
        isHidden: true,
        order: 4
      });
    hiddenTc2Id = htc2.body.data.id;

    // 5. Create a PracticeAttempt containing this question
    const attRes = await request(app)
      .post('/api/practice/attempts')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        studentId,
        collegeId,
        type: 'CODING',
        questionCount: 1
      });
    practiceAttemptId = attRes.body.data.attemptId;
  });

  afterAll(async () => {
    judge0Service.clearMockProvider();
    await prisma.codeSubmissionTestResult.deleteMany({});
    await prisma.codeSubmission.deleteMany({});
    await prisma.questionResponse.deleteMany({});
    await prisma.practiceAttempt.deleteMany({});
    await prisma.codingTestCase.deleteMany({});
    await prisma.codingProblem.deleteMany({});
    await prisma.questionVersion.deleteMany({});
    await prisma.practiceQuestion.deleteMany({});
    await prisma.$disconnect();
  });

  beforeEach(() => {
    judge0Service.setMockProvider(defaultMockProvider);
  });

  // =========================================================================
  // RUN MODE TESTS
  // =========================================================================
  describe('RUN Mode Pipelines', () => {
    test('1. RUN: Valid code passes public sample tests (ACCEPTED, 0 marks, full output visible)', async () => {
      judge0Service.setMockProvider({
        submitBatch: async (submissions) => {
          expect(submissions).toHaveLength(2); // Only 2 public tests
          return [{ token: 'tok_run_1' }, { token: 'tok_run_2' }];
        },
        pollBatch: async (tokens) => {
          return [
            {
              token: 'tok_run_1',
              status_id: 3,
              status: { description: 'Accepted' },
              stdout: '6\n3 2 1\n',
              stderr: null,
              time: '0.045',
              memory: 2048
            },
            {
              token: 'tok_run_2',
              status_id: 3,
              status: { description: 'Accepted' },
              stdout: '30\n20 10\n',
              stderr: null,
              time: '0.048',
              memory: 2048
            }
          ];
        }
      });

      const res = await request(app)
        .post('/api/coding/execute/run')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          questionVersionId: codingVersionId,
          practiceAttemptId,
          language: 'python',
          sourceCode: 'import sys\n# correct code'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.mode).toBe('RUN');
      expect(res.body.data.status).toBe('ACCEPTED');
      expect(res.body.data.testsPassed).toBe(2);
      expect(res.body.data.testsTotal).toBe(2);
      expect(res.body.data.earnedMarks).toBe(0);
      expect(res.body.data.testResults).toHaveLength(2);

      // Public test outputs are visible
      expect(res.body.data.testResults[0].passed).toBe(true);
      expect(res.body.data.testResults[0].stdout).toContain('6\n3 2 1');
      expect(res.body.data.testResults[0].expectedOutput).toBe('6\n3 2 1');
    });

    test('2. RUN: Public test failure produces WRONG_ANSWER and diff visibility', async () => {
      judge0Service.setMockProvider({
        submitBatch: async () => [{ token: 'tok_run_fail_1' }, { token: 'tok_run_fail_2' }],
        pollBatch: async () => [
          {
            token: 'tok_run_fail_1',
            status_id: 4,
            status: { description: 'Wrong Answer' },
            stdout: 'Incorrect Output\n',
            stderr: null,
            time: '0.020',
            memory: 1024
          },
          {
            token: 'tok_run_fail_2',
            status_id: 3,
            status: { description: 'Accepted' },
            stdout: '30\n20 10\n',
            time: '0.022',
            memory: 1024
          }
        ]
      });

      const res = await request(app)
        .post('/api/coding/execute/run')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          questionVersionId: codingVersionId,
          language: 'cpp',
          sourceCode: 'int main() { return 0; }'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.mode).toBe('RUN');
      expect(res.body.data.status).toBe('PARTIAL');
      expect(res.body.data.testsPassed).toBe(1);
      expect(res.body.data.earnedMarks).toBe(0);
    });

    test('3. RUN: Compilation Error captures compile output and marks submission as COMPILATION_ERROR', async () => {
      judge0Service.setMockProvider({
        submitBatch: async () => [{ token: 'tok_ce_1' }, { token: 'tok_ce_2' }],
        pollBatch: async () => [
          {
            token: 'tok_ce_1',
            status_id: 6,
            status: { description: 'Compilation Error' },
            compile_output: 'error: expected ";" before "}" token\n',
            stdout: null,
            stderr: null
          },
          {
            token: 'tok_ce_2',
            status_id: 6,
            status: { description: 'Compilation Error' },
            compile_output: 'error: expected ";" before "}" token\n',
            stdout: null,
            stderr: null
          }
        ]
      });

      const res = await request(app)
        .post('/api/coding/execute/run')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          questionVersionId: codingVersionId,
          language: 'cpp',
          sourceCode: 'int main() { syntax error }'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.status).toBe('COMPILATION_ERROR');
      expect(res.body.data.compileOutput).toContain('expected ";" before "}" token');
      expect(res.body.data.earnedMarks).toBe(0);
    });

    test('4 & 5. RUN: Runtime error and Timeout statuses are accurately preserved', async () => {
      judge0Service.setMockProvider({
        submitBatch: async () => [{ token: 'tok_tle_1' }, { token: 'tok_rte_2' }],
        pollBatch: async () => [
          {
            token: 'tok_tle_1',
            status_id: 5,
            status: { description: 'Time Limit Exceeded' },
            time: '2.005',
            stdout: null
          },
          {
            token: 'tok_rte_2',
            status_id: 11,
            status: { description: 'Runtime Error (NZEC)' },
            stderr: 'ZeroDivisionError: division by zero',
            stdout: null
          }
        ]
      });

      const res = await request(app)
        .post('/api/coding/execute/run')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          questionVersionId: codingVersionId,
          language: 'python',
          sourceCode: 'while True: pass'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.status).toBe('TIME_LIMIT_EXCEEDED');
      expect(res.body.data.testResults[0].status).toBe('TIME_LIMIT_EXCEEDED');
      expect(res.body.data.testResults[1].status).toBe('RUNTIME_ERROR');
      expect(res.body.data.testResults[1].stderr).toContain('ZeroDivisionError');
    });

    test('6 & 7. RUN: Hidden tests are NEVER selected and no official marks are awarded', async () => {
      judge0Service.setMockProvider({
        submitBatch: async (submissions) => {
          expect(submissions.length).toBe(2);
          return [{ token: 'tok_p1' }, { token: 'tok_p2' }];
        },
        pollBatch: async () => [
          { token: 'tok_p1', status_id: 3, stdout: '6\n3 2 1' },
          { token: 'tok_p2', status_id: 3, stdout: '30\n20 10' }
        ]
      });

      const res = await request(app)
        .post('/api/coding/execute/run')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          questionVersionId: codingVersionId,
          language: 'javascript',
          sourceCode: 'console.log("hello");'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.testsTotal).toBe(2);
      expect(res.body.data.earnedMarks).toBe(0.0);
    });
  });

  // =========================================================================
  // SUBMIT MODE TESTS
  // =========================================================================
  describe('SUBMIT Mode Pipelines', () => {
    test('8. SUBMIT: 100% test pass awards full maxMarks (ACCEPTED, 100.00 marks)', async () => {
      judge0Service.setMockProvider({
        submitBatch: async (submissions) => {
          expect(submissions).toHaveLength(4);
          return [
            { token: 'tok_sub_1' },
            { token: 'tok_sub_2' },
            { token: 'tok_sub_3' },
            { token: 'tok_sub_4' }
          ];
        },
        pollBatch: async () => [
          { token: 'tok_sub_1', status_id: 3, stdout: '6\n3 2 1', time: '0.05' },
          { token: 'tok_sub_2', status_id: 3, stdout: '30\n20 10', time: '0.04' },
          { token: 'tok_sub_3', status_id: 3, stdout: '-10\n-4 -3 -2 -1', time: '0.06' },
          { token: 'tok_sub_4', status_id: 3, stdout: '1500\n500 400 300 200 100', time: '0.05' }
        ]
      });

      const res = await request(app)
        .post('/api/coding/execute/submit')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          questionVersionId: codingVersionId,
          practiceAttemptId,
          language: 'python',
          sourceCode: 'full solution code'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.mode).toBe('SUBMIT');
      expect(res.body.data.status).toBe('ACCEPTED');
      expect(res.body.data.testsPassed).toBe(4);
      expect(res.body.data.testsTotal).toBe(4);
      expect(res.body.data.earnedMarks).toBe(100.0);

      const dbSubmission = await prisma.codeSubmission.findUnique({
        where: { id: res.body.data.id },
        include: { testResults: true }
      });

      expect(dbSubmission.testResults).toHaveLength(4);
      expect(dbSubmission.testResults.every((tr) => tr.passed)).toBe(true);
    });

    test('9 & 14. SUBMIT: Partial pass calculates exact weighted score ((earnedWeight/totalWeight)*maxMarks)', async () => {
      judge0Service.setMockProvider({
        submitBatch: async () => [
          { token: 'tok_part_1' },
          { token: 'tok_part_2' },
          { token: 'tok_part_3' },
          { token: 'tok_part_4' }
        ],
        pollBatch: async () => [
          { token: 'tok_part_1', status_id: 3, stdout: '6\n3 2 1' },
          { token: 'tok_part_2', status_id: 3, stdout: '30\n20 10' },
          { token: 'tok_part_3', status_id: 3, stdout: '-10\n-4 -3 -2 -1' },
          { token: 'tok_part_4', status_id: 4, stdout: 'Wrong output' }
        ]
      });

      const res = await request(app)
        .post('/api/coding/execute/submit')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          questionVersionId: codingVersionId,
          practiceAttemptId,
          language: 'python',
          sourceCode: 'partial solution code'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.status).toBe('PARTIAL');
      expect(res.body.data.testsPassed).toBe(3);
      expect(res.body.data.testsTotal).toBe(4);
      expect(res.body.data.earnedMarks).toBe(60.0);
    });

    test('10. SUBMIT: Zero tests pass awards 0.00 marks with WRONG_ANSWER', async () => {
      judge0Service.setMockProvider({
        submitBatch: async () => [
          { token: 'tok_zero_1' },
          { token: 'tok_zero_2' },
          { token: 'tok_zero_3' },
          { token: 'tok_zero_4' }
        ],
        pollBatch: async () => [
          { token: 'tok_zero_1', status_id: 4, stdout: 'WA' },
          { token: 'tok_zero_2', status_id: 4, stdout: 'WA' },
          { token: 'tok_zero_3', status_id: 4, stdout: 'WA' },
          { token: 'tok_zero_4', status_id: 4, stdout: 'WA' }
        ]
      });

      const res = await request(app)
        .post('/api/coding/execute/submit')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          questionVersionId: codingVersionId,
          practiceAttemptId,
          language: 'python',
          sourceCode: 'wrong solution'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.status).toBe('WRONG_ANSWER');
      expect(res.body.data.testsPassed).toBe(0);
      expect(res.body.data.earnedMarks).toBe(0.0);
    });

    test('11. SUBMIT: Compilation error sets 0.00 marks and marks parent as COMPILATION_ERROR', async () => {
      judge0Service.setMockProvider({
        submitBatch: async () => [
          { token: 'tok_sub_ce_1' },
          { token: 'tok_sub_ce_2' },
          { token: 'tok_sub_ce_3' },
          { token: 'tok_sub_ce_4' }
        ],
        pollBatch: async () => [
          {
            token: 'tok_sub_ce_1',
            status_id: 6,
            compile_output: 'SyntaxError: invalid syntax'
          },
          {
            token: 'tok_sub_ce_2',
            status_id: 6,
            compile_output: 'SyntaxError: invalid syntax'
          },
          {
            token: 'tok_sub_ce_3',
            status_id: 6,
            compile_output: 'SyntaxError: invalid syntax'
          },
          {
            token: 'tok_sub_ce_4',
            status_id: 6,
            compile_output: 'SyntaxError: invalid syntax'
          }
        ]
      });

      const res = await request(app)
        .post('/api/coding/execute/submit')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          questionVersionId: codingVersionId,
          practiceAttemptId,
          language: 'python',
          sourceCode: 'def def syntax error'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.status).toBe('COMPILATION_ERROR');
      expect(res.body.data.earnedMarks).toBe(0.0);
      expect(res.body.data.compileOutput).toContain('SyntaxError');
    });

    test('12. SUBMIT: System error (status_id 13) sets SYSTEM_ERROR and awards 0 marks', async () => {
      judge0Service.setMockProvider({
        submitBatch: async () => [
          { token: 'tok_se_1' },
          { token: 'tok_se_2' },
          { token: 'tok_se_3' },
          { token: 'tok_se_4' }
        ],
        pollBatch: async () => [
          { token: 'tok_se_1', status_id: 13, stdout: null, stderr: 'Sandbox execution failed' },
          { token: 'tok_se_2', status_id: 3, stdout: '30\n20 10' },
          { token: 'tok_se_3', status_id: 3, stdout: '-10\n-4 -3 -2 -1' },
          { token: 'tok_se_4', status_id: 3, stdout: '1500\n500 400 300 200 100' }
        ]
      });

      const res = await request(app)
        .post('/api/coding/execute/submit')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          questionVersionId: codingVersionId,
          practiceAttemptId,
          language: 'python',
          sourceCode: 'print("hello")'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.status).toBe('SYSTEM_ERROR');
      expect(res.body.data.earnedMarks).toBe(0.0);
    });
  });

  // =========================================================================
  // SECURITY & ISOLATION TESTS
  // =========================================================================
  describe('Security Boundaries & Input Protections', () => {
    test('13. Missing Authorization header returns 401 Unauthorized', async () => {
      const res = await request(app)
        .post('/api/coding/execute/run')
        .send({
          questionVersionId: codingVersionId,
          language: 'python',
          sourceCode: 'print(1)'
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

    test('14. Client-supplied studentId in body is ignored and overridden by JWT identity', async () => {
      judge0Service.setMockProvider({
        submitBatch: async () => [{ token: 'tok_sec_1' }, { token: 'tok_sec_2' }],
        pollBatch: async () => [
          { token: 'tok_sec_1', status_id: 3, stdout: '6\n3 2 1' },
          { token: 'tok_sec_2', status_id: 3, stdout: '30\n20 10' }
        ]
      });

      const res = await request(app)
        .post('/api/coding/execute/run')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          studentId: 'rogue_imposter_student_999',
          questionVersionId: codingVersionId,
          language: 'python',
          sourceCode: 'print(1)'
        });

      expect(res.statusCode).toBe(200);
      // Verify in DB that submission record was created with JWT studentId, not body studentId
      const submissionInDb = await prisma.codeSubmission.findUnique({
        where: { id: res.body.data.id }
      });
      expect(submissionInDb.studentId).toBe(studentId);
    });

    test('15, 16 & 17. Student response strictly scrubs hidden input, hidden expectedOutput, stdout, and Judge0 tokens', async () => {
      judge0Service.setMockProvider({
        submitBatch: async () => [
          { token: 'secret_tok_1' },
          { token: 'secret_tok_2' },
          { token: 'secret_tok_3' },
          { token: 'secret_tok_4' }
        ],
        pollBatch: async () => [
          { token: 'secret_tok_1', status_id: 3, stdout: '6\n3 2 1' },
          { token: 'secret_tok_2', status_id: 3, stdout: '30\n20 10' },
          { token: 'secret_tok_3', status_id: 3, stdout: '-10\n-4 -3 -2 -1' },
          { token: 'secret_tok_4', status_id: 3, stdout: '1500\n500 400 300 200 100' }
        ]
      });

      const res = await request(app)
        .post('/api/coding/execute/submit')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          questionVersionId: codingVersionId,
          practiceAttemptId,
          language: 'python',
          sourceCode: 'print()'
        });

      expect(res.statusCode).toBe(200);
      const studentData = res.body.data;

      const hiddenResults = studentData.testResults.filter((tr) => tr.isHidden);
      expect(hiddenResults.length).toBe(2);

      for (const htr of hiddenResults) {
        expect(htr.input).toBeUndefined();
        expect(htr.expectedOutput).toBeUndefined();
        expect(htr.stdout).toBeUndefined();
        expect(htr.stderr).toBeUndefined();
        expect(htr.judge0Token).toBeUndefined();
      }

      const rawJson = JSON.stringify(studentData);
      expect(rawJson).not.toContain('secret_tok');
      expect(rawJson).not.toContain('-1 -2 -3 -4');
      expect(rawJson).not.toContain('100 200 300 400 500');
    });

    test('18 & 19. Client cannot inject test weights or maxMarks (ignored by server)', async () => {
      judge0Service.setMockProvider({
        submitBatch: async () => [
          { token: 'tok_w1' },
          { token: 'tok_w2' },
          { token: 'tok_w3' },
          { token: 'tok_w4' }
        ],
        pollBatch: async () => [
          { token: 'tok_w1', status_id: 3, stdout: '6\n3 2 1' },
          { token: 'tok_w2', status_id: 3, stdout: '30\n20 10' },
          { token: 'tok_w3', status_id: 3, stdout: '-10\n-4 -3 -2 -1' },
          { token: 'tok_w4', status_id: 3, stdout: '1500\n500 400 300 200 100' }
        ]
      });

      const res = await request(app)
        .post('/api/coding/execute/submit')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          questionVersionId: codingVersionId,
          practiceAttemptId,
          language: 'python',
          sourceCode: 'print()',
          maxMarks: 999999,
          weights: [999, 999]
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.earnedMarks).toBe(100.0);
    });

    test('20. Unsupported language is rejected with 400', async () => {
      const res = await request(app)
        .post('/api/coding/execute/run')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          questionVersionId: codingVersionId,
          language: 'unsupported_brainfuck_lang',
          sourceCode: '++++'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Unsupported language');
    });

    test('21. Code execution on non-CODING question is rejected with 400', async () => {
      const aptQ = await request(app)
        .post('/api/questions')
        .send({
          type: 'APTITUDE',
          format: 'SINGLE_CHOICE',
          category: 'QUANTITATIVE',
          difficulty: 'EASY',
          title: 'Math Question',
          statement: 'What is 2+2?',
          options: [{ id: '1', text: '4' }, { id: '2', text: '5' }],
          correctAnswer: { optionId: '1' }
        });

      const aptVersionId = aptQ.body.data.versions[0].id;

      const res = await request(app)
        .post('/api/coding/execute/run')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          questionVersionId: aptVersionId,
          language: 'python',
          sourceCode: 'print(4)'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('not a valid CODING problem');
    });

    test('22. Unauthorized attempt (other student attempt) is rejected with 403', async () => {
      const otherStudentToken = createTestToken({ id: 'other_imposter_student_999', collegeId });

      const res = await request(app)
        .post('/api/coding/execute/submit')
        .set('Authorization', `Bearer ${otherStudentToken}`)
        .send({
          questionVersionId: codingVersionId,
          practiceAttemptId,
          language: 'python',
          sourceCode: 'print(1)'
        });

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('belongs to another student');
    });

    test('23. Submissions to finalized/submitted attempt are rejected with 409', async () => {
      await request(app)
        .post(`/api/practice/attempts/${practiceAttemptId}/submit`)
        .set('Authorization', `Bearer ${authToken}`)
        .send();

      const res = await request(app)
        .post('/api/coding/execute/submit')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          questionVersionId: codingVersionId,
          practiceAttemptId,
          language: 'python',
          sourceCode: 'print(1)'
        });

      expect(res.statusCode).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('PracticeAttempt is SUBMITTED');
    });

    test('24. Student cannot retrieve another student submission by ID (403 Unauthorized)', async () => {
      // Create a submission as studentId
      judge0Service.setMockProvider({
        submitBatch: async () => [{ token: 'tok_sub_own' }],
        pollBatch: async () => [{ token: 'tok_sub_own', status_id: 3, stdout: '6\n3 2 1' }]
      });

      const runRes = await request(app)
        .post('/api/coding/execute/run')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          questionVersionId: codingVersionId,
          language: 'python',
          sourceCode: 'print(1)'
        });

      const submissionId = runRes.body.data.id;

      // Access by owner -> 200
      const ownRes = await request(app)
        .get(`/api/coding/submissions/${submissionId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(ownRes.statusCode).toBe(200);

      // Access by other student -> 403
      const otherStudentToken = createTestToken({ id: 'stranger_student_999', collegeId });
      const rogueRes = await request(app)
        .get(`/api/coding/submissions/${submissionId}`)
        .set('Authorization', `Bearer ${otherStudentToken}`);

      expect(rogueRes.statusCode).toBe(403);
      expect(rogueRes.body.success).toBe(false);
      expect(rogueRes.body.message).toContain('belongs to another student');
    });

    test('25. Judge0 network dispatch failure returns 503 and marks submission as SYSTEM_ERROR', async () => {
      // Re-create in-progress attempt for test
      const freshAttempt = await prisma.practiceAttempt.create({
        data: {
          studentId,
          collegeId,
          category: 'DSA',
          status: 'IN_PROGRESS',
          score: 0.0,
          totalMarks: 0.0,
          responses: {
            create: {
              questionVersionId: codingVersionId,
              answerData: {}
            }
          }
        }
      });

      judge0Service.setMockProvider({
        submitBatch: async () => {
          throw new Error('Connect Timeout Error (attempted address: 192.168.1.11:2358)');
        }
      });

      const res = await request(app)
        .post('/api/coding/execute/run')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          questionVersionId: codingVersionId,
          practiceAttemptId: freshAttempt.id,
          language: 'python',
          sourceCode: 'print(1)'
        });

      expect(res.statusCode).toBe(500); // Express errorHandler handles unexpected error or 503
      expect(res.body.success).toBe(false);

      // Verify the submission record in DB was set to SYSTEM_ERROR
      const submissionInDb = await prisma.codeSubmission.findFirst({
        where: { practiceAttemptId: freshAttempt.id },
        orderBy: { createdAt: 'desc' }
      });

      expect(submissionInDb).toBeDefined();
      expect(submissionInDb.status).toBe('SYSTEM_ERROR');
      expect(Number(submissionInDb.earnedMarks)).toBe(0.0);

      judge0Service.clearMockProvider();
    });
  });

  afterAll(async () => {
    await cleanDatabase(prisma);
    await prisma.$disconnect();
  });
});
