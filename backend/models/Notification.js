const mongoose = require('mongoose');

const NOTIFICATION_TYPES = [
  'ANNOUNCEMENT',
  'APPLICATION_SUBMITTED',
  'APPLICATION_SHORTLISTED',
  'APPLICATION_REJECTED',
  'APPLICATION_SELECTED',
  'APPLICATION_WITHDRAWN',
  'SYSTEM',
  'JOB_ALERT'
];

const TARGET_TYPES = ['ALL', 'STUDENTS', 'INDIVIDUAL'];

const notificationSchema = new mongoose.Schema({
  collegeId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'College', 
    required: true,
    index: true 
  },
  studentId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Student', 
    default: null,
    index: true 
  },
  title: {
    type: String,
    trim: true,
    default: ''
  },
  message: { 
    type: String, 
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: NOTIFICATION_TYPES,
    default: 'ANNOUNCEMENT',
    index: true
  },
  target: { 
    type: String, 
    enum: TARGET_TYPES, 
    default: 'ALL',
    index: true 
  },
  applicationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Application',
    default: null
  },
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'JobDescription',
    default: null
  },
  read: {
    type: Boolean,
    default: false,
    index: true
  },
  readAt: {
    type: Date,
    default: null
  },
  createdAt: { 
    type: Date, 
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for fast querying
notificationSchema.index({ collegeId: 1, studentId: 1, createdAt: -1 });
notificationSchema.index({ collegeId: 1, target: 1, createdAt: -1 });
notificationSchema.index({ collegeId: 1, applicationId: 1, type: 1 });

notificationSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  if (this.isModified('read') && this.read && !this.readAt) {
    this.readAt = Date.now();
  }
  next();
});

notificationSchema.statics.NOTIFICATION_TYPES = NOTIFICATION_TYPES;
notificationSchema.statics.TARGET_TYPES = TARGET_TYPES;

module.exports = mongoose.model('Notification', notificationSchema);
