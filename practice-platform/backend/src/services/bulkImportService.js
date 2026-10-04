const prisma = require('../utils/prisma');
const { validateImportItem } = require('../validators/bulkImportValidator');

const BATCH_SIZE = 25;

/**
 * Deep equality helper for options array
 */
function areOptionsEqual(opt1, opt2) {
  if (!opt1 && !opt2) return true;
  if (!opt1 || !opt2) return false;
  if (opt1.length !== opt2.length) return false;
  
  const sorted1 = [...opt1].sort((a, b) => String(a.id).localeCompare(String(b.id)));
  const sorted2 = [...opt2].sort((a, b) => String(a.id).localeCompare(String(b.id)));
  
  return JSON.stringify(sorted1) === JSON.stringify(sorted2);
}

/**
 * Deep equality helper for test cases
 */
function areTestCasesEqual(tc1, tc2) {
  if (!tc1 && !tc2) return true;
  if (!tc1 || !tc2) return false;
  if (tc1.length !== tc2.length) return false;

  const normalize = (arr) => arr.map(t => ({
    input: (t.input || '').trim().replace(/\r\n/g, '\n'),
    expectedOutput: (t.expectedOutput || '').trim().replace(/\r\n/g, '\n'),
    isHidden: Boolean(t.isHidden),
    weight: Number(t.weight !== undefined ? t.weight : 1)
  })).sort((a, b) => a.input.localeCompare(b.input) || a.expectedOutput.localeCompare(b.expectedOutput));

  return JSON.stringify(normalize(tc1)) === JSON.stringify(normalize(tc2));
}

/**
 * Deep equality helper for starter code
 */
function areStarterCodesEqual(code1, code2) {
  if (!code1 && !code2) return true;
  if (!code1 || !code2) return false;
  const keys = Array.from(new Set([...Object.keys(code1), ...Object.keys(code2)]));
  for (const k of keys) {
    const s1 = (code1[k] || '').trim().replace(/\r\n/g, '\n');
    const s2 = (code2[k] || '').trim().replace(/\r\n/g, '\n');
    if (s1 !== s2) return false;
  }
  return true;
}

/**
 * Check if the latest QuestionVersion content matches the incoming import payload.
 */
function isContentIdentical(latestVersion, item) {
  if (!latestVersion) return false;

  const q = item.question || {};
  const isTitleEqual = (latestVersion.title || '').trim() === (q.title || '').trim();
  const isStatementEqual = (latestVersion.statement || '').trim().replace(/\r\n/g, '\n') === (q.statement || '').trim().replace(/\r\n/g, '\n');
  const isExplanationEqual = (latestVersion.explanation || '').trim() === (q.explanation || '').trim();
  
  const isCorrectAnswerEqual = JSON.stringify(latestVersion.correctAnswer) === JSON.stringify(q.correctAnswer !== undefined ? q.correctAnswer : null);
  const isOptionsEqual = areOptionsEqual(latestVersion.options, q.options);

  if (!isTitleEqual || !isStatementEqual || !isExplanationEqual || !isCorrectAnswerEqual || !isOptionsEqual) {
    return false;
  }

  // If question is CODING, also check CodingProblem + TestCases
  if (q.type === 'CODING') {
    const cp = latestVersion.codingProblem;
    if (!cp) return false;

    const coding = item.coding || {};
    const metadata = latestVersion.metadata || {};
    const existingStarterCode = metadata.starterCode || {};
    const incomingStarterCode = coding.starterCode || {};
    const starterCodeEqual = areStarterCodesEqual(existingStarterCode, incomingStarterCode);

    const constraintsEqual = (cp.constraints || '').trim().replace(/\r\n/g, '\n') === (coding.constraints || '').trim().replace(/\r\n/g, '\n');
    const inputFormatEqual = (cp.inputFormat || '').trim().replace(/\r\n/g, '\n') === (coding.inputFormat || '').trim().replace(/\r\n/g, '\n');
    const outputFormatEqual = (cp.outputFormat || '').trim().replace(/\r\n/g, '\n') === (coding.outputFormat || '').trim().replace(/\r\n/g, '\n');
    const timeLimitEqual = Number(cp.timeLimitMs) === Number(coding.timeLimitMs || 2000);
    const memoryLimitEqual = Number(cp.memoryLimitKb) === Number(coding.memoryLimitKb || 128000);
    const maxMarksEqual = Number(cp.maxMarks) === Number(coding.maxMarks || 100);
    const testCasesEqual = areTestCasesEqual(cp.testCases, coding.testCases);

    return (
      starterCodeEqual &&
      constraintsEqual &&
      inputFormatEqual &&
      outputFormatEqual &&
      timeLimitEqual &&
      memoryLimitEqual &&
      maxMarksEqual &&
      testCasesEqual
    );
  }

  return true;
}

