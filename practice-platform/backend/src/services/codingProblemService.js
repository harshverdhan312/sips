const prisma = require('../utils/prisma');
const AppError = require('../utils/appError');
const { validateCreateCodingProblem, validateCreateCodingTestCase } = require('../validators/codingValidator');

/**
 * Coding Problem Service
 * Handles CodingProblem and CodingTestCase entities.
 */

async function createCodingProblem(versionId, data) {
  validateCreateCodingProblem(data);

  // Load question version with question metadata
  const version = await prisma.questionVersion.findUnique({
    where: { id: versionId },
    include: { question: true, codingProblem: true }
  });

  if (!version) {
    throw new AppError(`QuestionVersion not found with id: ${versionId}`, 404);
  }

  if (version.question.type !== 'CODING') {
    throw new AppError(
      `Cannot attach CodingProblem to question of type '${version.question.type}'. CodingProblem is only allowed for CODING questions.`,
      400
    );
  }

  if (version.codingProblem) {
    throw new AppError(`CodingProblem already exists for QuestionVersion: ${versionId}`, 409);
  }

  const {
    inputFormat,
    outputFormat,
    constraints,
    timeLimitMs = 2000,
    memoryLimitKb = 128000,
    maxMarks = 100.0
  } = data;

  const codingProblem = await prisma.codingProblem.create({
    data: {
      questionVersionId: versionId,
      inputFormat: inputFormat || null,
      outputFormat: outputFormat || null,
      constraints: constraints || null,
      timeLimitMs,
      memoryLimitKb,
      maxMarks
    },
    include: {
      testCases: true
    }
  });

  return codingProblem;
}

async function getCodingProblemByVersionId(versionId) {
  const codingProblem = await prisma.codingProblem.findUnique({
    where: { questionVersionId: versionId },
    include: {
      testCases: {
        orderBy: { order: 'asc' }
      }
    }
  });

  if (!codingProblem) {
    throw new AppError(`CodingProblem not found for QuestionVersion id: ${versionId}`, 404);
  }

  return codingProblem;
}

async function createCodingTestCase(codingProblemId, data) {
  validateCreateCodingTestCase(data);

  const codingProblem = await prisma.codingProblem.findUnique({
    where: { id: codingProblemId }
  });

  if (!codingProblem) {
    throw new AppError(`CodingProblem not found with id: ${codingProblemId}`, 404);
  }

  const { input, expectedOutput, weight = 1.0, isHidden = false, order } = data;

  // If order not explicitly provided, calculate next order index
  let testOrder = order;
  if (testOrder === undefined) {
    const lastCase = await prisma.codingTestCase.findFirst({
      where: { codingProblemId },
      orderBy: { order: 'desc' },
      select: { order: true }
    });
    testOrder = lastCase ? lastCase.order + 1 : 1;
  }

  const testCase = await prisma.codingTestCase.create({
    data: {
      codingProblemId,
      input,
      expectedOutput,
      weight,
      isHidden: Boolean(isHidden),
      order: testOrder
    }
  });

  return testCase;
}

async function getTestCasesByCodingProblemId(codingProblemId) {
  const codingProblem = await prisma.codingProblem.findUnique({
    where: { id: codingProblemId }
  });

  if (!codingProblem) {
    throw new AppError(`CodingProblem not found with id: ${codingProblemId}`, 404);
  }

  const testCases = await prisma.codingTestCase.findMany({
    where: { codingProblemId },
    orderBy: { order: 'asc' }
  });

  return testCases;
}

module.exports = {
  createCodingProblem,
  getCodingProblemByVersionId,
  createCodingTestCase,
  getTestCasesByCodingProblemId
};
