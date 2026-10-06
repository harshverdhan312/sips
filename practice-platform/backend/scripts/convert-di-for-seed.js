const fs = require('fs');
const path = require('path');

const inputPath = path.join(__dirname, '../data/question-bank/aptitude/data_interpretation/data_interpretation_questions.json');
const outputPath = path.join(__dirname, '../prisma/data/aptitude_data_interpretation.json');

const raw = JSON.parse(fs.readFileSync(inputPath, 'utf8'));

// Track title frequencies to deduplicate repeated titles for the seeder
const titleCounts = {};
raw.forEach(item => {
  const t = (item.question.title || '').trim();
  titleCounts[t] = (titleCounts[t] || 0) + 1;
});

const titleTracker = {};
const converted = raw.map(item => {
  const rawTitle = (item.question.title || '').trim();
  let finalTitle = rawTitle;
  if (titleCounts[rawTitle] > 1) {
    titleTracker[rawTitle] = (titleTracker[rawTitle] || 0) + 1;
    finalTitle = `${rawTitle} #${titleTracker[rawTitle]}`;
  }

  return {
    type: item.question.type,
    format: item.question.format,
    category: item.question.domain || item.question.category,
    subcategory: item.question.topic || item.question.subcategory,
    difficulty: item.question.difficulty,
    sourceType: item.source?.type || 'CURATED',
    sourceNamespace: item.source?.namespace || 'sips-global',
    externalId: item.externalId,
    title: finalTitle,
    statement: item.question.statement,
    options: item.question.options,
    correctAnswer: item.question.correctAnswer,
    explanation: item.question.explanation,
    metadata: item.question.metadata
  };
});

fs.writeFileSync(outputPath, JSON.stringify(converted, null, 2) + '\n');
console.log(`Converted ${converted.length} questions → ${outputPath}`);