/**
 * Bulk imports question records in bounded transactional batches.
 * 
 * @param {Array<Object>} items - Array of import question payloads
 * @param {Object} [context] - Execution context (e.g. { collegeId, userId })
 * @returns {Promise<Object>} Ingestion summary { total, inserted, versioned, skipped, failed, errors }
 */
async function importQuestions(items, context = {}) {
  if (!Array.isArray(items)) {
    throw new Error('Items must be an array of question payloads.');
  }

  const summary = {
    total: items.length,
    inserted: 0,
    versioned: 0,
    skipped: 0,
    failed: 0,
    errors: []
  };

  if (items.length === 0) {
    return summary;
  }

  // Pre-validate all items upfront and partition into batches
  const validatedItems = [];
  for (let i = 0; i < items.length; i++) {
    const validation = validateImportItem(items[i], i);
    if (!validation.isValid) {
      summary.failed++;
      summary.errors.push(...validation.errors);
    } else {
      validatedItems.push({
        rawIndex: i,
        data: validation.data
      });
    }
  }

  // Chunk valid items into bounded batches
  for (let i = 0; i < validatedItems.length; i += BATCH_SIZE) {
    const chunk = validatedItems.slice(i, i + BATCH_SIZE);

    try {
      await prisma.$transaction(async (tx) => {
        for (const { rawIndex, data: item } of chunk) {
          const source = item.source || {};
          const sourceNamespace = source.namespace || item.sourceNamespace || null;
          const externalId = item.externalId || null;
          const collegeId = item.collegeId !== undefined ? item.collegeId : (context.collegeId || null);

          // Find existing question by composite identity if externalId is provided
          let existingQuestion = null;
          if (sourceNamespace && externalId) {
            existingQuestion = await tx.practiceQuestion.findFirst({
              where: {
                sourceNamespace,
                externalId,
                collegeId: collegeId || null
              },
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
          }

          if (!existingQuestion) {
            // ==========================================
            // INSERT: Brand new PracticeQuestion + Version 1
            // ==========================================
            const q = item.question;
            const coding = item.coding;
            const status = item.status || 'ACTIVE';
            const sourceType = source.type || 'ORIGINAL';
            const sourceUrl = source.url || null;
            const attribution = source.attribution || null;
            const tags = Array.isArray(item.tags) ? item.tags : (item.tags ? [item.tags] : []);
            const metadata = coding?.starterCode ? { starterCode: coding.starterCode } : null;

            await tx.practiceQuestion.create({
              data: {
                type: q.type,
                format: q.format || 'SINGLE_CHOICE',
                category: q.category || 'APTITUDE',
                subcategory: q.subcategory || null,
                difficulty: q.difficulty || 'MEDIUM',
                status,
                sourceType,
                sourceNamespace,
                sourceUrl,
                attribution,
                externalId,
                tags,
                collegeId: collegeId || null,
                versions: {
                  create: {
                    versionNumber: 1,
                    title: q.title,
                    statement: q.statement,
                    options: q.options || null,
                    correctAnswer: q.correctAnswer !== undefined ? q.correctAnswer : null,
                    explanation: q.explanation || null,
                    metadata,
                    ...(q.type === 'CODING' && coding ? {
                      codingProblem: {
                        create: {
                          constraints: coding.constraints || null,
                          inputFormat: coding.inputFormat || null,
                          outputFormat: coding.outputFormat || null,
                          timeLimitMs: coding.timeLimitMs || 2000,
                          memoryLimitKb: coding.memoryLimitKb || 128000,
                          maxMarks: coding.maxMarks || 100,
                          testCases: {
                            create: (coding.testCases || []).map(tc => ({
                              input: tc.input,
                              expectedOutput: tc.expectedOutput,
                              isHidden: Boolean(tc.isHidden),
                              weight: Number(tc.weight !== undefined ? tc.weight : 1)
                            }))
                          }
                        }
                      }
                    } : {})
                  }
                }
              }
            });

            summary.inserted++;
          } else {
            // ==========================================
            // EXISTING: Check if content changed
            // ==========================================
            const latestVersion = existingQuestion.versions[0];
            const contentMatches = isContentIdentical(latestVersion, item);

            if (contentMatches) {
              // Update tags / category if modified on the parent question without changing version
              const q = item.question;
              const tags = Array.isArray(item.tags) ? item.tags : (item.tags ? [item.tags] : existingQuestion.tags);
              
              await tx.practiceQuestion.update({
                where: { id: existingQuestion.id },
                data: {
                  category: q.category || existingQuestion.category,
                  subcategory: q.subcategory !== undefined ? q.subcategory : existingQuestion.subcategory,
                  tags
                }
              });

              summary.skipped++;
            } else {
              // Content changed: Append new immutable QuestionVersion
              const q = item.question;
              const coding = item.coding;
              const nextVersionNumber = (latestVersion ? latestVersion.versionNumber : 0) + 1;
              const metadata = coding?.starterCode ? { starterCode: coding.starterCode } : null;

              await tx.questionVersion.create({
                data: {
                  questionId: existingQuestion.id,
                  versionNumber: nextVersionNumber,
                  title: q.title,
                  statement: q.statement,
                  options: q.options || null,
                  correctAnswer: q.correctAnswer !== undefined ? q.correctAnswer : null,
                  explanation: q.explanation || null,
                  metadata,
                  ...(q.type === 'CODING' && coding ? {
                    codingProblem: {
                      create: {
                        constraints: coding.constraints || null,
                        inputFormat: coding.inputFormat || null,
                        outputFormat: coding.outputFormat || null,
                        timeLimitMs: coding.timeLimitMs || 2000,
                        memoryLimitKb: coding.memoryLimitKb || 128000,
                        maxMarks: coding.maxMarks || 100,
                        testCases: {
                          create: (coding.testCases || []).map(tc => ({
                            input: tc.input,
                            expectedOutput: tc.expectedOutput,
                            isHidden: Boolean(tc.isHidden),
                            weight: Number(tc.weight !== undefined ? tc.weight : 1)
                          }))
                        }
                      }
                    }
                  } : {})
                }
              });

              // Also update category/subcategory on parent question
              await tx.practiceQuestion.update({
                where: { id: existingQuestion.id },
                data: {
                  category: q.category || existingQuestion.category,
                  subcategory: q.subcategory !== undefined ? q.subcategory : existingQuestion.subcategory,
                  difficulty: q.difficulty || existingQuestion.difficulty,
                  tags: Array.isArray(item.tags) ? item.tags : existingQuestion.tags
                }
              });

              summary.versioned++;
            }
          }
        }
      });
    } catch (batchErr) {
      summary.failed += chunk.length;
      summary.errors.push({
        batchStartIndex: chunk[0].rawIndex,
        batchEndIndex: chunk[chunk.length - 1].rawIndex,
        message: `Batch transaction failed: ${batchErr.message}`
      });
    }
  }

  return summary;
}

module.exports = {
  importQuestions,
  isContentIdentical,
  areOptionsEqual,
  areTestCasesEqual
};
