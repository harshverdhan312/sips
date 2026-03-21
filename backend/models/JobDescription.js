const mongoose = require('mongoose');

const jobDescriptionSchema = new mongoose.Schema({
  collegeId: { type: mongoose.Schema.Types.ObjectId, ref: 'College', required: true },
  title: { type: String, required: true, trim: true },
  company: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  rawText: { type: String, default: '' },
  requiredSkills: [{ type: String, trim: true }],
  createdAt: { type: Date, default: Date.now }
});

jobDescriptionSchema.index({ collegeId: 1 });

module.exports = mongoose.model('JobDescription', jobDescriptionSchema);
