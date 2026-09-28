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

  describe('POST /api/student/projects/sync', () => {
    test('17. Should return 400 if student has no linked GitHub handle', async () => {
      Student.findOne.mockResolvedValue({
        _id: mockStudentId,
        collegeId: mockCollegeId,
        github: '',
        projects: [{ repoId: 101, name: 'sips-mobile' }]
      });

      const req = createMockReq();
      const res = createMockRes();
      const next = jest.fn();

      await studentController.syncProjects(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/no github handle/i);
    });

    test('18. Should return valid no-op response if student has 0 selected projects', async () => {
      Student.findOne.mockResolvedValue({
        _id: mockStudentId,
        collegeId: mockCollegeId,
        github: 'harsh-dev',
        projects: []
      });

      const req = createMockReq();
      const res = createMockRes();
      const next = jest.fn();

      await studentController.syncProjects(req, res, next);

      expect(res.body.success).toBe(true);
      expect(res.body.projects).toEqual([]);
      expect(res.body.updatedCount).toBe(0);
      expect(res.body.missingCount).toBe(0);
      expect(res.body.missingProjects).toEqual([]);
      expect(githubService.fetchUserRepositories).not.toHaveBeenCalled();
    });

    test('19. Should sync 3 selected projects, refresh metadata, update syncedAt, and preserve order', async () => {
      const existingSelectedAt = new Date('2025-01-01T00:00:00Z');
      const mockStudent = {
        _id: mockStudentId,
        collegeId: mockCollegeId,
        github: 'harsh-dev',
        projects: [
          {
            repoId: 103,
            name: 'old-sips-backend-name',
            description: 'old desc 3',
            stars: 0,
            forks: 0,
            order: 1,
            selectedAt: existingSelectedAt,
            syncedAt: null
          },
          {
            repoId: 101,
            name: 'old-sips-mobile',
            description: 'old desc 1',
            stars: 0,
            forks: 0,
            order: 2,
            selectedAt: existingSelectedAt,
            syncedAt: null
          },
          {
            repoId: 102,
            name: 'old-ml-onnx',
            description: 'old desc 2',
            stars: 0,
            forks: 0,
            order: 3,
            selectedAt: existingSelectedAt,
            syncedAt: null
          }
        ],
        save: jest.fn().mockResolvedValue(true)
      };
      Student.findOne.mockResolvedValue(mockStudent);

      // GitHub repos return updated metadata with repo 103 renamed to sips-backend-renamed
      const updatedMockRepos = [
        {
          repoId: 101,
          name: 'sips-mobile',
          fullName: 'harsh-dev/sips-mobile',
          owner: 'harsh-dev',
          htmlUrl: 'https://github.com/harsh-dev/sips-mobile',
          description: 'Updated Flutter client with Riverpod 2.0',
          primaryLanguage: 'Dart',
          topics: ['flutter', 'riverpod', 'mobile'],
          stars: 100,
          forks: 25,
          isFork: false,
          updatedAt: new Date('2025-06-01')
        },
        {
          repoId: 102,
          name: 'ml-onnx-engine',
          fullName: 'harsh-dev/ml-onnx-engine',
          owner: 'harsh-dev',
          htmlUrl: 'https://github.com/harsh-dev/ml-onnx-engine',
          description: 'Updated ONNX Engine with Quantization',
          primaryLanguage: 'Python',
          topics: ['onnx', 'quantization'],
          stars: 250,
          forks: 60,
          isFork: false,
          updatedAt: new Date('2025-06-02')
        },
        {
          repoId: 103,
          name: 'sips-backend-renamed',
          fullName: 'harsh-dev/sips-backend-renamed',
          owner: 'harsh-dev',
          htmlUrl: 'https://github.com/harsh-dev/sips-backend-renamed',
          description: 'Updated Express backend with Redis caching',
          primaryLanguage: 'JavaScript',
          topics: ['express', 'mongodb', 'redis'],
          stars: 88,
          forks: 18,
          isFork: false,
          updatedAt: new Date('2025-06-03')
        }
      ];

      githubService.fetchUserRepositories.mockResolvedValue(updatedMockRepos);

      const req = createMockReq();
      const res = createMockRes();
      const next = jest.fn();

      await studentController.syncProjects(req, res, next);

      expect(res.body.success).toBe(true);
      expect(res.body.updatedCount).toBe(3);
      expect(res.body.missingCount).toBe(0);
      expect(res.body.missingProjects).toEqual([]);
      expect(githubService.fetchUserRepositories).toHaveBeenCalledWith('harsh-dev', true);

      // Verify order is preserved: 103 (order 1), 101 (order 2), 102 (order 3)
      expect(res.body.projects[0].repoId).toBe(103);
      expect(res.body.projects[0].order).toBe(1);
      expect(res.body.projects[0].name).toBe('sips-backend-renamed');
      expect(res.body.projects[0].description).toBe('Updated Express backend with Redis caching');
      expect(res.body.projects[0].stars).toBe(88);
      expect(res.body.projects[0].topics).toContain('redis');
      expect(res.body.projects[0].selectedAt).toEqual(existingSelectedAt);
      expect(res.body.projects[0].syncedAt).toBeInstanceOf(Date);

      expect(res.body.projects[1].repoId).toBe(101);
      expect(res.body.projects[1].order).toBe(2);
      expect(res.body.projects[1].description).toBe('Updated Flutter client with Riverpod 2.0');
      expect(res.body.projects[1].stars).toBe(100);
      expect(res.body.projects[1].syncedAt).toBeInstanceOf(Date);

      expect(res.body.projects[2].repoId).toBe(102);
      expect(res.body.projects[2].order).toBe(3);
      expect(res.body.projects[2].stars).toBe(250);
      expect(res.body.projects[2].syncedAt).toBeInstanceOf(Date);

      expect(mockStudent.save).toHaveBeenCalled();
    });

    test('20. Should match by repoId even if repository name changed on GitHub', async () => {
      const mockStudent = {
        _id: mockStudentId,
        collegeId: mockCollegeId,
        github: 'harsh-dev',
        projects: [
          {
            repoId: 101,
            name: 'old-name-mobile',
            description: 'initial desc',
            order: 1,
            selectedAt: new Date('2025-01-01'),
            syncedAt: null
          }
        ],
        save: jest.fn().mockResolvedValue(true)
      };
      Student.findOne.mockResolvedValue(mockStudent);

      githubService.fetchUserRepositories.mockResolvedValue([
        {
          repoId: 101,
          name: 'brand-new-mobile-name',
          fullName: 'harsh-dev/brand-new-mobile-name',
          owner: 'harsh-dev',
          htmlUrl: 'https://github.com/harsh-dev/brand-new-mobile-name',
          description: 'Refreshed description after rename',
          primaryLanguage: 'Dart',
          topics: ['flutter'],
          stars: 42,
          forks: 8,
          isFork: false,
          updatedAt: new Date('2025-06-01')
        }
      ]);

      const req = createMockReq();
      const res = createMockRes();
      const next = jest.fn();

      await studentController.syncProjects(req, res, next);

      expect(res.body.success).toBe(true);
      expect(res.body.projects[0].repoId).toBe(101);
      expect(res.body.projects[0].name).toBe('brand-new-mobile-name');
      expect(res.body.projects[0].description).toBe('Refreshed description after rename');
    });

    test('21. Should safely report missing/deleted repository without deleting or replacing it', async () => {
      const mockStudent = {
        _id: mockStudentId,
        collegeId: mockCollegeId,
        github: 'harsh-dev',
        projects: [
          {
            repoId: 101,
            name: 'sips-mobile',
            description: 'existing snapshot',
            order: 1,
            selectedAt: new Date('2025-01-01'),
            syncedAt: null
          },
          {
            repoId: 999, // Deleted or made private on GitHub
            name: 'deleted-repo',
            description: 'old snapshot of deleted repo',
            order: 2,
            selectedAt: new Date('2025-01-01'),
            syncedAt: null
          }
        ],
        save: jest.fn().mockResolvedValue(true)
      };
      Student.findOne.mockResolvedValue(mockStudent);

      // GitHub returns ONLY repo 101 (repo 999 is missing)
      githubService.fetchUserRepositories.mockResolvedValue([
        {
          repoId: 101,
          name: 'sips-mobile',
          fullName: 'harsh-dev/sips-mobile',
          owner: 'harsh-dev',
          htmlUrl: 'https://github.com/harsh-dev/sips-mobile',
          description: 'Updated Flutter client',
          primaryLanguage: 'Dart',
          topics: ['flutter'],
          stars: 15,
          forks: 3,
          isFork: false,
          updatedAt: new Date('2025-06-01')
        }
      ]);

      const req = createMockReq();
      const res = createMockRes();
      const next = jest.fn();

      await studentController.syncProjects(req, res, next);

      expect(res.body.success).toBe(true);
      expect(res.body.updatedCount).toBe(1);
      expect(res.body.missingCount).toBe(1);
      expect(res.body.missingProjects).toEqual([
        { repoId: 999, name: 'deleted-repo', reason: 'NOT_FOUND' }
      ]);

      // Both projects remain in student.projects; repo 999 is NOT destroyed or silently removed
      expect(res.body.projects).toHaveLength(2);
      expect(res.body.projects[0].repoId).toBe(101);
      expect(res.body.projects[0].description).toBe('Updated Flutter client');
      expect(res.body.projects[0].syncedAt).toBeInstanceOf(Date);

      expect(res.body.projects[1].repoId).toBe(999);
      expect(res.body.projects[1].name).toBe('deleted-repo');
      expect(res.body.projects[1].description).toBe('old snapshot of deleted repo');
      expect(mockStudent.save).toHaveBeenCalled();
    });

    test('22. Should handle GitHub API rate-limiting or service error during sync', async () => {
      Student.findOne.mockResolvedValue({
        _id: mockStudentId,
        collegeId: mockCollegeId,
        github: 'harsh-dev',
        projects: [{ repoId: 101, name: 'sips-mobile' }]
      });

      const rateLimitErr = new Error('API rate limit exceeded');
      rateLimitErr.statusCode = 429;
      githubService.fetchUserRepositories.mockRejectedValue(rateLimitErr);

      const req = createMockReq();
      const res = createMockRes();
      const next = jest.fn();

      await studentController.syncProjects(req, res, next);

      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/rate limit/i);
    });

    test('23. Student cannot sync another student projects (auth & tenant scoped)', async () => {
      Student.findOne.mockResolvedValue(null);

      const req = createMockReq({ collegeId: otherCollegeId });
      const res = createMockRes();
      const next = jest.fn();

      await studentController.syncProjects(req, res, next);

      expect(Student.findOne).toHaveBeenCalledWith({ _id: mockStudentId, collegeId: otherCollegeId });
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });
});
