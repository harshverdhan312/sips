/*
  Warnings:

  - You are about to drop the column `judge0SubmissionId` on the `CodeSubmission` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "SubmissionMode" AS ENUM ('RUN', 'SUBMIT');

-- AlterEnum
ALTER TYPE "SubmissionStatus" ADD VALUE 'PARTIAL';

-- DropIndex
DROP INDEX "CodeSubmission_judge0SubmissionId_idx";

-- AlterTable
ALTER TABLE "CodeSubmission" DROP COLUMN "judge0SubmissionId",
ADD COLUMN     "compileOutput" TEXT,
ADD COLUMN     "mode" "SubmissionMode" NOT NULL DEFAULT 'SUBMIT';

-- CreateTable
CREATE TABLE "CodeSubmissionTestResult" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "testCaseId" TEXT,
    "judge0Token" TEXT,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'QUEUED',
    "passed" BOOLEAN NOT NULL DEFAULT false,
    "executionTimeMs" INTEGER,
    "memoryUsedKb" INTEGER,
    "stdout" TEXT,
    "stderr" TEXT,
    "compileOutput" TEXT,
    "earnedWeight" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "order" INTEGER NOT NULL DEFAULT 1,
    "isHidden" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CodeSubmissionTestResult_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CodeSubmissionTestResult_submissionId_idx" ON "CodeSubmissionTestResult"("submissionId");

-- CreateIndex
CREATE INDEX "CodeSubmissionTestResult_testCaseId_idx" ON "CodeSubmissionTestResult"("testCaseId");

-- CreateIndex
CREATE INDEX "CodeSubmissionTestResult_judge0Token_idx" ON "CodeSubmissionTestResult"("judge0Token");

-- CreateIndex
CREATE INDEX "CodeSubmission_mode_idx" ON "CodeSubmission"("mode");

-- AddForeignKey
ALTER TABLE "CodeSubmissionTestResult" ADD CONSTRAINT "CodeSubmissionTestResult_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "CodeSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CodeSubmissionTestResult" ADD CONSTRAINT "CodeSubmissionTestResult_testCaseId_fkey" FOREIGN KEY ("testCaseId") REFERENCES "CodingTestCase"("id") ON DELETE SET NULL ON UPDATE CASCADE;
