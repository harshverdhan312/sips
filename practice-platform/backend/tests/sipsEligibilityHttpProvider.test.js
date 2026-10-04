const { httpEligibilityProvider, checkDriveEligibility, useHttpProvider, resetMockProvider, setMockProvider } = require('../src/services/sipsEligibilityService');
const config = require('../src/config');
const AppError = require('../src/utils/appError');

describe('SIPS Eligibility HTTP Provider & Handshake Tests', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    resetMockProvider();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    resetMockProvider();
  });

  describe('1. HTTP Provider Success & Ineligibility Handling', () => {
    test('eligible student returns { eligible: true, reasons: [] }', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          eligible: true,
          reasons: []
        })
      });

      const result = await httpEligibilityProvider.checkEligibility({
        studentId: 'student_123',
        collegeId: 'college_456',
        driveId: 'drive_789'
      });

      expect(result.eligible).toBe(true);
      expect(result.reasons).toEqual([]);
      expect(result.studentId).toBe('student_123');
      expect(result.collegeId).toBe('college_456');
      expect(result.driveId).toBe('drive_789');

      // Verify request arguments sent to SIPS Core
      expect(global.fetch).toHaveBeenCalledTimes(1);
      const [calledUrl, calledOptions] = global.fetch.mock.calls[0];
      expect(calledUrl).toContain('/api/internal/placement-drives/drive_789/eligibility');
      expect(calledOptions.method).toBe('POST');
      expect(calledOptions.headers['X-Internal-Service-Secret']).toBe(config.sipsInternalApiSecret);
      expect(JSON.parse(calledOptions.body)).toEqual({
        studentId: 'student_123',
        collegeId: 'college_456'
      });
    });

    test('ineligible student returns { eligible: false, reasons: [...] }', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          eligible: false,
          reasons: ['Minimum CGPA required: 8.0. Your CGPA: 7.2']
        })
      });

      const result = await httpEligibilityProvider.checkEligibility({
        studentId: 'student_123',
        collegeId: 'college_456',
        driveId: 'drive_789'
      });

      expect(result.eligible).toBe(false);
      expect(result.reasons).toEqual(['Minimum CGPA required: 8.0. Your CGPA: 7.2']);
    });
  });

  describe('2. Fail-Closed Error Handling', () => {
    test('SIPS 401 internal authentication failure throws 503', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({ success: false, message: 'Invalid or missing internal service secret' })
      });

      await expect(
        httpEligibilityProvider.checkEligibility({
          studentId: 'student_123',
          collegeId: 'college_456',
          driveId: 'drive_789'
        })
      ).rejects.toThrow(/internal authentication failed/i);
    });

    test('SIPS 403 tenant mismatch throws 403 AppError', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        json: async () => ({ success: false, message: 'Tenant college mismatch' })
      });

      await expect(
        httpEligibilityProvider.checkEligibility({
          studentId: 'student_123',
          collegeId: 'college_456',
          driveId: 'drive_789'
        })
      ).rejects.toThrow(/tenant mismatch/i);
    });

    test('SIPS 404 drive or student not found throws 404 AppError', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ success: false, message: 'Placement drive not found' })
      });

      await expect(
        httpEligibilityProvider.checkEligibility({
          studentId: 'student_123',
          collegeId: 'college_456',
          driveId: 'drive_789'
        })
      ).rejects.toThrow(/not found/i);
    });

    test('SIPS 500 server crash throws 503 ELIGIBILITY_SERVICE_UNAVAILABLE', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({ success: false, message: 'Database query error' })
      });

      await expect(
        httpEligibilityProvider.checkEligibility({
          studentId: 'student_123',
          collegeId: 'college_456',
          driveId: 'drive_789'
        })
      ).rejects.toThrow(/SIPS Core returned error/i);
    });

    test('malformed JSON response missing eligible boolean fails closed', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ status: 'success' }) // missing eligible: boolean
      });

      await expect(
        httpEligibilityProvider.checkEligibility({
          studentId: 'student_123',
          collegeId: 'college_456',
          driveId: 'drive_789'
        })
      ).rejects.toThrow(/malformed eligibility response/i);
    });

    test('timeout (AbortError) fails closed with 503 ELIGIBILITY_SERVICE_UNAVAILABLE', async () => {
      const abortErr = new Error('The operation was aborted');
      abortErr.name = 'AbortError';

      global.fetch = jest.fn().mockRejectedValue(abortErr);

      await expect(
        httpEligibilityProvider.checkEligibility({
          studentId: 'student_123',
          collegeId: 'college_456',
          driveId: 'drive_789'
        })
      ).rejects.toThrow(/timed out/i);
    });

    test('network connection failure (ECONNREFUSED) fails closed with 503', async () => {
      const netErr = new Error('connect ECONNREFUSED 127.0.0.1:5000');
      netErr.code = 'ECONNREFUSED';

      global.fetch = jest.fn().mockRejectedValue(netErr);

      await expect(
        httpEligibilityProvider.checkEligibility({
          studentId: 'student_123',
          collegeId: 'college_456',
          driveId: 'drive_789'
        })
      ).rejects.toThrow(/Failed to connect to SIPS Core eligibility service/i);
    });
  });

  describe('3. Service Wrapper with Active Provider Switching', () => {
    test('checkDriveEligibility validates required arguments before calling provider', async () => {
      await expect(
        checkDriveEligibility({ studentId: '', collegeId: 'c1', driveId: 'd1' })
      ).rejects.toThrow(/studentId, collegeId, and driveId are required/i);

      await expect(
        checkDriveEligibility({ studentId: 's1', collegeId: '', driveId: 'd1' })
      ).rejects.toThrow(/studentId, collegeId, and driveId are required/i);

      await expect(
        checkDriveEligibility({ studentId: 's1', collegeId: 'c1', driveId: '' })
      ).rejects.toThrow(/studentId, collegeId, and driveId are required/i);
    });

    test('useHttpProvider delegates checkDriveEligibility to HTTP provider', async () => {
      useHttpProvider();

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          eligible: true,
          reasons: []
        })
      });

      const res = await checkDriveEligibility({
        studentId: 'student_abc',
        collegeId: 'college_xyz',
        driveId: 'drive_123'
      });

      expect(res.eligible).toBe(true);
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });
});
