const notificationController = require('../controllers/notificationController');
const studentController = require('../controllers/studentController');
const adminJobController = require('../controllers/adminJobController');
const adminAnalyticsController = require('../controllers/adminAnalyticsController');
const Notification = require('../models/Notification');
const Application = require('../models/Application');
const Student = require('../models/Student');
const JobDescription = require('../models/JobDescription');
const Alert = require('../models/Alert');
const AuditLog = require('../models/AuditLog');
const { sendNotification } = require('../utils/notificationService');

jest.mock('../models/Notification');
jest.mock('../models/Application');
jest.mock('../models/Student');
jest.mock('../models/JobDescription');
jest.mock('../models/Alert');
jest.mock('../models/AuditLog');

describe('Phase 4: Persistent Notifications & Placement Telemetry', () => {
  const mockCollegeId = '507f1f77bcf86cd799439011';
  const otherCollegeId = '507f1f77bcf86cd799439999';
  const mockStudentId = '507f1f77bcf86cd799439022';
  const otherStudentId = '507f1f77bcf86cd799439033';
  const mockJobId = '507f1f77bcf86cd799439044';
  const mockAppId = '507f1f77bcf86cd799439055';
  const mockNotifId = '507f1f77bcf86cd799439066';

  const createMockReq = (overrides = {}) => ({
    collegeId: mockCollegeId,
    user: { id: mockStudentId, role: 'STUDENT', email: 'student@college.edu' },
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
    return res;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    Notification.NOTIFICATION_TYPES = [
      'ANNOUNCEMENT',
      'APPLICATION_SUBMITTED',
      'APPLICATION_SHORTLISTED',
      'APPLICATION_REJECTED',
      'APPLICATION_SELECTED',
      'APPLICATION_WITHDRAWN',
      'SYSTEM',
      'JOB_ALERT'
    ];
    Notification.TARGET_TYPES = ['ALL', 'STUDENTS', 'INDIVIDUAL'];
    AuditLog.create.mockResolvedValue({});
    Alert.countDocuments.mockResolvedValue(2);

    Application.VALID_STATUSES = ['APPLIED', 'SHORTLISTED', 'REJECTED', 'SELECTED', 'WITHDRAWN'];
    Application.isValidTransition = (curr, next) => {
      if (curr === next) return true;
      const allowed = {
        APPLIED: ['SHORTLISTED', 'REJECTED', 'WITHDRAWN', 'SELECTED'],
        SHORTLISTED: ['SELECTED', 'REJECTED', 'WITHDRAWN'],
        REJECTED: [],
        SELECTED: [],
        WITHDRAWN: []
      }[curr] || [];
      return allowed.includes(next);
    };
  });

  // ==========================================
  // 1. Notification Persistence & Student Retrieval
  // ==========================================
  describe('Notification Listing & Read State (notificationController)', () => {
    test('student receives their own notifications and broadcasts, newest first', async () => {
      const mockNotifs = [
        {
          _id: 'n1',
          collegeId: mockCollegeId,
          studentId: mockStudentId,
          title: 'Application Shortlisted',
          message: 'Shortlisted for Google',
          read: false
        },
        {
          _id: 'n2',
          collegeId: mockCollegeId,
          target: 'ALL',
          title: 'Campus Announcement',
          message: 'Drive schedule updated',
          read: true
        }
      ];

      Notification.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockNotifs)
      });

      const req = createMockReq();
      const res = createMockRes();

      await notificationController.getNotifications(req, res);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(2);
      expect(Notification.find).toHaveBeenCalledWith(expect.objectContaining({
        collegeId: mockCollegeId,
        $or: [
          { studentId: mockStudentId },
          { target: 'ALL' },
          { target: 'STUDENTS' }
        ]
      }));
    });

    test('student marks a single notification as read with ownership verification', async () => {
      const mockNotif = {
        _id: mockNotifId,
        collegeId: mockCollegeId,
        studentId: mockStudentId,
        read: false,
        readAt: null,
        save: jest.fn().mockResolvedValue(true)
      };

      Notification.findOne.mockResolvedValue(mockNotif);

      const req = createMockReq({ params: { id: mockNotifId } });
      const res = createMockRes();

      await notificationController.markAsRead(req, res);

      expect(res.body.success).toBe(true);
      expect(res.body.message).toMatch(/marked as read/i);
      expect(mockNotif.read).toBe(true);
      expect(mockNotif.readAt).toBeInstanceOf(Date);
      expect(mockNotif.save).toHaveBeenCalled();
    });

    test('student cannot mark another student\'s private notification as read (IDOR check)', async () => {
      Notification.findOne.mockResolvedValue(null); // Not found under student's query scope

      const req = createMockReq({ params: { id: 'otherStudentNotifId' } });
      const res = createMockRes();

      await notificationController.markAsRead(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.body.message).toMatch(/not found/i);
    });

    test('student can mark all their notifications as read', async () => {
      Notification.updateMany.mockResolvedValue({ modifiedCount: 3 });

      const req = createMockReq();
      const res = createMockRes();

      await notificationController.markAllAsRead(req, res);

      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(3);
      expect(Notification.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ collegeId: mockCollegeId, read: false }),
        expect.objectContaining({ $set: expect.objectContaining({ read: true }) })
      );
    });

    test('admin can create announcements', async () => {
      let savedDoc;
      Notification.mockImplementation(function(data) {
        Object.assign(this, data);
        this.save = jest.fn().mockImplementation(async () => {
          savedDoc = this;
          return this;
        });
      });

      const req = {
        collegeId: mockCollegeId,
        user: { id: 'admin1', role: 'COLLEGE_ADMIN' },
        body: {
          title: 'Career Fair 2026',
          message: 'The annual career fair will begin on Monday.',
          target: 'STUDENTS'
        }
      };
      const res = createMockRes();

      await notificationController.createNotification(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.body.success).toBe(true);
      expect(savedDoc.title).toBe('Career Fair 2026');
      expect(savedDoc.target).toBe('STUDENTS');
      expect(savedDoc.collegeId).toBe(mockCollegeId);
    });
  });

  // ==========================================
  // 2. Application-Event Notifications & Deduplication
  // ==========================================
  describe('Notification Event Emission & Deduplication (notificationService)', () => {
    test('sendNotification creates notification and deduplicates duplicate application events', async () => {
      Notification.findOne.mockResolvedValue(null); // First call: does not exist
      let savedDoc;
      Notification.mockImplementation(function(data) {
        Object.assign(this, data);
        this.save = jest.fn().mockImplementation(async () => {
          savedDoc = this;
          return this;
        });
      });

      const notif1 = await sendNotification({
        collegeId: mockCollegeId,
        studentId: mockStudentId,
        title: 'Application Shortlisted',
        message: 'You have been shortlisted',
        type: 'APPLICATION_SHORTLISTED',
        applicationId: mockAppId
      });

      expect(notif1).toBeDefined();
      expect(savedDoc.type).toBe('APPLICATION_SHORTLISTED');
      expect(savedDoc.studentId).toBe(mockStudentId);

      // Second call: duplicate event exists
      Notification.findOne.mockResolvedValue(savedDoc);
      const notif2 = await sendNotification({
        collegeId: mockCollegeId,
        studentId: mockStudentId,
        title: 'Application Shortlisted',
        message: 'You have been shortlisted',
        type: 'APPLICATION_SHORTLISTED',
        applicationId: mockAppId
      });

      expect(notif2).toBe(savedDoc);
      expect(Notification.find).not.toHaveBeenCalled();
    });

    test('notification failure does not break application submission flow', async () => {
      const mockJob = {
        _id: mockJobId,
        collegeId: mockCollegeId,
        title: 'Software Engineer',
        company: 'Adobe',
        status: 'ACTIVE'
      };

      JobDescription.findOne.mockResolvedValue(mockJob);
      Application.findOne.mockResolvedValue(null);

      Application.mockImplementation(function(data) {
        Object.assign(this, data);
        this.save = jest.fn().mockResolvedValue(this);
      });

      // Mock notification save failure
      Notification.findOne.mockRejectedValue(new Error('Notification DB down'));

      const req = createMockReq({ params: { id: mockJobId } });
      const res = createMockRes();

      await studentController.applyToJob(req, res);

      // Application should still succeed 201
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toMatch(/submitted successfully/i);
    });
  });

  // ==========================================
  // 3. Placement Telemetry & Analytics
  // ==========================================
  describe('Placement Telemetry & Analytics (admin & student)', () => {
    test('admin placement analytics includes authoritative application telemetry', async () => {
      Student.aggregate.mockResolvedValueOnce([
        { _id: 'PLACED', count: 10 },
        { _id: 'UNPLACED', count: 20 }
      ])
      .mockResolvedValueOnce([]) // departments
      .mockResolvedValueOnce([]) // ctcDistribution
      .mockResolvedValueOnce([]) // topRecruiters
      .mockResolvedValueOnce([]); // batchTrends

      Application.aggregate.mockResolvedValueOnce([
        { _id: 'APPLIED', count: 15 },
        { _id: 'SHORTLISTED', count: 5 },
        { _id: 'SELECTED', count: 10 },
        { _id: 'REJECTED', count: 3 },
        { _id: 'WITHDRAWN', count: 2 }
      ]);

      const req = {
        collegeId: mockCollegeId,
        user: { id: 'admin1', role: 'COLLEGE_ADMIN' }
      };
      const res = createMockRes();

      await adminAnalyticsController.getPlacementAnalytics(req, res);

      expect(res.body.success).toBe(true);
      expect(res.body.data.applications).toBeDefined();
      expect(res.body.data.applications.total).toBe(35);
      expect(res.body.data.applications.selected).toBe(10);
      expect(res.body.data.applications.shortlisted).toBe(5);
      expect(res.body.data.applications.active).toBe(20);
      expect(res.body.data.applications.byStatus.APPLIED).toBe(15);
    });

    test('admin overview returns totalApplications metric', async () => {
      Student.countDocuments.mockResolvedValue(50);
      JobDescription.countDocuments.mockResolvedValue(10);
      Application.countDocuments.mockResolvedValue(45);
      Student.aggregate.mockResolvedValue([
        {
          avgReadiness: 75,
          avgTechnical: 70,
          avgSoftSkill: 80,
          avgResume: 75,
          avgCgpa: 8.2,
          atRiskCount: 5,
          readyCount: 30,
          needsImprovementCount: 15
        }
      ]);
      AuditLog.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([])
      });

      const req = {
        collegeId: mockCollegeId,
        user: { id: 'admin1', role: 'COLLEGE_ADMIN' }
      };
      const res = createMockRes();

      await adminAnalyticsController.getOverview(req, res);

      expect(res.body.success).toBe(true);
      expect(res.body.data.totalApplications).toBe(45);
    });

    test('student receives only their own placement telemetry', async () => {
      const mockStudentApps = [
        { status: 'APPLIED' },
        { status: 'SHORTLISTED' },
        { status: 'SELECTED' }
      ];

      Application.find.mockResolvedValue(mockStudentApps);

      const req = createMockReq();
      const res = createMockRes();

      await studentController.getPlacementTelemetry(req, res);

      expect(res.body.success).toBe(true);
      expect(res.body.data.totalApplications).toBe(3);
      expect(res.body.data.activeApplications).toBe(2);
      expect(res.body.data.selectedApplications).toBe(1);
      expect(res.body.data.byStatus.APPLIED).toBe(1);
      expect(res.body.data.byStatus.SHORTLISTED).toBe(1);
      expect(res.body.data.byStatus.SELECTED).toBe(1);
      expect(Application.find).toHaveBeenCalledWith({
        collegeId: mockCollegeId,
        studentId: mockStudentId
      });
    });
  });

  // ==========================================
  // 4. Audit Logging for Admin Lifecycle Updates
  // ==========================================
  describe('Audit Logging Verification (adminJobController)', () => {
    test('admin updating application status creates detailed AuditLog with actor and previous/new status', async () => {
      const mockApp = {
        _id: mockAppId,
        collegeId: mockCollegeId,
        studentId: mockStudentId,
        jobId: mockJobId,
        status: 'APPLIED',
        save: jest.fn().mockResolvedValue(true)
      };

      Application.findOne.mockResolvedValue(mockApp);
      Notification.findOne.mockResolvedValue(null);

      const req = {
        collegeId: mockCollegeId,
        user: { id: 'admin1', role: 'COLLEGE_ADMIN', email: 'admin@college.edu' },
        params: { id: mockAppId },
        body: { status: 'SHORTLISTED' }
      };
      const res = createMockRes();

      await adminJobController.updateApplicationStatus(req, res);

      expect(res.body.success).toBe(true);
      expect(AuditLog.create).toHaveBeenCalledWith(expect.objectContaining({
        collegeId: mockCollegeId,
        action: 'UPDATE_APPLICATION_STATUS',
        actor: 'admin@college.edu',
        details: expect.objectContaining({
          applicationId: mockAppId,
          previousStatus: 'APPLIED',
          newStatus: 'SHORTLISTED'
        })
      }));
    });
  });
});
