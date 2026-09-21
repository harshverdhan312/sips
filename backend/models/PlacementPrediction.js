const mongoose = require('mongoose');

const placementPredictionSchema = new mongoose.Schema({
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
  placementProbability: {
    type: Number,
    required: true
  },
  decisionThreshold: {
    type: Number,
    default: 0.5
  },
  predictedClass: {
    type: Number,
    required: true,
    enum: [0, 1]
  },
  predictedLabel: {
    type: String,
    required: true
  },
  modelVersion: {
    type: String,
    default: '1.0.0'
  },
  inputSnapshot: {
    age: { type: Number, required: true },
    internships: { type: Number, required: true },
    cgpa: { type: Number, required: true },
    hostel: { type: Number, required: true },
    historyOfBacklogs: { type: Number, required: true },
    stream: { type: String, required: true }
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

// Compound index for fast latest-prediction retrieval by student
placementPredictionSchema.index({ studentId: 1, createdAt: -1 });
placementPredictionSchema.index({ collegeId: 1, createdAt: -1 });

module.exports = mongoose.model('PlacementPrediction', placementPredictionSchema);
