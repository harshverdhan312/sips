const mongoose = require('mongoose');

const collegeSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens only']
  },
  adminEmail: { type: String, required: true, unique: true, lowercase: true, trim: true },
  masterPasswordHash: { type: String, required: true },
  acceptedDomains: [{
    type: String,
    required: true,
    lowercase: true,
    trim: true
  }],
  logoUrl: { type: String, default: null },
  createdAt: { type: Date, default: Date.now }
});

// Ensure accepted domains are unique across all colleges
collegeSchema.index({ acceptedDomains: 1 });

module.exports = mongoose.model('College', collegeSchema);
