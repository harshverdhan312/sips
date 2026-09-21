const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const auth = require('../middleware/auth');
const tenant = require('../middleware/tenant');
const adminOnly = require('../middleware/adminOnly');
const { validateObjectId } = require('../middleware/validate');

// POST /api/notification — admin creates notification
router.post('/', auth, tenant, adminOnly, notificationController.createNotification);

// GET /api/notification — get notifications for caller's role and college
router.get('/', auth, tenant, notificationController.getNotifications);

// PATCH /api/notification/read-all — mark all notifications as read
router.patch('/read-all', auth, tenant, notificationController.markAllAsRead);

// PATCH /api/notification/:id/read — mark single notification as read
router.patch('/:id/read', auth, tenant, validateObjectId('id'), notificationController.markAsRead);

module.exports = router;
