# SIPS Practice Platform — Coding Question Bank

This directory contains the canonical coding problem dataset for the SIPS Practice Platform.

## Directory Structure

```text
data/question-bank/coding/
├── coding_questions.json     # 20 Canonical Coding Problems with public & hidden test suites
└── README.md                 # Dataset documentation and ingestion guidelines
```

## Dataset Specifications

- **Total Problems**: 20
- **Supported Languages**:
  - Python (Judge0 ID: 71)
  - C++ (GCC 9.2.0, Judge0 ID: 54)
  - Java (OpenJDK 13, Judge0 ID: 62)
  - JavaScript (Node.js, Judge0 ID: 63)
- **Scoring Model**: Weighted test case evaluation (Total Weight: 100.0)
- **Visibility Model**:
  - `isHidden: false` (Public sample tests returned in RUN mode)
  - `isHidden: true` (Hidden evaluation tests executed during SUBMIT mode)

## Topic & Difficulty Distribution

| Topic | Problems | Target Difficulty |
| :--- | :---: | :--- |
| Arrays & Hashing | 3 | Easy (2), Medium (1) |
| Strings | 2 | Easy (1), Medium (1) |
| Two Pointers / Sliding Window | 2 | Easy (1), Medium (1) |
| Linked Lists | 2 | Easy (1), Medium (1) |
| Stack / Queue | 2 | Easy (1), Medium (1) |
| Binary Search | 2 | Easy (1), Medium (1) |
| Trees / BST | 2 | Easy (1), Medium (1) |
| Graphs | 2 | Medium (1), Hard (1) |
| Greedy | 1 | Medium (1) |
| Dynamic Programming | 2 | Medium (1), Hard (1) |
| **Total** | **20** | **Easy: 8, Medium: 10, Hard: 2** |

## Provenance Policy

All 20 problems are original benchmark implementations authored for the SIPS Practice Platform under `sourceNamespace: "sips-internal"` and `sourceType: "ORIGINAL"`. No proprietary or copyrighted descriptions were replicated verbatim.

## Ingestion Workflow

### Ingestion Command

Ingest the canonical dataset through the standard bulk import endpoint:

```bash
POST /api/admin/questions/bulk-import
Authorization: Bearer <Admin JWT>
Content-Type: application/json

{
  "items": <content of coding_questions.json>
}
```

Or via the programmatic API:

```javascript
const { importQuestions } = require('./src/services/bulkImportService');
const summary = await importQuestions(codingQuestions, { collegeId: null });
```

### Idempotency & Replay Protection

The ingestion pipeline detects existing questions by composite identity:
```text
sourceNamespace + externalId + collegeId
```

When an identical payload is imported again:
- **`inserted`**: 0
- **`versioned`**: 0
- **`skipped`**: 20
- **`failed`**: 0

No duplicate records or redundant `QuestionVersion` rows are created.

### Immutable Versioning Behavior

When any problem content changes (constraints, input/output formats, starter codes, or test cases):
1. Previous `QuestionVersion` records remain completely immutable.
2. A new `QuestionVersion` record (e.g., `versionNumber: 2`) is appended.
3. Associated `CodingProblem` and `CodingTestCase` records are created for the new version.
4. Historical contest and practice attempts continue to reference the exact version they were started with.

### Judge0 Execution & Scoring Model

- **RUN Mode**: Executes against public test cases (`isHidden: false`). No official submission marks are recorded.
- **SUBMIT Mode**: Executes across all test cases (both public and hidden).
  - Calculates proportional score: `earnedScore = (sum(passedTestWeight) / totalWeight) * maxMarks`.
  - Hides test case inputs and expected outputs for hidden test cases from student responses.
  - Generates immutable `CodeSubmission` and `CodeSubmissionTestResult` records.
