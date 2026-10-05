const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../data/question-bank/coding/apps_1000_coding_questions.json');
if (!fs.existsSync(filePath)) {
  console.log('File does not exist yet.');
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
console.log('Total problems in JSON:', data.length);

const difficulties = { EASY: 0, MEDIUM: 0, HARD: 0 };
let withTestCases = 0;
let validWeights = 0;

for (const item of data) {
  const diff = item.question.difficulty;
  difficulties[diff] = (difficulties[diff] || 0) + 1;

  if (item.coding && Array.isArray(item.coding.testCases) && item.coding.testCases.length > 0) {
    withTestCases++;
    const totalW = item.coding.testCases.reduce((sum, t) => sum + Number(t.weight || 0), 0);
    if (totalW === 100) validWeights++;
  }
}

console.log('Difficulty breakdown:', difficulties);
console.log('Problems with test cases:', withTestCases);
console.log('Problems with test case weights summing to 100:', validWeights);
