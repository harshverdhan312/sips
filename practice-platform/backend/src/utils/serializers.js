/**
 * Serialization Layer for Security and Information Hiding
 * Ensures student-facing endpoints never expose correctAnswer, answer keys,
 * or hidden coding test cases.
 */

/**
 * Serialize a QuestionVersion for Student consumption
 * Excludes: correctAnswer, explanation (during practice), hidden test cases
 */
function serializeStudentQuestionVersion(version, questionMeta = null) {
  if (!version) return null;

  const result = {
    id: version.id,
    questionId: version.questionId,
    versionNumber: version.versionNumber,
    title: version.title,
    statement: version.statement,
    options: version.options || null,
    metadata: version.metadata || null
  };

  if (questionMeta) {
    result.type = questionMeta.type;
    result.format = questionMeta.format;
    result.category = questionMeta.category;
    result.subcategory = questionMeta.subcategory;
    result.difficulty = questionMeta.difficulty;
    result.sourceType = questionMeta.sourceType;
    result.sourceUrl = questionMeta.sourceUrl;
    result.attribution = questionMeta.attribution;
  } else if (version.question) {
    result.type = version.question.type;
    result.format = version.question.format;
    result.category = version.question.category;
    result.subcategory = version.question.subcategory;
    result.difficulty = version.question.difficulty;
    result.sourceType = version.question.sourceType;
    result.sourceUrl = version.question.sourceUrl;
    result.attribution = version.question.attribution;
  } else {
    result.type = version.type || 'APTITUDE';
    result.format = version.format || 'SINGLE_CHOICE';
  }

  // If coding problem is attached, serialize only public test cases
  if (version.codingProblem) {
    result.codingProblem = {
      id: version.codingProblem.id,
      inputFormat: version.codingProblem.inputFormat,
      outputFormat: version.codingProblem.outputFormat,
      constraints: version.codingProblem.constraints,
      timeLimitMs: version.codingProblem.timeLimitMs,
      memoryLimitKb: version.codingProblem.memoryLimitKb,
      maxMarks: Number(version.codingProblem.maxMarks),
      testCases: (version.codingProblem.testCases || [])
        .filter((tc) => !tc.isHidden)
        .map((tc) => ({
          id: tc.id,
          input: tc.input,
          expectedOutput: tc.expectedOutput,
          order: tc.order,
          isHidden: false
        }))
    };
  }

  return result;
}

/**
 * Serialize a QuestionVersion for Admin/Internal consumption
 * Includes all fields: correctAnswer, explanation, hidden test cases with weights
 */
function serializeAdminQuestionVersion(version) {
  if (!version) return null;

  return {
    id: version.id,
    questionId: version.questionId,
    versionNumber: version.versionNumber,
    title: version.title,
    statement: version.statement,
    options: version.options,
    correctAnswer: version.correctAnswer,
    explanation: version.explanation,
    metadata: version.metadata,
    createdAt: version.createdAt,
    updatedAt: version.updatedAt,
    question: version.question || undefined,
    codingProblem: version.codingProblem
      ? {
          id: version.codingProblem.id,
          inputFormat: version.codingProblem.inputFormat,
          outputFormat: version.codingProblem.outputFormat,
          constraints: version.codingProblem.constraints,
          timeLimitMs: version.codingProblem.timeLimitMs,
          memoryLimitKb: version.codingProblem.memoryLimitKb,
          maxMarks: Number(version.codingProblem.maxMarks),
          createdAt: version.codingProblem.createdAt,
          updatedAt: version.codingProblem.updatedAt,
          testCases: (version.codingProblem.testCases || []).map((tc) => ({
            id: tc.id,
            input: tc.input,
            expectedOutput: tc.expectedOutput,
            weight: Number(tc.weight),
            isHidden: tc.isHidden,
            order: tc.order,
            createdAt: tc.createdAt
          }))
        }
      : null
  };
}

/**
 * Serialize CodeSubmission and its test results for student vs admin
 * @param {object} submission
 * @param {{ isAdmin?: boolean }} options
 */
