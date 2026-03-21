/**
 * Matching Engine — computes student-JD skill match scores
 */

const synonymMap = {
  'js': 'javascript',
  'javascript': 'javascript',
  'react': 'react.js',
  'react.js': 'react.js',
  'reactjs': 'react.js',
  'node': 'node.js',
  'node.js': 'node.js',
  'nodejs': 'node.js',
  'mongo': 'mongodb',
  'mongodb': 'mongodb',
  'python': 'python',
  'py': 'python',
  'cpp': 'c++',
  'c++': 'c++',
  'cplusplus': 'c++',
  'ts': 'typescript',
  'typescript': 'typescript',
  'postgres': 'postgresql',
  'postgresql': 'postgresql',
  'aws': 'aws',
  'amazon web services': 'aws',
  'gcp': 'google cloud',
  'google cloud': 'google cloud',
  'ml': 'machine learning',
  'machine learning': 'machine learning',
  'ai': 'artificial intelligence',
  'artificial intelligence': 'artificial intelligence',
  'dl': 'deep learning',
  'deep learning': 'deep learning',
  'html5': 'html',
  'html': 'html',
  'css3': 'css',
  'css': 'css',
  'sql': 'sql',
  'mysql': 'mysql',
  'express': 'express.js',
  'express.js': 'express.js',
  'expressjs': 'express.js',
  'angular': 'angular',
  'angularjs': 'angular',
  'vue': 'vue.js',
  'vue.js': 'vue.js',
  'vuejs': 'vue.js',
  'docker': 'docker',
  'kubernetes': 'kubernetes',
  'k8s': 'kubernetes',
  'git': 'git',
  'github': 'github',
  'linux': 'linux',
  'java': 'java',
  'spring': 'spring',
  'spring boot': 'spring boot',
  'django': 'django',
  'flask': 'flask',
  'go': 'golang',
  'golang': 'golang',
  'rust': 'rust',
  'swift': 'swift',
  'kotlin': 'kotlin',
  'flutter': 'flutter',
  'dart': 'dart',
  'r': 'r',
  'scala': 'scala',
  'ruby': 'ruby',
  'rails': 'ruby on rails',
  'ruby on rails': 'ruby on rails',
  'php': 'php',
  'laravel': 'laravel',
  'graphql': 'graphql',
  'rest': 'rest api',
  'rest api': 'rest api',
  'restful': 'rest api',
  'redis': 'redis',
  'elasticsearch': 'elasticsearch',
  'firebase': 'firebase',
  'tensorflow': 'tensorflow',
  'pytorch': 'pytorch',
  'pandas': 'pandas',
  'numpy': 'numpy',
  'scikit-learn': 'scikit-learn',
  'sklearn': 'scikit-learn',
};

const normalizeSkill = (skill) => {
  const normalized = skill.toLowerCase().trim();
  return synonymMap[normalized] || normalized;
};

/**
 * Calculate match between a student's skills and required skills
 */
const calculateMatch = (studentSkills, requiredSkills) => {
  if (!requiredSkills || requiredSkills.length === 0) {
    return { score: 0, matchedSkills: [], missingSkills: [] };
  }

  const normalizedStudentSkills = new Set((studentSkills || []).map(normalizeSkill));
  const normalizedRequiredSkills = requiredSkills.map(normalizeSkill);

  const matchedSkills = [];
  const missingSkills = [];

  normalizedRequiredSkills.forEach(skill => {
    if (normalizedStudentSkills.has(skill)) {
      matchedSkills.push(skill);
    } else {
      missingSkills.push(skill);
    }
  });

  const score = Math.round((matchedSkills.length / normalizedRequiredSkills.length) * 100);

  return { score, matchedSkills, missingSkills };
};

/**
 * Common tech skills for extraction from JD text
 */
const KNOWN_SKILLS = [
  'javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'go', 'golang', 'rust',
  'swift', 'kotlin', 'dart', 'ruby', 'php', 'scala', 'r', 'perl', 'matlab',
  'react', 'react.js', 'angular', 'vue', 'vue.js', 'svelte', 'next.js', 'nuxt.js',
  'node.js', 'express', 'express.js', 'django', 'flask', 'spring', 'spring boot',
  'laravel', 'rails', 'ruby on rails', 'asp.net', 'fastapi',
  'html', 'css', 'sass', 'less', 'tailwind', 'bootstrap',
  'sql', 'mysql', 'postgresql', 'mongodb', 'redis', 'elasticsearch',
  'firebase', 'dynamodb', 'cassandra', 'sqlite',
  'aws', 'azure', 'google cloud', 'gcp', 'heroku', 'vercel', 'netlify',
  'docker', 'kubernetes', 'jenkins', 'ci/cd', 'terraform', 'ansible',
  'git', 'github', 'gitlab', 'bitbucket',
  'rest api', 'graphql', 'grpc', 'websocket',
  'machine learning', 'deep learning', 'artificial intelligence', 'nlp',
  'tensorflow', 'pytorch', 'scikit-learn', 'pandas', 'numpy', 'opencv',
  'linux', 'bash', 'shell scripting',
  'agile', 'scrum', 'jira',
  'figma', 'sketch', 'adobe xd',
  'flutter', 'react native', 'ionic',
  'blockchain', 'solidity', 'web3',
  'data structures', 'algorithms', 'system design', 'oop',
  'unit testing', 'jest', 'mocha', 'cypress', 'selenium',
];

/**
 * Extract skills from JD text using keyword matching
 */
const extractSkillsFromText = (text) => {
  if (!text) return [];
  const lowerText = text.toLowerCase();
  const found = new Set();

  KNOWN_SKILLS.forEach(skill => {
    // Use word boundary matching for single-word skills
    const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'i');
    if (regex.test(lowerText)) {
      found.add(normalizeSkill(skill));
    }
  });

  return Array.from(found);
};

module.exports = { calculateMatch, extractSkillsFromText, normalizeSkill };
