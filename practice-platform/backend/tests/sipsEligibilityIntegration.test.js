const http = require('http');
const sipsApp = require('../../../backend/server');
const { httpEligibilityProvider, checkDriveEligibility, useHttpProvider, resetMockProvider } = require('../src/services/sipsEligibilityService');
const config = require('../src/config');
const JobDescription = require('../../../backend/models/JobDescription');
const Student = require('../../../backend/models/Student');

jest.mock('../../../backend/models/JobDescription');
jest.mock('../../../backend/models/Student');

const sipsConfig = require('../../../backend/config');

describe('End-to-End Live HTTP SIPS ↔ Practice Handshake', () => {
  let sipsServer;
  let sipsPort;
  const secret = 'sips-dev-internal-secret-2025';

  const collegeId = '507f1f77bcf86cd799439011';
  const driveId = '507f1f77bcf86cd799439044';
  const studentId = '507f1f77bcf86cd799439022';

  const mockDrive = {
    _id: driveId,
    collegeId,
    title: 'Senior Software Engineer',
    company: 'TechCorp',
    minCgpa: 7.0,
    allowedBranches: ['Computer Science & Engineering'],
    status: 'ACTIVE',
    deadline: new Date(Date.now() + 86400000)
  };

  const mockStudent = {
    _id: studentId,
    collegeId,
    name: 'Harsh Vardhan',
    branch: 'Computer Science & Engineering',
    cgpa: 8.9,
    placementStatus: 'UNPLACED',
    accountStatus: 'ACTIVE'
  };

  beforeAll((done) => {
    sipsConfig.internalApiSecret = secret;
    config.sipsInternalApiSecret = secret;

    // Start SIPS on dynamic ephemeral port
    sipsServer = http.createServer(sipsApp);
    sipsServer.listen(0, () => {
      sipsPort = sipsServer.address().port;
      config.sipsCoreBaseUrl = `http://127.0.0.1:${sipsPort}`;
      useHttpProvider();
      done();
    });
  });

  afterAll((done) => {
    resetMockProvider();
    if (sipsServer && sipsServer.listening) {
      sipsServer.close(done);
    } else {
      done();
    }
  });

  beforeEach(() => {
    jest.clearAllMocks();
    JobDescription.findById.mockResolvedValue({ ...mockDrive });
    Student.findById.mockResolvedValue({ ...mockStudent });
  });

  test('Practice calls live SIPS Core HTTP server and receives eligible decision', async () => {
    const result = await checkDriveEligibility({
      studentId,
      collegeId,
      driveId
    });

    expect(result.eligible).toBe(true);
    expect(result.reasons).toEqual([]);
    expect(result.studentId).toBe(studentId);
    expect(result.collegeId).toBe(collegeId);
    expect(result.driveId).toBe(driveId);
  });

  test('Practice calls live SIPS Core HTTP server and receives ineligible decision when student CGPA is low', async () => {
    Student.findById.mockResolvedValue({
      ...mockStudent,
      cgpa: 6.2
    });

    const result = await checkDriveEligibility({
      studentId,
      collegeId,
      driveId
    });

    expect(result.eligible).toBe(false);
    expect(result.reasons.length).toBeGreaterThan(0);
    expect(result.reasons.some((r) => r.includes('CGPA'))).toBe(true);
  });
});
