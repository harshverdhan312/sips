const Notification = require('../models/Notification');
const memoryDb = require('./memoryDb');
const logger = require('./logger');

/**
 * Safely create a notification with deduplication for application events
 * Non-blocking: Errors are caught and logged, never throwing into business handlers
 */
async function sendNotification({
  collegeId,
  studentId = null,
  title = '',
  message,
  type = 'ANNOUNCEMENT',
  target = 'ALL',
  applicationId = null,
  jobId = null
}) {
  if (!collegeId || !message) {
    logger.warn('Cannot send notification: collegeId and message are required');
    return null;
  }

  try {
    // ----------------------------------------------------
    // Resilient In-Memory Mode
    // ----------------------------------------------------
    if (!memoryDb.isMongoConnected()) {
      // Deterministic deduplication for application events
      if (applicationId && type) {
        const existing = memoryDb.notifications.find(n =>
          String(n.collegeId) === String(collegeId) &&
          String(n.applicationId) === String(applicationId) &&
          n.type === type
        );
        if (existing) {
          return existing;
        }
      }

      const notif = memoryDb.saveNotification({
        collegeId,
        studentId,
        title,
        message: message.trim(),
        type,
        target: studentId ? 'INDIVIDUAL' : target,
        applicationId,
        jobId,
        read: false,
        readAt: null,
        createdAt: new Date()
      });
      return notif;
    }

    // ----------------------------------------------------
    // MongoDB Mode
    // ----------------------------------------------------
    // Deduplication check for application lifecycle events
    if (applicationId && type) {
      const existing = await Notification.findOne({
        collegeId,
        applicationId,
        type
      });
      if (existing) {
        return existing;
      }
    }

    const notification = new Notification({
      collegeId,
      studentId,
      title: (title || '').trim(),
      message: message.trim(),
      type,
      target: studentId ? 'INDIVIDUAL' : target,
      applicationId,
      jobId,
      read: false,
      readAt: null
    });

    await notification.save();
    return notification;
  } catch (err) {
    logger.warn('Failed to persist notification:', err.message);
    return null;
  }
}

module.exports = {
  sendNotification
};
