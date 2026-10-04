const questionService = require('../services/questionService');
const { success } = require('../utils/response');

/**
 * Question Controller
 */

exports.createQuestion = async (req, res, next) => {
  try {
    const question = await questionService.createQuestion(req.body);
    return success(res, question, 'PracticeQuestion created successfully', 201);
  } catch (err) {
    next(err);
  }
};

exports.getQuestions = async (req, res, next) => {
  try {
    const questions = await questionService.getQuestions(req.query);
    return success(res, questions, 'Questions retrieved successfully', 200);
  } catch (err) {
    next(err);
  }
};

exports.getQuestionById = async (req, res, next) => {
  try {
    const question = await questionService.getQuestionById(req.params.questionId);
    return success(res, question, 'Question details retrieved successfully', 200);
  } catch (err) {
    next(err);
  }
};
