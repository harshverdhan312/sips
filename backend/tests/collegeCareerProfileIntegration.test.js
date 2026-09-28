const adminStudentController = require('../controllers/adminStudentController');
const Student = require('../models/Student');
const memoryDb = require('../utils/memoryDb');

jest.mock('../models/Student');

describe('College → Student Public Career Profile Integration Tests', () => {
  const collegeAId = '507f1f77bcf86cd799439011';
  const collegeBId = '507f1f77bcf86cd799439022';
  const studentAId = '507f1f77bcf86cd799439099';

  const createMockReq = (query = {}, collegeId = collegeAId) => ({
    query,
    user: { id: 'admin1', email: 'placement@collegea.edu', role: 'COLLEGE_ADMIN' },
    collegeId
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
  });

  describe('1. College Student Listing with Public Profile Metadata', () => {
    test('GET /api/admin/students includes publicProfile.enabled and username without passwordHash', async () => {
      const mockStudents = [
        {
          _id: studentAId,
          collegeId: collegeAId,
          name: 'Rahul Sharma',
          rollNo: '1RV21CS001',
          usn: '1RV21CS001',
          email: 'rahul@collegea.edu',
          branch: 'Computer Science & Engineering',
          batch: '2026',
          cgpa: 8.9,
          placementStatus: 'UNPLACED',
          readinessScore: 88,
          skills: ['React', 'Node.js'],
          publicProfile: {
            enabled: true,
            username: 'rahul-sharma',
            bio: 'Full-stack developer',
            showResume: true,
            showGithub: true,
            showLinkedIn: true,
            showSkills: true,
            showProjects: true
          }
        }
      ];

      Student.find.mockReturnValue({
        select: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue(mockStudents)
              })
            })
          })
        })
      });
      Student.countDocuments.mockResolvedValue(1);

      const req = createMockReq();
      const res = createMockRes();

      await adminStudentController.getStudents(req, res);

      expect(res.body.success).toBe(true);
      expect(res.body.students.length).toBe(1);

      const student = res.body.students[0];
      expect(student.publicProfile).toBeDefined();
      expect(student.publicProfile.enabled).toBe(true);
      expect(student.publicProfile.username).toBe('rahul-sharma');
      expect(student.passwordHash).toBeUndefined();
    });

    test('enforces college tenant isolation on student retrieval', async () => {
      Student.find.mockImplementation((query) => {
        expect(query.collegeId).toBe(collegeAId);
        return {
          select: jest.fn().mockReturnValue({
            sort: jest.fn().mockReturnValue({
              skip: jest.fn().mockReturnValue({
                limit: jest.fn().mockReturnValue({
                  lean: jest.fn().mockResolvedValue([])
                })
              })
            })
          })
        };
      });
      Student.countDocuments.mockResolvedValue(0);

      const req = createMockReq({}, collegeAId);
      const res = createMockRes();

      await adminStudentController.getStudents(req, res);

      expect(res.body.success).toBe(true);
      expect(Student.find).toHaveBeenCalledWith(expect.objectContaining({ collegeId: collegeAId }));
    });
  });

  describe('2. MemoryDB Parity for College Public Profile Metadata', () => {
    beforeAll(() => {
      jest.spyOn(memoryDb, 'isMongoConnected').mockReturnValue(false);

      memoryDb.clearAll();
      memoryDb.saveStudent({
        _id: studentAId,
        collegeId: collegeAId,
        name: 'Aarav Patel',
        email: 'aarav@collegea.edu',
        branch: 'Information Science',
        publicProfile: {
          enabled: true,
          username: 'aarav-patel'
        }
      });

      memoryDb.saveStudent({
        _id: 'other_student_id',
        collegeId: collegeBId, // different college
        name: 'Sneha Rao',
        email: 'sneha@collegeb.edu',
        branch: 'Electronics',
        publicProfile: {
          enabled: true,
          username: 'sneha-rao'
        }
      });
    });

    afterAll(() => {
      memoryDb.isMongoConnected.mockRestore();
    });

    test('memoryDb getStudents returns only students for authenticated college with publicProfile', async () => {
      const req = createMockReq({}, collegeAId);
      const res = createMockRes();

      await adminStudentController.getStudents(req, res);

      expect(res.body.success).toBe(true);
      expect(res.body.students.length).toBe(1);
      expect(res.body.students[0].name).toBe('Aarav Patel');
      expect(res.body.students[0].publicProfile.enabled).toBe(true);
      expect(res.body.students[0].publicProfile.username).toBe('aarav-patel');
    });
  });
});
