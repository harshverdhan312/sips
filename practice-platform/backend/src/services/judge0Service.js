const config = require('../config');
const AppError = require('../utils/appError');

/**
 * Standard Judge0 CE Language IDs (Centralized Mapping)
 */
const LANGUAGE_MAP = {
  cpp: 54,        // C++ (GCC 9.2.0)
  java: 62,       // Java (OpenJDK 13.0.1)
  python: 71,     // Python (3.8.1)
  javascript: 63  // JavaScript (Node.js 12.14.0)
};

/**
 * Judge0 Status ID to Platform SubmissionStatus Mapping
 */
const STATUS_MAP = {
  1: 'QUEUED',              // In Queue
  2: 'RUNNING',             // Processing
  3: 'ACCEPTED',            // Accepted
  4: 'WRONG_ANSWER',        // Wrong Answer
  5: 'TIME_LIMIT_EXCEEDED', // Time Limit Exceeded
  6: 'COMPILATION_ERROR',   // Compilation Error
  7: 'RUNTIME_ERROR',       // Runtime Error (SIGSEGV)
  8: 'RUNTIME_ERROR',       // Runtime Error (SIGXFSZ)
  9: 'RUNTIME_ERROR',       // Runtime Error (SIGFPE)
  10: 'RUNTIME_ERROR',      // Runtime Error (SIGABRT)
  11: 'RUNTIME_ERROR',      // Runtime Error (NZEC)
  12: 'RUNTIME_ERROR',      // Runtime Error (Other)
  13: 'SYSTEM_ERROR',       // Internal Error
  14: 'SYSTEM_ERROR'        // Exec Format Error
};

let mockProvider = null;

/**
 * For Unit & Integration Testing without Live Judge0 Server
 */
function setMockProvider(provider) {
  mockProvider = provider;
}

function clearMockProvider() {
  mockProvider = null;
}

function isLanguageSupported(langKey) {
  if (!langKey || typeof langKey !== 'string') return false;
  return Object.prototype.hasOwnProperty.call(LANGUAGE_MAP, langKey.toLowerCase().trim());
}

function getLanguageId(langKey) {
  if (!isLanguageSupported(langKey)) {
    throw new AppError(
      `Unsupported language '${langKey}'. Supported languages: ${Object.keys(LANGUAGE_MAP).join(', ')}`,
      400
    );
  }
  return LANGUAGE_MAP[langKey.toLowerCase().trim()];
}

function mapStatusId(statusId) {
  return STATUS_MAP[statusId] || 'SYSTEM_ERROR';
}

function getHeaders() {
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json'
  };

  if (config.judge0ApiKey) {
    headers['X-RapidAPI-Key'] = config.judge0ApiKey;
    headers['X-Auth-Token'] = config.judge0ApiKey;
  }

  if (config.judge0ApiHost) {
    headers['X-RapidAPI-Host'] = config.judge0ApiHost;
  }

  return headers;
}

/**
 * Submit batch of test cases to Judge0
 * @param {Array<{ source_code: string, language_id: number, stdin: string, expected_output?: string, cpu_time_limit?: number, memory_limit?: number }>} submissions
 * @returns {Promise<Array<{ token: string }>>}
 */
async function submitBatch(submissions) {
  if (mockProvider && typeof mockProvider.submitBatch === 'function') {
    return mockProvider.submitBatch(submissions);
  }

  const url = `${config.judge0BaseUrl}/submissions/batch?base64_encoded=false`;

  const response = await fetch(url, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ submissions })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new AppError(`Judge0 submission failed with status ${response.status}: ${errText}`, 502);
  }

  const data = await response.json();
  return Array.isArray(data) ? data : [];
}

/**
 * Poll batch of execution tokens from Judge0
 * @param {Array<string>} tokens
 * @returns {Promise<Array<{ token: string, status_id: number, status: object, stdout: string, stderr: string, compile_output: string, time: string, memory: number }>>}
 */
async function pollBatch(tokens) {
  if (!tokens || tokens.length === 0) return [];

  if (mockProvider && typeof mockProvider.pollBatch === 'function') {
    return mockProvider.pollBatch(tokens);
  }

  const tokenList = tokens.join(',');
  const fields = 'token,status_id,status,stdout,stderr,compile_output,time,memory';
  const url = `${config.judge0BaseUrl}/submissions/batch?tokens=${encodeURIComponent(tokenList)}&base64_encoded=false&fields=${fields}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: getHeaders()
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new AppError(`Judge0 polling failed with status ${response.status}: ${errText}`, 502);
  }

  const data = await response.json();
  return data && Array.isArray(data.submissions) ? data.submissions : [];
}

module.exports = {
  LANGUAGE_MAP,
  STATUS_MAP,
  isLanguageSupported,
  getLanguageId,
  mapStatusId,
  submitBatch,
  pollBatch,
  setMockProvider,
  clearMockProvider
};
