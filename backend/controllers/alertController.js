const Alert = require('../models/Alert');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');

/**
 * GET /api/admin/alerts
 * List all alerts for the college
 */
exports.getAlerts = async (req, res) => {
  try {
    const { active, target, type } = req.query;
    const query = { collegeId: req.collegeId };

    if (active !== undefined && active !== 'all') {
      query.active = active === 'true';
    }

    if (target && target !== 'ALL') {
      query.target = target.toUpperCase();
    }

    if (type && type !== 'ALL') {
      query.type = type.toUpperCase();
    }

    const alerts = await Alert.find(query)
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      count: alerts.length,
      alerts
    });
  } catch (error) {
    console.error('Admin getAlerts error:', error);
    res.status(500).json({ message: 'Server error retrieving alerts' });
  }
};

/**
 * POST /api/admin/alerts
 * Create a new campus alert / intervention broadcast
 */
exports.createAlert = async (req, res) => {
  try {
    const { title, message, type, priority, target, expiresAt } = req.body;

    if (!title || !message) {
      return res.status(400).json({ message: 'Title and message are required' });
    }

    const alert = new Alert({
      collegeId: req.collegeId,
      title: title.trim(),
      message: message.trim(),
      type: type || 'ANNOUNCEMENT',
      priority: priority || 'MEDIUM',
      target: target || 'ALL',
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      active: true
    });

    await alert.save();

    // Mirror to legacy Notification model for backward-compatibility with student mobile app
    try {
      await Notification.create({
        collegeId: req.collegeId,
        message: `${title}: ${message}`,
        target: target === 'STUDENTS' || target === 'UNPLACED' ? 'STUDENTS' : 'ALL'
      });
    } catch (notifErr) {
      console.warn('Could not mirror to legacy Notification:', notifErr.message);
    }

    // Audit log
    await AuditLog.create({
      collegeId: req.collegeId,
      action: 'CREATE_ALERT',
      actor: req.user.email || 'Admin',
      target: title
    }).catch(err => console.error('AuditLog error:', err));

    res.status(201).json({
      success: true,
      message: 'Alert created successfully',
      alert
    });
  } catch (error) {
    console.error('Admin createAlert error:', error);
    res.status(500).json({ message: 'Server error creating alert' });
  }
};

/**
 * PUT /api/admin/alerts/:id
 * Update an existing alert (e.g. toggle active or update text)
 */
exports.updateAlert = async (req, res) => {
  try {
    const alert = await Alert.findOne({
      _id: req.params.id,
      collegeId: req.collegeId
    });

    if (!alert) {
      return res.status(404).json({ message: 'Alert not found' });
    }

    const { title, message, type, priority, target, active, expiresAt } = req.body;

    if (title !== undefined) alert.title = title.trim();
    if (message !== undefined) alert.message = message.trim();
    if (type !== undefined) alert.type = type;
    if (priority !== undefined) alert.priority = priority;
    if (target !== undefined) alert.target = target;
    if (active !== undefined) alert.active = Boolean(active);
    if (expiresAt !== undefined) alert.expiresAt = expiresAt ? new Date(expiresAt) : null;

    await alert.save();

    res.json({
      success: true,
      message: 'Alert updated successfully',
      alert
    });
  } catch (error) {
    console.error('Admin updateAlert error:', error);
    res.status(500).json({ message: 'Server error updating alert' });
  }
};

/**
 * DELETE /api/admin/alerts/:id
 * Delete an alert
 */
exports.deleteAlert = async (req, res) => {
  try {
    const alert = await Alert.findOneAndDelete({
      _id: req.params.id,
      collegeId: req.collegeId
    });

    if (!alert) {
      return res.status(404).json({ message: 'Alert not found' });
    }

    await AuditLog.create({
      collegeId: req.collegeId,
      action: 'DELETE_ALERT',
      actor: req.user.email || 'Admin',
      target: alert.title
    }).catch(err => console.error('AuditLog error:', err));

    res.json({
      success: true,
      message: 'Alert deleted successfully'
    });
  } catch (error) {
    console.error('Admin deleteAlert error:', error);
    res.status(500).json({ message: 'Server error deleting alert' });
  }
};
