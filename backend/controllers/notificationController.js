const Notification = require('../models/Notification');

/**
 * POST /api/notification
 * Admin-only — create a notification for the college
 */
exports.createNotification = async (req, res) => {
  try {
    const { message, target } = req.body;

    if (!message) {
      return res.status(400).json({ message: 'Notification message is required' });
    }

    const notification = new Notification({
      collegeId: req.collegeId,
      message: message.trim(),
      target: target || 'ALL'
    });

    await notification.save();
    res.status(201).json({ message: 'Notification created', notification });
  } catch (error) {
    console.error('Create notification error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * GET /api/notification
 * Auth required — list notifications for this college
 */
exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ collegeId: req.collegeId })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(notifications);
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
