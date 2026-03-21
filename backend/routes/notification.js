const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const auth = require('../middleware/auth');
const tenant = require('../middleware/tenant');
const adminOnly = require('../middleware/adminOnly');

// POST /api/notification — admin creates notification
router.post('/', auth, tenant, adminOnly, notificationController.createNotification);

// GET /api/notification — get notifications (auth required)
router.get('/', auth, tenant, notificationController.getNotifications);

module.exports = router;
