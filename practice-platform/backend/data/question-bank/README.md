# SIPS Practice Platform — Question Bank Dataset

This directory contains the canonical question bank dataset for the SIPS Practice Platform.

## Directory Structure

```text
data/question-bank/
├── schema/
│   └── questions.schema.json         # JSON Schema specification for question payloads
├── aptitude/
│   ├── quants/
│   │   └── aptitude_questions.json   # 505 Curated Quantitative Aptitude MCQs
│   ├── logical/
│   │   └── logical_questions.json    # 503 Logical Reasoning MCQs
│   ├── verbal/
│   │   └── verbal_questions.json     # 501 Verbal Ability MCQs
│   └── data_interpretation/
│       └── data_interpretation_questions.json # 501 Data Interpretation MCQs
├── technical/
│   └── technical_questions.json      # 10 Curated Technical MCQs (DSA, DBMS, OS, Networks, OOP, Languages)
├── mixed/
│   └── validation_batch_mixed.json   # 10 Mixed-Format MCQs (Multiple Choice, True/False, Numerical, Edge cases)
└── README.md                         # This documentation
```

## Question Formats Supported

1. **SINGLE_CHOICE**: Standard multiple-choice question with exactly one correct option.
2. **MULTIPLE_CHOICE**: Multiple-select question where one or more options are correct.
3. **TRUE_FALSE**: Boolean evaluation question with boolean/option answer keys.
4. **NUMERICAL**: Free-form numerical input question with exact or tolerance-based evaluation.

## Provenance Rules

Every imported item must declare its provenance:
- `ORIGINAL`: Authored directly for SIPS.
- `THIRD_PARTY`: Sourced from benchmark archives with attribution.
- `COMPANY_PROVIDED`: Sourced from placement tests with attribution.
- `COLLEGE_PROVIDED`: Contributed by partner institutions.
- `PUBLIC_SOURCE` / `CURATED`: Public domain / open license collections.

## Ingestion Flow

All files conform to `questions.schema.json` and are ingested through `bulkImportService.importQuestions()` or via the admin endpoint `POST /api/admin/questions/bulk-import`.
