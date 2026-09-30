/**
 * Coding Platform Service
 * Coordinates platform adapters, in-memory caching, validation, and error normalization.
 */

const leetcodeAdapter = require('./leetcodeAdapter');
const codeforcesAdapter = require('./codeforcesAdapter');
const logger = require('../../utils/logger');

// Platform Registry
const ADAPTERS = {
  LEETCODE: leetcodeAdapter,
  CODEFORCES: codeforcesAdapter
};

// In-memory cache with 5-minute TTL to protect upstream rate limits
const profileCache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Get adapter instance for requested platform.
 * @param {string} platform 
 * @returns {Object} adapter instance
 */
function getAdapter(platform) {
  if (!platform || typeof platform !== 'string') {
    const err = new Error('Platform identifier is required.');
    err.statusCode = 400;
    throw err;
  }

  const key = platform.trim().toUpperCase();
  const adapter = ADAPTERS[key];
  if (!adapter) {
    const supported = Object.keys(ADAPTERS).join(', ');
    const err = new Error(`Unsupported coding platform '${platform}'. Supported platforms in V1 are: ${supported}`);
    err.statusCode = 400;
    throw err;
  }
  return adapter;
}

/**
 * Fetch and normalize coding profile stats with caching.
 * @param {string} platform - 'LEETCODE' | 'CODEFORCES'
 * @param {string} rawInput - handle or profile URL
 * @param {boolean} [bypassCache=false]
 * @returns {Promise<Object>} normalized profile data
 */
async function fetchPlatformProfile(platform, rawInput, bypassCache = false) {
  const adapter = getAdapter(platform);
  const normalizedUsername = adapter.normalizeUsername(rawInput);

  if (!normalizedUsername) {
    const err = new Error(`Invalid username or profile URL format for ${adapter.platform}.`);
    err.statusCode = 400;
    throw err;
  }

  const cacheKey = `${adapter.platform}:${normalizedUsername.toLowerCase()}`;
  const cached = profileCache.get(cacheKey);

  if (!bypassCache && cached && (Date.now() - cached.timestamp < CACHE_TTL_MS)) {
    return cached.data;
  }

  try {
    const result = await adapter.fetchProfile(normalizedUsername);

    // Cache successful response
    profileCache.set(cacheKey, {
      timestamp: Date.now(),
      data: result
    });

    return result;
  } catch (err) {
    // If upstream gave 429/502 and we have cached data, return cached with warning
    if ((err.statusCode === 429 || err.statusCode === 502) && cached && cached.data) {
      logger.warn(`Upstream ${adapter.platform} error (${err.message}), returning cached snapshot for ${normalizedUsername}`);
      return cached.data;
    }
    throw err;
  }
}

/**
 * Clears cache for a platform + handle or everything.
 */
function clearCache(platform = null, username = null) {
  if (platform && username) {
    profileCache.delete(`${platform.toUpperCase()}:${username.toLowerCase()}`);
  } else {
    profileCache.clear();
  }
}

module.exports = {
  ADAPTERS,
  getAdapter,
  fetchPlatformProfile,
  clearCache
};
