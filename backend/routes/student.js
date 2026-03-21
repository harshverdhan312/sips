const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const studentController = require('../controllers/studentController');
const auth = require('../middleware/auth');
const tenant = require('../middleware/tenant');

// Configure multer for resume uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
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
