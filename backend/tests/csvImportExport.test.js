const adminStudentController = require('../controllers/adminStudentController');
const Student = require('../models/Student');
const AuditLog = require('../models/AuditLog');
const bcrypt = require('bcryptjs');

jest.mock('../models/Student');
jest.mock('../models/AuditLog');
jest.mock('bcryptjs');

describe('CSV Student Import & Export End-to-End Tests', () => {
  const mockCollegeId = '507f1f77bcf86cd799439011';
  const otherCollegeId = '507f1f77bcf86cd799439099';

  const createMockReq = (overrides = {}) => ({
    collegeId: mockCollegeId,
    user: { id: 'admin1', role: 'COLLEGE_ADMIN', email: 'admin@college.edu' },
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

  beforeEach(() => {
    jest.clearAllMocks();
    bcrypt.genSalt.mockResolvedValue('mocksalt');
    bcrypt.hash.mockResolvedValue('mockhash');
    AuditLog.create.mockResolvedValue({});
  });

  describe('CSV Import (uploadStudentsCSV)', () => {
    test('should successfully import valid CSV using canonical csvData field', async () => {
      Student.findOne.mockResolvedValue(null);
      const mockSavedStudent = {
        save: jest.fn().mockResolvedValue(true)
      };
      Student.mockImplementation(() => mockSavedStudent);

      const csv = `Name, Roll No, Email, Branch, Batch, CGPA, Skills
Aarav Sharma, 1RV21CS001, aarav@college.edu, Computer Science, 2025, 8.8, "Python, React, SQL"
Diya Patel, 1RV21CS002, diya@college.edu, Information Science, 2025, 9.1, "Java, Spring, Docker"`;

      const req = createMockReq({ body: { csvData: csv } });
      const res = createMockRes();

      await adminStudentController.uploadStudentsCSV(req, res);

      expect(res.body.success).toBe(true);
      expect(res.body.results.total).toBe(2);
      expect(res.body.results.success).toBe(2);
      expect(res.body.results.failed).toBe(0);
      expect(res.body.results.errors).toHaveLength(0);
      expect(mockSavedStudent.save).toHaveBeenCalledTimes(2);
      expect(Student).toHaveBeenCalledWith(expect.objectContaining({
        collegeId: mockCollegeId,
        name: 'Aarav Sharma',
        rollNo: '1RV21CS001',
        email: 'aarav@college.edu',
        branch: 'Computer Science',
        batch: '2025',
        cgpa: 8.8,
        skills: ['python', 'react', 'sql']
      }));
    });

    test('should maintain backward compatibility with legacy csvText field', async () => {
      Student.findOne.mockResolvedValue(null);
      const mockSavedStudent = {
        save: jest.fn().mockResolvedValue(true)
      };
      Student.mockImplementation(() => mockSavedStudent);

      const csv = `Name, Roll No, Email
Rohan Roy, CS301, rohan@college.edu`;

      const req = createMockReq({ body: { csvText: csv } });
      const res = createMockRes();

      await adminStudentController.uploadStudentsCSV(req, res);

      expect(res.body.success).toBe(true);
      expect(res.body.results.success).toBe(1);
    });

    test('should reject missing, empty, or whitespace body with 400', async () => {
      const req = createMockReq({ body: {} });
      const res = createMockRes();

      await adminStudentController.uploadStudentsCSV(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.body.message).toContain('CSV data is required');
    });

    test('should reject malformed header or single-line CSV with 400', async () => {
      const req = createMockReq({ body: { csvData: 'Invalid, Header, Only' } });
      const res = createMockRes();

      await adminStudentController.uploadStudentsCSV(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.body.message).toContain('header row and at least one data row');
    });

    test('should handle partial-success import with duplicate DB records, batch duplicates, and validation errors', async () => {
      // First student exists in DB, second is new, third has invalid email, fourth is duplicate of second in same batch
      Student.findOne.mockImplementation(async (query) => {
        const orClause = query.$or;
        if (orClause && orClause.some(cond => cond.email === 'existing@college.edu')) {
          return { email: 'existing@college.edu', rollNo: 'CS100' };
        }
        return null;
      });

      const mockSavedStudent = {
        save: jest.fn().mockResolvedValue(true)
      };
      Student.mockImplementation(() => mockSavedStudent);

      const csv = `Name, Roll No, Email, CGPA, Skills
Existing Student, CS100, existing@college.edu, 8.0, "React, Node"
Valid Student, CS101, valid@college.edu, 9.0, "Python, SQL"
Bad Email, CS102, not-an-email, 7.5, "Go"
Batch Duplicate, CS101, valid@college.edu, 9.0, "Python"
Bad CGPA, CS103, badcgpa@college.edu, 15.0, "C++"`;

      const req = createMockReq({ body: { csvData: csv } });
      const res = createMockRes();

      await adminStudentController.uploadStudentsCSV(req, res);

      expect(res.body.success).toBe(true);
      expect(res.body.results.total).toBe(5);
      expect(res.body.results.success).toBe(1);
      expect(res.body.results.failed).toBe(4);
      expect(res.body.results.errors.length).toBe(4);
      expect(res.body.results.errors.some(e => e.includes('already exists'))).toBe(true);
      expect(res.body.results.errors.some(e => e.includes('Invalid email format'))).toBe(true);
      expect(res.body.results.errors.some(e => e.includes('Duplicate student in CSV upload'))).toBe(true);
      expect(res.body.results.errors.some(e => e.includes('CGPA must be a valid number'))).toBe(true);
    });

    test('should enforce tenant isolation during duplicate checks and creation', async () => {
      // Student exists in another college, so findOne within this college returns null
      Student.findOne.mockImplementation(async (query) => {
        expect(query.$or[0].collegeId).toBe(mockCollegeId);
        expect(query.$or[1].collegeId).toBe(mockCollegeId);
        return null;
      });

      const mockSavedStudent = {
        save: jest.fn().mockResolvedValue(true)
      };
      Student.mockImplementation(() => mockSavedStudent);

      const csv = `Name, Roll No, Email
Cross College Student, CS500, cross@college.edu`;

      const req = createMockReq({ body: { csvData: csv } });
      const res = createMockRes();

      await adminStudentController.uploadStudentsCSV(req, res);

      expect(res.body.success).toBe(true);
      expect(res.body.results.success).toBe(1);
      expect(Student).toHaveBeenCalledWith(expect.objectContaining({
        collegeId: mockCollegeId
      }));
    });
  });

  describe('CSV Export (exportStudentsCSV)', () => {
    test('should export student roster as CSV with headers and tenant isolation', async () => {
      const mockStudents = [
        {
          name: 'Aarav Sharma',
          rollNo: '1RV21CS001',
          usn: '1RV21CS001',
          email: 'aarav@college.edu',
          branch: 'Computer Science',
          batch: '2025',
          cgpa: 8.8,
          placementStatus: 'PLACED',
          companyPlaced: 'Google',
          packageOffered: 28,
          readinessScore: 94,
          skills: ['python', 'react', 'sql']
        },
        {
          name: 'Priya Patel',
          rollNo: '1RV21CS002',
          usn: '1RV21CS002',
          email: 'priya@college.edu',
          branch: 'Information Science',
          batch: '2025',
          cgpa: 9.1,
          placementStatus: 'UNPLACED',
          companyPlaced: '',
          packageOffered: 0,
          readinessScore: 82,
          skills: ['java', 'docker']
        }
      ];

      Student.find.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockStudents)
      });

      const req = createMockReq({ query: { branch: 'Computer Science', status: 'PLACED' } });
      const res = createMockRes();

      await adminStudentController.exportStudentsCSV(req, res);

      expect(Student.find).toHaveBeenCalledWith(expect.objectContaining({
        collegeId: mockCollegeId,
        branch: expect.any(RegExp),
        placementStatus: 'PLACED'
      }));

      expect(res.headers['Content-Type']).toBe('text/csv');
      expect(res.headers['Content-Disposition']).toContain('sips-students-export.csv');
      expect(res.body).toContain('Name,Roll No,USN,Email,Branch,Batch,CGPA,Placement Status,Company Placed,Package Offered (LPA),Readiness Score,Skills');
      expect(res.body).toContain('"Aarav Sharma"');
      expect(res.body).toContain('"Google"');
      expect(res.body).toContain('"python, react, sql"');
    });

    test('should handle empty student list cleanly and export header row', async () => {
      Student.find.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([])
      });

      const req = createMockReq();
      const res = createMockRes();

      await adminStudentController.exportStudentsCSV(req, res);

      expect(res.headers['Content-Type']).toBe('text/csv');
      expect(res.body.trim()).toBe('Name,Roll No,USN,Email,Branch,Batch,CGPA,Placement Status,Company Placed,Package Offered (LPA),Readiness Score,Skills');
    });
  });
});
