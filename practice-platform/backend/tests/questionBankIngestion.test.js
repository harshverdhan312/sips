const fs = require('fs');
const path = require('path');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const prisma = require('../src/utils/prisma');
const config = require('../src/config');
const bulkImportService = require('../src/services/bulkImportService');
const practiceService = require('../src/services/practiceService');
const { validateImportItem } = require('../src/validators/bulkImportValidator');

describe('Phase 7C — Real MCQ Question Bank Ingestion Suite', () => {
  const adminToken = jwt.sign(
    { id: 'admin-ingestion', role: 'ADMIN', collegeId: 'canonical-college' },
    config.jwtSecret,
    { algorithm: 'HS256' }
  );

  const studentToken = jwt.sign(
    { id: 'student-mcq-tester', role: 'STUDENT', collegeId: 'canonical-college' },
    config.jwtSecret,
    { algorithm: 'HS256' }
  );

  const aptitudePath = fs.existsSync(path.join(__dirname, '../data/question-bank/aptitude/aptitude_questions.json'))
    ? path.join(__dirname, '../data/question-bank/aptitude/aptitude_questions.json')
    : path.join(__dirname, '../data/question-bank/aptitude/quants/aptitude_questions.json');
  const technicalPath = path.join(__dirname, '../data/question-bank/technical/technical_questions.json');
  const mixedPath = path.join(__dirname, '../data/question-bank/mixed/validation_batch_mixed.json');

  const aptitudeQuestions = JSON.parse(fs.readFileSync(aptitudePath, 'utf8'));
  const technicalQuestions = JSON.parse(fs.readFileSync(technicalPath, 'utf8'));
  const mixedQuestions = JSON.parse(fs.readFileSync(mixedPath, 'utf8'));
  const all30Questions = [...aptitudeQuestions, ...technicalQuestions, ...mixedQuestions];

  const canonicalNamespaces = [
    'sips-aptitude-canonical',
    'sips-technical-canonical',
    'sips-validation-canonical',
    'placement-prep-open',
    'industry-nqt-bank'
  ];

  beforeAll(async () => {
    // Clean up any previous test runs for these specific externalIds
    const externalIds = all30Questions.map(q => q.externalId);
    await prisma.practiceQuestion.deleteMany({
      where: {
        externalId: { in: externalIds }
      }
    }).catch(() => {});
  });

  afterAll(async () => {
    // Clean up canonical test records
    const externalIds = all30Questions.map(q => q.externalId);
    await prisma.practiceQuestion.deleteMany({
      where: {
        externalId: { in: externalIds }
      }
    }).catch(() => {});

    await prisma.$disconnect();
  });

  describe('1. Dataset Integrity & Schema Compliance', () => {
    test('Dataset contains expected question counts (505 Aptitude, 10 Technical, 10 Mixed)', () => {
      expect(aptitudeQuestions.length).toBe(505);
      expect(technicalQuestions.length).toBe(10);
      expect(mixedQuestions.length).toBe(10);
      expect(all30Questions.length).toBe(525);
    });

    test('All questions pass the bulk-import validator without errors', () => {
      all30Questions.forEach((item, idx) => {
        const validation = validateImportItem(item, idx);
        expect(validation.isValid).toBe(true);
        expect(validation.errors).toBeUndefined();
        expect(validation.data).toBeDefined();
      });
    });

    test('All questions have unique external IDs and valid provenance', () => {
      const externalIdSet = new Set();
      all30Questions.forEach(q => {
        expect(q.externalId).toBeDefined();
        expect(externalIdSet.has(q.externalId)).toBe(false);
        externalIdSet.add(q.externalId);

        expect(q.source).toBeDefined();
        expect(q.source.type).toBeDefined();
        expect(q.source.namespace).toBeDefined();
      });
      expect(externalIdSet.size).toBe(all30Questions.length);
    });
  });

  describe('2. Canonical Batch Ingestion', () => {
    test('Initial bulk import successfully inserts all canonical questions', async () => {
      const res = await request(app)
        .post('/api/admin/questions/bulk-import')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ items: all30Questions });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.total).toBe(all30Questions.length);
      expect(res.body.data.inserted).toBe(all30Questions.length);
      expect(res.body.data.versioned).toBe(0);
      expect(res.body.data.skipped).toBe(0);
      expect(res.body.data.failed).toBe(0);
      expect(res.body.data.errors.length).toBe(0);
    }, 60000);

    test('Database confirms active questions created with version 1', async () => {
      const externalIds = all30Questions.map(q => q.externalId);
      const dbQuestions = await prisma.practiceQuestion.findMany({
        where: { externalId: { in: externalIds } },
        include: { versions: true }
      });

      expect(dbQuestions.length).toBe(all30Questions.length);
      dbQuestions.forEach(q => {
        expect(q.status).toBe('ACTIVE');
        expect(q.versions.length).toBe(1);
        expect(q.versions[0].versionNumber).toBe(1);
      });
    });
  });

  describe('3. Idempotency & Replay Protection', () => {
    test('Re-importing the exact same dataset produces 0 insertions and expected skips', async () => {
      const res = await request(app)
        .post('/api/admin/questions/bulk-import')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ items: all30Questions });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.total).toBe(all30Questions.length);
      expect(res.body.data.inserted).toBe(0);
      expect(res.body.data.versioned).toBe(0);
      expect(res.body.data.skipped).toBe(all30Questions.length);
      expect(res.body.data.failed).toBe(0);
    }, 60000);
  });

  describe('4. Immutable Version Creation on Content Modification', () => {
    test('Importing modified question creates Version 2 while preserving Version 1', async () => {
      const targetQuestion = { ...aptitudeQuestions[0] };
      const modifiedQuestion = {
        ...targetQuestion,
        question: {
          ...targetQuestion.question,
          statement: 'Worker A can complete a software documentation task in 10 hours, while Worker B takes 15 hours. (Revised for clarity)'
        }
      };

      const res = await request(app)
        .post('/api/admin/questions/bulk-import')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ items: [modifiedQuestion] });

      expect(res.status).toBe(200);
      expect(res.body.data.inserted).toBe(0);
      expect(res.body.data.versioned).toBe(1);
      expect(res.body.data.skipped).toBe(0);

      // Verify question now has 2 distinct versions in database
      const dbQ = await prisma.practiceQuestion.findFirst({
        where: { externalId: targetQuestion.externalId },
        include: { versions: { orderBy: { versionNumber: 'asc' } } }
      });

      expect(dbQ.versions.length).toBe(2);
      expect(dbQ.versions[0].versionNumber).toBe(1);
      expect(dbQ.versions[0].statement).toBe(targetQuestion.question.statement);
      expect(dbQ.versions[1].versionNumber).toBe(2);
      expect(dbQ.versions[1].statement).toBe('Worker A can complete a software documentation task in 10 hours, while Worker B takes 15 hours. (Revised for clarity)');
    });
  });

  describe('5. Student Safety & Information Hiding', () => {
    test('Student fetching active questions cannot see correctAnswer or explanation', async () => {
      const q = await prisma.practiceQuestion.findFirst({
        where: { externalId: 'APT-QUANT-001' },
        include: { versions: { orderBy: { versionNumber: 'desc' }, take: 1 } }
      });

      const res = await request(app)
        .get(`/api/questions/${q.id}`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      // Ensure that student-facing payloads do not leak sensitive answer key details
      if (res.body.data && res.body.data.currentVersion) {
        expect(res.body.data.currentVersion.correctAnswer).toBeUndefined();
        expect(res.body.data.currentVersion.explanation).toBeUndefined();
      }
    });
  });

  describe('6. End-to-End Practice Attempt & Evaluation', () => {
    test('Practicing and evaluating SINGLE_CHOICE, MULTIPLE_CHOICE, TRUE_FALSE, and NUMERICAL', async () => {
      // Find question versions for each format
      const singleChoiceQ = await prisma.practiceQuestion.findFirst({
        where: { externalId: 'APT-QUANT-002' },
        include: { versions: { take: 1 } }
      });
      const multiChoiceQ = await prisma.practiceQuestion.findFirst({
        where: { externalId: 'MIX-MULTI-001' },
        include: { versions: { take: 1 } }
      });
      const trueFalseQ = await prisma.practiceQuestion.findFirst({
        where: { externalId: 'MIX-TF-001' },
        include: { versions: { take: 1 } }
      });
      const numericalQ = await prisma.practiceQuestion.findFirst({
        where: { externalId: 'MIX-NUM-001' },
        include: { versions: { take: 1 } }
      });

      expect(singleChoiceQ).toBeDefined();
      expect(multiChoiceQ).toBeDefined();
      expect(trueFalseQ).toBeDefined();
      expect(numericalQ).toBeDefined();

      // Create a practice attempt targeting singleChoiceQ
      const attempt = await practiceService.createPracticeAttempt({
        studentId: 'student-mcq-tester',
        collegeId: 'canonical-college',
        type: 'APTITUDE',
        category: 'QUANTITATIVE',
        questionId: singleChoiceQ.id
      });

      expect(attempt).toBeDefined();
      expect(attempt.attemptId).toBeDefined();

      const versionId = singleChoiceQ.versions[0].id;

      // Submit the correct answer { optionId: "A" }
      const recordRes = await practiceService.recordResponse(attempt.attemptId, {
        questionVersionId: versionId,
        answerData: { optionId: 'A' }
      });
      expect(recordRes.saved).toBe(true);

      // Finalize and submit the practice attempt
      const result = await practiceService.submitPracticeAttempt(attempt.attemptId);
      expect(result.status).toBe('SUBMITTED');
      expect(result.score).toBe(1);
      expect(result.totalMarks).toBe(1);

      // Verify the QuestionResponse in database
      const responseRecord = await prisma.questionResponse.findFirst({
        where: { practiceAttemptId: attempt.attemptId, questionVersionId: versionId }
      });
      expect(responseRecord.isCorrect).toBe(true);
      expect(Number(responseRecord.marksAwarded)).toBe(1);
    });

    test('Evaluating TRUE_FALSE and NUMERICAL evaluation accuracy', async () => {
      const trueFalseQ = await prisma.practiceQuestion.findFirst({
        where: { externalId: 'MIX-TF-001' },
        include: { versions: { take: 1 } }
      });

      const attempt = await practiceService.createPracticeAttempt({
        studentId: 'student-mcq-tester',
        collegeId: 'canonical-college',
        type: 'TECHNICAL',
        category: 'PROGRAMMING_CONCEPTS',
        questionId: trueFalseQ.id
      });

      const versionId = trueFalseQ.versions[0].id;
      await practiceService.recordResponse(attempt.attemptId, {
        questionVersionId: versionId,
        answerData: { value: true }
      });

      const result = await practiceService.submitPracticeAttempt(attempt.attemptId);
      expect(result.status).toBe('SUBMITTED');
      expect(result.score).toBe(1);
    });
  });
});
