-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('CODING', 'APTITUDE', 'TECHNICAL');

-- CreateEnum
CREATE TYPE "QuestionFormat" AS ENUM ('SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'TRUE_FALSE', 'NUMERICAL', 'CODING');

-- CreateEnum
CREATE TYPE "QuestionDifficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- CreateEnum
CREATE TYPE "SourceType" AS ENUM ('COLLEGE_CREATED', 'PUBLIC_SOURCE', 'CURATED');

-- CreateEnum
CREATE TYPE "PracticeAttemptStatus" AS ENUM ('IN_PROGRESS', 'SUBMITTED', 'ABANDONED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "ContestStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'LIVE', 'ENDED', 'EVALUATED', 'ARCHIVED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ContestSection" AS ENUM ('CODING', 'APTITUDE', 'TECHNICAL');

-- CreateEnum
CREATE TYPE "ContestAttemptStatus" AS ENUM ('IN_PROGRESS', 'SUBMITTED', 'TIMED_OUT', 'DISQUALIFIED');

-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('QUEUED', 'RUNNING', 'ACCEPTED', 'WRONG_ANSWER', 'TIME_LIMIT_EXCEEDED', 'MEMORY_LIMIT_EXCEEDED', 'COMPILATION_ERROR', 'RUNTIME_ERROR', 'SYSTEM_ERROR');

-- CreateTable
CREATE TABLE "PracticeQuestion" (
    "id" TEXT NOT NULL,
    "type" "QuestionType" NOT NULL,
    "format" "QuestionFormat" NOT NULL,
    "category" TEXT NOT NULL,
    "subcategory" TEXT,
    "difficulty" "QuestionDifficulty" NOT NULL,
    "sourceType" "SourceType" NOT NULL DEFAULT 'CURATED',
    "sourceUrl" TEXT,
    "attribution" TEXT,
    "collegeId" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PracticeQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionVersion" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL DEFAULT 1,
    "title" TEXT NOT NULL,
    "statement" TEXT NOT NULL,
    "options" JSONB,
    "correctAnswer" JSONB,
    "explanation" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuestionVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CodingProblem" (
    "id" TEXT NOT NULL,
    "questionVersionId" TEXT NOT NULL,
    "inputFormat" TEXT,
    "outputFormat" TEXT,
    "constraints" TEXT,
    "timeLimitMs" INTEGER NOT NULL DEFAULT 2000,
    "memoryLimitKb" INTEGER NOT NULL DEFAULT 128000,
    "maxMarks" DECIMAL(10,2) NOT NULL DEFAULT 100.00,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CodingProblem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CodingTestCase" (
    "id" TEXT NOT NULL,
    "codingProblemId" TEXT NOT NULL,
    "input" TEXT NOT NULL,
    "expectedOutput" TEXT NOT NULL,
    "weight" DECIMAL(10,2) NOT NULL DEFAULT 1.00,
    "isHidden" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CodingTestCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PracticeAttempt" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "collegeId" TEXT NOT NULL,
    "category" TEXT,
    "status" "PracticeAttemptStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedAt" TIMESTAMP(3),
    "score" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "totalMarks" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PracticeAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contest" (
    "id" TEXT NOT NULL,
    "sipsDriveId" TEXT,
    "collegeId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "instructions" TEXT,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "status" "ContestStatus" NOT NULL DEFAULT 'DRAFT',
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContestQuestion" (
    "id" TEXT NOT NULL,
    "contestId" TEXT NOT NULL,
    "questionVersionId" TEXT NOT NULL,
    "section" "ContestSection" NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 1,
    "marks" DECIMAL(10,2) NOT NULL DEFAULT 1.00,
    "negativeMarks" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContestQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContestAttempt" (
    "id" TEXT NOT NULL,
    "contestId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "collegeId" TEXT NOT NULL,
    "status" "ContestAttemptStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedAt" TIMESTAMP(3),
    "codingScore" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "aptitudeScore" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "technicalScore" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "totalScore" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "totalMarks" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContestAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionResponse" (
    "id" TEXT NOT NULL,
    "questionVersionId" TEXT NOT NULL,
    "practiceAttemptId" TEXT,
    "contestAttemptId" TEXT,
    "answerData" JSONB NOT NULL,
    "isCorrect" BOOLEAN,
    "marksAwarded" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "answeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuestionResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CodeSubmission" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "questionVersionId" TEXT NOT NULL,
    "practiceAttemptId" TEXT,
    "contestAttemptId" TEXT,
    "language" TEXT NOT NULL,
    "sourceCode" TEXT NOT NULL,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'QUEUED',
    "testsPassed" INTEGER NOT NULL DEFAULT 0,
    "testsTotal" INTEGER NOT NULL DEFAULT 0,
    "earnedMarks" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "executionTimeMs" INTEGER,
    "memoryUsedKb" INTEGER,
    "judge0SubmissionId" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CodeSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PracticeQuestion_type_category_difficulty_idx" ON "PracticeQuestion"("type", "category", "difficulty");

-- CreateIndex
CREATE INDEX "PracticeQuestion_sourceType_idx" ON "PracticeQuestion"("sourceType");

-- CreateIndex
CREATE INDEX "PracticeQuestion_collegeId_idx" ON "PracticeQuestion"("collegeId");

-- CreateIndex
CREATE INDEX "QuestionVersion_questionId_idx" ON "QuestionVersion"("questionId");

-- CreateIndex
CREATE UNIQUE INDEX "QuestionVersion_questionId_versionNumber_key" ON "QuestionVersion"("questionId", "versionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "CodingProblem_questionVersionId_key" ON "CodingProblem"("questionVersionId");

-- CreateIndex
CREATE INDEX "CodingTestCase_codingProblemId_order_idx" ON "CodingTestCase"("codingProblemId", "order");

-- CreateIndex
CREATE INDEX "CodingTestCase_codingProblemId_isHidden_idx" ON "CodingTestCase"("codingProblemId", "isHidden");

-- CreateIndex
CREATE INDEX "PracticeAttempt_studentId_idx" ON "PracticeAttempt"("studentId");

-- CreateIndex
CREATE INDEX "PracticeAttempt_collegeId_idx" ON "PracticeAttempt"("collegeId");

-- CreateIndex
CREATE INDEX "PracticeAttempt_studentId_createdAt_idx" ON "PracticeAttempt"("studentId", "createdAt");

-- CreateIndex
CREATE INDEX "PracticeAttempt_status_idx" ON "PracticeAttempt"("status");

-- CreateIndex
CREATE INDEX "Contest_sipsDriveId_idx" ON "Contest"("sipsDriveId");

-- CreateIndex
CREATE INDEX "Contest_collegeId_status_idx" ON "Contest"("collegeId", "status");

-- CreateIndex
CREATE INDEX "Contest_startAt_endAt_idx" ON "Contest"("startAt", "endAt");

-- CreateIndex
CREATE INDEX "ContestQuestion_contestId_section_order_idx" ON "ContestQuestion"("contestId", "section", "order");

-- CreateIndex
CREATE UNIQUE INDEX "ContestQuestion_contestId_questionVersionId_key" ON "ContestQuestion"("contestId", "questionVersionId");

-- CreateIndex
CREATE INDEX "ContestAttempt_contestId_totalScore_idx" ON "ContestAttempt"("contestId", "totalScore");

-- CreateIndex
CREATE INDEX "ContestAttempt_studentId_collegeId_idx" ON "ContestAttempt"("studentId", "collegeId");

-- CreateIndex
CREATE UNIQUE INDEX "ContestAttempt_contestId_studentId_key" ON "ContestAttempt"("contestId", "studentId");

-- CreateIndex
CREATE INDEX "QuestionResponse_practiceAttemptId_idx" ON "QuestionResponse"("practiceAttemptId");

-- CreateIndex
CREATE INDEX "QuestionResponse_contestAttemptId_idx" ON "QuestionResponse"("contestAttemptId");

-- CreateIndex
CREATE INDEX "QuestionResponse_questionVersionId_idx" ON "QuestionResponse"("questionVersionId");

-- CreateIndex
CREATE INDEX "CodeSubmission_studentId_questionVersionId_idx" ON "CodeSubmission"("studentId", "questionVersionId");

-- CreateIndex
CREATE INDEX "CodeSubmission_practiceAttemptId_idx" ON "CodeSubmission"("practiceAttemptId");

-- CreateIndex
CREATE INDEX "CodeSubmission_contestAttemptId_idx" ON "CodeSubmission"("contestAttemptId");

-- CreateIndex
CREATE INDEX "CodeSubmission_judge0SubmissionId_idx" ON "CodeSubmission"("judge0SubmissionId");

-- CreateIndex
CREATE INDEX "CodeSubmission_submittedAt_idx" ON "CodeSubmission"("submittedAt");

-- AddForeignKey
ALTER TABLE "QuestionVersion" ADD CONSTRAINT "QuestionVersion_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "PracticeQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CodingProblem" ADD CONSTRAINT "CodingProblem_questionVersionId_fkey" FOREIGN KEY ("questionVersionId") REFERENCES "QuestionVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CodingTestCase" ADD CONSTRAINT "CodingTestCase_codingProblemId_fkey" FOREIGN KEY ("codingProblemId") REFERENCES "CodingProblem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContestQuestion" ADD CONSTRAINT "ContestQuestion_contestId_fkey" FOREIGN KEY ("contestId") REFERENCES "Contest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContestQuestion" ADD CONSTRAINT "ContestQuestion_questionVersionId_fkey" FOREIGN KEY ("questionVersionId") REFERENCES "QuestionVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContestAttempt" ADD CONSTRAINT "ContestAttempt_contestId_fkey" FOREIGN KEY ("contestId") REFERENCES "Contest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionResponse" ADD CONSTRAINT "QuestionResponse_questionVersionId_fkey" FOREIGN KEY ("questionVersionId") REFERENCES "QuestionVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionResponse" ADD CONSTRAINT "QuestionResponse_practiceAttemptId_fkey" FOREIGN KEY ("practiceAttemptId") REFERENCES "PracticeAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionResponse" ADD CONSTRAINT "QuestionResponse_contestAttemptId_fkey" FOREIGN KEY ("contestAttemptId") REFERENCES "ContestAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CodeSubmission" ADD CONSTRAINT "CodeSubmission_questionVersionId_fkey" FOREIGN KEY ("questionVersionId") REFERENCES "QuestionVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CodeSubmission" ADD CONSTRAINT "CodeSubmission_practiceAttemptId_fkey" FOREIGN KEY ("practiceAttemptId") REFERENCES "PracticeAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CodeSubmission" ADD CONSTRAINT "CodeSubmission_contestAttemptId_fkey" FOREIGN KEY ("contestAttemptId") REFERENCES "ContestAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;
