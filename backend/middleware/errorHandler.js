const config = require('../config');
const logger = require('../utils/logger');

/**
 * Centralized standardized error handling middleware
 */
module.exports = (err, req, res, next) => {
  logger.error('Error encountered:', {
    message: err.message,
    name: err.name,
    path: req.originalUrl,
    method: req.method,
    statusCode: err.statusCode
  });

  // Malformed JSON payload syntax error
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      message: 'Malformed JSON payload in request body.'
    });
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = err.errors ? Object.values(err.errors).map(e => e.message) : [err.message];
    return res.status(400).json({
      success: false,
      message: 'Validation error: Please check the entered information.',
      errors
    });
  }

  // Mongoose bad ObjectId / CastError
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid resource identifier provided.'
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const fields = Object.keys(err.keyValue || {});
    return res.status(409).json({
      success: false,
      message: `This information already exists (${fields.join(', ')}). Please use unique values.`
    });
  }

  // Multer upload errors
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size exceeds the allowed limit.'
      });
    }
    return res.status(400).json({
      success: false,
      message: `File upload error: ${err.message}`
    });
  }

  // File type filter errors (e.g., PDF check in multer)
  if (err.message && err.message.includes('Only PDF files are allowed')) {
    return res.status(400).json({
      success: false,
      message: 'Please upload a valid PDF resume.'
    });
  }

  // File type filter errors (e.g., Image check in multer)
  if (err.message && (err.message.includes('Only image files') || err.message.includes('image files (JPEG, PNG, WebP, GIF)'))) {
    return res.status(400).json({
      success: false,
      message: 'Please upload a valid image file (JPEG, PNG, WebP, GIF).'
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ success: false, message: 'Token expired' });
  }

  const statusCode = err.statusCode || 500;
  const userMessage = statusCode >= 500 && config.isProduction
    ? 'Something went wrong on the server. Please try again later.'
    : (err.message || 'Request failed');

  res.status(statusCode).json({
    success: false,
    message: userMessage
  });
};
