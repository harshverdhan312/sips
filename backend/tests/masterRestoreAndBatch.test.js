const authController = require('../controllers/authController');
const institutionController = require('../controllers/institutionController');
const adminStudentController = require('../controllers/adminStudentController');
const adminJobController = require('../controllers/adminJobController');
const studentController = require('../controllers/studentController');
const memoryDb = require('../utils/memoryDb');
const bcrypt = require('bcryptjs');

const createMockReq = (overrides = {}) => ({
  headers: {},
  query: {},
  params: {},
  body: {},
  user: null,
  collegeId: null,
  institutionId: null,
  departmentId: null,
  ...overrides
});

const createMockRes = () => {
  const res = {};
  res.statusCode = 200;
  res.headers = {};
  res.setHeader = jest.fn((key, val) => {
    res.headers[key] = val;
  });
  res.status = jest.fn((code) => {
    res.statusCode = code;
    return res;
  });
  res.json = jest.fn((data) => {
    res.body = data;
    return res;
  });
  res.send = jest.fn((data) => {
    res.body = data;
    return res;
  });
  return res;
};

jest.setTimeout(30000);

describe('SIPS Master Restore & Additive Batch Enhancement Test Suite', () => {
  let univAdminToken;
  let bcaAdminToken;
  let bbaAdminToken;
  let institutionId;
  let bcaDeptId;
  let bbaDeptId;
  let student2027Id;
  let student2026Id;
  let job2027Id;
  let job2026Id;

  beforeAll(async () => {
    // Clean memoryDb
    memoryDb.institutions = [];
    memoryDb.departments = [];
    memoryDb.students = [];
    memoryDb.jobs = [];
    memoryDb.applications = [];
    memoryDb.matches = [];
  });

  // ==========================================
  // AUTHENTICATION SEPARATION & TENANCY TESTS
  // ==========================================
  describe('Phase 4 & 5: Separated Authentication & Roles', () => {
    test('1 & 2. University Onboarding & University Admin Login', async () => {
      const onboardReq = createMockReq({
        body: {
          institutionName: 'ABC University',
          code: 'ABC',
          officialEmail: 'admin@abc.edu',
          username: 'abc_admin',
          password: 'Password123!',
          acceptedDomains: ['abc.edu']
        }
      });
      const onboardRes = createMockRes();
      await institutionController.onboardInstitution(onboardReq, onboardRes);

      expect(onboardRes.statusCode).toBe(201);
      expect(onboardRes.body.institution).toBeDefined();
      expect(onboardRes.body.institution.name).toBe('ABC University');
      expect(onboardRes.body.token).toBeDefined();

      institutionId = onboardRes.body.institution.id;
      univAdminToken = onboardRes.body.token;

      // University Admin login via institutionLogin
      const loginReq = createMockReq({
        body: { username: 'abc_admin', password: 'Password123!' }
      });
      const loginRes = createMockRes();
      await authController.institutionLogin(loginReq, loginRes);

      expect(loginRes.statusCode).toBe(200);
      expect(loginRes.body.role).toBe('MAIN_UNIVERSITY_ADMIN');
      expect(loginRes.body.institutionId).toBe(institutionId);
    });

    test('3. University Admin creates multiple Departments (BBA, BCA, MBA) with credentials', async () => {
      // 1. Create BCA
      const bcaReq = createMockReq({
        institutionId,
        user: { role: 'MAIN_UNIVERSITY_ADMIN', institutionId },
        body: {
          name: 'Computer Applications',
          code: 'BCA',
          username: 'abc_bca',
          password: 'BcaPassword123!',
          programs: ['BCA']
        }
      });
      const bcaRes = createMockRes();
      await institutionController.createDepartment(bcaReq, bcaRes);

      expect(bcaRes.statusCode).toBe(201);
      expect(bcaRes.body.department.name).toBe('Computer Applications');
      expect(bcaRes.body.department.username).toBe('abc_bca');
      bcaDeptId = bcaRes.body.department.id;

      // 2. Create BBA
      const bbaReq = createMockReq({
        institutionId,
        user: { role: 'MAIN_UNIVERSITY_ADMIN', institutionId },
        body: {
          name: 'Business Administration',
          code: 'BBA',
          username: 'abc_bba',
          password: 'BbaPassword123!',
          programs: ['BBA']
        }
      });
      const bbaRes = createMockRes();
      await institutionController.createDepartment(bbaReq, bbaRes);

      expect(bbaRes.statusCode).toBe(201);
      bbaDeptId = bbaRes.body.department.id;

      // 3. Create MBA
      const mbaReq = createMockReq({
        institutionId,
        user: { role: 'MAIN_UNIVERSITY_ADMIN', institutionId },
        body: {
          name: 'Management Studies',
          code: 'MBA',
          username: 'abc_mba',
          password: 'MbaPassword123!',
          programs: ['MBA']
        }
      });
      const mbaRes = createMockRes();
      await institutionController.createDepartment(mbaReq, mbaRes);

      expect(mbaRes.statusCode).toBe(201);
    });

    test('4. Department Admin Login returns DEPARTMENT_ADMIN role & isolated departmentId', async () => {
      const loginReq = createMockReq({
        body: { username: 'abc_bca', password: 'BcaPassword123!' }
      });
      const loginRes = createMockRes();
      await authController.institutionLogin(loginReq, loginRes);

      expect(loginRes.statusCode).toBe(200);
      expect(loginRes.body.role).toBe('DEPARTMENT_ADMIN');
      expect(loginRes.body.institutionId).toBe(institutionId);
      expect(loginRes.body.departmentId).toBe(bcaDeptId);
      bcaAdminToken = loginRes.body.token;

      // Login BBA admin as well
      const bbaLoginReq = createMockReq({
        body: { username: 'abc_bba', password: 'BbaPassword123!' }
      });
      const bbaLoginRes = createMockRes();
      await authController.institutionLogin(bbaLoginReq, bbaLoginRes);
      expect(bbaLoginRes.statusCode).toBe(200);
      expect(bbaLoginRes.body.departmentId).toBe(bbaDeptId);
      bbaAdminToken = bbaLoginRes.body.token;
    });

    test('5. Department credentials CANNOT authenticate through student login', async () => {
      const req = createMockReq({
        body: { email: 'abc_bca@abc.edu', password: 'BcaPassword123!' }
      });
      const res = createMockRes();
      await authController.studentLogin(req, res);

      expect(res.statusCode).toBe(401);
    });

    test('6. Student credentials CANNOT authenticate through institution login', async () => {
      const req = createMockReq({
        body: { username: 'student_dummy', password: 'Password123!' }
      });
      const res = createMockRes();
      await authController.institutionLogin(req, res);

      expect(res.statusCode).toBe(401);
    });
  });

  // ==========================================
  // STUDENT MANAGEMENT & BATCH STORAGE TESTS
  // ==========================================
  describe('Phase 6 & 13: Student Management & Batch Assignment', () => {
    test('14 & 17. Add Student with batch 2027 and batch 2026', async () => {
      // Student A: 2027 batch in BCA
      const st1Req = createMockReq({
        collegeId: bcaDeptId,
        institutionId,
        departmentId: bcaDeptId,
        body: {
          name: 'Student A',
          email: 'studentA@abc.edu',
          rollNo: 'BCA202701',
          branch: 'Computer Applications',
          batch: '2027',
          cgpa: 8.5,
          skills: ['Python', 'React', 'SQL']
        }
      });
      const st1Res = createMockRes();
      await adminStudentController.createStudent(st1Req, st1Res);

      expect(st1Res.statusCode).toBe(201);
      expect(st1Res.body.student.batch).toBe('2027');
      expect(st1Res.body.student.passingYear).toBe('2027');
      student2027Id = st1Res.body.student.id || st1Res.body.student._id;

      // Student B: 2027 batch in BCA
      const st2Req = createMockReq({
        collegeId: bcaDeptId,
        institutionId,
        departmentId: bcaDeptId,
        body: {
          name: 'Student B',
          email: 'studentB@abc.edu',
          rollNo: 'BCA202702',
          branch: 'Computer Applications',
          batch: '2027',
          cgpa: 8.0,
          skills: ['Python', 'SQL']
        }
      });
      const st2Res = createMockRes();
      await adminStudentController.createStudent(st2Req, st2Res);
      expect(st2Res.statusCode).toBe(201);

      // Student C: 2026 batch in BCA
      const st3Req = createMockReq({
        collegeId: bcaDeptId,
        institutionId,
        departmentId: bcaDeptId,
        body: {
          name: 'Student C',
          email: 'studentC@abc.edu',
          rollNo: 'BCA202601',
          branch: 'Computer Applications',
          batch: '2026',
          cgpa: 7.8,
          skills: ['Java', 'C++', 'SQL']
        }
      });
      const st3Res = createMockRes();
      await adminStudentController.createStudent(st3Req, st3Res);
      expect(st3Res.statusCode).toBe(201);
      expect(st3Res.body.student.batch).toBe('2026');
      student2026Id = st3Res.body.student.id || st3Res.body.student._id;
    });

    test('18. Student Batch Filter in Student Management', async () => {
      // Filter by Batch 2027
      const req2027 = createMockReq({
        collegeId: bcaDeptId,
        institutionId,
        departmentId: bcaDeptId,
        query: { batch: '2027' }
      });
      const res2027 = createMockRes();
      await adminStudentController.getStudents(req2027, res2027);

      expect(res2027.statusCode).toBe(200);
      const students2027 = res2027.body.students;
      expect(students2027.length).toBe(2);
      expect(students2027.every(s => s.batch === '2027')).toBe(true);

      // Filter by Batch 2026
      const req2026 = createMockReq({
        collegeId: bcaDeptId,
        institutionId,
        departmentId: bcaDeptId,
        query: { batch: '2026' }
      });
      const res2026 = createMockRes();
      await adminStudentController.getStudents(req2026, res2026);

      expect(res2026.statusCode).toBe(200);
      const students2026 = res2026.body.students;
      expect(students2026.length).toBe(1);
      expect(students2026[0].name).toBe('Student C');
    });

    test('30 & 31. Department Isolation: BBA Admin cannot see BCA students', async () => {
      const bbaReq = createMockReq({
        collegeId: bbaDeptId,
        institutionId,
        departmentId: bbaDeptId
      });
      const bbaRes = createMockRes();
      await adminStudentController.getStudents(bbaReq, bbaRes);

      expect(bbaRes.statusCode).toBe(200);
      expect(bbaRes.body.students.length).toBe(0);
    });
  });

  // ==========================================
  // JOB MANAGEMENT & TARGET BATCH TESTS
  // ==========================================
  describe('Phase 6 & 13: Job Description Target Batch & Filters', () => {
    test('19, 21, 22. Add Job Descriptions with targetBatch validation', async () => {
      // Target batch validation rejection
      const invalidJobReq = createMockReq({
        collegeId: bcaDeptId,
        institutionId,
        departmentId: bcaDeptId,
        body: {
          company: 'Google',
          role: 'Software Developer',
          // missing targetBatch
          minCgpa: 7.0,
          requiredSkills: ['Python', 'React']
        }
      });
      const invalidJobRes = createMockRes();
      await adminJobController.createJob(invalidJobReq, invalidJobRes);
      expect(invalidJobRes.statusCode).toBe(400);

      // Valid Job A (Google - 2027)
      const jobAReq = createMockReq({
        collegeId: bcaDeptId,
        institutionId,
        departmentId: bcaDeptId,
        body: {
          title: 'Software Developer',
          company: 'Google',
          role: 'Software Developer',
          description: 'Software Developer opportunity at Google',
          targetBatch: '2027',
          minCgpa: 7.0,
          requiredSkills: ['Python', 'React', 'SQL'],
          allowedBranches: ['Computer Applications'],
          deadline: new Date(Date.now() + 86400000 * 10).toISOString()
        }
      });
      const jobARes = createMockRes();
      await adminJobController.createJob(jobAReq, jobARes);

      expect(jobARes.statusCode).toBe(201);
      expect(jobARes.body.job.targetBatch).toBe('2027');
      expect(jobARes.body.job.batch).toBe('2027');
      job2027Id = jobARes.body.job.id || jobARes.body.job._id;

      // Valid Job B (Cisco - 2026)
      const jobBReq = createMockReq({
        collegeId: bcaDeptId,
        institutionId,
        departmentId: bcaDeptId,
        body: {
          title: 'Software Developer',
          company: 'Cisco',
          role: 'Software Developer',
          description: 'Software Developer opportunity at Cisco',
          targetBatch: '2026',
          minCgpa: 7.0,
          requiredSkills: ['Java', 'C++', 'SQL'],
          allowedBranches: ['Computer Applications'],
          deadline: new Date(Date.now() + 86400000 * 10).toISOString()
        }
      });
      const jobBRes = createMockRes();
      await adminJobController.createJob(jobBReq, jobBRes);

      expect(jobBRes.statusCode).toBe(201);
      expect(jobBRes.body.job.targetBatch).toBe('2026');
      job2026Id = jobBRes.body.job.id || jobBRes.body.job._id;
    });

    test('23. Job Management Batch Filter', async () => {
      const filter2027Req = createMockReq({
        collegeId: bcaDeptId,
        institutionId,
        departmentId: bcaDeptId,
        query: { batch: '2027' }
      });
      const filter2027Res = createMockRes();
      await adminJobController.getJobs(filter2027Req, filter2027Res);

      expect(filter2027Res.statusCode).toBe(200);
      expect(filter2027Res.body.jobs.length).toBe(1);
      expect(filter2027Res.body.jobs[0].company).toBe('Google');
    });
  });

  // ==========================================
  // STUDENT JOB VISIBILITY & STRICT BATCH ISOLATION
  // ==========================================
  describe('Phase 13: Student Job Visibility Enforcement', () => {
    test('24 & 25. Student A (2027) sees Google (2027) and DOES NOT see Cisco (2026)', async () => {
      const req = createMockReq({
        collegeId: bcaDeptId,
        institutionId,
        departmentId: bcaDeptId,
        user: { id: student2027Id, role: 'STUDENT', collegeId: bcaDeptId, institutionId, departmentId: bcaDeptId }
      });
      const res = createMockRes();
      await studentController.getJobs(req, res);

      expect(res.statusCode).toBe(200);
      const visibleJobs = Array.isArray(res.body) ? res.body : (res.body?.jobs || []);
      const jobCompanies = visibleJobs.map(j => j.company);

      expect(jobCompanies).toContain('Google');
      expect(jobCompanies).not.toContain('Cisco');
    });

    test('26 & 27. Student C (2026) sees Cisco (2026) and DOES NOT see Google (2027)', async () => {
      const req = createMockReq({
        collegeId: bcaDeptId,
        institutionId,
        departmentId: bcaDeptId,
        user: { id: student2026Id, role: 'STUDENT', collegeId: bcaDeptId, institutionId, departmentId: bcaDeptId }
      });
      const res = createMockRes();
      await studentController.getJobs(req, res);

      expect(res.statusCode).toBe(200);
      const visibleJobs = Array.isArray(res.body) ? res.body : (res.body?.jobs || []);
      const jobCompanies = visibleJobs.map(j => j.company);

      expect(jobCompanies).toContain('Cisco');
      expect(jobCompanies).not.toContain('Google');
    });
  });

  // ==========================================
  // APPLICATION BATCH VALIDATION & ELIGIBILITY
  // ==========================================
  describe('Phase 7, 10 & 13: Application Batch Security & Eligibility', () => {
    test('33 & 34. Student C (2026) applying to Google (2027) via Direct API is REJECTED (400)', async () => {
      const req = createMockReq({
        collegeId: bcaDeptId,
        institutionId,
        departmentId: bcaDeptId,
        params: { id: job2027Id },
        user: { id: student2026Id, role: 'STUDENT', collegeId: bcaDeptId, institutionId, departmentId: bcaDeptId }
      });
      const res = createMockRes();
      await studentController.applyToJob(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain('2027 batch');

      // Verify NO Application was created
      const apps = memoryDb.applications.filter(a => a.studentId === student2026Id && a.jobId === job2027Id);
      expect(apps.length).toBe(0);
    });

    test('32. Student A (2027) applying to Google (2027) SUCCEEDS and Application created', async () => {
      const req = createMockReq({
        collegeId: bcaDeptId,
        institutionId,
        departmentId: bcaDeptId,
        params: { id: job2027Id },
        user: { id: student2027Id, role: 'STUDENT', collegeId: bcaDeptId, institutionId, departmentId: bcaDeptId }
      });
      const res = createMockRes();
      await studentController.applyToJob(req, res);

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);

      const app = memoryDb.applications.find(a => a.studentId === student2027Id && a.jobId === job2027Id);
      expect(app).toBeDefined();
      expect(app.jobId).toBe(job2027Id);
    });

    test('39. Duplicate application by Student A is rejected', async () => {
      const req = createMockReq({
        collegeId: bcaDeptId,
        institutionId,
        departmentId: bcaDeptId,
        params: { id: job2027Id },
        user: { id: student2027Id, role: 'STUDENT', collegeId: bcaDeptId, institutionId, departmentId: bcaDeptId }
      });
      const res = createMockRes();
      await studentController.applyToJob(req, res);

      expect([400, 409]).toContain(res.statusCode);
      expect(res.body.message).toContain('already applied');
    });

    test('38, 51, 52. Debar Student and restore eligibility', async () => {
      // Debar Student A
      const debarReq = createMockReq({
        collegeId: bcaDeptId,
        institutionId,
        departmentId: bcaDeptId,
        params: { id: student2027Id },
        body: { debarred: true, reason: 'Disciplinary infraction' }
      });
      const debarRes = createMockRes();
      await adminStudentController.debarStudent(debarReq, debarRes);

      expect(debarRes.statusCode).toBe(200);
      expect(debarRes.body.student.applicationEligibilityStatus).toBe('DEBARRED');

      // Verify debarred student cannot apply to any drive
      const applyReq = createMockReq({
        collegeId: bcaDeptId,
        institutionId,
        departmentId: bcaDeptId,
        params: { id: job2027Id },
        user: { id: student2027Id, role: 'STUDENT', collegeId: bcaDeptId, institutionId, departmentId: bcaDeptId }
      });
      const applyRes = createMockRes();
      await studentController.applyToJob(applyReq, applyRes);
      expect([400, 403]).toContain(applyRes.statusCode);

      // Restore eligibility
      const restoreReq = createMockReq({
        collegeId: bcaDeptId,
        institutionId,
        departmentId: bcaDeptId,
        params: { id: student2027Id },
        body: { debarred: false }
      });
      const restoreRes = createMockRes();
      await adminStudentController.debarStudent(restoreReq, restoreRes);
      expect(restoreRes.statusCode).toBe(200);
      expect(restoreRes.body.student.applicationEligibilityStatus).toBe('ELIGIBLE');
    });
  });

  // ==========================================
  // CANDIDATES: MATCHED VS APPLIED SEPARATION
  // ==========================================
  describe('Phase 8 & 9: Matched vs Applied Candidates & CSV Exports', () => {
    test('41-45. Matched Candidates vs Applied Candidates distinction', async () => {
      // Get Applied Students for Google Job (only Student A applied)
      const appReq = createMockReq({
        collegeId: bcaDeptId,
        institutionId,
        departmentId: bcaDeptId,
        params: { id: job2027Id }
      });
      const appRes = createMockRes();
      await adminJobController.getJobApplicants(appReq, appRes);

      expect(appRes.statusCode).toBe(200);
      expect(appRes.body.count).toBe(1);
      expect(appRes.body.applicants[0].student.name).toBe('Student A');

      // Get Matched Students for Google Job
      const matchReq = createMockReq({
        collegeId: bcaDeptId,
        institutionId,
        departmentId: bcaDeptId,
        params: { id: job2027Id }
      });
      const matchRes = createMockRes();
      await adminJobController.getJobMatches(matchReq, matchRes);

      expect(matchRes.statusCode).toBe(200);
      expect(Array.isArray(matchRes.body.matches)).toBe(true);
    });

    test('47, 48, 49. CSV Exports for Matched and Applied candidates', async () => {
      // Export Applied CSV
      const expAppReq = createMockReq({
        collegeId: bcaDeptId,
        institutionId,
        departmentId: bcaDeptId,
        params: { id: job2027Id }
      });
      const expAppRes = createMockRes();
      await adminJobController.exportJobApplicantsCSV(expAppReq, expAppRes);

      expect(expAppRes.statusCode).toBe(200);
      expect(expAppRes.headers['Content-Type']).toMatch(/text\/csv/);
      expect(expAppRes.body).toContain('Student Name');
      expect(expAppRes.body).toContain('Student A');

      // Export Matched CSV
      const expMatchReq = createMockReq({
        collegeId: bcaDeptId,
        institutionId,
        departmentId: bcaDeptId,
        params: { id: job2027Id }
      });
      const expMatchRes = createMockRes();
      await adminJobController.exportJobMatchesCSV(expMatchReq, expMatchRes);

      expect(expMatchRes.statusCode).toBe(200);
      expect(expMatchRes.headers['Content-Type']).toMatch(/text\/csv/);
      expect(expMatchRes.body).toContain('Student Name');
    });

    test('50. Cross-department CSV export is rejected', async () => {
      const unauthReq = createMockReq({
        collegeId: bbaDeptId, // BBA trying to export BCA job
        institutionId,
        departmentId: bbaDeptId,
        params: { id: job2027Id }
      });
      const unauthRes = createMockRes();
      await adminJobController.exportJobApplicantsCSV(unauthReq, unauthRes);

      expect(unauthRes.statusCode).toBe(404);
    });
  });

  // ==========================================
  // PLACEMENT STATUS RECORD & DELETION TESTS
  // ==========================================
  describe('Phase 12: Mark Student Placed & Job Deletion', () => {
    test('53, 54, 55. Mark student as PLACED with company and package', async () => {
      const placeReq = createMockReq({
        collegeId: bcaDeptId,
        institutionId,
        departmentId: bcaDeptId,
        params: { id: student2027Id },
        body: {
          placementStatus: 'PLACED',
          companyPlaced: 'Google',
          packageOffered: 24.5
        }
      });
      const placeRes = createMockRes();
      await adminStudentController.updatePlacementStatus(placeReq, placeRes);

      expect(placeRes.statusCode).toBe(200);
      expect(placeRes.body.student.placementStatus).toBe('PLACED');
      expect(placeRes.body.student.companyPlaced).toBe('Google');
      expect(placeRes.body.student.packageOffered).toBe(24.5);

      // Verify historical application remains intact
      const app = memoryDb.applications.find(a => a.studentId === student2027Id);
      expect(app).toBeDefined();
    });

    test('Delete recruitment drive cleans up matches & applications safely', async () => {
      const delReq = createMockReq({
        collegeId: bcaDeptId,
        institutionId,
        departmentId: bcaDeptId,
        params: { id: job2026Id }
      });
      const delRes = createMockRes();
      await adminJobController.deleteJob(delReq, delRes);

      expect(delRes.statusCode).toBe(200);
      expect(delRes.body.success).toBe(true);

      const jobStillExists = memoryDb.jobs.some(j => j.id === job2026Id || j._id === job2026Id);
      expect(jobStillExists).toBe(false);
    });
  });
});
