const fs = require('fs');
const path = require('path');
const prisma = require('../src/utils/prisma');

function loadDataFiles() {
  const dataDir = path.join(__dirname, 'data');
  const allQuestions = [];

  if (!fs.existsSync(dataDir)) {
    return [];
  }

  const files = fs.readdirSync(dataDir).filter((f) => f.endsWith('.json'));
  console.log(`Found ${files.length} modular question bank files in prisma/data/`);

  for (const file of files) {
    const filePath = path.join(dataDir, file);
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const data = JSON.parse(content);
      const items = Array.isArray(data) ? data : (data.items || []);
      console.log(`  - ${file}: loaded ${items.length} questions`);
      allQuestions.push(...items);
    } catch (err) {
      console.error(`  - Failed to load ${file}:`, err.message);
    }
  }

  return allQuestions;
}

async function seed() {
  console.log('--- Seeding SIPS Practice Questions & Coding Banks ---');

  // 1. Purge legacy NeetCode 150 questions if present in database
  try {
    const neetcodeQuestions = await prisma.practiceQuestion.findMany({
      where: {
        OR: [
          { sourceNamespace: 'neetcode-150' },
          { externalId: { startsWith: 'nc-' } },
          { sourceUrl: { contains: 'neetcode' } }
        ]
      },
      select: {
        id: true,
        versions: {
          select: {
            id: true,
            codingProblem: {
              select: { id: true }
            }
          }
        }
      }
    });

    if (neetcodeQuestions.length > 0) {
      const qIds = neetcodeQuestions.map(q => q.id);
      const vIds = neetcodeQuestions.flatMap(q => q.versions.map(v => v.id));
      const cpIds = neetcodeQuestions.flatMap(q => q.versions.map(v => v.codingProblem?.id).filter(Boolean));

      await prisma.$transaction(async (tx) => {
        if (vIds.length > 0) {
          await tx.questionResponse.deleteMany({ where: { questionVersionId: { in: vIds } } });
          await tx.assessmentResponse.deleteMany({ where: { questionVersionId: { in: vIds } } });
          await tx.codeSubmission.deleteMany({ where: { questionVersionId: { in: vIds } } });
          await tx.contestQuestion.deleteMany({ where: { questionVersionId: { in: vIds } } });
          await tx.assessmentQuestion.deleteMany({ where: { questionVersionId: { in: vIds } } });
        }
        if (cpIds.length > 0) {
          await tx.codingTestCase.deleteMany({ where: { codingProblemId: { in: cpIds } } });
          await tx.codingProblem.deleteMany({ where: { id: { in: cpIds } } });
        }
        if (vIds.length > 0) {
          await tx.questionVersion.deleteMany({ where: { id: { in: vIds } } });
        }
        await tx.practiceQuestion.deleteMany({ where: { id: { in: qIds } } });
      }, {
        maxWait: 20000,
        timeout: 60000
      });

      console.log(`✓ Successfully purged ${neetcodeQuestions.length} legacy NeetCode 150 questions and all associated responses from PostgreSQL.`);
    } else {
      console.log('✓ No legacy NeetCode questions found in PostgreSQL database.');
    }
  } catch (err) {
    console.warn('Notice: Could not purge legacy neetcode questions:', err.message);
  }

  // Synchronize difficulty-based marks on existing CodingProblems
  try {
    const easyUpdated = await prisma.$executeRawUnsafe(`
      UPDATE "CodingProblem" cp
      SET "maxMarks" = 20.0
      FROM "QuestionVersion" qv
      JOIN "PracticeQuestion" pq ON qv."questionId" = pq."id"
      WHERE cp."questionVersionId" = qv."id"
        AND pq."difficulty" = 'EASY'
        AND cp."maxMarks" != 20.0;
    `);
    const medUpdated = await prisma.$executeRawUnsafe(`
      UPDATE "CodingProblem" cp
      SET "maxMarks" = 50.0
      FROM "QuestionVersion" qv
      JOIN "PracticeQuestion" pq ON qv."questionId" = pq."id"
      WHERE cp."questionVersionId" = qv."id"
        AND pq."difficulty" = 'MEDIUM'
        AND cp."maxMarks" != 50.0;
    `);
    const hardUpdated = await prisma.$executeRawUnsafe(`
      UPDATE "CodingProblem" cp
      SET "maxMarks" = 100.0
      FROM "QuestionVersion" qv
      JOIN "PracticeQuestion" pq ON qv."questionId" = pq."id"
      WHERE cp."questionVersionId" = qv."id"
        AND pq."difficulty" = 'HARD'
        AND cp."maxMarks" != 100.0;
    `);
    if (easyUpdated > 0 || medUpdated > 0 || hardUpdated > 0) {
      console.log(`✓ Synchronized difficulty marks: ${easyUpdated} Easy (20pts), ${medUpdated} Medium (50pts), ${hardUpdated} Hard (100pts)`);
    }
  } catch (err) {
    console.warn('Note: Could not run difficulty sync SQL:', err.message);
  }

  // Log current database question counts
  try {
    const totalInDb = await prisma.practiceQuestion.count();
    const codingInDb = await prisma.practiceQuestion.count({ where: { type: 'CODING' } });
    const mcqInDb = await prisma.practiceQuestion.count({ where: { type: { in: ['APTITUDE', 'TECHNICAL'] } } });
    console.log(`Database Status before sync: ${totalInDb} total questions (${codingInDb} Coding, ${mcqInDb} MCQ/Aptitude)`);
  } catch (_) {}

  const questionsToSeed = loadDataFiles();
  console.log(`Total questions in dataset: ${questionsToSeed.length}`);

  // Fetch all existing externalIds and titles in one query for fast O(1) lookup
  const existingQuestions = await prisma.practiceQuestion.findMany({
    where: { collegeId: null },
    select: { externalId: true }
  });
  const existingVersions = await prisma.questionVersion.findMany({
    select: { title: true }
  });

  const existingExternalIds = new Set(existingQuestions.map((q) => q.externalId).filter(Boolean));
  const existingTitles = new Set(existingVersions.map((v) => v.title).filter(Boolean));

  let createdCount = 0;
  let skippedCount = 0;

  // Filter out existing questions
  const newQuestions = [];
  for (const q of questionsToSeed) {
    const title = (q.title || (q.versions && q.versions[0]?.title) || '').trim();
    const externalId = q.externalId || null;

    if (externalId && existingExternalIds.has(externalId)) {
      skippedCount++;
      continue;
    }
    if (title && existingTitles.has(title)) {
      skippedCount++;
      continue;
    }

    if (externalId) existingExternalIds.add(externalId);
    if (title) existingTitles.add(title);
    newQuestions.push(q);
  }

  console.log(`To insert: ${newQuestions.length} new questions (Skipping ${skippedCount} existing)`);

  const BATCH_SIZE = 25;
  for (let i = 0; i < newQuestions.length; i += BATCH_SIZE) {
    const batch = newQuestions.slice(i, i + BATCH_SIZE);

    await prisma.$transaction(async (tx) => {
      for (const q of batch) {
        const title = (q.title || (q.versions && q.versions[0]?.title) || '').trim();
        const externalId = q.externalId || null;
        const sourceNamespace = q.sourceNamespace || 'sips-global';

        const newQ = await tx.practiceQuestion.create({
          data: {
            externalId,
            sourceNamespace,
            type: q.type,
            format: q.format || (q.type === 'CODING' ? 'CODING' : 'SINGLE_CHOICE'),
            category: q.category,
            subcategory: q.subcategory || null,
            difficulty: q.difficulty || 'MEDIUM',
            sourceType: q.sourceType || 'CURATED',
            collegeId: null,
            versions: {
              create: {
                versionNumber: 1,
                title: title,
                statement: q.statement,
                options: q.options || null,
                correctAnswer: q.correctAnswer || null,
                explanation: q.explanation || null
              }
            }
          },
          include: {
            versions: true
          }
        });

        if (q.type === 'CODING' && q.codingProblem) {
          const versionId = newQ.versions[0].id;
          const cp = q.codingProblem;

          const defaultMarks = q.difficulty === 'HARD' ? 100.0 : q.difficulty === 'MEDIUM' ? 50.0 : 20.0;
          const assignedMaxMarks = cp.maxMarks ? Number(cp.maxMarks) : defaultMarks;

          await tx.codingProblem.create({
            data: {
              questionVersionId: versionId,
              inputFormat: cp.inputFormat || null,
              outputFormat: cp.outputFormat || null,
              constraints: cp.constraints || null,
              timeLimitMs: cp.timeLimitMs || 2000,
              memoryLimitKb: cp.memoryLimitKb || 128000,
              maxMarks: assignedMaxMarks,
              testCases: {
                create: (cp.testCases || []).map((tc, idx) => ({
                  input: tc.input || '',
                  expectedOutput: tc.expectedOutput || '',
                  weight: tc.weight !== undefined ? tc.weight : (assignedMaxMarks / Math.max(1, (cp.testCases || []).length)),
                  isHidden: Boolean(tc.isHidden),
                  order: tc.order || idx + 1
                }))
              }
            }
          });
        }

        createdCount++;
      }
    }, {
      maxWait: 20000, // 20s max wait to acquire connection
      timeout: 60000  // 60s interactive transaction timeout for remote DB latency
    });

    console.log(`  Processed ${Math.min(i + BATCH_SIZE, newQuestions.length)} / ${newQuestions.length} questions...`);
  }

  console.log(`\n======================================================`);
  console.log(`--- Seeding Complete: ${createdCount} Created, ${skippedCount} Skipped ---`);
  console.log(`======================================================\n`);
}

if (require.main === module) {
  seed()
    .then(async () => {
      await prisma.$disconnect();
    })
    .catch(async (e) => {
      console.error('Seed error:', e);
      await prisma.$disconnect();
      process.exit(1);
    });
}

module.exports = { seed };
