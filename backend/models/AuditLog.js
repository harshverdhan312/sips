const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  collegeId: { type: mongoose.Schema.Types.ObjectId, ref: 'College', required: true },
  action: { type: String, required: true, trim: true },
  actor: { type: String, required: true, trim: true },
  target: { type: String, default: '', trim: true },
  details: { type: mongoose.Schema.Types.Mixed },
  timestamp: { type: Date, default: Date.now }
});

auditLogSchema.index({ collegeId: 1, timestamp: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
