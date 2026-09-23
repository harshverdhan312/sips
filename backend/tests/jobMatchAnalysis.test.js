const studentController = require('../controllers/studentController');
const Student = require('../models/Student');
const JobDescription = require('../models/JobDescription');
const mlService = require('../services/mlService');

jest.mock('../models/Student');
jest.mock('../models/JobDescription');
jest.mock('../services/mlService');

describe('Job Match ML Analysis Controller', () => {
  const mockCollegeId = '507f1f77bcf86cd799439011';
  const mockStudentId = '507f1f77bcf86cd799439022';
  const mockJobId = '507f1f77bcf86cd799439033';

  const createMockReq = (overrides = {}) => ({
    collegeId: mockCollegeId,
    user: { id: mockStudentId, role: 'STUDENT', email: 'student@college.edu' },
    params: { id: mockJobId },
    query: {},
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
      res.body = data;
      return res;
    });
    return res;
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 404 if student is not found', async () => {
    Student.findOne.mockResolvedValue(null);
    JobDescription.findOne.mockResolvedValue({ _id: mockJobId });

    const req = createMockReq();
    const res = createMockRes();
    const next = jest.fn();

    await studentController.analyzeJobMatch(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.body.message).toMatch(/Student profile not found/i);
  });

  it('should return 404 if job is not found', async () => {
    Student.findOne.mockResolvedValue({ _id: mockStudentId, skills: ['Python'] });
    JobDescription.findOne.mockResolvedValue(null);

    const req = createMockReq();
    const res = createMockRes();
    const next = jest.fn();

    await studentController.analyzeJobMatch(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.body.message).toMatch(/Job opportunity not found/i);
  });

  it('should return hybrid match analysis from FastAPI ML service when available', async () => {
    Student.findOne.mockResolvedValue({
      _id: mockStudentId,
      collegeId: mockCollegeId,
      skills: ['Python', 'SQL', 'FastAPI']
    });

    JobDescription.findOne.mockResolvedValue({
      _id: mockJobId,
      collegeId: mockCollegeId,
      title: 'Backend Engineer',
      company: 'Tech Corp',
      description: 'Looking for Python and SQL engineer.',
      requiredSkills: ['Python', 'SQL', 'Docker']
    });

    mlService.hybridMatchResume.mockResolvedValue({
      matched_skills: ['python', 'sql'],
      missing_skills: ['docker'],
      skill_coverage_score: 66.67,
      semantic_similarity: 0.88,
      semantic_score: 88.0,
      hybrid_match_score: 75.2,
      skill_weight: 0.6,
      semantic_weight: 0.4
    });

    const req = createMockReq();
    const res = createMockRes();
    const next = jest.fn();

    await studentController.analyzeJobMatch(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.body.success).toBe(true);
    expect(res.body.mlStatus).toBe('completed');
    expect(res.body.hybridMatch.hybrid_match_score).toBe(75.2);
    expect(res.body.hybridMatch.matched_skills).toEqual(['python', 'sql']);
    expect(res.body.hybridMatch.missing_skills).toEqual(['docker']);
    expect(res.body.hybridMatch.semantic_similarity).toBe(0.88);
  });

  it('should fall back gracefully to deterministic keyword match when FastAPI is offline', async () => {
    Student.findOne.mockResolvedValue({
      _id: mockStudentId,
      collegeId: mockCollegeId,
      skills: ['Python', 'SQL']
    });

    JobDescription.findOne.mockResolvedValue({
      _id: mockJobId,
      collegeId: mockCollegeId,
      title: 'Backend Engineer',
      company: 'Tech Corp',
      description: 'Looking for Python and SQL engineer.',
      requiredSkills: ['Python', 'SQL', 'Docker']
    });

    mlService.hybridMatchResume.mockRejectedValue(new Error('FastAPI offline'));

    const req = createMockReq();
    const res = createMockRes();
    const next = jest.fn();

    await studentController.analyzeJobMatch(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.body.success).toBe(true);
    expect(res.body.mlStatus).toBe('offline');
    expect(res.body.hybridMatch.matched_skills).toEqual(expect.arrayContaining(['python', 'sql']));
    expect(res.body.hybridMatch.missing_skills).toEqual(['docker']);
  });
});
