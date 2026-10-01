const { PrismaClient, QuestionType, QuestionFormat, QuestionDifficulty, SourceType, PracticeAttemptStatus, ContestStatus, ContestSection, ContestAttemptStatus, SubmissionStatus } = require('@prisma/client');

describe('Prisma Domain Schema & Client Structure', () => {
  let prisma;

  beforeAll(() => {
    prisma = new PrismaClient();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test('Prisma Client contains all required Domain Models', () => {
    expect(prisma.practiceQuestion).toBeDefined();
    expect(prisma.questionVersion).toBeDefined();
    expect(prisma.codingProblem).toBeDefined();
    expect(prisma.codingTestCase).toBeDefined();
    expect(prisma.practiceAttempt).toBeDefined();
    expect(prisma.questionResponse).toBeDefined();
    expect(prisma.contest).toBeDefined();
    expect(prisma.contestQuestion).toBeDefined();
    expect(prisma.contestAttempt).toBeDefined();
    expect(prisma.codeSubmission).toBeDefined();
  });

  test('Prisma Enums are correctly exported with standard values', () => {
    expect(QuestionType).toEqual({
      CODING: 'CODING',
      APTITUDE: 'APTITUDE',
      TECHNICAL: 'TECHNICAL'
    });

    expect(QuestionFormat).toEqual({
      SINGLE_CHOICE: 'SINGLE_CHOICE',
      MULTIPLE_CHOICE: 'MULTIPLE_CHOICE',
      TRUE_FALSE: 'TRUE_FALSE',
      NUMERICAL: 'NUMERICAL',
      CODING: 'CODING'
    });

    expect(QuestionDifficulty).toEqual({
      EASY: 'EASY',
      MEDIUM: 'MEDIUM',
      HARD: 'HARD'
    });

    expect(SourceType).toEqual({
      COLLEGE_CREATED: 'COLLEGE_CREATED',
      PUBLIC_SOURCE: 'PUBLIC_SOURCE',
      CURATED: 'CURATED'
    });

    expect(PracticeAttemptStatus).toEqual({
      IN_PROGRESS: 'IN_PROGRESS',
      SUBMITTED: 'SUBMITTED',
      ABANDONED: 'ABANDONED',
      EXPIRED: 'EXPIRED'
    });

    expect(ContestStatus).toEqual({
      DRAFT: 'DRAFT',
      PUBLISHED: 'PUBLISHED',
      LIVE: 'LIVE',
      ENDED: 'ENDED',
      EVALUATED: 'EVALUATED',
      ARCHIVED: 'ARCHIVED',
      CANCELLED: 'CANCELLED'
    });

    expect(ContestSection).toEqual({
      CODING: 'CODING',
      APTITUDE: 'APTITUDE',
      TECHNICAL: 'TECHNICAL'
    });

    expect(ContestAttemptStatus).toEqual({
      IN_PROGRESS: 'IN_PROGRESS',
      SUBMITTED: 'SUBMITTED',
      TIMED_OUT: 'TIMED_OUT',
      DISQUALIFIED: 'DISQUALIFIED'
    });

    expect(SubmissionStatus).toEqual({
      QUEUED: 'QUEUED',
      RUNNING: 'RUNNING',
      ACCEPTED: 'ACCEPTED',
      PARTIAL: 'PARTIAL',
      WRONG_ANSWER: 'WRONG_ANSWER',
      TIME_LIMIT_EXCEEDED: 'TIME_LIMIT_EXCEEDED',
      MEMORY_LIMIT_EXCEEDED: 'MEMORY_LIMIT_EXCEEDED',
      COMPILATION_ERROR: 'COMPILATION_ERROR',
      RUNTIME_ERROR: 'RUNTIME_ERROR',
      SYSTEM_ERROR: 'SYSTEM_ERROR'
    });
  });
});
