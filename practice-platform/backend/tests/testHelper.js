const jwt = require('jsonwebtoken');
const config = require('../src/config');

/**
 * Safety Guard: Verifies that the target database is strictly a dedicated test database
 * and never the development or production database (e.g. sips_practice).
 */
function verifyTestDatabaseTarget(databaseUrl) {
  const url = (databaseUrl !== undefined && databaseUrl !== null)
    ? String(databaseUrl).trim()
    : (process.env.DATABASE_URL || config.databaseUrl || '').trim();
  if (!url) {
    throw new Error('[SAFETY GUARD] cleanDatabase aborted: DATABASE_URL is not set.');
  }

  let dbName = '';
  try {
    const parsed = new URL(url.replace(/^postgresql:\/\//, 'http://').replace(/^postgres:\/\//, 'http://'));
    dbName = parsed.pathname.replace(/^\//, '');
  } catch (e) {
    const match = url.match(/\/([^/?#]+)(?:\?|$)/);
    if (match) dbName = match[1];
  }

  if (!dbName) {
    throw new Error('[SAFETY GUARD] cleanDatabase aborted: Unable to parse database name from DATABASE_URL.');
  }

  // Strictly block if database is sips_practice (the dev database) or does not match test database naming convention
  if (dbName === 'sips_practice' || (!dbName.endsWith('_test') && dbName !== 'sips_practice_test')) {
    throw new Error(
      `[SAFETY GUARD] CRITICAL: cleanDatabase refused to execute against database "${dbName}". Destructive cleanup operations are only permitted on dedicated test databases (e.g. sips_practice_test).`
    );
  }

  return true;
}

async function cleanDatabase(prisma) {
  // Enforce safety guard before any destructive deletes
  verifyTestDatabaseTarget(process.env.DATABASE_URL);

  await prisma.codeSubmissionTestResult.deleteMany({});
  await prisma.codeSubmission.deleteMany({});
  await prisma.assessmentResponse.deleteMany({});
  await prisma.assessmentAttempt.deleteMany({});
  await prisma.questionResponse.deleteMany({});
  await prisma.contestAttempt.deleteMany({});
  await prisma.contestQuestion.deleteMany({});
  await prisma.contest.deleteMany({});
  await prisma.practiceAttempt.deleteMany({});
  await prisma.assessmentQuestion.deleteMany({});
  await prisma.assessment.deleteMany({});
  await prisma.codingTestCase.deleteMany({});
  await prisma.codingProblem.deleteMany({});
  await prisma.questionVersion.deleteMany({});
  await prisma.practiceQuestion.deleteMany({});
}

function createTestToken(payload = {}, options = {}) {
  const defaultPayload = {
    id: 'student_harsh_001',
    role: 'STUDENT',
    collegeId: 'college_rvce_01',
    collegeSlug: 'rvce'
  };
  return jwt.sign(
    { ...defaultPayload, ...payload },
    options.secret || config.jwtSecret,
    { expiresIn: options.expiresIn || '1h', algorithm: 'HS256' }
  );
}

module.exports = {
  verifyTestDatabaseTarget,
  cleanDatabase,
  createTestToken
};

