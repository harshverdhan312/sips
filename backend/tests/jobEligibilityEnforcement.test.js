const studentController = require('../controllers/studentController');
const adminJobController = require('../controllers/adminJobController');
const JobDescription = require('../models/JobDescription');
const Student = require('../models/Student');
const Application = require('../models/Application');
const Match = require('../models/Match');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');
const { checkJobEligibility } = require('../utils/eligibilityChecker');

jest.mock('../models/JobDescription');
jest.mock('../models/Student');
jest.mock('../models/Application');
jest.mock('../models/Match');
jest.mock('../models/Notification');
jest.mock('../models/AuditLog');

describe('Job Eligibility Enforcement & Admin Applied Students Verification', () => {
  const collegeIdA = '507f1f77bcf86cd799439011';
  const collegeIdB = '507f1f77bcf86cd799439099';
  const studentIdA = '507f1f77bcf86cd799439022';
  const studentIdB = '507f1f77bcf86cd799439033';
  const jobIdA = '507f1f77bcf86cd799439044';
  const jobIdB = '507f1f77bcf86cd799439055';

  const createMockReq = (overrides = {}) => ({
    collegeId: collegeIdA,
    user: { id: studentIdA, role: 'STUDENT', email: 'student@college.edu' },
    query: {},
    params: {},
    body: {},
    ...overrides
  });

  const createMockRes = () => {
    const res = {};
    res.statusCode = 200;
    res.headers = {};
    res.status = jest.fn().mockImplementation((code) => {
      res.statusCode = code;
      return res;
    });
    res.json = jest.fn().mockImplementation((data) => {
      res.body = data;
      return res;
    });
    res.setHeader = jest.fn().mockImplementation((k, v) => {
      res.headers[k] = v;
    });
    res.send = jest.fn().mockImplementation((body) => {
      res.body = body;
      return res;
    });
    return res;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    Notification.create.mockResolvedValue({});
    AuditLog.create.mockResolvedValue({});
  });

  // ============================================================
  // Part 1 & 2: ELIGIBILITY UNIT & SERVER-SIDE ENFORCEMENT
  // ============================================================
  describe('checkJobEligibility Utility', () => {
    test('1. Eligible student satisfying CGPA and branch returns empty reasons array', () => {
      const student = { cgpa: 8.5, branch: 'Computer Science & Engineering' };
      const job = { minCgpa: 7.0, allowedBranches: ['Computer Science & Engineering', 'Information Technology'] };
      const reasons = checkJobEligibility(student, job);
      expect(reasons).toEqual([]);
    });

    test('2. Low CGPA returns failure reason with exact required and current values', () => {
      const student = { cgpa: 6.9, branch: 'Computer Science & Engineering' };
      const job = { minCgpa: 7.0, allowedBranches: [] };
      const reasons = checkJobEligibility(student, job);
      expect(reasons).toHaveLength(1);
      expect(reasons[0]).toBe('Minimum CGPA required is 7. Your CGPA is 6.9.');
    });

    test('3. Ineligible branch returns failure reason with allowed branches', () => {
      const student = { cgpa: 8.0, branch: 'Mechanical Engineering' };
      const job = { minCgpa: 0, allowedBranches: ['Information Technology'] };
      const reasons = checkJobEligibility(student, job);
      expect(reasons).toHaveLength(1);
      expect(reasons[0]).toBe('Allowed branch: Information Technology');
    });

    test('7. Multiple failed conditions return all applicable reasons', () => {
      const student = { cgpa: 6.9, branch: 'Civil Engineering' };
      const job = { minCgpa: 7.5, allowedBranches: ['CSE', 'IT'] };
      const reasons = checkJobEligibility(student, job);
      expect(reasons).toHaveLength(2);
      expect(reasons).toContain('Minimum CGPA required is 7.5. Your CGPA is 6.9.');
      expect(reasons).toContain('Allowed branches: CSE, IT');
    });
  });

  // ============================================================
  // Part 2 & 4: POST /api/student/jobs/:id/apply Endpoints
  // ============================================================
  describe('POST /api/student/jobs/:id/apply - Server-Side Authority', () => {
    test('1. Eligible student can apply -> Application created with status 201', async () => {
      const mockJob = {
        _id: jobIdA,
        collegeId: collegeIdA,
        title: 'Software Engineer',
        company: 'Acme Corp',
        status: 'ACTIVE',
        minCgpa: 7.0,
        allowedBranches: ['Computer Science & Engineering'],
        deadline: new Date(Date.now() + 86400000)
      };
      const mockStudent = {
        _id: studentIdA,
        collegeId: collegeIdA,
        name: 'Alex Johnson',
        cgpa: 8.2,
        branch: 'Computer Science & Engineering'
      };

      JobDescription.findOne.mockResolvedValue(mockJob);
      Student.findOne.mockResolvedValue(mockStudent);
      Application.findOne.mockResolvedValue(null);

      let savedDoc = null;
      Application.mockImplementation(function (data) {
        this.collegeId = data.collegeId;
        this.studentId = data.studentId;
        this.jobId = data.jobId;
        this.status = data.status;
        this.appliedAt = data.appliedAt;
        this.save = jest.fn().mockImplementation(async () => {
          savedDoc = this;
          return this;
        });
      });

      const req = createMockReq({ params: { id: jobIdA } });
      const res = createMockRes();

      await studentController.applyToJob(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.body.success).toBe(true);
      expect(savedDoc).not.toBeNull();
      expect(savedDoc.jobId).toBe(jobIdA);
      expect(savedDoc.studentId).toBe(studentIdA);
    });

    test('2. Student with CGPA below cutoff is rejected and creates NO Application record', async () => {
      const mockJob = {
        _id: jobIdA,
        collegeId: collegeIdA,
        title: 'SDE',
        company: 'TechCorp',
        status: 'ACTIVE',
        minCgpa: 7.5,
        allowedBranches: []
      };
      const mockStudent = {
        _id: studentIdA,
        collegeId: collegeIdA,
        name: 'Bob',
        cgpa: 6.8,
        branch: 'Computer Science'
      };

      JobDescription.findOne.mockResolvedValue(mockJob);
      Student.findOne.mockResolvedValue(mockStudent);
      Application.findOne.mockResolvedValue(null);
      const saveSpy = jest.fn();
      Application.mockImplementation(function () {
        this.save = saveSpy;
      });

      const req = createMockReq({ params: { id: jobIdA } });
      const res = createMockRes();

      await studentController.applyToJob(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.body.success).toBe(false);
      expect(res.body.reasons).toEqual(['Minimum CGPA required is 7.5. Your CGPA is 6.8.']);
      expect(saveSpy).not.toHaveBeenCalled();
    });

    test('3. Student with wrong branch is rejected and creates NO Application record', async () => {
      const mockJob = {
        _id: jobIdA,
        collegeId: collegeIdA,
        title: 'Data Analyst',
        company: 'AnalyticsCo',
        status: 'ACTIVE',
        minCgpa: 6.0,
        allowedBranches: ['Information Technology']
      };
      const mockStudent = {
        _id: studentIdA,
        collegeId: collegeIdA,
        name: 'Charlie',
        cgpa: 8.0,
        branch: 'Mechanical Engineering'
      };

      JobDescription.findOne.mockResolvedValue(mockJob);
      Student.findOne.mockResolvedValue(mockStudent);
      Application.findOne.mockResolvedValue(null);
      const saveSpy = jest.fn();
      Application.mockImplementation(function () {
        this.save = saveSpy;
      });

      const req = createMockReq({ params: { id: jobIdA } });
      const res = createMockRes();

      await studentController.applyToJob(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.body.success).toBe(false);
      expect(res.body.reasons).toEqual(['Allowed branch: Information Technology']);
      expect(saveSpy).not.toHaveBeenCalled();
    });

    test('4. Expired job deadline is rejected', async () => {
      const mockJob = {
        _id: jobIdA,
        collegeId: collegeIdA,
        status: 'ACTIVE',
        deadline: new Date(Date.now() - 3600000)
      };
      JobDescription.findOne.mockResolvedValue(mockJob);

      const req = createMockReq({ params: { id: jobIdA } });
      const res = createMockRes();

      await studentController.applyToJob(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.body.message).toMatch(/deadline.*passed/i);
    });

    test('5. Inactive/Closed job is rejected', async () => {
      const mockJob = {
        _id: jobIdA,
        collegeId: collegeIdA,
        status: 'CLOSED'
      };
      JobDescription.findOne.mockResolvedValue(mockJob);

      const req = createMockReq({ params: { id: jobIdA } });
      const res = createMockRes();

      await studentController.applyToJob(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.body.message).toMatch(/closed/i);
    });

    test('6. Job from different college is rejected with 404', async () => {
      JobDescription.findOne.mockResolvedValue(null);

      const req = createMockReq({ params: { id: jobIdB } });
      const res = createMockRes();

      await studentController.applyToJob(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.body.message).toMatch(/Job not found/i);
    });

    test('8. Duplicate application is rejected with 409', async () => {
      const mockJob = {
        _id: jobIdA,
        collegeId: collegeIdA,
        status: 'ACTIVE',
        minCgpa: 6.0
      };
      const mockStudent = {
        _id: studentIdA,
        collegeId: collegeIdA,
        cgpa: 8.0,
        branch: 'Computer Science'
      };

      JobDescription.findOne.mockResolvedValue(mockJob);
      Student.findOne.mockResolvedValue(mockStudent);
      Application.findOne.mockResolvedValue({ _id: 'app123', status: 'APPLIED' });

      const req = createMockReq({ params: { id: jobIdA } });
      const res = createMockRes();

      await studentController.applyToJob(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.body.message).toMatch(/already applied/i);
    });
  });

  // ============================================================
  // Part 5-8: ADMIN APPLIED STUDENTS LIST & VIEW
  // ============================================================
  describe('GET /api/admin/jobs/:id/applicants (Admin Applied Students List)', () => {
    test('10. Application exists -> appears under Applied Students with full student details', async () => {
      const mockJob = {
        _id: jobIdA,
        collegeId: collegeIdA,
        title: 'Full Stack Engineer',
        company: 'Meta'
      };
      JobDescription.findOne.mockResolvedValue(mockJob);

      const mockApplications = [
        {
          _id: 'app_1',
          collegeId: collegeIdA,
          jobId: jobIdA,
          status: 'APPLIED',
          appliedAt: new Date('2026-09-28T10:00:00Z'),
          updatedAt: new Date('2026-09-28T10:00:00Z'),
          studentId: {
            _id: studentIdA,
            name: 'Priya Sharma',
            rollNo: 'CS101',
            usn: '1RV20CS101',
            email: 'priya@college.edu',
            branch: 'Computer Science & Engineering',
            batch: '2025',
            cgpa: 8.9,
            placementStatus: 'UNPLACED',
            readinessScore: 85,
            skills: ['react', 'node', 'mongodb'],
            profileImageUrl: 'https://example.com/avatar.jpg'
          }
        }
      ];

      const queryChain = {
        sort: jest.fn().mockReturnThis(),
        populate: jest.fn().mockResolvedValue(mockApplications)
      };
      Application.find.mockReturnValue(queryChain);
      Match.find.mockReturnValue({
        lean: jest.fn().mockResolvedValue([
          { studentId: studentIdA, score: 92, matchedSkills: ['react', 'node'], missingSkills: [] }
        ])
      });

      const req = {
        collegeId: collegeIdA,
        user: { id: 'admin1', role: 'COLLEGE_ADMIN' },
        params: { id: jobIdA }
      };
      const res = createMockRes();

      await adminJobController.getJobApplicants(req, res);

      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(1);
      expect(res.body.applicants).toHaveLength(1);

      const applicant = res.body.applicants[0];
      expect(applicant.student.name).toBe('Priya Sharma');
      expect(applicant.student.branch).toBe('Computer Science & Engineering');
      expect(applicant.student.cgpa).toBe(8.9);
      expect(applicant.status).toBe('APPLIED');
      expect(applicant.matchScore).toBe(92);
      expect(applicant.student.profileImageUrl).toBe('https://example.com/avatar.jpg');
    });

    test('11. Matched student who has NOT applied does not appear in applicants list', async () => {
      const mockJob = { _id: jobIdA, collegeId: collegeIdA, title: 'DevOps', company: 'CloudCo' };
      JobDescription.findOne.mockResolvedValue(mockJob);

      // No applications in DB
      const queryChain = {
        sort: jest.fn().mockReturnThis(),
        populate: jest.fn().mockResolvedValue([])
      };
      Application.find.mockReturnValue(queryChain);

      const req = {
        collegeId: collegeIdA,
        user: { id: 'admin1', role: 'COLLEGE_ADMIN' },
        params: { id: jobIdA }
      };
      const res = createMockRes();

      await adminJobController.getJobApplicants(req, res);

      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(0);
      expect(res.body.applicants).toEqual([]);
    });

    test('12. Application for another job does not appear for this job', async () => {
      const mockJob = { _id: jobIdA, collegeId: collegeIdA, title: 'Job A', company: 'Co A' };
      JobDescription.findOne.mockResolvedValue(mockJob);

      const queryChain = {
        sort: jest.fn().mockReturnThis(),
        populate: jest.fn().mockImplementation(() => {
          // Application.find was called with { jobId: jobIdA, collegeId: collegeIdA }
          return Promise.resolve([]);
        })
      };
      Application.find.mockReturnValue(queryChain);

      const req = {
        collegeId: collegeIdA,
        user: { id: 'admin1', role: 'COLLEGE_ADMIN' },
        params: { id: jobIdA }
      };
      const res = createMockRes();

      await adminJobController.getJobApplicants(req, res);

      expect(Application.find).toHaveBeenCalledWith({
        jobId: jobIdA,
        collegeId: collegeIdA
      });
      expect(res.body.applicants).toHaveLength(0);
    });

    test('13. Cross-college tenant isolation blocks applicant list for other college', async () => {
      JobDescription.findOne.mockResolvedValue(null);

      const req = {
        collegeId: collegeIdA,
        user: { id: 'admin1', role: 'COLLEGE_ADMIN' },
        params: { id: jobIdB }
      };
      const res = createMockRes();

      await adminJobController.getJobApplicants(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.body.message).toMatch(/Job not found/i);
    });
  });

  // ============================================================
  // Part 9: CSV EXPORT ISOLATION
  // ============================================================
  describe('CSV Exports (Matched vs Applied)', () => {
    test('16. Matched export contains matched candidates only', async () => {
      const mockJob = { _id: jobIdA, collegeId: collegeIdA, company: 'Google', title: 'SDE' };
      JobDescription.findOne.mockResolvedValue(mockJob);

      Match.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([
          {
            score: 95,
            matchedSkills: ['python', 'c++'],
            missingSkills: [],
            studentId: {
              name: 'Candidate Matched',
              email: 'matched@college.edu',
              rollNo: 'CS001',
              branch: 'CSE',
              batch: '2025',
              cgpa: 9.0
            }
          }
        ])
      });

      const req = {
        collegeId: collegeIdA,
        user: { id: 'admin1', role: 'COLLEGE_ADMIN' },
        params: { id: jobIdA }
      };
      const res = createMockRes();

      await adminJobController.exportJobMatchedCSV(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.headers['Content-Type']).toContain('text/csv');
      expect(res.body).toContain('Candidate Matched');
      expect(res.body).toContain('95%');
    });

    test('17. Applied export contains applied candidates only', async () => {
      const mockJob = { _id: jobIdA, collegeId: collegeIdA, company: 'Google', title: 'SDE' };
      JobDescription.findOne.mockResolvedValue(mockJob);

      const mockApps = [
        {
          _id: 'app1',
          status: 'APPLIED',
          appliedAt: new Date('2026-09-28T12:00:00Z'),
          studentId: {
            _id: studentIdA,
            name: 'Candidate Applied',
            email: 'applied@college.edu',
            rollNo: 'CS002',
            branch: 'CSE',
            batch: '2025',
            cgpa: 8.5,
            skills: ['java']
          }
        }
      ];

      const queryChain = {
        sort: jest.fn().mockReturnThis(),
        populate: jest.fn().mockResolvedValue(mockApps)
      };
      Application.find.mockReturnValue(queryChain);

      const req = {
        collegeId: collegeIdA,
        user: { id: 'admin1', role: 'COLLEGE_ADMIN' },
        params: { id: jobIdA }
      };
      const res = createMockRes();

      await adminJobController.exportJobApplicationsCSV(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.headers['Content-Type']).toContain('text/csv');
      expect(res.body).toContain('Candidate Applied');
      expect(res.body).toContain('APPLIED');
    });
  });
});
