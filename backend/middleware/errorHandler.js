/**
 * Standardized error handling middleware
 */
module.exports = (err, req, res, next) => {
  console.error('Error encountered:', {
    message: err.message,
    name: err.name,
    path: req.originalUrl,
    method: req.method
  });

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      message: 'Validation error',
      errors
    });
  }

  // Mongoose bad ObjectId / CastError
  if (err.name === 'CastError') {
    return res.status(400).json({
      message: `Invalid ${err.path}: ${err.value}`
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const fields = Object.keys(err.keyValue || {});
    return res.status(409).json({
      message: `Duplicate field value: ${fields.join(', ')}. Please use unique values.`
    });
  }

  // Multer upload errors
  if (err.name === 'MulterError') {
    return res.status(400).json({
      message: `File upload error: ${err.message}`
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ message: 'Invalid token' });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ message: 'Token expired' });
  }

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    message: err.message || 'Internal server error'
  });
};
