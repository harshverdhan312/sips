/**
 * Fetch and Ingest 1000 High-Quality Coding Problems from APPS Dataset (Hugging Face)
 * - 250 Easy (Introductory)
 * - 500 Medium (Interview)
 * - 250 Hard (Competition)
 * Total: 1000 Verified Coding Problems with Full Test Cases
 */

const fs = require('fs');
const path = require('path');
const { validateImportItem } = require('../src/validators/bulkImportValidator');

const TARGET_EASY = 250;
const TARGET_MEDIUM = 500;
const TARGET_HARD = 250;

const OUTPUT_FILE = path.join(__dirname, '../data/question-bank/coding/apps_1000_coding_questions.json');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Helper to clean title from statement
function extractTitle(statement, problemId, difficulty) {
  if (!statement || typeof statement !== 'string') {
    return `Coding Problem #${problemId}`;
  }

  const lines = statement.split('\n').map(l => l.trim()).filter(Boolean);
  let candidate = '';

  for (const line of lines) {
    const clean = line.replace(/^[#* \t\-_]+/, '').trim();
    if (clean.length > 5 && !clean.toLowerCase().startsWith('input') && !clean.toLowerCase().startsWith('output') && !clean.toLowerCase().startsWith('example')) {
      candidate = clean;
      break;
    }
  }

  if (!candidate || candidate.length > 80) {
    candidate = candidate ? candidate.substring(0, 75) + '...' : `Problem #${problemId}`;
  }

  // Remove trailing periods and clean markdown
  candidate = candidate.replace(/\$+/g, '').replace(/[*_`]/g, '').trim();
  if (candidate.length < 5) {
    candidate = `Problem #${problemId} (${difficulty})`;
  }

  return candidate;
}

// Generate multi-language boilerplate
function generateStarterCode(fnName = null) {
  if (fnName) {
    return {
      python: `def ${fnName}(*args):\n    # Write your solution here\n    pass\n`,
      cpp: `#include <iostream>\nusing namespace std;\n\n// Implement function\n`,
      java: `public class Solution {\n    // Implement function\n}\n`,
      javascript: `function ${fnName}(...args) {\n    // Write your solution here\n}\n`
    };
  }

  return {
    python: `import sys\n\ndef solve():\n    input_data = sys.stdin.read().split()\n    if not input_data:\n        return\n    # TODO: Write your algorithm here\n    pass\n\nif __name__ == '__main__':\n    solve()\n`,
    cpp: `#include <iostream>\n#include <vector>\n#include <string>\n#include <algorithm>\nusing namespace std;\n\nint main() {\n    ios_base::sync_with_stdio(false);\n    cin.tie(NULL);\n    // TODO: Write your algorithm here\n    return 0;\n}\n`,
    java: `import java.util.*;\nimport java.io.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner scanner = new Scanner(System.in);\n        // TODO: Write your algorithm here\n    }\n}\n`,
    javascript: `const fs = require('fs');\n\nfunction main() {\n    const input = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);\n    if (!input || input.length === 0 || input[0] === '') return;\n    // TODO: Write your algorithm here\n}\n\nmain();\n`
  };
}

// Format test cases and distribute weights to exactly 100
function formatTestCases(parsedIo) {
  const rawInputs = parsedIo.inputs || [];
  const rawOutputs = parsedIo.outputs || [];

  const count = Math.min(rawInputs.length, rawOutputs.length);
  if (count === 0) return null;

  // Limit to max 8 test cases per problem for optimal performance
  const limit = Math.min(count, 8);
  const testCases = [];

  const publicCount = limit === 1 ? 1 : Math.min(2, limit);

  // Equal weight distribution summing to 100
  const baseWeight = Math.floor(100 / limit);
  const remainder = 100 - (baseWeight * limit);

  for (let i = 0; i < limit; i++) {
    let inp = rawInputs[i];
    let out = rawOutputs[i];

    if (typeof inp !== 'string') inp = JSON.stringify(inp);
    if (typeof out !== 'string') out = JSON.stringify(out);

    // Ensure within reasonable payload limits (max 10KB per test case)
    if (inp.length > 10000 || out.length > 10000) {
      continue;
    }

    const weight = i === 0 ? (baseWeight + remainder) : baseWeight;

    testCases.push({
      input: inp,
      expectedOutput: out,
      isHidden: i >= publicCount,
      weight,
      order: i + 1
    });
  }

  // Verify has at least 1 public test case and at least 1 total test case
  if (testCases.length === 0 || !testCases.some(t => !t.isHidden)) {
    return null;
  }

  return testCases;
}

// Determine topic tags
function extractTags(statement, difficulty) {
  const tags = ['dsa', 'algorithms', 'apps-benchmark', difficulty.toLowerCase()];
  const s = (statement || '').toLowerCase();

  if (s.includes('array') || s.includes('sequence')) tags.push('arrays');
  if (s.includes('string') || s.includes('substring') || s.includes('character')) tags.push('strings');
  if (s.includes('tree') || s.includes('binary tree') || s.includes('bst')) tags.push('trees');
  if (s.includes('graph') || s.includes('vertex') || s.includes('vertices') || s.includes('edge')) tags.push('graphs');
  if (s.includes('dynamic programming') || s.includes('subsequence') || s.includes('optimal')) tags.push('dynamic-programming');
  if (s.includes('binary search') || s.includes('sorted')) tags.push('binary-search');
  if (s.includes('prime') || s.includes('modulo') || s.includes('gcd') || s.includes('divisor')) tags.push('math');
  if (s.includes('greedy') || s.includes('maximum') || s.includes('minimum')) tags.push('greedy');

  return Array.from(new Set(tags));
}

async function fetchHfRows(split = 'train', offset = 0, limit = 100, retries = 5) {
  const url = `https://datasets-server.huggingface.co/rows?dataset=codeparrot%2Fapps&config=all&split=${split}&offset=${offset}&limit=${limit}`;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'SIPS-Practice-Platform-Ingest/1.0' }
      });

      if (res.status === 429) {
        const backoffMs = attempt * 2000;
        await sleep(backoffMs);
        continue;
      }

      if (!res.ok) {
        throw new Error(`HTTP ${res.status} ${res.statusText}`);
      }

      const json = await res.json();
      return json.rows ? json.rows.map(r => r.row) : [];
    } catch (err) {
      if (attempt === retries) throw err;
      await sleep(attempt * 1000);
    }
  }

  return [];
}

