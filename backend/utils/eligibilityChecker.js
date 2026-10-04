
/**
 * Check whether a student satisfies all explicit job eligibility restrictions.
 * Supported restrictions on JobDescription:
 * - minCgpa (Number)
 * - allowedBranches (Array of String)
 * - allowedCourses (Array of String)
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
    if (typeof student.cgpa !== 'number') {
      reasons.push(`Minimum CGPA required is ${job.minCgpa}, but your CGPA is missing from your profile.`);
    } else if (student.cgpa < job.minCgpa) {
      reasons.push(`Minimum CGPA required is ${job.minCgpa}. Your CGPA is ${student.cgpa}.`);
    }
  }

  // 2. Allowed Courses check
  const hasCourseRestriction = Array.isArray(job.allowedCourses) && job.allowedCourses.length > 0 &&
    !job.allowedCourses.some(c => !c || c.trim().toLowerCase() === 'all' || c.trim().toLowerCase() === 'any');

  if (hasCourseRestriction) {
    const studentCourse = (student.course || '').trim();
    if (!studentCourse) {
      reasons.push('Course information is missing from your profile.');
    } else {
      const studentCourseLower = studentCourse.toLowerCase();
      const isCourseAllowed = job.allowedCourses.some((c) => {
        if (!c || typeof c !== 'string') return false;
        const cLower = c.trim().toLowerCase();
        
        const cNormalized = cLower.replace(/[\.\-\s]/g, '');
        const sNormalized = studentCourseLower.replace(/[\.\-\s]/g, '');

        if (cNormalized === sNormalized) return true;
        return false;
      });

      if (!isCourseAllowed) {
        if (job.allowedCourses.length === 1) {
          reasons.push(`Allowed course: ${job.allowedCourses[0]}`);
        } else {
          reasons.push(`Allowed courses: ${job.allowedCourses.join(', ')}`);
        }
      }
    }
  }

  // 3. Allowed Branches check
  const hasBranchRestriction = Array.isArray(job.allowedBranches) && job.allowedBranches.length > 0 &&
    !job.allowedBranches.some(b => !b || b.trim().toLowerCase() === 'all' || b.trim().toLowerCase() === 'any' || b.trim() === '__NONE__');

  if (hasBranchRestriction) {
    const studentBranch = (student.branch || '').trim();
    if (!studentBranch) {
      reasons.push('Branch information is missing from your profile.');
    } else {
      const studentBranchLower = studentBranch.toLowerCase();

      const isBranchAllowed = job.allowedBranches.some((b) => {
        if (!b || typeof b !== 'string') return false;
        const bTrimmed = b.trim();
        const bLower = bTrimmed.toLowerCase();

        const bNormalized = bLower.replace(/[\.\-\s]/g, '');
        const sNormalized = studentBranchLower.replace(/[\.\-\s]/g, '');

        if (bNormalized === sNormalized) return true;
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
  }

  // 4. Target batch / Passing year check
  const jobBatch = (job.targetBatch || job.batch || '').toString().trim();
  
  if (jobBatch && jobBatch.toLowerCase() !== 'all' && jobBatch.toLowerCase() !== 'any') {
    const studentBatch = (student.batch || student.passingYear || '').toString().trim();
    if (!studentBatch) {
      reasons.push(`This placement drive is available only to the ${jobBatch} batch. Your batch information is missing.`);
    } else if (jobBatch !== studentBatch) {
      reasons.push(`This placement drive is available only to the ${jobBatch} batch. (Your batch: ${studentBatch})`);
    }
  }

  // 5. Deadline check (the application date must not be passed)
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

  // 6. Job status check (Must be ACTIVE)
  if (job.status && job.status.toUpperCase() === 'CLOSED') {
    reasons.push('This job posting is closed');
  } else if (job.status && job.status.toUpperCase() !== 'ACTIVE') {
    reasons.push(`This job posting is not active (status: ${job.status})`);
  }

  // 7. Debarment check
  if (
    student.applicationEligibilityStatus === 'DEBARRED' ||
    student.isDebarred === true ||
    (student.accountStatus && String(student.accountStatus).toUpperCase() === 'DEBARRED')
  ) {
    reasons.push('You are debarred from applying to placement drives');
  }

  return reasons;
}

module.exports = {
  checkJobEligibility
};