function serializeCodeSubmissionResponse(submission, { isAdmin = false } = {}) {
  if (!submission) return null;

  const base = {
    id: submission.id,
    questionVersionId: submission.questionVersionId,
    practiceAttemptId: submission.practiceAttemptId,
    contestAttemptId: submission.contestAttemptId,
    assessmentAttemptId: submission.assessmentAttemptId,
    mode: submission.mode,
    language: submission.language,
    sourceCode: submission.sourceCode,
    status: submission.status,
    testsPassed: submission.testsPassed,
    testsTotal: submission.testsTotal,
    earnedMarks: Number(submission.earnedMarks),
    executionTimeMs: submission.executionTimeMs,
    memoryUsedKb: submission.memoryUsedKb,
    compileOutput: submission.compileOutput,
    submittedAt: submission.submittedAt,
    createdAt: submission.createdAt
  };

  const results = (submission.testResults || []).map((tr, index) => {
    const isHidden = Boolean(tr.isHidden || (tr.testCase && tr.testCase.isHidden));

    if (isAdmin) {
      return {
        id: tr.id,
        testCaseId: tr.testCaseId,
        judge0Token: tr.judge0Token,
        order: tr.order || index + 1,
        status: tr.status,
        passed: tr.passed,
        executionTimeMs: tr.executionTimeMs,
        memoryUsedKb: tr.memoryUsedKb,
        input: tr.testCase ? tr.testCase.input : tr.input,
        expectedOutput: tr.testCase ? tr.testCase.expectedOutput : tr.expectedOutput,
        stdout: tr.stdout,
        stderr: tr.stderr,
        compileOutput: tr.compileOutput,
        earnedWeight: Number(tr.earnedWeight),
        isHidden
      };
    }

    // Student view: Scrub hidden test data
    if (isHidden) {
      return {
        id: tr.id,
        order: tr.order || index + 1,
        status: tr.status,
        passed: tr.passed,
        executionTimeMs: tr.executionTimeMs,
        memoryUsedKb: tr.memoryUsedKb,
        earnedWeight: Number(tr.earnedWeight),
        isHidden: true
      };
    }

    // Public test case view
    return {
      id: tr.id,
      order: tr.order || index + 1,
      status: tr.status,
      passed: tr.passed,
      executionTimeMs: tr.executionTimeMs,
      memoryUsedKb: tr.memoryUsedKb,
      input: tr.testCase ? tr.testCase.input : undefined,
      expectedOutput: tr.testCase ? tr.testCase.expectedOutput : undefined,
      stdout: tr.stdout,
      stderr: tr.stderr,
      compileOutput: tr.compileOutput,
      earnedWeight: Number(tr.earnedWeight),
      isHidden: false
    };
  });

  return {
    ...base,
    testResults: results
  };
}

/**
 * Serialize ContestQuestion with its embedded QuestionVersion
 */
function serializeContestQuestion(cq, { isAdmin = false } = {}) {
  if (!cq) return null;

  return {
    id: cq.id,
    contestId: cq.contestId,
    questionVersionId: cq.questionVersionId,
    section: cq.section,
    order: cq.order,
    marks: Number(cq.marks),
    negativeMarks: Number(cq.negativeMarks),
    createdAt: cq.createdAt,
    questionVersion: cq.questionVersion
      ? isAdmin
        ? serializeAdminQuestionVersion(cq.questionVersion)
        : serializeStudentQuestionVersion(cq.questionVersion)
      : undefined
  };
}

/**
 * Serialize Contest summary or detailed object
 */
