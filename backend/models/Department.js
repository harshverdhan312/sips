const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
  institutionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: true,
    index: true
  },
  name: { type: String, required: true, trim: true },
  code: { type: String, trim: true, default: '' },
  username: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^[a-z0-9_.-]+$/, 'Username must be lowercase alphanumeric, underscore, dot, or hyphen']
  },
  passwordHash: { type: String, required: true },
  programs: [{
    name: { type: String, required: true, trim: true },
    branches: [{ type: String, trim: true }]
  }],
  description: { type: String, trim: true, default: '' },
  contactEmail: { type: String, lowercase: true, trim: true, default: '' },
  contactPhone: { type: String, trim: true, default: '' },
  status: {
    type: String,
    enum: ['ACTIVE', 'INACTIVE'],
    default: 'ACTIVE'
  },
  isMergedGroup: { type: Boolean, default: false },
  subDepartmentIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department'
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

departmentSchema.index({ institutionId: 1, name: 1 });

module.exports = mongoose.model('Department', departmentSchema);
