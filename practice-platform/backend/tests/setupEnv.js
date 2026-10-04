const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

process.env.NODE_ENV = 'test';

const testEnvPath = path.resolve(__dirname, '../.env.test');
if (fs.existsSync(testEnvPath)) {
  dotenv.config({ path: testEnvPath, override: true });
} else {
  process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/sips_practice_test?schema=public';
}