function serializeContest(contest, { isAdmin = false, includeQuestions = true } = {}) {
  if (!contest) return null;

  const questions = contest.questions || [];
  const totalQuestions = questions.length || (contest._count ? contest._count.questions : 0);
  const totalMarks = questions.reduce((sum, q) => sum + Number(q.marks || 0), 0);

  const sectionBreakdown = questions.reduce(
    (acc, q) => {
      const sec = q.section;
      if (acc[sec]) {
        acc[sec].count += 1;
        acc[sec].marks += Number(q.marks || 0);
      }
      return acc;
    },
    {
      CODING: { count: 0, marks: 0 },
      APTITUDE: { count: 0, marks: 0 },
      TECHNICAL: { count: 0, marks: 0 }
    }
  );

  const res = {
    id: contest.id,
    sipsDriveId: contest.sipsDriveId,
    collegeId: contest.collegeId,
    title: contest.title,
    description: contest.description,
    instructions: contest.instructions,
    startAt: contest.startAt,
    endAt: contest.endAt,
    durationMinutes: contest.durationMinutes,
    status: contest.status,
    createdBy: contest.createdBy,
    createdAt: contest.createdAt,
    updatedAt: contest.updatedAt,
    totalQuestions,
    totalMarks,
    sectionBreakdown,
    attemptCount: contest._count ? contest._count.attempts : (contest.attempts ? contest.attempts.length : 0)
  };

  if (includeQuestions && contest.questions) {
    res.questions = contest.questions.map((q) => serializeContestQuestion(q, { isAdmin }));
  }

  return res;
}

/**
 * Serialize Contest summary for Student view
 */
function serializeStudentContest(contest) {
  if (!contest) return null;

  const questions = contest.questions || [];
  const totalQuestions = questions.length || (contest._count ? contest._count.questions : 0);
  const totalMarks = questions.reduce((sum, q) => sum + Number(q.marks || 0), 0);

  const sectionBreakdown = questions.reduce(
    (acc, q) => {
      const sec = q.section;
      if (acc[sec]) {
        acc[sec].count += 1;
        acc[sec].marks += Number(q.marks || 0);
      }
      return acc;
    },
    {
      CODING: { count: 0, marks: 0 },
      APTITUDE: { count: 0, marks: 0 },
      TECHNICAL: { count: 0, marks: 0 }
    }
  );

  return {
    id: contest.id,
    title: contest.title,
    description: contest.description,
    instructions: contest.instructions,
    startAt: contest.startAt,
    endAt: contest.endAt,
    durationMinutes: contest.durationMinutes,
    status: contest.status,
    sipsDriveId: contest.sipsDriveId,
    collegeId: contest.collegeId,
    totalQuestions,
    totalMarks,
    sectionBreakdown
  };
}

/**
 * Serialize ContestAttempt for Student consumption
 */
function serializeContestAttempt(attempt, { remainingMs = null, effectiveDeadline = null } = {}) {
  if (!attempt) return null;

  return {
    id: attempt.id,
    contestId: attempt.contestId,
    studentId: attempt.studentId,
    collegeId: attempt.collegeId,
    status: attempt.status,
    startedAt: attempt.startedAt,
    submittedAt: attempt.submittedAt,
    effectiveDeadline: effectiveDeadline || attempt.effectiveDeadline,
    remainingMs: remainingMs !== null ? remainingMs : attempt.remainingMs,
    totalMarks: Number(attempt.totalMarks || 0),
    totalScore: attempt.status === 'SUBMITTED' ? Number(attempt.totalScore || 0) : undefined,
    responseCount: attempt._count ? attempt._count.responses : (attempt.responses ? attempt.responses.length : 0),
    createdAt: attempt.createdAt,
    updatedAt: attempt.updatedAt
  };
}

/**
 * Serialize ContestQuestion strictly for Student delivery during contest attempt
 */
function serializeContestQuestionForStudent(cq) {
  if (!cq) return null;

  return {
    id: cq.id,
    contestId: cq.contestId,
    questionVersionId: cq.questionVersionId,
    section: cq.section,
    order: cq.order,
    marks: Number(cq.marks),
    negativeMarks: Number(cq.negativeMarks),
    questionVersion: cq.questionVersion ? serializeStudentQuestionVersion(cq.questionVersion) : undefined
  };
}

/**
 * Serialize QuestionResponse for student view
 */
function serializeContestResponse(response) {
  if (!response) return null;

  return {
    id: response.id,
    contestAttemptId: response.contestAttemptId,
    questionVersionId: response.questionVersionId,
    answerData: response.answerData,
    answeredAt: response.answeredAt
  };
}

/**
 * Serialize Assessment summary for Student view
 */
