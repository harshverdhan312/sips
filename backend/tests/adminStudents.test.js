const adminStudentController = require('../controllers/adminStudentController');
const Student = require('../models/Student');
const Match = require('../models/Match');
const AuditLog = require('../models/AuditLog');

jest.mock('../models/Student');
jest.mock('../models/Match');
jest.mock('../models/AuditLog');

describe('Admin Student Controller', () => {
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
    res.headers = {};
    res.status = jest.fn().mockImplementation((code) => {
      res.statusCode = code;
      return res;
    });
    res.json = jest.fn().mockImplementation((data) => {
      res.body = data;
      return res;
    });
    res.send = jest.fn().mockImplementation((data) => {
      res.body = data;
      return res;
    });
    res.setHeader = jest.fn().mockImplementation((key, val) => {
      res.headers[key] = val;
      return res;
    });
    return res;
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getStudents', () => {
    test('should return paginated students with tenant filtering', async () => {
      const mockStudents = [
        { _id: 's1', name: 'Alice', rollNo: 'CS01', branch: 'CSE', cgpa: 8.5 },
        { _id: 's2', name: 'Bob', rollNo: 'CS02', branch: 'CSE', cgpa: 7.8 }
      ];

      const mockQueryChain = {
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockStudents)
      };

      Student.find.mockReturnValue(mockQueryChain);
      Student.countDocuments.mockResolvedValue(2);

      const req = createMockReq({ query: { page: '1', limit: '10' } });
      const res = createMockRes();

      await adminStudentController.getStudents(req, res);

      expect(res.status).not.toHaveBeenCalledWith(500);
      expect(res.body.success).toBe(true);
      expect(res.body.students).toHaveLength(2);
      expect(res.body.pagination.total).toBe(2);
      expect(Student.find).toHaveBeenCalledWith(expect.objectContaining({ collegeId: mockCollegeId }));
    });

    test('should filter by branch, status, and search query', async () => {
      const mockQueryChain = {
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([])
      };

      Student.find.mockReturnValue(mockQueryChain);
      Student.countDocuments.mockResolvedValue(0);

      const req = createMockReq({
        query: {
          search: 'Priya',
          branch: 'Information Science',
          status: 'UNPLACED',
          readiness: 'ready'
        }
      });
      const res = createMockRes();

      await adminStudentController.getStudents(req, res);

      expect(res.body.success).toBe(true);
      const callFilter = Student.find.mock.calls[0][0];
      expect(callFilter.collegeId).toBe(mockCollegeId);
      expect(callFilter.placementStatus).toBe('UNPLACED');
      expect(callFilter.readinessScore).toEqual({ $gte: 75 });
    });
  });

  describe('getStudentById', () => {
    test('should return student profile and matched jobs', async () => {
      const mockStudent = {
        _id: 's1',
        name: 'Rahul V',
        email: 'rahul@college.edu',
        collegeId: mockCollegeId,
        skills: ['python', 'django']
      };

      const mockMatches = [
        {
          jdId: { _id: 'j1', title: 'Backend Dev', company: 'Google', ctc: '20 LPA', status: 'ACTIVE' },
          score: 85,
          matchedSkills: ['python'],
          missingSkills: ['docker']
        }
      ];

      Student.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockStudent)
      });

      Match.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockMatches)
      });

      const req = createMockReq({ params: { id: 's1' } });
      const res = createMockRes();

      await adminStudentController.getStudentById(req, res);

      expect(res.body.success).toBe(true);
      expect(res.body.student.name).toBe('Rahul V');
      expect(res.body.matches).toHaveLength(1);
      expect(res.body.matches[0].company).toBe('Google');
    });

    test('should return 404 when student does not exist', async () => {
      Student.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(null)
      });

      const req = createMockReq({ params: { id: 'nonexistent' } });
      const res = createMockRes();

      await adminStudentController.getStudentById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.body.message).toBe('Student not found');
    });
  });

  describe('updateStudent', () => {
    test('should update placementStatus and companyPlaced', async () => {
      const mockStudent = {
        _id: 's1',
        name: 'Alice',
        email: 'alice@college.edu',
        placementStatus: 'UNPLACED',
        save: jest.fn().mockResolvedValue(true)
      };

      Student.findOne.mockResolvedValue(mockStudent);
      AuditLog.create.mockResolvedValue({});

      const req = createMockReq({
        params: { id: 's1' },
        body: {
          placementStatus: 'PLACED',
          companyPlaced: 'Microsoft',
          packageOffered: 18.5
        }
      });
      const res = createMockRes();

      await adminStudentController.updateStudent(req, res);

      expect(res.body.success).toBe(true);
      expect(mockStudent.placementStatus).toBe('PLACED');
      expect(mockStudent.companyPlaced).toBe('Microsoft');
      expect(mockStudent.packageOffered).toBe(18.5);
      expect(mockStudent.save).toHaveBeenCalled();
    });
  });

  describe('deleteStudent', () => {
    test('should delete student and cascade delete matches', async () => {
      const mockStudent = {
        _id: 's1',
        name: 'Alice',
        email: 'alice@college.edu'
      };

      Student.findOneAndDelete.mockResolvedValue(mockStudent);
      Match.deleteMany.mockResolvedValue({ deletedCount: 3 });
      AuditLog.create.mockResolvedValue({});

      const req = createMockReq({ params: { id: 's1' } });
      const res = createMockRes();

      await adminStudentController.deleteStudent(req, res);

      expect(res.body.success).toBe(true);
      expect(Student.findOneAndDelete).toHaveBeenCalledWith({
        _id: 's1',
        collegeId: mockCollegeId
      });
      expect(Match.deleteMany).toHaveBeenCalledWith({
        studentId: 's1',
        collegeId: mockCollegeId
      });
    });
  });

  describe('exportStudentsCSV', () => {
    test('should return CSV text with attachment header', async () => {
      const mockStudents = [
        {
          name: 'Priya Sharma',
          rollNo: '1RV21CS045',
          usn: '1RV21CS045',
          email: 'priya@college.edu',
          branch: 'Computer Science',
          batch: '2025',
          cgpa: 9.1,
          placementStatus: 'PLACED',
          companyPlaced: 'Adobe',
          packageOffered: 24,
          readinessScore: 92,
          skills: ['python', 'ml']
        }
      ];

      Student.find.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockStudents)
      });

      const req = createMockReq();
      const res = createMockRes();

      await adminStudentController.exportStudentsCSV(req, res);

      expect(res.headers['Content-Type']).toBe('text/csv');
      expect(res.headers['Content-Disposition']).toContain('attachment');
      expect(res.body).toContain('Priya Sharma');
      expect(res.body).toContain('Adobe');
    });
  });
});
