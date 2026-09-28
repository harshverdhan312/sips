const studentController = require('../controllers/studentController');
const githubService = require('../services/githubService');
const Student = require('../models/Student');
const memoryDb = require('../utils/memoryDb');

jest.mock('../models/Student');
jest.mock('../services/githubService');

describe('Student Featured Projects & GitHub Intelligence', () => {
  const mockCollegeId = '507f1f77bcf86cd799439011';
  const mockStudentId = '507f1f77bcf86cd799439022';
  const otherStudentId = '507f1f77bcf86cd799439033';
  const otherCollegeId = '507f1f77bcf86cd799439999';

  const mockRepos = [
    {
      repoId: 101,
      name: 'sips-mobile',
      fullName: 'harsh-dev/sips-mobile',
      owner: 'harsh-dev',
      htmlUrl: 'https://github.com/harsh-dev/sips-mobile',
      description: 'Flutter placement client',
      primaryLanguage: 'Dart',
      languages: ['Dart'],
      topics: ['flutter', 'riverpod'],
      stars: 12,
      forks: 2,
      isFork: false,
      updatedAt: new Date('2025-01-01'),
      pushedAt: new Date('2025-01-02')
    },
    {
      repoId: 102,
      name: 'ml-onnx-engine',
      fullName: 'harsh-dev/ml-onnx-engine',
      owner: 'harsh-dev',
      htmlUrl: 'https://github.com/harsh-dev/ml-onnx-engine',
      description: 'ONNX CPU placement inference',
      primaryLanguage: 'Python',
      languages: ['Python'],
      topics: ['onnx', 'machine-learning'],
      stars: 35,
      forks: 5,
      isFork: false,
      updatedAt: new Date('2025-02-01'),
      pushedAt: new Date('2025-02-02')
    },
    {
      repoId: 103,
      name: 'sips-backend',
      fullName: 'harsh-dev/sips-backend',
      owner: 'harsh-dev',
      htmlUrl: 'https://github.com/harsh-dev/sips-backend',
      description: 'Node.js Express backend',
      primaryLanguage: 'JavaScript',
      languages: ['JavaScript'],
      topics: ['express', 'mongodb'],
      stars: 20,
      forks: 4,
      isFork: false,
      updatedAt: new Date('2025-03-01'),
      pushedAt: new Date('2025-03-02')
    },
    {
      repoId: 104,
      name: 'extra-project',
      fullName: 'harsh-dev/extra-project',
      owner: 'harsh-dev',
      htmlUrl: 'https://github.com/harsh-dev/extra-project',
      description: 'Extra repo',
      primaryLanguage: 'TypeScript',
      languages: ['TypeScript'],
      topics: ['ts'],
      stars: 3,
      forks: 0,
      isFork: false,
      updatedAt: new Date('2025-04-01'),
      pushedAt: new Date('2025-04-02')
    }
  ];

  const createMockReq = (overrides = {}) => ({
    collegeId: mockCollegeId,
    user: { id: mockStudentId, role: 'STUDENT', email: 'student@test.edu' },
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

  beforeEach(() => {
    jest.clearAllMocks();
    githubService.extractUsername.mockImplementation((u) => u.replace(/^@/, ''));
    githubService.fetchUserRepositories.mockResolvedValue(mockRepos);
    githubService.fetchRepoLanguages.mockResolvedValue(['Dart', 'C++']);
  });

  describe('GET /api/student/github/repos', () => {
    test('1. Should return 400 if student has no linked GitHub handle', async () => {
      Student.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue({
          _id: mockStudentId,
          collegeId: mockCollegeId,
          github: '',
          projects: []
        })
      });
      Student.findOne.mockResolvedValue({
        _id: mockStudentId,
        collegeId: mockCollegeId,
        github: '',
        projects: []
      });

      const req = createMockReq();
      const res = createMockRes();
      const next = jest.fn();

      await studentController.getGithubRepos(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/no github handle/i);
    });

    test('2. Should fetch repositories for valid handle and mark isSelected', async () => {
      Student.findOne.mockResolvedValue({
        _id: mockStudentId,
        collegeId: mockCollegeId,
        github: 'harsh-dev',
        projects: [{ repoId: 101, name: 'sips-mobile' }]
      });

      const req = createMockReq();
      const res = createMockRes();
      const next = jest.fn();

      await studentController.getGithubRepos(req, res, next);

      expect(res.status).not.toHaveBeenCalledWith(400);
      expect(res.body.success).toBe(true);
      expect(res.body.repositories).toHaveLength(4);
      expect(res.body.repositories.find(r => r.repoId === 101).isSelected).toBe(true);
      expect(res.body.repositories.find(r => r.repoId === 102).isSelected).toBe(false);
    });
  });

  describe('GET /api/student/projects', () => {
    test('3. Should return stored featured projects sorted by order', async () => {
      Student.findOne.mockResolvedValue({
        _id: mockStudentId,
        collegeId: mockCollegeId,
        projects: [
          { repoId: 102, name: 'ml-onnx-engine', order: 2 },
          { repoId: 101, name: 'sips-mobile', order: 1 }
        ]
      });

      const req = createMockReq();
      const res = createMockRes();
      const next = jest.fn();

      await studentController.getProjects(req, res, next);

      expect(res.body.success).toBe(true);
      expect(res.body.projects[0].repoId).toBe(101);
      expect(res.body.projects[1].repoId).toBe(102);
    });
  });

  describe('PUT /api/student/projects', () => {
    test('4. Should save 1 valid project with order 1', async () => {
      const mockStudent = {
        _id: mockStudentId,
        collegeId: mockCollegeId,
        github: 'harsh-dev',
        projects: [],
        save: jest.fn().mockResolvedValue(true)
      };
      Student.findOne.mockResolvedValue(mockStudent);

      const req = createMockReq({ body: { repoIds: [101] } });
      const res = createMockRes();
      const next = jest.fn();

      await studentController.updateProjects(req, res, next);

      expect(res.body.success).toBe(true);
      expect(res.body.projects).toHaveLength(1);
      expect(res.body.projects[0].repoId).toBe(101);
      expect(res.body.projects[0].order).toBe(1);
      expect(mockStudent.save).toHaveBeenCalled();
    });

    test('5. Should save 2 valid projects in requested order', async () => {
      const mockStudent = {
        _id: mockStudentId,
        collegeId: mockCollegeId,
        github: 'harsh-dev',
        projects: [],
        save: jest.fn().mockResolvedValue(true)
      };
      Student.findOne.mockResolvedValue(mockStudent);

      const req = createMockReq({ body: { repoIds: [102, 101] } });
      const res = createMockRes();
      const next = jest.fn();

      await studentController.updateProjects(req, res, next);

      expect(res.body.success).toBe(true);
      expect(res.body.projects).toHaveLength(2);
      expect(res.body.projects[0].repoId).toBe(102);
      expect(res.body.projects[0].order).toBe(1);
      expect(res.body.projects[1].repoId).toBe(101);
      expect(res.body.projects[1].order).toBe(2);
    });

    test('6. Should save 3 valid projects', async () => {
      const mockStudent = {
        _id: mockStudentId,
        collegeId: mockCollegeId,
        github: 'harsh-dev',
        projects: [],
        save: jest.fn().mockResolvedValue(true)
      };
      Student.findOne.mockResolvedValue(mockStudent);

      const req = createMockReq({ body: { repoIds: [101, 102, 103] } });
      const res = createMockRes();
      const next = jest.fn();

      await studentController.updateProjects(req, res, next);

      expect(res.body.success).toBe(true);
      expect(res.body.projects).toHaveLength(3);
    });

    test('7. Should reject 4 projects with 400 Bad Request', async () => {
      const req = createMockReq({ body: { repoIds: [101, 102, 103, 104] } });
      const res = createMockRes();
      const next = jest.fn();

      await studentController.updateProjects(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/maximum of 3/i);
    });

    test('8. Should reject duplicate repository IDs with 400', async () => {
      const req = createMockReq({ body: { repoIds: [101, 101] } });
      const res = createMockRes();
      const next = jest.fn();

      await studentController.updateProjects(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/duplicate/i);
    });

    test('9. Should reject repository not belonging to student GitHub', async () => {
      const mockStudent = {
        _id: mockStudentId,
        collegeId: mockCollegeId,
        github: 'harsh-dev',
        projects: [],
        save: jest.fn()
      };
      Student.findOne.mockResolvedValue(mockStudent);

      // repo 999 does not exist in mockRepos
      const req = createMockReq({ body: { repoIds: [999] } });
      const res = createMockRes();
      const next = jest.fn();

      await studentController.updateProjects(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/does not exist or does not belong/i);
    });

    test('10. Should reject non-numeric or invalid repo IDs', async () => {
      const req = createMockReq({ body: { repoIds: ['abc', -5] } });
      const res = createMockRes();
      const next = jest.fn();

      await studentController.updateProjects(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.body.success).toBe(false);
    });

    test('11. Student A cannot modify Student B (scoped by auth user.id)', async () => {
      const mockStudentB = {
        _id: otherStudentId,
        collegeId: mockCollegeId,
        github: 'other-dev',
        projects: [{ repoId: 201, name: 'other-repo' }],
        save: jest.fn()
      };
      
      Student.findOne.mockImplementation(({ _id }) => {
        if (_id === mockStudentId) {
          return Promise.resolve({
            _id: mockStudentId,
            collegeId: mockCollegeId,
            github: 'harsh-dev',
            projects: [],
            save: jest.fn().mockResolvedValue(true)
          });
        }
        return Promise.resolve(mockStudentB);
      });

      const req = createMockReq({ body: { repoIds: [101] } });
      const res = createMockRes();
      const next = jest.fn();

      await studentController.updateProjects(req, res, next);

      expect(Student.findOne).toHaveBeenCalledWith({ _id: mockStudentId, collegeId: mockCollegeId });
      expect(mockStudentB.save).not.toHaveBeenCalled();
    });

    test('12. Tenant isolation works (scoped by collegeId)', async () => {
      Student.findOne.mockResolvedValue(null);

      const req = createMockReq({ collegeId: otherCollegeId, body: { repoIds: [101] } });
      const res = createMockRes();
      const next = jest.fn();

      await studentController.updateProjects(req, res, next);

      expect(Student.findOne).toHaveBeenCalledWith({ _id: mockStudentId, collegeId: otherCollegeId });
      expect(res.status).toHaveBeenCalledWith(404);
    });

    test('13. Project order is preserved exactly as submitted', async () => {
      const mockStudent = {
        _id: mockStudentId,
        collegeId: mockCollegeId,
        github: 'harsh-dev',
        projects: [],
        save: jest.fn().mockResolvedValue(true)
      };
      Student.findOne.mockResolvedValue(mockStudent);

      const req = createMockReq({ body: { repoIds: [103, 101, 102] } });
      const res = createMockRes();
      const next = jest.fn();

      await studentController.updateProjects(req, res, next);

      expect(res.body.projects[0].repoId).toBe(103);
      expect(res.body.projects[0].order).toBe(1);
      expect(res.body.projects[1].repoId).toBe(101);
      expect(res.body.projects[1].order).toBe(2);
      expect(res.body.projects[2].repoId).toBe(102);
      expect(res.body.projects[2].order).toBe(3);
    });

    test('14. Removing all projects with empty array works', async () => {
      const mockStudent = {
        _id: mockStudentId,
        collegeId: mockCollegeId,
        github: 'harsh-dev',
        projects: [{ repoId: 101, name: 'sips-mobile' }],
        save: jest.fn().mockResolvedValue(true)
      };
      Student.findOne.mockResolvedValue(mockStudent);

      const req = createMockReq({ body: { repoIds: [] } });
      const res = createMockRes();
      const next = jest.fn();

      await studentController.updateProjects(req, res, next);

      expect(res.body.success).toBe(true);
      expect(res.body.projects).toEqual([]);
      expect(mockStudent.projects).toEqual([]);
    });

    test('15. GitHub API rate-limiting / error is handled gracefully with error code', async () => {
      Student.findOne.mockResolvedValue({
        _id: mockStudentId,
        collegeId: mockCollegeId,
        github: 'harsh-dev'
      });

      const rateLimitError = new Error('GitHub API rate limit exceeded');
      rateLimitError.statusCode = 429;
      githubService.fetchUserRepositories.mockRejectedValue(rateLimitError);

      const req = createMockReq({ body: { repoIds: [101] } });
      const res = createMockRes();
      const next = jest.fn();

      await studentController.updateProjects(req, res, next);

      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/rate limit/i);
    });

    test('16. MemoryDb persistence works when MongoDB is disconnected', async () => {
      jest.spyOn(memoryDb, 'isMongoConnected').mockReturnValue(false);
      memoryDb.students = [];
      const inMemoryStudent = memoryDb.saveStudent({
        _id: mockStudentId,
        collegeId: mockCollegeId,
        name: 'Harsh In-Memory',
        rollNo: 'CS001',
        email: 'harsh@test.edu',
        passwordHash: 'hashed',
        github: 'harsh-dev',
        projects: []
      });

      const req = createMockReq({ body: { repoIds: [101] } });
      const res = createMockRes();
      const next = jest.fn();

      await studentController.updateProjects(req, res, next);

      expect(res.body.success).toBe(true);
      expect(res.body.projects).toHaveLength(1);
      
      const updatedMemStudent = memoryDb.findStudentById(mockStudentId);
      expect(updatedMemStudent.projects).toHaveLength(1);
      expect(updatedMemStudent.projects[0].repoId).toBe(101);

      memoryDb.isMongoConnected.mockRestore();
    });
  });
});
