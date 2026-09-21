const config = require('../config');
const AppError = require('../utils/appError');
const logger = require('../utils/logger');

/**
 * Centralized ML Service HTTP Client
 * Provides an isolated integration boundary between Node.js backend and FastAPI ML service.
 */
class MLService {
  constructor(options = {}) {
    this.baseUrl = (options.baseUrl || config.mlServiceUrl || 'http://127.0.0.1:8000').replace(/\/+$/, '');
    this.timeoutMs = options.timeoutMs || config.mlServiceTimeoutMs || 5000;
    this.apiKey = options.apiKey !== undefined ? options.apiKey : (config.mlServiceApiKey || '');
  }

  /**
   * Internal request dispatcher with timeout and error normalization
   */
  async _request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), options.timeoutMs || this.timeoutMs);

    const headers = {
      ...(options.headers || {})
    };

    // Attach API key header if configured
    if (this.apiKey) {
      headers['X-API-Key'] = this.apiKey;
      if (!headers['Authorization']) {
        headers['Authorization'] = `Bearer ${this.apiKey}`;
      }
    }

    try {
      const response = await fetch(url, {
        method: options.method || 'GET',
        headers,
        body: options.body,
        signal: controller.signal
      });

      // Handle non-2xx HTTP responses
      if (!response.ok) {
        let errorData = null;
        try {
          errorData = await response.json();
        } catch {
          // Non-JSON response body (e.g. proxy HTML error page)
          errorData = null;
        }

        const detail = errorData && errorData.detail;
        let errorMessage = 'ML Service request failed';

        if (typeof detail === 'string') {
          errorMessage = detail;
        } else if (Array.isArray(detail)) {
          // FastAPI pydantic validation error format
          errorMessage = detail.map(d => `${d.loc ? d.loc.join('.') : 'field'}: ${d.msg}`).join(', ');
        } else if (errorData && errorData.message) {
          errorMessage = errorData.message;
        }

        if (response.status === 422 || response.status === 400) {
          throw new AppError(`ML Service validation error: ${errorMessage}`, 422);
        } else if (response.status === 401 || response.status === 403) {
          throw new AppError('ML Service authentication failed.', 502);
        } else if (response.status === 404) {
          throw new AppError('ML Service endpoint not found.', 502);
        } else if (response.status >= 500) {
          throw new AppError('ML Service encountered an internal server error.', 502);
        } else {
          throw new AppError(`ML Service error (${response.status}): ${errorMessage}`, response.status);
        }
      }

      // Parse JSON response body
      try {
        return await response.json();
      } catch (jsonErr) {
        logger.error('Failed to parse ML service response as JSON:', { endpoint, error: jsonErr.message });
        throw new AppError('ML Service returned an unparseable response.', 502);
      }
    } catch (err) {
      if (err.name === 'AbortError' || err.name === 'TimeoutError') {
        throw new AppError('ML Service request timed out.', 504);
      }
      if (err instanceof AppError) {
        throw err;
      }
      // Connection refused, DNS lookup failure, or fetch network error
      logger.error('ML Service network connection failed:', { endpoint, message: err.message });
      throw new AppError('ML Service is currently unavailable. Please try again later.', 503);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Health Check
   * GET /health
   */
  async checkHealth() {
    const data = await this._request('/health', { method: 'GET' });
    if (!data || typeof data !== 'object') {
      throw new AppError('ML Service health check returned invalid payload.', 502);
    }
    return {
      status: data.status || 'unknown',
      service: data.service || 'ML Service'
    };
  }

  /**
   * Extract skills from a PDF resume
   * POST /resume/extract (multipart/form-data with 'file')
   */
  async extractResumeSkills(pdfBuffer, filename = 'resume.pdf') {
    if (!pdfBuffer || !Buffer.isBuffer(pdfBuffer)) {
      throw new AppError('A valid PDF buffer is required for resume skill extraction.', 400);
    }

    const formData = new FormData();
    const blob = new Blob([pdfBuffer], { type: 'application/pdf' });
    formData.append('file', blob, filename);

    const data = await this._request('/resume/extract', {
      method: 'POST',
      body: formData
    });

    if (!data || typeof data !== 'object' || !Array.isArray(data.skills)) {
      throw new AppError('ML Service returned invalid resume extraction schema.', 502);
    }

    return {
      skills: data.skills,
      raw_text: data.raw_text || ''
    };
  }

  /**
   * Match student skills against job required skills (deterministic keyword overlap)
   * POST /resume/match
   */
  async matchResumeSkills(studentSkills = [], requiredSkills = []) {
    if (!Array.isArray(studentSkills) || !Array.isArray(requiredSkills)) {
      throw new AppError('studentSkills and requiredSkills must be arrays.', 400);
    }

    const data = await this._request('/resume/match', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        student_skills: studentSkills,
        required_skills: requiredSkills
      })
    });

    if (!data || typeof data !== 'object' || typeof data.match_score !== 'number') {
      throw new AppError('ML Service returned invalid skill match schema.', 502);
    }

    return {
      match_score: data.match_score,
      matching_skills: Array.isArray(data.matching_skills) ? data.matching_skills : [],
      missing_skills: Array.isArray(data.missing_skills) ? data.missing_skills : []
    };
  }

  /**
   * Semantic embedding matching of student skills against job description text
   * POST /resume/semantic-match
   */
  async semanticMatchResume(studentSkills = [], jobText = '') {
    if (!Array.isArray(studentSkills)) {
      throw new AppError('studentSkills must be an array.', 400);
    }

    const data = await this._request('/resume/semantic-match', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        student_skills: studentSkills,
        job_text: String(jobText || '')
      })
    });

    if (!data || typeof data !== 'object' || typeof data.semantic_score !== 'number') {
      throw new AppError('ML Service returned invalid semantic match schema.', 502);
    }

    return {
      semantic_score: data.semantic_score
    };
  }

  /**
   * Hybrid matching combining keyword overlap and semantic embeddings
   * POST /resume/hybrid-match
   */
  async hybridMatchResume({
    studentSkills = [],
    requiredSkills = [],
    resumeText = '',
    jobText = '',
    skillWeight = 0.6,
    semanticWeight = 0.4
  } = {}) {
    const data = await this._request('/resume/hybrid-match', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        student_skills: studentSkills,
        required_skills: requiredSkills,
        resume_text: resumeText,
        job_text: jobText,
        skill_weight: skillWeight,
        semantic_weight: semanticWeight
      })
    });

    if (!data || typeof data !== 'object' || typeof data.hybrid_score !== 'number') {
      throw new AppError('ML Service returned invalid hybrid match schema.', 502);
    }

    return data;
  }

  /**
   * Mock interview transcript & speech analysis
   * POST /interview/analyze
   */
  async analyzeInterview({ transcript = '', audioBuffer = null, audioFilename = 'audio.wav' } = {}) {
    const formData = new FormData();
    formData.append('transcript', transcript);

    if (audioBuffer && Buffer.isBuffer(audioBuffer)) {
      const blob = new Blob([audioBuffer], { type: 'audio/wav' });
      formData.append('audio', blob, audioFilename);
    }

    const data = await this._request('/interview/analyze', {
      method: 'POST',
      body: formData
    });

    if (!data || typeof data !== 'object') {
      throw new AppError('ML Service returned invalid interview analysis schema.', 502);
    }

    return data;
  }

  /**
   * Placement probability prediction (Pydantic model input)
   * POST /placement/predict
   * Expected: { Age, Internships, CGPA, Hostel, HistoryOfBacklogs, Stream }
   */
  async predictPlacement(payload = {}) {
    const requiredFields = ['Age', 'Internships', 'CGPA', 'Hostel', 'HistoryOfBacklogs', 'Stream'];
    const missing = requiredFields.filter(f => payload[f] === undefined || payload[f] === null);

    if (missing.length > 0) {
      throw new AppError(
        `Placement prediction payload is missing required fields: ${missing.join(', ')}.`,
        422
      );
    }

    const data = await this._request('/placement/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!data || typeof data !== 'object') {
      throw new AppError('ML Service returned invalid placement prediction schema.', 502);
    }

    // Support FastAPI response format (placement_probability, predicted_class, predicted_label)
    const hasProbability = typeof data.placement_probability === 'number' || typeof data.probability === 'number';
    const hasClass = typeof data.predicted_class === 'number' || typeof data.prediction === 'number';

    if (!hasProbability && !hasClass) {
      throw new AppError('ML Service returned invalid placement prediction schema.', 502);
    }

    const placementProbability = typeof data.placement_probability === 'number'
      ? data.placement_probability
      : (typeof data.probability === 'number' ? data.probability : (data.prediction === 1 ? 1.0 : 0.0));

    const predictedClass = typeof data.predicted_class === 'number'
      ? data.predicted_class
      : (typeof data.prediction === 'number' ? data.prediction : (placementProbability >= (data.decision_threshold || 0.5) ? 1 : 0));

    const decisionThreshold = typeof data.decision_threshold === 'number' ? data.decision_threshold : 0.5;
    const predictedLabel = data.predicted_label || (predictedClass === 1 ? 'Placed' : 'Not Placed');
    const modelVersion = data.model_version || '1.0.0';

    return {
      placement_probability: placementProbability,
      decision_threshold: decisionThreshold,
      predicted_class: predictedClass,
      predicted_label: predictedLabel,
      model_version: modelVersion,
      prediction: predictedClass,
      probability: placementProbability
    };
  }
}

module.exports = new MLService();
module.exports.MLService = MLService;
