const prisma = require('../src/utils/prisma');
const config = require('../src/config');
const judge0Service = require('../src/services/judge0Service');
const contestService = require('../src/services/contestService');
const contestAttemptService = require('../src/services/contestAttemptService');
const contestScoringService = require('../src/services/contestScoringService');
const codeExecutionService = require('../src/services/codeExecutionService');

async function testContestCodingE2E() {
  console.log('====================================================');
  console.log('PHASE 6D.4B: CONTEST CODING E2E INTEGRATION TEST');
  console.log('====================================================');

  judge0Service.clearMockProvider();

  const collegeId = 'college_contest_coding_01';
  const studentId = 'student_contest_coder_01';

  // 1. Create Aptitude MCQ
  const aptQ = await prisma.practiceQuestion.create({
    data: {
      type: 'APTITUDE',
      format: 'SINGLE_CHOICE',
      category: 'QUANTITATIVE',
      difficulty: 'EASY',
      sourceType: 'CURATED'
    }
  });

  const aptVer = await prisma.questionVersion.create({
    data: {
      questionId: aptQ.id,
      versionNumber: 1,
      title: 'Aptitude Math',
      statement: 'What is 10 + 20?',
      options: [
        { id: 'opt_1', text: '30' },
        { id: 'opt_2', text: '40' }
      ],
      correctAnswer: { optionId: 'opt_1' }
    }
  });

  // 2. Create Coding Problem
  const codeQ = await prisma.practiceQuestion.create({
    data: {
      type: 'CODING',
      format: 'CODING',
      category: 'DSA',
      difficulty: 'MEDIUM',
      sourceType: 'CURATED'
    }
  });

  const codeVer = await prisma.questionVersion.create({
    data: {
      questionId: codeQ.id,
      versionNumber: 1,
      title: 'Contest Multiply Challenge',
      statement: 'Given two integers A and B, print their product.',
      codingProblem: {
        create: {
          inputFormat: 'Two space separated integers',
          outputFormat: 'Single integer product',
          constraints: '1 <= A, B <= 100',
          timeLimitMs: 2000,
          memoryLimitKb: 128000,
          maxMarks: 50.0,
          testCases: {
            create: [
              { input: '3 4', expectedOutput: '12', isHidden: false, weight: 10.0, order: 1 },
              { input: '5 6', expectedOutput: '30', isHidden: false, weight: 10.0, order: 2 },
              { input: '7 8', expectedOutput: '56', isHidden: true, weight: 30.0, order: 3 }
            ]
          }
        }
      }
    }
  });

  // 3. Create and Publish Contest
  const now = Date.now();
  const contest = await contestService.createContest({
    title: 'Contest Coding Verification Assessment',
    sipsDriveId: 'sips_drive_e2e_01',
    collegeId,
    startAt: new Date(now - 60000).toISOString(),
    endAt: new Date(now + 3600000).toISOString(),
    durationMinutes: 45
  });

  await contestService.addContestQuestion(contest.id, {
    questionVersionId: aptVer.id,
    section: 'APTITUDE',
    marks: 10.0,
    negativeMarks: 0.0,
    order: 1
  });

  await contestService.addContestQuestion(contest.id, {
    questionVersionId: codeVer.id,
    section: 'CODING',
    marks: 50.0,
    negativeMarks: 0.0,
    order: 2
  });

  await contestService.publishContest(contest.id);
  await contestService.markContestLive(contest.id);

  console.log(`[PASS] Contest created and published. ID=${contest.id}`);

  // 4. Start Contest Attempt
  const startResult = await contestAttemptService.startContestAttempt({
    contestId: contest.id,
    studentId,
    collegeId
  });
  const attemptId = startResult.attempt.id;
  console.log(`[PASS] Contest attempt started. ID=${attemptId}`);

  // 5. Answer Aptitude Question
  await contestAttemptService.recordContestResponse({
    contestId: contest.id,
    attemptId,
    studentId,
    collegeId,
    questionVersionId: aptVer.id,
    answerData: { optionId: 'opt_1' } // Correct (+10)
  });
  console.log('[PASS] Aptitude response recorded.');

  // 6. Test RUN Flow for Coding Question (Public Cases Only)
  const pythonCode = `import sys
data = sys.stdin.read().split()
if data:
    a, b = int(data[0]), int(data[1])
    print(a * b)
`;
  const runRes = await codeExecutionService.executeCode({
    studentId,
    questionVersionId: codeVer.id,
    contestAttemptId: attemptId,
    language: 'python',
    sourceCode: pythonCode,
    mode: 'RUN'
  });

  console.log(`[RUN] Status: ${runRes.status} | Tests: ${runRes.testsPassed}/${runRes.testsTotal} (Sample only) | Earned Marks: ${runRes.earnedMarks}`);
  if (runRes.status !== 'ACCEPTED' || runRes.testsTotal !== 2 || runRes.earnedMarks !== 0) {
    throw new Error('RUN flow verification failed.');
  }

  // 7. Test SUBMIT Flow for Coding Question (All Cases + Weighted Scoring)
  const submitRes = await codeExecutionService.executeCode({
    studentId,
    questionVersionId: codeVer.id,
    contestAttemptId: attemptId,
    language: 'python',
    sourceCode: pythonCode,
    mode: 'SUBMIT'
  });

  console.log(`[SUBMIT] Status: ${submitRes.status} | Tests: ${submitRes.testsPassed}/${submitRes.testsTotal} | Earned Marks: ${submitRes.earnedMarks} / 50.0`);
  if (submitRes.status !== 'ACCEPTED' || submitRes.testsTotal !== 3 || submitRes.earnedMarks !== 50) {
    throw new Error('SUBMIT flow verification failed.');
  }

  // 8. Submit & Evaluate Contest Attempt
  const evalResult = await contestScoringService.submitAndEvaluateContestAttempt({
    contestId: contest.id,
    attemptId,
    studentId,
    collegeId
  });

  console.log('[FINAL EVALUATION RESULT]:');
  console.log(`- Status: ${evalResult.status}`);
  console.log(`- Aptitude Score: ${evalResult.aptitudeScore} / 10.0`);
  console.log(`- Coding Score: ${evalResult.codingScore} / 50.0`);
  console.log(`- Total Score: ${evalResult.totalScore} / ${evalResult.totalMarks}`);

  if (evalResult.aptitudeScore !== 10 || evalResult.codingScore !== 50 || evalResult.totalScore !== 60) {
    throw new Error(`Evaluation score mismatch: total=${evalResult.totalScore}, coding=${evalResult.codingScore}`);
  }

  // 9. Verify Student Scorecard API
  const scorecard = await contestScoringService.getStudentContestResult({
    contestId: contest.id,
    attemptId,
    studentId,
    collegeId
  });

  console.log(`[SCORECARD API]: status=${scorecard.status}, totalScore=${scorecard.totalScore}, codingScore=${scorecard.codingScore}`);

  // 10. Cleanup
  console.log('\n--- Cleanup ---');
  await prisma.codeSubmissionTestResult.deleteMany({
    where: { submission: { studentId } }
  });
  await prisma.codeSubmission.deleteMany({
    where: { studentId }
  });
  await prisma.questionResponse.deleteMany({
    where: { contestAttemptId: attemptId }
  });
  await prisma.contestAttempt.deleteMany({
    where: { id: attemptId }
  });
  await prisma.contestQuestion.deleteMany({
    where: { contestId: contest.id }
  });
  await prisma.contest.deleteMany({
    where: { id: contest.id }
  });
  const cp = await prisma.codingProblem.findFirst({
    where: { questionVersionId: codeVer.id }
  });
  if (cp) {
    await prisma.codingTestCase.deleteMany({
      where: { codingProblemId: cp.id }
    });
    await prisma.codingProblem.deleteMany({
      where: { id: cp.id }
    });
  }
  await prisma.questionVersion.deleteMany({
    where: { id: { in: [aptVer.id, codeVer.id] } }
  });
  await prisma.practiceQuestion.deleteMany({
    where: { id: { in: [aptQ.id, codeQ.id] } }
  });

  console.log('[PASS] All contest coding E2E verification steps completed successfully!');
}

testContestCodingE2E()
  .catch((err) => {
    console.error('CONTEST CODING E2E TEST FAILED:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