function serializeStudentAssessment(assessment) {
  if (!assessment) return null;

  const questions = assessment.questions || [];
  const totalQuestions = questions.length || (assessment._count ? assessment._count.questions : 0);
  const totalMarks = Number(assessment.totalMarks || questions.reduce((sum, q) => sum + Number(q.marks || 0), 0));

  const sectionBreakdown = questions.reduce(
    (acc, q) => {
      const sec = q.section;
      if (acc[sec]) {
        acc[sec].count += 1;
        acc[sec].marks += Number(q.marks || 0);
      }
      return acc;
    },
    {
      CODING: { count: 0, marks: 0 },
      APTITUDE: { count: 0, marks: 0 },
      TECHNICAL: { count: 0, marks: 0 }
    }
  );

  return {
    id: assessment.id,
    title: assessment.title,
    description: assessment.description,
    type: assessment.type,
    status: assessment.status,
    collegeId: assessment.collegeId,
    durationMinutes: assessment.durationMinutes,
    totalMarks,
    sipsDriveId: assessment.sipsDriveId,
    totalQuestions,
    sectionBreakdown
  };
}

/**
 * Serialize AssessmentAttempt for Student consumption
 */
function serializeAssessmentAttempt(attempt, { remainingMs = null, effectiveDeadline = null } = {}) {
  if (!attempt) return null;

  return {
    id: attempt.id,
    assessmentId: attempt.assessmentId,
    studentId: attempt.studentId,
    collegeId: attempt.collegeId,
    status: attempt.status,
    startedAt: attempt.startedAt,
    submittedAt: attempt.submittedAt,
    finalizedAt: attempt.finalizedAt,
    effectiveDeadline: effectiveDeadline || attempt.effectiveDeadline,
    remainingMs: remainingMs !== null ? remainingMs : attempt.remainingMs,
    totalMarks: Number(attempt.totalMarks || 0),
    totalScore: ['SUBMITTED', 'FINALIZED', 'TIMED_OUT'].includes(attempt.status) ? Number(attempt.totalScore || 0) : undefined,
    aptitudeScore: ['SUBMITTED', 'FINALIZED', 'TIMED_OUT'].includes(attempt.status) ? Number(attempt.aptitudeScore || 0) : undefined,
    technicalScore: ['SUBMITTED', 'FINALIZED', 'TIMED_OUT'].includes(attempt.status) ? Number(attempt.technicalScore || 0) : undefined,
    codingScore: ['SUBMITTED', 'FINALIZED', 'TIMED_OUT'].includes(attempt.status) ? Number(attempt.codingScore || 0) : undefined,
    responseCount: attempt._count ? attempt._count.responses : (attempt.responses ? attempt.responses.length : 0),
    createdAt: attempt.createdAt,
    updatedAt: attempt.updatedAt
  };
}

/**
 * Serialize AssessmentQuestion strictly for Student delivery during assessment attempt
 */
function serializeAssessmentQuestionForStudent(aq) {
  if (!aq) return null;

  return {
    id: aq.id,
    assessmentId: aq.assessmentId,
    questionVersionId: aq.questionVersionId,
    section: aq.section,
    order: aq.order,
    marks: Number(aq.marks),
    negativeMarks: Number(aq.negativeMarks),
    questionVersion: aq.questionVersion ? serializeStudentQuestionVersion(aq.questionVersion) : undefined
  };
}

/**
 * Serialize AssessmentResponse for student view
 */
function serializeAssessmentResponse(response) {
  if (!response) return null;

  return {
    id: response.id,
    assessmentAttemptId: response.assessmentAttemptId,
    assessmentQuestionId: response.assessmentQuestionId,
    questionVersionId: response.questionVersionId,
    answerData: response.answerData,
    answeredAt: response.answeredAt
  };
}

module.exports = {
  serializeStudentQuestionVersion,
  serializeAdminQuestionVersion,
  serializeCodeSubmissionResponse,
  serializeContestQuestion,
  serializeContest,
  serializeStudentContest,
  serializeContestAttempt,
  serializeContestQuestionForStudent,
  serializeContestResponse,
  serializeStudentAssessment,
  serializeAssessmentAttempt,
  serializeAssessmentQuestionForStudent,
  serializeAssessmentResponse
};


