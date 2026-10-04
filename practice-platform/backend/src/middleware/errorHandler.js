const config = require('../config');
const { error } = require('../utils/response');

module.exports = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  if (!config.isProduction && statusCode === 500) {
    console.error('Unhandled Error:', err);
  }

  return error(
    res,
    message,
    statusCode,
    config.isProduction ? null : err.errors || (err.stack ? { stack: err.stack } : null)
  );
};
