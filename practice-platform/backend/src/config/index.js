const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

if (process.env.NODE_ENV === 'test') {
  const testEnvPath = path.resolve(__dirname, '../../.env.test');
  if (fs.existsSync(testEnvPath)) {
    dotenv.config({ path: testEnvPath, override: true });
  } else {
    dotenv.config();
  }
} else {
  dotenv.config();
}

function parseCorsOrigins(raw) {
  const defaults = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:3000',
    'https://sips-six.vercel.app'
  ];
  if (!raw) {
    return defaults;
  }
  if (raw === '*') {
    return true;
  }
  const origins = raw.includes(',')
    ? raw.split(',').map((o) => o.trim()).filter(Boolean)
    : [raw.trim()];
  for (const def of defaults) {
    if (!origins.includes(def)) {
      origins.push(def);
    }
  }
  return origins;
}

const config = {
  env: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',
  port: parseInt(process.env.PORT, 10) || 5050,
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/sips_practice?schema=public',
  jwtSecret: process.env.JWT_SECRET || 'sips-dev-secret-key-2025',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  corsOrigin: parseCorsOrigins(process.env.CORS_ORIGIN),

  // Judge0 Sandbox Configuration
  judge0BaseUrl: process.env.JUDGE0_BASE_URL || 'http://localhost:2358',
  judge0ApiKey: process.env.JUDGE0_API_KEY || '',
  judge0ApiHost: process.env.JUDGE0_API_HOST || '',
  executionPollIntervalMs: parseInt(process.env.EXECUTION_POLL_INTERVAL_MS, 10) || 500,
  executionPollMaxRetries: parseInt(process.env.EXECUTION_POLL_MAX_RETRIES, 10) || 20,

  // SIPS Core Integration Configuration (Server-to-server eligibility handshake)
  sipsCoreBaseUrl: process.env.SIPS_CORE_BASE_URL || 'http://localhost:5000',
  sipsInternalApiSecret: process.env.SIPS_INTERNAL_API_SECRET || 'sips-dev-internal-secret-2025',
  sipsEligibilityTimeoutMs: parseInt(process.env.SIPS_ELIGIBILITY_TIMEOUT_MS, 10) || 5000,

  // Global Hard Resource Limits
  limits: {
    maxSourceCodeSizeKb: 64,
    maxExecutionTimeMs: 10000,
    maxMemoryLimitKb: 512000,
    maxOutputSizeKb: 64
  }
};

module.exports = config;
