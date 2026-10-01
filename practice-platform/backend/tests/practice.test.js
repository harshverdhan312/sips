const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/utils/prisma');
const { cleanDatabase } = require('./testHelper');

describe('Practice Session, Delivery, Responses & Scoring Engine', () => {
  let q1Id, q1v1Id;
  let q2Id, q2v1Id, q2v2Id;
  let codingQId, codingV1Id, codingProbId;
  let unrelatedQId, unrelatedV1Id;
  let attemptId;

  beforeAll(async () => {
    await cleanDatabase(prisma);
    // 1. Create Question 1 (Aptitude MCQ)
    const q1 = await request(app)
      .post('/api/questions')
      .send({
        type: 'APTITUDE',
        format: 'SINGLE_CHOICE',
        category: 'QUANTITATIVE',
        difficulty: 'EASY',
        title: 'Work and Time Q1',
        statement: 'A can do a work in 10 days, B in 15 days. How many days together?',
        options: [
          { id: 'opt_6', text: '6 days' },
          { id: 'opt_8', text: '8 days' },
          { id: 'opt_12', text: '12 days' }
        ],
        correctAnswer: { optionId: 'opt_6' },
        explanation: '1/10 + 1/15 = 1/6, so 6 days.'
      });
    q1Id = q1.body.data.id;
    q1v1Id = q1.body.data.versions[0].id;

    // 2. Create Question 2 (Technical True/False)
    const q2 = await request(app)
      .post('/api/questions')
      .send({
        type: 'TECHNICAL',
        format: 'TRUE_FALSE',
        category: 'DBMS',
        difficulty: 'EASY',
        title: 'ACID Atomicity Q2',
        statement: 'Atomicity ensures that all operations within a transaction complete successfully or none do.',
        correctAnswer: { value: true },
        explanation: 'Atomicity is the all-or-nothing property of database transactions.'
      });
    q2Id = q2.body.data.id;
    q2v1Id = q2.body.data.versions[0].id;

    // 3. Create Coding Question with public and hidden test cases
    const codingQ = await request(app)
      .post('/api/questions')
      .send({
        type: 'CODING',
        format: 'CODING',
        category: 'DSA',
        difficulty: 'EASY',
        title: 'Reverse String Coding Problem',
        statement: 'Write a function that reverses an input string.'
      });
    codingQId = codingQ.body.data.id;
    codingV1Id = codingQ.body.data.versions[0].id;

    const cpRes = await request(app)
      .post(`/api/question-versions/${codingV1Id}/coding-problem`)
      .send({
        inputFormat: 'Single string S',
        outputFormat: 'Reversed string S',
        maxMarks: 10.0
      });
    codingProbId = cpRes.body.data.id;

    // Add public test case
    await request(app)
      .post(`/api/coding-problems/${codingProbId}/test-cases`)
      .send({
        input: 'hello',
        expectedOutput: 'olleh',
        weight: 3.0,
        isHidden: false,
        order: 1
      });

    // Add hidden test case
    await request(app)
      .post(`/api/coding-problems/${codingProbId}/test-cases`)
      .send({
        input: 'supersecret_hidden_input_data_12345',
        expectedOutput: '54321_atad_tupni_neddih_tercesrepus',
        weight: 7.0,
        isHidden: true,
        order: 2
      });

    // 4. Create an unrelated question not delivered in the student attempt
    const unrelatedQ = await request(app)
      .post('/api/questions')
      .send({
        type: 'APTITUDE',
        format: 'SINGLE_CHOICE',
        category: 'VERBAL',
        difficulty: 'HARD',
        title: 'Unrelated Vocab Question',
        statement: 'Choose the antonym of Ephemeral.',
        options: [
          { id: 'opt_perm', text: 'Permanent' },
          { id: 'opt_trans', text: 'Transient' }
        ],
        correctAnswer: { optionId: 'opt_perm' }
      });
    unrelatedQId = unrelatedQ.body.data.id;
    unrelatedV1Id = unrelatedQ.body.data.versions[0].id;
  });

  afterAll(async () => {
    await cleanDatabase(prisma);
    await prisma.$disconnect();
  });

  test('18. Practice attempt can be created with selected question count', async () => {
    const res = await request(app)
      .post('/api/practice/attempts')
      .send({
        studentId: 'student_harsh_001',
        collegeId: 'college_rvce_01',
        type: 'APTITUDE',
        category: 'QUANTITATIVE',
        questionCount: 5
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.attemptId).toBeDefined();
    expect(res.body.data.status).toBe('IN_PROGRESS');
    expect(res.body.data.questionCount).toBe(1);

    attemptId = res.body.data.attemptId;
  });

  test('19 & 20. Practice questions can be retrieved and only questions belonging to attempt are returned', async () => {
    const res = await request(app).get(`/api/practice/attempts/${attemptId}/questions`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.questions).toBeDefined();
    expect(res.body.data.questions.length).toBeGreaterThanOrEqual(1);

    const questionVersionIds = res.body.data.questions.map((q) => q.id);
    expect(questionVersionIds).toContain(q1v1Id);
    expect(questionVersionIds).not.toContain(unrelatedV1Id);
  });

  test('9, 10, 11 & 12. Security checks: Student delivery excludes correctAnswer, answer keys, and hidden test cases', async () => {
    // Create an attempt that includes the coding question and MCQ questions
    const mixedAttemptRes = await request(app)
      .post('/api/practice/attempts')
      .send({
        studentId: 'student_audit_sec',
        collegeId: 'college_rvce_01',
        questionCount: 10
      });

    const mixedAttemptId = mixedAttemptRes.body.data.attemptId;
    const questionsRes = await request(app).get(`/api/practice/attempts/${mixedAttemptId}/questions`);

    expect(questionsRes.statusCode).toBe(200);
    const questions = questionsRes.body.data.questions;

    // Verify MCQ security
    for (const q of questions) {
      expect(q.correctAnswer).toBeUndefined();
      expect(q.answerKey).toBeUndefined();
      expect(q.explanation).toBeUndefined();
    }

    // Verify Coding Question security
    const codingDelivered = questions.find((q) => q.id === codingV1Id);
    expect(codingDelivered).toBeDefined();
    expect(codingDelivered.codingProblem).toBeDefined();
    expect(codingDelivered.codingProblem.testCases).toHaveLength(1); // Only public test case
    expect(codingDelivered.codingProblem.testCases[0].isHidden).toBe(false);
    expect(codingDelivered.codingProblem.testCases[0].input).toBe('hello');

    // Confirm hidden test case data is completely absent
    const rawJson = JSON.stringify(questions);
    expect(rawJson).not.toContain('supersecret_hidden_input_data_12345');
    expect(rawJson).not.toContain('54321_atad_tupni_neddih_tercesrepus');
  });

  test('21. Valid response can be submitted for a delivered question in the attempt', async () => {
    const res = await request(app)
      .post(`/api/practice/attempts/${attemptId}/responses`)
      .send({
        questionVersionId: q1v1Id,
        answerData: { optionId: 'opt_6' }
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.saved).toBe(true);
  });

  test('27. Response for an unrelated question not in the attempt is rejected with 404', async () => {
    const res = await request(app)
      .post(`/api/practice/attempts/${attemptId}/responses`)
      .send({
        questionVersionId: unrelatedV1Id,
        answerData: { optionId: 'opt_perm' }
      });

    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('does not belong to this practice attempt');
  });

  test('22, 23 & 24. Practice attempt submission transactionally evaluates and calculates final score', async () => {
    // Attempt currently has q1v1 answered correctly ({ optionId: 'opt_6' })
    const submitRes = await request(app)
      .post(`/api/practice/attempts/${attemptId}/submit`)
      .send();

    expect(submitRes.statusCode).toBe(200);
    expect(submitRes.body.success).toBe(true);
    expect(submitRes.body.data.status).toBe('SUBMITTED');
    expect(submitRes.body.data.score).toBe(1.0); // 1 point for q1v1
    expect(submitRes.body.data.submittedAt).toBeDefined();

    // Verify detailed results endpoint
    const resultRes = await request(app).get(`/api/practice/attempts/${attemptId}/result`);
    expect(resultRes.statusCode).toBe(200);
    expect(resultRes.body.data.status).toBe('SUBMITTED');
    expect(resultRes.body.data.score).toBe(1.0);
    expect(resultRes.body.data.breakdown).toBeDefined();

    const q1Result = resultRes.body.data.breakdown.find((b) => b.questionVersionId === q1v1Id);
    expect(q1Result).toBeDefined();
    expect(q1Result.isCorrect).toBe(true);
    expect(q1Result.marksAwarded).toBe(1.0);
    expect(q1Result.explanation).toContain('6 days');
  });

  test('25. Duplicate submission of an already submitted attempt is rejected with 409', async () => {
    const res = await request(app)
      .post(`/api/practice/attempts/${attemptId}/submit`)
      .send();

    expect(res.statusCode).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('already been finalized');
  });

  test('26. Response submission after attempt is submitted is rejected with 409', async () => {
    const res = await request(app)
      .post(`/api/practice/attempts/${attemptId}/responses`)
      .send({
        questionVersionId: q1v1Id,
        answerData: { optionId: 'opt_8' }
      });

    expect(res.statusCode).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Cannot submit response');
  });

  test('28. Historical QuestionVersion remains unchanged even after Question receives Version 2', async () => {
    // 1. Create attempt with Question 2 Version 1
    const attempt2Res = await request(app)
      .post('/api/practice/attempts')
      .send({
        studentId: 'student_version_test',
        collegeId: 'college_rvce_01',
        type: 'TECHNICAL',
        questionCount: 10
      });

    const attempt2Id = attempt2Res.body.data.attemptId;

    // 2. Student submits true for Q2 v1
    await request(app)
      .post(`/api/practice/attempts/${attempt2Id}/responses`)
      .send({
        questionVersionId: q2v1Id,
        answerData: { value: true }
      });

    // 3. Submit attempt 2
    await request(app).post(`/api/practice/attempts/${attempt2Id}/submit`).send();

    // 4. Later, an admin creates Version 2 for Question 2 with different answer
    const v2Res = await request(app)
      .post(`/api/questions/${q2Id}/versions`)
      .send({
        title: 'ACID Atomicity Q2 (Advanced Revision)',
        statement: 'Atomicity in NoSQL databases is always globally enforced across all distributed partitions.',
        correctAnswer: { value: false },
        explanation: 'Distributed NoSQL databases often favor eventual consistency over global ACID atomicity.'
      });
    q2v2Id = v2Res.body.data.id;

    // 5. Verify that attempt 2 still retains historical QuestionVersion 1 and its original score
    const resultRes = await request(app).get(`/api/practice/attempts/${attempt2Id}/result`);
    expect(resultRes.statusCode).toBe(200);

    const q2Result = resultRes.body.data.breakdown.find((b) => b.questionVersionId === q2v1Id);
    expect(q2Result).toBeDefined();
    expect(q2Result.questionVersionId).toBe(q2v1Id);
    expect(q2Result.isCorrect).toBe(true);
    expect(q2Result.explanation).toContain('all-or-nothing property');
  });
});
