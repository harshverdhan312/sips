const { MLService } = require('../services/mlService');
const config = require('../config');
const AppError = require('../utils/appError');
const logger = require('../utils/logger');

describe('Phase 5: Node-Only ML Service Integration Boundary', () => {
  let originalFetch;

  beforeAll(() => {
    originalFetch = global.fetch;
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  describe('1. Configuration & Client Initialization', () => {
    it('should initialize with default configuration values', () => {
      const client = new MLService();
      expect(client.baseUrl).toBe(config.mlServiceUrl.replace(/\/+$/, ''));
      expect(client.timeoutMs).toBe(config.mlServiceTimeoutMs);
      expect(client.apiKey).toBe(config.mlServiceApiKey);
    });

    it('should allow custom configuration overrides', () => {
      const client = new MLService({
        baseUrl: 'http://ml.internal:9000/',
        timeoutMs: 3000,
        apiKey: 'secret-test-key-123'
      });
      expect(client.baseUrl).toBe('http://ml.internal:9000');
      expect(client.timeoutMs).toBe(3000);
      expect(client.apiKey).toBe('secret-test-key-123');
    });
  });

  describe('2. Health Check (GET /health)', () => {
    it('should successfully parse health check response', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ status: 'ok', service: 'SIPS ML Service' })
      });

      const client = new MLService();
      const health = await client.checkHealth();

      expect(health).toEqual({
        status: 'ok',
        service: 'SIPS ML Service'
      });
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringMatching(/\/health$/),
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('should reject when health check returns non-object payload', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => 'Not a valid JSON object'
      });

      const client = new MLService();
      await expect(client.checkHealth()).rejects.toThrow(AppError);
    });
  });

  describe('3. Resume Skill Extraction (POST /resume/extract)', () => {
    it('should reject when invalid or empty buffer is provided', async () => {
      const client = new MLService();
      await expect(client.extractResumeSkills(null)).rejects.toThrow(AppError);
      await expect(client.extractResumeSkills('not-a-buffer')).rejects.toThrow(
        'A valid PDF buffer is required for resume skill extraction.'
      );
    });

    it('should post multipart PDF and parse extracted skills from FastAPI schema', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          extracted_skills: ['python', 'nodejs', 'mongodb']
        })
      });

      const client = new MLService();
      const dummyBuffer = Buffer.from('%PDF-1.4 dummy pdf content');
      const result = await client.extractResumeSkills(dummyBuffer, 'sample.pdf');

      expect(result.extracted_skills).toEqual(['python', 'nodejs', 'mongodb']);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringMatching(/\/resume\/extract$/),
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('should throw 502 when FastAPI response is missing extracted_skills array', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          invalid_key: ['python']
        })
      });

      const client = new MLService();
      const dummyBuffer = Buffer.from('%PDF-1.4 dummy pdf content');
      await expect(client.extractResumeSkills(dummyBuffer, 'sample.pdf')).rejects.toThrow(
        'ML Service returned invalid resume extraction schema.'
      );
    });
  });

  describe('4. Keyword Skill Matching (POST /resume/match)', () => {
    it('should reject invalid skill arrays', async () => {
      const client = new MLService();
      await expect(client.matchResumeSkills('not-array', [])).rejects.toThrow(AppError);
    });

    it('should post skill arrays and return verified FastAPI match statistics', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          matched_skills: ['react', 'nodejs', 'sql'],
          missing_skills: ['docker'],
          coverage_score: 75.0
        })
      });

      const client = new MLService();
      const res = await client.matchResumeSkills(['React', 'Node.js', 'SQL'], ['React', 'Node.js', 'SQL', 'Docker']);

      expect(res.coverage_score).toBe(75.0);
      expect(res.matched_skills).toEqual(['react', 'nodejs', 'sql']);
      expect(res.missing_skills).toEqual(['docker']);
    });

    it('should throw 502 when FastAPI response is missing coverage_score', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          matched_skills: ['react'],
          missing_skills: []
        })
      });

      const client = new MLService();
      await expect(
        client.matchResumeSkills(['react'], ['react'])
      ).rejects.toThrow('ML Service returned invalid skill match schema.');
    });
  });

  describe('5. Semantic & Hybrid Matching', () => {
    it('should compute semantic similarity and retain model_name', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          semantic_similarity: 0.845,
          model_name: 'all-MiniLM-L6-v2'
        })
      });

      const client = new MLService();
      const res = await client.semanticMatchResume(['Pytorch', 'NLP'], 'Machine learning engineer wanted');

      expect(res.semantic_similarity).toBe(0.845);
      expect(res.model_name).toBe('all-MiniLM-L6-v2');
    });

    it('should perform hybrid match with verified FastAPI response schema', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          matched_skills: ['javascript'],
          missing_skills: ['aws'],
          skill_coverage_score: 50.0,
          semantic_similarity: 0.85,
          semantic_score: 85.0,
          hybrid_match_score: 67.5,
          skill_weight: 0.5,
          semantic_weight: 0.5
        })
      });

      const client = new MLService();
      const res = await client.hybridMatchResume({
        studentSkills: ['JavaScript'],
        requiredSkills: ['JavaScript', 'AWS'],
        resumeText: 'Full stack JS dev',
        jobText: 'Full stack engineer with cloud experience',
        skillWeight: 0.5,
        semanticWeight: 0.5
      });

      expect(res.hybrid_match_score).toBe(67.5);
      expect(res.skill_coverage_score).toBe(50.0);
      expect(res.semantic_similarity).toBe(0.85);
      expect(res.semantic_score).toBe(85.0);
      expect(res.matched_skills).toEqual(['javascript']);
      expect(res.missing_skills).toEqual(['aws']);
      expect(res.skill_weight).toBe(0.5);
      expect(res.semantic_weight).toBe(0.5);
    });
  });

  describe('6. Mock Interview Analysis (POST /interview/analyze)', () => {
    it('should send transcript and audio buffer for analysis', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          overall_score: 88,
          feedback: ['Clear speaking tone', 'Accurate concepts']
        })
      });

      const client = new MLService();
      const audioBuffer = Buffer.from('RIFF....WAVEfmt ');
      const res = await client.analyzeInterview({
        transcript: 'I have 3 years of experience in distributed systems.',
        audioBuffer
      });

      expect(res.overall_score).toBe(88);
      expect(res.feedback).toHaveLength(2);
    });
  });

  describe('7. Placement Prediction & Model Field Mismatch Validation', () => {
    it('should enforce required Kaggle-schema fields and block incomplete requests', async () => {
      const client = new MLService();
      // Simulating a student profile that only has CGPA and Stream (Node current state)
      const incompletePayload = {
        CGPA: 8.5,
        Stream: 'Computer Science'
      };

      await expect(client.predictPlacement(incompletePayload)).rejects.toThrow(
        /Placement prediction payload is missing required fields/
      );
    });

    it('should succeed when all required fields are provided', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          prediction: 1,
          probability: 0.91
        })
      });

      const client = new MLService();
      const validPayload = {
        Age: 21,
        Internships: 1,
        CGPA: 8.2,
        Hostel: 1,
        HistoryOfBacklogs: 0,
        Stream: 'Information Technology'
      };

      const res = await client.predictPlacement(validPayload);
      expect(res.prediction).toBe(1);
      expect(res.probability).toBe(0.91);
    });
  });

  describe('8. Resilience & Error Normalization', () => {
    it('should normalize network connection failures (ECONNREFUSED) to 503 AppError', async () => {
      global.fetch = jest.fn().mockRejectedValue(new TypeError('fetch failed: connect ECONNREFUSED 127.0.0.1:8000'));

      const client = new MLService();
      await expect(client.checkHealth()).rejects.toMatchObject({
        statusCode: 503,
        message: expect.stringContaining('ML Service is currently unavailable')
      });
    });

    it('should normalize request timeout (AbortError) to 504 AppError', async () => {
      const abortErr = new Error('The operation was aborted');
      abortErr.name = 'AbortError';
      global.fetch = jest.fn().mockRejectedValue(abortErr);

      const client = new MLService();
      await expect(client.checkHealth()).rejects.toMatchObject({
        statusCode: 504,
        message: expect.stringContaining('timed out')
      });
    });

    it('should normalize FastAPI 422 validation errors to 422 AppError with field messages', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 422,
        json: async () => ({
          detail: [
            { loc: ['body', 'Age'], msg: 'field required' },
            { loc: ['body', 'CGPA'], msg: 'value is not a valid float' }
          ]
        })
      });

      const client = new MLService();
      const payload = {
        Age: 20,
        Internships: 0,
        CGPA: 8.0,
        Hostel: 0,
        HistoryOfBacklogs: 0,
        Stream: 'CS'
      };

      await expect(client.predictPlacement(payload)).rejects.toMatchObject({
        statusCode: 422,
        message: expect.stringContaining('body.Age: field required')
      });
    });

    it('should normalize upstream 401/403 to 502 Bad Gateway', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ detail: 'Unauthorized ML token' })
      });

      const client = new MLService();
      await expect(client.checkHealth()).rejects.toMatchObject({
        statusCode: 502,
        message: 'ML Service authentication failed.'
      });
    });

    it('should normalize upstream 500 server crash to 502 Bad Gateway without leaking stack trace', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({
          detail: 'Internal Python traceback: File "main.py", line 42, in error...'
        })
      });

      const client = new MLService();
      await expect(client.checkHealth()).rejects.toMatchObject({
        statusCode: 502,
        message: 'ML Service encountered an internal server error.'
      });
    });

    it('should normalize malformed non-JSON response (e.g. HTML 502 gateway page) to 502 AppError', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => {
          throw new SyntaxError('Unexpected token < in JSON at position 0');
        }
      });

      const client = new MLService();
      await expect(client.checkHealth()).rejects.toMatchObject({
        statusCode: 502,
        message: 'ML Service returned an unparseable response.'
      });
    });
  });

  describe('9. Security & Header Handling', () => {
    it('should attach X-API-Key and Authorization headers when apiKey is set', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ status: 'ok', service: 'SIPS ML Service' })
      });

      const client = new MLService({ apiKey: 'super-secure-token-99' });
      await client.checkHealth();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-API-Key': 'super-secure-token-99',
            'Authorization': 'Bearer super-secure-token-99'
          })
        })
      );
    });

    it('should redact ML API key and authorization tokens in logger', () => {
      const sanitized = logger.sanitize({
        mlServiceApiKey: 'super-secret-key',
        'x-api-key': 'another-key',
        apiKey: 'token-abc',
        normalField: 'visible-value'
      });

      expect(sanitized.mlServiceApiKey).toBe('[REDACTED]');
      expect(sanitized['x-api-key']).toBe('[REDACTED]');
      expect(sanitized.apiKey).toBe('[REDACTED]');
      expect(sanitized.normalField).toBe('visible-value');
    });
  });
});
