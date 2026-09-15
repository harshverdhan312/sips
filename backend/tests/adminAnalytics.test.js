const adminAnalyticsController = require('../controllers/adminAnalyticsController');
const adminSkillController = require('../controllers/adminSkillController');
const Student = require('../models/Student');
const JobDescription = require('../models/JobDescription');
const Alert = require('../models/Alert');
const AuditLog = require('../models/AuditLog');
const Match = require('../models/Match');

jest.mock('../models/Student');
jest.mock('../models/JobDescription');
jest.mock('../models/Alert');
jest.mock('../models/AuditLog');
jest.mock('../models/Match');

describe('Admin Analytics & Skill Intelligence Controllers', () => {
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

  describe('getOverview', () => {
    test('should calculate correct placement rate and readiness averages', async () => {
      Student.countDocuments
        .mockResolvedValueOnce(100) // total
        .mockResolvedValueOnce(60)  // placed
        .mockResolvedValueOnce(10)  // in process
        .mockResolvedValueOnce(5);  // opted out

      JobDescription.countDocuments.mockResolvedValue(4);
      Alert.countDocuments.mockResolvedValue(2);
      AuditLog.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([
          { _id: 'l1', action: 'CREATE_JOB', actor: 'Admin', target: 'Google SDE', timestamp: new Date() }
        ])
      });

      Student.aggregate.mockResolvedValue([
        {
          avgReadiness: 78.4,
          avgTechnical: 82,
          avgSoftSkill: 75,
          avgResume: 79,
          avgCgpa: 8.35,
          atRiskCount: 8,
          readyCount: 65,
          needsImprovementCount: 27
        }
      ]);

      const req = createMockReq();
      const res = createMockRes();

      await adminAnalyticsController.getOverview(req, res);

      expect(res.body.success).toBe(true);
      const data = res.body.data;
      expect(data.totalStudents).toBe(100);
      expect(data.placedStudents).toBe(60);
      expect(data.eligibleStudents).toBe(95); // 100 - 5 opted out
      expect(data.placementRate).toBe(63);   // 60 / 95 * 100
      expect(data.avgReadinessScore).toBe(78);
      expect(data.avgTechnicalScore).toBe(82);
      expect(data.atRiskCount).toBe(8);
      expect(data.readyCount).toBe(65);
      expect(data.activeJobsCount).toBe(4);
      expect(data.recentActivity).toHaveLength(1);
    });

    test('should handle empty database gracefully without NaN or division by zero', async () => {
      Student.countDocuments.mockResolvedValue(0);
      JobDescription.countDocuments.mockResolvedValue(0);
      Alert.countDocuments.mockResolvedValue(0);
      AuditLog.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([])
      });
      Student.aggregate.mockResolvedValue([]);

      const req = createMockReq();
      const res = createMockRes();

      await adminAnalyticsController.getOverview(req, res);

      expect(res.body.success).toBe(true);
      const data = res.body.data;
      expect(data.totalStudents).toBe(0);
      expect(data.placementRate).toBe(0);
      expect(data.avgReadinessScore).toBe(0);
      expect(data.atRiskCount).toBe(0);
      expect(data.activeJobsCount).toBe(0);
    });
  });

  describe('getStudentAnalytics', () => {
    test('should return readiness tiers, department breakdown, and CGPA brackets', async () => {
      Student.aggregate
        .mockResolvedValueOnce([
          { _id: 'CSE', total: 60, avgReadiness: 81, avgCgpa: 8.5, placed: 40, atRisk: 3 }
        ])
        .mockResolvedValueOnce([
          { ready: 45, needsImprovement: 12, atRisk: 3 }
        ])
        .mockResolvedValueOnce([
          { _id: 8.0, count: 25 }
        ]);

      const req = createMockReq();
      const res = createMockRes();

      await adminAnalyticsController.getStudentAnalytics(req, res);

      expect(res.body.success).toBe(true);
      expect(res.body.data.readinessTiers).toHaveLength(3);
      expect(res.body.data.departments).toHaveLength(1);
      expect(res.body.data.departments[0].branch).toBe('CSE');
      expect(res.body.data.cgpaDistribution).toBeDefined();
    });
  });

  describe('getPlacementAnalytics', () => {
    test('should return status breakdown, department rates, CTC tiers, and recruiters', async () => {
      Student.aggregate
        .mockResolvedValueOnce([
          { _id: 'PLACED', count: 40 },
          { _id: 'UNPLACED', count: 20 }
        ])
        .mockResolvedValueOnce([
          { branch: 'CSE', total: 60, placed: 40, placementRate: 66.7, avgPackage: 14.5 }
        ])
        .mockResolvedValueOnce([
          { _id: 10, count: 15 } // 10 - 15 LPA tier
        ])
        .mockResolvedValueOnce([
          { company: 'Google', hires: 8, avgPackage: 24 }
        ])
        .mockResolvedValueOnce([
          { batch: '2025', total: 60, placed: 40, placementRate: 66.7, avgPackage: 14.5 }
        ]);

      const req = createMockReq();
      const res = createMockRes();

      await adminAnalyticsController.getPlacementAnalytics(req, res);

      expect(res.body.success).toBe(true);
      expect(res.body.data.statusBreakdown.PLACED).toBe(40);
      expect(res.body.data.departments).toHaveLength(1);
      expect(res.body.data.departments[0].placementRate).toBe(66.7);
      expect(res.body.data.topRecruiters).toHaveLength(1);
      expect(res.body.data.topRecruiters[0].company).toBe('Google');
    });
  });

  describe('getSkillIntelligence', () => {
    test('should compute top skills, demand, gaps, and missing skills', async () => {
      Student.aggregate
        .mockResolvedValueOnce([
          { _id: 'python', count: 50 },
          { _id: 'javascript', count: 40 }
        ])
        .mockResolvedValueOnce([
          { _id: 'CSE', topSkills: [{ skill: 'python', count: 35 }] }
        ]);

      JobDescription.aggregate.mockResolvedValueOnce([
        { _id: 'python', count: 8 },
        { _id: 'docker', count: 12 }
      ]);

      Match.aggregate.mockResolvedValueOnce([
        { _id: 'docker', frequency: 35 }
      ]);

      Student.countDocuments.mockResolvedValue(60);
      JobDescription.countDocuments.mockResolvedValue(15);

      const req = createMockReq();
      const res = createMockRes();

      await adminSkillController.getSkillIntelligence(req, res);

      expect(res.body.success).toBe(true);
      expect(res.body.data.studentSkills).toHaveLength(2);
      expect(res.body.data.demandedSkills).toHaveLength(2);
      expect(res.body.data.topMissingSkills).toHaveLength(1);
      expect(res.body.data.topMissingSkills[0].skill).toBe('docker');
      expect(res.body.data.gapAnalysis).toBeDefined();
    });
  });
});
