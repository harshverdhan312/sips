async function cleanDatabase(prisma) {
  await prisma.codeSubmissionTestResult.deleteMany({});
  await prisma.codeSubmission.deleteMany({});
  await prisma.questionResponse.deleteMany({});
  await prisma.contestAttempt.deleteMany({});
  await prisma.contestQuestion.deleteMany({});
  await prisma.contest.deleteMany({});
  await prisma.practiceAttempt.deleteMany({});
  await prisma.codingTestCase.deleteMany({});
  await prisma.codingProblem.deleteMany({});
  await prisma.questionVersion.deleteMany({});
  await prisma.practiceQuestion.deleteMany({});
}

module.exports = {
  cleanDatabase
};
