const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const config = require('../config');
const studentController = require('../controllers/studentController');
const auth = require('../middleware/auth');
const tenant = require('../middleware/tenant');

// Ensure upload directory exists
if (!fs.existsSync(config.uploadDir)) {
  try {
    fs.mkdirSync(config.uploadDir, { recursive: true });
  } catch (err) {
    console.error('Failed to create upload directory:', err.message);
  }
}

// Configure multer for resume uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, config.uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}.pdf`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: config.uploadLimitBytes }, // 5MB
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (file.mimetype === 'application/pdf' && ext === '.pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  }
});

// GET /api/student/profile
router.get('/profile', auth, tenant, studentController.getProfile);

// PUT /api/student/profile
router.put('/profile', auth, tenant, studentController.updateProfile);

// POST /api/student/resume
router.post('/resume', auth, tenant, upload.single('resume'), studentController.uploadResume);

// GET /api/student/jobs
router.get('/jobs', auth, tenant, studentController.getJobs);

// GET /api/student/preferred-jobs
router.get('/preferred-jobs', auth, tenant, studentController.getPreferredJobs);

module.exports = router;
