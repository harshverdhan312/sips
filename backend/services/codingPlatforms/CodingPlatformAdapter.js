/**
 * Base Coding Platform Adapter
 * Defines the contract and common functionality for external coding platform adapters.
 */

class CodingPlatformAdapter {
  constructor(platformName, accessMode) {
    if (new.target === CodingPlatformAdapter) {
      throw new TypeError('Cannot construct CodingPlatformAdapter instances directly.');
    }
    this.platform = platformName;
    this.accessMode = accessMode; // 'OFFICIAL_API' | 'PUBLIC_ENDPOINT'
  }

  /**
   * Normalize arbitrary input (handle, URL, @handle) into canonical username.
   * @param {string} input 
   * @returns {string} canonical username
   */
  normalizeUsername(input) {
    throw new Error('normalizeUsername must be implemented by adapter.');
  }

  /**
   * Canonical public profile URL for the given username.
   * @param {string} username 
   * @returns {string} profile URL
   */
  getProfileUrl(username) {
    throw new Error('getProfileUrl must be implemented by adapter.');
  }

  /**
   * Fetch public profile statistics from the upstream platform.
   * @param {string} username - canonical username
   * @param {Object} [options] - fetch options (e.g. signal)
   * @returns {Promise<Object>} raw normalized stats
   */
  async fetchProfile(username, options = {}) {
    throw new Error('fetchProfile must be implemented by adapter.');
  }
}

module.exports = CodingPlatformAdapter;
