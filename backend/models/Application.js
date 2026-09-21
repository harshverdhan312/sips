const mongoose = require('mongoose');

const VALID_STATUSES = ['APPLIED', 'SHORTLISTED', 'REJECTED', 'SELECTED', 'WITHDRAWN'];

const ALLOWED_TRANSITIONS = {
  APPLIED: ['SHORTLISTED', 'REJECTED', 'WITHDRAWN', 'SELECTED'],
  SHORTLISTED: ['SELECTED', 'REJECTED', 'WITHDRAWN'],
  REJECTED: [],
  SELECTED: [],
  WITHDRAWN: []
};

const applicationSchema = new mongoose.Schema({
  collegeId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'College', 
    required: true,
    index: true 
  },
  studentId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Student', 
    required: true,
    index: true 
  },
  jobId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'JobDescription', 
    required: true,
    index: true 
  },
  status: {
    type: String,
    enum: VALID_STATUSES,
    default: 'APPLIED',
    index: true
  },
  appliedAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Enforce unique application per student per job per college
applicationSchema.index({ collegeId: 1, studentId: 1, jobId: 1 }, { unique: true });

// Secondary queries
applicationSchema.index({ collegeId: 1, studentId: 1, createdAt: -1 });
applicationSchema.index({ collegeId: 1, jobId: 1, status: 1 });

applicationSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

applicationSchema.statics.VALID_STATUSES = VALID_STATUSES;
applicationSchema.statics.ALLOWED_TRANSITIONS = ALLOWED_TRANSITIONS;

applicationSchema.statics.isValidTransition = function(currentStatus, nextStatus) {
  if (currentStatus === nextStatus) return true;
  const allowed = ALLOWED_TRANSITIONS[currentStatus] || [];
  return allowed.includes(nextStatus);
};

module.exports = mongoose.model('Application', applicationSchema);
