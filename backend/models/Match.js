const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  jdId: { type: mongoose.Schema.Types.ObjectId, ref: 'JobDescription', required: true },
  score: { type: Number, required: true },
  matchedSkills: [{ type: String }],
  missingSkills: [{ type: String }],
  collegeId: { type: mongoose.Schema.Types.ObjectId, ref: 'College', required: true },
  createdAt: { type: Date, default: Date.now }
});

matchSchema.index({ jdId: 1, collegeId: 1 });
matchSchema.index({ studentId: 1, collegeId: 1 });
// Prevent duplicate matches
matchSchema.index({ studentId: 1, jdId: 1 }, { unique: true });

module.exports = mongoose.model('Match', matchSchema);
