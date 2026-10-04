const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/utils/prisma');

const { cleanDatabase } = require('./testHelper');

describe('Coding Problem & Test Case Management APIs', () => {
  let codingQuestionId;
  let codingVersionId;
  let aptitudeVersionId;
  let codingProblemId;

  beforeAll(async () => {
    await cleanDatabase(prisma);

    // 1. Create a CODING question
    const codingQ = await request(app)
      .post('/api/questions')
      .send({
        type: 'CODING',
        format: 'CODING',
        category: 'DSA',
        subcategory: 'ARRAYS',
        difficulty: 'EASY',
        sourceType: 'CURATED',
        title: 'Two Sum Problem',
        statement: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.'
      });
    codingQuestionId = codingQ.body.data.id;
    codingVersionId = codingQ.body.data.versions[0].id;

    // 2. Create an APTITUDE question
    const aptitudeQ = await request(app)
      .post('/api/questions')
      .send({
        type: 'APTITUDE',
        format: 'SINGLE_CHOICE',
        category: 'LOGICAL_REASONING',
        difficulty: 'EASY',
        sourceType: 'CURATED',
        title: 'Logical Syllogism',
        statement: 'All cats are animals. Some animals are black.',
        options: [
          { id: 'opt_1', text: 'Some cats are black' },
          { id: 'opt_2', text: 'All animals are cats' }
        ],
        correctAnswer: { optionId: 'opt_1' }
      });
    aptitudeVersionId = aptitudeQ.body.data.versions[0].id;
  });

  afterAll(async () => {
    await cleanDatabase(prisma);
    await prisma.$disconnect();
  });

  test('13. CodingProblem can be created for CODING QuestionVersion', async () => {
    const payload = {
      inputFormat: 'Line 1: N integers. Line 2: target integer.',
      outputFormat: 'Two space-separated indices.',
      constraints: '2 <= nums.length <= 10^4',
      timeLimitMs: 2000,
      memoryLimitKb: 256000,
      maxMarks: 100.0
    };

    const res = await request(app)
      .post(`/api/question-versions/${codingVersionId}/coding-problem`)
      .send(payload);

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.questionVersionId).toBe(codingVersionId);
    expect(res.body.data.timeLimitMs).toBe(2000);

    codingProblemId = res.body.data.id;
  });

  test('14 & 15. CodingProblem rejected for APTITUDE and TECHNICAL question types', async () => {
    const res = await request(app)
      .post(`/api/question-versions/${aptitudeVersionId}/coding-problem`)
      .send({
        timeLimitMs: 1000,
        maxMarks: 10
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain("only allowed for CODING questions");
  });

  test('16. Duplicate CodingProblem on same QuestionVersion is rejected', async () => {
    const res = await request(app)
      .post(`/api/question-versions/${codingVersionId}/coding-problem`)
      .send({
        timeLimitMs: 1500,
        maxMarks: 50
      });

    expect(res.statusCode).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain("already exists");
  });

  test('17. Test case creation and validation works (public and hidden)', async () => {
    // 1. Create public sample test case
    const publicTcRes = await request(app)
      .post(`/api/coding-problems/${codingProblemId}/test-cases`)
      .send({
        input: '2 7 11 15\n9',
        expectedOutput: '0 1',
        weight: 20.0,
        isHidden: false,
        order: 1
      });

    expect(publicTcRes.statusCode).toBe(201);
    expect(publicTcRes.body.data.isHidden).toBe(false);

    // 2. Create hidden test case
    const hiddenTcRes = await request(app)
      .post(`/api/coding-problems/${codingProblemId}/test-cases`)
      .send({
        input: '3 2 4\n6',
        expectedOutput: '1 2',
        weight: 80.0,
        isHidden: true,
        order: 2
      });

    expect(hiddenTcRes.statusCode).toBe(201);
    expect(hiddenTcRes.body.data.isHidden).toBe(true);

    // 3. Test case validation: reject empty input / expected output
    const invalidTcRes = await request(app)
      .post(`/api/coding-problems/${codingProblemId}/test-cases`)
      .send({
        input: '',
        weight: -5
      });

    expect(invalidTcRes.statusCode).toBe(400);

    // 4. Retrieve all test cases via admin endpoint
    const listRes = await request(app).get(`/api/coding-problems/${codingProblemId}/test-cases`);
    expect(listRes.statusCode).toBe(200);
    expect(listRes.body.data).toHaveLength(2);
  });
});
