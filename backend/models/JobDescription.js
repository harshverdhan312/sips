const mongoose = require('mongoose');

const jobDescriptionSchema = new mongoose.Schema({
  collegeId: { type: mongoose.Schema.Types.ObjectId, ref: 'College', required: true },
  title: { type: String, required: true, trim: true },
  role: { type: String, trim: true, default: '' },
  company: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  department: { type: String, trim: true, default: 'Engineering' },
  location: { type: String, trim: true, default: 'Flexible / Campus' },
  ctc: { type: String, trim: true, default: '' },
  ctcValue: { type: Number, default: 0 }, // In LPA, e.g. 14.5
  type: {
    type: String,
    enum: ['Full-time', 'Internship', 'Contract'],
    default: 'Full-time'
  },
  deadline: { type: Date },
  driveDate: { type: Date },
  minCgpa: { type: Number, default: 0 },
  allowedBranches: [{ type: String, trim: true }],
  status: {
    type: String,
    enum: ['ACTIVE', 'CLOSED', 'UPCOMING'],
    default: 'ACTIVE'
  },
  batchEligibleCount: { type: Number, default: 0 },
  batchMatchedCount: { type: Number, default: 0 },
  rawText: { type: String, default: '' },
  requiredSkills: [{ type: String, trim: true }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

jobDescriptionSchema.index({ collegeId: 1 });
jobDescriptionSchema.index({ collegeId: 1, status: 1 });
jobDescriptionSchema.index({ collegeId: 1, createdAt: -1 });

jobDescriptionSchema.pre('save', function(next) {
  if (!this.role) {
    this.role = this.title;
  }
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('JobDescription', jobDescriptionSchema);
