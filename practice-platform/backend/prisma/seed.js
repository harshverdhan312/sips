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

  const BATCH_SIZE = 50;
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

          await tx.codingProblem.create({
            data: {
              questionVersionId: versionId,
              inputFormat: cp.inputFormat || null,
              outputFormat: cp.outputFormat || null,
              constraints: cp.constraints || null,
              timeLimitMs: cp.timeLimitMs || 2000,
              memoryLimitKb: cp.memoryLimitKb || 128000,
              maxMarks: cp.maxMarks || 100.0,
              testCases: {
                create: (cp.testCases || []).map((tc, idx) => ({
                  input: tc.input || '',
                  expectedOutput: tc.expectedOutput || '',
                  weight: tc.weight !== undefined ? tc.weight : 25.0,
                  isHidden: Boolean(tc.isHidden),
                  order: tc.order || idx + 1
                }))
              }
            }
          });
        }

        createdCount++;
      }
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
