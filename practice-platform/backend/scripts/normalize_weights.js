const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../data/question-bank/coding/apps_1000_coding_questions.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

console.log(`Normalizing test case weights for ${data.length} problems...`);

for (const item of data) {
  if (item.coding && Array.isArray(item.coding.testCases) && item.coding.testCases.length > 0) {
    const tcs = item.coding.testCases;
    const n = tcs.length;
    const baseW = Math.floor(100 / n);
    const rem = 100 - (baseW * n);

    for (let i = 0; i < n; i++) {
      tcs[i].weight = i === 0 ? (baseW + rem) : baseW;
      tcs[i].order = i + 1;
    }
  }
}

fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
console.log('✅ All test case weights successfully normalized to exactly 100.00!');
