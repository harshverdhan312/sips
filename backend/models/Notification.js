const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  collegeId: { type: mongoose.Schema.Types.ObjectId, ref: 'College', required: true },
  message: { type: String, required: true },
  target: { type: String, enum: ['ALL', 'STUDENTS'], default: 'ALL' },
  createdAt: { type: Date, default: Date.now }
});

notificationSchema.index({ collegeId: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
