/**
 * High-Fidelity Local Placement Predictor
 * Runs the identical calibrated XGBoost + Isotonic Regression ensemble
 * locally in Node.js when the upstream FastAPI microservice is offline,
 * cold-starting, or rate-limited (HTTP 429).
 */

const path = require('path');
const logger = require('../utils/logger');

let artifact = null;

try {
  artifact = require('../models/ml/placementModelArtifact.json');
} catch (err) {
  logger.warn('Could not load placementModelArtifact.json:', { error: err.message });
}

const VALID_STREAMS = [
  'Civil',
  'Computer Science',
  'Electrical',
  'Electronics And Communication',
  'Information Technology',
  'Mechanical'
];

/**
 * Piecewise linear interpolation for isotonic calibration
 */
function interpolateIsotonic(val, isoX, isoY) {
  const n = isoX.length;
  if (n === 0) return val;
  if (val <= isoX[0]) return isoY[0];
  if (val >= isoX[n - 1]) return isoY[n - 1];

  let low = 0;
  let high = n - 1;
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if (isoX[mid] <= val) {
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  const i = Math.max(0, high);
  const nextI = Math.min(n - 1, i + 1);
  if (i === nextI || isoX[nextI] === isoX[i]) {
    return isoY[i];
  }

  const fraction = (val - isoX[i]) / (isoX[nextI] - isoX[i]);
  return isoY[i] + fraction * (isoY[nextI] - isoY[i]);
}

/**
 * Traverse a single decision tree in the ensemble
 */
function evaluateTree(tree, features) {
  let node = 0;
  while (tree.left[node] !== -1) {
    const featIdx = tree.split_feat[node];
    const threshold = tree.split_val[node];
    if (features[featIdx] < threshold) {
      node = tree.left[node];
    } else {
      node = tree.right[node];
    }
  }
  return tree.split_val[node];
}

/**
 * Predict placement likelihood given student profile features
 * Expected payload: { Age, Internships, CGPA, Hostel, HistoryOfBacklogs, Stream }
 */
function predictPlacement(payload = {}) {
  const required = ['Age', 'Internships', 'CGPA', 'Hostel', 'HistoryOfBacklogs', 'Stream'];
  const missing = required.filter(f => payload[f] === undefined || payload[f] === null);
  if (missing.length > 0) {
    throw new Error(`Missing required fields: ${missing.join(', ')}`);
  }

  const age = Number(payload.Age);
  const internships = Number(payload.Internships);
  const cgpa = Number(payload.CGPA);
  const hostel = Number(payload.Hostel);
  const backlogs = Number(payload.HistoryOfBacklogs);
  const stream = String(payload.Stream).trim();

  if (isNaN(age) || age < 18 || age > 35) {
    throw new Error('Age must be between 18 and 35.');
  }
  if (isNaN(internships) || internships < 0 || internships > 10) {
    throw new Error('Internships must be between 0 and 10.');
  }
  if (isNaN(cgpa) || cgpa < 0 || cgpa > 10) {
    throw new Error('CGPA must be between 0 and 10.');
  }
  if (hostel !== 0 && hostel !== 1) {
    throw new Error('Hostel must be 0 or 1.');
  }
  if (backlogs !== 0 && backlogs !== 1) {
    throw new Error('HistoryOfBacklogs must be 0 or 1.');
  }
  if (!VALID_STREAMS.includes(stream)) {
    throw new Error(`Invalid Stream: ${stream}. Must be one of: ${VALID_STREAMS.join(', ')}`);
  }

  const clampedAge = Math.min(Math.max(age, 19), 30);
  const clampedInternships = Math.min(Math.max(internships, 0), 3);
  const clampedCgpa = Math.min(Math.max(cgpa, 5.0), 9.0);

  // If artifact is not available, provide heuristic scoring as absolute safety net
  if (!artifact || !Array.isArray(artifact.classifiers) || artifact.classifiers.length === 0) {
    logger.warn('Placement model artifact not available, using heuristic fallback calculation.');
    // Heuristic base probability
    let score = 0.5;
    if (clampedCgpa >= 8.0) score += 0.35;
    else if (clampedCgpa >= 7.0) score += 0.15;
    else score -= 0.25;

    score += clampedInternships * 0.12;
    if (backlogs === 1) score -= 0.30;
    if (['Computer Science', 'Information Technology'].includes(stream)) score += 0.10;
    const prob = Math.min(Math.max(Number(score.toFixed(4)), 0.01), 0.99);
    const threshold = 0.50;
    const predictedClass = prob >= threshold ? 1 : 0;
    return {
      placement_probability: prob,
      decision_threshold: threshold,
      predicted_class: predictedClass,
      predicted_label: predictedClass === 1 ? 'placed' : 'not_placed',
      model_version: '1.0.0-heuristic',
      prediction: predictedClass,
      probability: prob,
      source: 'local_heuristic_fallback'
    };
  }

  // Construct feature vector (length 11):
  // [Age, Internships, CGPA, Hostel, HistoryOfBacklogs, Civil, CS, Elec, ECE, IT, Mech]
  const streamOneHot = VALID_STREAMS.map(s => (s === stream ? 1.0 : 0.0));
  const features = [
    clampedAge,
    clampedInternships,
    clampedCgpa,
    hostel,
    backlogs,
    ...streamOneHot
  ];

  const calibratedProbabilities = [];

  for (const clf of artifact.classifiers) {
    const baseScore = clf.base_score || 0.5;
    const initMargin = baseScore !== 0.5
      ? Math.log(baseScore / (1.0 - baseScore))
      : 0.0;

    let totalMargin = initMargin;
    for (const tree of clf.trees) {
      totalMargin += evaluateTree(tree, features);
    }

    const rawProb = 1.0 / (1.0 + Math.exp(-totalMargin));
    const calibratedProb = interpolateIsotonic(rawProb, clf.iso_x, clf.iso_y);
    calibratedProbabilities.push(calibratedProb);
  }

  const sum = calibratedProbabilities.reduce((acc, p) => acc + p, 0);
  const avgProb = sum / calibratedProbabilities.length;
  const placementProbability = Number(Math.min(Math.max(avgProb, 0.0), 1.0).toFixed(4));
  const decisionThreshold = artifact.decision_threshold || 0.50;
  const predictedClass = placementProbability >= decisionThreshold ? 1 : 0;
  const predictedLabel = predictedClass === 1 ? 'placed' : 'not_placed';

  return {
    placement_probability: placementProbability,
    decision_threshold: decisionThreshold,
    predicted_class: predictedClass,
    predicted_label: predictedLabel,
    model_version: artifact.model_version || '1.0.0',
    prediction: predictedClass,
    probability: placementProbability,
    source: 'local_calibrated_model'
  };
}

module.exports = {
  predictPlacement,
  VALID_STREAMS
};
