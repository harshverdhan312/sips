const express = require('express');
const router = express.Router();
const publicController = require('../controllers/publicController');

/**
 * Public routes for shareable student career profiles.
 * No auth or tenant middleware required.
 */
router.get('/students/:username', publicController.getPublicStudentProfile);
router.get('/students/:username/resume', publicController.getPublicStudentResume);

module.exports = router;
