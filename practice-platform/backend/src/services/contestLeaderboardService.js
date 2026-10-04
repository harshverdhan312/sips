const prisma = require('../utils/prisma');
const AppError = require('../utils/appError');

/**
 * Contest Leaderboard Service
 * Calculates standard competition rankings, global leaderboard pages,
 * authenticated student rank, and enforces tenant & contest lifecycle isolation.
 */

const ALLOWED_LIFECYCLE_STATUSES = ['PUBLISHED', 'LIVE', 'ENDED', 'EVALUATED', 'ARCHIVED'];

/**
 * Validate contest access and lifecycle permissions for leaderboard
 */
async function validateContestForLeaderboard(contestId, collegeId) {
  if (!contestId) {
    throw new AppError('Contest ID is required', 400);
  }

  const contest = await prisma.contest.findUnique({
    where: { id: contestId }
  });

  if (!contest) {
    throw new AppError('Contest not found', 404, { code: 'CONTEST_NOT_FOUND' });
  }

  if (contest.collegeId !== collegeId) {
    throw new AppError('Contest does not belong to your institution', 403, {
      code: 'TENANT_MISMATCH'
    });
  }

  if (contest.status === 'DRAFT') {
    throw new AppError(
      'Contest is in draft configuration and has not been published.',
      400,
      { code: 'CONTEST_NOT_STARTED' }
    );
  }

  if (contest.status === 'CANCELLED') {
    throw new AppError('Contest has been cancelled.', 400, {
      code: 'CONTEST_CANCELLED'
    });
  }

  if (!ALLOWED_LIFECYCLE_STATUSES.includes(contest.status)) {
    throw new AppError(`Contest is ${contest.status.toLowerCase()}. Leaderboard unavailable.`, 400, {
      code: 'CONTEST_NOT_ACTIVE'
    });
  }

  return contest;
}

/**
 * Calculate the global rank for a given total score in a contest
 * Standard competition rank = 1 + count(attempts with totalScore > score)
 */
async function calculateRankForScore(contestId, collegeId, score) {
  const higherCount = await prisma.contestAttempt.count({
    where: {
      contestId,
      collegeId,
      status: { in: ['SUBMITTED', 'TIMED_OUT'] },
      totalScore: { gt: score }
    }
  });

  return higherCount + 1;
}

/**
 * Get authenticated student's rank and standing in the contest
 */
async function getMyContestRank({ contestId, studentId, collegeId }) {
  await validateContestForLeaderboard(contestId, collegeId);

  const attempt = await prisma.contestAttempt.findUnique({
    where: {
      contestId_studentId: {
        contestId,
        studentId
      }
    }
  });

  if (!attempt || !['SUBMITTED', 'TIMED_OUT'].includes(attempt.status) || attempt.totalScore === null) {
    return {
      isRankable: false,
      rank: null,
      attemptId: attempt ? attempt.id : null,
      studentId,
      status: attempt ? attempt.status : 'NOT_STARTED'
    };
  }

  const rank = await calculateRankForScore(contestId, collegeId, attempt.totalScore);

  return {
    isRankable: true,
    rank,
    attemptId: attempt.id,
    studentId: attempt.studentId,
    status: attempt.status,
    totalScore: Number(attempt.totalScore),
    totalMarks: Number(attempt.totalMarks),
    codingScore: Number(attempt.codingScore),
    aptitudeScore: Number(attempt.aptitudeScore),
    technicalScore: Number(attempt.technicalScore),
    submittedAt: attempt.submittedAt
  };
}

/**
 * Get paginated contest leaderboard with standard competition ranking
 */
async function getContestLeaderboard({
  contestId,
  studentId,
  collegeId,
  page = 1,
  limit = 20
}) {
  const contest = await validateContestForLeaderboard(contestId, collegeId);

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const pageSize = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));

  const rankableWhere = {
    contestId,
    collegeId,
    status: { in: ['SUBMITTED', 'TIMED_OUT'] }
  };

  const totalEntries = await prisma.contestAttempt.count({
    where: rankableWhere
  });

  const totalPages = totalEntries > 0 ? Math.ceil(totalEntries / pageSize) : 0;

  // Retrieve myRank for authenticated student
  const myRank = await getMyContestRank({ contestId, studentId, collegeId });

  if (totalEntries === 0 || pageNum > totalPages) {
    return {
      contestId: contest.id,
      contestTitle: contest.title,
      contestStatus: contest.status,
      totalEntries,
      pagination: {
        page: pageNum,
        limit: pageSize,
        totalPages,
        totalEntries
      },
      myRank,
      entries: []
    };
  }

  // Fetch paginated attempts sorted by: totalScore DESC, submittedAt ASC, id ASC
  const attempts = await prisma.contestAttempt.findMany({
    where: rankableWhere,
    orderBy: [
      { totalScore: 'desc' },
      { submittedAt: 'asc' },
      { id: 'asc' }
    ],
    skip: (pageNum - 1) * pageSize,
    take: pageSize
  });

  // Compute global standard competition rank for each distinct score on this page
  const distinctScores = [...new Set(attempts.map((a) => Number(a.totalScore)))];
  const scoreToRankMap = new Map();

  for (const score of distinctScores) {
    const rank = await calculateRankForScore(contestId, collegeId, score);
    scoreToRankMap.set(score, rank);
  }

  const entries = attempts.map((a) => ({
    rank: scoreToRankMap.get(Number(a.totalScore)),
    attemptId: a.id,
    studentId: a.studentId,
    totalScore: Number(a.totalScore),
    totalMarks: Number(a.totalMarks),
    codingScore: Number(a.codingScore),
    aptitudeScore: Number(a.aptitudeScore),
    technicalScore: Number(a.technicalScore),
    submittedAt: a.submittedAt
  }));

  return {
    contestId: contest.id,
    contestTitle: contest.title,
    contestStatus: contest.status,
    totalEntries,
    pagination: {
      page: pageNum,
      limit: pageSize,
      totalPages,
      totalEntries
    },
    myRank,
    entries
  };
}

module.exports = {
  validateContestForLeaderboard,
  calculateRankForScore,
  getMyContestRank,
  getContestLeaderboard
};
