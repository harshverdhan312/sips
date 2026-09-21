/**
 * Placement Model Data Mapper & Stream Normalization Layer
 * Provides deterministic mapping of Student profile data to FastAPI Placement Prediction input contract.
 */

const VALID_STREAMS = new Set([
  'Civil',
  'Computer Science',
  'Electrical',
  'Electronics And Communication',
  'Information Technology',
  'Mechanical'
]);

const BRANCH_TO_STREAM_MAP = {
  'computer science & engineering': 'Computer Science',
  'computer science and engineering': 'Computer Science',
  'computer science': 'Computer Science',
  'cse': 'Computer Science',
  'information technology': 'Information Technology',
  'it': 'Information Technology',
  'electronics and communication': 'Electronics And Communication',
  'electronics & communication': 'Electronics And Communication',
  'electronics and communication engineering': 'Electronics And Communication',
  'electronics & communication engineering': 'Electronics And Communication',
  'ece': 'Electronics And Communication',
  'mechanical': 'Mechanical',
  'mechanical engineering': 'Mechanical',
  'mech': 'Mechanical',
  'civil': 'Civil',
  'civil engineering': 'Civil',
  'electrical': 'Electrical',
  'electrical engineering': 'Electrical',
  'electrical & electronics engineering': 'Electrical',
  'electrical and electronics engineering': 'Electrical',
  'eee': 'Electrical'
};

/**
 * Deterministically map a student's branch string to the canonical Stream enum expected by ML model.
 * Returns null if the branch cannot be safely and accurately mapped (no fabrication).
 */
function mapBranchToStream(branch) {
  if (!branch || typeof branch !== 'string') return null;
  const normalized = branch.trim().toLowerCase();
  const mapped = BRANCH_TO_STREAM_MAP[normalized];
  if (mapped && VALID_STREAMS.has(mapped)) {
    return mapped;
  }
  return null;
}

/**
 * Transform a Student model/document into the exact payload expected by FastAPI POST /placement/predict
 * Returns { isComplete: boolean, missingFields: string[], payload: object | null }
 * NEVER fabricates missing values or derives synthetic defaults.
 */
function mapStudentToPlacementInput(student) {
  if (!student || typeof student !== 'object') {
    return {
      isComplete: false,
      missingFields: ['Age', 'Internships', 'CGPA', 'Hostel', 'HistoryOfBacklogs', 'Stream'],
      payload: null
    };
  }

  const missingFields = [];

  // 1. Age (integer, 19-30)
  let age = null;
  if (typeof student.age === 'number' && Number.isInteger(student.age)) {
    age = student.age;
  } else {
    missingFields.push('Age');
  }

  // 2. Internships (integer, 0-3)
  let internships = null;
  if (typeof student.internships === 'number' && Number.isInteger(student.internships) && student.internships >= 0) {
    internships = student.internships;
  } else {
    missingFields.push('Internships');
  }

  // 3. CGPA (float/number, 5.0 - 9.0)
  let cgpa = null;
  if (typeof student.cgpa === 'number' && !isNaN(student.cgpa) && student.cgpa > 0) {
    cgpa = Number(student.cgpa.toFixed(2));
  } else {
    missingFields.push('CGPA');
  }

  // 4. Hostel (boolean in Node -> 0 or 1 in ML model)
  let hostel = null;
  if (student.hostel === true) {
    hostel = 1;
  } else if (student.hostel === false) {
    hostel = 0;
  } else {
    missingFields.push('Hostel');
  }

  // 5. HistoryOfBacklogs (integer in Node -> 0 or 1 in ML model)
  let historyOfBacklogs = null;
  if (typeof student.historyOfBacklogs === 'number' && Number.isInteger(student.historyOfBacklogs) && student.historyOfBacklogs >= 0) {
    historyOfBacklogs = student.historyOfBacklogs > 0 ? 1 : 0;
  } else {
    missingFields.push('HistoryOfBacklogs');
  }

  // 6. Stream (mapped from student.branch)
  const stream = mapBranchToStream(student.branch);
  if (!stream) {
    missingFields.push('Stream');
  }

  const isComplete = missingFields.length === 0;

  return {
    isComplete,
    missingFields,
    payload: isComplete
      ? {
          Age: age,
          Internships: internships,
          CGPA: cgpa,
          Hostel: hostel,
          HistoryOfBacklogs: historyOfBacklogs,
          Stream: stream
        }
      : null
  };
}

module.exports = {
  VALID_STREAMS,
  BRANCH_TO_STREAM_MAP,
  mapBranchToStream,
  mapStudentToPlacementInput
};
