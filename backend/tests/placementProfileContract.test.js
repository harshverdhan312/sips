const studentController = require('../controllers/studentController');
const Student = require('../models/Student');
const JobDescription = require('../models/JobDescription');
const Match = require('../models/Match');
const {
  mapBranchToStream,
  mapStudentToPlacementInput,
  BRANCH_TO_STREAM_MAP
} = require('../utils/placementDataMapper');
const memoryDb = require('../utils/memoryDb');

jest.mock('../models/Student');
jest.mock('../models/JobDescription');
jest.mock('../models/Match');

describe('Phase 6A: Student Placement Profile Data Contract & CRUD', () => {
  const mockCollegeId = '507f1f77bcf86cd799439011';
  const mockStudentId = '507f1f77bcf86cd799439022';
  const otherCollegeId = '507f1f77bcf86cd799439999';

  const createMockReq = (overrides = {}) => ({
    collegeId: mockCollegeId,
    user: { id: mockStudentId, role: 'STUDENT', email: 'ananya@college.edu' },
    query: {},
    params: {},
    body: {},
    file: null,
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

  beforeEach(() => {
    jest.clearAllMocks();
    JobDescription.find.mockResolvedValue([]);
  });

  describe('1. GET /api/student/profile with Placement Fields', () => {
    it('should return complete profile including age, internships, hostel, and historyOfBacklogs', async () => {
      const mockDbStudent = {
        _id: mockStudentId,
        name: 'Ananya Sharma',
        email: 'ananya@college.edu',
        branch: 'Computer Science & Engineering',
        cgpa: 8.75,
        age: 21,
        internships: 2,
        hostel: true,
        historyOfBacklogs: 0,
        skills: ['Python', 'Node.js'],
        github: 'ananya-dev'
      };

      Student.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockDbStudent)
      });

      const req = createMockReq();
      const res = createMockRes();

      await studentController.getProfile(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        age: 21,
        internships: 2,
        hostel: true,
        historyOfBacklogs: 0
      }));
    });

    it('should return null for unset placement fields for existing students without breaking', async () => {
      const mockLegacyStudent = {
        _id: mockStudentId,
        name: 'Rahul Verma',
        email: 'rahul@college.edu',
        branch: 'Information Technology',
        cgpa: 7.8,
        age: null,
        internships: null,
        hostel: null,
        historyOfBacklogs: null
      };

      Student.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockLegacyStudent)
      });

      const req = createMockReq();
      const res = createMockRes();

      await studentController.getProfile(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        age: null,
        internships: null,
        hostel: null,
        historyOfBacklogs: null
      }));
    });
  });

  describe('2. PUT /api/student/profile Updating Placement Attributes', () => {
    it('should successfully update age, internships, hostel, and historyOfBacklogs', async () => {
      const existingStudent = {
        _id: mockStudentId,
        collegeId: mockCollegeId,
        name: 'Ananya Sharma',
        skills: ['Python'],
        age: null,
        internships: null,
        hostel: null,
        historyOfBacklogs: null,
        save: jest.fn().mockResolvedValue(true)
      };

      Student.findOne.mockResolvedValue(existingStudent);
      Student.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue({
          ...existingStudent,
          age: 22,
          internships: 1,
          hostel: false,
          historyOfBacklogs: 0
        })
      });

      const req = createMockReq({
        body: {
          age: 22,
          internships: 1,
          hostel: false,
          historyOfBacklogs: 0
        }
      });
      const res = createMockRes();

      await studentController.updateProfile(req, res);

      expect(existingStudent.age).toBe(22);
      expect(existingStudent.internships).toBe(1);
      expect(existingStudent.hostel).toBe(false);
      expect(existingStudent.historyOfBacklogs).toBe(0);
      expect(existingStudent.save).toHaveBeenCalled();
      expect(res.statusCode).toBe(200);
      expect(res.data.student.age).toBe(22);
    });

    it('should reject invalid negative internships with 400', async () => {
      const req = createMockReq({
        body: { internships: -1 }
      });
      const res = createMockRes();

      await studentController.updateProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.data.message).toContain('Invalid internships');
    });

    it('should reject invalid negative historyOfBacklogs with 400', async () => {
      const req = createMockReq({
        body: { historyOfBacklogs: -2 }
      });
      const res = createMockRes();

      await studentController.updateProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.data.message).toContain('Invalid historyOfBacklogs');
    });

    it('should reject invalid age below minimum or non-integer with 400', async () => {
      const reqBelow = createMockReq({ body: { age: 12 } });
      const resBelow = createMockRes();
      await studentController.updateProfile(reqBelow, resBelow);
      expect(resBelow.status).toHaveBeenCalledWith(400);

      const reqFloat = createMockReq({ body: { age: 21.5 } });
      const resFloat = createMockRes();
      await studentController.updateProfile(reqFloat, resFloat);
      expect(resFloat.status).toHaveBeenCalledWith(400);
    });

    it('should reject non-boolean hostel value with 400', async () => {
      const req = createMockReq({ body: { hostel: 'yes' } });
      const res = createMockRes();

      await studentController.updateProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.data.message).toContain('Invalid hostel value');
    });

    it('should strictly ignore protected fields in update body (mass assignment protection)', async () => {
      const existingStudent = {
        _id: mockStudentId,
        collegeId: mockCollegeId,
        readinessScore: 75,
        placementStatus: 'UNPLACED',
        passwordHash: 'original-hashed-pass',
        role: 'STUDENT',
        save: jest.fn().mockResolvedValue(true)
      };

      Student.findOne.mockResolvedValue(existingStudent);
      Student.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(existingStudent)
      });

      const req = createMockReq({
        body: {
          age: 21,
          readinessScore: 99,
          placementStatus: 'PLACED',
          collegeId: '507f1f77bcf86cd799439999',
          role: 'COLLEGE_ADMIN'
        }
      });
      const res = createMockRes();

      await studentController.updateProfile(req, res);

      expect(existingStudent.age).toBe(21);
      expect(existingStudent.readinessScore).toBe(75);
      expect(existingStudent.placementStatus).toBe('UNPLACED');
      expect(existingStudent.collegeId).toBe(mockCollegeId);
      expect(existingStudent.role).toBe('STUDENT');
    });

    it('should enforce tenant isolation and reject cross-college profile access', async () => {
      Student.findOne.mockResolvedValue(null);

      const req = createMockReq({ collegeId: otherCollegeId });
      const res = createMockRes();

      await studentController.updateProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.data.message).toBe('Profile not found');
    });
  });

  describe('3. Placement Data Mapper & Branch-to-Stream Normalization', () => {
    it('should correctly map known institutional branches to canonical ML Streams', () => {
      expect(mapBranchToStream('Computer Science & Engineering')).toBe('Computer Science');
      expect(mapBranchToStream('computer science and engineering')).toBe('Computer Science');
      expect(mapBranchToStream('CSE')).toBe('Computer Science');
      expect(mapBranchToStream('Information Technology')).toBe('Information Technology');
      expect(mapBranchToStream('IT')).toBe('Information Technology');
      expect(mapBranchToStream('Electronics and Communication Engineering')).toBe('Electronics And Communication');
      expect(mapBranchToStream('Mechanical Engineering')).toBe('Mechanical');
      expect(mapBranchToStream('Civil Engineering')).toBe('Civil');
      expect(mapBranchToStream('Electrical Engineering')).toBe('Electrical');
    });

    it('should return null for unknown or unmapped branches without fabrication', () => {
      expect(mapBranchToStream('Biotechnology')).toBeNull();
      expect(mapBranchToStream('Unknown Branch')).toBeNull();
      expect(mapBranchToStream('')).toBeNull();
      expect(mapBranchToStream(null)).toBeNull();
    });

    it('should build valid placement input payload when all student fields are present', () => {
      const student = {
        age: 22,
        internships: 2,
        cgpa: 8.45,
        hostel: true,
        historyOfBacklogs: 0,
        branch: 'Computer Science & Engineering'
      };

      const result = mapStudentToPlacementInput(student);

      expect(result.isComplete).toBe(true);
      expect(result.missingFields).toHaveLength(0);
      expect(result.payload).toEqual({
        Age: 22,
        Internships: 2,
        CGPA: 8.45,
        Hostel: 1,
        HistoryOfBacklogs: 0,
        Stream: 'Computer Science'
      });
    });

    it('should map hostel=false to Hostel=0 and historyOfBacklogs > 0 to HistoryOfBacklogs=1', () => {
      const student = {
        age: 23,
        internships: 0,
        cgpa: 6.8,
        hostel: false,
        historyOfBacklogs: 2,
        branch: 'Information Technology'
      };

      const result = mapStudentToPlacementInput(student);

      expect(result.isComplete).toBe(true);
      expect(result.payload.Hostel).toBe(0);
      expect(result.payload.HistoryOfBacklogs).toBe(1);
    });

    it('should mark input as incomplete when required fields are null without fabricating defaults', () => {
      const partialStudent = {
        age: null,
        internships: null,
        cgpa: 8.0,
        hostel: null,
        historyOfBacklogs: null,
        branch: 'Computer Science & Engineering'
      };

      const result = mapStudentToPlacementInput(partialStudent);

      expect(result.isComplete).toBe(false);
      expect(result.missingFields).toEqual(expect.arrayContaining(['Age', 'Internships', 'Hostel', 'HistoryOfBacklogs']));
      expect(result.payload).toBeNull();
    });
  });

  describe('4. In-Memory Resilient Store Placement Data CRUD', () => {
    it('should store and update placement fields in memoryDb', () => {
      const student = memoryDb.saveStudent({
        collegeId: 'col_1',
        name: 'Memory Student',
        email: 'mem@test.edu',
        passwordHash: 'hash',
        rollNo: 'MEM01',
        age: 20,
        internships: 1,
        hostel: true,
        historyOfBacklogs: 0
      });

      expect(student.age).toBe(20);
      expect(student.internships).toBe(1);
      expect(student.hostel).toBe(true);
      expect(student.historyOfBacklogs).toBe(0);

      const updated = memoryDb.updateStudent(student._id, {
        age: 21,
        internships: 2,
        hostel: false
      });

      expect(updated.age).toBe(21);
      expect(updated.internships).toBe(2);
      expect(updated.hostel).toBe(false);
    });
  });
});
