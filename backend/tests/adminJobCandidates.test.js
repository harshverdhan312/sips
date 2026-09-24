const adminJobController = require('../controllers/adminJobController');
const JobDescription = require('../models/JobDescription');
const Student = require('../models/Student');
const Match = require('../models/Match');
const Application = require('../models/Application');
const AuditLog = require('../models/AuditLog');

jest.mock('../models/JobDescription');
jest.mock('../models/Student');
jest.mock('../models/Match');
jest.mock('../models/Application');
jest.mock('../models/AuditLog');

describe('Admin Job Candidates: Matched vs Applied & CSV Export', () => {
  const mockCollegeA = '507f1f77bcf86cd799439011';
  const mockCollegeB = '507f1f77bcf86cd799439099';
  const mockJob1Id = '607f1f77bcf86cd799439001';
  const mockJob2Id = '607f1f77bcf86cd799439002';

  const createMockReq = (overrides = {}) => ({
    collegeId: mockCollegeA,
    user: { id: mockCollegeA, role: 'COLLEGE_ADMIN', email: 'admin@collegea.edu' },
    query: {},
    params: {},
    body: {},
    ...overrides
  });

  const createMockRes = () => {
    const res = {
      headers: {},
      statusCode: 200,
      sentData: null
    };
    res.status = jest.fn().mockImplementation((code) => {
      res.statusCode = code;
      return res;
    });
    res.json = jest.fn().mockImplementation((data) => {
      res.body = data;
      return res;
    });
    res.setHeader = jest.fn().mockImplementation((key, val) => {
      res.headers[key.toLowerCase()] = val;
      return res;
    });
    res.send = jest.fn().mockImplementation((data) => {
      res.sentData = data;
      return res;
    });
    return res;
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/admin/jobs/:id/matches (Matched Students)', () => {
    test('should return matched students ranked by score and enforce tenant isolation', async () => {
      JobDescription.findOne.mockResolvedValue({
        _id: mockJob1Id,
        title: 'Full Stack Engineer',
        company: 'Google India',
        collegeId: mockCollegeA
      });

      const mockMatches = [
        {
          studentId: {
            _id: 's1',
            name: 'Student A',
            email: 'a@college.edu',
            rollNo: 'CS01',
            branch: 'CSE',
            cgpa: 8.5
          },
          score: 85,
          matchedSkills: ['python', 'react.js'],
          missingSkills: ['docker']
        },
        {
          studentId: {
            _id: 's2',
            name: 'Student B',
            email: 'b@college.edu',
            rollNo: 'CS02',
            branch: 'CSE',
            cgpa: 9.0
          },
          score: 60,
          matchedSkills: ['python'],
          missingSkills: ['react.js', 'docker']
        }
      ];

      Match.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockMatches)
      });

      const req = createMockReq({ params: { id: mockJob1Id } });
      const res = createMockRes();

      await adminJobController.getJobMatches(req, res);

      expect(res.body.success).toBe(true);
      expect(res.body.totalMatches).toBe(2);
      expect(res.body.matches[0].student.name).toBe('Student A');
      expect(res.body.matches[0].score).toBe(85);
      expect(res.body.matches[1].student.name).toBe('Student B');
      expect(res.body.matches[1].score).toBe(60);

      expect(JobDescription.findOne).toHaveBeenCalledWith({
        _id: mockJob1Id,
        collegeId: mockCollegeA
      });
      expect(Match.find).toHaveBeenCalledWith(
        expect.objectContaining({ jdId: mockJob1Id, collegeId: mockCollegeA })
      );
    });

    test('should return 404 if job does not belong to current college tenant', async () => {
      JobDescription.findOne.mockResolvedValue(null);

      const req = createMockReq({ params: { id: 'cross-tenant-job' } });
      const res = createMockRes();

      await adminJobController.getJobMatches(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.body.message).toContain('Job not found');
    });
  });

  describe('GET /api/admin/jobs/:id/applicants (Applied Students)', () => {
    test('Scenario: Student A matched but not applied, Student B matched and applied -> only Student B returned in applied', async () => {
      JobDescription.findOne.mockResolvedValue({
        _id: mockJob1Id,
        title: 'Associate SDE',
        company: 'Meetkats Inc',
        collegeId: mockCollegeA
      });

      const mockApplications = [
        {
          _id: 'app-b',
          jobId: mockJob1Id,
          collegeId: mockCollegeA,
          status: 'APPLIED',
          appliedAt: new Date('2026-09-24T10:00:00Z'),
          studentId: {
            _id: 's2',
            name: 'Student B',
            email: 'b@college.edu',
            rollNo: 'CS02',
            usn: '1MS21CS002',
            branch: 'CSE',
            batch: '2025',
            cgpa: 9.0,
            skills: ['python']
          }
        }
      ];

      Application.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        populate: jest.fn().mockResolvedValue(mockApplications)
      });

      Match.find.mockReturnValue({
        lean: jest.fn().mockResolvedValue([
          { studentId: 's2', score: 60, matchedSkills: ['python'], missingSkills: ['react.js'] }
        ])
      });

      const req = createMockReq({ params: { id: mockJob1Id } });
      const res = createMockRes();

      await adminJobController.getJobApplicants(req, res);

      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(1);
      expect(res.body.applicants).toHaveLength(1);

      const applicant = res.body.applicants[0];
      expect(applicant.student.name).toBe('Student B');
      expect(applicant.status).toBe('APPLIED');
      expect(applicant.matchScore).toBe(60);
      expect(applicant.matchedSkills).toEqual(['python']);
      expect(applicant.missingSkills).toEqual(['react.js']);

      // Ensure Student A (who only matched but didn't apply) is NOT in the applied response
      const studentNames = res.body.applicants.map(a => a.student.name);
      expect(studentNames).not.toContain('Student A');
    });

    test('should return empty list when 0 students have applied', async () => {
      JobDescription.findOne.mockResolvedValue({
        _id: mockJob1Id,
        title: 'Associate SDE',
        company: 'Meetkats Inc',
        collegeId: mockCollegeA
      });

      Application.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        populate: jest.fn().mockResolvedValue([])
      });
      Match.find.mockReturnValue({
        lean: jest.fn().mockResolvedValue([])
      });

      const req = createMockReq({ params: { id: mockJob1Id } });
      const res = createMockRes();

      await adminJobController.getJobApplicants(req, res);

      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(0);
      expect(res.body.applicants).toEqual([]);
    });

    test('should NOT include students who applied to a DIFFERENT job (Job 2 vs Job 1)', async () => {
      JobDescription.findOne.mockResolvedValue({
        _id: mockJob1Id,
        title: 'Job 1',
        company: 'Company 1',
        collegeId: mockCollegeA
      });

      // Query should be scoped strictly to mockJob1Id
      Application.find.mockImplementation((query) => {
        expect(query.jobId).toEqual(mockJob1Id);
        expect(query.collegeId).toEqual(mockCollegeA);
        return {
          sort: jest.fn().mockReturnThis(),
          populate: jest.fn().mockResolvedValue([])
        };
      });

      Match.find.mockReturnValue({
        lean: jest.fn().mockResolvedValue([])
      });

      const req = createMockReq({ params: { id: mockJob1Id } });
      const res = createMockRes();

      await adminJobController.getJobApplicants(req, res);

      expect(res.body.success).toBe(true);
      expect(res.body.applicants).toHaveLength(0);
    });

    test('should enforce college tenant isolation on applicants retrieval', async () => {
      JobDescription.findOne.mockResolvedValue(null);

      const req = createMockReq({ params: { id: 'other-college-job' } });
      const res = createMockRes();

      await adminJobController.getJobApplicants(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.body.message).toContain('Job not found');
      expect(Application.find).not.toHaveBeenCalled();
    });
  });

  describe('CSV Exports (Matched & Applied)', () => {
    test('GET /api/admin/jobs/:id/matched/export should export matched candidates CSV with correct headers and escaping', async () => {
      JobDescription.findOne.mockResolvedValue({
        _id: mockJob1Id,
        title: 'Cloud Architect',
        company: 'Google India',
        collegeId: mockCollegeA
      });

      const mockMatches = [
        {
          studentId: {
            name: 'Aarav "Ace" Sharma',
            email: 'aarav@college.edu',
            rollNo: '230101',
            usn: '1MS23CS01',
            branch: 'CSE',
            batch: '2026',
            cgpa: 9.2
          },
          score: 95,
          matchedSkills: ['python', 'gcp'],
          missingSkills: ['terraform']
        }
      ];

      Match.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockMatches)
      });

      const req = createMockReq({ params: { id: mockJob1Id } });
      const res = createMockRes();

      await adminJobController.exportJobMatchedCSV(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toContain('text/csv');
      expect(res.headers['content-disposition']).toContain('google-india-matched-students.csv');

      const csvLines = res.sentData.split('\n');
      expect(csvLines[0]).toBe('Student Name,Email,Roll Number,USN,Branch,Batch,CGPA,Match Score,Matched Skills,Missing Skills');
      expect(csvLines[1]).toContain('"Aarav ""Ace"" Sharma"');
      expect(csvLines[1]).toContain('95%');
      expect(csvLines[1]).toContain('"python, gcp"');
      expect(csvLines[1]).toContain('"terraform"');
    });

    test('GET /api/admin/jobs/:id/applications/export should export applied candidates CSV with status and applied date', async () => {
      JobDescription.findOne.mockResolvedValue({
        _id: mockJob1Id,
        title: 'Backend Engineer',
        company: 'Stripe',
        collegeId: mockCollegeA
      });

      const mockApps = [
        {
          _id: 'app-1',
          status: 'SHORTLISTED',
          appliedAt: new Date('2026-09-24T08:30:00Z'),
          studentId: {
            _id: 's1',
            name: 'Priya Patel',
            email: 'priya@college.edu',
            rollNo: '230102',
            usn: '1MS23CS02',
            branch: 'ECE',
            batch: '2026',
            cgpa: 8.8,
            skills: ['python', 'sql']
          }
        }
      ];

      Application.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        populate: jest.fn().mockResolvedValue(mockApps)
      });

      Match.find.mockReturnValue({
        lean: jest.fn().mockResolvedValue([
          { studentId: 's1', score: 80 }
        ])
      });

      const req = createMockReq({ params: { id: mockJob1Id } });
      const res = createMockRes();

      await adminJobController.exportJobApplicationsCSV(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toContain('text/csv');
      expect(res.headers['content-disposition']).toContain('stripe-applied-students.csv');

      const csvLines = res.sentData.split('\n');
      expect(csvLines[0]).toBe('Student Name,Email,Roll Number,USN,Branch,Batch,CGPA,Match Score,Application Status,Applied At');
      expect(csvLines[1]).toContain('"Priya Patel"');
      expect(csvLines[1]).toContain('80%');
      expect(csvLines[1]).toContain('"SHORTLISTED"');
      expect(csvLines[1]).toContain('2026-09-24T08:30:00.000Z');
    });
  });
});
