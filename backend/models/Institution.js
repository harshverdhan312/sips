const mongoose = require('mongoose');

const institutionSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens only'],
    default: function() {
      const raw = this.name || this.code || this.mainAdmin?.username || `inst-${Date.now()}`;
      return raw.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || `inst-${Date.now()}`;
    }
  },
  code: { type: String, trim: true, default: '' },
  officialEmail: { type: String, required: true, unique: true, lowercase: true, trim: true },
  address: { type: String, trim: true, default: '' },
  city: { type: String, trim: true, default: '' },
  state: { type: String, trim: true, default: '' },
  country: { type: String, trim: true, default: 'India' },
  website: { type: String, trim: true, default: '' },
  phone: { type: String, trim: true, default: '' },
  logoUrl: { type: String, default: null },
  acceptedDomains: [{
    type: String,
    lowercase: true,
    trim: true
  }],
  mainAdmin: {
    name: { type: String, trim: true, default: '' },
    username: { type: String, required: true, lowercase: true, trim: true },
    email: { type: String, lowercase: true, trim: true },
    passwordHash: { type: String, required: true }
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'INACTIVE'],
    default: 'ACTIVE'
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

institutionSchema.pre('validate', function(next) {
  if (!this.slug) {
    const raw = this.name || this.code || this.mainAdmin?.username || `inst-${Date.now()}`;
    this.slug = raw.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || `inst-${Date.now()}`;
  }
  next();
});

institutionSchema.index({ 'mainAdmin.username': 1 });

module.exports = mongoose.model('Institution', institutionSchema);
