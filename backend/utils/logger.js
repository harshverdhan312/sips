const config = require('../config');

const SENSITIVE_KEYS = new Set([
  'password',
  'passwordhash',
  'masterpassword',
  'masterpasswordhash',
  'token',
  'authorization',
  'secret',
  'jwtsecret'
]);

function sanitize(data) {
  if (!data || typeof data !== 'object') return data;
  if (Array.isArray(data)) return data.map(sanitize);

  const clean = {};
  for (const [key, val] of Object.entries(data)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      clean[key] = '[REDACTED]';
    } else if (typeof val === 'object' && val !== null) {
      clean[key] = sanitize(val);
    } else {
      clean[key] = val;
    }
  }
  return clean;
}

const logger = {
  info: (...args) => {
    if (config.isTest) return;
    console.log(...args.map(a => (typeof a === 'object' ? sanitize(a) : a)));
  },
  warn: (...args) => {
    if (config.isTest) return;
    console.warn(...args.map(a => (typeof a === 'object' ? sanitize(a) : a)));
  },
  error: (...args) => {
    if (config.isTest) return;
    console.error(...args.map(a => (typeof a === 'object' ? sanitize(a) : a)));
  },
  sanitize
};

module.exports = logger;
