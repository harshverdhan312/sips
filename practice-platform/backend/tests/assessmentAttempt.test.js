const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const prisma = require('../src/utils/prisma');
const config = require('../src/config');
const { cleanDatabase } = require('./testHelper');
const sipsEligibilityService = require('../src/services/sipsEligibilityService');
const judge0Service = require('../src/services/judge0Service');

describe('Phase 7G — Assessment Runtime & Student Attempts Test Suite', () => {
  const studentAToken = jwt.sign(
    { id: 'student-rvce-01', role: 'STUDENT', collegeId: 'college-rvce' },
    config.jwtSecret,
    { algorithm: 'HS256' }
  );

  const studentBToken = jwt.sign(
    { id: 'student-rvce-02', role: 'STUDENT', collegeId: 'college-rvce' },
    config.jwtSecret,
    { algorithm: 'HS256' }
  );

  const studentPesToken = jwt.sign(
    { id: 'student-pes-01', role: 'STUDENT', collegeId: 'college-pes' },
    config.jwtSecret,
    { algorithm: 'HS256' }
  );

  let globalPublishedAssessment;
  let draftAssessment;
  let archivedAssessment;
  let collegeSpecificAssessment;
  let driveAssessment;
  let aptitudeQ, technicalQ, codingQ;
  let aptVersion, techVersion, codeVersion;

  beforeAll(async () => {
    await cleanDatabase(prisma);

    // 1. Seed Aptitude MCQ Question
    aptitudeQ = await prisma.practiceQuestion.create({
      data: {
        externalId: 'APT-001',
        sourceNamespace: 'sips-test',
        type: 'APTITUDE',
        format: 'SINGLE_CHOICE',
        category: 'QUANTITATIVE',
        difficulty: 'EASY',
        status: 'ACTIVE',
        sourceType: 'ORIGINAL',
        versions: {
          create: {
            versionNumber: 1,
            title: 'Time and Distance',
            statement: 'A car travels 120 km in 2 hours. What is its speed?',
            options: [
              { id: 'A', text: '50 km/h' },
              { id: 'B', text: '60 km/h' },
              { id: 'C', text: '70 km/h' }
            ],
            correctAnswer: { id: 'B' },
            explanation: 'Speed = Distance / Time = 120 / 2 = 60 km/h.'
          }
        }
      },
      include: { versions: true }
    });
    aptVersion = aptitudeQ.versions[0];

    // 2. Seed Technical MCQ Question
    technicalQ = await prisma.practiceQuestion.create({
      data: {
        externalId: 'TECH-001',
        sourceNamespace: 'sips-test',
        type: 'TECHNICAL',
        format: 'SINGLE_CHOICE',
        category: 'DBMS',
        difficulty: 'MEDIUM',
        status: 'ACTIVE',
        sourceType: 'ORIGINAL',
        versions: {
          create: {
            versionNumber: 1,
            title: 'SQL Normalization',
            statement: 'Which normal form eliminates transitive dependency?',
            options: [
              { id: '1', text: '1NF' },
              { id: '2', text: '2NF' },
              { id: '3', text: '3NF' }
            ],
            correctAnswer: { id: '3' },
            explanation: '3NF eliminates transitive dependencies.'
          }
        }
      },
      include: { versions: true }
    });
    techVersion = technicalQ.versions[0];

    // 3. Seed Coding Question with CodingProblem and Test Cases
    codingQ = await prisma.practiceQuestion.create({
      data: {
        externalId: 'CODE-001',
        sourceNamespace: 'sips-test',
        type: 'CODING',
        format: 'CODING',
        category: 'DSA',
        subcategory: 'ARRAYS',
        difficulty: 'EASY',
        status: 'ACTIVE',
        sourceType: 'ORIGINAL',
        versions: {
          create: {
            versionNumber: 1,
            title: 'Sum of Array',
            statement: 'Given an array of integers, return the sum.',
            codingProblem: {
              create: {
                constraints: '1 <= N <= 1000',
                timeLimitMs: 2000,
                memoryLimitKb: 128000,
                maxMarks: 50,
                testCases: {
                  create: [
                    { input: '3\n1 2 3', expectedOutput: '6', isHidden: false, weight: 25, order: 1 },
                    { input: '2\n10 20', expectedOutput: '30', isHidden: true, weight: 25, order: 2 }
                  ]
                }
              }
            }
          }
        }
      },
      include: {
        versions: {
          include: {
            codingProblem: {
              include: { testCases: true }
            }
          }
        }
      }
    });
    codeVersion = codingQ.versions[0];

    // 4. Seed Global Published Assessment with 3 questions
    globalPublishedAssessment = await prisma.assessment.create({
      data: {
        title: 'SIPS General Aptitude & Coding Assessment',
        description: 'Comprehensive entrance assessment',
        type: 'PRACTICE_SET',
        status: 'PUBLISHED',
        collegeId: null,
        durationMinutes: 60,
        totalMarks: 70,
        questions: {
          create: [
            {
              questionVersionId: aptVersion.id,
              section: 'APTITUDE',
              order: 1,
              marks: 10,
              negativeMarks: 2
            },
            {
              questionVersionId: techVersion.id,
              section: 'TECHNICAL',
              order: 2,
              marks: 10,
              negativeMarks: 2
            },
            {
              questionVersionId: codeVersion.id,
              section: 'CODING',
              order: 3,
              marks: 50,
              negativeMarks: 0
            }
          ]
        }
      }
    });

    // 5. Seed Draft Assessment
    draftAssessment = await prisma.assessment.create({
      data: {
        title: 'Draft Assessment In Progress',
        type: 'PRACTICE_SET',
        status: 'DRAFT',
        collegeId: null,
        durationMinutes: 30,
        questions: {
          create: [
            {
              questionVersionId: aptVersion.id,
              section: 'APTITUDE',
              order: 1,
              marks: 10
            }
          ]
        }
      }
    });

    // 6. Seed Archived Assessment
    archivedAssessment = await prisma.assessment.create({
      data: {
        title: 'Old Archived Assessment',
        type: 'PRACTICE_SET',
        status: 'ARCHIVED',
        collegeId: null,
        durationMinutes: 30
      }
    });

    // 7. Seed College-Specific Assessment (RVCE only)
    collegeSpecificAssessment = await prisma.assessment.create({
      data: {
        title: 'RVCE Internal Placement Screening',
        type: 'PLACEMENT_ASSESSMENT',
        status: 'PUBLISHED',
        collegeId: 'college-rvce',
        durationMinutes: 45,
        totalMarks: 20,
        questions: {
          create: [
            {
              questionVersionId: aptVersion.id,
              section: 'APTITUDE',
              order: 1,
              marks: 10
            },
            {
              questionVersionId: techVersion.id,
              section: 'TECHNICAL',
              order: 2,
              marks: 10
            }
          ]
        }
      }
    });

    // 8. Seed Placement Drive Assessment with sipsDriveId
    driveAssessment = await prisma.assessment.create({
      data: {
        title: 'TCS Placement Drive Screening 2026',
        type: 'PLACEMENT_ASSESSMENT',
        status: 'PUBLISHED',
        collegeId: 'college-rvce',
        sipsDriveId: 'drive-tcs-001',
        durationMinutes: 60,
        totalMarks: 10,
        questions: {
          create: [
            {
              questionVersionId: aptVersion.id,
              section: 'APTITUDE',
              order: 1,
              marks: 10
            }
          ]
        }
      }
    });
  });

  afterAll(async () => {
    await cleanDatabase(prisma);
    sipsEligibilityService.resetMockProvider();
  });

  describe('1. Assessment Discovery & Details', () => {
    test('student can list available PUBLISHED assessments', async () => {
      const res = await request(app)
        .get('/api/assessments/available')
        .set('Authorization', `Bearer ${studentAToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);

      const titles = res.body.data.map((a) => a.title);
      expect(titles).toContain('SIPS General Aptitude & Coding Assessment');
      expect(titles).toContain('RVCE Internal Placement Screening');
      expect(titles).not.toContain('Draft Assessment In Progress');
      expect(titles).not.toContain('Old Archived Assessment');
    });

    test('PES student does not see RVCE college-specific assessment', async () => {
      const res = await request(app)
        .get('/api/assessments/available')
        .set('Authorization', `Bearer ${studentPesToken}`)
        .expect(200);

      const titles = res.body.data.map((a) => a.title);
      expect(titles).toContain('SIPS General Aptitude & Coding Assessment');
      expect(titles).not.toContain('RVCE Internal Placement Screening');
    });

    test('student can get details of published assessment', async () => {
      const res = await request(app)
        .get(`/api/assessments/${globalPublishedAssessment.id}`)
        .set('Authorization', `Bearer ${studentAToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(globalPublishedAssessment.id);
      expect(res.body.data.durationMinutes).toBe(60);
      expect(res.body.data.totalQuestions).toBe(3);
      expect(res.body.data.sectionBreakdown.APTITUDE.count).toBe(1);
      expect(res.body.data.sectionBreakdown.TECHNICAL.count).toBe(1);
      expect(res.body.data.sectionBreakdown.CODING.count).toBe(1);
    });

    test('rejects details request for DRAFT assessment', async () => {
      await request(app)
        .get(`/api/assessments/${draftAssessment.id}`)
        .set('Authorization', `Bearer ${studentAToken}`)
        .expect(404);
    });

    test('rejects details request for assessment from another college', async () => {
      await request(app)
        .get(`/api/assessments/${collegeSpecificAssessment.id}`)
        .set('Authorization', `Bearer ${studentPesToken}`)
        .expect(403);
    });
  });

  describe('2. SIPS Drive Eligibility & Fail-Closed Behavior', () => {
    test('eligible student can access drive assessment', async () => {
      const res = await request(app)
        .get(`/api/assessments/${driveAssessment.id}`)
        .set('Authorization', `Bearer ${studentAToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.isEligible).toBe(true);
    });

    test('ineligible student is rejected from starting drive assessment', async () => {
      const ineligibleToken = jwt.sign(
        { id: 'student-ineligible-01', role: 'STUDENT', collegeId: 'college-rvce' },
        config.jwtSecret,
        { algorithm: 'HS256' }
      );

      const res = await request(app)
        .post(`/api/assessments/${driveAssessment.id}/attempts/start`)
        .set('Authorization', `Bearer ${ineligibleToken}`)
        .expect(403);

      expect(res.body.message).toMatch(/not eligible/i);
    });

    test('SIPS eligibility service outage fails closed with 503', async () => {
      const serviceDownToken = jwt.sign(
        { id: 'student-service_down-01', role: 'STUDENT', collegeId: 'college-rvce' },
        config.jwtSecret,
        { algorithm: 'HS256' }
      );

      const res = await request(app)
        .get(`/api/assessments/${driveAssessment.id}`)
        .set('Authorization', `Bearer ${serviceDownToken}`)
        .expect(503);

      expect(res.body.message).toMatch(/temporarily unavailable/i);
    });
  });

  describe('3. Attempt Lifecycle & 1-Attempt Policy', () => {
    let studentAAttemptId;

    test('student can start published assessment and receives server-calculated deadline', async () => {
      const res = await request(app)
        .post(`/api/assessments/${globalPublishedAssessment.id}/attempts/start`)
        .set('Authorization', `Bearer ${studentAToken}`)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.status).toBe('IN_PROGRESS');
      expect(res.body.data.startedAt).toBeDefined();
      expect(res.body.data.effectiveDeadline).toBeDefined();
      expect(res.body.data.totalMarks).toBe(70);
      expect(res.body.data.questionCount).toBe(3);

      studentAAttemptId = res.body.data.id;
    });

    test('repeating start returns the existing IN_PROGRESS attempt (one official attempt policy)', async () => {
      const res = await request(app)
        .post(`/api/assessments/${globalPublishedAssessment.id}/attempts/start`)
        .set('Authorization', `Bearer ${studentAToken}`)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(studentAAttemptId);
      expect(res.body.data.status).toBe('IN_PROGRESS');
    });

    test('student can retrieve own attempt by ID', async () => {
      const res = await request(app)
        .get(`/api/assessments/${globalPublishedAssessment.id}/attempts/${studentAAttemptId}`)
        .set('Authorization', `Bearer ${studentAToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(studentAAttemptId);
      expect(res.body.data.status).toBe('IN_PROGRESS');
    });

    test('IDOR protection: Student B cannot retrieve Student A attempt', async () => {
      const res = await request(app)
        .get(`/api/assessments/${globalPublishedAssessment.id}/attempts/${studentAAttemptId}`)
        .set('Authorization', `Bearer ${studentBToken}`)
        .expect(403);

      expect(res.body.message).toMatch(/belongs to another student/i);
    });

    test('cannot start DRAFT assessment', async () => {
      await request(app)
        .post(`/api/assessments/${draftAssessment.id}/attempts/start`)
        .set('Authorization', `Bearer ${studentAToken}`)
        .expect(400);
    });

    test('cannot start ARCHIVED assessment', async () => {
      await request(app)
        .post(`/api/assessments/${archivedAssessment.id}/attempts/start`)
        .set('Authorization', `Bearer ${studentAToken}`)
        .expect(400);
    });
  });

  describe('4. Question Delivery & Safe Serialization', () => {
    let attemptId;

    beforeAll(async () => {
      const res = await request(app)
        .post(`/api/assessments/${globalPublishedAssessment.id}/attempts/start`)
        .set('Authorization', `Bearer ${studentBToken}`)
        .expect(201);
      attemptId = res.body.data.id;
    });

    test('delivers questions in deterministic order without exposing answer keys or hidden tests', async () => {
      const res = await request(app)
        .get(`/api/assessments/${globalPublishedAssessment.id}/attempts/${attemptId}/questions`)
        .set('Authorization', `Bearer ${studentBToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(3);

      const [q1, q2, q3] = res.body.data;
      expect(q1.section).toBe('APTITUDE');
      expect(q1.marks).toBe(10);
      expect(q1.questionVersion.correctAnswer).toBeUndefined();
      expect(q1.questionVersion.explanation).toBeUndefined();

      expect(q2.section).toBe('TECHNICAL');
      expect(q2.marks).toBe(10);
      expect(q2.questionVersion.correctAnswer).toBeUndefined();

      expect(q3.section).toBe('CODING');
      expect(q3.marks).toBe(50);
      expect(q3.questionVersion.codingProblem).toBeDefined();
      // Only public test cases delivered
      expect(q3.questionVersion.codingProblem.testCases.length).toBe(1);
      expect(q3.questionVersion.codingProblem.testCases[0].isHidden).toBe(false);
    });

    test('rejects questions fetch for another student attempt', async () => {
      await request(app)
        .get(`/api/assessments/${globalPublishedAssessment.id}/attempts/${attemptId}/questions`)
        .set('Authorization', `Bearer ${studentAToken}`)
        .expect(403);
    });
  });

  describe('5. Autosave Responses & Validation', () => {
    let attemptId;

    beforeAll(async () => {
      const attempt = await prisma.assessmentAttempt.findUnique({
        where: { assessmentId_studentId: { assessmentId: globalPublishedAssessment.id, studentId: 'student-rvce-01' } }
      });
      attemptId = attempt.id;
    });

    test('student can save MCQ response', async () => {
      const res = await request(app)
        .post(`/api/assessments/${globalPublishedAssessment.id}/attempts/${attemptId}/responses`)
        .set('Authorization', `Bearer ${studentAToken}`)
        .send({
          questionVersionId: aptVersion.id,
          answerData: { id: 'B' }
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.questionVersionId).toBe(aptVersion.id);
      expect(res.body.data.answerData).toEqual({ id: 'B' });
    });

    test('updating MCQ response is idempotent', async () => {
      const res = await request(app)
        .post(`/api/assessments/${globalPublishedAssessment.id}/attempts/${attemptId}/responses`)
        .set('Authorization', `Bearer ${studentAToken}`)
        .send({
          questionVersionId: aptVersion.id,
          answerData: { id: 'A' }
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.answerData).toEqual({ id: 'A' });

      // Change back to correct answer 'B'
      await request(app)
        .post(`/api/assessments/${globalPublishedAssessment.id}/attempts/${attemptId}/responses`)
        .set('Authorization', `Bearer ${studentAToken}`)
        .send({
          questionVersionId: aptVersion.id,
          answerData: { id: 'B' }
        })
        .expect(200);
    });

    test('also save response for technical question', async () => {
      await request(app)
        .post(`/api/assessments/${globalPublishedAssessment.id}/attempts/${attemptId}/responses`)
        .set('Authorization', `Bearer ${studentAToken}`)
        .send({
          questionVersionId: techVersion.id,
          answerData: { id: '3' } // Correct answer
        })
        .expect(200);
    });

    test('rejects response save for question not in assessment', async () => {
      // Create unrelated question
      const otherQ = await prisma.practiceQuestion.create({
        data: {
          externalId: 'UNRELATED-001',
          sourceNamespace: 'sips-test',
          type: 'APTITUDE',
          format: 'SINGLE_CHOICE',
          category: 'VERBAL',
          difficulty: 'EASY',
          status: 'ACTIVE',
          sourceType: 'ORIGINAL',
          versions: {
            create: {
              versionNumber: 1,
              title: 'Unrelated Question',
              statement: 'Not in assessment.',
              correctAnswer: { id: '1' }
            }
          }
        },
        include: { versions: true }
      });

      await request(app)
        .post(`/api/assessments/${globalPublishedAssessment.id}/attempts/${attemptId}/responses`)
        .set('Authorization', `Bearer ${studentAToken}`)
        .send({
          questionVersionId: otherQ.versions[0].id,
          answerData: { id: '1' }
        })
        .expect(400);
    });

    test('IDOR: Student B cannot save response to Student A attempt', async () => {
      await request(app)
        .post(`/api/assessments/${globalPublishedAssessment.id}/attempts/${attemptId}/responses`)
        .set('Authorization', `Bearer ${studentBToken}`)
        .send({
          questionVersionId: aptVersion.id,
          answerData: { id: 'C' }
        })
        .expect(403);
    });
  });

  describe('6. Coding Execution in Assessment Context', () => {
    let attemptId;

    beforeAll(async () => {
      const attempt = await prisma.assessmentAttempt.findUnique({
        where: { assessmentId_studentId: { assessmentId: globalPublishedAssessment.id, studentId: 'student-rvce-01' } }
      });
      attemptId = attempt.id;
    });

    test('can RUN code against public test cases only', async () => {
      // Mock Judge0 batch submit and poll
      jest.spyOn(judge0Service, 'submitBatch').mockResolvedValueOnce([{ token: 'token-run-1' }]);
      jest.spyOn(judge0Service, 'pollBatch').mockResolvedValueOnce([
        {
          token: 'token-run-1',
          status_id: 3,
          stdout: '6\n',
          time: '0.02',
          memory: 1024
        }
      ]);

      const res = await request(app)
        .post('/api/coding/execute/run')
        .set('Authorization', `Bearer ${studentAToken}`)
        .send({
          questionVersionId: codeVersion.id,
          assessmentAttemptId: attemptId,
          language: 'python',
          sourceCode: 'n = int(input())\narr = list(map(int, input().split()))\nprint(sum(arr))'
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.mode).toBe('RUN');
      expect(res.body.data.testsTotal).toBe(1); // Only 1 public test case
      expect(res.body.data.status).toBe('ACCEPTED');
    });

    test('can SUBMIT code awarding weighted marks and updating assessment attempt', async () => {
      // Mock Judge0 batch submit and poll for 2 test cases
      jest.spyOn(judge0Service, 'submitBatch').mockResolvedValueOnce([
        { token: 'token-sub-1' },
        { token: 'token-sub-2' }
      ]);
      jest.spyOn(judge0Service, 'pollBatch').mockResolvedValueOnce([
        {
          token: 'token-sub-1',
          status_id: 3,
          stdout: '6\n',
          time: '0.02',
          memory: 1024
        },
        {
          token: 'token-sub-2',
          status_id: 3,
          stdout: '30\n',
          time: '0.02',
          memory: 1024
        }
      ]);

      const res = await request(app)
        .post('/api/coding/execute/submit')
        .set('Authorization', `Bearer ${studentAToken}`)
        .send({
          questionVersionId: codeVersion.id,
          assessmentAttemptId: attemptId,
          language: 'python',
          sourceCode: 'n = int(input())\narr = list(map(int, input().split()))\nprint(sum(arr))'
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.mode).toBe('SUBMIT');
      expect(res.body.data.testsTotal).toBe(2);
      expect(res.body.data.testsPassed).toBe(2);
      expect(res.body.data.earnedMarks).toBe(50);
      expect(res.body.data.status).toBe('ACCEPTED');

      // Hidden test case result is sanitized for student
      const hiddenTr = res.body.data.testResults.find((tr) => tr.isHidden);
      expect(hiddenTr).toBeDefined();
      expect(hiddenTr.input).toBeUndefined();
      expect(hiddenTr.expectedOutput).toBeUndefined();
      expect(hiddenTr.stdout).toBeUndefined();
    });

    test('rejects coding execution on another student attempt', async () => {
      await request(app)
        .post('/api/coding/execute/submit')
        .set('Authorization', `Bearer ${studentBToken}`)
        .send({
          questionVersionId: codeVersion.id,
          assessmentAttemptId: attemptId,
          language: 'python',
          sourceCode: 'print(0)'
        })
        .expect(403);
    });
  });

  describe('7. Final Submission, Server-Side Scoring & Results', () => {
    let attemptId;

    beforeAll(async () => {
      const attempt = await prisma.assessmentAttempt.findUnique({
        where: { assessmentId_studentId: { assessmentId: globalPublishedAssessment.id, studentId: 'student-rvce-01' } }
      });
      attemptId = attempt.id;
    });

    test('submitting assessment calculates section and total scores', async () => {
      const res = await request(app)
        .post(`/api/assessments/${globalPublishedAssessment.id}/attempts/${attemptId}/submit`)
        .set('Authorization', `Bearer ${studentAToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.scores).toBeDefined();
      expect(res.body.data.scores.aptitudeScore).toBe(10);
      expect(res.body.data.scores.technicalScore).toBe(10);
      expect(res.body.data.scores.codingScore).toBe(50);
      expect(res.body.data.scores.totalScore).toBe(70);
      expect(res.body.data.scores.totalMarks).toBe(70);

      expect(res.body.data.attempt.status).toBe('FINALIZED');
    });

    test('submitting again is idempotent and returns consistent results', async () => {
      const res = await request(app)
        .post(`/api/assessments/${globalPublishedAssessment.id}/attempts/${attemptId}/submit`)
        .set('Authorization', `Bearer ${studentAToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.scores.totalScore).toBe(70);
    });

    test('get result endpoint returns full breakdown without exposing hidden expected outputs', async () => {
      const res = await request(app)
        .get(`/api/assessments/${globalPublishedAssessment.id}/attempts/${attemptId}/result`)
        .set('Authorization', `Bearer ${studentAToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.scores.totalScore).toBe(70);
      expect(res.body.data.questions.length).toBe(3);

      // Check questions breakdown
      const aptRes = res.body.data.questions.find((q) => q.section === 'APTITUDE');
      expect(aptRes.response.isCorrect).toBe(true);
      expect(aptRes.response.marksAwarded).toBe(10);

      const codeRes = res.body.data.questions.find((q) => q.section === 'CODING');
      expect(codeRes.submission.earnedMarks).toBe(50);
      expect(codeRes.submission.status).toBe('ACCEPTED');
    });

    test('IDOR: Student B cannot view Student A result', async () => {
      await request(app)
        .get(`/api/assessments/${globalPublishedAssessment.id}/attempts/${attemptId}/result`)
        .set('Authorization', `Bearer ${studentBToken}`)
        .expect(403);
    });
  });

  describe('8. Server Deadline Enforcement', () => {
    let expiredAttemptId;

    beforeAll(async () => {
      // Create an expired attempt manually
      const expiredDate = new Date(Date.now() - 1000 * 60 * 10);
      const attempt = await prisma.assessmentAttempt.create({
        data: {
          assessmentId: globalPublishedAssessment.id,
          studentId: 'student-pes-01',
          collegeId: 'college-pes',
          status: 'IN_PROGRESS',
          startedAt: new Date(Date.now() - 1000 * 60 * 70),
          effectiveDeadline: expiredDate,
          totalMarks: 70
        }
      });
      expiredAttemptId = attempt.id;
    });

    test('rejects response save after deadline passes', async () => {
      const res = await request(app)
        .post(`/api/assessments/${globalPublishedAssessment.id}/attempts/${expiredAttemptId}/responses`)
        .set('Authorization', `Bearer ${studentPesToken}`)
        .send({
          questionVersionId: aptVersion.id,
          answerData: { id: 'B' }
        })
        .expect(400);

      expect(res.body.message).toMatch(/deadline has passed/i);
    });

    test('rejects code execution after deadline passes', async () => {
      // Ensure attempt is IN_PROGRESS so deadline check triggers 400 ATTEMPT_TIMED_OUT
      await prisma.assessmentAttempt.update({
        where: { id: expiredAttemptId },
        data: { status: 'IN_PROGRESS' }
      });

      const res = await request(app)
        .post('/api/coding/execute/run')
        .set('Authorization', `Bearer ${studentPesToken}`)
        .send({
          questionVersionId: codeVersion.id,
          assessmentAttemptId: expiredAttemptId,
          language: 'python',
          sourceCode: 'print(1)'
        })
        .expect(400);

      expect(res.body.message).toMatch(/deadline has passed/i);
    });
  });
});
