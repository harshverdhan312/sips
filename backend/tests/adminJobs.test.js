const adminJobController = require('../controllers/adminJobController');
const JobDescription = require('../models/JobDescription');
const Student = require('../models/Student');
const Match = require('../models/Match');
const AuditLog = require('../models/AuditLog');

jest.mock('../models/JobDescription');
jest.mock('../models/Student');
jest.mock('../models/Match');
jest.mock('../models/AuditLog');

describe('Admin Job & Drive Controller', () => {
  const mockCollegeId = '507f1f77bcf86cd799439011';

  const createMockReq = (overrides = {}) => ({
    collegeId: mockCollegeId,
    user: { id: mockCollegeId, role: 'COLLEGE_ADMIN', email: 'admin@college.edu' },
    query: {},
    params: {},
    body: {},
    ...overrides
  });

  const createMockRes = () => {
    const res = {};
    res.statusCode = 200;
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

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getJobs', () => {
    test('should list jobs for college with status filter', async () => {
      const mockJobs = [
        { _id: 'j1', title: 'SDE 1', company: 'Amazon', status: 'ACTIVE' },
        { _id: 'j2', title: 'Data Analyst', company: 'Deloitte', status: 'ACTIVE' }
      ];

      JobDescription.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockJobs)
      });

      const req = createMockReq({ query: { status: 'ACTIVE' } });
      const res = createMockRes();

      await adminJobController.getJobs(req, res);

      expect(res.body.success).toBe(true);
      expect(res.body.jobs).toHaveLength(2);
      expect(JobDescription.find).toHaveBeenCalledWith(
        expect.objectContaining({ collegeId: mockCollegeId, status: 'ACTIVE' })
      );
    });
  });

  describe('createJob', () => {
    test('should create job, auto-extract skills, compute matches', async () => {
      const mockSavedJob = {
        _id: 'j1',
        collegeId: mockCollegeId,
        title: 'Full Stack Engineer',
        company: 'Stripe',
        description: 'Looking for React and Node.js developer with AWS',
        requiredSkills: ['react.js', 'node.js', 'aws'],
        save: jest.fn().mockResolvedValue(true)
      };

      JobDescription.mockImplementation(() => mockSavedJob);
      Student.find.mockResolvedValue([
        { _id: 's1', skills: ['react.js', 'node.js'] }
      ]);
      Student.countDocuments.mockResolvedValue(10);
      Match.findOneAndUpdate.mockResolvedValue({});
      Match.countDocuments.mockResolvedValue(1);
      AuditLog.create.mockResolvedValue({});

      const req = createMockReq({
        body: {
          title: 'Full Stack Engineer',
          company: 'Stripe',
          description: 'Looking for React and Node.js developer with AWS',
          ctc: '22 LPA'
        }
      });
      const res = createMockRes();

      await adminJobController.createJob(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.body.success).toBe(true);
      expect(res.body.job.company).toBe('Stripe');
      expect(Match.findOneAndUpdate).toHaveBeenCalled();
    });

    test('should reject creation when title, company, or description is missing', async () => {
      const req = createMockReq({ body: { title: 'Engineer' } });
      const res = createMockRes();

      await adminJobController.createJob(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.body.message).toContain('required');
    });
  });

  describe('getJobById', () => {
    test('should return job with computed applicant stats', async () => {
      const mockJob = {
        _id: 'j1',
        title: 'Backend Engineer',
        company: 'Oracle',
        minCgpa: 7.0,
        allowedBranches: ['CSE'],
        toObject: () => ({ _id: 'j1', title: 'Backend Engineer', company: 'Oracle' })
      };

      JobDescription.findOne.mockResolvedValue(mockJob);
      Student.countDocuments.mockResolvedValue(45);
      Match.countDocuments.mockResolvedValue(18);

      const req = createMockReq({ params: { id: 'j1' } });
      const res = createMockRes();

      await adminJobController.getJobById(req, res);

      expect(res.body.success).toBe(true);
      expect(res.body.job.batchEligibleCount).toBe(45);
      expect(res.body.job.batchMatchedCount).toBe(18);
    });
  });

  describe('deleteJob', () => {
    test('should delete job and associated match records', async () => {
      const mockJob = { _id: 'j1', title: 'SDE', company: 'Meta' };
      JobDescription.findOneAndDelete.mockResolvedValue(mockJob);
      Match.deleteMany.mockResolvedValue({ deletedCount: 50 });
      AuditLog.create.mockResolvedValue({});

      const req = createMockReq({ params: { id: 'j1' } });
      const res = createMockRes();

      await adminJobController.deleteJob(req, res);

      expect(res.body.success).toBe(true);
      expect(JobDescription.findOneAndDelete).toHaveBeenCalledWith({
        _id: 'j1',
        collegeId: mockCollegeId
      });
      expect(Match.deleteMany).toHaveBeenCalledWith({
        jdId: 'j1',
        collegeId: mockCollegeId
      });
    });
  });

  describe('getJobMatches', () => {
    test('should return ranked candidate matches for job', async () => {
      JobDescription.findOne.mockResolvedValue({ _id: 'j1', title: 'SDE' });
      const mockMatches = [
        {
          studentId: { _id: 's1', name: 'Alice', rollNo: '01' },
          score: 90,
          matchedSkills: ['react'],
          missingSkills: []
        },
        {
          studentId: { _id: 's2', name: 'Bob', rollNo: '02' },
          score: 75,
          matchedSkills: ['react'],
          missingSkills: ['aws']
        }
      ];

      Match.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockMatches)
      });

      const req = createMockReq({ params: { id: 'j1' } });
      const res = createMockRes();

      await adminJobController.getJobMatches(req, res);

      expect(res.body.success).toBe(true);
      expect(res.body.matches).toHaveLength(2);
      expect(res.body.matches[0].rank).toBe(1);
      expect(res.body.matches[0].score).toBe(90);
      expect(res.body.matches[1].rank).toBe(2);
    });
  });
});
