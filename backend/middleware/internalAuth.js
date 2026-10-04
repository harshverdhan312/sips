const config = require('../config');
const logger = require('../utils/logger');

/**
 * Internal Service Authentication Middleware
 * Validates server-to-server requests using X-Internal-Service-Secret header.
 */
module.exports = function internalAuth(req, res, next) {
  const incomingSecret = req.headers['x-internal-service-secret'];
  const configuredSecret = config.internalApiSecret;

  if (!configuredSecret) {
    logger.error('Internal API secret is not configured in environment (SIPS_INTERNAL_API_SECRET)');
    return res.status(500).json({
      success: false,
      message: 'Internal service authentication is not properly configured'
    });
  }

  if (!incomingSecret || incomingSecret !== configuredSecret) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or missing internal service secret'
    });
  }

  next();
};
