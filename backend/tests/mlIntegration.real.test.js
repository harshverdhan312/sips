const fs = require('fs');
const path = require('path');
const { MLService } = require('../services/mlService');
const config = require('../config');

describe('Real Node ↔ FastAPI ML Integration Tests', () => {
  let mlClient;
  const pdfFixturePath = path.join(__dirname, 'fixtures', 'sample_resume.pdf');

  beforeAll(() => {
    // Instantiate real client without mocks, targeting configured ML service URL
    mlClient = new MLService({
      baseUrl: process.env.ML_SERVICE_URL || config.mlServiceUrl || 'http://127.0.0.1:8000',
      timeoutMs: parseInt(process.env.ML_SERVICE_TIMEOUT_MS, 10) || 15000
    });
  });

  describe('1. Health Endpoint (GET /health)', () => {
    it('should connect to FastAPI over HTTP and return service identity', async () => {
      const res = await mlClient.checkHealth();

      expect(res).toBeDefined();
      expect(typeof res).toBe('object');
      expect(res.status).toBe('ok');
      expect(res.service).toBe('SIPS ML Service');
    });
  });

  describe('2. Resume Skill Extraction (POST /resume/extract)', () => {
    it('should upload real PDF fixture and receive extracted_skills list', async () => {
      expect(fs.existsSync(pdfFixturePath)).toBe(true);
      const pdfBuffer = fs.readFileSync(pdfFixturePath);

      const res = await mlClient.extractResumeSkills(pdfBuffer, 'sample_resume.pdf');

      expect(res).toBeDefined();
      expect(Array.isArray(res.extracted_skills)).toBe(true);
      expect(res.extracted_skills.length).toBeGreaterThan(0);
      // Skills should be normalized lowercase strings as defined by FastAPI
      res.extracted_skills.forEach(skill => {
        expect(typeof skill).toBe('string');
      });
    });
  });

  describe('3. Resume Skill Matching (POST /resume/match)', () => {
    it('should send skills arrays and compute deterministic match statistics', async () => {
      const studentSkills = ['Java', 'Flutter', 'SQL'];
      const requiredSkills = ['Java', 'SQL', 'Python'];

      const res = await mlClient.matchResumeSkills(studentSkills, requiredSkills);

      expect(res).toBeDefined();
      expect(Array.isArray(res.matched_skills)).toBe(true);
      expect(Array.isArray(res.missing_skills)).toBe(true);
      expect(typeof res.coverage_score).toBe('number');

      // Deterministic expectations for normalized skills
      expect(res.matched_skills).toContain('java');
      expect(res.matched_skills).toContain('sql');
      expect(res.missing_skills).toContain('python');
      expect(res.coverage_score).toBeCloseTo(66.67, 1);
    });
  });

  describe('4. Semantic Resume Matching (POST /resume/semantic-match)', () => {
    it('should compute Sentence-BERT semantic similarity with canonical model_name', async () => {
      const studentSkills = ['Python', 'Machine Learning', 'PyTorch'];
      const jobText = 'Seeking an AI/ML Engineer with strong Python and deep learning foundations.';

      const res = await mlClient.semanticMatchResume(studentSkills, jobText);

      expect(res).toBeDefined();
      expect(typeof res.semantic_similarity).toBe('number');
      expect(res.semantic_similarity).toBeGreaterThanOrEqual(0.0);
      expect(res.semantic_similarity).toBeLessThanOrEqual(1.0);
      expect(typeof res.model_name).toBe('string');
      expect(res.model_name.length).toBeGreaterThan(0);
    });
  });

  describe('5. Hybrid Resume Matching (POST /resume/hybrid-match)', () => {
    it('should combine keyword overlap and semantic embeddings with exact schema types', async () => {
      const payload = {
        studentSkills: ['Python', 'SQL', 'React'],
        requiredSkills: ['Python', 'SQL', 'Docker'],
        resumeText: 'Full stack developer proficient in Python, SQL databases, and modern React interfaces.',
        jobText: 'Backend engineer wanted with Python, relational databases, and containerization experience.',
        skillWeight: 0.6,
        semanticWeight: 0.4
      };

      const res = await mlClient.hybridMatchResume(payload);

      expect(res).toBeDefined();
      expect(Array.isArray(res.matched_skills)).toBe(true);
      expect(Array.isArray(res.missing_skills)).toBe(true);
      expect(typeof res.skill_coverage_score).toBe('number');
      expect(typeof res.semantic_similarity).toBe('number');
      expect(typeof res.semantic_score).toBe('number');
      expect(typeof res.hybrid_match_score).toBe('number');
      expect(res.skill_weight).toBe(0.6);
      expect(res.semantic_weight).toBe(0.4);

      // Verify hybrid formula: hybrid_match_score = skill_coverage_score * 0.6 + semantic_score * 0.4
      const calculatedHybrid = Number((res.skill_coverage_score * 0.6 + res.semantic_score * 0.4).toFixed(2));
      expect(res.hybrid_match_score).toBeCloseTo(calculatedHybrid, 1);
    });
  });

  describe('6. Placement Prediction (POST /placement/predict)', () => {
    it('should predict placement probability for canonical Kaggle-schema student payload', async () => {
      const canonicalStudentPayload = {
        Age: 21,
        Internships: 2,
        CGPA: 8.75,
        Hostel: 1,
        HistoryOfBacklogs: 0,
        Stream: 'Computer Science'
      };

      const res = await mlClient.predictPlacement(canonicalStudentPayload);

      expect(res).toBeDefined();
      expect(typeof res.placement_probability).toBe('number');
      expect(res.placement_probability).toBeGreaterThanOrEqual(0.0);
      expect(res.placement_probability).toBeLessThanOrEqual(1.0);
      expect(typeof res.decision_threshold).toBe('number');
      expect([0, 1]).toContain(res.predicted_class);
      expect(typeof res.predicted_label).toBe('string');
      expect(typeof res.model_version).toBe('string');
    });
  });
});
