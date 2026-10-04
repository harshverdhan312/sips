const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/utils/prisma');
const contestService = require('../src/services/contestService');
const { cleanDatabase } = require('./testHelper');

describe('Contest Management & Lifecycle (Phase 5B.1)', () => {
  let codingQuestionVersionId;
  let aptitudeQuestionVersionId;
  let technicalQuestionVersionId;
  let questionIdForVersioning;
  let version1Id;

  beforeAll(async () => {
    await cleanDatabase(prisma);
    // 1. Create a CODING question & version
    const codingQ = await prisma.practiceQuestion.create({
      data: {
        type: 'CODING',
        format: 'CODING',
        category: 'DSA',
        subcategory: 'ARRAYS',
        difficulty: 'MEDIUM',
        sourceType: 'CURATED'
      }
    });

    const codingVer = await prisma.questionVersion.create({
      data: {
        questionId: codingQ.id,
        versionNumber: 1,
        title: 'Two Sum Contest Problem',
        statement: 'Find two indices that sum to target.',
        codingProblem: {
          create: {
            timeLimitMs: 2000,
            memoryLimitKb: 128000,
            maxMarks: 100,
            testCases: {
              create: [
                { input: '2 7 11 15\n9', expectedOutput: '0 1', isHidden: false, order: 1 },
                { input: '3 2 4\n6', expectedOutput: '1 2', isHidden: true, order: 2 }
              ]
            }
          }
        }
      }
    });
    codingQuestionVersionId = codingVer.id;

    // 2. Create an APTITUDE question & version
    const aptitudeQ = await prisma.practiceQuestion.create({
      data: {
        type: 'APTITUDE',
        format: 'SINGLE_CHOICE',
        category: 'QUANTITATIVE',
        difficulty: 'EASY',
        sourceType: 'CURATED'
      }
    });

    const aptitudeVer = await prisma.questionVersion.create({
      data: {
        questionId: aptitudeQ.id,
        versionNumber: 1,
        title: 'Speed and Distance MCQ',
        statement: 'A train moves at 60 km/h...',
        options: [{ id: 'opt_1', text: '10 m/s' }, { id: 'opt_2', text: '16.6 m/s' }],
        correctAnswer: [{ id: 'opt_2' }]
      }
    });
    aptitudeQuestionVersionId = aptitudeVer.id;

    // 3. Create a TECHNICAL question & version
    const technicalQ = await prisma.practiceQuestion.create({
      data: {
        type: 'TECHNICAL',
        format: 'SINGLE_CHOICE',
        category: 'DBMS',
        difficulty: 'MEDIUM',
        sourceType: 'CURATED'
      }
    });

    const technicalVer = await prisma.questionVersion.create({
      data: {
        questionId: technicalQ.id,
        versionNumber: 1,
        title: 'ACID Properties',
        statement: 'Which letter stands for Isolation?',
        options: [{ id: 'opt_a', text: 'I' }, { id: 'opt_b', text: 'A' }],
        correctAnswer: [{ id: 'opt_a' }]
      }
    });
    technicalQuestionVersionId = technicalVer.id;

    // 4. Create a base question for versioning testing
    const versionTestQ = await prisma.practiceQuestion.create({
      data: {
        type: 'APTITUDE',
        format: 'SINGLE_CHOICE',
        category: 'LOGICAL',
        difficulty: 'EASY'
      }
    });
    questionIdForVersioning = versionTestQ.id;

    const v1 = await prisma.questionVersion.create({
      data: {
        questionId: questionIdForVersioning,
        versionNumber: 1,
        title: 'Original Version 1 Title',
        statement: 'Statement V1'
      }
    });
    version1Id = v1.id;
  });

  afterAll(async () => {
    await cleanDatabase(prisma);
    await prisma.$disconnect();
  });

  describe('1. Contest Creation', () => {
    test('creates contest in DRAFT state with valid payload', async () => {
      const now = new Date();
      const startAt = new Date(now.getTime() + 3600000).toISOString();
      const endAt = new Date(now.getTime() + 7200000).toISOString();

      const res = await request(app)
        .post('/api/contests')
        .send({
          title: 'Campus Placement Mock 2026',
          sipsDriveId: 'sips_drive_101',
          collegeId: 'college_demo_1',
          description: 'Aptitude and Coding placement challenge',
          instructions: 'Complete all sections within duration',
          startAt,
          endAt,
          durationMinutes: 60
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.status).toBe('DRAFT');
      expect(res.body.data.sipsDriveId).toBe('sips_drive_101');
      expect(res.body.data.collegeId).toBe('college_demo_1');
      expect(res.body.data.durationMinutes).toBe(60);
    });

    test('rejects contest creation when title is missing', async () => {
      const now = new Date();
      const res = await request(app)
        .post('/api/contests')
        .send({
          sipsDriveId: 'sips_drive_101',
          collegeId: 'college_demo_1',
          startAt: now.toISOString(),
          endAt: new Date(now.getTime() + 3600000).toISOString(),
          durationMinutes: 60
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/title/i);
    });

    test('rejects contest creation when endAt <= startAt', async () => {
      const now = new Date();
      const res = await request(app)
        .post('/api/contests')
        .send({
          title: 'Invalid Timing Contest',
          sipsDriveId: 'sips_drive_101',
          collegeId: 'college_demo_1',
          startAt: new Date(now.getTime() + 3600000).toISOString(),
          endAt: new Date(now.getTime() + 1800000).toISOString(), // earlier than start
          durationMinutes: 60
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/strictly after start time/i);
    });

    test('rejects non-positive durationMinutes', async () => {
      const now = new Date();
      const res = await request(app)
        .post('/api/contests')
        .send({
          title: 'Zero Duration Contest',
          sipsDriveId: 'sips_drive_101',
          collegeId: 'college_demo_1',
          startAt: now.toISOString(),
          endAt: new Date(now.getTime() + 3600000).toISOString(),
          durationMinutes: 0
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/positive integer/i);
    });
  });

  describe('2. Question Configuration & Section Validation', () => {
    let draftContestId;

    beforeEach(async () => {
      const now = new Date();
      const contest = await prisma.contest.create({
        data: {
          title: 'Question Config Test Contest',
          sipsDriveId: 'drive_q_test',
          collegeId: 'college_q_test',
          startAt: new Date(now.getTime() + 3600000),
          endAt: new Date(now.getTime() + 7200000),
          durationMinutes: 60,
          status: 'DRAFT'
        }
      });
      draftContestId = contest.id;
    });

    test('adds CODING question to CODING section with valid marks', async () => {
      const res = await request(app)
        .post(`/api/contests/${draftContestId}/questions`)
        .send({
          questionVersionId: codingQuestionVersionId,
          section: 'CODING',
          order: 1,
          marks: 50.0,
          negativeMarks: 0.0
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.section).toBe('CODING');
      expect(res.body.data.marks).toBe(50);
      expect(res.body.data.questionVersionId).toBe(codingQuestionVersionId);
    });

    test('rejects adding nonexistent QuestionVersion', async () => {
      const res = await request(app)
        .post(`/api/contests/${draftContestId}/questions`)
        .send({
          questionVersionId: 'nonexistent_version_cuid_999',
          section: 'CODING',
          order: 1,
          marks: 50.0
        });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/QuestionVersion not found/i);
    });

    test('rejects section mismatch (APTITUDE question in CODING section)', async () => {
      const res = await request(app)
        .post(`/api/contests/${draftContestId}/questions`)
        .send({
          questionVersionId: aptitudeQuestionVersionId,
          section: 'CODING',
          order: 1,
          marks: 10.0
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/section 'CODING' requires a CODING question/i);
    });

    test('rejects section mismatch (CODING question in APTITUDE section)', async () => {
      const res = await request(app)
        .post(`/api/contests/${draftContestId}/questions`)
        .send({
          questionVersionId: codingQuestionVersionId,
          section: 'APTITUDE',
          order: 1,
          marks: 10.0
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/section 'APTITUDE' requires an APTITUDE question/i);
    });

    test('rejects duplicate QuestionVersion in same contest', async () => {
      await request(app)
        .post(`/api/contests/${draftContestId}/questions`)
        .send({
          questionVersionId: technicalQuestionVersionId,
          section: 'TECHNICAL',
          order: 1,
          marks: 5.0
        });

      const duplicateRes = await request(app)
        .post(`/api/contests/${draftContestId}/questions`)
        .send({
          questionVersionId: technicalQuestionVersionId,
          section: 'TECHNICAL',
          order: 2,
          marks: 5.0
        });

      expect(duplicateRes.status).toBe(409);
      expect(duplicateRes.body.success).toBe(false);
      expect(duplicateRes.body.message).toMatch(/already added/i);
    });

    test('reorders questions in DRAFT contest transactionally', async () => {
      const q1 = await contestService.addContestQuestion(draftContestId, {
        questionVersionId: codingQuestionVersionId,
        section: 'CODING',
        order: 1,
        marks: 50
      });
      const q2 = await contestService.addContestQuestion(draftContestId, {
        questionVersionId: aptitudeQuestionVersionId,
        section: 'APTITUDE',
        order: 2,
        marks: 10
      });

      const res = await request(app)
        .post(`/api/contests/${draftContestId}/questions/reorder`)
        .send({
          questionOrders: [
            { id: q1.id, order: 2 },
            { id: q2.id, order: 1 }
          ]
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const updated = await contestService.getContestById(draftContestId);
      const reorderedQ1 = updated.questions.find((q) => q.id === q1.id);
      const reorderedQ2 = updated.questions.find((q) => q.id === q2.id);
      expect(reorderedQ1.order).toBe(2);
      expect(reorderedQ2.order).toBe(1);
    });

    test('removes question from DRAFT contest', async () => {
      const q = await contestService.addContestQuestion(draftContestId, {
        questionVersionId: technicalQuestionVersionId,
        section: 'TECHNICAL',
        order: 1,
        marks: 5
      });

      const deleteRes = await request(app).delete(
        `/api/contests/${draftContestId}/questions/${q.id}`
      );
      expect(deleteRes.status).toBe(200);
      expect(deleteRes.body.success).toBe(true);

      const updated = await contestService.getContestById(draftContestId);
      expect(updated.questions.length).toBe(0);
    });
  });

  describe('3. Contest Publication & Configuration Locking', () => {
    let emptyContestId;
    let validContestId;

    beforeEach(async () => {
      const now = new Date();
      const empty = await prisma.contest.create({
        data: {
          title: 'Empty Contest',
          sipsDriveId: 'drive_empty',
          collegeId: 'college_empty',
          startAt: new Date(now.getTime() + 3600000),
          endAt: new Date(now.getTime() + 7200000),
          durationMinutes: 60,
          status: 'DRAFT'
        }
      });
      emptyContestId = empty.id;

      const valid = await prisma.contest.create({
        data: {
          title: 'Valid Contest For Pub',
          sipsDriveId: 'drive_pub',
          collegeId: 'college_pub',
          startAt: new Date(now.getTime() + 3600000),
          endAt: new Date(now.getTime() + 7200000),
          durationMinutes: 60,
          status: 'DRAFT'
        }
      });
      validContestId = valid.id;

      await contestService.addContestQuestion(validContestId, {
        questionVersionId: codingQuestionVersionId,
        section: 'CODING',
        order: 1,
        marks: 50
      });
      await contestService.addContestQuestion(validContestId, {
        questionVersionId: aptitudeQuestionVersionId,
        section: 'APTITUDE',
        order: 2,
        marks: 10
      });
    });

    test('rejects publishing empty contest', async () => {
      const res = await request(app).post(`/api/contests/${emptyContestId}/publish`);
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/cannot publish an empty contest/i);
    });

    test('publishes valid contest successfully', async () => {
      const res = await request(app).post(`/api/contests/${validContestId}/publish`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('PUBLISHED');
    });

    test('published contest is configuration-locked against question addition', async () => {
      await contestService.publishContest(validContestId);

      const res = await request(app)
        .post(`/api/contests/${validContestId}/questions`)
        .send({
          questionVersionId: technicalQuestionVersionId,
          section: 'TECHNICAL',
          order: 3,
          marks: 5
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/configuration is locked/i);
    });

    test('published contest cannot be republished', async () => {
      await contestService.publishContest(validContestId);

      const res = await request(app).post(`/api/contests/${validContestId}/publish`);
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/expected 'DRAFT'/i);
    });
  });

  describe('4. Lifecycle State Transitions', () => {
    let contestId;

    beforeEach(async () => {
      const now = new Date();
      const contest = await prisma.contest.create({
        data: {
          title: 'Lifecycle Test Contest',
          sipsDriveId: 'drive_life',
          collegeId: 'college_life',
          startAt: new Date(now.getTime() + 3600000),
          endAt: new Date(now.getTime() + 7200000),
          durationMinutes: 60,
          status: 'DRAFT'
        }
      });
      contestId = contest.id;

      await contestService.addContestQuestion(contestId, {
        questionVersionId: codingQuestionVersionId,
        section: 'CODING',
        marks: 50
      });
    });

    test('executes full valid lifecycle: DRAFT -> PUBLISHED -> LIVE -> ENDED -> EVALUATED -> ARCHIVED', async () => {
      // DRAFT -> PUBLISHED
      const pubRes = await request(app).post(`/api/contests/${contestId}/publish`);
      expect(pubRes.status).toBe(200);
      expect(pubRes.body.data.status).toBe('PUBLISHED');

      // PUBLISHED -> LIVE
      const liveRes = await request(app).post(`/api/contests/${contestId}/live`);
      expect(liveRes.status).toBe(200);
      expect(liveRes.body.data.status).toBe('LIVE');

      // LIVE -> ENDED
      const endRes = await request(app).post(`/api/contests/${contestId}/end`);
      expect(endRes.status).toBe(200);
      expect(endRes.body.data.status).toBe('ENDED');

      // ENDED -> EVALUATED
      const evalRes = await request(app).post(`/api/contests/${contestId}/evaluate`);
      expect(evalRes.status).toBe(200);
      expect(evalRes.body.data.status).toBe('EVALUATED');

      // EVALUATED -> ARCHIVED
      const archRes = await request(app).post(`/api/contests/${contestId}/archive`);
      expect(archRes.status).toBe(200);
      expect(archRes.body.data.status).toBe('ARCHIVED');
    });

    test('rejects invalid direct transition: DRAFT -> LIVE', async () => {
      const res = await request(app).post(`/api/contests/${contestId}/live`);
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/invalid state transition/i);
    });

    test('rejects invalid direct transition: DRAFT -> ENDED', async () => {
      const res = await request(app).post(`/api/contests/${contestId}/end`);
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/invalid state transition/i);
    });

    test('rejects invalid transition from ARCHIVED', async () => {
      await contestService.publishContest(contestId);
      await contestService.markContestLive(contestId);
      await contestService.markContestEnded(contestId);
      await contestService.markContestEvaluated(contestId);
      await contestService.archiveContest(contestId);

      const res = await request(app).post(`/api/contests/${contestId}/live`);
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/invalid state transition/i);
    });
  });

  describe('5. Contest Cancellation', () => {
    test('cancels DRAFT contest', async () => {
      const contest = await prisma.contest.create({
        data: {
          title: 'Cancel Draft',
          sipsDriveId: 'drive_c1',
          collegeId: 'college_c1',
          startAt: new Date(Date.now() + 3600000),
          endAt: new Date(Date.now() + 7200000),
          durationMinutes: 60,
          status: 'DRAFT'
        }
      });

      const res = await request(app).post(`/api/contests/${contest.id}/cancel`);
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('CANCELLED');
    });

    test('cancels PUBLISHED contest', async () => {
      const contest = await prisma.contest.create({
        data: {
          title: 'Cancel Published',
          sipsDriveId: 'drive_c2',
          collegeId: 'college_c2',
          startAt: new Date(Date.now() + 3600000),
          endAt: new Date(Date.now() + 7200000),
          durationMinutes: 60,
          status: 'DRAFT'
        }
      });
      await contestService.addContestQuestion(contest.id, {
        questionVersionId: codingQuestionVersionId,
        section: 'CODING',
        marks: 50
      });
      await contestService.publishContest(contest.id);

      const res = await request(app).post(`/api/contests/${contest.id}/cancel`);
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('CANCELLED');
    });

    test('cancels LIVE contest', async () => {
      const contest = await prisma.contest.create({
        data: {
          title: 'Cancel Live',
          sipsDriveId: 'drive_c3',
          collegeId: 'college_c3',
          startAt: new Date(Date.now() + 3600000),
          endAt: new Date(Date.now() + 7200000),
          durationMinutes: 60,
          status: 'DRAFT'
        }
      });
      await contestService.addContestQuestion(contest.id, {
        questionVersionId: codingQuestionVersionId,
        section: 'CODING',
        marks: 50
      });
      await contestService.publishContest(contest.id);
      await contestService.markContestLive(contest.id);

      const res = await request(app).post(`/api/contests/${contest.id}/cancel`);
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('CANCELLED');
    });

    test('rejects cancellation of ENDED or EVALUATED contest', async () => {
      const contest = await prisma.contest.create({
        data: {
          title: 'Ended Contest',
          sipsDriveId: 'drive_c4',
          collegeId: 'college_c4',
          startAt: new Date(Date.now() + 3600000),
          endAt: new Date(Date.now() + 7200000),
          durationMinutes: 60,
          status: 'DRAFT'
        }
      });
      await contestService.addContestQuestion(contest.id, {
        questionVersionId: codingQuestionVersionId,
        section: 'CODING',
        marks: 50
      });
      await contestService.publishContest(contest.id);
      await contestService.markContestLive(contest.id);
      await contestService.markContestEnded(contest.id);

      const res = await request(app).post(`/api/contests/${contest.id}/cancel`);
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/invalid state transition/i);
    });
  });

  describe('6. Temporal State Calculations', () => {
    test('determines PUBLISHED before startAt', () => {
      const startAt = new Date(Date.now() + 3600000);
      const endAt = new Date(Date.now() + 7200000);
      const contest = { status: 'PUBLISHED', startAt, endAt };

      const status = contestService.determineTemporalStatus(contest, new Date());
      expect(status).toBe('PUBLISHED');
    });

    test('determines LIVE during contest window', () => {
      const startAt = new Date(Date.now() - 1000);
      const endAt = new Date(Date.now() + 3600000);
      const contest = { status: 'PUBLISHED', startAt, endAt };

      const status = contestService.determineTemporalStatus(contest, new Date());
      expect(status).toBe('LIVE');
    });

    test('determines ENDED after endAt', () => {
      const startAt = new Date(Date.now() - 7200000);
      const endAt = new Date(Date.now() - 3600000);
      const contest = { status: 'LIVE', startAt, endAt };

      const status = contestService.determineTemporalStatus(contest, new Date());
      expect(status).toBe('ENDED');
    });

    test('never overrides terminal states (EVALUATED, ARCHIVED, CANCELLED, DRAFT)', () => {
      const pastStart = new Date(Date.now() - 7200000);
      const pastEnd = new Date(Date.now() - 3600000);

      expect(
        contestService.determineTemporalStatus(
          { status: 'EVALUATED', startAt: pastStart, endAt: pastEnd },
          new Date()
        )
      ).toBe('EVALUATED');

      expect(
        contestService.determineTemporalStatus(
          { status: 'ARCHIVED', startAt: pastStart, endAt: pastEnd },
          new Date()
        )
      ).toBe('ARCHIVED');

      expect(
        contestService.determineTemporalStatus(
          { status: 'CANCELLED', startAt: pastStart, endAt: pastEnd },
          new Date()
        )
      ).toBe('CANCELLED');

      expect(
        contestService.determineTemporalStatus(
          { status: 'DRAFT', startAt: pastStart, endAt: pastEnd },
          new Date()
        )
      ).toBe('DRAFT');
    });
  });

  describe('7. Historical Question Version Integrity', () => {
    test('contest permanently pins v1 even after v2 is created', async () => {
      const contest = await prisma.contest.create({
        data: {
          title: 'Immutable Version Contest',
          sipsDriveId: 'drive_v_test',
          collegeId: 'college_v_test',
          startAt: new Date(Date.now() + 3600000),
          endAt: new Date(Date.now() + 7200000),
          durationMinutes: 60,
          status: 'DRAFT'
        }
      });

      // Pin v1
      const cq = await contestService.addContestQuestion(contest.id, {
        questionVersionId: version1Id,
        section: 'APTITUDE',
        marks: 5
      });
      await contestService.publishContest(contest.id);

      // Create v2 for the same underlying question
      const v2 = await prisma.questionVersion.create({
        data: {
          questionId: questionIdForVersioning,
          versionNumber: 2,
          title: 'New Version 2 Title',
          statement: 'Updated Statement V2'
        }
      });

      // Fetch contest questions and verify it still points to v1
      const updatedContest = await contestService.getContestById(contest.id);
      expect(updatedContest.questions.length).toBe(1);
      expect(updatedContest.questions[0].questionVersionId).toBe(version1Id);
      expect(updatedContest.questions[0].questionVersion.versionNumber).toBe(1);
      expect(updatedContest.questions[0].questionVersion.title).toBe('Original Version 1 Title');
    });
  });
});
