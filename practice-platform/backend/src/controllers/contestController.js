const contestService = require('../services/contestService');
const { success } = require('../utils/response');
const { serializeContest, serializeContestQuestion } = require('../utils/serializers');

/**
 * Contest Controller
 * Provides HTTP handlers for contest creation, question pinning, and lifecycle state transitions.
 * (Development / Admin endpoints)
 */

async function createContest(req, res, next) {
  try {
    const contest = await contestService.createContest(req.body);
    return success(res, serializeContest(contest, { isAdmin: true }), 'Contest created successfully', 201);
  } catch (err) {
    next(err);
  }
}

async function getContest(req, res, next) {
  try {
    const { contestId } = req.params;
    const contest = await contestService.getContestById(contestId, { includeQuestions: true });
    return success(res, serializeContest(contest, { isAdmin: true }), 'Contest retrieved successfully');
  } catch (err) {
    next(err);
  }
}

async function listContests(req, res, next) {
  try {
    const { collegeId, sipsDriveId, status, limit, offset } = req.query;
    const { contests, total } = await contestService.listContests({
      collegeId,
      sipsDriveId,
      status,
      limit,
      offset
    });

    const serialized = contests.map((c) => serializeContest(c, { isAdmin: true, includeQuestions: false }));
    return success(res, { contests: serialized, total }, 'Contests retrieved successfully');
  } catch (err) {
    next(err);
  }
}

async function addQuestion(req, res, next) {
  try {
    const { contestId } = req.params;
    const contestQuestion = await contestService.addContestQuestion(contestId, req.body);
    return success(
      res,
      serializeContestQuestion(contestQuestion, { isAdmin: true }),
      'Question added to contest successfully',
      201
    );
  } catch (err) {
    next(err);
  }
}

async function reorderQuestions(req, res, next) {
  try {
    const { contestId } = req.params;
    const contest = await contestService.reorderContestQuestions(contestId, req.body);
    return success(res, serializeContest(contest, { isAdmin: true }), 'Contest questions reordered successfully');
  } catch (err) {
    next(err);
  }
}

async function removeQuestion(req, res, next) {
  try {
    const { contestId, contestQuestionId } = req.params;
    const result = await contestService.removeContestQuestion(contestId, contestQuestionId);
    return success(res, result, 'Question removed from contest successfully');
  } catch (err) {
    next(err);
  }
}

async function publishContest(req, res, next) {
  try {
    const { contestId } = req.params;
    const contest = await contestService.publishContest(contestId);
    return success(res, serializeContest(contest, { isAdmin: true }), 'Contest published successfully');
  } catch (err) {
    next(err);
  }
}

async function markLive(req, res, next) {
  try {
    const { contestId } = req.params;
    const contest = await contestService.markContestLive(contestId);
    return success(res, serializeContest(contest, { isAdmin: true }), 'Contest marked as LIVE successfully');
  } catch (err) {
    next(err);
  }
}

async function markEnded(req, res, next) {
  try {
    const { contestId } = req.params;
    const contest = await contestService.markContestEnded(contestId);
    return success(res, serializeContest(contest, { isAdmin: true }), 'Contest marked as ENDED successfully');
  } catch (err) {
    next(err);
  }
}

async function markEvaluated(req, res, next) {
  try {
    const { contestId } = req.params;
    const contest = await contestService.markContestEvaluated(contestId);
    return success(res, serializeContest(contest, { isAdmin: true }), 'Contest marked as EVALUATED successfully');
  } catch (err) {
    next(err);
  }
}

async function archiveContest(req, res, next) {
  try {
    const { contestId } = req.params;
    const contest = await contestService.archiveContest(contestId);
    return success(res, serializeContest(contest, { isAdmin: true }), 'Contest archived successfully');
  } catch (err) {
    next(err);
  }
}

async function cancelContest(req, res, next) {
  try {
    const { contestId } = req.params;
    const contest = await contestService.cancelContest(contestId);
    return success(res, serializeContest(contest, { isAdmin: true }), 'Contest cancelled successfully');
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createContest,
  getContest,
  listContests,
  addQuestion,
  reorderQuestions,
  removeQuestion,
  publishContest,
  markLive,
  markEnded,
  markEvaluated,
  archiveContest,
  cancelContest
};
