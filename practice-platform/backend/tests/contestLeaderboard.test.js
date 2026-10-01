const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/utils/prisma');
const { cleanDatabase } = require('./testHelper');
const contestService = require('../src/services/contestService');

describe('Contest Leaderboard & Ranking Engine (Phase 5B.4)', () => {
  const collegeA = 'college_lb_01';
  const collegeB = 'college_lb_02';

  let contestIdA;
  let contestIdB;
  let draftContestId;
  let cancelledContestId;

  beforeAll(async () => {
    await cleanDatabase(prisma);

    const now = Date.now();

    // 1. Create Question for contest questions
    const q = await prisma.practiceQuestion.create({
      data: {
        type: 'APTITUDE',
        format: 'SINGLE_CHOICE',
        category: 'QUANTITATIVE',
        difficulty: 'EASY',
        sourceType: 'CURATED'
      }
    });
    const ver = await prisma.questionVersion.create({
      data: {
        questionId: q.id,
        versionNumber: 1,
        title: 'Work Rate Question',
        statement: 'Find the rate.',
        options: [{ id: 'opt_1', text: '10' }, { id: 'opt_2', text: '20' }],
        correctAnswer: { optionId: 'opt_1' }
      }
    });

    // 2. Create and Publish Contest A (College A)
    const contestA = await contestService.createContest({
      title: 'Grand Placement League A',
      sipsDriveId: 'sips_drive_lb_01',
      collegeId: collegeA,
      startAt: new Date(now - 600000).toISOString(),
      endAt: new Date(now + 3600000).toISOString(),
      durationMinutes: 60
    });
    contestIdA = contestA.id;

    await contestService.addContestQuestion(contestIdA, {
      questionVersionId: ver.id,
      section: 'APTITUDE',
      marks: 100.0,
      negativeMarks: 0.0,
      order: 1
    });
    await contestService.publishContest(contestIdA);
    await contestService.markContestLive(contestIdA);

    // 3. Create and Publish Contest B (College B)
    const contestB = await contestService.createContest({
      title: 'Grand Placement League B',
      sipsDriveId: 'sips_drive_lb_02',
      collegeId: collegeB,
      startAt: new Date(now - 600000).toISOString(),
      endAt: new Date(now + 3600000).toISOString(),
      durationMinutes: 60
    });
    contestIdB = contestB.id;

    await contestService.addContestQuestion(contestIdB, {
      questionVersionId: ver.id,
      section: 'APTITUDE',
      marks: 100.0,
      negativeMarks: 0.0,
      order: 1
    });
    await contestService.publishContest(contestIdB);
    await contestService.markContestLive(contestIdB);

    // 4. Create DRAFT Contest in College A
    const draftC = await contestService.createContest({
      title: 'Draft Contest',
      sipsDriveId: 'sips_drive_draft',
      collegeId: collegeA,
      startAt: new Date(now + 100000).toISOString(),
      endAt: new Date(now + 500000).toISOString(),
      durationMinutes: 60
    });
    draftContestId = draftC.id;

    // 5. Create CANCELLED Contest in College A
    const cancelC = await contestService.createContest({
      title: 'Cancelled Contest',
      sipsDriveId: 'sips_drive_cancel',
      collegeId: collegeA,
      startAt: new Date(now - 100000).toISOString(),
      endAt: new Date(now + 500000).toISOString(),
      durationMinutes: 60
    });
    cancelledContestId = cancelC.id;
    await contestService.cancelContest(cancelledContestId);

    // 6. Seed Attempts in Contest A:
    // Student 1: Score 100, Submitted at 10:00 (Rank 1)
    // Student 2: Score 100, Submitted at 10:05 (Rank 1, displayed 2nd due to submittedAt)
    // Student 3: Score 90, Submitted at 10:02 (Rank 3)
    // Student 4: Score 80, Status TIMED_OUT (Rank 4)
    // Student 5: Status IN_PROGRESS (Excluded from leaderboard)
    // Student 6: Status DISQUALIFIED (Excluded from leaderboard)
    const timeBase = new Date(now - 300000);

    await prisma.contestAttempt.create({
      data: {
        contestId: contestIdA,
        studentId: 'student_score_100_early',
        collegeId: collegeA,
        status: 'SUBMITTED',
        startedAt: new Date(timeBase.getTime() - 1800000),
        submittedAt: new Date(timeBase.getTime() - 600000), // 10:00 equivalent
        totalScore: 100.0,
        totalMarks: 100.0,
        codingScore: 50.0,
        aptitudeScore: 50.0,
        technicalScore: 0.0
      }
    });

    await prisma.contestAttempt.create({
      data: {
        contestId: contestIdA,
        studentId: 'student_score_100_late',
        collegeId: collegeA,
        status: 'SUBMITTED',
        startedAt: new Date(timeBase.getTime() - 1800000),
        submittedAt: new Date(timeBase.getTime() - 300000), // 10:05 equivalent
        totalScore: 100.0,
        totalMarks: 100.0,
        codingScore: 40.0,
        aptitudeScore: 60.0,
        technicalScore: 0.0
      }
    });

    await prisma.contestAttempt.create({
      data: {
        contestId: contestIdA,
        studentId: 'student_score_90',
        collegeId: collegeA,
        status: 'SUBMITTED',
        startedAt: new Date(timeBase.getTime() - 1800000),
        submittedAt: new Date(timeBase.getTime() - 480000), // 10:02 equivalent
        totalScore: 90.0,
        totalMarks: 100.0,
        codingScore: 50.0,
        aptitudeScore: 40.0,
        technicalScore: 0.0
      }
    });

    await prisma.contestAttempt.create({
      data: {
        contestId: contestIdA,
        studentId: 'student_timed_out_80',
        collegeId: collegeA,
        status: 'TIMED_OUT',
        startedAt: new Date(timeBase.getTime() - 1800000),
        submittedAt: new Date(timeBase.getTime()),
        totalScore: 80.0,
        totalMarks: 100.0,
        codingScore: 40.0,
        aptitudeScore: 40.0,
        technicalScore: 0.0
      }
    });

    await prisma.contestAttempt.create({
      data: {
        contestId: contestIdA,
        studentId: 'student_in_progress',
        collegeId: collegeA,
        status: 'IN_PROGRESS',
        startedAt: new Date(timeBase.getTime()),
        totalScore: 0.0,
        totalMarks: 100.0
      }
    });

    await prisma.contestAttempt.create({
      data: {
        contestId: contestIdA,
        studentId: 'student_disqualified',
        collegeId: collegeA,
        status: 'DISQUALIFIED',
        startedAt: new Date(timeBase.getTime()),
        totalScore: 0.0,
        totalMarks: 100.0
      }
    });

    // Seed Contest B attempt to test contest isolation
    await prisma.contestAttempt.create({
      data: {
        contestId: contestIdB,
        studentId: 'student_contest_b_winner',
        collegeId: collegeB,
        status: 'SUBMITTED',
        startedAt: new Date(timeBase.getTime() - 1800000),
        submittedAt: new Date(timeBase.getTime() - 600000),
        totalScore: 100.0,
        totalMarks: 100.0
      }
    });
  });

  afterAll(async () => {
    await cleanDatabase(prisma);
    await prisma.$disconnect();
  });

  describe('1. Standard Competition Ranking & Deterministic Ordering', () => {
    test('standard competition ranking assigns tied rank 1 to both 100s and rank 3 to 90', async () => {
      const res = await request(app)
        .get(`/api/contests/${contestIdA}/leaderboard`)
        .set('x-student-id', 'student_score_100_early')
        .set('x-college-id', collegeA);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalEntries).toBe(4); // 4 rankable (2 x 100, 1 x 90, 1 x 80)
      expect(res.body.data.entries.length).toBe(4);

      const entries = res.body.data.entries;

      // First entry: student_score_100_early (submitted earlier)
      expect(entries[0].studentId).toBe('student_score_100_early');
      expect(entries[0].totalScore).toBe(100);
      expect(entries[0].rank).toBe(1);

      // Second entry: student_score_100_late (submitted later, same score -> same rank 1)
      expect(entries[1].studentId).toBe('student_score_100_late');
      expect(entries[1].totalScore).toBe(100);
      expect(entries[1].rank).toBe(1);

      // Third entry: student_score_90 -> rank 3 (2 students strictly higher)
      expect(entries[2].studentId).toBe('student_score_90');
      expect(entries[2].totalScore).toBe(90);
      expect(entries[2].rank).toBe(3);

      // Fourth entry: student_timed_out_80 -> rank 4 (3 students strictly higher)
      expect(entries[3].studentId).toBe('student_timed_out_80');
      expect(entries[3].totalScore).toBe(80);
      expect(entries[3].rank).toBe(4);
    });
  });

  describe('2. Status Filtering & Non-Rankable Exclusion', () => {
    test('IN_PROGRESS and DISQUALIFIED attempts are excluded from leaderboard entries', async () => {
      const res = await request(app)
        .get(`/api/contests/${contestIdA}/leaderboard`)
        .set('x-student-id', 'student_score_100_early')
        .set('x-college-id', collegeA);

      const studentIds = res.body.data.entries.map((e) => e.studentId);
      expect(studentIds).not.toContain('student_in_progress');
      expect(studentIds).not.toContain('student_disqualified');
    });

    test('IN_PROGRESS student receives isRankable: false and rank: null in myRank', async () => {
      const res = await request(app)
        .get(`/api/contests/${contestIdA}/leaderboard/me`)
        .set('x-student-id', 'student_in_progress')
        .set('x-college-id', collegeA);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isRankable).toBe(false);
      expect(res.body.data.rank).toBeNull();
      expect(res.body.data.status).toBe('IN_PROGRESS');
    });

    test('student with no attempt receives isRankable: false and rank: null', async () => {
      const res = await request(app)
        .get(`/api/contests/${contestIdA}/leaderboard/me`)
        .set('x-student-id', 'student_never_participated')
        .set('x-college-id', collegeA);

      expect(res.status).toBe(200);
      expect(res.body.data.isRankable).toBe(false);
      expect(res.body.data.rank).toBeNull();
      expect(res.body.data.status).toBe('NOT_STARTED');
    });
  });

  describe('3. Contest & Tenant Isolation', () => {
    test('contest A leaderboard never contains attempts from contest B', async () => {
      const res = await request(app)
        .get(`/api/contests/${contestIdA}/leaderboard`)
        .set('x-student-id', 'student_score_100_early')
        .set('x-college-id', collegeA);

      const studentIds = res.body.data.entries.map((e) => e.studentId);
      expect(studentIds).not.toContain('student_contest_b_winner');
    });

    test('student from College B cannot access College A contest leaderboard (403 TENANT_MISMATCH)', async () => {
      const res = await request(app)
        .get(`/api/contests/${contestIdA}/leaderboard`)
        .set('x-student-id', 'student_contest_b_winner')
        .set('x-college-id', collegeB);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/does not belong to your institution/i);
    });
  });

  describe('4. Global Student Rank (My Rank)', () => {
    test('authenticated student receives accurate global rank in combined leaderboard endpoint', async () => {
      const res = await request(app)
        .get(`/api/contests/${contestIdA}/leaderboard`)
        .set('x-student-id', 'student_score_90')
        .set('x-college-id', collegeA);

      expect(res.status).toBe(200);
      expect(res.body.data.myRank).toBeDefined();
      expect(res.body.data.myRank.isRankable).toBe(true);
      expect(res.body.data.myRank.studentId).toBe('student_score_90');
      expect(res.body.data.myRank.rank).toBe(3);
      expect(res.body.data.myRank.totalScore).toBe(90);
    });

    test('dedicated /leaderboard/me endpoint returns global rank accurately', async () => {
      const res = await request(app)
        .get(`/api/contests/${contestIdA}/leaderboard/me`)
        .set('x-student-id', 'student_timed_out_80')
        .set('x-college-id', collegeA);

      expect(res.status).toBe(200);
      expect(res.body.data.isRankable).toBe(true);
      expect(res.body.data.studentId).toBe('student_timed_out_80');
      expect(res.body.data.rank).toBe(4);
      expect(res.body.data.totalScore).toBe(80);
      expect(res.body.data.status).toBe('TIMED_OUT');
    });
  });

  describe('5. Pagination & Global Rank Continuation', () => {
    test('pagination with limit=2 returns first 2 entries with accurate page 1 metadata', async () => {
      const res = await request(app)
        .get(`/api/contests/${contestIdA}/leaderboard?page=1&limit=2`)
        .set('x-student-id', 'student_score_100_early')
        .set('x-college-id', collegeA);

      expect(res.status).toBe(200);
      expect(res.body.data.pagination.page).toBe(1);
      expect(res.body.data.pagination.limit).toBe(2);
      expect(res.body.data.pagination.totalPages).toBe(2);
      expect(res.body.data.pagination.totalEntries).toBe(4);
      expect(res.body.data.entries.length).toBe(2);
      expect(res.body.data.entries[0].rank).toBe(1);
      expect(res.body.data.entries[1].rank).toBe(1);
    });

    test('page 2 continues global ranks (rank 3 and rank 4) instead of restarting at rank 1', async () => {
      const res = await request(app)
        .get(`/api/contests/${contestIdA}/leaderboard?page=2&limit=2`)
        .set('x-student-id', 'student_score_100_early')
        .set('x-college-id', collegeA);

      expect(res.status).toBe(200);
      expect(res.body.data.pagination.page).toBe(2);
      expect(res.body.data.entries.length).toBe(2);

      expect(res.body.data.entries[0].studentId).toBe('student_score_90');
      expect(res.body.data.entries[0].rank).toBe(3); // Global rank 3

      expect(res.body.data.entries[1].studentId).toBe('student_timed_out_80');
      expect(res.body.data.entries[1].rank).toBe(4); // Global rank 4
    });

    test('requesting page > totalPages returns empty entries with valid pagination metadata', async () => {
      const res = await request(app)
        .get(`/api/contests/${contestIdA}/leaderboard?page=999&limit=2`)
        .set('x-student-id', 'student_score_100_early')
        .set('x-college-id', collegeA);

      expect(res.status).toBe(200);
      expect(res.body.data.entries).toEqual([]);
      expect(res.body.data.pagination.page).toBe(999);
      expect(res.body.data.pagination.totalPages).toBe(2);
      expect(res.body.data.pagination.totalEntries).toBe(4);
    });
  });

  describe('6. Lifecycle State Validation', () => {
    test('DRAFT contest rejects leaderboard query with 400 CONTEST_NOT_STARTED', async () => {
      const res = await request(app)
        .get(`/api/contests/${draftContestId}/leaderboard`)
        .set('x-student-id', 'student_score_100_early')
        .set('x-college-id', collegeA);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/draft configuration/i);
    });

    test('CANCELLED contest rejects leaderboard query with 400 CONTEST_CANCELLED', async () => {
      const res = await request(app)
        .get(`/api/contests/${cancelledContestId}/leaderboard`)
        .set('x-student-id', 'student_score_100_early')
        .set('x-college-id', collegeA);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/cancelled/i);
    });

    test('ENDED, EVALUATED, and ARCHIVED contests allow leaderboard retrieval', async () => {
      // Mark Contest A as ENDED
      await contestService.markContestEnded(contestIdA);
      let res = await request(app)
        .get(`/api/contests/${contestIdA}/leaderboard`)
        .set('x-student-id', 'student_score_100_early')
        .set('x-college-id', collegeA);
      expect(res.status).toBe(200);

      // Mark Contest A as EVALUATED
      await contestService.markContestEvaluated(contestIdA);
      res = await request(app)
        .get(`/api/contests/${contestIdA}/leaderboard`)
        .set('x-student-id', 'student_score_100_early')
        .set('x-college-id', collegeA);
      expect(res.status).toBe(200);

      // Mark Contest A as ARCHIVED
      await contestService.archiveContest(contestIdA);
      res = await request(app)
        .get(`/api/contests/${contestIdA}/leaderboard`)
        .set('x-student-id', 'student_score_100_early')
        .set('x-college-id', collegeA);
      expect(res.status).toBe(200);
    });
  });

  describe('7. Security, Information Hiding & Score Integrity', () => {
    test('leaderboard entries scrub all answers, code, test cases, and Judge0 tokens', async () => {
      const res = await request(app)
        .get(`/api/contests/${contestIdA}/leaderboard`)
        .set('x-student-id', 'student_score_100_early')
        .set('x-college-id', collegeA);

      expect(res.status).toBe(200);
      const entry = res.body.data.entries[0];

      // Safe fields present
      expect(entry.rank).toBeDefined();
      expect(entry.studentId).toBeDefined();
      expect(entry.totalScore).toBeDefined();
      expect(entry.totalMarks).toBeDefined();

      // Protected fields absent
      expect(entry.correctAnswer).toBeUndefined();
      expect(entry.explanation).toBeUndefined();
      expect(entry.sourceCode).toBeUndefined();
      expect(entry.testCases).toBeUndefined();
      expect(entry.judge0Token).toBeUndefined();
      expect(entry.responses).toBeUndefined();
    });

    test('non-existent contest returns 404 CONTEST_NOT_FOUND', async () => {
      const res = await request(app)
        .get('/api/contests/non_existent_contest_id/leaderboard')
        .set('x-student-id', 'student_score_100_early')
        .set('x-college-id', collegeA);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/not found/i);
    });
  });
});
