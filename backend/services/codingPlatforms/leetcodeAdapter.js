/**
 * LeetCode Platform Adapter
 * Public GraphQL endpoint integration for LeetCode profile, solved counts, and contest rating.
 */

const CodingPlatformAdapter = require('./CodingPlatformAdapter');
const logger = require('../../utils/logger');

const REQUEST_TIMEOUT_MS = 8000;

const LEETCODE_GRAPHQL_QUERY = `
query getUserProfile($username: String!) {
  matchedUser(username: $username) {
    username
    submitStatsGlobal {
      acSubmissionNum {
        difficulty
        count
      }
    }
    profile {
      ranking
      reputation
    }
  }
  userContestRanking(username: $username) {
    rating
    globalRanking
    totalParticipants
    topPercentage
    attendedContestsCount
    badge {
      name
    }
  }
}
`;

class LeetCodeAdapter extends CodingPlatformAdapter {
  constructor() {
    super('LEETCODE', 'PUBLIC_ENDPOINT');
  }

  /**
   * Normalizes LeetCode username from handle or profile URL.
   * e.g. "https://leetcode.com/u/harsh_dev/", "https://leetcode.com/harsh_dev", "@harsh_dev", "harsh_dev"
   * @param {string} input 
   * @returns {string} clean canonical username
   */
  normalizeUsername(input) {
    if (!input || typeof input !== 'string') return '';
    let cleaned = input.trim();
    // Strip trailing slashes
    cleaned = cleaned.replace(/\/+$/, '');
    // Strip protocol, domain, and /u/ subpath
    cleaned = cleaned.replace(/^(https?:\/\/)?(www\.)?leetcode\.com\/u\//i, '');
    cleaned = cleaned.replace(/^(https?:\/\/)?(www\.)?leetcode\.com\//i, '');
    // Strip leading @
    cleaned = cleaned.replace(/^@+/, '');
    // Strip query strings or trailing subpaths
    cleaned = cleaned.split('/')[0].split('?')[0].trim();

    // LeetCode usernames: alphanumeric, hyphens, underscores (3-30 chars)
    if (!/^[a-zA-Z0-9_-]{2,30}$/.test(cleaned)) {
      return '';
    }
    return cleaned;
  }

  /**
   * Public profile URL for LeetCode.
   * @param {string} username 
   * @returns {string}
   */
  getProfileUrl(username) {
    return `https://leetcode.com/u/${username}/`;
  }

  /**
   * Fetches public statistics for a LeetCode user via public GraphQL endpoint.
   * @param {string} username 
   * @param {Object} [options]
   * @returns {Promise<Object>}
   */
  async fetchProfile(username, options = {}) {
    const cleanUser = this.normalizeUsername(username);
    if (!cleanUser) {
      const err = new Error('Invalid LeetCode username or profile URL format.');
      err.statusCode = 400;
      throw err;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    const signal = options.signal || controller.signal;

    try {
      const response = await fetch('https://leetcode.com/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'SIPS-Placement-Intelligence-Platform',
          'Referer': 'https://leetcode.com',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          query: LEETCODE_GRAPHQL_QUERY,
          variables: { username: cleanUser }
        }),
        signal
      });

      if (response.status === 429) {
        const err = new Error('LeetCode rate limit encountered. Please try again in a few moments.');
        err.statusCode = 429;
        err.isRateLimit = true;
        throw err;
      }

      if (!response.ok && response.status >= 500) {
        const err = new Error(`LeetCode service returned server error (${response.status}).`);
        err.statusCode = 502;
        throw err;
      }

      const body = await response.json().catch(() => null);
      if (!body || body.errors) {
        // If user not found or general errors
        if (body && Array.isArray(body.errors) && body.errors.some(e => e.message && e.message.toLowerCase().includes('not exist'))) {
          const err = new Error(`LeetCode user '${cleanUser}' not found.`);
          err.statusCode = 404;
          err.isUserNotFound = true;
          throw err;
        }
      }

      const matchedUser = body?.data?.matchedUser;
      if (!matchedUser) {
        const err = new Error(`LeetCode user '${cleanUser}' does not exist or has a private profile.`);
        err.statusCode = 404;
        err.isUserNotFound = true;
        throw err;
      }

      // Parse Solved Breakdown
      const acList = matchedUser.submitStatsGlobal?.acSubmissionNum || [];
      let totalSolved = null;
      let easySolved = null;
      let mediumSolved = null;
      let hardSolved = null;

      for (const item of acList) {
        const diff = String(item.difficulty || '').toLowerCase();
        const count = Number(item.count || 0);
        if (diff === 'all') totalSolved = count;
        else if (diff === 'easy') easySolved = count;
        else if (diff === 'medium') mediumSolved = count;
        else if (diff === 'hard') hardSolved = count;
      }

      // Contest Statistics
      const contest = body?.data?.userContestRanking;
      const contestRating = (contest && typeof contest.rating === 'number') ? Math.round(contest.rating) : null;
      const contestCount = (contest && typeof contest.attendedContestsCount === 'number') ? contest.attendedContestsCount : null;
      const contestRank = (contest && typeof contest.globalRanking === 'number') ? contest.globalRanking : null;
      const globalRank = (matchedUser.profile && typeof matchedUser.profile.ranking === 'number') ? matchedUser.profile.ranking : contestRank;
      const contestBadgeName = contest?.badge?.name ? String(contest.badge.name).trim() : null;

      const badges = [];
      if (contestBadgeName) {
        badges.push({
          name: contestBadgeName,
          iconUrl: ''
        });
      }

      return {
        platform: 'LEETCODE',
        username: matchedUser.username || cleanUser,
        profileUrl: this.getProfileUrl(matchedUser.username || cleanUser),
        accessMode: this.accessMode,
        stats: {
          problemsSolved: totalSolved,
          difficultyBreakdown: (easySolved !== null || mediumSolved !== null || hardSolved !== null) ? {
            easy: easySolved ?? 0,
            medium: mediumSolved ?? 0,
            hard: hardSolved ?? 0
          } : null,
          currentRating: contestRating,
          maxRating: null, // LeetCode GraphQL public endpoint exposes current rating
          globalRank,
          rankingTier: contestBadgeName,
          contestParticipationCount: contestCount,
          reputationOrPoints: (matchedUser.profile && typeof matchedUser.profile.reputation === 'number') ? matchedUser.profile.reputation : null,
          badges
        }
      };
    } catch (err) {
      if (err.name === 'AbortError') {
        const timeoutErr = new Error('LeetCode request timed out.');
        timeoutErr.statusCode = 504;
        throw timeoutErr;
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

module.exports = new LeetCodeAdapter();
