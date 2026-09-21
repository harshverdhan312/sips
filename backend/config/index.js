const path = require('path');
require('dotenv').config();

const config = {
  env: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',
  port: parseInt(process.env.PORT, 10) || 5000,
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/sips',
  jwtSecret: process.env.JWT_SECRET || 'sips-dev-secret-key-2025',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  uploadLimitBytes: 5 * 1024 * 1024, // 5MB
  uploadDir: path.resolve(__dirname, '..', process.env.UPLOAD_DIR || 'uploads'),
  mlServiceUrl: process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000',
  mlServiceTimeoutMs: parseInt(process.env.ML_SERVICE_TIMEOUT_MS, 10) || 5000,
  mlServiceApiKey: process.env.ML_SERVICE_API_KEY || ''
};

module.exports = config;
