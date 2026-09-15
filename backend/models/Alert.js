const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  collegeId: { type: mongoose.Schema.Types.ObjectId, ref: 'College', required: true },
  title: { type: String, required: true, trim: true },
  message: { type: String, required: true, trim: true },
  type: {
    type: String,
    enum: ['DRIVE', 'DEADLINE', 'ANNOUNCEMENT', 'SKILL_GAP', 'INTERVENTION'],
    default: 'ANNOUNCEMENT'
  },
  priority: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    default: 'MEDIUM'
  },
  target: {
    type: String,
    enum: ['ALL', 'STUDENTS', 'UNPLACED', 'PLACED'],
    default: 'ALL'
  },
  active: { type: Boolean, default: true },
  expiresAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

alertSchema.index({ collegeId: 1, active: 1, createdAt: -1 });

alertSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Alert', alertSchema);
