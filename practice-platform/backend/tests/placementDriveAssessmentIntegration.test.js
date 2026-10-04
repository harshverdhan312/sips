const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const prisma = require('../src/utils/prisma');
const config = require('../src/config');
const sipsEligibilityService = require('../src/services/sipsEligibilityService');

describe('Phase 7H — Placement Drive ↔ Assessment Integration', () => {
  const collegeA = 'college_rvce_01';
  const collegeB = 'college_bmsce_02';

  const studentAEligibleId = 'student_eligible_01';
  const studentAIneligibleId = 'student_ineligible_02';
  const studentBId = 'student_college_b_03';

  const adminTokenA = jwt.sign(
    { id: 'admin_a', collegeId: collegeA, role: 'COLLEGE_ADMIN' },
    config.jwtSecret,
    { algorithm: 'HS256' }
  );

  const adminTokenB = jwt.sign(
    { id: 'admin_b', collegeId: collegeB, role: 'COLLEGE_ADMIN' },
    config.jwtSecret,
    { algorithm: 'HS256' }
  );

  const studentTokenEligible = jwt.sign(
    { id: studentAEligibleId, collegeId: collegeA, role: 'STUDENT' },
    config.jwtSecret,
    { algorithm: 'HS256' }
  );

  const studentTokenIneligible = jwt.sign(
    { id: studentAIneligibleId, collegeId: collegeA, role: 'STUDENT' },
    config.jwtSecret,
    { algorithm: 'HS256' }
  );

  const studentTokenB = jwt.sign(
    { id: studentBId, collegeId: collegeB, role: 'STUDENT' },
    config.jwtSecret,
    { algorithm: 'HS256' }
  );

  let qVersion1Id;
  let qVersion2Id;

  beforeAll(async () => {
    // Seed test questions in database
    const q1 = await prisma.practiceQuestion.create({
      data: {
        type: 'APTITUDE',
        format: 'SINGLE_CHOICE',
        category: 'QUANTITATIVE',
        difficulty: 'EASY',
        status: 'ACTIVE',
        collegeId: collegeA,
        versions: {
          create: {
            versionNumber: 1,
            title: 'Drive Screening Ratio Question',
            statement: 'What is 10 + 20?',
            options: [
              { id: 'opt_1', text: '30' },
              { id: 'opt_2', text: '40' }
            ],
            correctAnswer: { id: 'opt_1' }
          }
        }
      },
      include: { versions: true }
    });
    qVersion1Id = q1.versions[0].id;

    const q2 = await prisma.practiceQuestion.create({
      data: {
        type: 'TECHNICAL',
        format: 'SINGLE_CHOICE',
        category: 'DSA',
        difficulty: 'MEDIUM',
        status: 'ACTIVE',
        collegeId: collegeA,
        versions: {
          create: {
            versionNumber: 1,
            title: 'Drive Screening DSA Question',
            statement: 'Time complexity of Binary Search?',
            options: [
              { id: 'opt_1', text: 'O(log n)' },
              { id: 'opt_2', text: 'O(n)' }
            ],
            correctAnswer: { id: 'opt_1' }
          }
        }
      },
      include: { versions: true }
    });
    qVersion2Id = q2.versions[0].id;
  });

  afterAll(async () => {
    sipsEligibilityService.resetMockProvider();
    await prisma.$disconnect();
  });

  describe('1. Placement Drive Validation & Association Mutations', () => {
    test('should reject draft assessment creation with nonexistent SIPS drive', async () => {
      const res = await request(app)
        .post('/api/admin/assessments')
        .set('Authorization', `Bearer ${adminTokenA}`)
        .send({
          title: 'Invalid Drive Assessment',
          type: 'PLACEMENT_ASSESSMENT',
          durationMinutes: 60,
          sipsDriveId: 'drive_notfound_999'
        });

      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/not found/i);
    });

    test('should reject draft assessment creation with cross-college SIPS drive', async () => {
      const res = await request(app)
        .post('/api/admin/assessments')
        .set('Authorization', `Bearer ${adminTokenA}`)
        .send({
          title: 'Cross College Drive Assessment',
          type: 'PLACEMENT_ASSESSMENT',
          durationMinutes: 60,
          sipsDriveId: 'drive_cross_college_bmsce'
        });

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/tenant/i);
    });

    test('should create draft assessment with valid SIPS drive and associate it', async () => {
      const res = await request(app)
        .post('/api/admin/assessments')
        .set('Authorization', `Bearer ${adminTokenA}`)
        .send({
          title: 'Google Placement Assessment 2026',
          type: 'PLACEMENT_ASSESSMENT',
          durationMinutes: 90,
          sipsDriveId: 'drive_google_2026'
        });

      expect(res.status).toBe(201);
      expect(res.body.data.type).toBe('PLACEMENT_ASSESSMENT');
      expect(res.body.data.sipsDriveId).toBe('drive_google_2026');
      expect(res.body.data.status).toBe('DRAFT');
    });

    test('should associate drive to existing draft assessment via explicit endpoint', async () => {
      // 1. Create plain draft
      const createRes = await request(app)
        .post('/api/admin/assessments')
        .set('Authorization', `Bearer ${adminTokenA}`)
        .send({
          title: 'TCS Digital Screening',
          type: 'PRACTICE_SET',
          durationMinutes: 45
        });

      const assessmentId = createRes.body.data.id;

      // 2. Associate drive
      const assocRes = await request(app)
        .post(`/api/admin/assessments/${assessmentId}/associate-drive`)
        .set('Authorization', `Bearer ${adminTokenA}`)
        .send({ sipsDriveId: 'drive_tcs_digital_01' });

      expect(assocRes.status).toBe(200);
      expect(assocRes.body.data.sipsDriveId).toBe('drive_tcs_digital_01');
      expect(assocRes.body.data.type).toBe('PLACEMENT_ASSESSMENT');
    });

    test('should disassociate drive from draft assessment', async () => {
      const createRes = await request(app)
        .post('/api/admin/assessments')
        .set('Authorization', `Bearer ${adminTokenA}`)
        .send({
          title: 'Infosys Drive Assessment',
          type: 'PLACEMENT_ASSESSMENT',
          sipsDriveId: 'drive_infosys_01'
        });

      const assessmentId = createRes.body.data.id;

      const disRes = await request(app)
        .delete(`/api/admin/assessments/${assessmentId}/associate-drive`)
        .set('Authorization', `Bearer ${adminTokenA}`);

      expect(disRes.status).toBe(200);
      expect(disRes.body.data.sipsDriveId).toBeNull();
    });

    test('should reject drive association when SIPS eligibility service is down (fail-closed 503)', async () => {
      const createRes = await request(app)
        .post('/api/admin/assessments')
        .set('Authorization', `Bearer ${adminTokenA}`)
        .send({ title: 'Resilience Test Assessment', type: 'PRACTICE_SET' });

      const assessmentId = createRes.body.data.id;

      const assocRes = await request(app)
        .post(`/api/admin/assessments/${assessmentId}/associate-drive`)
        .set('Authorization', `Bearer ${adminTokenA}`)
        .send({ sipsDriveId: 'drive_service_down_01' });

      expect(assocRes.status).toBe(503);
      expect(assocRes.body.message).toMatch(/unavailable|down|error/i);
    });

    test('should reject drive association modification on PUBLISHED assessment (409)', async () => {
      // 1. Create and assemble assessment
      const createRes = await request(app)
        .post('/api/admin/assessments')
        .set('Authorization', `Bearer ${adminTokenA}`)
        .send({
          title: 'Immutable Published Assessment',
          type: 'PLACEMENT_ASSESSMENT',
          sipsDriveId: 'drive_microsoft_01'
        });

      const assessmentId = createRes.body.data.id;

      await request(app)
        .post(`/api/admin/assessments/${assessmentId}/questions`)
        .set('Authorization', `Bearer ${adminTokenA}`)
        .send({ questionVersionId: qVersion1Id, section: 'APTITUDE', marks: 2.0 });

      // 2. Publish
      await request(app)
        .post(`/api/admin/assessments/${assessmentId}/publish`)
        .set('Authorization', `Bearer ${adminTokenA}`);

      // 3. Attempt to change drive
      const mutateRes = await request(app)
        .post(`/api/admin/assessments/${assessmentId}/associate-drive`)
        .set('Authorization', `Bearer ${adminTokenA}`)
        .send({ sipsDriveId: 'drive_other_02' });

      expect(mutateRes.status).toBe(409);
      expect(mutateRes.body.message).toMatch(/published|locked|mutation|cannot/i);
    });
  });

  describe('2. Assessment Publication Enforcement', () => {
    test('should reject publishing PLACEMENT_ASSESSMENT without sipsDriveId (422)', async () => {
      // 1. Create PLACEMENT_ASSESSMENT without drive
      const assessment = await prisma.assessment.create({
        data: {
          title: 'Orphan Placement Assessment',
          type: 'PLACEMENT_ASSESSMENT',
          status: 'DRAFT',
          collegeId: collegeA,
          durationMinutes: 60,
          sipsDriveId: null
        }
      });

      await request(app)
        .post(`/api/admin/assessments/${assessment.id}/questions`)
        .set('Authorization', `Bearer ${adminTokenA}`)
        .send({ questionVersionId: qVersion1Id, section: 'APTITUDE', marks: 2.0 });

      // 2. Attempt publish
      const pubRes = await request(app)
        .post(`/api/admin/assessments/${assessment.id}/publish`)
        .set('Authorization', `Bearer ${adminTokenA}`);

      expect(pubRes.status).toBe(422);
      expect(pubRes.body.message).toMatch(/placement assessment requires|drive/i);
    });

    test('should reject publishing PLACEMENT_ASSESSMENT referencing a CLOSED drive (422)', async () => {
      const assessment = await prisma.assessment.create({
        data: {
          title: 'Closed Drive Assessment',
          type: 'PLACEMENT_ASSESSMENT',
          status: 'DRAFT',
          collegeId: collegeA,
          durationMinutes: 60,
          sipsDriveId: 'drive_closed_amazon_01'
        }
      });

      await request(app)
        .post(`/api/admin/assessments/${assessment.id}/questions`)
        .set('Authorization', `Bearer ${adminTokenA}`)
        .send({ questionVersionId: qVersion1Id, section: 'APTITUDE', marks: 2.0 });

      const pubRes = await request(app)
        .post(`/api/admin/assessments/${assessment.id}/publish`)
        .set('Authorization', `Bearer ${adminTokenA}`);

      expect(pubRes.status).toBe(422);
      expect(pubRes.body.message).toMatch(/closed|inactive|drive/i);
    });

    test('should successfully publish valid PLACEMENT_ASSESSMENT with ACTIVE drive', async () => {
      const assessment = await prisma.assessment.create({
        data: {
          title: 'Active Placement Drive Assessment',
          type: 'PLACEMENT_ASSESSMENT',
          status: 'DRAFT',
          collegeId: collegeA,
          durationMinutes: 60,
          sipsDriveId: 'drive_active_accenture_01'
        }
      });

      await request(app)
        .post(`/api/admin/assessments/${assessment.id}/questions`)
        .set('Authorization', `Bearer ${adminTokenA}`)
        .send({ questionVersionId: qVersion1Id, section: 'APTITUDE', marks: 2.0 });

      const pubRes = await request(app)
        .post(`/api/admin/assessments/${assessment.id}/publish`)
        .set('Authorization', `Bearer ${adminTokenA}`);

      expect(pubRes.status).toBe(200);
      expect(pubRes.body.data.status).toBe('PUBLISHED');
    });
  });

  describe('3. Student Discovery & Drive-Linked Assessment Runtime', () => {
    let publishedDriveAssessmentId;
    const activeDriveId = `drive_active_target_${Date.now()}`;

    beforeAll(async () => {
      const a = await prisma.assessment.create({
        data: {
          title: 'Target Campus Drive Assessment',
          type: 'PLACEMENT_ASSESSMENT',
          status: 'PUBLISHED',
          collegeId: collegeA,
          durationMinutes: 60,
          sipsDriveId: activeDriveId
        }
      });
      publishedDriveAssessmentId = a.id;

      await prisma.assessmentQuestion.create({
        data: {
          assessmentId: a.id,
          questionVersionId: qVersion1Id,
          section: 'APTITUDE',
          marks: 10.0,
          order: 1
        }
      });
    });

    test('should allow student to query assessment by SIPS Drive ID', async () => {
      const res = await request(app)
        .get(`/api/assessments/by-drive/${activeDriveId}`)
        .set('Authorization', `Bearer ${studentTokenEligible}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(publishedDriveAssessmentId);
      expect(res.body.data.sipsDriveId).toBe(activeDriveId);
    });

    test('should allow eligible student to view assessment details prior to start', async () => {
      const res = await request(app)
        .get(`/api/assessments/${publishedDriveAssessmentId}/student`)
        .set('Authorization', `Bearer ${studentTokenEligible}`);

      expect(res.status).toBe(200);
      expect(res.body.data.isEligible).toBe(true);
      expect(res.body.data.id).toBe(publishedDriveAssessmentId);
    });

    test('should reject ineligible student from viewing or starting assessment (403)', async () => {
      // 1. Details view
      const viewRes = await request(app)
        .get(`/api/assessments/${publishedDriveAssessmentId}/student`)
        .set('Authorization', `Bearer ${studentTokenIneligible}`);

      expect(viewRes.status).toBe(403);
      expect(viewRes.body.message).toMatch(/eligible|ineligible|criteria/i);

      // 2. Direct attempt start API
      const startRes = await request(app)
        .post(`/api/assessments/${publishedDriveAssessmentId}/attempts/start`)
        .set('Authorization', `Bearer ${studentTokenIneligible}`);

      expect(startRes.status).toBe(403);
      expect(startRes.body.message).toMatch(/eligible|ineligible|criteria/i);
    });

    test('should allow eligible student to start attempt and complete evaluation', async () => {
      const startRes = await request(app)
        .post(`/api/assessments/${publishedDriveAssessmentId}/attempts/start`)
        .set('Authorization', `Bearer ${studentTokenEligible}`);

      expect(startRes.status).toBe(201);
      const attemptId = startRes.body.data.id;

      // Autosave answer
      const saveRes = await request(app)
        .post(`/api/assessments/${publishedDriveAssessmentId}/attempts/${attemptId}/responses`)
        .set('Authorization', `Bearer ${studentTokenEligible}`)
        .send({
          questionVersionId: qVersion1Id,
          answerData: { selectedOptionId: 'opt_1' }
        });

      expect(saveRes.status).toBe(200);

      // Submit
      const submitRes = await request(app)
        .post(`/api/assessments/${publishedDriveAssessmentId}/attempts/${attemptId}/submit`)
        .set('Authorization', `Bearer ${studentTokenEligible}`);

      expect(submitRes.status).toBe(200);
      expect(submitRes.body.data.scores.totalScore).toBe(10);
      expect(submitRes.body.data.scores.aptitudeScore).toBe(10);
    });
  });

  describe('4. Tenant Isolation & RBAC Security Matrix', () => {
    test('should reject College B student from viewing College A assessment (403)', async () => {
      const assessmentA = await prisma.assessment.create({
        data: {
          title: 'College A Private Assessment',
          type: 'PRACTICE_SET',
          status: 'PUBLISHED',
          collegeId: collegeA,
          durationMinutes: 30
        }
      });

      const res = await request(app)
        .get(`/api/assessments/${assessmentA.id}/student`)
        .set('Authorization', `Bearer ${studentTokenB}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/institution|access|college|tenant/i);
    });

    test('should reject College Admin B from associating College A assessment (403)', async () => {
      const assessmentA = await prisma.assessment.create({
        data: {
          title: 'College A Draft Blueprint',
          type: 'PLACEMENT_ASSESSMENT',
          status: 'DRAFT',
          collegeId: collegeA
        }
      });

      const res = await request(app)
        .post(`/api/admin/assessments/${assessmentA.id}/associate-drive`)
        .set('Authorization', `Bearer ${adminTokenB}`)
        .send({ sipsDriveId: 'drive_bmsce_01' });

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/college|access|forbidden|tenant/i);
    });

    test('should reject student from calling admin associate-drive endpoint (403)', async () => {
      const res = await request(app)
        .post('/api/admin/assessments/some_id/associate-drive')
        .set('Authorization', `Bearer ${studentTokenEligible}`)
        .send({ sipsDriveId: 'drive_hack_01' });

      expect(res.status).toBe(403);
    });
  });
});

