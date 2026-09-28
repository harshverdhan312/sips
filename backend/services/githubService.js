/**
 * GitHub Service
 * Real GitHub REST API integration with in-memory caching and server-side rate limit optimization.
 */

// In-memory repository cache with 5-minute TTL
const repoCache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Extract clean GitHub username from handles, URLs, or @prefixed strings
 * @param {string} input - raw handle/URL
 * @returns {string} clean username
 */
function extractUsername(input) {
  if (!input || typeof input !== 'string') return '';
  let cleaned = input.trim();
  // Remove trailing slashes
  cleaned = cleaned.replace(/\/+$/, '');
  // Remove protocol and domain if present
  cleaned = cleaned.replace(/^(https?:\/\/)?(www\.)?github\.com\//i, '');
  // Remove leading @
  cleaned = cleaned.replace(/^@+/, '');
  // Strip any query strings or paths
  cleaned = cleaned.split('/')[0].split('?')[0].trim();
  return cleaned;
}

/**
 * Get HTTP headers for GitHub API calls
 */
function getHeaders() {
  const headers = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'SIPS-Placement-Intelligence-Platform'
  };

  const token = process.env.GITHUB_API_TOKEN || process.env.GITHUB_TOKEN;
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}

/**
 * Fetch public repositories for a GitHub user
 * @param {string} rawUsername 
 * @param {boolean} bypassCache 
 * @returns {Promise<Array<Object>>} normalized repository list
 */
async function fetchUserRepositories(rawUsername, bypassCache = false) {
  const username = extractUsername(rawUsername);
  if (!username) {
    const error = new Error('Invalid GitHub username');
    error.statusCode = 400;
    throw error;
  }

  const cacheKey = username.toLowerCase();
  const cached = repoCache.get(cacheKey);
  if (!bypassCache && cached && (Date.now() - cached.timestamp < CACHE_TTL_MS)) {
    return cached.data;
  }

  const url = `https://api.github.com/users/${encodeURIComponent(username)}/repos?sort=updated&per_page=100&type=all`;
  
  let response;
  try {
    response = await fetch(url, {
      method: 'GET',
      headers: getHeaders()
    });
  } catch (err) {
    const error = new Error(`GitHub API network failure: ${err.message}`);
    error.statusCode = 502;
    throw error;
  }

  if (response.status === 404) {
    const error = new Error(`GitHub user '${username}' not found on GitHub`);
    error.statusCode = 404;
    throw error;
  }

  if (response.status === 403 || response.status === 429) {
    const error = new Error('GitHub API rate limit exceeded or access forbidden. Please try again shortly.');
    error.statusCode = response.status === 429 ? 429 : 403;
    throw error;
  }

  if (!response.ok) {
    const error = new Error(`GitHub API returned status ${response.status}`);
    error.statusCode = response.status >= 500 ? 502 : 400;
    throw error;
  }

  const rawRepos = await response.json();
  if (!Array.isArray(rawRepos)) {
    return [];
  }

  // Normalize and filter repositories strictly belonging to user
  const normalized = rawRepos
    .filter(repo => repo && repo.owner && repo.owner.login && repo.owner.login.toLowerCase() === username.toLowerCase())
    .map(repo => ({
      repoId: Number(repo.id),
      name: String(repo.name || ''),
      fullName: String(repo.full_name || ''),
      owner: String(repo.owner ? repo.owner.login : username),
      htmlUrl: String(repo.html_url || `https://github.com/${username}/${repo.name}`),
      description: repo.description ? String(repo.description).slice(0, 500) : '',
      primaryLanguage: repo.language ? String(repo.language) : '',
      languages: repo.language ? [String(repo.language)] : [],
      topics: Array.isArray(repo.topics) ? repo.topics.map(t => String(t).toLowerCase()) : [],
      stars: Number(repo.stargazers_count || 0),
      forks: Number(repo.forks_count || 0),
      isFork: Boolean(repo.fork),
      updatedAt: repo.updated_at ? new Date(repo.updated_at) : null,
      pushedAt: repo.pushed_at ? new Date(repo.pushed_at) : null
    }));

  // Store in in-memory cache
  repoCache.set(cacheKey, {
    timestamp: Date.now(),
    data: normalized
  });

  return normalized;
}

/**
 * Fetch detailed language breakdown for a specific repository
 * @param {string} owner 
 * @param {string} repoName 
 * @returns {Promise<Array<string>>} list of language names
 */
async function fetchRepoLanguages(owner, repoName) {
  if (!owner || !repoName) return [];
  const url = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repoName)}/languages`;
  
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: getHeaders()
    });

    if (res.ok) {
      const data = await res.json();
      if (data && typeof data === 'object') {
        // Return language names sorted by byte volume
        return Object.keys(data).sort((a, b) => data[b] - data[a]);
      }
    }
  } catch (err) {
    // Graceful degradation: return empty without throwing
    console.warn(`Could not fetch languages for ${owner}/${repoName}:`, err.message);
  }
  return [];
}

/**
 * Clear cache for a username or all
 */
function clearCache(username = null) {
  if (username) {
    repoCache.delete(username.toLowerCase());
  } else {
    repoCache.clear();
  }
}

module.exports = {
  extractUsername,
  fetchUserRepositories,
  fetchRepoLanguages,
  clearCache
};
