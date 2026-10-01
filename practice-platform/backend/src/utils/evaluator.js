/**
 * Objective Question & Code Execution Evaluator
 * Compares candidate responses and code execution stdout with expected definitions.
 */

function normalizeValue(val) {
  if (val === null || val === undefined) return '';
  return String(val).trim().toLowerCase();
}

/**
 * Normalizes code execution stdout and expected output for deterministic comparison:
 * 1. Convert CRLF (\r\n) to LF (\n).
 * 2. Trim trailing whitespace from each line.
 * 3. Remove trailing empty lines and end-of-output whitespace.
 * @param {string|null|undefined} str
 * @returns {string}
 */
function normalizeCodeOutput(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map((line) => line.replace(/[ \t]+$/, ''))
    .join('\n')
    .trimEnd();
}

/**
 * Compare actual stdout against expected output
 * @param {string} actualStdout
 * @param {string} expectedOutput
 * @returns {boolean}
 */
function compareCodeOutputs(actualStdout, expectedOutput) {
  const normActual = normalizeCodeOutput(actualStdout);
  const normExpected = normalizeCodeOutput(expectedOutput);
  return normActual === normExpected;
}

/**
 * Evaluate candidate response against question format and correctAnswer
 * @param {string} format - QuestionFormat enum (SINGLE_CHOICE, MULTIPLE_CHOICE, TRUE_FALSE, NUMERICAL)
 * @param {object|any} correctAnswer - Server-side correctAnswer payload
 * @param {object|any} candidateAnswer - Candidate's submitted answerData
 * @returns {boolean} true if correct, false otherwise
 */
function evaluateResponse(format, correctAnswer, candidateAnswer) {
  if (!correctAnswer || !candidateAnswer) {
    return false;
  }

  switch (format) {
    case 'SINGLE_CHOICE': {
      const correctId = typeof correctAnswer === 'object' && correctAnswer !== null
        ? correctAnswer.optionId || correctAnswer.correctOptionId || correctAnswer.id
        : String(correctAnswer);

      const candidateId = typeof candidateAnswer === 'object' && candidateAnswer !== null
        ? candidateAnswer.optionId || candidateAnswer.id
        : String(candidateAnswer);

      if (!correctId || !candidateId) return false;
      return normalizeValue(correctId) === normalizeValue(candidateId);
    }

    case 'MULTIPLE_CHOICE': {
      const correctIds = Array.isArray(correctAnswer)
        ? correctAnswer
        : Array.isArray(correctAnswer.optionIds)
        ? correctAnswer.optionIds
        : [];

      const candidateIds = Array.isArray(candidateAnswer)
        ? candidateAnswer
        : Array.isArray(candidateAnswer.optionIds)
        ? candidateAnswer.optionIds
        : [];

      if (!correctIds.length || !candidateIds.length) return false;
      if (correctIds.length !== candidateIds.length) return false;

      const normalizedCorrect = correctIds.map(normalizeValue).sort();
      const normalizedCandidate = candidateIds.map(normalizeValue).sort();

      return normalizedCorrect.every((val, index) => val === normalizedCandidate[index]);
    }

    case 'TRUE_FALSE': {
      let correctVal;
      if (typeof correctAnswer === 'object' && correctAnswer !== null) {
        correctVal = correctAnswer.value !== undefined ? correctAnswer.value : correctAnswer.answer;
      } else {
        correctVal = correctAnswer;
      }

      let candidateVal;
      if (typeof candidateAnswer === 'object' && candidateAnswer !== null) {
        candidateVal = candidateAnswer.value !== undefined ? candidateAnswer.value : candidateAnswer.answer;
      } else {
        candidateVal = candidateAnswer;
      }

      if (correctVal === undefined || candidateVal === undefined) return false;

      const cBool = typeof correctVal === 'boolean' ? correctVal : normalizeValue(correctVal) === 'true';
      const uBool = typeof candidateVal === 'boolean' ? candidateVal : normalizeValue(candidateVal) === 'true';

      return cBool === uBool;
    }

    case 'NUMERICAL': {
      let correctNum;
      let tolerance = 0;

      if (typeof correctAnswer === 'object' && correctAnswer !== null) {
        correctNum = Number(correctAnswer.value !== undefined ? correctAnswer.value : correctAnswer.answer);
        if (typeof correctAnswer.tolerance === 'number') {
          tolerance = Math.abs(correctAnswer.tolerance);
        }
      } else {
        correctNum = Number(correctAnswer);
      }

      let candidateNum;
      if (typeof candidateAnswer === 'object' && candidateAnswer !== null) {
        candidateNum = Number(candidateAnswer.value !== undefined ? candidateAnswer.value : candidateAnswer.answer);
      } else {
        candidateNum = Number(candidateAnswer);
      }

      if (isNaN(correctNum) || isNaN(candidateNum)) return false;

      if (tolerance > 0) {
        return Math.abs(correctNum - candidateNum) <= tolerance;
      }

      return Math.abs(correctNum - candidateNum) < 1e-9;
    }

    default:
      return false;
  }
}

module.exports = {
  normalizeCodeOutput,
  compareCodeOutputs,
  evaluateResponse
};
