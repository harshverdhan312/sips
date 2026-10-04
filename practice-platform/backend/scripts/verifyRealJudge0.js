const prisma = require('../src/utils/prisma');
const config = require('../src/config');
const judge0Service = require('../src/services/judge0Service');
const codeExecutionService = require('../src/services/codeExecutionService');
const { createTestToken } = require('../tests/testHelper');

async function runVerification() {
  console.log('====================================================');
  console.log('PHASE 6D.4A: REAL JUDGE0 INTEGRATION VERIFICATION');
  console.log('====================================================');
  console.log('Configured JUDGE0_BASE_URL:', config.judge0BaseUrl);

  // Ensure mock provider is cleared so real network calls occur
  judge0Service.clearMockProvider();

  // 1. Connectivity & Language Check
  console.log('\n--- 1. Testing Judge0 Connectivity & Languages ---');
  const langRes = await fetch(`${config.judge0BaseUrl}/languages`);
  if (!langRes.ok) {
    throw new Error(`Failed to reach Judge0 at ${config.judge0BaseUrl}/languages. Status: ${langRes.status}`);
  }
  const allLangs = await langRes.json();
  console.log(`[PASS] Judge0 is reachable. Total available languages: ${allLangs.length}`);

  const requiredLangs = [
    { key: 'python', name: 'Python (3.8.1)', expectedId: 71 },
    { key: 'cpp', name: 'C++ (GCC 9.2.0)', expectedId: 54 },
    { key: 'java', name: 'Java (OpenJDK 13.0.1)', expectedId: 62 },
    { key: 'javascript', name: 'JavaScript (Node.js 12.14.0)', expectedId: 63 }
  ];

  for (const req of requiredLangs) {
    const configuredId = judge0Service.LANGUAGE_MAP[req.key];
    const match = allLangs.find((l) => l.id === configuredId);
    console.log(`Language [${req.key.toUpperCase()}]: Configured ID=${configuredId} | Actual Name on Judge0="${match?.name}" | Status=${match ? 'VERIFIED' : 'MISMATCH'}`);
  }

  // 2. Setup Test Database Fixtures
  console.log('\n--- 2. Setting Up Test Coding Problem Fixtures ---');
  const studentId = 'student_real_judge0_verify';
  const collegeId = 'college_test_01';

  // Create Question & Version
  const question = await prisma.practiceQuestion.create({
    data: {
      type: 'CODING',
      format: 'CODING',
      category: 'DSA',
      subcategory: 'MATH',
      difficulty: 'EASY',
      sourceType: 'CURATED'
    }
  });

  const version = await prisma.questionVersion.create({
    data: {
      questionId: question.id,
      versionNumber: 1,
      title: 'Real Judge0 Two Sum Math Problem',
      statement: 'Given two integers A and B, print their sum.',
      codingProblem: {
        create: {
          inputFormat: 'Two space separated integers',
          outputFormat: 'Single integer sum',
          constraints: '-1000 <= A, B <= 1000',
          timeLimitMs: 2000,
          memoryLimitKb: 128000,
          maxMarks: 100.0,
          testCases: {
            create: [
              { input: '2 3', expectedOutput: '5', isHidden: false, weight: 10.0, order: 1 },
              { input: '10 20', expectedOutput: '30', isHidden: false, weight: 10.0, order: 2 },
              { input: '100 200', expectedOutput: '300', isHidden: true, weight: 30.0, order: 3 },
              { input: '-5 15', expectedOutput: '10', isHidden: true, weight: 50.0, order: 4 }
            ]
          }
        }
      }
    }
  });

  // Create Practice Attempt
  const practiceAttempt = await prisma.practiceAttempt.create({
    data: {
      studentId,
      collegeId,
      category: 'DSA',
      status: 'IN_PROGRESS',
      totalMarks: 100.0,
      score: 0.0
    }
  });

  // Create delivered QuestionResponse
  await prisma.questionResponse.create({
    data: {
      practiceAttemptId: practiceAttempt.id,
      questionVersionId: version.id,
      answerData: {},
      marksAwarded: 0.0
    }
  });

  console.log(`[PASS] Fixture created: QuestionVersion ID=${version.id}, PracticeAttempt ID=${practiceAttempt.id}`);

  // 3. Test RUN Flow (Public Test Cases Only)
  console.log('\n--- 3. Testing Real RUN Flow ---');
  const runCode = 'import sys\na, b = map(int, sys.stdin.read().split())\nprint(a + b)';
  const runResult = await codeExecutionService.executeCode({
    studentId,
    questionVersionId: version.id,
    practiceAttemptId: practiceAttempt.id,
    language: 'python',
    sourceCode: runCode,
    mode: 'RUN'
  });

  console.log(`RUN Result Status: ${runResult.status}`);
  console.log(`RUN Tests Total: ${runResult.testsTotal} (Expected 2 public test cases)`);
  console.log(`RUN Tests Passed: ${runResult.testsPassed}`);
  console.log(`RUN Earned Marks: ${runResult.earnedMarks} (Expected 0 - RUN never awards official marks)`);
  console.log(`RUN Test Results count: ${runResult.testResults.length}`);

  const hasHiddenInRun = runResult.testResults.some((tr) => tr.isHidden);
  console.log(`Hidden tests leaked in RUN: ${hasHiddenInRun ? 'FAIL (LEAKED)' : 'NONE (PASS)'}`);

  // 4. Test SUBMIT Flow (All Test Cases + Weighted Scoring)
  console.log('\n--- 4. Testing Real SUBMIT Flow ---');
  const submitResult = await codeExecutionService.executeCode({
    studentId,
    questionVersionId: version.id,
    practiceAttemptId: practiceAttempt.id,
    language: 'python',
    sourceCode: runCode,
    mode: 'SUBMIT'
  });

  console.log(`SUBMIT Result Status: ${submitResult.status}`);
  console.log(`SUBMIT Tests Total: ${submitResult.testsTotal} (Expected 4 test cases)`);
  console.log(`SUBMIT Tests Passed: ${submitResult.testsPassed}`);
  console.log(`SUBMIT Earned Marks: ${submitResult.earnedMarks} / 100.0`);

  // Verify hidden tests in student view have input/expectedOutput scrubbed
  for (const tr of submitResult.testResults) {
    if (tr.isHidden) {
      console.log(`Hidden Test [Order ${tr.order}]: status=${tr.status}, passed=${tr.passed}, earnedWeight=${tr.earnedWeight}, input=${tr.input ?? '[SCRUBBED]'}, expectedOutput=${tr.expectedOutput ?? '[SCRUBBED]'}`);
    } else {
      console.log(`Public Test [Order ${tr.order}]: status=${tr.status}, passed=${tr.passed}, earnedWeight=${tr.earnedWeight}, input="${tr.input}", expectedOutput="${tr.expectedOutput}"`);
    }
  }

  // 5. Test Mandatory Error Paths
  console.log('\n--- 5. Mandatory Error-Path Verification ---');

  // 5A. Wrong Answer
  console.log('\n[Scenario 5A] Wrong Answer:');
  const waResult = await codeExecutionService.executeCode({
    studentId,
    questionVersionId: version.id,
    practiceAttemptId: practiceAttempt.id,
    language: 'python',
    sourceCode: 'print(99999)',
    mode: 'SUBMIT'
  });
  console.log(`Status: ${waResult.status} | Passed: ${waResult.testsPassed}/${waResult.testsTotal} | Marks: ${waResult.earnedMarks}`);

  // 5B. Compilation Error
  console.log('\n[Scenario 5B] Compilation Error (C++ syntax error):');
  const ceResult = await codeExecutionService.executeCode({
    studentId,
    questionVersionId: version.id,
    practiceAttemptId: practiceAttempt.id,
    language: 'cpp',
    sourceCode: '#include <iostream>\nint main() { invalid_syntax_here; return 0; }',
    mode: 'SUBMIT'
  });
  console.log(`Status: ${ceResult.status} | Compile Output:\n${ceResult.compileOutput}`);

  // 5C. Runtime Error
  console.log('\n[Scenario 5C] Runtime Error (Python ZeroDivisionError):');
  const reResult = await codeExecutionService.executeCode({
    studentId,
    questionVersionId: version.id,
    practiceAttemptId: practiceAttempt.id,
    language: 'python',
    sourceCode: 'import sys\nprint(1 / 0)',
    mode: 'SUBMIT'
  });
  console.log(`Status: ${reResult.status} | Stderr: ${reResult.testResults[0]?.stderr?.trim()}`);

  // 5D. Time Limit Exceeded (Timeout)
  console.log('\n[Scenario 5D] Time Limit Exceeded (Python infinite loop):');
  const tleResult = await codeExecutionService.executeCode({
    studentId,
    questionVersionId: version.id,
    practiceAttemptId: practiceAttempt.id,
    language: 'python',
    sourceCode: 'while True: pass',
    mode: 'SUBMIT'
  });
  console.log(`Status: ${tleResult.status} | Passed: ${tleResult.testsPassed}/${tleResult.testsTotal}`);

  // 5E. Partial Weighted Score
  console.log('\n[Scenario 5E] Partial Weighted Score:');
  // Pass only when a == 2 (Test 1 weight 10.0 passes, others fail)
  const partialCode = `import sys
data = sys.stdin.read().split()
if data:
    a, b = int(data[0]), int(data[1])
    if a == 2:
        print(5)
    else:
        print(0)
`;
  const partialResult = await codeExecutionService.executeCode({
    studentId,
    questionVersionId: version.id,
    practiceAttemptId: practiceAttempt.id,
    language: 'python',
    sourceCode: partialCode,
    mode: 'SUBMIT'
  });
  console.log(`Status: ${partialResult.status} | Passed: ${partialResult.testsPassed}/${partialResult.testsTotal} | Earned Marks: ${partialResult.earnedMarks} (Expected 10.0 out of 100.0)`);

  // 6. Test Multi-Language Solutions (C++, Java, JavaScript)
  console.log('\n--- 6. Multi-Language Real Execution ---');

  // C++
  const cppCode = `
#include <iostream>
using namespace std;
int main() {
    int a, b;
    if (cin >> a >> b) {
        cout << (a + b) << endl;
    }
    return 0;
}
`;
  const cppSubmit = await codeExecutionService.executeCode({
    studentId,
    questionVersionId: version.id,
    practiceAttemptId: practiceAttempt.id,
    language: 'cpp',
    sourceCode: cppCode,
    mode: 'SUBMIT'
  });
  console.log(`C++ Solution: Status=${cppSubmit.status} | Passed=${cppSubmit.testsPassed}/${cppSubmit.testsTotal} | Marks=${cppSubmit.earnedMarks}`);

  // Java
  const javaCode = `
import java.util.Scanner;
public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (sc.hasNextInt()) {
            int a = sc.nextInt();
            int b = sc.nextInt();
            System.out.println(a + b);
        }
    }
}
`;
  const javaSubmit = await codeExecutionService.executeCode({
    studentId,
    questionVersionId: version.id,
    practiceAttemptId: practiceAttempt.id,
    language: 'java',
    sourceCode: javaCode,
    mode: 'SUBMIT'
  });
  console.log(`Java Solution: Status=${javaSubmit.status} | Passed=${javaSubmit.testsPassed}/${javaSubmit.testsTotal} | Marks=${javaSubmit.earnedMarks}`);

  // JavaScript
  const jsCode = `
const fs = require('fs');
const input = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);
if (input.length >= 2) {
    const a = parseInt(input[0], 10);
    const b = parseInt(input[1], 10);
    console.log(a + b);
}
`;
  const jsSubmit = await codeExecutionService.executeCode({
    studentId,
    questionVersionId: version.id,
    practiceAttemptId: practiceAttempt.id,
    language: 'javascript',
    sourceCode: jsCode,
    mode: 'SUBMIT'
  });
  console.log(`JavaScript Solution: Status=${jsSubmit.status} | Passed=${jsSubmit.testsPassed}/${jsSubmit.testsTotal} | Marks=${jsSubmit.earnedMarks}`);

  // 7. Cleanup
  console.log('\n--- 7. Cleanup Fixtures ---');
  await prisma.codeSubmissionTestResult.deleteMany({
    where: { submission: { studentId } }
  });
  await prisma.codeSubmission.deleteMany({
    where: { studentId }
  });
  await prisma.questionResponse.deleteMany({
    where: { practiceAttemptId: practiceAttempt.id }
  });
  await prisma.practiceAttempt.deleteMany({
    where: { id: practiceAttempt.id }
  });
  const cp = await prisma.codingProblem.findFirst({
    where: { questionVersionId: version.id }
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
    where: { id: version.id }
  });
  await prisma.practiceQuestion.deleteMany({
    where: { id: question.id }
  });
  console.log('[PASS] Cleanup completed.');
  console.log('\n====================================================');
  console.log('REAL JUDGE0 VERIFICATION COMPLETED SUCCESSFULLY');
  console.log('====================================================');
}

runVerification()
  .catch((err) => {
    console.error('VERIFICATION FAILED:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
