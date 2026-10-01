const contestLeaderboardService = require('../services/contestLeaderboardService');
const { success } = require('../utils/response');

/**
 * Contest Leaderboard Controller
 * Handles paginated contest leaderboards and authenticated student's rank.
 */

async function getLeaderboard(req, res, next) {
  try {
    const { contestId } = req.params;
    const { page, limit } = req.query;
    const studentId = req.user.id;
    const collegeId = req.user.collegeId;

    const result = await contestLeaderboardService.getContestLeaderboard({
      contestId,
      studentId,
      collegeId,
      page,
      limit
    });

    return success(res, result, 'Contest leaderboard retrieved successfully');
  } catch (err) {
    next(err);
  }
}

async function getMyRank(req, res, next) {
  try {
    const { contestId } = req.params;
    const studentId = req.user.id;
    const collegeId = req.user.collegeId;

    const result = await contestLeaderboardService.getMyContestRank({
      contestId,
      studentId,
      collegeId
    });

    return success(res, result, 'Contest rank retrieved successfully');
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getLeaderboard,
  getMyRank
};
