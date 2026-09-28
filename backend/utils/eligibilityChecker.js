const { mapBranchToStream } = require('./placementDataMapper');

/**
 * Check whether a student satisfies all explicit job eligibility restrictions.
 * Supported restrictions on JobDescription:
 * - minCgpa (Number)
 * - allowedBranches (Array of String)
 * - status (Must be ACTIVE)
 * - deadline (Date must not be past)
 * - collegeId (Must match student's college)
 *
 * @param {Object} student - Student record/object
 * @param {Object} job - JobDescription record/object
 * @returns {Array<string>} Array of failure reason messages. Empty if eligible.
 */
function checkJobEligibility(student, job) {
  const reasons = [];
  if (!job || !student) return ['Invalid job or student profile'];

  // 1. Minimum CGPA check
  if (typeof job.minCgpa === 'number' && job.minCgpa > 0) {
    const studentCgpa = typeof student.cgpa === 'number' ? student.cgpa : 0;
    if (studentCgpa < job.minCgpa) {
      reasons.push(`Minimum CGPA required: ${job.minCgpa}. Your CGPA: ${studentCgpa}`);
    }
  }

  // 2. Allowed Branches check
  if (Array.isArray(job.allowedBranches) && job.allowedBranches.length > 0) {
    const studentBranch = (student.branch || '').trim();
    const studentStream = mapBranchToStream(studentBranch);
    const studentBranchLower = studentBranch.toLowerCase();

    const isBranchAllowed = job.allowedBranches.some((b) => {
      if (!b || typeof b !== 'string') return false;
      const bTrimmed = b.trim();
      const bLower = bTrimmed.toLowerCase();

      // Exact branch match (case-insensitive)
      if (bLower === studentBranchLower) return true;

      // Stream-normalized match (e.g. "CSE" <-> "Computer Science & Engineering")
      const bStream = mapBranchToStream(bTrimmed);
      if (studentStream && bStream && studentStream === bStream) return true;

      // Substring inclusion (e.g. "Computer Science" in "Computer Science & Engineering")
      if (studentBranchLower && (studentBranchLower.includes(bLower) || bLower.includes(studentBranchLower))) {
        return true;
      }

      return false;
    });

    if (!isBranchAllowed) {
      if (job.allowedBranches.length === 1) {
        reasons.push(`Allowed branch: ${job.allowedBranches[0]}`);
      } else {
        reasons.push(`Allowed branches: ${job.allowedBranches.join(', ')}`);
      }
    }
  }

  // 3. Deadline check (the application date must not be passed)
  if (job.deadline) {
    const deadlineDate = new Date(job.deadline);
    if (!isNaN(deadlineDate.getTime())) {
      const now = new Date();
      const endOfDay = new Date(deadlineDate);
      if (typeof job.deadline === 'string' && job.deadline.length === 10) {
        endOfDay.setHours(23, 59, 59, 999);
      }
      if (endOfDay < now) {
        reasons.push('The application deadline for this job has passed');
      }
    }
  }

  // 4. Job status check (Must be ACTIVE)
  if (job.status && job.status.toUpperCase() === 'CLOSED') {
    reasons.push('This job posting is closed');
  } else if (job.status && job.status.toUpperCase() !== 'ACTIVE') {
    reasons.push(`This job posting is not active (status: ${job.status})`);
  }

  return reasons;
}

module.exports = {
  checkJobEligibility
};
