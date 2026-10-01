const prisma = require('../utils/prisma');
const config = require('../config');
const AppError = require('../utils/appError');
const judge0Service = require('./judge0Service');
const { compareCodeOutputs } = require('../utils/evaluator');
const { serializeCodeSubmissionResponse } = require('../utils/serializers');

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Code Execution Service
 * Orchestrates RUN and SUBMIT workflows against Judge0.
 */

async function executeCode(payload, { isAdmin = false } = {}) {
  const {
    studentId,
    questionVersionId,
    practiceAttemptId,
    contestAttemptId,
    language,
    sourceCode,
    mode = 'RUN'
  } = payload;

  // 1. Basic Parameter Validations
  if (!studentId || typeof studentId !== 'string' || !studentId.trim()) {
    throw new AppError('studentId is required', 400);
  }

  if (!questionVersionId || typeof questionVersionId !== 'string') {
    throw new AppError('questionVersionId is required', 400);
  }

  if (!sourceCode || typeof sourceCode !== 'string' || !sourceCode.trim()) {
    throw new AppError('sourceCode is required', 400);
  }

  const sourceSizeBytes = Buffer.byteLength(sourceCode, 'utf8');
  if (sourceSizeBytes > config.limits.maxSourceCodeSizeKb * 1024) {
    throw new AppError(
      `Source code size (${Math.round(sourceSizeBytes / 1024)} KB) exceeds the maximum limit of ${config.limits.maxSourceCodeSizeKb} KB`,
      400
    );
  }

  if (!judge0Service.isLanguageSupported(language)) {
    throw new AppError(
      `Unsupported language '${language}'. Supported languages: ${Object.keys(judge0Service.LANGUAGE_MAP).join(', ')}`,
      400
    );
  }

  const executionMode = mode === 'SUBMIT' ? 'SUBMIT' : 'RUN';

  // 2. Validate QuestionVersion and CodingProblem
  const version = await prisma.questionVersion.findUnique({
    where: { id: questionVersionId },
    include: {
      question: true,
      codingProblem: {
        include: {
          testCases: {
            orderBy: { order: 'asc' }
          }
        }
      }
    }
  });

  if (!version) {
    throw new AppError(`QuestionVersion not found with id: ${questionVersionId}`, 404);
  }

  if (version.question.type !== 'CODING' || !version.codingProblem) {
    throw new AppError(
      `QuestionVersion ${questionVersionId} is not a valid CODING problem`,
      400
    );
  }

  const codingProblem = version.codingProblem;
  let maxMarks = Number(codingProblem.maxMarks);

  // 3. Validate Attempt Context (XOR Rule & Status Verification)
  if (executionMode === 'SUBMIT') {
    if (!practiceAttemptId && !contestAttemptId) {
      throw new AppError('Official SUBMIT requires either practiceAttemptId or contestAttemptId', 400);
    }
    if (practiceAttemptId && contestAttemptId) {
      throw new AppError('Cannot submit to both practiceAttempt and contestAttempt simultaneously', 400);
    }
  }

  if (practiceAttemptId) {
    const practiceAttempt = await prisma.practiceAttempt.findUnique({
      where: { id: practiceAttemptId }
    });

    if (!practiceAttempt) {
      throw new AppError(`PracticeAttempt not found with id: ${practiceAttemptId}`, 404);
    }

    if (practiceAttempt.studentId !== studentId.trim()) {
      throw new AppError('Unauthorized: PracticeAttempt belongs to another student', 403);
    }

    if (practiceAttempt.status !== 'IN_PROGRESS') {
      throw new AppError(`Cannot execute code. PracticeAttempt is ${practiceAttempt.status}`, 409);
    }

    // Verify question belongs to delivered attempt
    const responseRecord = await prisma.questionResponse.findFirst({
      where: {
        practiceAttemptId,
        questionVersionId
      }
    });

    if (!responseRecord) {
      throw new AppError('This coding problem does not belong to the specified practice attempt', 404);
    }
  }

  if (contestAttemptId) {
    const contestAttempt = await prisma.contestAttempt.findUnique({
      where: { id: contestAttemptId },
      include: {
        contest: true
      }
    });

    if (!contestAttempt) {
      throw new AppError(`ContestAttempt not found with id: ${contestAttemptId}`, 404);
    }

    if (contestAttempt.studentId !== studentId.trim()) {
      throw new AppError('Unauthorized: ContestAttempt belongs to another student', 403);
    }

    if (contestAttempt.status !== 'IN_PROGRESS') {
      throw new AppError(`Cannot execute code. ContestAttempt is ${contestAttempt.status}`, 409);
    }

    if (contestAttempt.contest.status === 'CANCELLED') {
      throw new AppError('Cannot execute code. Contest has been cancelled', 400);
    }

    // Verify deadline
    const contestEndMs = new Date(contestAttempt.contest.endAt).getTime();
    const attemptStartMs = new Date(contestAttempt.startedAt).getTime();
    const durationMs = (contestAttempt.contest.durationMinutes || 0) * 60 * 1000;
    const effectiveDeadlineMs = Math.min(contestEndMs, attemptStartMs + durationMs);

    if (Date.now() > effectiveDeadlineMs) {
      await prisma.contestAttempt.update({
        where: { id: contestAttemptId },
        data: { status: 'TIMED_OUT' }
      });
      throw new AppError('Contest attempt deadline has passed. Execution rejected.', 400, {
        code: 'ATTEMPT_TIMED_OUT'
      });
    }

    // Verify question belongs to contest and obtain contestQuestion.marks
    const contestQuestion = await prisma.contestQuestion.findUnique({
      where: {
        contestId_questionVersionId: {
          contestId: contestAttempt.contestId,
          questionVersionId
        }
      }
    });

    if (!contestQuestion) {
      throw new AppError('This coding problem does not belong to the specified contest', 404);
    }

    // Override maxMarks with contestQuestion.marks for contest execution
    maxMarks = Number(contestQuestion.marks);
  }

  // 4. Select Server-Controlled Test Cases
  let selectedTestCases = [];
  if (executionMode === 'RUN') {
    // RUN mode: Public sample test cases ONLY
    selectedTestCases = codingProblem.testCases.filter((tc) => !tc.isHidden);
  } else {
    // SUBMIT mode: ALL test cases (Public + Hidden)
    selectedTestCases = codingProblem.testCases;
  }

  if (selectedTestCases.length === 0) {
    throw new AppError(
      executionMode === 'RUN'
        ? 'No public test cases configured for this coding problem'
        : 'No test cases configured for this coding problem',
      400
    );
  }

  // 5. Compute Execution Limits
  const timeLimitMs = Math.min(codingProblem.timeLimitMs, config.limits.maxExecutionTimeMs);
  const cpuTimeLimitSec = Math.max(1, Math.ceil(timeLimitMs / 1000));
  const memoryLimitKb = Math.min(codingProblem.memoryLimitKb, config.limits.maxMemoryLimitKb);
  const judge0LangId = judge0Service.getLanguageId(language);

  // 6. Create Parent CodeSubmission record in Database
  const submission = await prisma.codeSubmission.create({
    data: {
      studentId: studentId.trim(),
      questionVersionId,
      practiceAttemptId: practiceAttemptId || null,
      contestAttemptId: contestAttemptId || null,
      mode: executionMode,
      language: language.toLowerCase().trim(),
      sourceCode,
      status: 'RUNNING',
      testsPassed: 0,
      testsTotal: selectedTestCases.length,
      earnedMarks: 0.0
    }
  });

  // 7. Dispatch Batch to Judge0
  const batchPayload = selectedTestCases.map((tc) => ({
    source_code: sourceCode,
    language_id: judge0LangId,
    stdin: tc.input,
    expected_output: tc.expectedOutput,
    cpu_time_limit: cpuTimeLimitSec,
    memory_limit: memoryLimitKb
  }));

  const tokenResults = await judge0Service.submitBatch(batchPayload);

  // 8. Create CodeSubmissionTestResult placeholder records
  const createdTestResults = [];
  for (let i = 0; i < selectedTestCases.length; i++) {
    const tc = selectedTestCases[i];
    const tokenObj = tokenResults[i] || {};
    const tr = await prisma.codeSubmissionTestResult.create({
      data: {
        submissionId: submission.id,
        testCaseId: tc.id,
        judge0Token: tokenObj.token || null,
        status: 'RUNNING',
        passed: false,
        earnedWeight: 0.0,
        order: tc.order,
        isHidden: tc.isHidden
      }
    });
    createdTestResults.push({ ...tr, testCase: tc });
  }

  // 9. Poll Judge0 for Results
  const tokensToPoll = tokenResults.map((t) => t.token).filter(Boolean);
  let pollAttempts = 0;
  let finishedResults = [];

  while (pollAttempts < config.executionPollMaxRetries && tokensToPoll.length > 0) {
    pollAttempts++;
    const polled = await judge0Service.pollBatch(tokensToPoll);

    const allFinished = polled.length === tokensToPoll.length &&
      polled.every((p) => p && p.status_id > 2); // status_id > 2 means finished (Accepted, WA, CE, etc.)

    if (allFinished) {
      finishedResults = polled;
      break;
    }

    await delay(config.executionPollIntervalMs);
    finishedResults = polled;
  }

  // Map tokens to results
  const resultMap = new Map();
  for (const item of finishedResults) {
    if (item && item.token) {
      resultMap.set(item.token, item);
    }
  }

  // 10. Check Compilation Error Short-Circuit
  let compilationError = null;
  for (const tr of createdTestResults) {
    const rawRes = resultMap.get(tr.judge0Token);
    if (rawRes && (rawRes.status_id === 6 || (rawRes.compile_output && rawRes.compile_output.trim()))) {
      compilationError = rawRes.compile_output || 'Compilation Error';
      break;
    }
  }

  // 11. Process and Persist Each Test Result
  let testsPassedCount = 0;
  let totalWeightSum = 0.0;
  let earnedWeightSum = 0.0;
  let maxExecutionTime = 0;
  let maxMemoryUsed = 0;
  let hasTimeout = false;
  let hasRuntimeError = false;
  let hasMemoryLimit = false;

  const finalTestResults = [];

  for (let i = 0; i < createdTestResults.length; i++) {
    const tr = createdTestResults[i];
    const tc = tr.testCase;
    const raw = resultMap.get(tr.judge0Token) || {};

    const testWeight = Number(tc.weight);
    totalWeightSum += testWeight;

    let testStatus = 'WRONG_ANSWER';
    let testPassed = false;
    let earnedWeight = 0.0;

    const timeTakenMs = raw.time ? Math.round(parseFloat(raw.time) * 1000) : 0;
    const memoryKb = raw.memory || 0;

    if (timeTakenMs > maxExecutionTime) maxExecutionTime = timeTakenMs;
    if (memoryKb > maxMemoryUsed) maxMemoryUsed = memoryKb;

    if (compilationError) {
      testStatus = 'COMPILATION_ERROR';
      testPassed = false;
    } else if (raw.status_id === 3) {
      // Direct Judge0 Accepted
      testPassed = true;
      testStatus = 'ACCEPTED';
    } else if (raw.status_id === 5) {
      testStatus = 'TIME_LIMIT_EXCEEDED';
      hasTimeout = true;
    } else if (raw.status_id && [7, 8, 9, 10, 11, 12].includes(raw.status_id)) {
      testStatus = 'RUNTIME_ERROR';
      hasRuntimeError = true;
    } else {
      // Check output comparison
      const isMatch = compareCodeOutputs(raw.stdout, tc.expectedOutput);
      if (isMatch) {
        testPassed = true;
        testStatus = 'ACCEPTED';
      } else {
        testStatus = judge0Service.mapStatusId(raw.status_id) || 'WRONG_ANSWER';
        if (testStatus === 'TIME_LIMIT_EXCEEDED') hasTimeout = true;
        if (testStatus === 'RUNTIME_ERROR') hasRuntimeError = true;
      }
    }

    if (testPassed) {
      testsPassedCount++;
      earnedWeight = testWeight;
      earnedWeightSum += testWeight;
    }

    const updatedTr = await prisma.codeSubmissionTestResult.update({
      where: { id: tr.id },
      data: {
        status: testStatus,
        passed: testPassed,
        executionTimeMs: timeTakenMs,
        memoryUsedKb: memoryKb,
        stdout: raw.stdout || null,
        stderr: raw.stderr || null,
        compileOutput: raw.compile_output || null,
        earnedWeight
      },
      include: {
        testCase: true
      }
    });

    finalTestResults.push(updatedTr);
  }

  // 12. Determine Aggregate Parent Status & Calculate Marks
  let aggregateStatus = 'WRONG_ANSWER';
  let earnedMarks = 0.0;

  if (compilationError) {
    aggregateStatus = 'COMPILATION_ERROR';
    earnedMarks = 0.0;
  } else if (executionMode === 'RUN') {
    earnedMarks = 0.0; // RUN never awards official marks
    if (testsPassedCount === selectedTestCases.length) {
      aggregateStatus = 'ACCEPTED';
    } else if (hasTimeout) {
      aggregateStatus = 'TIME_LIMIT_EXCEEDED';
    } else if (hasRuntimeError) {
      aggregateStatus = 'RUNTIME_ERROR';
    } else if (testsPassedCount > 0) {
      aggregateStatus = 'PARTIAL';
    } else {
      aggregateStatus = 'WRONG_ANSWER';
    }
  } else {
    // SUBMIT mode: Calculate weighted marks
    if (totalWeightSum === 0) {
      throw new AppError('Total test case weight cannot be zero for official submission', 400);
    }

    earnedMarks = (earnedWeightSum / totalWeightSum) * maxMarks;

    // Round to 2 decimal places
    earnedMarks = Math.round(earnedMarks * 100) / 100;

    if (testsPassedCount === selectedTestCases.length) {
      aggregateStatus = 'ACCEPTED';
    } else if (testsPassedCount > 0) {
      aggregateStatus = 'PARTIAL';
    } else if (hasTimeout) {
      aggregateStatus = 'TIME_LIMIT_EXCEEDED';
    } else if (hasRuntimeError) {
      aggregateStatus = 'RUNTIME_ERROR';
    } else {
      aggregateStatus = 'WRONG_ANSWER';
    }

    // Update PracticeAttempt QuestionResponse record if in practice context
    if (practiceAttemptId) {
      await prisma.questionResponse.updateMany({
        where: {
          practiceAttemptId,
          questionVersionId
        },
        data: {
          isCorrect: aggregateStatus === 'ACCEPTED',
          marksAwarded: earnedMarks,
          answeredAt: new Date()
        }
      });
    }

    // Upsert ContestAttempt QuestionResponse record if in contest context
    if (contestAttemptId) {
      const existingContestResp = await prisma.questionResponse.findFirst({
        where: { contestAttemptId, questionVersionId }
      });
      if (existingContestResp) {
        await prisma.questionResponse.update({
          where: { id: existingContestResp.id },
          data: {
            isCorrect: aggregateStatus === 'ACCEPTED',
            marksAwarded: earnedMarks,
            answerData: { language, sourceCode },
            answeredAt: new Date()
          }
        });
      } else {
        await prisma.questionResponse.create({
          data: {
            contestAttemptId,
            questionVersionId,
            isCorrect: aggregateStatus === 'ACCEPTED',
            marksAwarded: earnedMarks,
            answerData: { language, sourceCode },
            answeredAt: new Date()
          }
        });
      }
    }
  }

  // 13. Update Parent CodeSubmission in Database
  const finalSubmission = await prisma.codeSubmission.update({
    where: { id: submission.id },
    data: {
      status: aggregateStatus,
      testsPassed: testsPassedCount,
      testsTotal: selectedTestCases.length,
      earnedMarks,
      executionTimeMs: maxExecutionTime,
      memoryUsedKb: maxMemoryUsed,
      compileOutput: compilationError
    },
    include: {
      testResults: {
        include: {
          testCase: true
        },
        orderBy: { order: 'asc' }
      }
    }
  });

  return serializeCodeSubmissionResponse(finalSubmission, { isAdmin });
}

async function getSubmissionById(submissionId, { isAdmin = false } = {}) {
  const submission = await prisma.codeSubmission.findUnique({
    where: { id: submissionId },
    include: {
      testResults: {
        include: {
          testCase: true
        },
        orderBy: { order: 'asc' }
      }
    }
  });

  if (!submission) {
    throw new AppError(`CodeSubmission not found with id: ${submissionId}`, 404);
  }

  return serializeCodeSubmissionResponse(submission, { isAdmin });
}

module.exports = {
  executeCode,
  getSubmissionById
};
