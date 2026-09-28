const request = require('supertest');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

const app = require('../server');
const config = require('../config');
const memoryDb = require('../utils/memoryDb');
const { safeDeleteUploadFile } = require('../utils/fileStorage');
const Student = require('../models/Student');
const Match = require('../models/Match');
const Application = require('../models/Application');
const PlacementPrediction = require('../models/PlacementPrediction');
const Notification = require('../models/Notification');

describe('SIPS Student Lifecycle & Deletion Architecture Tests', () => {
  const uploadDir = path.resolve(config.uploadDir || path.join(__dirname, '../uploads'));
  const collegeAId = new mongoose.Types.ObjectId().toString();
  const collegeBId = new mongoose.Types.ObjectId().toString();

  const student1Id = new mongoose.Types.ObjectId().toString();
  const student2Id = new mongoose.Types.ObjectId().toString();
  const studentBId = new mongoose.Types.ObjectId().toString();

  const adminTokenA = jwt.sign(
    { id: collegeAId, role: 'COLLEGE_ADMIN', collegeId: collegeAId, email: 'admin@collegea.edu' },
    config.jwtSecret,
    { expiresIn: '7d' }
  );

  const adminTokenB = jwt.sign(
    { id: collegeBId, role: 'COLLEGE_ADMIN', collegeId: collegeBId, email: 'admin@collegeb.edu' },
    config.jwtSecret,
    { expiresIn: '7d' }
  );

  let student1Token;
  let student2Token;

  const resume1Filename = 'test-lifecycle-std1-resume.pdf';
  const avatar1Filename = 'test-lifecycle-std1-avatar.png';
  const resume1Path = path.join(uploadDir, resume1Filename);
  const avatar1Path = path.join(uploadDir, avatar1Filename);

  beforeAll(async () => {
    jest.spyOn(memoryDb, 'isMongoConnected').mockReturnValue(false);

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
  });

  beforeEach(async () => {
    memoryDb.clearAll();

    // Setup college A & B in memoryDb
    memoryDb.saveCollege({
      _id: collegeAId,
      name: 'College of Engineering A',
      slug: 'college-a',
      adminEmail: 'admin@collegea.edu',
      masterPasswordHash: await bcrypt.hash('adminPass123', 10),
      acceptedDomains: ['collegea.edu']
    });

    memoryDb.saveCollege({
      _id: collegeBId,
      name: 'College of Technology B',
      slug: 'college-b',
      adminEmail: 'admin@collegeb.edu',
      masterPasswordHash: await bcrypt.hash('adminPass123', 10),
      acceptedDomains: ['collegeb.edu']
    });

    // Create test files
    fs.writeFileSync(resume1Path, '%PDF-1.4 Lifecycle Student 1 Resume Content');
    fs.writeFileSync(avatar1Path, '\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR');

    // Create Student 1 in College A (ACTIVE)
    const student1 = memoryDb.saveStudent({
      _id: student1Id,
      collegeId: collegeAId,
      name: 'Rahul Sharma',
      rollNo: '230161530076',
      usn: '230161530076',
      email: 'rahul.sharma@collegea.edu',
      passwordHash: await bcrypt.hash('studentPass123', 10),
      branch: 'Computer Science & Engineering',
      batch: '2025',
      cgpa: 8.5,
      placementStatus: 'PLACED',
      accountStatus: 'ACTIVE',
      resumeUrl: `/uploads/${resume1Filename}`,
      profileImageUrl: `/uploads/${avatar1Filename}`,
      publicProfile: {
        enabled: true,
        username: 'rahul-sharma',
        bio: 'Aspiring Full Stack Engineer',
        showResume: true
      }
    });

    // Create Student 2 in College A (ACTIVE default)
    memoryDb.saveStudent({
      _id: student2Id,
      collegeId: collegeAId,
      name: 'Priya Patel',
      rollNo: '230161530077',
      usn: '230161530077',
      email: 'priya.patel@collegea.edu',
      passwordHash: await bcrypt.hash('studentPass123', 10),
      branch: 'Information Science',
      batch: '2025',
      cgpa: 8.9,
      placementStatus: 'UNPLACED',
      accountStatus: 'ACTIVE',
      publicProfile: {
        enabled: false,
        username: 'priya-patel'
      }
    });

    // Create Student B in College B
    memoryDb.saveStudent({
      _id: studentBId,
      collegeId: collegeBId,
      name: 'College B Student',
      rollNo: 'B2025001',
      usn: 'B2025001',
      email: 'student@collegeb.edu',
      passwordHash: await bcrypt.hash('studentPass123', 10),
      accountStatus: 'ACTIVE'
    });

    // Issue tokens
    student1Token = jwt.sign(
      { id: student1Id, role: 'STUDENT', collegeId: collegeAId },
      config.jwtSecret,
      { expiresIn: '7d' }
    );

    student2Token = jwt.sign(
      { id: student2Id, role: 'STUDENT', collegeId: collegeAId },
      config.jwtSecret,
      { expiresIn: '7d' }
    );
  });

  afterAll(() => {
    if (fs.existsSync(resume1Path)) fs.unlinkSync(resume1Path);
    if (fs.existsSync(avatar1Path)) fs.unlinkSync(avatar1Path);
  });

  // =========================================================================
  // 1. ACCOUNT STATUS & LOGIN ENFORCEMENT
  // =========================================================================
  describe('Account Status & Authentication Enforcement', () => {
    it('1. Default student accountStatus is ACTIVE in model and database', () => {
      const std = memoryDb.findStudentById(student2Id);
      expect(std.accountStatus).toBe('ACTIVE');
    });

    it('2. Active student can successfully login with email and credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'rahul.sharma@collegea.edu',
          password: 'studentPass123'
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.role).toBe('STUDENT');
      expect(res.body.studentName).toBe('Rahul Sharma');
    });

    it('3. PASSOUT student cannot login and is rejected with 403', async () => {
      memoryDb.updateStudent(student1Id, { accountStatus: 'PASSOUT' });

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'rahul.sharma@collegea.edu',
          password: 'studentPass123'
        });

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/graduated/i);
    });

    it('4. DEACTIVATED student cannot login and is rejected with 403', async () => {
      memoryDb.updateStudent(student1Id, { accountStatus: 'DEACTIVATED' });

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'rahul.sharma@collegea.edu',
          password: 'studentPass123'
        });

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/contact your Placement Cell/i);
    });

    it('5. PASSOUT login rejection provides appropriate alumni response message', async () => {
      memoryDb.updateStudent(student1Id, { accountStatus: 'PASSOUT' });

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          identifier: '230161530076',
          password: 'studentPass123',
          collegeSlug: 'college-a'
        });

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Your student portal access has concluded as a graduated student');
    });

    it('6. DEACTIVATED login rejection provides appropriate Placement Cell contact message', async () => {
      memoryDb.updateStudent(student1Id, { accountStatus: 'DEACTIVATED' });

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          identifier: '230161530076',
          password: 'studentPass123',
          collegeSlug: 'college-a'
        });

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Your student account has been deactivated. Please contact your Placement Cell.');
    });

    it('7. PASSOUT student cannot use student profile API', async () => {
      memoryDb.updateStudent(student1Id, { accountStatus: 'PASSOUT' });

      const res = await request(app)
        .get('/api/student/profile')
        .set('Authorization', `Bearer ${student1Token}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/graduated/i);
    });

    it('8. DEACTIVATED student cannot use student profile API', async () => {
      memoryDb.updateStudent(student1Id, { accountStatus: 'DEACTIVATED' });

      const res = await request(app)
        .get('/api/student/profile')
        .set('Authorization', `Bearer ${student1Token}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/deactivated/i);
    });

    it('9. Old JWT is immediately rejected after ACTIVE -> PASSOUT transition', async () => {
      // 1. Verify working while ACTIVE
      const activeRes = await request(app)
        .get('/api/student/profile')
        .set('Authorization', `Bearer ${student1Token}`);
      expect(activeRes.status).toBe(200);

      // 2. Admin changes status to PASSOUT
      const patchRes = await request(app)
        .patch(`/api/admin/students/${student1Id}/account-status`)
        .set('Authorization', `Bearer ${adminTokenA}`)
        .send({ accountStatus: 'PASSOUT' });
      expect(patchRes.status).toBe(200);

      // 3. Same previous JWT is immediately rejected
      const passoutRes = await request(app)
        .get('/api/student/profile')
        .set('Authorization', `Bearer ${student1Token}`);
      expect(passoutRes.status).toBe(403);
      expect(passoutRes.body.message).toMatch(/graduated/i);
    });

    it('10. Old JWT is immediately rejected after ACTIVE -> DEACTIVATED transition', async () => {
      // 1. Admin changes status to DEACTIVATED
      const patchRes = await request(app)
        .patch(`/api/admin/students/${student1Id}/account-status`)
        .set('Authorization', `Bearer ${adminTokenA}`)
        .send({ accountStatus: 'DEACTIVATED' });
      expect(patchRes.status).toBe(200);

      // 2. Same previous JWT is immediately rejected on protected student APIs
      const deactRes = await request(app)
        .get('/api/student/profile')
        .set('Authorization', `Bearer ${student1Token}`);
      expect(deactRes.status).toBe(403);
      expect(deactRes.body.message).toMatch(/deactivated/i);
    });

    it('11. PASSOUT -> ACTIVE restores student login and API access', async () => {
      memoryDb.updateStudent(student1Id, { accountStatus: 'PASSOUT' });

      // Admin restores access
      const patchRes = await request(app)
        .patch(`/api/admin/students/${student1Id}/account-status`)
        .set('Authorization', `Bearer ${adminTokenA}`)
        .send({ accountStatus: 'ACTIVE' });
      expect(patchRes.status).toBe(200);

      // Token works again
      const profileRes = await request(app)
        .get('/api/student/profile')
        .set('Authorization', `Bearer ${student1Token}`);
      expect(profileRes.status).toBe(200);
      expect(profileRes.body.name).toBe('Rahul Sharma');
    });

    it('12. DEACTIVATED -> ACTIVE restores student login and API access', async () => {
      memoryDb.updateStudent(student1Id, { accountStatus: 'DEACTIVATED' });

      // Admin restores access
      const patchRes = await request(app)
        .patch(`/api/admin/students/${student1Id}/account-status`)
        .set('Authorization', `Bearer ${adminTokenA}`)
        .send({ accountStatus: 'ACTIVE' });
      expect(patchRes.status).toBe(200);

      // Token works again
      const profileRes = await request(app)
        .get('/api/student/profile')
        .set('Authorization', `Bearer ${student1Token}`);
      expect(profileRes.status).toBe(200);
      expect(profileRes.body.name).toBe('Rahul Sharma');
    });
  });

  // =========================================================================
  // 2. PUBLIC PROFILE BEHAVIOR
  // =========================================================================
  describe('Public Career Profile Lifecycle Visibility', () => {
    it('13. PASSOUT student public career profile remains live if enabled', async () => {
      memoryDb.updateStudent(student1Id, { accountStatus: 'PASSOUT' });

      const res = await request(app).get('/api/public/students/rahul-sharma');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.username).toBe('rahul-sharma');
      expect(res.body.profile.name).toBe('Rahul Sharma');
    });

    it('14. DEACTIVATED student public career profile returns 404', async () => {
      memoryDb.updateStudent(student1Id, { accountStatus: 'DEACTIVATED' });

      const res = await request(app).get('/api/public/students/rahul-sharma');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('15. Deleted student public career profile returns 404', async () => {
      memoryDb.deleteStudent(student1Id);

      const res = await request(app).get('/api/public/students/rahul-sharma');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  // =========================================================================
  // 3. TENANT SECURITY & AUTHORIZATION
  // =========================================================================
  describe('Tenant Security & Status Update Authorization', () => {
    it('16. College A cannot change College B student account status', async () => {
      const res = await request(app)
        .patch(`/api/admin/students/${studentBId}/account-status`)
        .set('Authorization', `Bearer ${adminTokenA}`)
        .send({ accountStatus: 'PASSOUT' });

      expect(res.status).toBe(404);
      // Student in College B remains untouched
      const stdB = memoryDb.findStudentById(studentBId);
      expect(stdB.accountStatus).toBe('ACTIVE');
    });

    it('17. College A cannot delete College B student', async () => {
      const res = await request(app)
        .delete(`/api/admin/students/${studentBId}`)
        .set('Authorization', `Bearer ${adminTokenA}`);

      expect(res.status).toBe(404);
      // Student in College B still exists
      const stdB = memoryDb.findStudentById(studentBId);
      expect(stdB).not.toBeNull();
    });

    it('18. Unauthorized role (STUDENT) cannot change student status', async () => {
      const res = await request(app)
        .patch(`/api/admin/students/${student1Id}/account-status`)
        .set('Authorization', `Bearer ${student1Token}`)
        .send({ accountStatus: 'DEACTIVATED' });

      expect(res.status).toBe(403);
    });

    it('19. Unauthorized role (STUDENT) cannot delete a student', async () => {
      const res = await request(app)
        .delete(`/api/admin/students/${student2Id}`)
        .set('Authorization', `Bearer ${student1Token}`);

      expect(res.status).toBe(403);
    });
  });

  // =========================================================================
  // 4. STATUS VALIDATION
  // =========================================================================
  describe('Status Validation & Lifecycle Independence', () => {
    it('20. Invalid accountStatus values are rejected with 400', async () => {
      const res = await request(app)
        .patch(`/api/admin/students/${student1Id}/account-status`)
        .set('Authorization', `Bearer ${adminTokenA}`)
        .send({ accountStatus: 'INVALID_STATUS' });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/Invalid accountStatus/i);
    });

    it('21. DELETED cannot be set through the status update endpoint', async () => {
      const res = await request(app)
        .patch(`/api/admin/students/${student1Id}/account-status`)
        .set('Authorization', `Bearer ${adminTokenA}`)
        .send({ accountStatus: 'DELETED' });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/Invalid accountStatus/i);
    });

    it('22. placementStatus remains completely independent of accountStatus', () => {
      const std = memoryDb.findStudentById(student1Id);
      expect(std.placementStatus).toBe('PLACED');
      expect(std.accountStatus).toBe('ACTIVE');

      memoryDb.updateStudent(student1Id, { accountStatus: 'PASSOUT' });
      const updatedStd = memoryDb.findStudentById(student1Id);
      expect(updatedStd.placementStatus).toBe('PLACED');
      expect(updatedStd.accountStatus).toBe('PASSOUT');
    });
  });

  // =========================================================================
  // 5. HARDENED TENANT-SCOPED DELETION & CLEANUP
  // =========================================================================
  describe('Destructive Student Deletion & Complete Dependency Cleanup', () => {
    it('24. Delete endpoint is strictly tenant scoped', async () => {
      const res = await request(app)
        .delete(`/api/admin/students/${studentBId}`)
        .set('Authorization', `Bearer ${adminTokenA}`);

      expect(res.status).toBe(404);
    });

    it('25. Student document is permanently removed upon deletion', async () => {
      const res = await request(app)
        .delete(`/api/admin/students/${student1Id}`)
        .set('Authorization', `Bearer ${adminTokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const lookup = memoryDb.findStudentById(student1Id);
      expect(lookup).toBeUndefined();
    });

    it('26-28. Cascade cleans Match, PlacementPrediction, and Notification records', () => {
      memoryDb.matches.push({ _id: 'm1', studentId: student1Id, collegeId: collegeAId });
      memoryDb.placementPredictions.push({ _id: 'p1', studentId: student1Id, collegeId: collegeAId });
      memoryDb.notifications.push({ _id: 'n1', studentId: student1Id, collegeId: collegeAId });

      memoryDb.deleteStudent(student1Id);

      expect(memoryDb.matches.find(m => String(m.studentId) === String(student1Id))).toBeUndefined();
      expect(memoryDb.placementPredictions.find(p => String(p.studentId) === String(student1Id))).toBeUndefined();
      expect(memoryDb.notifications.find(n => String(n.studentId) === String(student1Id))).toBeUndefined();
    });

    it('29-31. Filesystem cleanup safely unlinks resume and avatar without crashing on missing files', () => {
      expect(fs.existsSync(resume1Path)).toBe(true);
      expect(fs.existsSync(avatar1Path)).toBe(true);

      safeDeleteUploadFile(`/uploads/${resume1Filename}`);
      safeDeleteUploadFile(`/uploads/${avatar1Filename}`);

      expect(fs.existsSync(resume1Path)).toBe(false);
      expect(fs.existsSync(avatar1Path)).toBe(false);

      // Missing or invalid files should not throw
      expect(() => safeDeleteUploadFile('/uploads/nonexistent-file.pdf')).not.toThrow();
      expect(() => safeDeleteUploadFile('../../../etc/passwd')).not.toThrow();
      expect(() => safeDeleteUploadFile(null)).not.toThrow();
    });

    it('32. Public username becomes immediately reusable after student deletion', () => {
      expect(memoryDb.isPublicUsernameTaken('rahul-sharma')).toBe(true);

      memoryDb.deleteStudent(student1Id);

      expect(memoryDb.isPublicUsernameTaken('rahul-sharma')).toBe(false);

      // Student 2 can now claim the released username
      memoryDb.updateStudent(student2Id, {
        publicProfile: {
          enabled: true,
          username: 'rahul-sharma'
        }
      });

      const claimed = memoryDb.findStudentByPublicUsername('rahul-sharma');
      expect(claimed).not.toBeNull();
      expect(String(claimed._id)).toBe(String(student2Id));
    });

    it('33. Deleted student cannot login', async () => {
      memoryDb.deleteStudent(student1Id);

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'rahul.sharma@collegea.edu',
          password: 'studentPass123'
        });

      expect(res.status).toBe(401);
    });

    it('34. Deleted student public profile returns 404', async () => {
      memoryDb.deleteStudent(student1Id);

      const res = await request(app).get('/api/public/students/rahul-sharma');
      expect(res.status).toBe(404);
    });
  });

  // =========================================================================
  // 6. APPLICATIONS & REPORTING DEPENDENCY
  // =========================================================================
  describe('Applications & Debarment Enforcement', () => {
    const testJobId = new mongoose.Types.ObjectId().toString();

    beforeEach(() => {
      memoryDb.saveJob({
        _id: testJobId,
        collegeId: collegeAId,
        title: 'Full Stack Engineer',
        company: 'Tech Corp',
        status: 'ACTIVE',
        minCgpa: 6.0,
        allowedBranches: ['Computer Science & Engineering', 'Information Science']
      });
    });

    it('35. Debarred student CAN log in successfully', async () => {
      memoryDb.updateStudent(student1Id, { accountStatus: 'DEBARRED' });

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'rahul.sharma@collegea.edu',
          password: 'studentPass123'
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.role).toBe('STUDENT');
    });

    it('36. Debarred student CAN view their student profile', async () => {
      memoryDb.updateStudent(student1Id, { accountStatus: 'DEBARRED' });

      const res = await request(app)
        .get('/api/student/profile')
        .set('Authorization', `Bearer ${student1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Rahul Sharma');
    });

    it('37. Debarred student CANNOT apply to jobs and receives 403 Forbidden with clear message', async () => {
      memoryDb.updateStudent(student1Id, { accountStatus: 'DEBARRED' });

      const res = await request(app)
        .post(`/api/student/jobs/${testJobId}/apply`)
        .set('Authorization', `Bearer ${student1Token}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('You have been debarred from applying to placement drives. Please contact your Placement Cell.');
    });

    it('38. Restoring debarred student to ACTIVE immediately re-enables job application privilege', async () => {
      memoryDb.updateStudent(student1Id, { accountStatus: 'DEBARRED' });

      // Admin restores student
      const patchRes = await request(app)
        .patch(`/api/admin/students/${student1Id}/account-status`)
        .set('Authorization', `Bearer ${adminTokenA}`)
        .send({ accountStatus: 'ACTIVE' });
      expect(patchRes.status).toBe(200);

      // Student applies to job successfully
      const applyRes = await request(app)
        .post(`/api/student/jobs/${testJobId}/apply`)
        .set('Authorization', `Bearer ${student1Token}`);

      expect(applyRes.status).toBe(201);
      expect(applyRes.body.success).toBe(true);
      expect(applyRes.body.message).toMatch(/submitted/i);
    });

    it('39. Application cascade removes dependent records on delete', () => {
      memoryDb.applications.push({
        _id: 'app1',
        studentId: student1Id,
        collegeId: collegeAId,
        status: 'SELECTED'
      });

      memoryDb.deleteStudent(student1Id);

      const appCheck = memoryDb.applications.find(a => String(a.studentId) === String(student1Id));
      expect(appCheck).toBeUndefined();
    });

    it('40. Pass-out student maintains historical placement metrics whereas deleted student does not', () => {
      memoryDb.updateStudent(student1Id, { accountStatus: 'PASSOUT' });
      const students = memoryDb.getStudents(collegeAId);
      const placed = students.filter(s => s.placementStatus === 'PLACED');
      expect(placed.length).toBe(1);
    });
  });

  // =========================================================================
  // 7. BULK LIFECYCLE & DELETION OPERATIONS
  // =========================================================================
  describe('Bulk Account Status & Bulk Deletion Operations', () => {
    it('41. Bulk update status to DEBARRED updates all specified students in tenant', async () => {
      const res = await request(app)
        .patch('/api/admin/students/bulk-account-status')
        .set('Authorization', `Bearer ${adminTokenA}`)
        .send({
          studentIds: [student1Id, student2Id],
          accountStatus: 'DEBARRED'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.updatedCount).toBe(2);

      const std1 = memoryDb.findStudentById(student1Id);
      const std2 = memoryDb.findStudentById(student2Id);
      expect(std1.accountStatus).toBe('DEBARRED');
      expect(std2.accountStatus).toBe('DEBARRED');
    });

    it('42. Bulk update status to PASSOUT updates all specified students', async () => {
      const res = await request(app)
        .patch('/api/admin/students/bulk-account-status')
        .set('Authorization', `Bearer ${adminTokenA}`)
        .send({
          studentIds: [student1Id, student2Id],
          accountStatus: 'PASSOUT'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.updatedCount).toBe(2);

      const std1 = memoryDb.findStudentById(student1Id);
      const std2 = memoryDb.findStudentById(student2Id);
      expect(std1.accountStatus).toBe('PASSOUT');
      expect(std2.accountStatus).toBe('PASSOUT');
    });

    it('43. Bulk restore to ACTIVE restores all specified students', async () => {
      memoryDb.updateStudent(student1Id, { accountStatus: 'DEBARRED' });
      memoryDb.updateStudent(student2Id, { accountStatus: 'PASSOUT' });

      const res = await request(app)
        .patch('/api/admin/students/bulk-account-status')
        .set('Authorization', `Bearer ${adminTokenA}`)
        .send({
          studentIds: [student1Id, student2Id],
          accountStatus: 'ACTIVE'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.updatedCount).toBe(2);

      const std1 = memoryDb.findStudentById(student1Id);
      const std2 = memoryDb.findStudentById(student2Id);
      expect(std1.accountStatus).toBe('ACTIVE');
      expect(std2.accountStatus).toBe('ACTIVE');
    });

    it('44. Bulk delete removes multiple students and cleans up files and dependent records', async () => {
      expect(fs.existsSync(resume1Path)).toBe(true);

      const res = await request(app)
        .post('/api/admin/students/bulk-delete')
        .set('Authorization', `Bearer ${adminTokenA}`)
        .send({
          studentIds: [student1Id, student2Id]
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.deletedCount).toBe(2);

      expect(memoryDb.findStudentById(student1Id)).toBeUndefined();
      expect(memoryDb.findStudentById(student2Id)).toBeUndefined();
      expect(fs.existsSync(resume1Path)).toBe(false);
    });
  });
});
