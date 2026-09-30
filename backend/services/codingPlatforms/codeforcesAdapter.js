/**
 * Codeforces Platform Adapter
 * Official REST API integration for Codeforces profile and competitive rating data.
 */

const CodingPlatformAdapter = require('./CodingPlatformAdapter');
const logger = require('../../utils/logger');

const REQUEST_TIMEOUT_MS = 8000;

class CodeforcesAdapter extends CodingPlatformAdapter {
  constructor() {
    super('CODEFORCES', 'OFFICIAL_API');
  }

  /**
   * Normalizes Codeforces username from raw string, handle, or URL.
   * e.g. "https://codeforces.com/profile/tourist", "@tourist", "tourist"
   * @param {string} input 
   * @returns {string} clean canonical username
   */
  normalizeUsername(input) {
    if (!input || typeof input !== 'string') return '';
    let cleaned = input.trim();
    // Strip trailing slashes
    cleaned = cleaned.replace(/\/+$/, '');
    // Strip protocol and domain
    cleaned = cleaned.replace(/^(https?:\/\/)?(www\.)?codeforces\.com\/profile\//i, '');
    cleaned = cleaned.replace(/^(https?:\/\/)?(www\.)?codeforces\.com\//i, '');
    // Strip leading @
    cleaned = cleaned.replace(/^@+/, '');
    // Strip query parameters or subpaths
    cleaned = cleaned.split('/')[0].split('?')[0].trim();

    // Codeforces handle rules: letters, digits, underscores, dots, hyphens (3-24 chars)
    if (!/^[a-zA-Z0-9_.-]{2,30}$/.test(cleaned)) {
      return '';
    }
    return cleaned;
  }

  /**
   * Public profile URL for Codeforces.
   * @param {string} username 
   * @returns {string}
   */
  getProfileUrl(username) {
    return `https://codeforces.com/profile/${username}`;
  }

  /**
   * Fetches public user info and rating history from Codeforces official API.
   * @param {string} username 
   * @param {Object} [options]
   * @returns {Promise<Object>}
   */
  async fetchProfile(username, options = {}) {
    const cleanUser = this.normalizeUsername(username);
    if (!cleanUser) {
      const err = new Error('Invalid Codeforces username or URL format.');
      err.statusCode = 400;
      throw err;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    const signal = options.signal || controller.signal;

    try {
      // 1. Fetch user.info
      const userInfoUrl = `https://codeforces.com/api/user.info?handles=${encodeURIComponent(cleanUser)}`;
      const infoRes = await fetch(userInfoUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'SIPS-Placement-Intelligence-Platform',
          'Accept': 'application/json'
        },
        signal
      });

      if (infoRes.status === 429) {
        const err = new Error('Codeforces API rate limit reached. Please try again shortly.');
        err.statusCode = 429;
        err.isRateLimit = true;
        throw err;
      }

      if (!infoRes.ok && infoRes.status >= 500) {
        const err = new Error(`Codeforces service returned temporary server error (${infoRes.status}).`);
        err.statusCode = 502;
        throw err;
      }

      const infoData = await infoRes.json().catch(() => null);
      if (!infoData || infoData.status !== 'OK' || !Array.isArray(infoData.result) || infoData.result.length === 0) {
        const comment = infoData && infoData.comment ? infoData.comment : '';
        if (comment.toLowerCase().includes('not found') || infoRes.status === 400 || infoRes.status === 404) {
          const err = new Error(`Codeforces user '${cleanUser}' not found.`);
          err.statusCode = 404;
          err.isUserNotFound = true;
          throw err;
        }
        const err = new Error(comment || 'Failed to retrieve Codeforces user profile.');
        err.statusCode = 400;
        throw err;
      }

      const userDoc = infoData.result[0];

      // 2. Fetch contest rating history (for contest participation count)
      let contestCount = 0;
      try {
        const ratingUrl = `https://codeforces.com/api/user.rating?handle=${encodeURIComponent(cleanUser)}`;
        const ratingRes = await fetch(ratingUrl, {
          method: 'GET',
          headers: {
            'User-Agent': 'SIPS-Placement-Intelligence-Platform',
            'Accept': 'application/json'
          },
          signal
        });
        if (ratingRes.ok) {
          const ratingData = await ratingRes.json().catch(() => null);
          if (ratingData && ratingData.status === 'OK' && Array.isArray(ratingData.result)) {
            contestCount = ratingData.result.length;
          }
        }
      } catch (ratingErr) {
        logger.warn(`Could not fetch Codeforces rating history for ${cleanUser}:`, ratingErr.message);
      }

      // Format normalized stats (omitting unsupported metrics rather than inventing 0)
      const currentRating = typeof userDoc.rating === 'number' ? userDoc.rating : null;
      const maxRating = typeof userDoc.maxRating === 'number' ? userDoc.maxRating : null;
      const rank = userDoc.rank ? String(userDoc.rank).trim() : (currentRating ? null : 'Unrated');
      const maxRank = userDoc.maxRank ? String(userDoc.maxRank).trim() : null;

      const badges = [];
      if (rank && rank !== 'Unrated') {
        badges.push({
          name: rank.charAt(0).toUpperCase() + rank.slice(1),
          iconUrl: userDoc.titlePhoto || userDoc.avatar || ''
        });
      }

      return {
        platform: 'CODEFORCES',
        username: userDoc.handle || cleanUser,
        profileUrl: this.getProfileUrl(userDoc.handle || cleanUser),
        accessMode: this.accessMode,
        stats: {
          currentRating,
          maxRating,
          rank,
          maxRank,
          contestParticipationCount: contestCount,
          contribution: typeof userDoc.contribution === 'number' ? userDoc.contribution : null,
          friendOfCount: typeof userDoc.friendOfCount === 'number' ? userDoc.friendOfCount : null,
          badges,
          avatarUrl: userDoc.avatar || null
        }
      };
    } catch (err) {
      if (err.name === 'AbortError') {
        const timeoutErr = new Error('Codeforces API request timed out.');
        timeoutErr.statusCode = 504;
        throw timeoutErr;
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

module.exports = new CodeforcesAdapter();
