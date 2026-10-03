const express = require('express');
const router = express.Router();
const institutionController = require('../controllers/institutionController');
const auth = require('../middleware/auth');
const tenant = require('../middleware/tenant');
const adminOnly = require('../middleware/adminOnly');
const { validateObjectId } = require('../middleware/validate');
const multer = require('multer');
const path = require('path');
const config = require('../config');

// Configure multer for institution logo uploads
const logoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, config.uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const uniqueName = `inst-logo-${req.institutionId || 'inst'}-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
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

// POST /api/institution/onboard — public university onboarding
router.post('/onboard', institutionController.onboardInstitution);

// University Admin profile
router.get('/profile', auth, tenant, adminOnly, institutionController.getInstitutionProfile);
router.put('/profile', auth, tenant, adminOnly, institutionController.updateInstitutionProfile);
router.post('/profile/image', auth, tenant, adminOnly, logoUpload.single('image'), institutionController.uploadLogo);
router.delete('/profile/image', auth, tenant, adminOnly, institutionController.deleteLogo);

// University Admin department management
router.get('/departments', auth, tenant, adminOnly, institutionController.getDepartments);
router.post('/departments', auth, tenant, adminOnly, institutionController.createDepartment);
router.put('/departments/:id', auth, tenant, adminOnly, validateObjectId('id'), institutionController.updateDepartment);
router.patch('/departments/:id/status', auth, tenant, adminOnly, validateObjectId('id'), institutionController.toggleDepartmentStatus);
router.delete('/departments/:id', auth, tenant, adminOnly, validateObjectId('id'), institutionController.deleteDepartment);

// Department Admin's own profile management
router.get('/department/profile', auth, tenant, adminOnly, institutionController.getDepartmentOwnProfile);
router.put('/department/profile', auth, tenant, adminOnly, institutionController.updateDepartmentOwnProfile);

module.exports = router;
