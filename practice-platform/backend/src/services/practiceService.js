const prisma = require('../utils/prisma');
const AppError = require('../utils/appError');
const { validateCreatePracticeAttempt, validateSubmitResponse } = require('../validators/practiceValidator');
const { serializeStudentQuestionVersion } = require('../utils/serializers');
const { evaluateResponse } = require('../utils/evaluator');
const { shuffleArray } = require('../utils/shuffle');

/**
 * Practice Service
 * Handles self-paced practice session lifecycle, delivery, scoring, history, progress, and streaks.
 */

/**
 * Format a Date into YYYY-MM-DD in Asia/Kolkata timezone (UTC+05:30)
 */
function formatDateToKolkata(date) {
  if (!date) return null;
  const d = new Date(date);
  // Asia/Kolkata is UTC+05:30 (330 minutes)
  const utc = d.getTime() + d.getTimezoneOffset() * 60000;
  const kolkataDate = new Date(utc + 330 * 60000);
  const year = kolkataDate.getFullYear();
  const month = String(kolkataDate.getMonth() + 1).padStart(2, '0');
  const day = String(kolkataDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Day difference between two YYYY-MM-DD strings
 */
function getDayDiff(dateStr1, dateStr2) {
  const d1 = new Date(dateStr1 + 'T00:00:00.000Z');
  const d2 = new Date(dateStr2 + 'T00:00:00.000Z');
  const diffMs = d1.getTime() - d2.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Canonical Topic Name Normalizer
 * Normalizes minor naming variations (e.g., snake_case, pluralization, casing)
 * so questions from equivalent subcategories are placed into the same topic bucket.
 */
function normalizeTopicName(topic) {
  if (!topic) return 'GENERAL';
  const clean = String(topic)
    .trim()
    .toUpperCase()
    .replace(/[_\s-]+/g, ' ')
    .trim();

  // Canonical alias mapping for common aptitude topic naming variations
  if (clean === 'DIRECTIONS' || clean === 'DIRECTION SENSE' || clean === 'DIRECTION') return 'DIRECTION SENSE';
  if (clean === 'SYLLOGISM' || clean === 'SYLLOGISMS') return 'SYLLOGISMS';
  if (clean === 'SEATING ARRANGEMENT' || clean === 'SEATING ARRANGEMENTS') return 'SEATING ARRANGEMENT';
  if (clean === 'TIME AND WORK' || clean === 'TIME & WORK') return 'TIME AND WORK';
  if (clean === 'SPEED TIME DISTANCE' || clean === 'SPEED, TIME AND DISTANCE' || clean === 'SPEED TIME AND DISTANCE') return 'SPEED TIME DISTANCE';
  if (clean === 'RATIO PROPORTION' || clean === 'RATIOS AND PROPORTIONS' || clean === 'RATIO & PROPORTION') return 'RATIO AND PROPORTION';
  if (clean === 'PERMUTATION COMBINATION' || clean === 'PERMUTATIONS AND COMBINATIONS') return 'PERMUTATIONS AND COMBINATIONS';
  if (clean === 'SIMPLE INTEREST' || clean === 'COMPOUND INTEREST' || clean === 'SIMPLE AND COMPOUND INTEREST') return 'INTEREST';
  if (clean === 'PERCENTAGES' || clean === 'PERCENTAGES AND PROFIT LOSS' || clean === 'PROFIT LOSS') return 'PERCENTAGES AND PROFIT LOSS';
  if (clean === 'IDIOMS' || clean === 'IDIOMS PHRASES' || clean === 'IDIOMS AND PHRASES') return 'IDIOMS AND PHRASES';
  if (clean === 'SENTENCE CORRECTION' || clean === 'SENTENCE COMPLETION') return 'SENTENCE CORRECTION';
  if (clean === 'SYNONYMS ANTONYMS' || clean === 'ANTONYMS & SYNONYMS') return 'SYNONYMS AND ANTONYMS';
  if (clean === 'SERIES COMPLETION' || clean === 'NUMBER SERIES') return 'NUMBER SERIES';

  return clean;
}

async function createPracticeAttempt(data, options = {}) {
  validateCreatePracticeAttempt(data);

  const { studentId, collegeId, type, category, difficulty, questionCount = 10, questionId } = data;
  const randomFn = (options && typeof options.randomFn === 'function') ? options.randomFn : Math.random;

  const where = {
    status: 'ACTIVE'
  };
  if (questionId) where.id = questionId;
  if (type) {
    const upperType = String(type).toUpperCase();
    if (['APTITUDE', 'TECHNICAL', 'CODING'].includes(upperType)) {
      where.type = upperType;
    } else if (!category) {
      where.category = { contains: type, mode: 'insensitive' };
    }
  }
  if (category) {
    const upperCat = String(category).toUpperCase();
    if (upperCat === 'APTITUDE') {
      where.type = 'APTITUDE';
    } else {
      where.category = { contains: category, mode: 'insensitive' };
    }
  }
  if (difficulty) {
    const upperDiff = String(difficulty).toUpperCase();
    if (['EASY', 'MEDIUM', 'HARD'].includes(upperDiff)) {
      where.difficulty = upperDiff;
    }
  }
  if (collegeId) {
    where.OR = [{ collegeId }, { collegeId: null }];
  }

  // Count total eligible active questions matching filters
  const totalEligible = await prisma.practiceQuestion.count({ where });

  if (!totalEligible) {
    throw new AppError('No questions available matching the requested criteria', 404);
  }

  // 1. Fetch all eligible questions matching filters across all topics (eliminates contiguous slice clustering)
  const pool = await prisma.practiceQuestion.findMany({
    where,
    orderBy: { id: 'asc' },
    include: {
      versions: {
        orderBy: { versionNumber: 'desc' },
        take: 1,
        include: {
          codingProblem: {
            include: {
              testCases: true
            }
          }
        }
      }
    }
  });

  if (!pool || !pool.length) {
    throw new AppError('No questions available matching the requested criteria', 404);
  }

  // Filter to questions with valid latest versions
  const usable = pool.filter((q) => q.versions && q.versions.length > 0);
  if (!usable.length) {
    throw new AppError('No usable question versions found', 404);
  }

  // 7. Exclude Recent Questions: Filter out questions delivered in student's recent attempts (up to last 10 attempts)
  let candidatePool = usable;
  if (studentId) {
    try {
      const recentAttempts = await prisma.practiceAttempt.findMany({
        where: {
          studentId: studentId.trim(),
          status: { in: ['SUBMITTED', 'IN_PROGRESS'] }
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          questionVersionIds: true,
          responses: {
            select: { questionVersionId: true }
          }
        }
      });
      const recentVersionIds = new Set();
      recentAttempts.forEach((a) => {
        if (Array.isArray(a.questionVersionIds)) {
          a.questionVersionIds.forEach((id) => recentVersionIds.add(id));
        }
        if (Array.isArray(a.responses)) {
          a.responses.forEach((r) => {
            if (r.questionVersionId) recentVersionIds.add(r.questionVersionId);
          });
        }
      });

      if (recentVersionIds.size > 0) {
        const unseen = usable.filter((q) => !recentVersionIds.has(q.versions[0].id) && !recentVersionIds.has(q.id));
        if (unseen.length >= questionCount) {
          candidatePool = unseen;
        } else if (unseen.length > 0) {
          // If student has practiced almost all questions, use all unseen first, then fill from seen
          const seen = usable.filter((q) => recentVersionIds.has(q.versions[0].id) || recentVersionIds.has(q.id));
          shuffleArray(seen, randomFn);
          candidatePool = [...unseen, ...seen];
        }
      }
    } catch (e) {
      // Graceful fallback if recent query fails
    }
  }

  // 2. Group by Topic (Canonical normalized subcategory, partitioned by category for general Aptitude)
  const isGeneralAptitude = !category || String(category).toUpperCase() === 'APTITUDE';
  const byTopic = {};
  for (const q of candidatePool) {
    const rawTopic = q.subcategory || q.category || 'General';
    const normalizedTopic = normalizeTopicName(rawTopic);
    // In general Aptitude, namespace by category to ensure cross-category round-robin distribution
    const topicKey = isGeneralAptitude ? `${q.category}: ${normalizedTopic}` : normalizedTopic;
    if (!byTopic[topicKey]) byTopic[topicKey] = [];
    byTopic[topicKey].push(q);
  }

  // 3. Shuffle Within Each Topic (Fisher-Yates)
  Object.values(byTopic).forEach((arr) => shuffleArray(arr, randomFn));

  // 6. Balance Difficulty (~30% Easy, ~50% Medium, ~20% Hard) if difficulty not explicitly requested
  const isExplicitDifficulty = Boolean(difficulty && ['EASY', 'MEDIUM', 'HARD'].includes(String(difficulty).toUpperCase()));
  const targetDist = { EASY: 0.3, MEDIUM: 0.5, HARD: 0.2 };
  const targetCounts = isExplicitDifficulty
    ? { [String(difficulty).toUpperCase()]: questionCount }
    : {
        EASY: Math.round(questionCount * targetDist.EASY),
        HARD: Math.round(questionCount * targetDist.HARD),
        MEDIUM: Math.max(0, questionCount - Math.round(questionCount * targetDist.EASY) - Math.round(questionCount * targetDist.HARD))
      };
  const currentDist = { EASY: 0, MEDIUM: 0, HARD: 0 };

  // 4. Round-Robin Selection: Cycle through topics until required count is reached
  const selectedQuestions = [];
  const topics = Object.keys(byTopic);
  shuffleArray(topics, randomFn);
  let topicIdx = 0;

  while (selectedQuestions.length < questionCount && topics.length > 0) {
    const topic = topics[topicIdx % topics.length];
    const arr = byTopic[topic];
    if (arr && arr.length > 0) {
      let pickIdx = -1;
      if (!isExplicitDifficulty) {
        pickIdx = arr.findIndex((q) => (currentDist[q.difficulty] || 0) < (targetCounts[q.difficulty] || 0));
      }
      if (pickIdx === -1) {
        pickIdx = 0;
      }
      const [picked] = arr.splice(pickIdx, 1);
      selectedQuestions.push(picked);
      currentDist[picked.difficulty] = (currentDist[picked.difficulty] || 0) + 1;
    } else {
      // Topic exhausted, remove from rotation
      const removeIndex = topics.indexOf(topic);
      if (removeIndex !== -1) {
        topics.splice(removeIndex, 1);
      }
      continue;
    }
    topicIdx++;
  }

  // 5. Handle Edge Cases: If topics run out before hitting count, pick randomly from remaining unused questions in pool
  if (selectedQuestions.length < questionCount) {
    const selectedSet = new Set(selectedQuestions.map((q) => q.id));
    const remaining = candidatePool.filter((q) => !selectedSet.has(q.id));
    shuffleArray(remaining, randomFn);
    selectedQuestions.push(...remaining.slice(0, questionCount - selectedQuestions.length));
  }

  // Final shuffle of selected questions so the session doesn't strictly present topics in pick order
  shuffleArray(selectedQuestions, randomFn);

  // 9. Lock versions & create attempt
  const selectedVersions = selectedQuestions.map((q) => q.versions[0]);
  const deliveredVersionIds = selectedVersions.map((v) => v.id);

  const attempt = await prisma.$transaction(async (tx) => {
    const newAttempt = await tx.practiceAttempt.create({
      data: {
        studentId: studentId.trim(),
        collegeId: collegeId.trim(),
        category: category || type || 'GENERAL',
        status: 'IN_PROGRESS',
        score: 0.0,
        totalMarks: 0.0,
        questionVersionIds: deliveredVersionIds
      }
    });

    for (const version of selectedVersions) {
      await tx.questionResponse.create({
        data: {
          practiceAttemptId: newAttempt.id,
          contestAttemptId: null,
          questionVersionId: version.id,
          answerData: {},
          isCorrect: null,
          marksAwarded: 0.0
        }
      });
    }

    return newAttempt;
  });

  return {
    attemptId: attempt.id,
    studentId: attempt.studentId,
    collegeId: attempt.collegeId,
    category: attempt.category,
    status: attempt.status,
    questionCount: selectedVersions.length,
    startedAt: attempt.startedAt
  };
}

async function getPracticeAttemptById(attemptId) {
  const attempt = await prisma.practiceAttempt.findUnique({
    where: { id: attemptId }
  });

  if (!attempt) {
    throw new AppError(`PracticeAttempt not found with id: ${attemptId}`, 404);
  }

  return attempt;
}

async function getDeliveredQuestions(attemptId) {
  const attempt = await prisma.practiceAttempt.findUnique({
    where: { id: attemptId },
    include: {
      responses: {
        include: {
          questionVersion: {
            include: {
              question: true,
              codingProblem: {
                include: {
                  testCases: {
                    orderBy: { order: 'asc' }
                  }
                }
              }
            }
          }
        }
      }
    }
  });

  if (!attempt) {
    throw new AppError(`PracticeAttempt not found with id: ${attemptId}`, 404);
  }

  // Return questions with student-safe serialization (EXCLUDES correctAnswer & hidden tests)
  const questions = attempt.responses.map((resp) => {
    const qv = resp.questionVersion;
    const safeVersion = serializeStudentQuestionVersion(qv);
    return {
      ...safeVersion,
      responseId: resp.id,
      answered: Object.keys(resp.answerData || {}).length > 0,
      currentAnswer: resp.answerData || null
    };
  });

  return {
    attemptId: attempt.id,
    status: attempt.status,
    questionCount: questions.length,
    questions
  };
}

async function recordResponse(attemptId, data) {
  validateSubmitResponse(data);
  const { questionVersionId, answerData } = data;

  const attempt = await prisma.practiceAttempt.findUnique({
    where: { id: attemptId }
  });

  if (!attempt) {
    throw new AppError(`PracticeAttempt not found with id: ${attemptId}`, 404);
  }

  if (attempt.status !== 'IN_PROGRESS') {
    throw new AppError(`Cannot submit response. PracticeAttempt is ${attempt.status}.`, 409);
  }

  // Verify that the question version belongs to this delivered attempt
  const responseRecord = await prisma.questionResponse.findFirst({
    where: {
      practiceAttemptId: attemptId,
      questionVersionId
    }
  });

  if (!responseRecord) {
    throw new AppError('The specified question does not belong to this practice attempt.', 404);
  }

  // Update response record
  const updatedResponse = await prisma.questionResponse.update({
    where: { id: responseRecord.id },
    data: {
      answerData,
      answeredAt: new Date()
    }
  });

  return {
    responseId: updatedResponse.id,
    questionVersionId: updatedResponse.questionVersionId,
    saved: true,
    answeredAt: updatedResponse.answeredAt
  };
}

async function submitPracticeAttempt(attemptId) {
  // Transactionally evaluate and finalize attempt
  const finalized = await prisma.$transaction(async (tx) => {
    const attempt = await tx.practiceAttempt.findUnique({
      where: { id: attemptId },
      include: {
        responses: {
          include: {
            questionVersion: {
              include: {
                question: true,
                codingProblem: true
              }
            }
          }
        }
      }
    });

    if (!attempt) {
      throw new AppError(`PracticeAttempt not found with id: ${attemptId}`, 404);
    }

    if (attempt.status !== 'IN_PROGRESS') {
      throw new AppError(`PracticeAttempt has already been finalized (status: ${attempt.status})`, 409);
    }

    let calculatedScore = 0.0;
    let calculatedTotalMarks = 0.0;

    for (const resp of attempt.responses) {
      const qv = resp.questionVersion;
      const format = qv.question.format;
      const isCoding = format === 'CODING' || qv.question.type === 'CODING';
      const maxMarks = qv.codingProblem ? Number(qv.codingProblem.maxMarks) : 1.0;
      calculatedTotalMarks += maxMarks;

      let isCorrect = false;
      let marksAwarded = 0.0;

      if (isCoding) {
        // For coding questions, marksAwarded and isCorrect were evaluated by Judge0 sandbox execution
        isCorrect = Boolean(resp.isCorrect);
        marksAwarded = Number(resp.marksAwarded || 0);
        calculatedScore += marksAwarded;
      } else {
        const hasAnswer = resp.answerData && Object.keys(resp.answerData).length > 0;
        if (hasAnswer) {
          isCorrect = evaluateResponse(format, qv.correctAnswer, resp.answerData);
          if (isCorrect) {
            marksAwarded = maxMarks;
            calculatedScore += maxMarks;
          }
        }
      }

      await tx.questionResponse.update({
        where: { id: resp.id },
        data: {
          isCorrect,
          marksAwarded
        }
      });
    }

    const submittedAt = new Date();

    const updatedAttempt = await tx.practiceAttempt.update({
      where: { id: attemptId },
      data: {
        status: 'SUBMITTED',
        submittedAt,
        score: calculatedScore,
        totalMarks: calculatedTotalMarks
      }
    });

    return updatedAttempt;
  });

  return {
    attemptId: finalized.id,
    status: finalized.status,
    score: Number(finalized.score),
    totalMarks: Number(finalized.totalMarks),
    submittedAt: finalized.submittedAt
  };
}

async function getPracticeResult(attemptId, { studentId = null } = {}) {
  const attempt = await prisma.practiceAttempt.findUnique({
    where: { id: attemptId },
    include: {
      responses: {
        include: {
          questionVersion: {
            include: {
              question: true,
              codingProblem: true
            }
          }
        }
      },
      submissions: {
        where: { mode: 'SUBMIT' },
        orderBy: { createdAt: 'desc' },
        include: {
          testResults: {
            include: {
              testCase: true
            },
            orderBy: { order: 'asc' }
          }
        }
      }
    }
  });

  if (!attempt) {
    throw new AppError(`PracticeAttempt not found with id: ${attemptId}`, 404);
  }

  if (studentId && attempt.studentId !== studentId.trim()) {
    throw new AppError('Unauthorized: Practice attempt belongs to another student', 403);
  }

  if (attempt.status !== 'SUBMITTED') {
    throw new AppError(`PracticeAttempt has not been submitted yet (current status: ${attempt.status})`, 400);
  }

  const score = Number(attempt.score || 0);
  const totalMarks = Number(attempt.totalMarks || 0);
  const percentage = totalMarks > 0 ? Math.round((score / totalMarks) * 10000) / 100 : 0;

  const breakdown = attempt.responses.map((resp) => {
    const qv = resp.questionVersion;
    const q = qv.question;
    const isCoding = q.type === 'CODING' || q.format === 'CODING';
    const maxMarks = qv.codingProblem ? Number(qv.codingProblem.maxMarks) : 1.0;

    const item = {
      responseId: resp.id,
      questionId: qv.questionId,
      questionVersionId: qv.id,
      title: qv.title,
      statement: qv.statement,
      type: q.type,
      format: q.format,
      category: q.category,
      subcategory: q.subcategory,
      difficulty: q.difficulty,
      options: qv.options,
      candidateAnswer: resp.answerData,
      correctAnswer: isCoding ? undefined : qv.correctAnswer,
      isCorrect: resp.isCorrect,
      marksAwarded: Number(resp.marksAwarded || 0),
      maxMarks,
      explanation: isCoding ? undefined : qv.explanation
    };

    if (isCoding) {
      const submission = attempt.submissions?.find((s) => s.questionVersionId === qv.id);
      if (submission) {
        item.codingDetails = {
          language: submission.language,
          status: submission.status,
          testsPassed: submission.testsPassed,
          testsTotal: submission.testsTotal,
          earnedMarks: Number(submission.earnedMarks),
          executionTimeMs: submission.executionTimeMs,
          memoryUsedKb: submission.memoryUsedKb,
          compileOutput: submission.compileOutput
        };
      }
    }

    return item;
  });

  return {
    attemptId: attempt.id,
    studentId: attempt.studentId,
    collegeId: attempt.collegeId,
    category: attempt.category,
    status: attempt.status,
    score,
    totalMarks,
    percentage,
    startedAt: attempt.startedAt,
    submittedAt: attempt.submittedAt,
    breakdown
  };
}

/**
 * Retrieve paginated practice history for the authenticated student
 */
async function getPracticeHistory(studentId, filters = {}) {
  const { category, status, page = 1, limit = 10 } = filters;

  const take = Math.min(Math.max(1, parseInt(limit, 10) || 10), 50);
  const currentPage = Math.max(1, parseInt(page, 10) || 1);
  const skip = (currentPage - 1) * take;

  const where = {
    studentId: studentId.trim()
  };

  if (status && ['SUBMITTED', 'IN_PROGRESS', 'ABANDONED', 'EXPIRED'].includes(status.toUpperCase())) {
    where.status = status.toUpperCase();
  }

  if (category && category.toUpperCase() !== 'ALL') {
    where.category = { contains: category, mode: 'insensitive' };
  }

  const [total, attempts] = await Promise.all([
    prisma.practiceAttempt.count({ where }),
    prisma.practiceAttempt.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        responses: {
          include: {
            questionVersion: {
              include: {
                question: true
              }
            }
          }
        },
        submissions: {
          where: { mode: 'SUBMIT' },
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    })
  ]);

  const formattedAttempts = attempts.map((att) => {
    const totalMarks = Number(att.totalMarks || 0);
    const score = Number(att.score || 0);
    const percentage = totalMarks > 0 ? Math.round((score / totalMarks) * 10000) / 100 : 0;
    const questionCount = att.responses.length;
    const firstQ = att.responses[0]?.questionVersion?.question;
    const derivedType = firstQ?.type || (att.category?.toUpperCase() === 'CODING' ? 'CODING' : 'APTITUDE');

    const item = {
      attemptId: att.id,
      category: att.category || derivedType,
      type: derivedType,
      status: att.status,
      startedAt: att.startedAt,
      submittedAt: att.submittedAt,
      score,
      totalMarks,
      percentage,
      questionCount,
      createdAt: att.createdAt
    };

    if (derivedType === 'CODING' && att.submissions && att.submissions.length > 0) {
      const latestSub = att.submissions[0];
      item.codingSummary = {
        language: latestSub.language,
        status: latestSub.status,
        testsPassed: latestSub.testsPassed,
        testsTotal: latestSub.testsTotal
      };
    }

    return item;
  });

  const totalPages = Math.ceil(total / take) || 1;

  return {
    attempts: formattedAttempts,
    pagination: {
      total,
      page: currentPage,
      limit: take,
      totalPages,
      hasMore: currentPage < totalPages
    }
  };
}

/**
 * Derive overall and category-level practice progress for the authenticated student
 */
async function getPracticeProgress(studentId) {
  const [completedAttempts, inProgressCount, totalPlatformQuestions] = await Promise.all([
    prisma.practiceAttempt.findMany({
      where: {
        studentId: studentId.trim(),
        status: 'SUBMITTED'
      },
      orderBy: { submittedAt: 'desc' },
      include: {
        responses: {
          include: {
            questionVersion: {
              include: {
                question: true,
                codingProblem: true
              }
            }
          }
        }
      }
    }),
    prisma.practiceAttempt.count({
      where: {
        studentId: studentId.trim(),
        status: 'IN_PROGRESS'
      }
    }),
    prisma.practiceQuestion.count({
      where: {
        status: 'ACTIVE'
      }
    })
  ]);

  let totalScoreSum = 0.0;
  let totalMarksSum = 0.0;
  let totalQuestionsAttempted = 0;
  let totalQuestionsCorrect = 0;
  const uniqueSolvedSet = new Set();

  const categoryStats = {
    APTITUDE: { attempts: 0, scoreSum: 0.0, marksSum: 0.0, questionsAttempted: 0, questionsCorrect: 0 },
    TECHNICAL: { attempts: 0, scoreSum: 0.0, marksSum: 0.0, questionsAttempted: 0, questionsCorrect: 0 },
    CODING: { attempts: 0, scoreSum: 0.0, marksSum: 0.0, questionsAttempted: 0, questionsCorrect: 0 }
  };

  const topicMap = new Map(); // key: `${category}:${subcategory}` -> { category, subcategory, attempted, correct }

  for (const att of completedAttempts) {
    const attScore = Number(att.score || 0);
    const attTotalMarks = Number(att.totalMarks || 0);
    totalScoreSum += attScore;
    totalMarksSum += attTotalMarks;

    const firstQType = att.responses[0]?.questionVersion?.question?.type;
    const attemptMainType = firstQType || (att.category?.toUpperCase() === 'CODING' ? 'CODING' : 'APTITUDE');

    if (categoryStats[attemptMainType]) {
      categoryStats[attemptMainType].attempts += 1;
      categoryStats[attemptMainType].scoreSum += attScore;
      categoryStats[attemptMainType].marksSum += attTotalMarks;
    }

    for (const resp of att.responses) {
      const qv = resp.questionVersion;
      const q = qv?.question;
      if (!q) continue;

      const qType = q.type;
      const isAttempted = resp.answerData && Object.keys(resp.answerData).length > 0;
      const isCorrect = resp.isCorrect === true;

      if (isAttempted) {
        totalQuestionsAttempted++;
        if (categoryStats[qType]) {
          categoryStats[qType].questionsAttempted++;
        }

        if (isCorrect) {
          totalQuestionsCorrect++;
          if (q.id || qv.questionId) {
            uniqueSolvedSet.add(q.id || qv.questionId);
          }
          if (categoryStats[qType]) {
            categoryStats[qType].questionsCorrect++;
          }
        }

        // Topic tracking
        const topicKey = `${q.category || qType}:${q.subcategory || 'General'}`;
        if (!topicMap.has(topicKey)) {
          topicMap.set(topicKey, {
            category: q.category || qType,
            subcategory: q.subcategory || 'General',
            questionsAttempted: 0,
            questionsCorrect: 0
          });
        }
        const topicObj = topicMap.get(topicKey);
        topicObj.questionsAttempted++;
        if (isCorrect) {
          topicObj.questionsCorrect++;
        }
      }
    }
  }

  const overallAccuracy = totalQuestionsAttempted > 0
    ? Math.round((totalQuestionsCorrect / totalQuestionsAttempted) * 10000) / 100
    : 0.0;

  const overallAveragePercentage = totalMarksSum > 0
    ? Math.round((totalScoreSum / totalMarksSum) * 10000) / 100
    : 0.0;

  const formattedCategories = {};
  for (const [catKey, catData] of Object.entries(categoryStats)) {
    const accuracy = catData.questionsAttempted > 0
      ? Math.round((catData.questionsCorrect / catData.questionsAttempted) * 10000) / 100
      : 0.0;

    const averagePercentage = catData.marksSum > 0
      ? Math.round((catData.scoreSum / catData.marksSum) * 10000) / 100
      : 0.0;

    formattedCategories[catKey] = {
      attempts: catData.attempts,
      questionsAttempted: catData.questionsAttempted,
      questionsCorrect: catData.questionsCorrect,
      accuracy,
      averagePercentage
    };
  }

  const topics = Array.from(topicMap.values()).map((t) => ({
    category: t.category,
    subcategory: t.subcategory,
    questionsAttempted: t.questionsAttempted,
    questionsCorrect: t.questionsCorrect,
    accuracy: t.questionsAttempted > 0
      ? Math.round((t.questionsCorrect / t.questionsAttempted) * 10000) / 100
      : 0.0
  })).sort((a, b) => b.questionsAttempted - a.questionsAttempted);

  // Recent 5 completed attempts
  const recentActivity = completedAttempts.slice(0, 5).map((att) => {
    const totalMarks = Number(att.totalMarks || 0);
    const score = Number(att.score || 0);
    const percentage = totalMarks > 0 ? Math.round((score / totalMarks) * 10000) / 100 : 0;
    const firstQ = att.responses[0]?.questionVersion?.question;
    const derivedType = firstQ?.type || (att.category?.toUpperCase() === 'CODING' ? 'CODING' : 'APTITUDE');

    return {
      attemptId: att.id,
      category: att.category || derivedType,
      type: derivedType,
      score,
      totalMarks,
      percentage,
      submittedAt: att.submittedAt
    };
  });

  return {
    overall: {
      completed: completedAttempts.length,
      completedAttempts: completedAttempts.length,
      attempts: completedAttempts.length,
      totalAttempts: completedAttempts.length + inProgressCount,
      inProgressAttempts: inProgressCount,
      questionsAttempted: totalQuestionsAttempted,
      questionsCorrect: totalQuestionsCorrect,
      uniqueQuestionsSolved: uniqueSolvedSet.size,
      totalPlatformQuestions,
      accuracy: overallAccuracy,
      averagePercentage: overallAveragePercentage
    },
    categories: formattedCategories,
    topics,
    recentActivity
  };
}

/**
 * Calculate consecutive day streak and longest streak in Asia/Kolkata timezone
 */
async function getPracticeStreak(studentId) {
  const attempts = await prisma.practiceAttempt.findMany({
    where: {
      studentId: studentId.trim(),
      status: 'SUBMITTED',
      submittedAt: { not: null }
    },
    select: {
      submittedAt: true
    },
    orderBy: { submittedAt: 'asc' }
  });

  if (!attempts.length) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      activeToday: false,
      lastPracticeDate: null
    };
  }

  // Deduplicate calendar dates in Asia/Kolkata timezone (YYYY-MM-DD)
  const uniqueDatesSet = new Set();
  for (const att of attempts) {
    const dateStr = formatDateToKolkata(att.submittedAt);
    if (dateStr) {
      uniqueDatesSet.add(dateStr);
    }
  }

  const sortedDates = Array.from(uniqueDatesSet).sort();
  if (!sortedDates.length) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      activeToday: false,
      lastPracticeDate: null
    };
  }

  const lastPracticeDate = sortedDates[sortedDates.length - 1];
  const todayStr = formatDateToKolkata(new Date());

  // Calculate yesterday's date in Asia/Kolkata
  const nowUtc = Date.now();
  const yesterdayDate = new Date(nowUtc - 24 * 60 * 60 * 1000);
  const yesterdayStr = formatDateToKolkata(yesterdayDate);

  const activeToday = uniqueDatesSet.has(todayStr);

  // 1. Calculate Longest Streak
  let longestStreak = 1;
  let currentSeq = 1;

  for (let i = 1; i < sortedDates.length; i++) {
    const diff = getDayDiff(sortedDates[i], sortedDates[i - 1]);
    if (diff === 1) {
      currentSeq++;
      if (currentSeq > longestStreak) {
        longestStreak = currentSeq;
      }
    } else if (diff > 1) {
      currentSeq = 1;
    }
  }

  // 2. Calculate Current Streak
  let currentStreak = 0;
  if (activeToday || uniqueDatesSet.has(yesterdayStr)) {
    // Start counting backwards from today (if active today) or yesterday
    let checkDate = activeToday ? new Date(todayStr + 'T00:00:00.000Z') : new Date(yesterdayStr + 'T00:00:00.000Z');
    
    while (true) {
      const checkStr = formatDateToKolkata(checkDate);
      if (uniqueDatesSet.has(checkStr)) {
        currentStreak++;
        checkDate = new Date(checkDate.getTime() - 24 * 60 * 60 * 1000);
      } else {
        break;
      }
    }
  }

  return {
    currentStreak,
    longestStreak: Math.max(longestStreak, currentStreak),
    activeToday,
    lastPracticeDate
  };
}

module.exports = {
  createPracticeAttempt,
  getPracticeAttemptById,
  getDeliveredQuestions,
  recordResponse,
  submitPracticeAttempt,
  getPracticeResult,
  getPracticeHistory,
  getPracticeProgress,
  getPracticeStreak,
  shuffleArray
};
