const request = require('supertest');
const mongoose = require('mongoose');
const express = require('express');
const College = require('../models/College');
const Student = require('../models/Student');
const collegeController = require('../controllers/collegeController');
const adminRoutes = require('../routes/admin');
const memoryDb = require('../utils/memoryDb');
const jwt = require('jsonwebtoken');
const config = require('../config');

describe('College Profile Management (GET & PUT /api/admin/college/profile)', () => {
  let app;
  let collegeAId, collegeBId;
  let collegeAToken, collegeBToken, studentToken;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    app.use('/api/admin', adminRoutes);

    // Setup mock or database records
    collegeAId = new mongoose.Types.ObjectId().toString();
    collegeBId = new mongoose.Types.ObjectId().toString();

    // Create JWT tokens
    collegeAToken = jwt.sign(
      { id: 'admin_a', role: 'COLLEGE_ADMIN', collegeId: collegeAId, collegeSlug: 'rvce' },
      config.jwtSecret,
      { expiresIn: '1h' }
    );

    collegeBToken = jwt.sign(
      { id: 'admin_b', role: 'COLLEGE_ADMIN', collegeId: collegeBId, collegeSlug: 'pes' },
      config.jwtSecret,
      { expiresIn: '1h' }
    );

    studentToken = jwt.sign(
      { id: 'student_1', role: 'student', collegeId: collegeAId },
      config.jwtSecret,
      { expiresIn: '1h' }
    );
  });

  describe('1. GET /api/admin/college/profile', () => {
    test('should reject request without authentication with 401', async () => {
      const res = await request(app).get('/api/admin/college/profile');
      expect(res.status).toBe(401);
    });

    test('should reject student token with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/admin/college/profile')
        .set('Authorization', `Bearer ${studentToken}`);
      expect(res.status).toBe(403);
    });

    test('should return college profile for authenticated college admin with tenant isolation', async () => {
      const mockCollegeA = {
        _id: collegeAId,
        name: 'R.V. College of Engineering',
        slug: 'rvce',
        adminEmail: 'admin@rvce.edu',
        acceptedDomains: ['rvce.edu'],
        logoUrl: '/uploads/logo-rvce.png',
        code: 'RVCE-01',
        address: 'Mysore Road',
        city: 'Bengaluru',
        state: 'Karnataka',
        website: 'https://rvce.edu.in',
        contactEmail: 'contact@rvce.edu',
        contactPhone: '+91 80 6818 8100',
        establishedYear: 1963,
        createdAt: new Date()
      };

      jest.spyOn(College, 'findById').mockReturnValue({
        select: jest.fn().mockResolvedValue(mockCollegeA)
      });

      const res = await request(app)
        .get('/api/admin/college/profile')
        .set('Authorization', `Bearer ${collegeAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.college.name).toBe('R.V. College of Engineering');
      expect(res.body.college.slug).toBe('rvce');
      expect(res.body.college.code).toBe('RVCE-01');
      expect(res.body.college.city).toBe('Bengaluru');
      expect(res.body.college.establishedYear).toBe(1963);
      expect(res.body.college.masterPasswordHash).toBeUndefined();

      expect(College.findById).toHaveBeenCalledWith(collegeAId);
      College.findById.mockRestore();
    });
  });

  describe('2. PUT /api/admin/college/profile', () => {
    test('should successfully update editable college fields', async () => {
      const updatedFields = {
        name: 'RV University Engineering',
        code: 'RVU-ENG',
        address: 'RV Vidyaniketan, Post, Mysuru Rd',
        city: 'Bengaluru',
        state: 'Karnataka',
        website: 'https://rvu.edu.in',
        contactEmail: 'placement.cell@rvu.edu.in',
        contactPhone: '+91 80 6818 8111',
        establishedYear: 1963,
        acceptedDomains: ['rvu.edu.in', 'student.rvu.edu.in']
      };

      const updatedCollegeDoc = {
        _id: collegeAId,
        slug: 'rvce',
        adminEmail: 'admin@rvce.edu',
        logoUrl: '/uploads/logo-rvce.png',
        ...updatedFields,
        createdAt: new Date()
      };

      jest.spyOn(College, 'findByIdAndUpdate').mockReturnValue({
        select: jest.fn().mockResolvedValue(updatedCollegeDoc)
      });

      const res = await request(app)
        .put('/api/admin/college/profile')
        .set('Authorization', `Bearer ${collegeAToken}`)
        .send(updatedFields);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('College profile updated successfully');
      expect(res.body.college.name).toBe('RV University Engineering');
      expect(res.body.college.code).toBe('RVU-ENG');
      expect(res.body.college.website).toBe('https://rvu.edu.in');
      expect(res.body.college.contactEmail).toBe('placement.cell@rvu.edu.in');
      expect(res.body.college.acceptedDomains).toEqual(['rvu.edu.in', 'student.rvu.edu.in']);

      // Ensure findByIdAndUpdate was called strictly with collegeAId
      expect(College.findByIdAndUpdate).toHaveBeenCalledWith(
        collegeAId,
        expect.objectContaining({
          $set: expect.objectContaining({
            name: 'RV University Engineering',
            code: 'RVU-ENG',
            website: 'https://rvu.edu.in'
          })
        }),
        expect.any(Object)
      );

      College.findByIdAndUpdate.mockRestore();
    });

    test('should strictly ignore attempts to modify protected fields (_id, slug, logoUrl, masterPasswordHash, roles)', async () => {
      let capturedSet = null;
      jest.spyOn(College, 'findByIdAndUpdate').mockImplementation((id, update) => {
        capturedSet = update.$set;
        return {
          select: jest.fn().mockResolvedValue({
            _id: collegeAId,
            name: 'Valid College Name',
            slug: 'rvce',
            logoUrl: '/uploads/original-logo.png'
          })
        };
      });

      const res = await request(app)
        .put('/api/admin/college/profile')
        .set('Authorization', `Bearer ${collegeAToken}`)
        .send({
          name: 'Valid College Name',
          _id: 'malicious_id_override',
          slug: 'hacked-slug',
          logoUrl: 'https://malicious-site.com/fake.png',
          masterPasswordHash: 'hacked_hash',
          role: 'SUPERADMIN',
          roles: ['SUPERADMIN'],
          collegeId: collegeBId
        });

      expect(res.status).toBe(200);
      expect(capturedSet).toBeDefined();
      expect(capturedSet.name).toBe('Valid College Name');
      expect(capturedSet._id).toBeUndefined();
      expect(capturedSet.slug).toBeUndefined();
      expect(capturedSet.logoUrl).toBeUndefined();
      expect(capturedSet.masterPasswordHash).toBeUndefined();
      expect(capturedSet.role).toBeUndefined();
      expect(capturedSet.roles).toBeUndefined();
      expect(capturedSet.collegeId).toBeUndefined();

      College.findByIdAndUpdate.mockRestore();
    });

    test('should reject empty college name with 400', async () => {
      const res = await request(app)
        .put('/api/admin/college/profile')
        .set('Authorization', `Bearer ${collegeAToken}`)
        .send({ name: '   ' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/name cannot be empty/i);
    });

    test('should reject invalid contact email format with 400', async () => {
      const res = await request(app)
        .put('/api/admin/college/profile')
        .set('Authorization', `Bearer ${collegeAToken}`)
        .send({ contactEmail: 'invalid-email-string' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/invalid contact email/i);
    });

    test('should reject invalid establishedYear with 400', async () => {
      const res = await request(app)
        .put('/api/admin/college/profile')
        .set('Authorization', `Bearer ${collegeAToken}`)
        .send({ establishedYear: 1500 });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/established year/i);
    });

    test('should reject invalid acceptedDomains format with 400', async () => {
      const res = await request(app)
        .put('/api/admin/college/profile')
        .set('Authorization', `Bearer ${collegeAToken}`)
        .send({ acceptedDomains: ['invalid_domain_format!'] });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/invalid domain format/i);
    });

    test('should enforce tenant isolation (cannot update College B using College A token)', async () => {
      jest.spyOn(College, 'findByIdAndUpdate').mockImplementation((targetId) => {
        // Must always equal the authenticated req.collegeId (College A), never College B
        expect(targetId).toBe(collegeAToken ? collegeAId : '');
        return {
          select: jest.fn().mockResolvedValue({ _id: collegeAId, name: 'RVCE' })
        };
      });

      const res = await request(app)
        .put('/api/admin/college/profile')
        .set('Authorization', `Bearer ${collegeAToken}`)
        .send({ name: 'Updated Name Attempt' });

      expect(res.status).toBe(200);
      College.findByIdAndUpdate.mockRestore();
    });
  });

  describe('3. In-Memory Mode Resilient College Profile Operations', () => {
    test('should get and update college profile in memoryDb fallback store', async () => {
      const memCollege = memoryDb.saveCollege({
        _id: 'col_mem_123',
        name: 'PES Institute of Technology',
        slug: 'pesit',
        adminEmail: 'admin@pesit.edu',
        masterPasswordHash: 'hash123',
        acceptedDomains: ['pesit.edu'],
        code: 'PES-01',
        city: 'Bengaluru'
      });

      expect(memCollege).toBeDefined();
      expect(memCollege._id).toBe('col_mem_123');

      // Update in memoryDb
      const updated = memoryDb.updateCollege('col_mem_123', {
        name: 'PES University Ring Road Campus',
        city: 'Bangalore South',
        website: 'https://pes.edu',
        establishedYear: 1972
      });

      expect(updated.name).toBe('PES University Ring Road Campus');
      expect(updated.city).toBe('Bangalore South');
      expect(updated.website).toBe('https://pes.edu');
      expect(updated.establishedYear).toBe(1972);
      expect(updated.code).toBe('PES-01');

      // Fetch by ID
      const fetched = memoryDb.findCollegeById('col_mem_123');
      expect(fetched.name).toBe('PES University Ring Road Campus');
    });
  });
});
