const studentController = require('../controllers/studentController');
const publicController = require('../controllers/publicController');
const codingPlatformService = require('../services/codingPlatforms/codingPlatformService');
const leetcodeAdapter = require('../services/codingPlatforms/leetcodeAdapter');
const codeforcesAdapter = require('../services/codingPlatforms/codeforcesAdapter');
const Student = require('../models/Student');
const College = require('../models/College');
const memoryDb = require('../utils/memoryDb');

jest.mock('../models/Student');
jest.mock('../models/College');

describe('Coding Platform Integration Tests (V1: LeetCode & Codeforces)', () => {
  const mockCollegeId = '507f1f77bcf86cd799439011';
  const mockStudentId = '507f1f77bcf86cd799439022';

  const createMockReq = (overrides = {}) => ({
    collegeId: mockCollegeId,
    user: { id: mockStudentId, role: 'student', email: 'harsh@test.edu' },
    params: {},
    body: {},
    query: {},
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

  let mockStudentDoc;

  beforeEach(() => {
    jest.clearAllMocks();
    codingPlatformService.clearCache();

    mockStudentDoc = {
      _id: mockStudentId,
      collegeId: mockCollegeId,
      name: 'Harsh Singh',
      email: 'harsh@test.edu',
      rollNo: '2022CS101',
      skills: ['react', 'node.js', 'python'],
      projects: [],
      codingProfiles: [],
      publicProfile: {
        enabled: true,
        username: 'harsh-dev',
        bio: 'Software Engineer',
        showGithub: true,
        showLinkedIn: true,
        showSkills: true,
        showProjects: true,
        showCodingProfiles: true
      },
      accountStatus: 'ACTIVE',
      save: jest.fn().mockResolvedValue(true),
      toObject: function() { return { ...this }; }
    };

    Student.findOne = jest.fn().mockReturnValue({
      select: jest.fn().mockResolvedValue(mockStudentDoc),
      lean: jest.fn().mockResolvedValue(mockStudentDoc),
      then: function(resolve) { return resolve(mockStudentDoc); }
    });
    Student.findById = jest.fn().mockResolvedValue(mockStudentDoc);
    College.findById = jest.fn().mockReturnValue({
      select: jest.fn().mockResolvedValue({
        name: 'RV College of Engineering',
        slug: 'rvce',
        city: 'Bangalore',
        state: 'Karnataka'
      })
    });
  });

  describe('1. Adapter Unit Tests & Username Normalization', () => {
    test('CodeforcesAdapter normalizes various URL and handle formats', () => {
      expect(codeforcesAdapter.normalizeUsername('tourist')).toBe('tourist');
      expect(codeforcesAdapter.normalizeUsername('@tourist')).toBe('tourist');
      expect(codeforcesAdapter.normalizeUsername('https://codeforces.com/profile/tourist')).toBe('tourist');
      expect(codeforcesAdapter.normalizeUsername('http://www.codeforces.com/profile/tourist/')).toBe('tourist');
      expect(codeforcesAdapter.normalizeUsername('codeforces.com/profile/tourist?ref=test')).toBe('tourist');
      expect(codeforcesAdapter.normalizeUsername('')).toBe('');
      expect(codeforcesAdapter.normalizeUsername('!invalid')).toBe('');
    });

    test('LeetCodeAdapter normalizes various URL and handle formats', () => {
      expect(leetcodeAdapter.normalizeUsername('harsh_dev')).toBe('harsh_dev');
      expect(leetcodeAdapter.normalizeUsername('@harsh_dev')).toBe('harsh_dev');
      expect(leetcodeAdapter.normalizeUsername('https://leetcode.com/u/harsh_dev/')).toBe('harsh_dev');
      expect(leetcodeAdapter.normalizeUsername('https://leetcode.com/harsh_dev')).toBe('harsh_dev');
      expect(leetcodeAdapter.normalizeUsername('leetcode.com/u/harsh_dev?page=1')).toBe('harsh_dev');
      expect(leetcodeAdapter.normalizeUsername('')).toBe('');
    });

    test('CodeforcesAdapter handles unrated users without throwing', async () => {
      const globalFetch = global.fetch;
      global.fetch = jest.fn()
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({
            status: 'OK',
            result: [{
              handle: 'newbie_coder',
              contribution: 0,
              friendOfCount: 1
            }]
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({
            status: 'OK',
            result: []
          })
        });

      try {
        const result = await codeforcesAdapter.fetchProfile('newbie_coder');
        expect(result.platform).toBe('CODEFORCES');
        expect(result.username).toBe('newbie_coder');
        expect(result.stats.currentRating).toBeNull();
        expect(result.stats.rank).toBe('Unrated');
        expect(result.stats.contestParticipationCount).toBe(0);
      } finally {
        global.fetch = globalFetch;
      }
    });

    test('CodeforcesAdapter handles rated users with contest participation and badges', async () => {
      const globalFetch = global.fetch;
      global.fetch = jest.fn()
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({
            status: 'OK',
            result: [{
              handle: 'tourist',
              rating: 3800,
              maxRating: 3900,
              rank: 'legendary grandmaster',
              maxRank: 'legendary grandmaster',
              contribution: 120,
              friendOfCount: 45000,
              avatar: 'https://userpic.codeforces.org/avatar.jpg'
            }]
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({
            status: 'OK',
            result: [{}, {}, {}] // 3 contests
          })
        });

      try {
        const result = await codeforcesAdapter.fetchProfile('tourist');
        expect(result.stats.currentRating).toBe(3800);
        expect(result.stats.maxRating).toBe(3900);
        expect(result.stats.rank).toBe('legendary grandmaster');
        expect(result.stats.contestParticipationCount).toBe(3);
        expect(result.stats.badges.length).toBe(1);
        expect(result.stats.badges[0].name).toBe('Legendary grandmaster');
      } finally {
        global.fetch = globalFetch;
      }
    });

    test('LeetCodeAdapter handles successful user profile and contest stats', async () => {
      const globalFetch = global.fetch;
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          data: {
            matchedUser: {
              username: 'harsh_dev',
              submitStatsGlobal: {
                acSubmissionNum: [
                  { difficulty: 'All', count: 350 },
                  { difficulty: 'Easy', count: 120 },
                  { difficulty: 'Medium', count: 180 },
                  { difficulty: 'Hard', count: 50 }
                ]
              },
              profile: {
                ranking: 15420,
                reputation: 25
              }
            },
            userContestRanking: {
              rating: 1845.6,
              globalRanking: 8500,
              attendedContestsCount: 15,
              badge: {
                name: 'Knight'
              }
            }
          }
        })
      });

      try {
        const result = await leetcodeAdapter.fetchProfile('harsh_dev');
        expect(result.platform).toBe('LEETCODE');
        expect(result.username).toBe('harsh_dev');
        expect(result.stats.problemsSolved).toBe(350);
        expect(result.stats.difficultyBreakdown).toEqual({
          easy: 120,
          medium: 180,
          hard: 50
        });
        expect(result.stats.currentRating).toBe(1846);
        expect(result.stats.globalRank).toBe(15420);
        expect(result.stats.contestParticipationCount).toBe(15);
        expect(result.stats.rankingTier).toBe('Knight');
      } finally {
        global.fetch = globalFetch;
      }
    });
  });

  describe('2. Controller Integration & API Endpoints', () => {
    test('POST /api/student/coding-profiles connects a valid LeetCode profile', async () => {
      const globalFetch = global.fetch;
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          data: {
            matchedUser: {
              username: 'harsh_dev',
              submitStatsGlobal: {
                acSubmissionNum: [{ difficulty: 'All', count: 200 }]
              },
              profile: { ranking: 25000 }
            }
          }
        })
      });

      try {
        const req = createMockReq({
          body: {
            platform: 'LEETCODE',
            username: 'https://leetcode.com/u/harsh_dev/',
            showOnPublicProfile: true
          }
        });
        const res = createMockRes();
        const next = jest.fn();

        await studentController.connectCodingProfile(req, res, next);

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.codingProfile.platform).toBe('LEETCODE');
        expect(res.body.codingProfile.username).toBe('harsh_dev');
        expect(res.body.codingProfile.stats.problemsSolved).toBe(200);
        expect(mockStudentDoc.save).toHaveBeenCalled();
      } finally {
        global.fetch = globalFetch;
      }
    });

    test('POST /api/student/coding-profiles updates existing profile instead of creating duplicates', async () => {
      mockStudentDoc.codingProfiles = [
        {
          platform: 'LEETCODE',
          username: 'old_handle',
          profileUrl: 'https://leetcode.com/u/old_handle/',
          stats: { problemsSolved: 100 }
        }
      ];

      const globalFetch = global.fetch;
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          data: {
            matchedUser: {
              username: 'new_handle',
              submitStatsGlobal: {
                acSubmissionNum: [{ difficulty: 'All', count: 300 }]
              }
            }
          }
        })
      });

      try {
        const req = createMockReq({
          body: {
            platform: 'LEETCODE',
            username: 'new_handle',
            showOnPublicProfile: true
          }
        });
        const res = createMockRes();
        const next = jest.fn();

        await studentController.connectCodingProfile(req, res, next);

        expect(res.statusCode).toBe(200);
        expect(mockStudentDoc.codingProfiles.length).toBe(1);
        expect(mockStudentDoc.codingProfiles[0].username).toBe('new_handle');
        expect(mockStudentDoc.codingProfiles[0].stats.problemsSolved).toBe(300);
      } finally {
        global.fetch = globalFetch;
      }
    });

    test('POST /api/student/coding-profiles rejects unsupported platform', async () => {
      const req = createMockReq({
        body: {
          platform: 'UNSUPPORTED_PLATFORM',
          username: 'harsh_dev'
        }
      });
      const res = createMockRes();
      const next = jest.fn();

      await studentController.connectCodingProfile(req, res, next);

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Unsupported coding platform');
    });

    test('POST /api/student/coding-profiles returns 404 when user is not found on upstream platform', async () => {
      const globalFetch = global.fetch;
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          errors: [{ message: 'That user does not exist.' }]
        })
      });

      try {
        const req = createMockReq({
          body: {
            platform: 'LEETCODE',
            username: 'nonexistent_user_99999'
          }
        });
        const res = createMockRes();
        const next = jest.fn();

        await studentController.connectCodingProfile(req, res, next);

        expect(res.statusCode).toBe(404);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toContain('not found');
      } finally {
        global.fetch = globalFetch;
      }
    });

    test('POST /api/student/coding-profiles/:platform/sync preserves existing stats on upstream failure', async () => {
      mockStudentDoc.codingProfiles = [
        {
          platform: 'CODEFORCES',
          username: 'tourist',
          profileUrl: 'https://codeforces.com/profile/tourist',
          stats: { currentRating: 3800, rank: 'legendary grandmaster' },
          syncStatus: 'SUCCESS',
          syncError: ''
        }
      ];

      const globalFetch = global.fetch;
      // Mock upstream 502 server crash
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        status: 502,
        json: async () => ({})
      });

      try {
        const req = createMockReq({
          params: { platform: 'CODEFORCES' }
        });
        const res = createMockRes();
        const next = jest.fn();

        await studentController.syncCodingProfile(req, res, next);

        expect(res.statusCode).toBe(200);
        // Ensure stats were not wiped out
        expect(mockStudentDoc.codingProfiles[0].stats.currentRating).toBe(3800);
        expect(mockStudentDoc.codingProfiles[0].syncStatus).toBe('FAILED');
        expect(mockStudentDoc.codingProfiles[0].syncError).toBeTruthy();
      } finally {
        global.fetch = globalFetch;
      }
    });

    test('PATCH /api/student/coding-profiles/:platform/visibility updates visibility without fetching', async () => {
      mockStudentDoc.codingProfiles = [
        {
          platform: 'LEETCODE',
          username: 'harsh_dev',
          profileUrl: 'https://leetcode.com/u/harsh_dev/',
          showOnPublicProfile: true,
          stats: { problemsSolved: 150 }
        }
      ];

      const req = createMockReq({
        params: { platform: 'LEETCODE' },
        body: { showOnPublicProfile: false }
      });
      const res = createMockRes();
      const next = jest.fn();

      await studentController.updateCodingProfileVisibility(req, res, next);

      expect(res.statusCode).toBe(200);
      expect(mockStudentDoc.codingProfiles[0].showOnPublicProfile).toBe(false);
      expect(mockStudentDoc.save).toHaveBeenCalled();
    });

    test('DELETE /api/student/coding-profiles/:platform removes the platform', async () => {
      mockStudentDoc.codingProfiles = [
        {
          platform: 'LEETCODE',
          username: 'harsh_dev'
        },
        {
          platform: 'CODEFORCES',
          username: 'tourist'
        }
      ];

      const req = createMockReq({
        params: { platform: 'LEETCODE' }
      });
      const res = createMockRes();
      const next = jest.fn();

      await studentController.disconnectCodingProfile(req, res, next);

      expect(res.statusCode).toBe(200);
      expect(mockStudentDoc.codingProfiles.length).toBe(1);
      expect(mockStudentDoc.codingProfiles[0].platform).toBe('CODEFORCES');
      expect(mockStudentDoc.save).toHaveBeenCalled();
    });
  });

  describe('3. Public Career Profile Privacy & Sanitization', () => {
    test('Public profile includes visible coding profiles and excludes sync errors / internal metadata', async () => {
      mockStudentDoc.codingProfiles = [
        {
          platform: 'LEETCODE',
          username: 'harsh_dev',
          profileUrl: 'https://leetcode.com/u/harsh_dev/',
          connectionStatus: 'CONNECTED',
          showOnPublicProfile: true,
          stats: {
            problemsSolved: 320,
            difficultyBreakdown: { easy: 100, medium: 180, hard: 40 },
            currentRating: 1750,
            rankingTier: 'Knight'
          },
          syncStatus: 'SUCCESS',
          syncError: 'Secret internal debug trace'
        },
        {
          platform: 'CODEFORCES',
          username: 'hidden_cf',
          profileUrl: 'https://codeforces.com/profile/hidden_cf',
          connectionStatus: 'CONNECTED',
          showOnPublicProfile: false, // Student hid this
          stats: { currentRating: 1400 }
        }
      ];

      const req = {
        params: { username: 'harsh-dev' }
      };
      const res = createMockRes();
      const next = jest.fn();

      await publicController.getPublicStudentProfile(req, res, next);

      expect(res.statusCode).toBe(200);
      const data = res.body;
      expect(data.codingProfiles).toBeDefined();
      expect(data.codingProfiles.length).toBe(1); // hidden_cf omitted
      expect(data.codingProfiles[0].platform).toBe('LEETCODE');
      expect(data.codingProfiles[0].stats.problemsSolved).toBe(320);
      expect(data.codingProfiles[0].stats.rankingTier).toBe('Knight');

      // Crucial privacy checks: ensure no internal error strings or private IDs leaked
      expect(data.codingProfiles[0].syncError).toBeUndefined();
      expect(data.codingProfiles[0].syncStatus).toBeUndefined();
      expect(data.codingProfiles[0]._id).toBeUndefined();
      expect(JSON.stringify(data)).not.toContain('Secret internal debug trace');
    });

    test('Public profile respects global showCodingProfiles toggle', async () => {
      mockStudentDoc.publicProfile.showCodingProfiles = false;
      mockStudentDoc.codingProfiles = [
        {
          platform: 'LEETCODE',
          username: 'harsh_dev',
          showOnPublicProfile: true,
          connectionStatus: 'CONNECTED',
          stats: { problemsSolved: 300 }
        }
      ];

      const req = { params: { username: 'harsh-dev' } };
      const res = createMockRes();
      const next = jest.fn();

      await publicController.getPublicStudentProfile(req, res, next);

      expect(res.statusCode).toBe(200);
      expect(res.body.codingProfiles).toEqual([]);
    });

    test('Data Integrity: LeetCode retains available difficulty counts while Codeforces does not invent difficulty breakdown or convert missing metrics to 0', async () => {
      mockStudentDoc.codingProfiles = [
        {
          platform: 'LEETCODE',
          username: 'leet_coder',
          profileUrl: 'https://leetcode.com/u/leet_coder/',
          connectionStatus: 'CONNECTED',
          showOnPublicProfile: true,
          stats: {
            problemsSolved: 150,
            difficultyBreakdown: { easy: 80, medium: 70 }, // hard missing/null
            currentRating: null
          }
        },
        {
          platform: 'CODEFORCES',
          username: 'unrated_cf',
          profileUrl: 'https://codeforces.com/profile/unrated_cf',
          connectionStatus: 'CONNECTED',
          showOnPublicProfile: true,
          stats: {
            currentRating: null,
            maxRating: null,
            rank: 'Unrated',
            contestParticipationCount: 0
          }
        }
      ];

      const req = { params: { username: 'harsh-dev' } };
      const res = createMockRes();
      const next = jest.fn();

      await publicController.getPublicStudentProfile(req, res, next);

      expect(res.statusCode).toBe(200);
      const profiles = res.body.codingProfiles;
      expect(profiles.length).toBe(2);

      const leet = profiles.find(p => p.platform === 'LEETCODE');
      expect(leet.stats.problemsSolved).toBe(150);
      expect(leet.stats.difficultyBreakdown).toEqual({ easy: 80, medium: 70 });
      expect(leet.stats.difficultyBreakdown.hard).toBeUndefined(); // Must NOT convert missing hard to 0
      expect(leet.stats.currentRating).toBeUndefined();

      const cf = profiles.find(p => p.platform === 'CODEFORCES');
      expect(cf.stats.difficultyBreakdown).toBeUndefined(); // Codeforces must NOT have difficulty breakdown
      expect(cf.stats.currentRating).toBeUndefined(); // Must NOT convert null rating to 0
      expect(cf.stats.rank).toBe('Unrated');
    });
  });
});
