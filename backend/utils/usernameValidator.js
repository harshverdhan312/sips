/**
 * Username validation utility for SIPS Public Career Profiles.
 */

const RESERVED_USERNAMES = new Set([
  'about',
  'admin',
  'administrator',
  'analytics',
  'api',
  'app',
  'auth',
  'college',
  'colleges',
  'contact',
  'dashboard',
  'developer',
  'docs',
  'help',
  'home',
  'interview',
  'jd',
  'job',
  'jobs',
  'login',
  'logout',
  'notification',
  'notifications',
  'placement',
  'placements',
  'privacy',
  'profile',
  'profiles',
  'project',
  'projects',
  'public',
  'readiness',
  'register',
  'report',
  'reports',
  'resume',
  'resumes',
  'root',
  'settings',
  'signin',
  'signout',
  'signup',
  'sips',
  'skill',
  'skills',
  'student',
  'students',
  'support',
  'system',
  'terms',
  'u',
  'user',
  'users',
  'www'
]);

const USERNAME_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Validates a public profile username
 * @param {string} username 
 * @returns {{ isValid: boolean, error?: string, normalized?: string }}
 */
function validateUsername(username) {
  if (!username || typeof username !== 'string') {
    return { isValid: false, error: 'Username is required.' };
  }

  const normalized = username.trim().toLowerCase();

  if (RESERVED_USERNAMES.has(normalized)) {
    return { isValid: false, error: `'${normalized}' is a reserved system username. Please choose a different username.` };
  }

  if (normalized.length < 3 || normalized.length > 30) {
    return { isValid: false, error: 'Username must be between 3 and 30 characters long.' };
  }

  if (!USERNAME_REGEX.test(normalized)) {
    return {
      isValid: false,
      error: 'Username can only contain lowercase letters, numbers, and non-consecutive hyphens. It cannot start or end with a hyphen.'
    };
  }

  // Reject MongoDB ObjectId-like strings (24 hex chars)
  if (/^[a-f0-9]{24}$/i.test(normalized)) {
    return { isValid: false, error: 'Username cannot resemble internal system identifiers.' };
  }

  return { isValid: true, normalized };
}

/**
 * Validates a LinkedIn profile URL
 * @param {string} url 
 * @returns {{ isValid: boolean, error?: string, sanitized?: string }}
 */
function validateLinkedInUrl(url) {
  if (!url || typeof url !== 'string' || !url.trim()) {
    return { isValid: true, sanitized: '' };
  }

  const trimmed = url.trim();
  
  // Must be HTTPS and point to linkedin.com/in/... or linkedin.com/company/...
  const linkedinRegex = /^https:\/\/(?:[a-z]{2,3}\.)?linkedin\.com\/(?:in|pub)\/[a-zA-Z0-9_-]+\/?$/;
  
  if (!linkedinRegex.test(trimmed)) {
    return {
      isValid: false,
      error: 'LinkedIn profile must be a valid HTTPS URL (e.g. https://www.linkedin.com/in/username).'
    };
  }

  return { isValid: true, sanitized: trimmed };
}

module.exports = {
  RESERVED_USERNAMES,
  validateUsername,
  validateLinkedInUrl
};
