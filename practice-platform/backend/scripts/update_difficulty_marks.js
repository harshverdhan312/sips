const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function getDifficultyMarks(difficulty) {
  switch ((difficulty || '').toUpperCase()) {
    case 'HARD':
      return 100.0;
    case 'MEDIUM':
      return 50.0;
    case 'EASY':
      return 20.0;
    default:
      return 50.0;
  }
}

async function main() {
  console.log('--- Updating Coding Problems and Test Cases to Difficulty-Based Marks ---');
  console.log('Rules: EASY = 20 pts | MEDIUM = 50 pts | HARD = 100 pts\n');

  const codingProblems = await prisma.codingProblem.findMany({
    include: {
      questionVersion: {
        include: {
          question: true
        }
      },
      testCases: true
    }
  });

  console.log(`Found ${codingProblems.length} CodingProblem records.`);

  let updatedCount = 0;
  for (const cp of codingProblems) {
    const difficulty = cp.questionVersion?.question?.difficulty || 'MEDIUM';
    const targetMarks = getDifficultyMarks(difficulty);

    // Update CodingProblem maxMarks
    await prisma.codingProblem.update({
      where: { id: cp.id },
      data: {
        maxMarks: targetMarks
      }
    });

    // Update testCases weights if proportional
    if (cp.testCases && cp.testCases.length > 0) {
      const weightPerCase = targetMarks / cp.testCases.length;
      for (const tc of cp.testCases) {
        await prisma.codingTestCase.update({
          where: { id: tc.id },
          data: {
            weight: weightPerCase
          }
        });
      }
    }

    updatedCount++;
    if (updatedCount % 200 === 0) {
      console.log(`  Updated ${updatedCount} / ${codingProblems.length} problems...`);
    }
  }

  console.log(`\n✓ Successfully updated ${updatedCount} CodingProblems to difficulty-based marks!`);
  
  // Verify breakdown
  const stats = await prisma.codingProblem.findMany({
    select: {
      maxMarks: true,
      questionVersion: {
        select: {
          question: {
            select: {
              difficulty: true
            }
          }
        }
      }
    }
  });

  const breakdown = {};
  for (const s of stats) {
    const diff = s.questionVersion?.question?.difficulty || 'UNKNOWN';
    const marks = s.maxMarks;
    const key = `${diff} -> ${marks} pts`;
    breakdown[key] = (breakdown[key] || 0) + 1;
  }

  console.log('Database marks breakdown:', breakdown);
}

main()
  .catch((e) => {
    console.error('Error updating marks:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
