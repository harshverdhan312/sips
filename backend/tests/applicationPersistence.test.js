const studentController = require('../controllers/studentController');
const adminJobController = require('../controllers/adminJobController');
const Application = require('../models/Application');
const JobDescription = require('../models/JobDescription');
const Student = require('../models/Student');
const Match = require('../models/Match');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');

jest.mock('../models/Application');
jest.mock('../models/JobDescription');
jest.mock('../models/Student');
jest.mock('../models/Match');
jest.mock('../models/Notification');
jest.mock('../models/AuditLog');

describe('Phase 3: Application Persistence', () => {
  const collegeIdA = '507f1f77bcf86cd799439011';
  const collegeIdB = '507f1f77bcf86cd799439099';
  const studentIdA = '507f1f77bcf86cd799439022';
  const studentIdB = '507f1f77bcf86cd799439033';
  const jobIdA = '507f1f77bcf86cd799439044';
  const jobIdB = '507f1f77bcf86cd799439055';
  const applicationIdA = '507f1f77bcf86cd799439066';

  const createMockReq = (overrides = {}) => ({
    collegeId: collegeIdA,
    user: { id: studentIdA, role: 'STUDENT', email: 'priya@college.edu' },
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
    return res;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    Notification.create.mockResolvedValue({});
    AuditLog.create.mockResolvedValue({});

    // Default static helpers on Application model mock
    Application.VALID_STATUSES = ['APPLIED', 'SHORTLISTED', 'REJECTED', 'SELECTED', 'WITHDRAWN'];
    Application.ALLOWED_TRANSITIONS = {
      APPLIED: ['SHORTLISTED', 'REJECTED', 'WITHDRAWN', 'SELECTED'],
      SHORTLISTED: ['SELECTED', 'REJECTED', 'WITHDRAWN'],
      REJECTED: [],
      SELECTED: [],
      WITHDRAWN: []
    };
    Application.isValidTransition = (curr, next) => {
      if (curr === next) return true;
      const allowed = Application.ALLOWED_TRANSITIONS[curr] || [];
      return allowed.includes(next);
    };
  });

  // ==========================================
  // 1. Student Application Submission
  // ==========================================
  describe('POST /api/student/jobs/:id/apply (applyToJob)', () => {
    test('authenticated student can apply to active job in their college', async () => {
      const mockJob = {
        _id: jobIdA,
        collegeId: collegeIdA,
        title: 'Backend Engineer',
        company: 'Google',
        status: 'ACTIVE',
        deadline: new Date(Date.now() + 86400000)
      };

      JobDescription.findOne.mockResolvedValue(mockJob);
      Application.findOne.mockResolvedValue(null); // No existing application

      let savedDoc;
      Application.mockImplementation(function(data) {
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

      const req = createMockReq({
        params: { id: jobIdA },
        body: {
          studentId: 'maliciousStudentId',
          collegeId: 'maliciousCollegeId',
          status: 'SELECTED' // Attempted client-side forgery
        }
      });
      const res = createMockRes();

      await studentController.applyToJob(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toMatch(/submitted successfully/i);

      // Verify server-enforced authoritative fields
      expect(savedDoc.collegeId).toBe(collegeIdA);
      expect(savedDoc.studentId).toBe(studentIdA);
      expect(savedDoc.jobId).toBe(jobIdA);
      expect(savedDoc.status).toBe('APPLIED');
    });

    test('should reject application if job belongs to another college (cross-tenant isolation)', async () => {
      JobDescription.findOne.mockResolvedValue(null); // Tenant query will not find College B job for College A student

      const req = createMockReq({ params: { id: jobIdB } });
      const res = createMockRes();

      await studentController.applyToJob(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.body.message).toMatch(/Job not found/i);
    });

    test('should reject application if job is closed', async () => {
      const closedJob = {
        _id: jobIdA,
        collegeId: collegeIdA,
        title: 'Backend Engineer',
        company: 'Google',
        status: 'CLOSED'
      };

      JobDescription.findOne.mockResolvedValue(closedJob);

      const req = createMockReq({ params: { id: jobIdA } });
      const res = createMockRes();

      await studentController.applyToJob(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.body.message).toMatch(/closed/i);
    });

    test('should reject application if job deadline has passed', async () => {
      const expiredJob = {
        _id: jobIdA,
        collegeId: collegeIdA,
        title: 'Backend Engineer',
        company: 'Google',
        status: 'ACTIVE',
        deadline: new Date(Date.now() - 86400000) // Yesterday
      };

      JobDescription.findOne.mockResolvedValue(expiredJob);

      const req = createMockReq({ params: { id: jobIdA } });
      const res = createMockRes();

      await studentController.applyToJob(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.body.message).toMatch(/deadline.*passed/i);
    });

    test('should return 409 Conflict if student has already applied', async () => {
      const mockJob = {
        _id: jobIdA,
        collegeId: collegeIdA,
        status: 'ACTIVE'
      };

      JobDescription.findOne.mockResolvedValue(mockJob);
      Application.findOne.mockResolvedValue({
        _id: applicationIdA,
        status: 'APPLIED'
      });

      const req = createMockReq({ params: { id: jobIdA } });
      const res = createMockRes();

      await studentController.applyToJob(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.body.message).toMatch(/already applied/i);
    });
  });

  // ==========================================
  // 2. Student Application Listing & Details
  // ==========================================
  describe('GET /api/student/applications & /api/student/applications/:id', () => {
    test('student sees own applications with populated job details', async () => {
      const mockApplications = [
        {
          _id: applicationIdA,
          collegeId: collegeIdA,
          studentId: studentIdA,
          status: 'APPLIED',
          appliedAt: new Date(),
          jobId: {
            _id: jobIdA,
            title: 'Frontend Developer',
            company: 'Microsoft',
            ctc: '18 LPA'
          }
        }
      ];

      Application.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        populate: jest.fn().mockResolvedValue(mockApplications)
      });

      const req = createMockReq();
      const res = createMockRes();

      await studentController.getApplications(req, res);

      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(1);
      expect(res.body.applications[0].jobId.company).toBe('Microsoft');
      expect(Application.find).toHaveBeenCalledWith({
        collegeId: collegeIdA,
        studentId: studentIdA
      });
    });

    test('student can get single application detail with ownership verification', async () => {
      const mockApp = {
        _id: applicationIdA,
        collegeId: collegeIdA,
        studentId: studentIdA,
        status: 'SHORTLISTED',
        jobId: {
          _id: jobIdA,
          title: 'Full Stack Dev',
          company: 'Amazon'
        }
      };

      Application.findOne.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockApp)
      });

      const req = createMockReq({ params: { id: applicationIdA } });
      const res = createMockRes();

      await studentController.getApplicationById(req, res);

      expect(res.body.success).toBe(true);
      expect(res.body.application.status).toBe('SHORTLISTED');
      expect(Application.findOne).toHaveBeenCalledWith({
        _id: applicationIdA,
        collegeId: collegeIdA,
        studentId: studentIdA
      });
    });

    test('accessing another student\'s application returns 404', async () => {
      Application.findOne.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null) // Not found under studentIdA
      });

      const req = createMockReq({ params: { id: 'otherStudentAppId' } });
      const res = createMockRes();

      await studentController.getApplicationById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.body.message).toMatch(/Application not found/i);
    });
  });

  // ==========================================
  // 3. Student Application Withdrawal
  // ==========================================
  describe('PATCH /api/student/applications/:id/withdraw', () => {
    test('student can withdraw active APPLIED application', async () => {
      const mockApp = {
        _id: applicationIdA,
        collegeId: collegeIdA,
        studentId: studentIdA,
        status: 'APPLIED',
        save: jest.fn().mockResolvedValue(true)
      };

      Application.findOne.mockResolvedValue(mockApp);

      const req = createMockReq({ params: { id: applicationIdA } });
      const res = createMockRes();

      await studentController.withdrawApplication(req, res);

      expect(res.body.success).toBe(true);
      expect(res.body.message).toMatch(/withdrawn successfully/i);
      expect(mockApp.status).toBe('WITHDRAWN');
      expect(mockApp.save).toHaveBeenCalled();
    });

    test('student cannot withdraw an already WITHDRAWN application', async () => {
      const mockApp = {
        _id: applicationIdA,
        collegeId: collegeIdA,
        studentId: studentIdA,
        status: 'WITHDRAWN'
      };

      Application.findOne.mockResolvedValue(mockApp);

      const req = createMockReq({ params: { id: applicationIdA } });
      const res = createMockRes();

      await studentController.withdrawApplication(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.body.message).toMatch(/already withdrawn/i);
    });

    test('student cannot withdraw a finalized SELECTED or REJECTED application', async () => {
      const mockApp = {
        _id: applicationIdA,
        collegeId: collegeIdA,
        studentId: studentIdA,
        status: 'SELECTED'
      };

      Application.findOne.mockResolvedValue(mockApp);

      const req = createMockReq({ params: { id: applicationIdA } });
      const res = createMockRes();

      await studentController.withdrawApplication(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.body.message).toMatch(/finalized application/i);
    });
  });

  // ==========================================
  // 4. Job Response Integration (hasApplied & applicationStatus)
  // ==========================================
  describe('GET /api/student/jobs (Authoritative Application State)', () => {
    test('enriches jobs with hasApplied: true and applicationStatus when student applied', async () => {
      const mockJobs = [
        {
          _id: jobIdA,
          title: 'Software Engineer',
          company: 'Google',
          toObject: function() { return { ...this }; }
        },
        {
          _id: 'otherJobId',
          title: 'QA Engineer',
          company: 'Infosys',
          toObject: function() { return { ...this }; }
        }
      ];

      const mockStudent = {
        _id: studentIdA,
        skills: ['python']
      };

      const mockApplications = [
        {
          jobId: jobIdA,
          status: 'SHORTLISTED'
        }
      ];

      JobDescription.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockJobs)
      });
      Student.findOne.mockResolvedValue(mockStudent);
      Match.find.mockResolvedValue([]);
      Application.find.mockResolvedValue(mockApplications);

      const req = createMockReq();
      const res = createMockRes();

      await studentController.getJobs(req, res);

      expect(res.body).toHaveLength(2);
      // Job 1 (Applied)
      expect(res.body[0].hasApplied).toBe(true);
      expect(res.body[0].applicationStatus).toBe('SHORTLISTED');
      // Job 2 (Not Applied)
      expect(res.body[1].hasApplied).toBe(false);
      expect(res.body[1].applicationStatus).toBeNull();
    });
  });

  // ==========================================
  // 5. Admin Applicant Management & Status Updates
  // ==========================================
  describe('Admin Applicant Management (adminJobController)', () => {
    test('admin can list applicants for a job in their college', async () => {
      const mockJob = {
        _id: jobIdA,
        collegeId: collegeIdA,
        title: 'Backend Dev',
        company: 'Meta'
      };

      const mockApplications = [
        {
          _id: applicationIdA,
          status: 'APPLIED',
          appliedAt: new Date(),
          updatedAt: new Date(),
          studentId: {
            _id: studentIdA,
            name: 'Priya Sharma',
            rollNo: '1RV21CS045',
            usn: '1RV21CS045',
            email: 'priya@college.edu',
            branch: 'CSE',
            batch: '2025',
            cgpa: 9.0,
            placementStatus: 'UNPLACED',
            readinessScore: 85
          }
        }
      ];

      JobDescription.findOne.mockResolvedValue(mockJob);
      Application.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        populate: jest.fn().mockResolvedValue(mockApplications)
      });

      const req = {
        collegeId: collegeIdA,
        user: { id: 'admin1', role: 'COLLEGE_ADMIN', email: 'admin@college.edu' },
        params: { id: jobIdA }
      };
      const res = createMockRes();

      await adminJobController.getJobApplicants(req, res);

      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(1);
      expect(res.body.applicants[0].student.name).toBe('Priya Sharma');
      expect(res.body.applicants[0].status).toBe('APPLIED');
    });

    test('admin cannot access applicants of a job from another college', async () => {
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

    test('admin can update application status with valid lifecycle transition', async () => {
      const mockApp = {
        _id: applicationIdA,
        collegeId: collegeIdA,
        status: 'APPLIED',
        save: jest.fn().mockResolvedValue(true)
      };

      Application.findOne.mockResolvedValue(mockApp);

      const req = {
        collegeId: collegeIdA,
        user: { id: 'admin1', role: 'COLLEGE_ADMIN', email: 'admin@college.edu' },
        params: { id: applicationIdA },
        body: { status: 'SHORTLISTED' }
      };
      const res = createMockRes();

      await adminJobController.updateApplicationStatus(req, res);

      expect(res.body.success).toBe(true);
      expect(mockApp.status).toBe('SHORTLISTED');
      expect(mockApp.save).toHaveBeenCalled();
    });

    test('admin status update rejects invalid transition (e.g. REJECTED -> SELECTED)', async () => {
      const mockApp = {
        _id: applicationIdA,
        collegeId: collegeIdA,
        status: 'REJECTED'
      };

      Application.findOne.mockResolvedValue(mockApp);

      const req = {
        collegeId: collegeIdA,
        user: { id: 'admin1', role: 'COLLEGE_ADMIN', email: 'admin@college.edu' },
        params: { id: applicationIdA },
        body: { status: 'SELECTED' }
      };
      const res = createMockRes();

      await adminJobController.updateApplicationStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.body.message).toMatch(/Invalid status transition/i);
    });

    test('admin status update rejects unrecognized status string', async () => {
      const req = {
        collegeId: collegeIdA,
        user: { id: 'admin1', role: 'COLLEGE_ADMIN' },
        params: { id: applicationIdA },
        body: { status: 'INVALID_STATUS' }
      };
      const res = createMockRes();

      await adminJobController.updateApplicationStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.body.message).toMatch(/Invalid status/i);
    });
  });
});
