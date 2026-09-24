const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const studentSchema = new mongoose.Schema({
  collegeId: { type: mongoose.Schema.Types.ObjectId, ref: 'College', required: true },
  name: { type: String, required: true, trim: true },
  rollNo: { type: String, required: true, trim: true },
  usn: { type: String, trim: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  course: { type: String, trim: true, default: '' },
  branch: { type: String, trim: true, default: 'Computer Science & Engineering' },
  section: { type: String, trim: true, default: '' },
  batch: { type: String, trim: true, default: '' },
  cgpa: { type: Number, default: 0, min: 0, max: 10 },
  placementStatus: {
    type: String,
    enum: ['UNPLACED', 'PLACED', 'IN_PROCESS', 'OPTED_OUT'],
    default: 'UNPLACED'
  },
  companyPlaced: { type: String, trim: true, default: '' },
  packageOffered: { type: Number, default: 0 }, // in LPA
  readinessScore: { type: Number, default: 0, min: 0, max: 100 },
  technicalScore: { type: Number, default: 0, min: 0, max: 100 },
  softSkillScore: { type: Number, default: 0, min: 0, max: 100 },
  resumeScore: { type: Number, default: 0, min: 0, max: 100 },
  skills: [{ type: String, trim: true }],
  tags: [{ type: String, trim: true }],
  notes: { type: String, default: '' },
  github: { type: String, trim: true, default: '' },
  resumeUrl: { type: String, default: '' },
  profileImageUrl: { type: String, default: null },
  age: { type: Number, default: null },
  internships: { type: Number, default: null, min: 0 },
  hostel: { type: Boolean, default: null },
  historyOfBacklogs: { type: Number, default: null, min: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Compound unique index: email + college
studentSchema.index({ email: 1, collegeId: 1 }, { unique: true });
// Compound index for rollNo + college uniqueness
studentSchema.index({ rollNo: 1, collegeId: 1 }, { unique: true });
// Tenant query indexes
studentSchema.index({ collegeId: 1 });
studentSchema.index({ collegeId: 1, branch: 1 });
studentSchema.index({ collegeId: 1, placementStatus: 1 });
studentSchema.index({ collegeId: 1, batch: 1 });
studentSchema.index({ collegeId: 1, readinessScore: 1 });

studentSchema.methods.comparePassword = async function(password) {
  return bcrypt.compare(password, this.passwordHash);
};

studentSchema.pre('save', function(next) {
  if (!this.usn) {
    this.usn = this.rollNo;
  }
  // Auto-calculate readiness score if not manually set but component scores exist
  if (!this.readinessScore && (this.technicalScore || this.softSkillScore || this.resumeScore)) {
    this.readinessScore = Math.round(
      (this.technicalScore * 0.4) + (this.softSkillScore * 0.3) + (this.resumeScore * 0.3)
    );
  }
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Student', studentSchema);
