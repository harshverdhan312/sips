const config = require('../config');
const AppError = require('../utils/appError');

/**
 * SIPS Placement Drive Eligibility Service
 * Provider-based client interface for checking placement drive eligibility with SIPS Core.
 * Decoupled from direct SIPS MongoDB database access.
 */

/**
 * Real HTTP provider calling SIPS Core server-to-server internal endpoint
 */
const httpEligibilityProvider = {
  checkEligibility: async ({ studentId, collegeId, driveId }) => {
    const baseUrl = config.sipsCoreBaseUrl || 'http://localhost:5000';
    const secret = config.sipsInternalApiSecret;
    const timeoutMs = config.sipsEligibilityTimeoutMs || 5000;

    const url = `${baseUrl.replace(/\/+$/, '')}/api/internal/placement-drives/${encodeURIComponent(driveId)}/eligibility`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Internal-Service-Secret': secret
        },
        body: JSON.stringify({
          studentId,
          collegeId
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      // Handle non-2xx status codes
      if (!response.ok) {
        let errData = {};
        try {
          errData = await response.json();
        } catch (_) {
          // Non-JSON error body
        }

        const msg = errData.message || `HTTP ${response.status} ${response.statusText}`;

        if (response.status === 401) {
          throw new AppError(`SIPS internal authentication failed: ${msg}`, 503, {
            code: 'ELIGIBILITY_AUTH_FAILED'
          });
        }

        if (response.status === 403) {
          throw new AppError(`SIPS college tenant mismatch: ${msg}`, 403, {
            code: 'TENANT_MISMATCH'
          });
        }

        if (response.status === 404) {
          throw new AppError(`Placement drive or student not found in SIPS: ${msg}`, 404, {
            code: 'RESOURCE_NOT_FOUND'
          });
        }

        if (response.status === 400) {
          throw new AppError(`Invalid eligibility request payload: ${msg}`, 400, {
            code: 'INVALID_ELIGIBILITY_REQUEST'
          });
        }

        throw new AppError(`SIPS Core returned error (${response.status}): ${msg}`, 503, {
          code: 'ELIGIBILITY_SERVICE_UNAVAILABLE'
        });
      }

      const data = await response.json();

      if (!data || typeof data.eligible !== 'boolean') {
        throw new AppError('Malformed eligibility response from SIPS Core API', 503, {
          code: 'ELIGIBILITY_MALFORMED_RESPONSE'
        });
      }

      return {
        eligible: Boolean(data.eligible),
        studentId,
        collegeId,
        driveId,
        reasons: Array.isArray(data.reasons) ? data.reasons : []
      };
    } catch (err) {
      clearTimeout(timeoutId);

      // If aborted due to timeout
      if (err.name === 'AbortError') {
        throw new AppError(
          `SIPS eligibility verification request timed out after ${timeoutMs}ms`,
          503,
          { code: 'ELIGIBILITY_SERVICE_UNAVAILABLE' }
        );
      }

      // If already operational AppError, rethrow
      if (err.isOperational) {
        throw err;
      }

      // Network / connection errors
      throw new AppError(
        `Failed to connect to SIPS Core eligibility service: ${err.message}`,
        503,
        { code: 'ELIGIBILITY_SERVICE_UNAVAILABLE' }
      );
    }
  },

  getDriveMetadata: async ({ driveId, collegeId }) => {
    const baseUrl = config.sipsCoreBaseUrl || 'http://localhost:5000';
    const secret = config.sipsInternalApiSecret;
    const timeoutMs = config.sipsEligibilityTimeoutMs || 5000;

    const qs = collegeId ? `?collegeId=${encodeURIComponent(collegeId)}` : '';
    const url = `${baseUrl.replace(/\/+$/, '')}/api/internal/placement-drives/${encodeURIComponent(driveId)}${qs}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'X-Internal-Service-Secret': secret
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errData = {};
        try {
          errData = await response.json();
        } catch (_) {}

        const msg = errData.message || `HTTP ${response.status} ${response.statusText}`;

        if (response.status === 401) {
          throw new AppError(`SIPS internal authentication failed: ${msg}`, 503, {
            code: 'ELIGIBILITY_AUTH_FAILED'
          });
        }

        if (response.status === 403) {
          throw new AppError(`SIPS college tenant mismatch: ${msg}`, 403, {
            code: 'TENANT_MISMATCH'
          });
        }

        if (response.status === 404) {
          throw new AppError(`Placement drive not found in SIPS: ${msg}`, 404, {
            code: 'RESOURCE_NOT_FOUND'
          });
        }

        throw new AppError(`SIPS Core returned error (${response.status}): ${msg}`, 503, {
          code: 'ELIGIBILITY_SERVICE_UNAVAILABLE'
        });
      }

      const data = await response.json();
      return data?.drive || data;
    } catch (err) {
      clearTimeout(timeoutId);

      if (err.name === 'AbortError') {
        throw new AppError(`SIPS drive metadata request timed out after ${timeoutMs}ms`, 503, {
          code: 'ELIGIBILITY_SERVICE_UNAVAILABLE'
        });
      }

      if (err.isOperational) {
        throw err;
      }

      throw new AppError(`Failed to connect to SIPS drive service: ${err.message}`, 503, {
        code: 'ELIGIBILITY_SERVICE_UNAVAILABLE'
      });
    }
  }
};

// Default mock provider for deterministic tests
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
  },

  getDriveMetadata: async ({ driveId, collegeId }) => {
    if (!driveId || driveId.includes('notfound') || driveId.includes('nonexistent')) {
      throw new AppError('Placement drive not found in SIPS', 404, { code: 'RESOURCE_NOT_FOUND' });
    }

    if (driveId.includes('cross_college') || driveId.includes('other_college')) {
      throw new AppError('SIPS college tenant mismatch: Drive belongs to another institution', 403, { code: 'TENANT_MISMATCH' });
    }

    if (driveId.includes('service_down')) {
      throw new AppError('SIPS drive service temporarily unavailable', 503, { code: 'ELIGIBILITY_SERVICE_UNAVAILABLE' });
    }

    // Default drive mock
    return {
      id: driveId,
      title: 'Google Campus Placement Drive 2026',
      role: 'Software Development Engineer',
      company: 'Google',
      collegeId: collegeId || 'mock-college-1',
      status: driveId.includes('closed') ? 'CLOSED' : (driveId.includes('upcoming') ? 'UPCOMING' : 'ACTIVE'),
      deadline: driveId.includes('expired') ? new Date(Date.now() - 86400000).toISOString() : new Date(Date.now() + 86400000).toISOString(),
      minCgpa: 7.5,
      allowedBranches: ['Computer Science & Engineering', 'Information Technology']
    };
  }
};

let activeProvider = config.isTest ? defaultMockProvider : httpEligibilityProvider;

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
 * Get SIPS Placement Drive metadata
 * @param {object} params
 * @param {string} params.driveId
 * @param {string} [params.collegeId]
 */
async function getDriveMetadata({ driveId, collegeId }) {
  if (!driveId) {
    throw new AppError('driveId is required for placement drive lookup', 400);
  }

  try {
    const drive = await activeProvider.getDriveMetadata({ driveId, collegeId });
    if (!drive) {
      throw new AppError('Placement drive not found in SIPS', 404);
    }
    return drive;
  } catch (err) {
    if (err.isOperational) {
      throw err;
    }

    throw new AppError(
      `SIPS drive verification service temporarily unavailable: ${err.message}`,
      503,
      { code: 'ELIGIBILITY_SERVICE_UNAVAILABLE' }
    );
  }
}

/**
 * Inject a custom mock provider (used in unit/integration tests)
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

/**
 * Switch to the live HTTP provider
 */
function useHttpProvider() {
  activeProvider = httpEligibilityProvider;
}

module.exports = {
  checkDriveEligibility,
  getDriveMetadata,
  setMockProvider,
  resetMockProvider,
  useHttpProvider,
  httpEligibilityProvider,
  defaultMockProvider
};

