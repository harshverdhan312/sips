const fs = require('fs');
const path = require('path');
const publicController = require('../controllers/publicController');
const studentController = require('../controllers/studentController');
const { validateUsername, validateLinkedInUrl, RESERVED_USERNAMES } = require('../utils/usernameValidator');
const memoryDb = require('../utils/memoryDb');
const Student = require('../models/Student');
const College = require('../models/College');
const config = require('../config');

jest.mock('../models/Student');
jest.mock('../models/College');

describe('Public Career Profile & Security Tests', () => {
  const mockCollegeId = '507f1f77bcf86cd799439011';
  const mockStudentId = '507f1f77bcf86cd799439022';
  const otherStudentId = '507f1f77bcf86cd799439033';

  let req, res, next;
  let mockStudentDoc;
  let mockCollegeDoc;

  const createMockReq = (overrides = {}) => ({
    collegeId: mockCollegeId,
    user: { id: mockStudentId, role: 'student', email: 'rahul.sharma@nit.edu' },
    params: {},
    body: {},
    query: {},
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
    res.sendFile = jest.fn().mockImplementation((filePath) => {
      res.sentFile = filePath;
      return res;
    });
    res.setHeader = jest.fn().mockImplementation((name, value) => {
      res.headers[name] = value;
      return res;
    });
    return res;
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockCollegeDoc = {
      _id: mockCollegeId,
      name: 'National Institute of Technology',
      slug: 'nit',
      logoUrl: 'https://example.com/logo.png',
      website: 'https://nit.ac.in',
      city: 'Surat',
      state: 'Gujarat'
    };

    mockStudentDoc = {
      _id: mockStudentId,
      collegeId: mockCollegeId,
      name: 'Rahul Sharma',
      email: 'rahul.sharma@nit.edu',
      phone: '+91 9876543210',
      rollNo: '2022CS101',
      usn: '1NT22CS101',
      cgpa: 8.95,
      course: 'B.Tech',
      branch: 'Computer Science',
      batch: '2026',
      age: 21,
      internships: 2,
      hostel: true,
      historyOfBacklogs: 0,
      notes: 'Top performing candidate for placements.',
      readinessScore: 92,
      technicalScore: 88,
      softSkillScore: 90,
      resumeScore: 85,
      passwordHash: '$2a$10$abcdefghijklmnopqrstuvwxyz123456',
      github: 'rahul-sharma',
      linkedin: 'https://www.linkedin.com/in/rahul-sharma',
      resumeUrl: '/uploads/rahul-resume-sample.pdf',
      skills: ['react', 'node.js', 'python', 'mongodb'],
      projects: [
        {
          repoId: 101,
          name: 'sips-mobile',
          htmlUrl: 'https://github.com/rahul-sharma/sips-mobile',
          description: 'Flutter placement app',
          primaryLanguage: 'Dart',
          languages: ['Dart'],
          topics: ['flutter', 'riverpod'],
          stars: 15,
          forks: 3,
          order: 1
        },
        {
          repoId: 102,
          name: 'placement-engine',
          htmlUrl: 'https://github.com/rahul-sharma/placement-engine',
          description: 'ONNX inference service',
          primaryLanguage: 'Python',
          languages: ['Python'],
          topics: ['onnx', 'ml'],
          stars: 42,
          forks: 8,
          order: 2
        }
      ],
      publicProfile: {
        enabled: true,
        username: 'rahul-sharma',
        bio: 'Aspiring software engineer passionate about AI & full-stack development.',
        showResume: true,
        showGithub: true,
        showLinkedIn: true,
        showSkills: true,
        showProjects: true
      },
      save: jest.fn().mockResolvedValue(true)
    };

    Student.findOne = jest.fn().mockImplementation((query) => {
      let resolvedValue = null;

      if (query._id === mockStudentId) {
        resolvedValue = mockStudentDoc;
      } else if (query['publicProfile.username'] === 'priya-singh' && query._id && query._id.$ne === mockStudentId) {
        resolvedValue = { _id: otherStudentId, name: 'Priya Singh' };
      } else if (query['publicProfile.enabled'] && query['publicProfile.username'] === mockStudentDoc.publicProfile.username && mockStudentDoc.publicProfile.enabled) {
        resolvedValue = mockStudentDoc;
      }

      const chain = {
        lean: jest.fn().mockResolvedValue(resolvedValue ? { ...resolvedValue } : null),
        select: jest.fn().mockResolvedValue(resolvedValue ? mockStudentDoc : null),
        then: (resolve, reject) => Promise.resolve(resolvedValue).then(resolve, reject),
        catch: (reject) => Promise.resolve(resolvedValue).catch(reject)
      };

      return chain;
    });

    College.findById = jest.fn().mockReturnValue({
      select: jest.fn().mockResolvedValue(mockCollegeDoc)
    });

    req = createMockReq();
    res = createMockRes();
    next = jest.fn();
  });

  describe('1. Username Validation & Security Rules', () => {
    test('validates and normalizes valid usernames', () => {
      const res1 = validateUsername('Rahul-Sharma');
      expect(res1.isValid).toBe(true);
      expect(res1.normalized).toBe('rahul-sharma');

      const res2 = validateUsername('arjun-2026');
      expect(res2.isValid).toBe(true);
      expect(res2.normalized).toBe('arjun-2026');

      const res3 = validateUsername('dev123');
      expect(res3.isValid).toBe(true);
      expect(res3.normalized).toBe('dev123');
    });

    test('rejects usernames that are too short or too long', () => {
      expect(validateUsername('ab').isValid).toBe(false);
      expect(validateUsername('a'.repeat(31)).isValid).toBe(false);
    });

    test('rejects invalid characters, spaces, and leading/trailing hyphens', () => {
      expect(validateUsername('rahul sharma').isValid).toBe(false);
      expect(validateUsername('rahul_sharma').isValid).toBe(false);
      expect(validateUsername('rahul.sharma').isValid).toBe(false);
      expect(validateUsername('-rahul').isValid).toBe(false);
      expect(validateUsername('rahul-').isValid).toBe(false);
      expect(validateUsername('rahul--sharma').isValid).toBe(false);
      expect(validateUsername('<script>alert(1)</script>').isValid).toBe(false);
    });

    test('rejects 24-character hexadecimal MongoDB ObjectIds', () => {
      const res = validateUsername('507f1f77bcf86cd799439011');
      expect(res.isValid).toBe(false);
      expect(res.error).toMatch(/internal system identifiers/i);
    });

    test('rejects reserved system usernames', () => {
      const reserved = ['admin', 'api', 'login', 'logout', 'register', 'settings', 'profile', 'public', 'student', 'students', 'college', 'colleges', 'dashboard', 'sips', 'help', 'support', 'about', 'contact', 'u'];
      for (const name of reserved) {
        const res = validateUsername(name);
        expect(res.isValid).toBe(false);
        expect(res.error).toMatch(/reserved system username/i);
      }
    });
  });

  describe('2. LinkedIn URL Validation', () => {
    test('accepts valid HTTPS LinkedIn URLs', () => {
      expect(validateLinkedInUrl('https://www.linkedin.com/in/rahul-sharma').isValid).toBe(true);
      expect(validateLinkedInUrl('https://in.linkedin.com/in/priya-singh/').isValid).toBe(true);
      expect(validateLinkedInUrl('https://linkedin.com/in/arjun123').isValid).toBe(true);
    });

    test('rejects non-HTTPS, non-LinkedIn, or arbitrary malicious URLs', () => {
      expect(validateLinkedInUrl('http://www.linkedin.com/in/rahul').isValid).toBe(false);
      expect(validateLinkedInUrl('https://evil.com/in/rahul').isValid).toBe(false);
      expect(validateLinkedInUrl('javascript:alert(1)').isValid).toBe(false);
      expect(validateLinkedInUrl('https://www.linkedin.com/not-a-profile').isValid).toBe(false);
    });

    test('allows empty string or null to clear LinkedIn URL', () => {
      expect(validateLinkedInUrl('').isValid).toBe(true);
      expect(validateLinkedInUrl(null).isValid).toBe(true);
    });
  });

  describe('3. Public Profile API Retrieval & Strict Whitelisting', () => {
    test('GET /api/public/students/:username returns 200 with whitelisted fields only', async () => {
      req.params.username = 'rahul-sharma';
      await publicController.getPublicStudentProfile(req, res, next);

      expect(res.json).toHaveBeenCalledTimes(1);
      const data = res.body;

      expect(data.success).toBe(true);
      expect(data.username).toBe('rahul-sharma');
      expect(data.profile.name).toBe('Rahul Sharma');
      expect(data.profile.course).toBe('B.Tech');
      expect(data.profile.branch).toBe('Computer Science');
      expect(data.profile.batch).toBe('2026');
      expect(data.profile.college.name).toBe('National Institute of Technology');
      expect(data.links.github).toBe('https://github.com/rahul-sharma');
      expect(data.links.linkedin).toBe('https://www.linkedin.com/in/rahul-sharma');
      expect(data.skills).toEqual(['react', 'node.js', 'python', 'mongodb']);
      expect(data.projects.length).toBe(2);
      expect(data.resume.available).toBe(true);
      expect(data.resume.url).toBe('/api/public/students/rahul-sharma/resume');

      // CRITICAL SECURITY CHECKS: Whitelist only, NO sensitive fields leaked
      expect(data.passwordHash).toBeUndefined();
      expect(data.email).toBeUndefined();
      expect(data.phone).toBeUndefined();
      expect(data.rollNo).toBeUndefined();
      expect(data.usn).toBeUndefined();
      expect(data.cgpa).toBeUndefined();
      expect(data.notes).toBeUndefined();
      expect(data.readinessScore).toBeUndefined();
      expect(data.technicalScore).toBeUndefined();
      expect(data.softSkillScore).toBeUndefined();
      expect(data.resumeScore).toBeUndefined();
      expect(data.age).toBeUndefined();
      expect(data.internships).toBeUndefined();
      expect(data.hostel).toBeUndefined();
      expect(data.historyOfBacklogs).toBeUndefined();
      expect(data._id).toBeUndefined();
      expect(data.collegeId).toBeUndefined();
    });

    test('returns 404 for unknown username', async () => {
      req.params.username = 'unknown-student';
      await publicController.getPublicStudentProfile(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/not found/i);
    });

    test('returns 404 for disabled public profile without leaking student existence', async () => {
      mockStudentDoc.publicProfile.enabled = false;

      req.params.username = 'rahul-sharma';
      await publicController.getPublicStudentProfile(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/not found/i);
    });

    test('normalizes case in URL lookup (e.g. Rahul-Sharma -> rahul-sharma)', async () => {
      req.params.username = 'Rahul-Sharma';
      await publicController.getPublicStudentProfile(req, res, next);

      expect(res.json).toHaveBeenCalledTimes(1);
      const data = res.body;
      expect(data.success).toBe(true);
      expect(data.username).toBe('rahul-sharma');
    });
  });

  describe('4. Visibility Flags Security & Content Masking', () => {
    test('showResume=false masks resume and hides resume URL', async () => {
      mockStudentDoc.publicProfile.showResume = false;

      req.params.username = 'rahul-sharma';
      await publicController.getPublicStudentProfile(req, res, next);

      const data = res.body;
      expect(data.resume.available).toBe(false);
      expect(data.resume.url).toBeNull();
    });

    test('showGithub=false hides GitHub link', async () => {
      mockStudentDoc.publicProfile.showGithub = false;

      req.params.username = 'rahul-sharma';
      await publicController.getPublicStudentProfile(req, res, next);

      const data = res.body;
      expect(data.links.github).toBeNull();
    });

    test('showLinkedIn=false hides LinkedIn link', async () => {
      mockStudentDoc.publicProfile.showLinkedIn = false;

      req.params.username = 'rahul-sharma';
      await publicController.getPublicStudentProfile(req, res, next);

      const data = res.body;
      expect(data.links.linkedin).toBeNull();
    });

    test('showSkills=false hides skills list', async () => {
      mockStudentDoc.publicProfile.showSkills = false;

      req.params.username = 'rahul-sharma';
      await publicController.getPublicStudentProfile(req, res, next);

      const data = res.body;
      expect(data.skills).toEqual([]);
    });

    test('showProjects=false hides featured projects', async () => {
      mockStudentDoc.publicProfile.showProjects = false;

      req.params.username = 'rahul-sharma';
      await publicController.getPublicStudentProfile(req, res, next);

      const data = res.body;
      expect(data.projects).toEqual([]);
    });
  });

  describe('5. Authenticated Public Profile Management & Uniqueness', () => {
    test('student can retrieve own public profile config', async () => {
      await studentController.getPublicProfileConfig(req, res, next);

      expect(res.json).toHaveBeenCalledTimes(1);
      const data = res.body;
      expect(data.success).toBe(true);
      expect(data.publicProfile.enabled).toBe(true);
      expect(data.publicProfile.username).toBe('rahul-sharma');
      expect(data.linkedin).toBe('https://www.linkedin.com/in/rahul-sharma');
    });

    test('student can update own public profile settings', async () => {
      req.body = {
        enabled: true,
        username: 'rahul-s',
        bio: 'Updated student bio.',
        showResume: false,
        showGithub: true,
        showLinkedIn: false,
        showSkills: true,
        showProjects: true,
        linkedin: 'https://www.linkedin.com/in/rahul-s'
      };

      await studentController.updatePublicProfileConfig(req, res, next);

      expect(res.json).toHaveBeenCalledTimes(1);
      const data = res.body;
      expect(data.success).toBe(true);
      expect(data.publicProfile.username).toBe('rahul-s');
      expect(data.publicProfile.bio).toBe('Updated student bio.');
      expect(data.publicProfile.showResume).toBe(false);
      expect(data.publicProfile.showLinkedIn).toBe(false);
    });

    test('rejects claiming an existing duplicate username', async () => {
      req.body = {
        enabled: true,
        username: 'priya-singh'
      };

      await studentController.updatePublicProfileConfig(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/already taken/i);
    });

    test('rejects case-insensitive duplicate username', async () => {
      req.body = {
        enabled: true,
        username: 'Priya-Singh'
      };

      await studentController.updatePublicProfileConfig(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/already taken/i);
    });

    test('rejects enabling profile with an empty username', async () => {
      req.body = {
        enabled: true,
        username: ''
      };

      await studentController.updatePublicProfileConfig(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/valid public username is required/i);
    });

    test('bio is capped at 500 characters', async () => {
      const longBio = 'a'.repeat(600);
      req.body = {
        bio: longBio
      };

      await studentController.updatePublicProfileConfig(req, res, next);

      const data = res.body;
      expect(data.publicProfile.bio.length).toBe(500);
    });
  });

  describe('6. MemoryDB Mode Parity', () => {
    beforeEach(() => {
      jest.spyOn(memoryDb, 'isMongoConnected').mockReturnValue(false);
      memoryDb.clearAll();
      memoryDb.saveCollege(mockCollegeDoc);
      memoryDb.saveStudent({
        ...mockStudentDoc,
        save: undefined
      });
    });

    afterEach(() => {
      memoryDb.isMongoConnected.mockRestore();
    });

    test('memoryDb lookup findStudentByPublicUsername works', async () => {
      req.params.username = 'rahul-sharma';
      await publicController.getPublicStudentProfile(req, res, next);

      expect(res.json).toHaveBeenCalledTimes(1);
      const data = res.body;
      expect(data.success).toBe(true);
      expect(data.username).toBe('rahul-sharma');
      expect(data.profile.name).toBe('Rahul Sharma');
    });

    test('memoryDb username duplicate detection works', async () => {
      memoryDb.saveStudent({
        _id: otherStudentId,
        collegeId: mockCollegeId,
        name: 'Priya Singh',
        publicProfile: {
          enabled: true,
          username: 'priya-singh'
        }
      });

      req.body = {
        enabled: true,
        username: 'priya-singh'
      };

      await studentController.updatePublicProfileConfig(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/already taken/i);
    });
  });

  describe('7. Controlled Public Resume Endpoint & Security', () => {
    const testResumeFile = path.join(config.uploadDir, 'rahul-resume-sample.pdf');

    beforeAll(() => {
      if (!fs.existsSync(config.uploadDir)) {
        fs.mkdirSync(config.uploadDir, { recursive: true });
      }
      fs.writeFileSync(testResumeFile, '%PDF-1.4 sample resume content');
    });

    afterAll(() => {
      if (fs.existsSync(testResumeFile)) {
        fs.unlinkSync(testResumeFile);
      }
    });

    test('returns resume PDF when showResume is true and profile is enabled', async () => {
      req.params.username = 'rahul-sharma';
      await publicController.getPublicStudentResume(req, res, next);

      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'application/pdf');
      expect(res.setHeader).toHaveBeenCalledWith('Content-Disposition', 'inline; filename="rahul-sharma-resume.pdf"');
      expect(res.sendFile).toHaveBeenCalledWith(expect.stringContaining('rahul-resume-sample.pdf'));
    });

    test('blocks resume access with 404 when showResume is false', async () => {
      mockStudentDoc.publicProfile.showResume = false;

      req.params.username = 'rahul-sharma';
      await publicController.getPublicStudentResume(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.sendFile).not.toHaveBeenCalled();
    });

    test('blocks resume access with 404 when profile is disabled', async () => {
      mockStudentDoc.publicProfile.enabled = false;

      req.params.username = 'rahul-sharma';
      await publicController.getPublicStudentResume(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.sendFile).not.toHaveBeenCalled();
    });

    test('blocks resume access with 404 when student has no resume uploaded', async () => {
      mockStudentDoc.resumeUrl = null;

      req.params.username = 'rahul-sharma';
      await publicController.getPublicStudentResume(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.sendFile).not.toHaveBeenCalled();
    });
  });
});
