const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const config = require('../config');
const studentController = require('../controllers/studentController');
const auth = require('../middleware/auth');
const tenant = require('../middleware/tenant');
const { validateObjectId } = require('../middleware/validate');

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

// POST /api/student/jobs/:id/apply
router.post('/jobs/:id/apply', auth, tenant, validateObjectId('id'), studentController.applyToJob);

// GET /api/student/preferred-jobs
router.get('/preferred-jobs', auth, tenant, studentController.getPreferredJobs);

// GET /api/student/applications
router.get('/applications', auth, tenant, studentController.getApplications);

// GET /api/student/applications/:id
router.get('/applications/:id', auth, tenant, validateObjectId('id'), studentController.getApplicationById);

// PATCH /api/student/applications/:id/withdraw
router.patch('/applications/:id/withdraw', auth, tenant, validateObjectId('id'), studentController.withdrawApplication);

// GET /api/student/analytics/placement
router.get('/analytics/placement', auth, tenant, studentController.getPlacementTelemetry);

// POST /api/student/analytics/placement/predict
router.post('/analytics/placement/predict', auth, tenant, studentController.predictPlacement);

// GET /api/student/analytics/placement/prediction
router.get('/analytics/placement/prediction', auth, tenant, studentController.getLatestPlacementPrediction);

module.exports = router;
