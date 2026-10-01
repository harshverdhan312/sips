const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/utils/prisma');

const { cleanDatabase } = require('./testHelper');

describe('Question Bank & Versioning APIs', () => {
  let createdQuestionId;
  let version1Id;
  let version2Id;

  beforeAll(async () => {
    await cleanDatabase(prisma);
  });

  afterAll(async () => {
    await cleanDatabase(prisma);
    await prisma.$disconnect();
  });

  test('1. Create question creates PracticeQuestion and Version 1', async () => {
    const payload = {
      type: 'APTITUDE',
      format: 'SINGLE_CHOICE',
      category: 'QUANTITATIVE',
      subcategory: 'PROBABILITY',
      difficulty: 'MEDIUM',
      sourceType: 'PUBLIC_SOURCE',
      sourceUrl: 'https://example.com/aptitude/sheets',
      attribution: 'Sourced from Open Aptitude Bank',
      title: 'Dice Probability Question',
      statement: 'What is the probability of rolling a 6 on a fair 6-sided die?',
      options: [
        { id: 'opt_1', text: '1/6' },
        { id: 'opt_2', text: '1/3' },
        { id: 'opt_3', text: '1/2' },
        { id: 'opt_4', text: '1/1' }
      ],
      correctAnswer: { optionId: 'opt_1' },
      explanation: 'A fair die has 6 equally likely outcomes, so P(6) = 1/6.'
    };

    const res = await request(app).post('/api/questions').send(payload);

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBeDefined();
    expect(res.body.data.type).toBe('APTITUDE');
    expect(res.body.data.versions).toHaveLength(1);
    expect(res.body.data.versions[0].versionNumber).toBe(1);

    createdQuestionId = res.body.data.id;
    version1Id = res.body.data.versions[0].id;
  });

  test('2. Retrieve question by ID includes version list', async () => {
    const res = await request(app).get(`/api/questions/${createdQuestionId}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(createdQuestionId);
    expect(res.body.data.versions).toHaveLength(1);
    expect(res.body.data.versions[0].versionNumber).toBe(1);
  });

  test('3 & 4 & 5. Create version 2 increments version number correctly', async () => {
    const version2Payload = {
      title: 'Dice Probability Question v2 (Clarified)',
      statement: 'What is the exact probability of rolling an even number on a fair 6-sided die?',
      options: [
        { id: 'opt_a', text: '1/2' },
        { id: 'opt_b', text: '1/6' },
        { id: 'opt_c', text: '1/3' }
      ],
      correctAnswer: { optionId: 'opt_a' },
      explanation: 'Even numbers are 2, 4, 6. Total 3 outcomes out of 6 = 3/6 = 1/2.'
    };

    const res = await request(app)
      .post(`/api/questions/${createdQuestionId}/versions`)
      .send(version2Payload);

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.versionNumber).toBe(2);
    expect(res.body.data.title).toContain('v2 (Clarified)');

    version2Id = res.body.data.id;

    // Verify all versions list
    const listRes = await request(app).get(`/api/questions/${createdQuestionId}/versions`);
    expect(listRes.statusCode).toBe(200);
    expect(listRes.body.data).toHaveLength(2);
    expect(listRes.body.data[0].versionNumber).toBe(1);
    expect(listRes.body.data[1].versionNumber).toBe(2);
  });

  test('6. Existing version cannot be modified via PUT / PATCH (route does not exist)', async () => {
    const putRes = await request(app)
      .put(`/api/question-versions/${version1Id}`)
      .send({ title: 'Modified Title' });

    expect(putRes.statusCode).toBe(404);

    const patchRes = await request(app)
      .patch(`/api/question-versions/${version1Id}`)
      .send({ title: 'Modified Title' });

    expect(patchRes.statusCode).toBe(404);

    // Verify version 1 title in database remained unchanged
    const v1Res = await request(app).get(`/api/question-versions/${version1Id}`);
    expect(v1Res.statusCode).toBe(200);
    expect(v1Res.body.data.title).toBe('Dice Probability Question');
  });

  test('7 & 8. PUBLIC_SOURCE provenance preserves sourceUrl and attribution', async () => {
    const res = await request(app).get(`/api/questions/${createdQuestionId}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.sourceType).toBe('PUBLIC_SOURCE');
    expect(res.body.data.sourceUrl).toBe('https://example.com/aptitude/sheets');
    expect(res.body.data.attribution).toBe('Sourced from Open Aptitude Bank');
  });
});
