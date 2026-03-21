const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const studentSchema = new mongoose.Schema({
  collegeId: { type: mongoose.Schema.Types.ObjectId, ref: 'College', required: true },
  name: { type: String, required: true, trim: true },
  rollNo: { type: String, required: true, trim: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  skills: [{ type: String, trim: true }],
  github: { type: String, trim: true, default: '' },
  resumeUrl: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Compound unique index: email + college
studentSchema.index({ email: 1, collegeId: 1 }, { unique: true });
// Index for quick lookups by college
studentSchema.index({ collegeId: 1 });

studentSchema.methods.comparePassword = async function(password) {
  return bcrypt.compare(password, this.passwordHash);
};

studentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Student', studentSchema);
