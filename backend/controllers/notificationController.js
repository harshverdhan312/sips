const Notification = require('../models/Notification');
const memoryDb = require('../utils/memoryDb');
const logger = require('../utils/logger');

/**
 * POST /api/notification
 * Admin-only — create a notification for the college
 */
exports.createNotification = async (req, res) => {
  try {
    const { message, title, target, type, studentId } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Notification message is required' });
    }

    const cleanTarget = target && Notification.TARGET_TYPES.includes(target) ? target : (studentId ? 'INDIVIDUAL' : 'ALL');
    const cleanType = type && Notification.NOTIFICATION_TYPES.includes(type) ? type : 'ANNOUNCEMENT';

    if (!memoryDb.isMongoConnected()) {
      const notification = memoryDb.saveNotification({
        collegeId: req.collegeId,
        studentId: studentId || null,
        title: (title || '').trim(),
        message: message.trim(),
        type: cleanType,
        target: cleanTarget,
        read: false,
        readAt: null
      });
      return res.status(201).json({ success: true, message: 'Notification created', notification });
    }

    const notification = new Notification({
      collegeId: req.collegeId,
      studentId: studentId || null,
      title: (title || '').trim(),
      message: message.trim(),
      type: cleanType,
      target: cleanTarget,
      read: false,
      readAt: null
    });

    await notification.save();
    res.status(201).json({ success: true, message: 'Notification created', notification });
  } catch (error) {
    logger.error('Create notification error:', error);
    res.status(500).json({ success: false, message: 'Server error creating notification' });
  }
};

/**
 * GET /api/notification
 * Auth required — list notifications for this tenant/recipient
 */
exports.getNotifications = async (req, res) => {
  try {
    const isStudent = req.user && req.user.role === 'STUDENT';

    if (!memoryDb.isMongoConnected()) {
      const notifications = isStudent
        ? memoryDb.getNotifications(req.collegeId, { studentId: req.user.id })
        : memoryDb.getNotifications(req.collegeId);
      return res.json(notifications);
    }

    const query = { collegeId: req.collegeId };
    if (isStudent) {
      query.$or = [
        { studentId: req.user.id },
        { target: 'ALL' },
        { target: 'STUDENTS' }
      ];
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(notifications);
  } catch (error) {
    logger.error('Get notifications error:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving notifications' });
  }
};

/**
 * PATCH /api/notification/:id/read
 * Auth required — mark a single notification as read
 */
exports.markAsRead = async (req, res) => {
  try {
    const notificationId = req.params.id;
    const isStudent = req.user && req.user.role === 'STUDENT';

    if (!memoryDb.isMongoConnected()) {
      const notif = memoryDb.findNotificationById(notificationId);
      if (!notif || String(notif.collegeId) !== String(req.collegeId)) {
        return res.status(404).json({ success: false, message: 'Notification not found' });
      }

      // If student, ensure it belongs to them or is a broadcast
      if (isStudent && notif.studentId && String(notif.studentId) !== String(req.user.id)) {
        return res.status(404).json({ success: false, message: 'Notification not found' });
      }

      const updated = memoryDb.updateNotification(notif._id, {
        read: true,
        readAt: new Date()
      });

      return res.json({
        success: true,
        message: 'Notification marked as read',
        notification: updated
      });
    }

    const query = {
      _id: notificationId,
      collegeId: req.collegeId
    };

    if (isStudent) {
      query.$or = [
        { studentId: req.user.id },
        { target: 'ALL' },
        { target: 'STUDENTS' }
      ];
    }

    const notification = await Notification.findOne(query);

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    notification.read = true;
    notification.readAt = new Date();
    await notification.save();

    res.json({
      success: true,
      message: 'Notification marked as read',
      notification
    });
  } catch (error) {
    logger.error('Mark notification as read error:', error);
    res.status(500).json({ success: false, message: 'Server error updating notification' });
  }
};

/**
 * PATCH /api/notification/read-all
 * Auth required — mark all notifications as read for current student/user
 */
exports.markAllAsRead = async (req, res) => {
  try {
    const isStudent = req.user && req.user.role === 'STUDENT';

    if (!memoryDb.isMongoConnected()) {
      const studentId = isStudent ? req.user.id : null;
      const count = memoryDb.markAllNotificationsAsRead(req.collegeId, studentId);
      return res.json({
        success: true,
        message: 'All notifications marked as read',
        count
      });
    }

    const query = { collegeId: req.collegeId, read: false };
    if (isStudent) {
      query.$or = [
        { studentId: req.user.id },
        { target: 'ALL' },
        { target: 'STUDENTS' }
      ];
    }

    const result = await Notification.updateMany(query, {
      $set: {
        read: true,
        readAt: new Date(),
        updatedAt: new Date()
      }
    });

    res.json({
      success: true,
      message: 'All notifications marked as read',
      count: result.modifiedCount || 0
    });
  } catch (error) {
    logger.error('Mark all notifications as read error:', error);
    res.status(500).json({ success: false, message: 'Server error marking notifications as read' });
  }
};
