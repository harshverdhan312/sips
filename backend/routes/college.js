const express = require('express');
const router = express.Router();
const collegeController = require('../controllers/collegeController');
const auth = require('../middleware/auth');
const tenant = require('../middleware/tenant');
const adminOnly = require('../middleware/adminOnly');

// POST /api/college/upload-students — admin uploads CSV students
router.post('/upload-students', auth, tenant, adminOnly, collegeController.uploadStudents);

// GET /api/college/students — admin lists students
router.get('/students', auth, tenant, adminOnly, collegeController.getStudents);

// GET /api/college/info/:slug — public, get college info by slug
router.get('/info/:slug', collegeController.getCollegeBySlug);

module.exports = router;
