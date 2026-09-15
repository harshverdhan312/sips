const { calculateMatch, extractSkillsFromText, normalizeSkill } = require('../utils/matchingEngine');

describe('Matching Engine Utility', () => {
  test('should normalize synonymous tech skills', () => {
    expect(normalizeSkill('js')).toBe('javascript');
    expect(normalizeSkill('reactjs')).toBe('react.js');
    expect(normalizeSkill('mongo')).toBe('mongodb');
    expect(normalizeSkill('py')).toBe('python');
    expect(normalizeSkill('cplusplus')).toBe('c++');
    expect(normalizeSkill('k8s')).toBe('kubernetes');
  });

  test('should compute 100% score when all skills match', () => {
    const studentSkills = ['javascript', 'react.js', 'node.js'];
    const requiredSkills = ['js', 'react', 'node'];

    const result = calculateMatch(studentSkills, requiredSkills);
    expect(result.score).toBe(100);
    expect(result.matchedSkills).toHaveLength(3);
    expect(result.missingSkills).toHaveLength(0);
  });

  test('should compute accurate partial score and missing skills', () => {
    const studentSkills = ['python', 'sql'];
    const requiredSkills = ['python', 'sql', 'docker', 'aws'];

    const result = calculateMatch(studentSkills, requiredSkills);
    expect(result.score).toBe(50);
    expect(result.matchedSkills).toEqual(expect.arrayContaining(['python', 'sql']));
    expect(result.missingSkills).toEqual(expect.arrayContaining(['docker', 'aws']));
  });

  test('should return 0 score when no skills required or provided', () => {
    expect(calculateMatch([], []).score).toBe(0);
    expect(calculateMatch(null, []).score).toBe(0);
  });

  test('should extract known skills from JD raw text', () => {
    const jdText = `
      We are looking for a Senior Software Engineer with strong experience in
      Python, Django, and React.js. Knowledge of AWS, Docker, and PostgreSQL is required.
      Good problem solving skills with algorithms and data structures.
    `;

    const extracted = extractSkillsFromText(jdText);
    expect(extracted).toContain('python');
    expect(extracted).toContain('django');
    expect(extracted).toContain('react.js');
    expect(extracted).toContain('aws');
    expect(extracted).toContain('docker');
    expect(extracted).toContain('postgresql');
  });
});
