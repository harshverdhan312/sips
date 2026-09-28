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
    if (file.mimetype === 'application/pdf' && (ext === '.pdf' || !ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  }
});

// Configure multer for image uploads (JPEG, PNG, WebP, GIF)
const imageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, config.uploadDir);
  },
  filename: (req, file, cb) => {
    let ext = path.extname(file.originalname).toLowerCase();
    if (!ext) {
      if (file.mimetype === 'image/png') ext = '.png';
      else if (file.mimetype === 'image/webp') ext = '.webp';
      else if (file.mimetype === 'image/gif') ext = '.gif';
      else ext = '.jpg';
    }
    const uniqueName = `profile-${req.user ? req.user.id : 'user'}-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, uniqueName);
  }
});

const imageUpload = multer({
  storage: imageStorage,
  limits: { fileSize: config.uploadLimitBytes }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedExts = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedMimes.includes(file.mimetype) && (allowedExts.includes(ext) || !ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (JPEG, PNG, WebP, GIF) are allowed'), false);
    }
  }
});

const studentAccountAccess = require('../middleware/studentAccountAccess');

// Enforce auth, tenant, and real-time student account lifecycle checks on all student routes
router.use(auth, tenant, studentAccountAccess);

// GET /api/student/profile
router.get('/profile', studentController.getProfile);

// PUT /api/student/profile
router.put('/profile', studentController.updateProfile);

// GET /api/student/public-profile
router.get('/public-profile', studentController.getPublicProfileConfig);

// PUT /api/student/public-profile
router.put('/public-profile', studentController.updatePublicProfileConfig);

// GET /api/student/github/repos
router.get('/github/repos', studentController.getGithubRepos);

// GET /api/student/projects
router.get('/projects', studentController.getProjects);

// PUT /api/student/projects
router.put('/projects', studentController.updateProjects);

// POST /api/student/projects/sync
router.post('/projects/sync', studentController.syncProjects);

// POST /api/student/profile/image
router.post('/profile/image', imageUpload.single('image'), studentController.uploadProfileImage);

// DELETE /api/student/profile/image
router.delete('/profile/image', studentController.deleteProfileImage);

// GET /api/student/resume
router.get('/resume', studentController.getResume);

// POST /api/student/resume
router.post('/resume', upload.single('resume'), studentController.uploadResume);

// DELETE /api/student/resume
router.delete('/resume', studentController.deleteResume);

// GET /api/student/jobs
router.get('/jobs', studentController.getJobs);

// POST /api/student/jobs/:id/analyze-match
router.post('/jobs/:id/analyze-match', validateObjectId('id'), studentController.analyzeJobMatch);

// POST /api/student/jobs/:id/apply
router.post('/jobs/:id/apply', validateObjectId('id'), studentController.applyToJob);

// GET /api/student/preferred-jobs
router.get('/preferred-jobs', studentController.getPreferredJobs);

// GET /api/student/applications
router.get('/applications', studentController.getApplications);

// GET /api/student/applications/:id
router.get('/applications/:id', validateObjectId('id'), studentController.getApplicationById);

// PATCH /api/student/applications/:id/withdraw
router.patch('/applications/:id/withdraw', validateObjectId('id'), studentController.withdrawApplication);

// GET /api/student/analytics/placement
router.get('/analytics/placement', studentController.getPlacementTelemetry);

// POST /api/student/analytics/placement/predict
router.post('/analytics/placement/predict', studentController.predictPlacement);

// GET /api/student/analytics/placement/prediction
router.get('/analytics/placement/prediction', studentController.getLatestPlacementPrediction);

module.exports = router;
