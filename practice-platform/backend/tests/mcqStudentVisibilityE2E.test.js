const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const prisma = require('../src/utils/prisma');
const config = require('../src/config');
const sipsEligibilityService = require('../src/services/sipsEligibilityService');

describe('MCQ Student Visibility & End-to-End Runtime Verification', () => {
  const collegeId = '6abead7c162ac4778d39b352';
  const studentId = '6abffa8ac99a7e0578f6d008'; // Harsh Verdhan Singh

  const studentToken = jwt.sign(
    { id: studentId, collegeId, role: 'STUDENT' },
    config.jwtSecret,
    { algorithm: 'HS256' }
  );

  let assessmentId;
  let singleChoiceQVersionId;
  let multipleChoiceQVersionId;
  let trueFalseQVersionId;
  let numericalQVersionId;

  beforeAll(async () => {
    // 1. Create Question Versions covering all 4 MCQ types
    const singleQ = await prisma.practiceQuestion.create({
      data: {
        type: 'APTITUDE',
        format: 'SINGLE_CHOICE',
        category: 'QUANTITATIVE',
        difficulty: 'EASY',
        status: 'ACTIVE',
        collegeId,
        versions: {
          create: {
            versionNumber: 1,
            title: 'Pipe Filling Time Problem',
            statement: 'Pipe A can fill a tank in 12 hours and Pipe B in 18 hours. Working together, how many hours to fill?',
            options: [
              { id: 'opt_a', text: '7.2 hours' },
              { id: 'opt_b', text: '6.5 hours' },
              { id: 'opt_c', text: '8.0 hours' },
              { id: 'opt_d', text: '7.5 hours' }
            ],
            correctAnswer: { optionId: 'opt_a' },
            explanation: '1/12 + 1/18 = 5/36 per hour => 36/5 = 7.2 hours'
          }
        }
      },
      include: { versions: true }
    });
    singleChoiceQVersionId = singleQ.versions[0].id;

    const multiQ = await prisma.practiceQuestion.create({
      data: {
        type: 'TECHNICAL',
        format: 'MULTIPLE_CHOICE',
        category: 'NETWORKS',
        difficulty: 'MEDIUM',
        status: 'ACTIVE',
        collegeId,
        versions: {
          create: {
            versionNumber: 1,
            title: 'Application Layer Protocols',
            statement: 'Select all protocols that operate at Layer 7 (Application Layer):',
            options: [
              { id: 'opt_http', text: 'HTTP / HTTPS' },
              { id: 'opt_dns', text: 'DNS' },
              { id: 'opt_tcp', text: 'TCP' },
              { id: 'opt_smtp', text: 'SMTP' }
            ],
            correctAnswer: { optionIds: ['opt_http', 'opt_dns', 'opt_smtp'] }
          }
        }
      },
      include: { versions: true }
    });
    multipleChoiceQVersionId = multiQ.versions[0].id;

    const tfQ = await prisma.practiceQuestion.create({
      data: {
        type: 'TECHNICAL',
        format: 'TRUE_FALSE',
        category: 'OS',
        difficulty: 'EASY',
        status: 'ACTIVE',
        collegeId,
        versions: {
          create: {
            versionNumber: 1,
            title: 'Shared Process Heap Space',
            statement: 'Threads within the same process share heap memory.',
            options: [
              { id: 'true', text: 'True' },
              { id: 'false', text: 'False' }
            ],
            correctAnswer: { value: true }
          }
        }
      },
      include: { versions: true }
    });
    trueFalseQVersionId = tfQ.versions[0].id;

    const numQ = await prisma.practiceQuestion.create({
      data: {
        type: 'APTITUDE',
        format: 'NUMERICAL',
        category: 'QUANTITATIVE',
        difficulty: 'MEDIUM',
        status: 'ACTIVE',
        collegeId,
        versions: {
          create: {
            versionNumber: 1,
            title: 'Compounded Growth Rate',
            statement: 'Value of 100 after 2 years at 10% compound annual growth:',
            options: null,
            correctAnswer: { value: 121, tolerance: 0.1 }
          }
        }
      },
      include: { versions: true }
    });
    numericalQVersionId = numQ.versions[0].id;

    // 2. Create and Publish Assessment
    const assessment = await prisma.assessment.create({
      data: {
        title: 'Campus Drive Screening Assessment',
        type: 'PLACEMENT_ASSESSMENT',
        status: 'PUBLISHED',
        collegeId,
        sipsDriveId: 'drive_e2e_mcq_test_01',
        durationMinutes: 45,
        totalMarks: 20.0,
        questions: {
          create: [
            { questionVersionId: singleChoiceQVersionId, section: 'APTITUDE', order: 1, marks: 5.0 },
            { questionVersionId: multipleChoiceQVersionId, section: 'TECHNICAL', order: 2, marks: 5.0 },
            { questionVersionId: trueFalseQVersionId, section: 'TECHNICAL', order: 3, marks: 5.0 },
            { questionVersionId: numericalQVersionId, section: 'APTITUDE', order: 4, marks: 5.0 }
          ]
        }
      }
    });
    assessmentId = assessment.id;
  });

  afterAll(async () => {
    sipsEligibilityService.resetMockProvider();
    await prisma.$disconnect();
  });

  test('1. Student Assessment Details API delivers metadata with eligibility', async () => {
    const res = await request(app)
      .get(`/api/assessments/${assessmentId}/student`)
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(assessmentId);
    expect(res.body.data.isEligible).toBe(true);
    expect(res.body.data.totalQuestions).toBe(4);
  });

  test('2. Start Attempt returns fresh or active attempt session', async () => {
    const res = await request(app)
      .post(`/api/assessments/${assessmentId}/attempts/start`)
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('IN_PROGRESS');
    expect(res.body.data.effectiveDeadline).toBeDefined();
    expect(res.body.data.questionCount).toBe(4);
  });

  test('3. Delivery of MCQ questions: all 4 types contain complete options/statements without answer leakage', async () => {
    const startRes = await request(app)
      .post(`/api/assessments/${assessmentId}/attempts/start`)
      .set('Authorization', `Bearer ${studentToken}`);
    const attemptId = startRes.body.data.id;

    const res = await request(app)
      .get(`/api/assessments/${assessmentId}/attempts/${attemptId}/questions`)
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(4);

    // Q1: SINGLE_CHOICE
    const q1 = res.body.data.find(q => q.questionVersionId === singleChoiceQVersionId);
    expect(q1).toBeDefined();
    expect(q1.questionVersion.format).toBe('SINGLE_CHOICE');
    expect(q1.questionVersion.statement).toContain('Pipe A can fill');
    expect(Array.isArray(q1.questionVersion.options)).toBe(true);
    expect(q1.questionVersion.options.length).toBe(4);
    expect(q1.questionVersion.options[0]).toEqual({ id: 'opt_a', text: '7.2 hours' });
    expect(q1.questionVersion.correctAnswer).toBeUndefined(); // Security check

    // Q2: MULTIPLE_CHOICE
    const q2 = res.body.data.find(q => q.questionVersionId === multipleChoiceQVersionId);
    expect(q2).toBeDefined();
    expect(q2.questionVersion.format).toBe('MULTIPLE_CHOICE');
    expect(q2.questionVersion.options.length).toBe(4);
    expect(q2.questionVersion.options.map(o => o.id)).toContain('opt_http');
    expect(q2.questionVersion.correctAnswer).toBeUndefined(); // Security check

    // Q3: TRUE_FALSE
    const q3 = res.body.data.find(q => q.questionVersionId === trueFalseQVersionId);
    expect(q3).toBeDefined();
    expect(q3.questionVersion.format).toBe('TRUE_FALSE');
    expect(q3.questionVersion.options.length).toBe(2);
    expect(q3.questionVersion.options[0]).toEqual({ id: 'true', text: 'True' });
    expect(q3.questionVersion.options[1]).toEqual({ id: 'false', text: 'False' });
    expect(q3.questionVersion.correctAnswer).toBeUndefined(); // Security check

    // Q4: NUMERICAL
    const q4 = res.body.data.find(q => q.questionVersionId === numericalQVersionId);
    expect(q4).toBeDefined();
    expect(q4.questionVersion.format).toBe('NUMERICAL');
    expect(q4.questionVersion.statement).toContain('compound annual growth');
    expect(q4.questionVersion.correctAnswer).toBeUndefined(); // Security check
  });

  test('4. Autosave and answer preservation for all MCQ types', async () => {
    const startRes = await request(app)
      .post(`/api/assessments/${assessmentId}/attempts/start`)
      .set('Authorization', `Bearer ${studentToken}`);
    const attemptId = startRes.body.data.id;

    // Save Q1: SINGLE_CHOICE
    const save1 = await request(app)
      .post(`/api/assessments/${assessmentId}/attempts/${attemptId}/responses`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ questionVersionId: singleChoiceQVersionId, answerData: { optionId: 'opt_a' } });
    expect(save1.status).toBe(200);

    // Save Q2: MULTIPLE_CHOICE
    const save2 = await request(app)
      .post(`/api/assessments/${assessmentId}/attempts/${attemptId}/responses`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ questionVersionId: multipleChoiceQVersionId, answerData: { optionIds: ['opt_http', 'opt_dns', 'opt_smtp'] } });
    expect(save2.status).toBe(200);

    // Save Q3: TRUE_FALSE
    const save3 = await request(app)
      .post(`/api/assessments/${assessmentId}/attempts/${attemptId}/responses`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ questionVersionId: trueFalseQVersionId, answerData: { value: true, optionId: 'true' } });
    expect(save3.status).toBe(200);

    // Save Q4: NUMERICAL
    const save4 = await request(app)
      .post(`/api/assessments/${assessmentId}/attempts/${attemptId}/responses`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ questionVersionId: numericalQVersionId, answerData: { value: 121 } });
    expect(save4.status).toBe(200);

    // Refresh questions and verify saved answers are returned
    const refreshRes = await request(app)
      .get(`/api/assessments/${assessmentId}/attempts/${attemptId}/questions`)
      .set('Authorization', `Bearer ${studentToken}`);

    expect(refreshRes.status).toBe(200);
    const refreshedQ1 = refreshRes.body.data.find(q => q.questionVersionId === singleChoiceQVersionId);
    expect(refreshedQ1.response.answerData).toEqual({ optionId: 'opt_a' });

    const refreshedQ2 = refreshRes.body.data.find(q => q.questionVersionId === multipleChoiceQVersionId);
    expect(refreshedQ2.response.answerData).toEqual({ optionIds: ['opt_http', 'opt_dns', 'opt_smtp'] });

    const refreshedQ3 = refreshRes.body.data.find(q => q.questionVersionId === trueFalseQVersionId);
    expect(refreshedQ3.response.answerData.value).toBe(true);

    const refreshedQ4 = refreshRes.body.data.find(q => q.questionVersionId === numericalQVersionId);
    expect(refreshedQ4.response.answerData.value).toBe(121);
  });

  test('5. Submission and server-authoritative scoring of all MCQ types', async () => {
    const startRes = await request(app)
      .post(`/api/assessments/${assessmentId}/attempts/start`)
      .set('Authorization', `Bearer ${studentToken}`);
    const attemptId = startRes.body.data.id;

    // Submit attempt
    const submitRes = await request(app)
      .post(`/api/assessments/${assessmentId}/attempts/${attemptId}/submit`)
      .set('Authorization', `Bearer ${studentToken}`);

    expect(submitRes.status).toBe(200);
    expect(submitRes.body.data.scores.totalScore).toBe(20);
    expect(submitRes.body.data.scores.totalMarks).toBe(20);
    expect(submitRes.body.data.scores.aptitudeScore).toBe(10);
    expect(submitRes.body.data.scores.technicalScore).toBe(10);
    expect(submitRes.body.data.attempt.status).toBe('FINALIZED');
  });

  test('6. Result Scorecard API returns full question performance breakdown', async () => {
    const startRes = await request(app)
      .post(`/api/assessments/${assessmentId}/attempts/start`)
      .set('Authorization', `Bearer ${studentToken}`);
    const attemptId = startRes.body.data.id;

    const resultRes = await request(app)
      .get(`/api/assessments/${assessmentId}/attempts/${attemptId}/result`)
      .set('Authorization', `Bearer ${studentToken}`);

    expect(resultRes.status).toBe(200);
    expect(resultRes.body.data.scores.totalScore).toBe(20);
    expect(resultRes.body.data.questions.length).toBe(4);
    expect(resultRes.body.data.questions.every(q => q.response.isCorrect)).toBe(true);
  });
});
