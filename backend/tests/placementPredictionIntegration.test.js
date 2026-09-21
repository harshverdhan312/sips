const studentController = require('../controllers/studentController');
const Student = require('../models/Student');
const PlacementPrediction = require('../models/PlacementPrediction');
const mlService = require('../services/mlService');
const {
  mapBranchToStream,
  mapStudentToPlacementInput,
} = require('../utils/placementDataMapper');
const memoryDb = require('../utils/memoryDb');

jest.mock('../models/Student');
jest.mock('../models/PlacementPrediction');
jest.mock('../services/mlService');

describe('Phase 6B: Placement Prediction Pipeline Integration', () => {
  const mockCollegeId = '507f1f77bcf86cd799439011';
  const mockStudentId = '507f1f77bcf86cd799439022';
  const otherCollegeId = '507f1f77bcf86cd799439999';
  const otherStudentId = '507f1f77bcf86cd799439888';

  const createMockReq = (overrides = {}) => ({
    collegeId: mockCollegeId,
    user: { id: mockStudentId, role: 'STUDENT', email: 'ananya@college.edu' },
    query: {},
    params: {},
    body: {},
    ...overrides
  });

  const createMockRes = () => {
    const res = {};
    res.statusCode = 200;
    res.status = jest.fn().mockImplementation(code => {
      res.statusCode = code;
      return res;
    });
    res.json = jest.fn().mockImplementation(data => {
      res.data = data;
      return res;
    });
    return res;
  };

  const validStudentProfile = {
    _id: mockStudentId,
    collegeId: mockCollegeId,
    name: 'Ananya Sharma',
    email: 'ananya@college.edu',
    branch: 'Computer Science & Engineering',
    cgpa: 8.75,
    age: 21,
    internships: 2,
    hostel: true,
    historyOfBacklogs: 0,
    readinessScore: 88,
    technicalScore: 90,
    softSkillScore: 85,
    resumeScore: 82,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('1. Placement Mapper Contract Tests', () => {
    it('maps complete student profile to exact ML input features', () => {
      const { isValid, missingFields, payload } = mapStudentToPlacementInput(validStudentProfile);
      expect(isValid).toBe(true);
      expect(missingFields).toEqual([]);
      expect(payload).toEqual({
        Age: 21,
        Internships: 2,
        CGPA: 8.75,
        Hostel: 1,
        HistoryOfBacklogs: 0,
        Stream: 'Computer Science'
      });
    });

    it('correctly maps binary HistoryOfBacklogs: 0 -> 0, positive -> 1', () => {
      // 0 backlogs -> 0
      const studentClean = { ...validStudentProfile, historyOfBacklogs: 0 };
      expect(mapStudentToPlacementInput(studentClean).payload.HistoryOfBacklogs).toBe(0);

      // 1 backlog -> 1
      const studentOne = { ...validStudentProfile, historyOfBacklogs: 1 };
      expect(mapStudentToPlacementInput(studentOne).payload.HistoryOfBacklogs).toBe(1);

      // 3 backlogs -> 1
      const studentMultiple = { ...validStudentProfile, historyOfBacklogs: 3 };
      expect(mapStudentToPlacementInput(studentMultiple).payload.HistoryOfBacklogs).toBe(1);
    });

    it('correctly maps binary Hostel: false -> 0, true -> 1', () => {
      const studentHostel = { ...validStudentProfile, hostel: true };
      expect(mapStudentToPlacementInput(studentHostel).payload.Hostel).toBe(1);

      const studentDayScholar = { ...validStudentProfile, hostel: false };
      expect(mapStudentToPlacementInput(studentDayScholar).payload.Hostel).toBe(0);
    });

    it('correctly maps branches to validated FastAPI ML stream categories', () => {
      expect(mapBranchToStream('Computer Science & Engineering')).toBe('Computer Science');
      expect(mapBranchToStream('Computer Science and Engineering')).toBe('Computer Science');
      expect(mapBranchToStream('CSE')).toBe('Computer Science');
      expect(mapBranchToStream('Information Technology')).toBe('Information Technology');
      expect(mapBranchToStream('IT')).toBe('Information Technology');
      expect(mapBranchToStream('Information Science and Engineering')).toBe('Information Technology');
      expect(mapBranchToStream('Civil Engineering')).toBe('Civil');
      expect(mapBranchToStream('Mechanical Engineering')).toBe('Mechanical');
      expect(mapBranchToStream('Electrical & Electronics Engineering')).toBe('Electrical');
      expect(mapBranchToStream('Electronics and Communication Engineering')).toBe('Electronics And Communication');
    });

    it('detects missing required fields and blocks invalid payload without fabricating data', () => {
      const incompleteStudent = {
        _id: mockStudentId,
        branch: 'Computer Science',
        cgpa: null,
        age: null,
        internships: null,
        hostel: null,
        historyOfBacklogs: null,
      };

      const result = mapStudentToPlacementInput(incompleteStudent);
      expect(result.isValid).toBe(false);
      expect(result.missingFields).toContain('Age');
      expect(result.missingFields).toContain('Internships');
      expect(result.missingFields).toContain('CGPA');
      expect(result.missingFields).toContain('Hostel');
      expect(result.missingFields).toContain('HistoryOfBacklogs');
      expect(result.payload).toBeNull();
    });
  });

  describe('2. POST /api/student/analytics/placement/predict Controller Tests', () => {
    it('successfully generates and persists placement prediction for complete profile', async () => {
      Student.findOne.mockResolvedValue(validStudentProfile);

      const mlApiResponse = {
        placement_probability: 0.842,
        decision_threshold: 0.5,
        predicted_class: 1,
        predicted_label: 'Placed',
        model_version: 'random-forest-v1'
      };

      mlService.predictPlacement.mockResolvedValue(mlApiResponse);

      const savedDoc = {
        _id: 'pred_001',
        collegeId: mockCollegeId,
        studentId: mockStudentId,
        placementProbability: 0.842,
        decisionThreshold: 0.5,
        predictedClass: 1,
        predictedLabel: 'Placed',
        modelVersion: 'random-forest-v1',
        inputSnapshot: {
          Age: 21,
          Internships: 2,
          CGPA: 8.75,
          Hostel: 1,
          HistoryOfBacklogs: 0,
          Stream: 'Computer Science'
        },
        createdAt: new Date()
      };

      PlacementPrediction.create.mockResolvedValue(savedDoc);

      const req = createMockReq();
      const res = createMockRes();
      const next = jest.fn();

      await studentController.predictPlacement(req, res, next);

      expect(mlService.predictPlacement).toHaveBeenCalledTimes(1);
      expect(mlService.predictPlacement).toHaveBeenCalledWith({
        Age: 21,
        Internships: 2,
        CGPA: 8.75,
        Hostel: 1,
        HistoryOfBacklogs: 0,
        Stream: 'Computer Science'
      });

      expect(PlacementPrediction.create).toHaveBeenCalledTimes(1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.data.success).toBe(true);
      expect(res.data.prediction.placementProbability).toBe(0.842);
      expect(res.data.prediction.predictedLabel).toBe('Placed');

      // Verify Student profile readiness scores were NOT mutated
      expect(validStudentProfile.readinessScore).toBe(88);
      expect(validStudentProfile.technicalScore).toBe(90);
    });

    it('returns 422 with missing fields list and does NOT call ML service when inputs are incomplete', async () => {
      const incompleteStudent = {
        _id: mockStudentId,
        collegeId: mockCollegeId,
        name: 'Incomplete Student',
        branch: 'Computer Science & Engineering',
        cgpa: 8.5,
        age: null, // missing
        internships: 1,
        hostel: null, // missing
        historyOfBacklogs: 0
      };

      Student.findOne.mockResolvedValue(incompleteStudent);

      const req = createMockReq();
      const res = createMockRes();
      const next = jest.fn();

      await studentController.predictPlacement(req, res, next);

      expect(mlService.predictPlacement).not.toHaveBeenCalled();
      expect(PlacementPrediction.create).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(422);
      expect(res.data.success).toBe(false);
      expect(res.data.missingFields).toContain('Age');
      expect(res.data.missingFields).toContain('Hostel');
    });

    it('respects tenant isolation - queries student only within authenticated collegeId', async () => {
      Student.findOne.mockResolvedValue(null);

      const req = createMockReq({ collegeId: otherCollegeId });
      const res = createMockRes();
      const next = jest.fn();

      await studentController.predictPlacement(req, res, next);

      expect(Student.findOne).toHaveBeenCalledWith({
        _id: mockStudentId,
        collegeId: otherCollegeId
      });
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('forwards ML service operational errors safely without persisting failure', async () => {
      Student.findOne.mockResolvedValue(validStudentProfile);

      const upstreamError = new Error('ML Service timed out');
      upstreamError.statusCode = 504;
      mlService.predictPlacement.mockRejectedValue(upstreamError);

      const req = createMockReq();
      const res = createMockRes();
      const next = jest.fn();

      await studentController.predictPlacement(req, res, next);

      expect(PlacementPrediction.create).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(upstreamError);
    });
  });

  describe('3. GET /api/student/analytics/placement/prediction Controller Tests', () => {
    it('returns latest persisted prediction for authenticated student', async () => {
      const existingPrediction = {
        _id: 'pred_existing',
        collegeId: mockCollegeId,
        studentId: mockStudentId,
        placementProbability: 0.92,
        decisionThreshold: 0.5,
        predictedClass: 1,
        predictedLabel: 'Placed',
        modelVersion: 'random-forest-v1',
        createdAt: new Date('2026-09-20T10:00:00Z')
      };

      PlacementPrediction.findOne.mockReturnValue({
        sort: jest.fn().mockResolvedValue(existingPrediction)
      });

      const req = createMockReq();
      const res = createMockRes();
      const next = jest.fn();

      await studentController.getLatestPlacementPrediction(req, res, next);

      expect(PlacementPrediction.findOne).toHaveBeenCalledWith({
        collegeId: mockCollegeId,
        studentId: mockStudentId
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.data.success).toBe(true);
      expect(res.data.prediction.placementProbability).toBe(0.92);
    });

    it('returns honest null state when no prediction has been calculated yet', async () => {
      PlacementPrediction.findOne.mockReturnValue({
        sort: jest.fn().mockResolvedValue(null)
      });

      const req = createMockReq();
      const res = createMockRes();
      const next = jest.fn();

      await studentController.getLatestPlacementPrediction(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.data.success).toBe(true);
      expect(res.data.prediction).toBeNull();
    });

    it('enforces tenant isolation and student boundary on prediction lookup', async () => {
      PlacementPrediction.findOne.mockReturnValue({
        sort: jest.fn().mockResolvedValue(null)
      });

      const req = createMockReq({ collegeId: otherCollegeId });
      const res = createMockRes();
      const next = jest.fn();

      await studentController.getLatestPlacementPrediction(req, res, next);

      expect(PlacementPrediction.findOne).toHaveBeenCalledWith({
        collegeId: otherCollegeId,
        studentId: mockStudentId
      });
    });
  });

  describe('4. Memory DB Fallback Prediction Store Tests', () => {
    it('saves and retrieves latest prediction per student with tenant isolation', () => {
      const pred1 = {
        _id: 'p1',
        collegeId: mockCollegeId,
        studentId: mockStudentId,
        placementProbability: 0.75,
        predictedLabel: 'Placed',
        createdAt: new Date('2026-09-21T01:00:00Z')
      };

      const pred2 = {
        _id: 'p2',
        collegeId: mockCollegeId,
        studentId: mockStudentId,
        placementProbability: 0.88,
        predictedLabel: 'Placed',
        createdAt: new Date('2026-09-21T02:00:00Z')
      };

      memoryDb.savePlacementPrediction(pred1);
      memoryDb.savePlacementPrediction(pred2);

      const latest = memoryDb.getLatestPlacementPrediction(mockCollegeId, mockStudentId);
      expect(latest).toBeDefined();
      expect(latest._id).toBe('p2');
      expect(latest.placementProbability).toBe(0.88);

      // Other student or other college should not get this prediction
      expect(memoryDb.getLatestPlacementPrediction(otherCollegeId, mockStudentId)).toBeNull();
      expect(memoryDb.getLatestPlacementPrediction(mockCollegeId, otherStudentId)).toBeNull();
    });
  });
});
