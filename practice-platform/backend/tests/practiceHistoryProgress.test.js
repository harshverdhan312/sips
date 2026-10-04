const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/utils/prisma');
const { cleanDatabase, createTestToken } = require('./testHelper');

describe('Practice History, Progress Analytics & Streaks Engine (Phase 6C.5)', () => {
  const studentAlice = 'student_alice_001';
  const studentBob = 'student_bob_002';
  const collegeId = 'college_rvce_01';

  let tokenAlice, tokenBob;
  let qAptId, qAptV1Id;
  let qTechId, qTechV1Id;
  let qCodingId, qCodingV1Id;

  beforeAll(async () => {
    await cleanDatabase(prisma);
    tokenAlice = createTestToken({ id: studentAlice, collegeId });
    tokenBob = createTestToken({ id: studentBob, collegeId });

    // 1. Create Aptitude Question (Quant)
    const aptQ = await request(app)
      .post('/api/questions')
      .send({
        type: 'APTITUDE',
        format: 'SINGLE_CHOICE',
        category: 'QUANTITATIVE',
        subcategory: 'Time & Work',
        difficulty: 'EASY',
        title: 'Work Rate Question',
        statement: 'Pipe A fills in 10h, Pipe B in 15h. Together?',
        options: [{ id: 'opt_1', text: '6h' }, { id: 'opt_2', text: '8h' }],
        correctAnswer: { optionId: 'opt_1' }
      });
    qAptId = aptQ.body.data.id;
    qAptV1Id = aptQ.body.data.versions[0].id;

    // 2. Create Technical Question (DSA)
    const techQ = await request(app)
      .post('/api/questions')
      .send({
        type: 'TECHNICAL',
        format: 'SINGLE_CHOICE',
        category: 'DSA',
        subcategory: 'Stacks',
        difficulty: 'MEDIUM',
        title: 'Stack Balancing Question',
        statement: 'Which structure is LIFO?',
        options: [{ id: 'opt_a', text: 'Stack' }, { id: 'opt_b', text: 'Queue' }],
        correctAnswer: { optionId: 'opt_a' }
      });
    qTechId = techQ.body.data.id;
    qTechV1Id = techQ.body.data.versions[0].id;

    // 3. Create Coding Question
    const codingQ = await request(app)
      .post('/api/questions')
      .send({
        type: 'CODING',
        format: 'CODING',
        category: 'DSA',
        subcategory: 'Arrays',
        difficulty: 'EASY',
        title: 'Array Sum Coding Challenge',
        statement: 'Compute sum of array elements.'
      });
    qCodingId = codingQ.body.data.id;
    qCodingV1Id = codingQ.body.data.versions[0].id;

    await request(app)
      .post(`/api/question-versions/${qCodingV1Id}/coding-problem`)
      .send({
        inputFormat: 'N integers',
        outputFormat: 'Sum',
        maxMarks: 100.0
      });
  });

  afterAll(async () => {
    await cleanDatabase(prisma);
    await prisma.$disconnect();
  });

  // =========================================================================
  // 1. PRACTICE HISTORY TESTS
  // =========================================================================
  describe('1. Practice History API (GET /api/practice/history)', () => {
    let aliceAttempt1Id, aliceAttempt2Id, bobAttemptId;

    beforeAll(async () => {
      // Alice completed Aptitude Attempt
      const att1 = await request(app)
        .post('/api/practice/attempts')
        .set('Authorization', `Bearer ${tokenAlice}`)
        .send({ type: 'APTITUDE', category: 'QUANTITATIVE', questionCount: 1 });
      aliceAttempt1Id = att1.body.data.attemptId;

      await request(app)
        .post(`/api/practice/attempts/${aliceAttempt1Id}/responses`)
        .set('Authorization', `Bearer ${tokenAlice}`)
        .send({ questionVersionId: qAptV1Id, answerData: { optionId: 'opt_1' } });

      await request(app)
        .post(`/api/practice/attempts/${aliceAttempt1Id}/submit`)
        .set('Authorization', `Bearer ${tokenAlice}`);

      // Alice In-Progress Technical Attempt
      const att2 = await request(app)
        .post('/api/practice/attempts')
        .set('Authorization', `Bearer ${tokenAlice}`)
        .send({ type: 'TECHNICAL', category: 'DSA', questionCount: 1 });
      aliceAttempt2Id = att2.body.data.attemptId;

      // Bob completed Technical Attempt
      const attBob = await request(app)
        .post('/api/practice/attempts')
        .set('Authorization', `Bearer ${tokenBob}`)
        .send({ type: 'TECHNICAL', category: 'DSA', questionCount: 1 });
      bobAttemptId = attBob.body.data.attemptId;

      await request(app)
        .post(`/api/practice/attempts/${bobAttemptId}/responses`)
        .set('Authorization', `Bearer ${tokenBob}`)
        .send({ questionVersionId: qTechV1Id, answerData: { optionId: 'opt_a' } });

      await request(app)
        .post(`/api/practice/attempts/${bobAttemptId}/submit`)
        .set('Authorization', `Bearer ${tokenBob}`);
    });

    test('Alice receives only her own practice history', async () => {
      const res = await request(app)
        .get('/api/practice/history')
        .set('Authorization', `Bearer ${tokenAlice}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.attempts).toBeDefined();

      const attemptIds = res.body.data.attempts.map((a) => a.attemptId);
      expect(attemptIds).toContain(aliceAttempt1Id);
      expect(attemptIds).toContain(aliceAttempt2Id);
      expect(attemptIds).not.toContain(bobAttemptId);
    });

    test('Status filtering allows querying only SUBMITTED attempts', async () => {
      const res = await request(app)
        .get('/api/practice/history?status=SUBMITTED')
        .set('Authorization', `Bearer ${tokenAlice}`);

      expect(res.statusCode).toBe(200);
      const attemptIds = res.body.data.attempts.map((a) => a.attemptId);
      expect(attemptIds).toContain(aliceAttempt1Id);
      expect(attemptIds).not.toContain(aliceAttempt2Id);
    });

    test('Category filtering works accurately', async () => {
      const res = await request(app)
        .get('/api/practice/history?category=QUANTITATIVE')
        .set('Authorization', `Bearer ${tokenAlice}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.attempts.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data.attempts.every((a) => a.category.includes('QUANTITATIVE'))).toBe(true);
    });

    test('Pagination returns correct limits and metadata', async () => {
      const res = await request(app)
        .get('/api/practice/history?page=1&limit=1')
        .set('Authorization', `Bearer ${tokenAlice}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.attempts).toHaveLength(1);
      expect(res.body.data.pagination.page).toBe(1);
      expect(res.body.data.pagination.limit).toBe(1);
      expect(res.body.data.pagination.total).toBeGreaterThanOrEqual(2);
    });

    test('Unauthenticated history request returns 401', async () => {
      const res = await request(app).get('/api/practice/history');
      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  // =========================================================================
  // 2. PRACTICE RESULT ACCESS CONTROL
  // =========================================================================
  describe('2. Practice Result Ownership Isolation (GET /api/practice/attempts/:id/result)', () => {
    let aliceSubmittedAttemptId;

    beforeAll(async () => {
      const att = await request(app)
        .post('/api/practice/attempts')
        .set('Authorization', `Bearer ${tokenAlice}`)
        .send({ type: 'APTITUDE', category: 'QUANTITATIVE', questionCount: 1 });
      aliceSubmittedAttemptId = att.body.data.attemptId;

      await request(app)
        .post(`/api/practice/attempts/${aliceSubmittedAttemptId}/responses`)
        .set('Authorization', `Bearer ${tokenAlice}`)
        .send({ questionVersionId: qAptV1Id, answerData: { optionId: 'opt_1' } });

      await request(app)
        .post(`/api/practice/attempts/${aliceSubmittedAttemptId}/submit`)
        .set('Authorization', `Bearer ${tokenAlice}`);
    });

    test('Alice can view her own result', async () => {
      const res = await request(app)
        .get(`/api/practice/attempts/${aliceSubmittedAttemptId}/result`)
        .set('Authorization', `Bearer ${tokenAlice}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.studentId).toBe(studentAlice);
      expect(res.body.data.score).toBe(1.0);
      expect(res.body.data.percentage).toBe(100);
    });

    test('Bob is rejected with 403 when trying to access Alice result', async () => {
      const res = await request(app)
        .get(`/api/practice/attempts/${aliceSubmittedAttemptId}/result`)
        .set('Authorization', `Bearer ${tokenBob}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('belongs to another student');
    });
  });

  // =========================================================================
  // 3. PROGRESS SUMMARY TESTS
  // =========================================================================
  describe('3. Progress Summary API (GET /api/practice/progress)', () => {
    const studentCharlie = 'student_charlie_progress';
    let tokenCharlie;

    beforeAll(async () => {
      tokenCharlie = createTestToken({ id: studentCharlie, collegeId });

      // Create 1 completed Aptitude attempt (1 question, correct)
      const att1 = await request(app)
        .post('/api/practice/attempts')
        .set('Authorization', `Bearer ${tokenCharlie}`)
        .send({ type: 'APTITUDE', category: 'QUANTITATIVE', questionCount: 1 });
      const att1Id = att1.body.data.attemptId;

      await request(app)
        .post(`/api/practice/attempts/${att1Id}/responses`)
        .set('Authorization', `Bearer ${tokenCharlie}`)
        .send({ questionVersionId: qAptV1Id, answerData: { optionId: 'opt_1' } });

      await request(app)
        .post(`/api/practice/attempts/${att1Id}/submit`)
        .set('Authorization', `Bearer ${tokenCharlie}`);

      // Create 1 in-progress attempt (should be excluded from completed score)
      await request(app)
        .post('/api/practice/attempts')
        .set('Authorization', `Bearer ${tokenCharlie}`)
        .send({ type: 'TECHNICAL', category: 'DSA', questionCount: 1 });
    });

    test('Progress calculates overall stats, categories breakdown, and in-progress count accurately', async () => {
      const res = await request(app)
        .get('/api/practice/progress')
        .set('Authorization', `Bearer ${tokenCharlie}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);

      const data = res.body.data;
      expect(data.overall.attempts).toBe(1);
      expect(data.overall.inProgressAttempts).toBe(1);
      expect(data.overall.questionsAttempted).toBe(1);
      expect(data.overall.questionsCorrect).toBe(1);
      expect(data.overall.accuracy).toBe(100.0);
      expect(data.overall.averagePercentage).toBe(100.0);

      expect(data.categories.APTITUDE.attempts).toBe(1);
      expect(data.categories.APTITUDE.questionsAttempted).toBe(1);
      expect(data.categories.APTITUDE.questionsCorrect).toBe(1);
      expect(data.categories.APTITUDE.accuracy).toBe(100.0);

      expect(data.recentActivity).toHaveLength(1);
      expect(data.topics.length).toBeGreaterThanOrEqual(1);
    });

    test('Empty student returns zero-safe statistics without division errors', async () => {
      const tokenEmpty = createTestToken({ id: 'student_brand_new_zero', collegeId });
      const res = await request(app)
        .get('/api/practice/progress')
        .set('Authorization', `Bearer ${tokenEmpty}`);

      expect(res.statusCode).toBe(200);
      const data = res.body.data;
      expect(data.overall.attempts).toBe(0);
      expect(data.overall.questionsAttempted).toBe(0);
      expect(data.overall.questionsCorrect).toBe(0);
      expect(data.overall.accuracy).toBe(0.0);
      expect(data.overall.averagePercentage).toBe(0.0);
      expect(data.recentActivity).toHaveLength(0);
    });
  });

  // =========================================================================
  // 4. STREAK ENGINE TESTS
  // =========================================================================
  describe('4. Streak Calculation Engine (GET /api/practice/streak)', () => {
    test('Student with no activity returns 0 streaks and activeToday=false', async () => {
      const tokenNew = createTestToken({ id: 'student_no_streak_yet', collegeId });
      const res = await request(app)
        .get('/api/practice/streak')
        .set('Authorization', `Bearer ${tokenNew}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.currentStreak).toBe(0);
      expect(res.body.data.longestStreak).toBe(0);
      expect(res.body.data.activeToday).toBe(false);
      expect(res.body.data.lastPracticeDate).toBeNull();
    });

    test('Submitting attempt today makes activeToday=true and sets currentStreak=1', async () => {
      const tokenToday = createTestToken({ id: 'student_today_active', collegeId });
      const att = await request(app)
        .post('/api/practice/attempts')
        .set('Authorization', `Bearer ${tokenToday}`)
        .send({ type: 'APTITUDE', category: 'QUANTITATIVE', questionCount: 1 });
      const attId = att.body.data.attemptId;

      await request(app)
        .post(`/api/practice/attempts/${attId}/submit`)
        .set('Authorization', `Bearer ${tokenToday}`);

      const res = await request(app)
        .get('/api/practice/streak')
        .set('Authorization', `Bearer ${tokenToday}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.activeToday).toBe(true);
      expect(res.body.data.currentStreak).toBe(1);
      expect(res.body.data.longestStreak).toBe(1);
      expect(res.body.data.lastPracticeDate).toBeDefined();
    });

    test('Multiple attempts on same day are deduplicated to 1 active day', async () => {
      const tokenMulti = createTestToken({ id: 'student_multi_same_day', collegeId });

      for (let i = 0; i < 3; i++) {
        const att = await request(app)
          .post('/api/practice/attempts')
          .set('Authorization', `Bearer ${tokenMulti}`)
          .send({ type: 'APTITUDE', category: 'QUANTITATIVE', questionCount: 1 });
        await request(app)
          .post(`/api/practice/attempts/${att.body.data.attemptId}/submit`)
          .set('Authorization', `Bearer ${tokenMulti}`);
      }

      const res = await request(app)
        .get('/api/practice/streak')
        .set('Authorization', `Bearer ${tokenMulti}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.activeToday).toBe(true);
      expect(res.body.data.currentStreak).toBe(1); // 1 day, not 3
    });
  });
});
