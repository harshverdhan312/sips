const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/utils/prisma');
const { cleanDatabase } = require('./testHelper');
const contestService = require('../src/services/contestService');
const sipsEligibilityService = require('../src/services/sipsEligibilityService');

describe('Student Contest Attempt Engine (Phase 5B.2)', () => {
  const collegeA = 'college_rvce_01';
  const collegeB = 'college_pes_02';

  const studentEligible = 'student_harsh_eligible';
  const studentIneligible = 'student_ineligible_gpa';
  const studentOtherCollege = 'student_other_college';

  let codingVersionId;
  let aptitudeVersionId;
  let unrelatedVersionId;
  let liveContestId;
  let futureContestId;
  let endedContestId;
  let cancelledContestId;
  let versionTestQuestionId;
  let version1Id;

  beforeAll(async () => {
    await cleanDatabase(prisma);

    // 1. Create a CODING question & version with public & hidden test cases
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
        title: 'Reverse Linked List',
        statement: 'Reverse a singly linked list in O(N) time.',
        explanation: 'INTERNAL EXPLANATION: Use 3 pointers (prev, curr, next).',
        correctAnswer: { code: 'def reverse(): pass' },
        codingProblem: {
          create: {
            timeLimitMs: 2000,
            memoryLimitKb: 128000,
            maxMarks: 50,
            testCases: {
              create: [
                { input: '1->2->3', expectedOutput: '3->2->1', isHidden: false, order: 1 },
                { input: '9->8->7->6->5', expectedOutput: '5->6->7->8->9', isHidden: true, order: 2 }
              ]
            }
          }
        }
      }
    });
    codingVersionId = codingVer.id;

    // 2. Create an APTITUDE MCQ question & version
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
        title: 'Speed Time Distance',
        statement: 'A car covers 120km in 2 hours. What is the speed in km/h?',
        options: [
          { id: 'opt_a', text: '50 km/h' },
          { id: 'opt_b', text: '60 km/h' },
          { id: 'opt_c', text: '70 km/h' }
        ],
        correctAnswer: [{ id: 'opt_b' }],
        explanation: 'INTERNAL EXPLANATION: 120 / 2 = 60 km/h.'
      }
    });
    aptitudeVersionId = aptitudeVer.id;

    // 3. Create an unrelated QuestionVersion (not in contest)
    const unrelatedQ = await prisma.practiceQuestion.create({
      data: {
        type: 'TECHNICAL',
        format: 'SINGLE_CHOICE',
        category: 'NETWORKS',
        difficulty: 'HARD'
      }
    });
    const unrelatedVer = await prisma.questionVersion.create({
      data: {
        questionId: unrelatedQ.id,
        versionNumber: 1,
        title: 'BGP Routing',
        statement: 'Is BGP a path-vector protocol?'
      }
    });
    unrelatedVersionId = unrelatedVer.id;

    // 4. Create question for historical version pinning test
    const vq = await prisma.practiceQuestion.create({
      data: {
        type: 'APTITUDE',
        format: 'SINGLE_CHOICE',
        category: 'LOGICAL',
        difficulty: 'EASY'
      }
    });
    versionTestQuestionId = vq.id;

    const v1 = await prisma.questionVersion.create({
      data: {
        questionId: versionTestQuestionId,
        versionNumber: 1,
        title: 'Pinned V1 Question',
        statement: 'Original V1 Statement',
        correctAnswer: { ans: 'v1' }
      }
    });
    version1Id = v1.id;

    // 5. Create Live Contest (window active now)
    const now = Date.now();
    const liveContest = await contestService.createContest({
      title: 'Google Placement Assessment 2026',
      sipsDriveId: 'sips_drive_google_01',
      collegeId: collegeA,
      startAt: new Date(now - 600000).toISOString(), // started 10m ago
      endAt: new Date(now + 3600000).toISOString(), // ends in 1h
      durationMinutes: 45
    });
    liveContestId = liveContest.id;
    await contestService.addContestQuestion(liveContestId, {
      questionVersionId: codingVersionId,
      section: 'CODING',
      marks: 50,
      order: 1
    });
    await contestService.addContestQuestion(liveContestId, {
      questionVersionId: aptitudeVersionId,
      section: 'APTITUDE',
      marks: 10,
      negativeMarks: 2.5,
      order: 2
    });
    await contestService.publishContest(liveContestId);
    await contestService.markContestLive(liveContestId);

    // 6. Create Future Contest (starts in 2h)
    const futureContest = await contestService.createContest({
      title: 'Microsoft Upcoming Assessment',
      sipsDriveId: 'sips_drive_msft_02',
      collegeId: collegeA,
      startAt: new Date(now + 7200000).toISOString(),
      endAt: new Date(now + 10800000).toISOString(),
      durationMinutes: 60
    });
    futureContestId = futureContest.id;
    await contestService.addContestQuestion(futureContestId, {
      questionVersionId: codingVersionId,
      section: 'CODING',
      marks: 50
    });
    await contestService.publishContest(futureContestId);

    // 7. Create Ended Contest (ended 30m ago)
    const endedContest = await contestService.createContest({
      title: 'Amazon Concluded Assessment',
      sipsDriveId: 'sips_drive_amzn_03',
      collegeId: collegeA,
      startAt: new Date(now - 7200000).toISOString(),
      endAt: new Date(now - 1800000).toISOString(),
      durationMinutes: 60
    });
    endedContestId = endedContest.id;
    await contestService.addContestQuestion(endedContestId, {
      questionVersionId: aptitudeVersionId,
      section: 'APTITUDE',
      marks: 10
    });
    await contestService.publishContest(endedContestId);
    await contestService.markContestLive(endedContestId);
    await contestService.markContestEnded(endedContestId);

    // 8. Create Cancelled Contest
    const cancelledContest = await contestService.createContest({
      title: 'Cancelled Assessment',
      sipsDriveId: 'sips_drive_canc_04',
      collegeId: collegeA,
      startAt: new Date(now - 600000).toISOString(),
      endAt: new Date(now + 3600000).toISOString(),
      durationMinutes: 30
    });
    cancelledContestId = cancelledContest.id;
    await contestService.cancelContest(cancelledContestId);
  });

  afterAll(async () => {
    await cleanDatabase(prisma);
    await prisma.$disconnect();
  });

  describe('1. Identity & Tenant Authentication', () => {
    test('rejects request without student identity headers with 401', async () => {
      const res = await request(app).get('/api/contests/available');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/missing student identity/i);
    });

    test('rejects request with missing college context header with 401', async () => {
      const res = await request(app)
        .get('/api/contests/available')
        .set('x-student-id', studentEligible);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/missing institution context/i);
    });

    test('ignores client-supplied studentId in request body', async () => {
      const res = await request(app)
        .post(`/api/contests/${liveContestId}/attempts/start`)
        .set('x-student-id', 'student_auth_authoritative')
        .set('x-college-id', collegeA)
        .send({
          studentId: 'student_forged_in_body',
          collegeId: 'college_forged_in_body'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      // Authoritative studentId from header was used, not body
      expect(res.body.data.attempt.studentId).toBe('student_auth_authoritative');
      expect(res.body.data.attempt.collegeId).toBe(collegeA);
    });
  });

  describe('2. Student Contest Discovery & Tenant Isolation', () => {
    test('returns available contests for student college only', async () => {
      const res = await request(app)
        .get('/api/contests/available')
        .set('x-student-id', studentEligible)
        .set('x-college-id', collegeA);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);

      const returnedIds = res.body.data.map((c) => c.id);
      expect(returnedIds).toContain(liveContestId);
      expect(returnedIds).toContain(futureContestId);
      expect(returnedIds).not.toContain(endedContestId);
      expect(returnedIds).not.toContain(cancelledContestId);
    });

    test('student from College B receives 403 TENANT_MISMATCH when accessing College A contest', async () => {
      const res = await request(app)
        .get(`/api/contests/${liveContestId}/student`)
        .set('x-student-id', studentOtherCollege)
        .set('x-college-id', collegeB);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/does not belong to your institution/i);
    });

    test('returns student-safe contest details without answer keys or hidden tests', async () => {
      const res = await request(app)
        .get(`/api/contests/${liveContestId}/student`)
        .set('x-student-id', studentEligible)
        .set('x-college-id', collegeA);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(liveContestId);
      expect(res.body.data.totalQuestions).toBe(2);
      expect(res.body.data.totalMarks).toBe(60);
      expect(res.body.data.sectionBreakdown.CODING.marks).toBe(50);
      expect(res.body.data.sectionBreakdown.APTITUDE.marks).toBe(10);

      // Security check: must not expose answers
      expect(res.body.data.correctAnswer).toBeUndefined();
      expect(res.body.data.explanation).toBeUndefined();
    });
  });

  describe('3. SIPS Drive Eligibility Enforcement', () => {
    test('eligible student successfully starts attempt', async () => {
      const res = await request(app)
        .post(`/api/contests/${liveContestId}/attempts/start`)
        .set('x-student-id', studentEligible)
        .set('x-college-id', collegeA);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.attempt.id).toBeDefined();
      expect(res.body.data.attempt.status).toBe('IN_PROGRESS');
      expect(res.body.data.attempt.studentId).toBe(studentEligible);
      expect(res.body.data.attempt.totalMarks).toBe(60);
      expect(res.body.data.effectiveDeadline).toBeDefined();
      expect(res.body.data.remainingMs).toBeGreaterThan(0);
    });

    test('ineligible student is rejected with 403 CONTEST_INELIGIBLE and reasons', async () => {
      const res = await request(app)
        .post(`/api/contests/${liveContestId}/attempts/start`)
        .set('x-student-id', studentIneligible)
        .set('x-college-id', collegeA);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/not eligible/i);
      expect(res.body.errors).toBeDefined();
    });

    test('when SIPS eligibility service is unavailable, fails closed with 503', async () => {
      const res = await request(app)
        .post(`/api/contests/${liveContestId}/attempts/start`)
        .set('x-student-id', 'student_service_down_user')
        .set('x-college-id', collegeA);

      expect(res.status).toBe(503);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/service temporarily unavailable/i);
    });
  });

  describe('4. One Attempt Rule & Concurrency Safety', () => {
    test('duplicate start attempt request returns 409 ATTEMPT_ALREADY_EXISTS', async () => {
      // studentEligible already started an attempt in earlier test
      const res = await request(app)
        .post(`/api/contests/${liveContestId}/attempts/start`)
        .set('x-student-id', studentEligible)
        .set('x-college-id', collegeA);

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/already exists/i);
    });
  });

  describe('5. Contest State & Timing Boundaries', () => {
    test('rejects attempt start before contest startAt with 400 CONTEST_NOT_STARTED', async () => {
      const res = await request(app)
        .post(`/api/contests/${futureContestId}/attempts/start`)
        .set('x-student-id', 'student_future_tester')
        .set('x-college-id', collegeA);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/has not started yet/i);
    });

    test('rejects attempt start after contest endAt with 400 CONTEST_ENDED', async () => {
      const res = await request(app)
        .post(`/api/contests/${endedContestId}/attempts/start`)
        .set('x-student-id', 'student_ended_tester')
        .set('x-college-id', collegeA);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/has already ended/i);
    });

    test('rejects attempt start on CANCELLED contest with 400 CONTEST_CANCELLED', async () => {
      const res = await request(app)
        .post(`/api/contests/${cancelledContestId}/attempts/start`)
        .set('x-student-id', 'student_cancelled_tester')
        .set('x-college-id', collegeA);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/cancelled/i);
    });

    test('late start attempt effective deadline is truncated at contest endAt', async () => {
      const now = Date.now();
      // Contest ends in 15 minutes, duration is 60 minutes
      const shortWindowContest = await contestService.createContest({
        title: 'Short Window Contest',
        sipsDriveId: 'sips_drive_short_01',
        collegeId: collegeA,
        startAt: new Date(now - 1800000).toISOString(),
        endAt: new Date(now + 900000).toISOString(), // 15 mins from now
        durationMinutes: 60
      });
      await contestService.addContestQuestion(shortWindowContest.id, {
        questionVersionId: aptitudeVersionId,
        section: 'APTITUDE',
        marks: 10
      });
      await contestService.publishContest(shortWindowContest.id);
      await contestService.markContestLive(shortWindowContest.id);

      const res = await request(app)
        .post(`/api/contests/${shortWindowContest.id}/attempts/start`)
        .set('x-student-id', 'student_late_starter')
        .set('x-college-id', collegeA);

      expect(res.status).toBe(201);
      const effectiveDeadlineMs = new Date(res.body.data.effectiveDeadline).getTime();
      const contestEndMs = new Date(shortWindowContest.endAt).getTime();

      // Deadline must match contest endAt, NOT startedAt + 60m
      expect(Math.abs(effectiveDeadlineMs - contestEndMs)).toBeLessThan(1000);
    });
  });

  describe('6. Question Delivery Security & Information Hiding', () => {
    let attemptId;

    beforeAll(async () => {
      const res = await request(app)
        .post(`/api/contests/${liveContestId}/attempts/start`)
        .set('x-student-id', 'student_security_tester')
        .set('x-college-id', collegeA);
      attemptId = res.body.data.attempt.id;
    });

    test('delivers pinned questions with strict answer and hidden test scrubbing', async () => {
      const res = await request(app)
        .get(`/api/contests/${liveContestId}/attempts/${attemptId}/questions`)
        .set('x-student-id', 'student_security_tester')
        .set('x-college-id', collegeA);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.questions.length).toBe(2);

      const questions = res.body.data.questions;
      for (const q of questions) {
        const ver = q.questionVersion;
        // Security checks:
        expect(ver.correctAnswer).toBeUndefined();
        expect(ver.explanation).toBeUndefined();

        if (ver.codingProblem) {
          // Verify public test cases are present
          expect(ver.codingProblem.testCases.length).toBe(1);
          expect(ver.codingProblem.testCases[0].isHidden).toBe(false);
          expect(ver.codingProblem.testCases[0].input).toBe('1->2->3');
          // Verify hidden test cases are NEVER exposed
          const hasHidden = ver.codingProblem.testCases.some((tc) => tc.isHidden);
          expect(hasHidden).toBe(false);
        }
      }
    });

    test('another student receives 403 ATTEMPT_ACCESS_DENIED when attempting to read questions', async () => {
      const res = await request(app)
        .get(`/api/contests/${liveContestId}/attempts/${attemptId}/questions`)
        .set('x-student-id', 'student_unauthorized_attacker')
        .set('x-college-id', collegeA);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/do not have access/i);
    });
  });

  describe('7. Response Recording & Persistence', () => {
    let attemptId;

    beforeAll(async () => {
      const res = await request(app)
        .post(`/api/contests/${liveContestId}/attempts/start`)
        .set('x-student-id', 'student_response_tester')
        .set('x-college-id', collegeA);
      attemptId = res.body.data.attempt.id;
    });

    test('records response for pinned question successfully', async () => {
      const res = await request(app)
        .post(`/api/contests/${liveContestId}/attempts/${attemptId}/responses`)
        .set('x-student-id', 'student_response_tester')
        .set('x-college-id', collegeA)
        .send({
          questionVersionId: aptitudeVersionId,
          answerData: { selectedOptionId: 'opt_b' }
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.questionVersionId).toBe(aptitudeVersionId);
      expect(res.body.data.answerData).toEqual({ selectedOptionId: 'opt_b' });
    });

    test('updates previously saved response while IN_PROGRESS', async () => {
      const res = await request(app)
        .post(`/api/contests/${liveContestId}/attempts/${attemptId}/responses`)
        .set('x-student-id', 'student_response_tester')
        .set('x-college-id', collegeA)
        .send({
          questionVersionId: aptitudeVersionId,
          answerData: { selectedOptionId: 'opt_c' } // changed answer
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.answerData).toEqual({ selectedOptionId: 'opt_c' });
    });

    test('rejects response for unrelated question not in contest with 404 QUESTION_NOT_IN_ATTEMPT', async () => {
      const res = await request(app)
        .post(`/api/contests/${liveContestId}/attempts/${attemptId}/responses`)
        .set('x-student-id', 'student_response_tester')
        .set('x-college-id', collegeA)
        .send({
          questionVersionId: unrelatedVersionId,
          answerData: { selectedOptionId: 'opt_x' }
        });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/does not belong to this contest/i);
    });
  });

  describe('8. Reconnect / Resume & Server Timing Calculation', () => {
    test('reconnecting student retrieves accurate remaining time and saved answers', async () => {
      // 1. Start attempt and save response
      const startRes = await request(app)
        .post(`/api/contests/${liveContestId}/attempts/start`)
        .set('x-student-id', 'student_reconnect_user')
        .set('x-college-id', collegeA);

      const attemptId = startRes.body.data.attempt.id;

      await request(app)
        .post(`/api/contests/${liveContestId}/attempts/${attemptId}/responses`)
        .set('x-student-id', 'student_reconnect_user')
        .set('x-college-id', collegeA)
        .send({
          questionVersionId: aptitudeVersionId,
          answerData: { selectedOptionId: 'opt_b' }
        });

      // 2. Reconnect (get questions & state)
      const reconnectRes = await request(app)
        .get(`/api/contests/${liveContestId}/attempts/${attemptId}/questions`)
        .set('x-student-id', 'student_reconnect_user')
        .set('x-college-id', collegeA);

      expect(reconnectRes.status).toBe(200);
      expect(reconnectRes.body.data.status).toBe('IN_PROGRESS');
      expect(reconnectRes.body.data.remainingMs).toBeGreaterThan(0);
      expect(reconnectRes.body.data.savedResponses[aptitudeVersionId]).toBeDefined();
      expect(reconnectRes.body.data.savedResponses[aptitudeVersionId].answerData).toEqual({
        selectedOptionId: 'opt_b'
      });
    });
  });

  describe('9. Timeout Enforcement & Response Preservation', () => {
    test('expired attempt transitions to TIMED_OUT and rejects subsequent responses', async () => {
      // Create attempt with expired startedAt in DB directly to test timeout
      const pastStart = new Date(Date.now() - 7200000); // 2 hours ago
      const expiredAttempt = await prisma.contestAttempt.create({
        data: {
          contestId: liveContestId,
          studentId: 'student_timeout_tester',
          collegeId: collegeA,
          status: 'IN_PROGRESS',
          startedAt: pastStart,
          totalMarks: 60
        }
      });

      // Save a response prior to timeout check
      await prisma.questionResponse.create({
        data: {
          contestAttemptId: expiredAttempt.id,
          questionVersionId: aptitudeVersionId,
          answerData: { selectedOptionId: 'opt_b' },
          answeredAt: pastStart
        }
      });

      // Attempt to submit new response after deadline
      const submitRes = await request(app)
        .post(`/api/contests/${liveContestId}/attempts/${expiredAttempt.id}/responses`)
        .set('x-student-id', 'student_timeout_tester')
        .set('x-college-id', collegeA)
        .send({
          questionVersionId: codingVersionId,
          answerData: { sourceCode: 'print(1)' }
        });

      expect(submitRes.status).toBe(400);
      expect(submitRes.body.success).toBe(false);
      expect(submitRes.body.message).toMatch(/deadline has passed/i);

      // Verify attempt status was updated to TIMED_OUT
      const checkRes = await request(app)
        .get(`/api/contests/${liveContestId}/attempts/${expiredAttempt.id}`)
        .set('x-student-id', 'student_timeout_tester')
        .set('x-college-id', collegeA);

      expect(checkRes.status).toBe(200);
      expect(checkRes.body.data.status).toBe('TIMED_OUT');
      expect(checkRes.body.data.remainingMs).toBe(0);

      // Verify previously recorded response is preserved
      const savedCount = await prisma.questionResponse.count({
        where: { contestAttemptId: expiredAttempt.id }
      });
      expect(savedCount).toBe(1);
    });
  });

  describe('10. Historical Question Version Integrity', () => {
    test('active attempt continues referencing v1 even after v2 is created', async () => {
      // 1. Create contest with v1
      const histContest = await contestService.createContest({
        title: 'Hist Version Contest',
        sipsDriveId: 'sips_drive_hist_01',
        collegeId: collegeA,
        startAt: new Date(Date.now() - 600000).toISOString(),
        endAt: new Date(Date.now() + 3600000).toISOString(),
        durationMinutes: 45
      });
      await contestService.addContestQuestion(histContest.id, {
        questionVersionId: version1Id,
        section: 'APTITUDE',
        marks: 10
      });
      await contestService.publishContest(histContest.id);
      await contestService.markContestLive(histContest.id);

      // 2. Student starts attempt with v1
      const startRes = await request(app)
        .post(`/api/contests/${histContest.id}/attempts/start`)
        .set('x-student-id', 'student_hist_tester')
        .set('x-college-id', collegeA);

      const attemptId = startRes.body.data.attempt.id;

      // 3. Admin creates QuestionVersion v2 for that question
      await prisma.questionVersion.create({
        data: {
          questionId: versionTestQuestionId,
          versionNumber: 2,
          title: 'Updated V2 Question Title',
          statement: 'Updated V2 Statement'
        }
      });

      // 4. Student gets questions
      const questionsRes = await request(app)
        .get(`/api/contests/${histContest.id}/attempts/${attemptId}/questions`)
        .set('x-student-id', 'student_hist_tester')
        .set('x-college-id', collegeA);

      expect(questionsRes.status).toBe(200);
      expect(questionsRes.body.data.questions.length).toBe(1);
      expect(questionsRes.body.data.questions[0].questionVersionId).toBe(version1Id);
      expect(questionsRes.body.data.questions[0].questionVersion.title).toBe('Pinned V1 Question');
      expect(questionsRes.body.data.questions[0].questionVersion.versionNumber).toBe(1);
    });
  });
});
