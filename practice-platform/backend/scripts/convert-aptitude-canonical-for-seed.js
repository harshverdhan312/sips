const fs = require('fs');
const path = require('path');

const baseDir = path.join(__dirname, '../data/question-bank/aptitude');
const outputDir = path.join(__dirname, '../prisma/data');

const files = [
  {
    input: path.join(baseDir, 'logical/logical_questions.json'),
    output: path.join(outputDir, 'aptitude_canonical_logical.json'),
    defaultCategory: 'LOGICAL'
  },
  {
    input: path.join(baseDir, 'quants/aptitude_questions.json'),
    output: path.join(outputDir, 'aptitude_canonical_quantitative.json'),
    defaultCategory: 'QUANTITATIVE'
  },
  {
    input: path.join(baseDir, 'verbal/verbal_questions.json'),
    output: path.join(outputDir, 'aptitude_canonical_verbal.json'),
    defaultCategory: 'VERBAL'
  }
];

files.forEach(({ input, output, defaultCategory }) => {
  if (!fs.existsSync(input)) {
    console.error(`Input file not found: ${input}`);
    return;
  }

  const raw = JSON.parse(fs.readFileSync(input, 'utf8'));

  // Track title frequencies to deduplicate repeated titles for seeder
  const titleCounts = {};
  raw.forEach(item => {
    const t = (item.question.title || '').trim();
    titleCounts[t] = (titleCounts[t] || 0) + 1;
  });

  const titleTracker = {};
  const converted = raw.map(item => {
    const q = item.question;
    const rawTitle = (q.title || '').trim();
    let finalTitle = rawTitle;
    if (titleCounts[rawTitle] > 1) {
      titleTracker[rawTitle] = (titleTracker[rawTitle] || 0) + 1;
      finalTitle = `${rawTitle} #${titleTracker[rawTitle]}`;
    }

    return {
      type: q.type || 'APTITUDE',
      format: q.format || 'SINGLE_CHOICE',
      category: q.domain || q.category || defaultCategory,
      subcategory: q.topic || q.subcategory || null,
      difficulty: q.difficulty || 'MEDIUM',
      sourceType: (item.source && item.source.type) ? (item.source.type === 'ORIGINAL' ? 'CURATED' : item.source.type) : 'CURATED',
      sourceNamespace: (item.source && item.source.namespace) || 'sips-global',
      externalId: item.externalId,
      title: finalTitle,
      statement: q.statement,
      options: q.options || [],
      correctAnswer: q.correctAnswer || null,
      explanation: q.explanation || '',
      metadata: q.metadata || null
    };
  });

  fs.writeFileSync(output, JSON.stringify(converted, null, 2) + '\n', 'utf8');
  console.log(`Converted ${converted.length} questions from ${path.basename(input)} → ${path.basename(output)}`);
});
