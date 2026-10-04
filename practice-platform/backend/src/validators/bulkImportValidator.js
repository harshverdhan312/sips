const VALID_TYPES = ['CODING', 'APTITUDE', 'TECHNICAL'];
const VALID_FORMATS = ['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'TRUE_FALSE', 'NUMERICAL', 'CODING'];
const VALID_DIFFICULTIES = ['EASY', 'MEDIUM', 'HARD'];
const VALID_STATUSES = ['DRAFT', 'ACTIVE', 'ARCHIVED'];
const VALID_SOURCE_TYPES = [
  'COLLEGE_CREATED',
  'PUBLIC_SOURCE',
  'CURATED',
  'ORIGINAL',
  'THIRD_PARTY',
  'COMPANY_PROVIDED',
  'COLLEGE_PROVIDED'
];

/**
 * Validate and normalize an individual question item for bulk ingestion
 * @param {object} rawItem
 * @param {number} index
 * @returns {{ isValid: boolean, data?: object, errors?: Array<{ index: number, externalId?: string, message: string }> }}
 */
function validateImportItem(rawItem, index = 0) {
  const errors = [];

  if (!rawItem || typeof rawItem !== 'object') {
    return {
      isValid: false,
      errors: [{ index, message: `Item at index ${index} must be an object.` }]
    };
  }

  // Support structured format or flat format
  const source = rawItem.source || {};
  const question = rawItem.question || rawItem;
  const coding = rawItem.coding || rawItem.codingProblem;
  const externalId = rawItem.externalId || null;

  const type = String(question.type || rawItem.type || '').toUpperCase();
  const format = String(question.format || rawItem.format || (type === 'CODING' ? 'CODING' : 'SINGLE_CHOICE')).toUpperCase();
  const category = question.category || question.domain || rawItem.category || rawItem.domain || (type === 'CODING' ? 'CODING' : 'APTITUDE');
  const subcategory = question.subcategory || question.subCategory || question.topic || rawItem.subcategory || rawItem.topic || null;
  const difficulty = String(question.difficulty || rawItem.difficulty || 'MEDIUM').toUpperCase();
  const status = String(rawItem.status || question.status || 'ACTIVE').toUpperCase();
  const sourceType = String(source.type || rawItem.sourceType || 'ORIGINAL').toUpperCase();
  const sourceNamespace = source.namespace || rawItem.sourceNamespace || null;
  const sourceUrl = source.url || rawItem.sourceUrl || null;
  const attribution = source.attribution || rawItem.attribution || null;
  const tags = Array.isArray(rawItem.tags) ? rawItem.tags : (Array.isArray(question.tags) ? question.tags : []);

  const title = question.title || rawItem.title;
  const statement = question.statement || rawItem.statement;
  let options = question.options !== undefined ? question.options : rawItem.options;
  let rawCorrectAnswer = question.correctAnswer !== undefined ? question.correctAnswer : rawItem.correctAnswer;
  let normalizedCorrectAnswer = null;
  const explanation = question.explanation || rawItem.explanation || null;

  // 1. Basic Taxonomy & Classification Checks
  if (!VALID_TYPES.includes(type)) {
    errors.push(`Invalid or missing question type '${type}'. Must be one of: ${VALID_TYPES.join(', ')}`);
  }

  if (!VALID_FORMATS.includes(format)) {
    errors.push(`Invalid or missing question format '${format}'. Must be one of: ${VALID_FORMATS.join(', ')}`);
  }

  if (!category || typeof category !== 'string' || !category.trim()) {
    errors.push('Missing required string field: category (domain)');
  }

  if (!VALID_DIFFICULTIES.includes(difficulty)) {
    errors.push(`Invalid difficulty '${difficulty}'. Must be one of: ${VALID_DIFFICULTIES.join(', ')}`);
  }

  if (!VALID_STATUSES.includes(status)) {
    errors.push(`Invalid status '${status}'. Must be one of: ${VALID_STATUSES.join(', ')}`);
  }

  if (!VALID_SOURCE_TYPES.includes(sourceType)) {
    errors.push(`Invalid sourceType '${sourceType}'. Must be one of: ${VALID_SOURCE_TYPES.join(', ')}`);
  }

  // 2. Content Checks
  if (!title || typeof title !== 'string' || !title.trim()) {
    errors.push('Missing required string field: title');
  }

  if (!statement || typeof statement !== 'string' || !statement.trim()) {
    errors.push('Missing required string field: statement');
  }

  // 3. Format-specific Validation & Normalization
  if (format === 'SINGLE_CHOICE') {
    if (!Array.isArray(options) || options.length < 2) {
      errors.push('SINGLE_CHOICE questions must have an options array with at least 2 choices');
    } else {
      const optionIds = new Set();
      for (const opt of options) {
        if (!opt || typeof opt !== 'object' || !opt.id || !opt.text) {
          errors.push('Each option must have an id and text property');
          break;
        }
        if (optionIds.has(opt.id)) {
          errors.push(`Duplicate option ID '${opt.id}' found in options array`);
        }
        optionIds.add(opt.id);
      }

      // Normalization of correctAnswer for single choice
      let targetOptionId = null;
      if (typeof rawCorrectAnswer === 'string') {
        targetOptionId = rawCorrectAnswer;
      } else if (Array.isArray(rawCorrectAnswer) && rawCorrectAnswer.length === 1 && typeof rawCorrectAnswer[0] === 'string') {
        targetOptionId = rawCorrectAnswer[0];
      } else if (rawCorrectAnswer && typeof rawCorrectAnswer === 'object' && rawCorrectAnswer.optionId) {
        targetOptionId = rawCorrectAnswer.optionId;
      }

      if (!targetOptionId) {
        errors.push('SINGLE_CHOICE requires correctAnswer with a valid optionId (e.g. { optionId: "A" } or "A")');
      } else if (!optionIds.has(targetOptionId)) {
        errors.push(`correctAnswer optionId '${targetOptionId}' references nonexistent option in options array`);
      } else {
        normalizedCorrectAnswer = { optionId: targetOptionId };
      }
    }
  } else if (format === 'MULTIPLE_CHOICE') {
    if (!Array.isArray(options) || options.length < 2) {
      errors.push('MULTIPLE_CHOICE questions must have an options array with at least 2 choices');
    } else {
      const optionIds = new Set();
      for (const opt of options) {
        if (!opt || typeof opt !== 'object' || !opt.id || !opt.text) {
          errors.push('Each option must have an id and text property');
          break;
        }
        if (optionIds.has(opt.id)) {
          errors.push(`Duplicate option ID '${opt.id}' found in options array`);
        }
        optionIds.add(opt.id);
      }

      // Normalization of correctAnswer for multiple choice
      let targetOptionIds = [];
      if (Array.isArray(rawCorrectAnswer)) {
        targetOptionIds = rawCorrectAnswer.map(String);
      } else if (rawCorrectAnswer && typeof rawCorrectAnswer === 'object' && Array.isArray(rawCorrectAnswer.optionIds)) {
        targetOptionIds = rawCorrectAnswer.optionIds.map(String);
      }

      if (targetOptionIds.length === 0) {
        errors.push('MULTIPLE_CHOICE requires correctAnswer with at least one optionId in optionIds array');
      } else {
        for (const cId of targetOptionIds) {
          if (!optionIds.has(cId)) {
            errors.push(`correctAnswer optionId '${cId}' references nonexistent option in options array`);
          }
        }
        normalizedCorrectAnswer = { optionIds: targetOptionIds };
      }
    }
  } else if (format === 'TRUE_FALSE') {
    if (!options || !Array.isArray(options) || options.length === 0) {
      options = [
        { id: 'true', text: 'True' },
        { id: 'false', text: 'False' }
      ];
    }

    let boolVal = undefined;
    if (typeof rawCorrectAnswer === 'boolean') {
      boolVal = rawCorrectAnswer;
    } else if (rawCorrectAnswer && typeof rawCorrectAnswer === 'object' && typeof rawCorrectAnswer.value === 'boolean') {
      boolVal = rawCorrectAnswer.value;
    } else if (typeof rawCorrectAnswer === 'string' && (rawCorrectAnswer.toLowerCase() === 'true' || rawCorrectAnswer.toLowerCase() === 'false')) {
      boolVal = rawCorrectAnswer.toLowerCase() === 'true';
    } else if (rawCorrectAnswer && typeof rawCorrectAnswer === 'object' && typeof rawCorrectAnswer.optionId === 'string') {
      boolVal = rawCorrectAnswer.optionId.toLowerCase() === 'true';
    }

    if (boolVal === undefined) {
      errors.push('TRUE_FALSE requires correctAnswer with a boolean value (e.g. { value: true } or true)');
    } else {
      normalizedCorrectAnswer = { value: boolVal };
    }
  } else if (format === 'NUMERICAL') {
    let numVal = undefined;
    let tolerance = 0;

    if (typeof rawCorrectAnswer === 'number' && !isNaN(rawCorrectAnswer)) {
      numVal = rawCorrectAnswer;
    } else if (rawCorrectAnswer && typeof rawCorrectAnswer === 'object' && typeof rawCorrectAnswer.value === 'number') {
      numVal = rawCorrectAnswer.value;
      if (typeof rawCorrectAnswer.tolerance === 'number') {
        tolerance = Math.abs(rawCorrectAnswer.tolerance);
      }
    } else if (typeof rawCorrectAnswer === 'string' && !isNaN(Number(rawCorrectAnswer))) {
      numVal = Number(rawCorrectAnswer);
    }

    if (numVal === undefined) {
      errors.push('NUMERICAL requires correctAnswer with a numerical value (e.g. { value: 42, tolerance: 0.1 })');
    } else {
      normalizedCorrectAnswer = { value: numVal, tolerance };
    }
  } else if (format === 'CODING' || type === 'CODING') {
    normalizedCorrectAnswer = null;
  }

  // 4. Coding Questions Validation
  if (type === 'CODING') {
    if (!coding || typeof coding !== 'object') {
      errors.push('CODING questions require a codingProblem / coding definition object');
    } else {
      const timeLimit = Number(coding.timeLimitMs || 2000);
      const memoryLimit = Number(coding.memoryLimitKb || 128000);
      const maxMarks = Number(coding.maxMarks || 100);

      if (timeLimit <= 0 || timeLimit > 10000) {
        errors.push('timeLimitMs must be between 1 and 10000 milliseconds');
      }
      if (memoryLimit <= 0 || memoryLimit > 1048576) {
        errors.push('memoryLimitKb must be between 1 and 1048576 KB');
      }
      if (maxMarks <= 0) {
        errors.push('maxMarks must be positive');
      }

      if (!Array.isArray(coding.testCases) || coding.testCases.length === 0) {
        errors.push('CODING questions must include at least 1 testCase');
      } else {
        let hasPublic = false;
        let totalWeight = 0;

        for (let tIdx = 0; tIdx < coding.testCases.length; tIdx++) {
          const tc = coding.testCases[tIdx];
          if (!tc || typeof tc !== 'object') {
            errors.push(`Test case at index ${tIdx} must be an object`);
            continue;
          }

          if (typeof tc.input !== 'string') {
            errors.push(`Test case at index ${tIdx} input must be a string`);
          }
          if (typeof tc.expectedOutput !== 'string') {
            errors.push(`Test case at index ${tIdx} expectedOutput must be a string`);
          }

          const weight = Number(tc.weight !== undefined ? tc.weight : 1);
          if (isNaN(weight) || weight <= 0) {
            errors.push(`Test case at index ${tIdx} must have a positive weight`);
          } else {
            totalWeight += weight;
          }

          if (!tc.isHidden) {
            hasPublic = true;
          }
        }

        if (!hasPublic) {
          errors.push('CODING questions must have at least one public test case (isHidden: false)');
        }
        if (totalWeight <= 0) {
          errors.push('Total weight of test cases must be greater than zero');
        }
      }
    }
  }

  if (errors.length > 0) {
    return {
      isValid: false,
      errors: errors.map(msg => ({
        index,
        externalId,
        message: `Item [${index}] ${externalId ? `(${externalId}): ` : ''}${msg}`
      }))
    };
  }

  const normalizedItem = {
    source: {
      type: sourceType,
      namespace: sourceNamespace,
      url: sourceUrl,
      attribution
    },
    externalId,
    status,
    tags,
    collegeId: rawItem.collegeId || null,
    question: {
      type,
      format,
      category,
      subcategory,
      difficulty,
      title: title.trim(),
      statement: statement.trim(),
      options: options || null,
      correctAnswer: normalizedCorrectAnswer !== null ? normalizedCorrectAnswer : (rawCorrectAnswer !== undefined ? rawCorrectAnswer : null),
      explanation: explanation ? explanation.trim() : null
    },
    ...(type === 'CODING' ? {
      coding: {
        constraints: coding.constraints || null,
        inputFormat: coding.inputFormat || null,
        outputFormat: coding.outputFormat || null,
        starterCode: coding.starterCode || {},
        timeLimitMs: Number(coding.timeLimitMs || 2000),
        memoryLimitKb: Number(coding.memoryLimitKb || 128000),
        maxMarks: Number(coding.maxMarks || 100),
        testCases: (coding.testCases || []).map((tc, idx) => ({
          input: tc.input,
          expectedOutput: tc.expectedOutput,
          isHidden: Boolean(tc.isHidden),
          weight: Number(tc.weight !== undefined ? tc.weight : 1),
          order: tc.order !== undefined ? tc.order : idx + 1
        }))
      }
    } : {})
  };

  return {
    isValid: true,
    data: normalizedItem
  };
}

module.exports = {
  validateImportItem,
  VALID_TYPES,
  VALID_FORMATS,
  VALID_DIFFICULTIES,
  VALID_STATUSES,
  VALID_SOURCE_TYPES
};
