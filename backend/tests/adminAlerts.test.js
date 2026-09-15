const alertController = require('../controllers/alertController');
const Alert = require('../models/Alert');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');

jest.mock('../models/Alert');
jest.mock('../models/Notification');
jest.mock('../models/AuditLog');

describe('Admin Alerts Controller', () => {
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

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAlerts', () => {
    test('should list alerts for college with active filter', async () => {
      const mockAlerts = [
        { _id: 'a1', title: 'Drive Tomorrow', message: 'TCS drive at 9 AM', active: true }
      ];

      Alert.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockAlerts)
      });

      const req = createMockReq({ query: { active: 'true' } });
      const res = createMockRes();

      await alertController.getAlerts(req, res);

      expect(res.body.success).toBe(true);
      expect(res.body.alerts).toHaveLength(1);
      expect(Alert.find).toHaveBeenCalledWith(
        expect.objectContaining({ collegeId: mockCollegeId, active: true })
      );
    });
  });

  describe('createAlert', () => {
    test('should create alert, mirror to Notification, and record audit log', async () => {
      const mockAlert = {
        _id: 'a1',
        title: 'Resume Review Deadline',
        message: 'Submit resumes by 5 PM',
        save: jest.fn().mockResolvedValue(true)
      };

      Alert.mockImplementation(() => mockAlert);
      Notification.create.mockResolvedValue({});
      AuditLog.create.mockResolvedValue({});

      const req = createMockReq({
        body: {
          title: 'Resume Review Deadline',
          message: 'Submit resumes by 5 PM',
          priority: 'HIGH',
          target: 'STUDENTS'
        }
      });
      const res = createMockRes();

      await alertController.createAlert(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.body.success).toBe(true);
      expect(mockAlert.save).toHaveBeenCalled();
      expect(Notification.create).toHaveBeenCalled();
      expect(AuditLog.create).toHaveBeenCalled();
    });

    test('should reject creation if title or message is missing', async () => {
      const req = createMockReq({ body: { title: 'No Message' } });
      const res = createMockRes();

      await alertController.createAlert(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.body.message).toContain('required');
    });
  });

  describe('updateAlert', () => {
    test('should update alert active status', async () => {
      const mockAlert = {
        _id: 'a1',
        title: 'Old Title',
        active: true,
        save: jest.fn().mockResolvedValue(true)
      };

      Alert.findOne.mockResolvedValue(mockAlert);

      const req = createMockReq({
        params: { id: 'a1' },
        body: { active: false }
      });
      const res = createMockRes();

      await alertController.updateAlert(req, res);

      expect(res.body.success).toBe(true);
      expect(mockAlert.active).toBe(false);
      expect(mockAlert.save).toHaveBeenCalled();
    });
  });

  describe('deleteAlert', () => {
    test('should delete alert', async () => {
      const mockAlert = { _id: 'a1', title: 'To Delete' };
      Alert.findOneAndDelete.mockResolvedValue(mockAlert);
      AuditLog.create.mockResolvedValue({});

      const req = createMockReq({ params: { id: 'a1' } });
      const res = createMockRes();

      await alertController.deleteAlert(req, res);

      expect(res.body.success).toBe(true);
      expect(Alert.findOneAndDelete).toHaveBeenCalledWith({
        _id: 'a1',
        collegeId: mockCollegeId
      });
    });
  });
});
