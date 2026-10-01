const AppError = require('../utils/appError');

/**
 * SIPS Placement Drive Eligibility Service
 * Provider-based client interface for checking placement drive eligibility with SIPS Core.
 * Decoupled from direct SIPS MongoDB database access.
 */

// Default mock provider for development and testing
const defaultMockProvider = {
  checkEligibility: async ({ studentId, collegeId, driveId }) => {
    // Deterministic mock rules for test flexibility
    if (studentId.includes('ineligible') || (driveId && driveId.includes('ineligible'))) {
      return {
        eligible: false,
        studentId,
        collegeId,
        driveId,
        reasons: [
          'Minimum CGPA required: 7.5. Your CGPA: 6.8',
          'Allowed branches: Computer Science & Engineering'
        ]
      };
    }

    if (studentId.includes('service_down') || (driveId && driveId.includes('service_down'))) {
      const err = new Error('SIPS Core eligibility service connection timeout');
      err.code = 'ECONNREFUSED';
      throw err;
    }

    return {
      eligible: true,
      studentId,
      collegeId,
      driveId,
      reasons: []
    };
  }
};

let activeProvider = defaultMockProvider;

/**
 * Check if a student is eligible for a SIPS placement drive
 * @param {object} params
 * @param {string} params.studentId
 * @param {string} params.collegeId
 * @param {string} params.driveId
 * @returns {Promise<{ eligible: boolean, studentId: string, collegeId: string, driveId: string, reasons?: string[] }>}
 */
async function checkDriveEligibility({ studentId, collegeId, driveId }) {
  if (!studentId || !collegeId || !driveId) {
    throw new AppError('studentId, collegeId, and driveId are required for eligibility check', 400);
  }

  try {
    const result = await activeProvider.checkEligibility({ studentId, collegeId, driveId });

    if (!result || typeof result.eligible !== 'boolean') {
      throw new Error('Malformed eligibility response from SIPS provider');
    }

    return {
      eligible: Boolean(result.eligible),
      studentId,
      collegeId,
      driveId,
      reasons: Array.isArray(result.reasons) ? result.reasons : []
    };
  } catch (err) {
    // If it's already an operational AppError, rethrow
    if (err.isOperational) {
      throw err;
    }

    // Fail closed: Service/network errors must be reported as 503 ELIGIBILITY_SERVICE_UNAVAILABLE
    throw new AppError(
      `SIPS eligibility verification service temporarily unavailable: ${err.message}`,
      503,
      { code: 'ELIGIBILITY_SERVICE_UNAVAILABLE' }
    );
  }
}

/**
 * Inject a custom mock provider (used extensively in test suites)
 */
function setMockProvider(provider) {
  if (!provider || typeof provider.checkEligibility !== 'function') {
    throw new Error('Eligibility provider must implement checkEligibility({ studentId, collegeId, driveId })');
  }
  activeProvider = provider;
}

/**
 * Reset mock provider to default
 */
function resetMockProvider() {
  activeProvider = defaultMockProvider;
}

module.exports = {
  checkDriveEligibility,
  setMockProvider,
  resetMockProvider
};
