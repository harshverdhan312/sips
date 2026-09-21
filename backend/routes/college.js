const express = require('express');
const router = express.Router();
const collegeController = require('../controllers/collegeController');
const auth = require('../middleware/auth');
const tenant = require('../middleware/tenant');
const adminOnly = require('../middleware/adminOnly');

const multer = require('multer');
const path = require('path');
const config = require('../config');

// Configure multer for college logo uploads
const logoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, config.uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const uniqueName = `logo-${req.collegeId || 'college'}-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, uniqueName);
  }
});

const logoUpload = multer({
  storage: logoStorage,
  limits: { fileSize: config.uploadLimitBytes }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedExts = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedMimes.includes(file.mimetype) && allowedExts.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (JPEG, PNG, WebP, GIF) are allowed'), false);
    }
  }
});

// GET /api/college/profile — admin get college profile
router.get('/profile', auth, tenant, adminOnly, collegeController.getCollegeProfile);

// POST /api/college/profile/image & /api/college/logo — admin upload logo
router.post('/profile/image', auth, tenant, adminOnly, logoUpload.single('image'), collegeController.uploadLogo);
router.post('/logo', auth, tenant, adminOnly, logoUpload.single('image'), collegeController.uploadLogo);
router.delete('/profile/image', auth, tenant, adminOnly, collegeController.deleteLogo);
router.delete('/logo', auth, tenant, adminOnly, collegeController.deleteLogo);

// POST /api/college/upload-students — admin uploads CSV students
router.post('/upload-students', auth, tenant, adminOnly, collegeController.uploadStudents);

// GET /api/college/students — admin lists students
router.get('/students', auth, tenant, adminOnly, collegeController.getStudents);

// GET /api/college/info/:slug — public, get college info by slug
router.get('/info/:slug', collegeController.getCollegeBySlug);

module.exports = router;
