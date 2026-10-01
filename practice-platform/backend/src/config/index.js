const dotenv = require('dotenv');

dotenv.config();

const config = {
  env: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',
  port: parseInt(process.env.PORT, 10) || 5050,
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/sips_practice?schema=public',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5174',

  // Judge0 Sandbox Configuration
  judge0BaseUrl: process.env.JUDGE0_BASE_URL || 'http://localhost:2358',
  judge0ApiKey: process.env.JUDGE0_API_KEY || '',
  judge0ApiHost: process.env.JUDGE0_API_HOST || '',
  executionPollIntervalMs: parseInt(process.env.EXECUTION_POLL_INTERVAL_MS, 10) || 500,
  executionPollMaxRetries: parseInt(process.env.EXECUTION_POLL_MAX_RETRIES, 10) || 20,

  // Global Hard Resource Limits
  limits: {
    maxSourceCodeSizeKb: 64,
    maxExecutionTimeMs: 10000,
    maxMemoryLimitKb: 512000,
    maxOutputSizeKb: 64
  }
};

module.exports = config;
