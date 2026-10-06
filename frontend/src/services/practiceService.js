import { practiceApi } from './practiceApi';

/**
 * Practice Platform Service
 * Encapsulates all communication with the Practice backend for student features.
 */
export const practiceService = {
  /**
   * Health probe / verification check
   */
  async checkHealth() {
    return practiceApi.get('/health');
  },

  /**
   * Discover available assessments / contests for the authenticated student's college
   */
  async getAvailableContests() {
    const res = await practiceApi.get('/api/contests/available');
    return res?.data || res || [];
  },

  /**
   * Get student-safe contest details prior to starting (includes sections, schedule, instructions, myAttempt)
   * @param {string} contestId
   */
  async getStudentContestDetails(contestId) {
    const res = await practiceApi.get(`/api/contests/${contestId}/student`);
    return res?.data || res;
  },

  /**
   * Start an official contest attempt with SIPS eligibility evaluation
   * @param {string} contestId
   */
  async startContestAttempt(contestId) {
    const res = await practiceApi.post(`/api/contests/${contestId}/attempts/start`);
    return res?.data || res;
  },

  /**
   * Get contest attempt details (used for resume/reconnect and timing sync)
   * @param {string} contestId
   * @param {string} attemptId
   */
  async getContestAttempt(contestId, attemptId) {
    const res = await practiceApi.get(`/api/contests/${contestId}/attempts/${attemptId}`);
    return res?.data || res;
  },

  /**
   * Get delivered questions and saved responses for an active contest attempt
   * @param {string} contestId
   * @param {string} attemptId
   */
  async getContestQuestions(contestId, attemptId) {
    const res = await practiceApi.get(`/api/contests/${contestId}/attempts/${attemptId}/questions`);
    return res?.data || res;
  },

  /**
   * Save / autosave student response for a contest question
   * @param {string} contestId
   * @param {string} attemptId
   * @param {object} payload - { questionVersionId, answerData }
   */
  async saveContestResponse(contestId, attemptId, { questionVersionId, answerData }) {
    const res = await practiceApi.post(`/api/contests/${contestId}/attempts/${attemptId}/responses`, {
      questionVersionId,
      answerData
    });
    return res?.data || res;
  },

  /**
   * Submit and finalize an official contest attempt with server scoring
   * @param {string} contestId
   * @param {string} attemptId
   */
  async submitContest(contestId, attemptId) {
    const res = await practiceApi.post(`/api/contests/${contestId}/attempts/${attemptId}/submit`);
    return res?.data || res;
  },

  /**
   * Finalize contest attempt (invoked on timer expiration)
   * @param {string} contestId
   * @param {string} attemptId
   */
  async finalizeContest(contestId, attemptId) {
    const res = await practiceApi.post(`/api/contests/${contestId}/attempts/${attemptId}/finalize`);
    return res?.data || res;
  },

  /**
   * Retrieve student scorecard and section performance breakdown
   * @param {string} contestId
   * @param {string} attemptId
   */
  async getContestResult(contestId, attemptId) {
    const res = await practiceApi.get(`/api/contests/${contestId}/attempts/${attemptId}/result`);
    return res?.data || res;
  },

  /**
   * Retrieve paginated contest leaderboard
   * @param {string} contestId
   * @param {object} params - { page, limit }
   */
  async getContestLeaderboard(contestId, { page = 1, limit = 20 } = {}) {
    const res = await practiceApi.get(`/api/contests/${contestId}/leaderboard?page=${page}&limit=${limit}`);
    return res?.data || res;
  },

  /**
   * Retrieve authenticated student's rank and standing in a contest
   * @param {string} contestId
   */
  async getMyContestRank(contestId) {
    const res = await practiceApi.get(`/api/contests/${contestId}/leaderboard/me`);
    return res?.data || res;
  },

  /**
   * Start a self-paced practice session
   * @param {object} params - { type, category, questionCount, questionId }
   */
  async createPracticeAttempt({ type, category, questionCount = 10, questionId } = {}) {
    const payload = { type, category, questionCount };
    if (questionId) payload.questionId = questionId;
    const res = await practiceApi.post('/api/practice/attempts', payload);
    return res?.data || res;
  },

  /**
   * Discover available coding questions
   * @param {object} filters - { category, difficulty }
   */
  async getCodingQuestions(filters = {}) {
    const params = new URLSearchParams();
    params.set('type', 'CODING');
    if (filters.category && filters.category !== 'ALL') params.set('category', filters.category);
    if (filters.difficulty && filters.difficulty !== 'ALL') params.set('difficulty', filters.difficulty);
    const queryString = params.toString();
    const res = await practiceApi.get(`/api/questions?${queryString}`);
    return res?.data || res || [];
  },

  /**
   * Get student's solved and attempted coding question IDs
   */
  async getCodingSolveStatus() {
    try {
      const res = await practiceApi.get('/api/practice/coding-status');
      return res?.data || res || { solvedQuestionIds: [], attemptedQuestionIds: [], totalSolved: 0, totalAttempted: 0 };
    } catch (e) {
      console.warn('Could not fetch coding solve status:', e);
      return { solvedQuestionIds: [], attemptedQuestionIds: [], totalSolved: 0, totalAttempted: 0 };
    }
  },

  /**
   * Get question details by ID (includes versions)
   */
  async getQuestionDetails(questionId) {
    const res = await practiceApi.get(`/api/questions/${questionId}`);
    return res?.data || res;
  },

  /**
   * Execute code against public sample tests (RUN)
   * @param {object} payload - { questionVersionId, language, sourceCode, practiceAttemptId, contestAttemptId }
   */
  async runCode({ questionVersionId, language, sourceCode, practiceAttemptId, contestAttemptId } = {}) {
    const payload = { questionVersionId, language, sourceCode };
    if (practiceAttemptId) payload.practiceAttemptId = practiceAttemptId;
    if (contestAttemptId) payload.contestAttemptId = contestAttemptId;
    const res = await practiceApi.post('/api/coding/execute/run', payload);
    return res?.data || res;
  },

  /**
   * Submit code against all public + hidden test cases (SUBMIT)
   * @param {object} payload - { questionVersionId, language, sourceCode, practiceAttemptId, contestAttemptId }
   */
  async submitCode({ questionVersionId, language, sourceCode, practiceAttemptId, contestAttemptId } = {}) {
    const payload = { questionVersionId, language, sourceCode };
    if (practiceAttemptId) payload.practiceAttemptId = practiceAttemptId;
    if (contestAttemptId) payload.contestAttemptId = contestAttemptId;
    const res = await practiceApi.post('/api/coding/execute/submit', payload);
    return res?.data || res;
  },

  /**
   * Retrieve submission status and test results by ID
   */
  async getSubmission(submissionId) {
    const res = await practiceApi.get(`/api/coding/submissions/${submissionId}`);
    return res?.data || res;
  },

  /**
   * Get practice attempt details
   */
  async getPracticeAttempt(attemptId) {
    const res = await practiceApi.get(`/api/practice/attempts/${attemptId}`);
    return res?.data || res;
  },

  /**
   * Retrieve delivered questions for an active practice attempt (Student-safe DTO)
   */
  async getDeliveredQuestions(attemptId) {
    const res = await practiceApi.get(`/api/practice/attempts/${attemptId}/questions`);
    return res?.data || res;
  },

  /**
   * Save candidate response for a question in an active attempt
   */
  async recordResponse(attemptId, { questionVersionId, answerData }) {
    const res = await practiceApi.post(`/api/practice/attempts/${attemptId}/responses`, {
      questionVersionId,
      answerData
    });
    return res?.data || res;
  },

  /**
   * Submit and finalize practice attempt with server-authoritative scoring
   */
  async submitPracticeAttempt(attemptId) {
    const res = await practiceApi.post(`/api/practice/attempts/${attemptId}/submit`);
    return res?.data || res;
  },

  /**
   * Retrieve finalized score breakdown and explanations after submission
   */
  async getPracticeResult(attemptId) {
    const res = await practiceApi.get(`/api/practice/attempts/${attemptId}/result`);
    return res?.data || res;
  },

  /**
   * Retrieve paginated practice history for the authenticated student
   * @param {object} params - { category, status, page, limit }
   */
  async getPracticeHistory({ category, status, page = 1, limit = 10 } = {}) {
    const params = new URLSearchParams();
    if (category && category !== 'ALL') params.set('category', category);
    if (status && status !== 'ALL') params.set('status', status);
    if (page) params.set('page', String(page));
    if (limit) params.set('limit', String(limit));
    const queryString = params.toString();
    const res = await practiceApi.get(`/api/practice/history${queryString ? `?${queryString}` : ''}`);
    return res?.data || res;
  },

  /**
   * Retrieve aggregated practice progress analytics for the authenticated student
   */
  async getPracticeProgress() {
    const res = await practiceApi.get('/api/practice/progress');
    return res?.data || res;
  },

  /**
   * Retrieve daily practice streak metrics for the authenticated student
   */
  async getPracticeStreak() {
    const res = await practiceApi.get('/api/practice/streak');
    return res?.data || res;
  },

  /**
   * =========================================================================
   * ADMIN QUESTION BANK MANAGEMENT APIs
   * =========================================================================
   */

  /**
   * Retrieve paginated questions list for admin portal with multi-criteria filters
   */
  async getAdminQuestions({ page = 1, limit = 20, search = '', type, category, difficulty, status, sourceType, sourceNamespace, scope } = {}) {
    const params = new URLSearchParams();
    if (page) params.set('page', String(page));
    if (limit) params.set('limit', String(limit));
    if (search && search.trim()) params.set('search', search.trim());
    if (type && type !== 'ALL') params.set('type', type);
    if (category && category !== 'ALL') params.set('category', category);
    if (difficulty && difficulty !== 'ALL') params.set('difficulty', difficulty);
    if (status && status !== 'ALL') params.set('status', status);
    if (sourceType && sourceType !== 'ALL') params.set('sourceType', sourceType);
    if (sourceNamespace && sourceNamespace !== 'ALL') params.set('sourceNamespace', sourceNamespace);
    if (scope && scope !== 'ALL') params.set('scope', scope);

    const queryString = params.toString();
    const res = await practiceApi.get(`/api/admin/questions${queryString ? `?${queryString}` : ''}`);
    return res;
  },

  /**
   * Retrieve full question details including all immutable versions and reference metrics
   */
  async getAdminQuestionById(questionId) {
    const res = await practiceApi.get(`/api/admin/questions/${questionId}`);
    return res?.data || res;
  },

  /**
   * Retrieve specific immutable version snapshot
   */
  async getAdminQuestionVersion(questionId, versionId) {
    const res = await practiceApi.get(`/api/admin/questions/${questionId}/versions/${versionId}`);
    return res?.data || res;
  },

  /**
   * Activate question (DRAFT -> ACTIVE)
   */
  async activateQuestion(questionId) {
    const res = await practiceApi.post(`/api/admin/questions/${questionId}/activate`);
    return res?.data || res;
  },

  /**
   * Archive question (ACTIVE -> ARCHIVED or DRAFT -> ARCHIVED)
   */
  async archiveQuestion(questionId) {
    const res = await practiceApi.post(`/api/admin/questions/${questionId}/archive`);
    return res?.data || res;
  },

  /**
   * Bulk import questions via JSON array
   * @param {Array<object>} items
   */
  async bulkImportQuestions(items) {
    const res = await practiceApi.post('/api/admin/questions/bulk-import', { items });
    return res?.data || res;
  },

  /**
   * =========================================================================
   * REUSABLE ASSESSMENTS & QUESTION SET ASSEMBLY APIs
   * =========================================================================
   */

  /**
   * Create a new draft assessment
   */
  async createAssessment(data) {
    const res = await practiceApi.post('/api/admin/assessments', data);
    return res?.data || res;
  },

  /**
   * List assessments with pagination & filters
   */
  async getAssessments({ page = 1, limit = 20, search = '', type, status, scope } = {}) {
    const params = new URLSearchParams();
    if (page) params.set('page', String(page));
    if (limit) params.set('limit', String(limit));
    if (search && search.trim()) params.set('search', search.trim());
    if (type && type !== 'ALL') params.set('type', type);
    if (status && status !== 'ALL') params.set('status', status);
    if (scope && scope !== 'ALL') params.set('scope', scope);

    const queryString = params.toString();
    const res = await practiceApi.get(`/api/admin/assessments${queryString ? `?${queryString}` : ''}`);
    return res;
  },

  /**
   * Get full assessment details with pinned questions & section breakdown
   */
  async getAssessmentById(assessmentId) {
    const res = await practiceApi.get(`/api/admin/assessments/${assessmentId}`);
    return res?.data || res;
  },

  /**
   * Add active QuestionVersion to assessment
   */
  async addQuestionToAssessment(assessmentId, payload) {
    const res = await practiceApi.post(`/api/admin/assessments/${assessmentId}/questions`, payload);
    return res?.data || res;
  },

  /**
   * Remove question from draft assessment
   */
  async removeQuestionFromAssessment(assessmentId, assessmentQuestionId) {
    const res = await practiceApi.delete(`/api/admin/assessments/${assessmentId}/questions/${assessmentQuestionId}`);
    return res?.data || res;
  },

  /**
   * Reorder questions within an assessment
   */
  async reorderAssessmentQuestions(assessmentId, questionOrders) {
    const res = await practiceApi.post(`/api/admin/assessments/${assessmentId}/questions/reorder`, {
      questionOrders
    });
    return res?.data || res;
  },

  /**
   * Publish assessment (locks against mutations)
   */
  async publishAssessment(assessmentId) {
    const res = await practiceApi.post(`/api/admin/assessments/${assessmentId}/publish`);
    return res?.data || res;
  },

  /**
   * Archive assessment
   */
  async archiveAssessment(assessmentId) {
    const res = await practiceApi.post(`/api/admin/assessments/${assessmentId}/archive`);
    return res?.data || res;
  },

  /**
   * Associate SIPS Placement Drive with Assessment
   */
  async associateDriveToAssessment(assessmentId, sipsDriveId) {
    const res = await practiceApi.post(`/api/admin/assessments/${assessmentId}/associate-drive`, {
      sipsDriveId
    });
    return res?.data || res;
  },

  /**
   * Disassociate SIPS Placement Drive from Assessment
   */
  async disassociateDriveFromAssessment(assessmentId) {
    const res = await practiceApi.post(`/api/admin/assessments/${assessmentId}/disassociate-drive`);
    return res?.data || res;
  },

  /**
   * =========================================================================
   * STUDENT ASSESSMENT RUNTIME APIs
   * =========================================================================
   */

  /**
   * Discover published assessments available to student
   */
  async getAvailableAssessments() {
    const res = await practiceApi.get('/api/assessments/available');
    return res?.data || res || [];
  },

  /**
   * Look up published assessment associated with a specific SIPS Placement Drive
   */
  async getAssessmentByDriveId(driveId) {
    try {
      const res = await practiceApi.get(`/api/assessments/by-drive/${encodeURIComponent(driveId)}`);
      return res?.data || null;
    } catch (_) {
      return null;
    }
  },

  /**
   * Get student-safe assessment details prior to starting
   */
  async getStudentAssessmentDetails(assessmentId) {
    const res = await practiceApi.get(`/api/assessments/${assessmentId}/student`);
    return res?.data || res;
  },

  /**
   * Start an official assessment attempt with eligibility verification
   */
  async startAssessmentAttempt(assessmentId) {
    const res = await practiceApi.post(`/api/assessments/${assessmentId}/attempts/start`);
    return res?.data || res;
  },

  /**
   * Get assessment attempt details (for resume/reconnect and timer sync)
   */
  async getAssessmentAttempt(assessmentId, attemptId) {
    const res = await practiceApi.get(`/api/assessments/${assessmentId}/attempts/${attemptId}`);
    return res?.data || res;
  },

  /**
   * Get delivered questions and saved responses for active attempt
   */
  async getAssessmentQuestions(assessmentId, attemptId) {
    const res = await practiceApi.get(`/api/assessments/${assessmentId}/attempts/${attemptId}/questions`);
    return res?.data || res;
  },

  /**
   * Autosave response for an assessment question
   */
  async saveAssessmentResponse(assessmentId, attemptId, { questionVersionId, answerData }) {
    const res = await practiceApi.post(`/api/assessments/${assessmentId}/attempts/${attemptId}/responses`, {
      questionVersionId,
      answerData
    });
    return res?.data || res;
  },

  /**
   * Submit and finalize assessment attempt
   */
  async submitAssessment(assessmentId, attemptId) {
    const res = await practiceApi.post(`/api/assessments/${assessmentId}/attempts/${attemptId}/submit`);
    return res?.data || res;
  },

  /**
   * Finalize assessment attempt on timer expiration
   */
  async finalizeAssessment(assessmentId, attemptId) {
    const res = await practiceApi.post(`/api/assessments/${assessmentId}/attempts/${attemptId}/finalize`);
    return res?.data || res;
  },

  /**
   * Retrieve student assessment scorecard and question-level breakdown
   */
  async getAssessmentResult(assessmentId, attemptId) {
    const res = await practiceApi.get(`/api/assessments/${assessmentId}/attempts/${attemptId}/result`);
    return res?.data || res;
  },

  /**
   * (Admin/Placement) Retrieve candidate results and leaderboard for an assessment
   */
  async getAssessmentResults(assessmentId, params = {}) {
    const res = await practiceApi.get(`/api/admin/assessments/${assessmentId}/results`, { params });
    return res?.data || res;
  },

  /**
   * (Admin/Placement) Retrieve individual candidate attempt details and scorecard
   */
  async getAssessmentCandidateDetail(assessmentId, attemptId) {
    const res = await practiceApi.get(`/api/admin/assessments/${assessmentId}/results/${attemptId}`);
    return res?.data || res;
  }
};