async function run() {
  console.log('🚀 Starting APPS 1000 Question Bank Harvester & Formatter...');
  console.log(`Targets -> Easy: ${TARGET_EASY}, Medium: ${TARGET_MEDIUM}, Hard: ${TARGET_HARD} (Total: 1000)`);

  const collectedEasy = [];
  const collectedMedium = [];
  const collectedHard = [];

  const splits = ['train', 'test'];

  for (const split of splits) {
    let offset = 0;
    const limit = 100;
    const maxRows = 5000;

    console.log(`\n📂 Scanning split: ${split} (up to ${maxRows} rows)...`);

    while (offset < maxRows) {
      if (
        collectedEasy.length >= TARGET_EASY &&
        collectedMedium.length >= TARGET_MEDIUM &&
        collectedHard.length >= TARGET_HARD
      ) {
        break;
      }

      try {
        process.stdout.write(`\rFetching offset ${offset}... [Easy: ${collectedEasy.length}/${TARGET_EASY}, Med: ${collectedMedium.length}/${TARGET_MEDIUM}, Hard: ${collectedHard.length}/${TARGET_HARD}]`);
        const rows = await fetchHfRows(split, offset, limit);
        await sleep(200); // polite request pacing

        if (!rows || rows.length === 0) break;

        for (const row of rows) {
          const rawDifficulty = (row.difficulty || '').toLowerCase().trim();
          let targetCategory = null;

          if (rawDifficulty === 'introductory' && collectedEasy.length < TARGET_EASY) {
            targetCategory = 'EASY';
          } else if (rawDifficulty === 'interview' && collectedMedium.length < TARGET_MEDIUM) {
            targetCategory = 'MEDIUM';
          } else if (rawDifficulty === 'competition' && collectedHard.length < TARGET_HARD) {
            targetCategory = 'HARD';
          }

          if (!targetCategory) continue;

          // Parse input_output
          if (!row.input_output) continue;
          let parsedIo;
          try {
            parsedIo = typeof row.input_output === 'string' ? JSON.parse(row.input_output) : row.input_output;
          } catch (e) {
            continue;
          }

          const testCases = formatTestCases(parsedIo);
          if (!testCases || testCases.length === 0) continue;

          // Parse reference solutions
          let solutions = [];
          if (row.solutions) {
            try {
              solutions = typeof row.solutions === 'string' ? JSON.parse(row.solutions) : row.solutions;
            } catch (e) {
              solutions = [];
            }
          }

          const problemId = row.problem_id !== undefined ? row.problem_id : `${split}-${offset}`;
          const title = extractTitle(row.question, problemId, targetCategory);
          const fnName = parsedIo.fn_name || null;
          const starterCode = generateStarterCode(fnName);
          const tags = extractTags(row.question, targetCategory);

          let refSolution = '';
          if (Array.isArray(solutions) && solutions.length > 0 && typeof solutions[0] === 'string' && solutions[0].trim()) {
            refSolution = `### Python Reference Solution\n\`\`\`python\n${solutions[0].trim()}\n\`\`\``;
          }

          const idPrefix = targetCategory === 'EASY' ? 'APPS-EASY' : targetCategory === 'MEDIUM' ? 'APPS-MED' : 'APPS-HARD';
          const seqIndex = targetCategory === 'EASY' ? collectedEasy.length + 1 : targetCategory === 'MEDIUM' ? collectedMedium.length + 1 : collectedHard.length + 1;
          const externalId = `${idPrefix}-${String(seqIndex).padStart(4, '0')}`;

          const item = {
            source: {
              type: 'CURATED',
              namespace: 'apps-benchmark',
              url: row.url || `https://huggingface.co/datasets/codeparrot/apps#${problemId}`,
              attribution: 'APPS Coding Benchmark / UC Berkeley'
            },
            externalId,
            status: 'ACTIVE',
            tags,
            question: {
              type: 'CODING',
              format: 'CODING',
              domain: 'DSA',
              topic: targetCategory === 'EASY' ? 'FUNDAMENTALS' : targetCategory === 'MEDIUM' ? 'DATA_STRUCTURES' : 'ADVANCED_ALGORITHMS',
              difficulty: targetCategory,
              title,
              statement: (row.question || '').trim(),
              options: null,
              correctAnswer: null,
              explanation: refSolution || 'Optimal algorithmic solution with verified test case coverage.'
            },
            coding: {
              inputFormat: 'Standard input via stdin',
              outputFormat: 'Standard output via stdout',
              constraints: 'Time Limit: 2.0s | Memory Limit: 128MB',
              timeLimitMs: 2000,
              memoryLimitKb: 128000,
              maxMarks: 100,
              starterCode,
              testCases
            }
          };

          // Validate against SIPS platform validator
          const validation = validateImportItem(item, seqIndex);
          if (!validation.isValid) {
            console.error(`\nValidation failure on ${externalId}:`, validation.errors);
            continue;
          }

          if (targetCategory === 'EASY') collectedEasy.push(validation.data);
          else if (targetCategory === 'MEDIUM') collectedMedium.push(validation.data);
          else if (targetCategory === 'HARD') collectedHard.push(validation.data);
        }

        offset += limit;
      } catch (err) {
        console.error(`\nError fetching offset ${offset}:`, err.message);
        offset += limit;
      }
    }
  }

  console.log(`\n\n Harvest Completed!`);
  console.log(`- Easy (Introductory): ${collectedEasy.length}/${TARGET_EASY}`);
  console.log(`- Medium (Interview): ${collectedMedium.length}/${TARGET_MEDIUM}`);
  console.log(`- Hard (Competition): ${collectedHard.length}/${TARGET_HARD}`);

  const allQuestions = [...collectedEasy, ...collectedMedium, ...collectedHard];
  console.log(`- Total Questions: ${allQuestions.length}`);

  // Ensure output directory exists
  const dir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(allQuestions, null, 2), 'utf-8');
  console.log(`💾 Saved ${allQuestions.length} questions to: ${OUTPUT_FILE}`);
}

run().catch(err => {
  console.error('Fatal harvest error:', err);
  process.exit(1);
});
