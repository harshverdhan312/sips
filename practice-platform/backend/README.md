# SIPS Practice Platform — Backend Service

## 1. Overview
The Practice Platform Backend is an independently deployable Node.js / Express microservice responsible for:
- Question Bank Management & Immutable Question Versioning
- Coding Problem & Test Case Configuration
- Self-Paced Practice Sessions (Coding, Aptitude, Technical MCQs)
- Answer Security & Server-Authoritative Scoring
- Coding Problem & Test Case Configuration
- Self-Paced Practice Sessions (Coding, Aptitude, Technical MCQs)
- Answer Security & Server-Authoritative Scoring
- Judge0 Code Execution Engine (RUN & SUBMIT modes with weighted test case evaluation)
- Future Placement Assessment Contests (Deferred to Later Phases)

---

## 2. Tech Stack & Dependencies
- **Runtime**: Node.js (CommonJS)
- **Framework**: Express.js (`^4.21.2`)
- **Database**: PostgreSQL (`sips_practice`)
- **ORM / Query Builder**: Prisma (`^6.19.3` CLI and `@prisma/client`)
- **Execution Sandbox**: Judge0 CE/Extra API
- **HTTP Client**: Axios (`^1.7.9`)
- **Test Runner**: Jest + Supertest

---

## 3. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

| Variable | Description | Default |
| --- | --- | --- |
| `PORT` | HTTP Server Port | `5050` |
| `NODE_ENV` | Environment Mode | `development` |
| `DATABASE_URL` | PostgreSQL Connection URI | `postgresql://<USER>:<PASSWORD>@localhost:5432/sips_practice?schema=public` |
| `CORS_ORIGIN` | Allowed Frontend Origin | `http://localhost:5174` |
| `JUDGE0_BASE_URL` | Judge0 API Base Endpoint | `http://localhost:2358` |
| `JUDGE0_API_KEY` | Optional API Key (for RapidAPI / hosted provider) | `""` |
| `JUDGE0_API_HOST` | Optional Host header (e.g. `judge0-ce.p.rapidapi.com`) | `""` |
| `EXECUTION_POLL_INTERVAL_MS` | Milliseconds between Judge0 polling attempts | `500` |
| `EXECUTION_POLL_MAX_RETRIES` | Max polling attempts before timeout | `20` |

> [!NOTE]
> **Judge0 Credentials**: The application is configured to operate with self-hosted Judge0 instances without API keys by default. When using RapidAPI or managed Judge0 providers, populate `JUDGE0_API_KEY` and `JUDGE0_API_HOST` in `.env`. Server secrets are never exposed in API responses or committed to source control.

---

## 4. API Reference

### 4.1 Health Check
| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/health` | Primary platform health probe |
| `GET` | `/api/health` | Namespaced health probe |

### 4.2 Question Bank & Versioning
| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/api/questions` | Create a new `PracticeQuestion` + initial `QuestionVersion` (v1) |
| `GET` | `/api/questions` | List questions with optional filters (`type`, `category`, `difficulty`, `sourceType`) |
| `GET` | `/api/questions/:questionId` | Get question metadata and version history |
| `POST` | `/api/questions/:questionId/versions` | Create a new immutable `QuestionVersion` (auto-increments version number) |
| `GET` | `/api/questions/:questionId/versions` | List all versions of a question (Admin/Author view) |
| `GET` | `/api/question-versions/:versionId` | Get details of a specific `QuestionVersion` (Admin/Author view) |

### 4.3 Coding Problem & Test Case Management
| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/api/question-versions/:versionId/coding-problem` | Create coding specifications (time limit, memory limit, max marks) for a `CODING` QuestionVersion |
| `GET` | `/api/question-versions/:versionId/coding-problem` | Get coding specifications and test cases for a QuestionVersion |
| `POST` | `/api/coding-problems/:codingProblemId/test-cases` | Add weighted test case (`input`, `expectedOutput`, `weight`, `isHidden`, `order`) |
| `GET` | `/api/coding-problems/:codingProblemId/test-cases` | List all test cases for a coding problem (Admin view) |

### 4.4 Code Execution Engine (Phase 4B)
| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/api/coding/execute/run` | Execute source code against public/sample test cases only (No marks awarded) |
| `POST` | `/api/coding/execute/submit` | Execute source code against all test cases, persist results, and award weighted score |
| `GET` | `/api/coding/submissions/:submissionId` | Retrieve submission details (student-safe serialized output) |

#### Execution Behavior:
- **RUN Mode**:
  - Only executes public (`isHidden: false`) test cases.
  - Returns input, expected output, actual stdout, stderr, compile output, and execution metrics.
  - Never awards official marks and does not modify attempt total scores.
- **SUBMIT Mode**:
  - Executes all test cases (both public and hidden).
  - Calculates weighted score: `earnedMarks = (earnedWeight / totalWeight) * maxMarks`.
  - Persists `CodeSubmission` and individual `CodeSubmissionTestResult` records.
  - Updates associated `PracticeAttempt` response record with earned marks and submission ID.
- **Compilation Short-Circuit**:
  - If compilation fails (`status_id: 6`), execution terminates immediately with `COMPILATION_ERROR` and `earnedMarks: 0.00`.
- **Output Normalization**:
  - Outputs are normalized prior to exact comparison: CRLF converted to LF, line trailing whitespace trimmed, terminal newlines stripped.
- **Security & Scrubbing**:
  - Hidden test inputs, expected outputs, stdout, stderr, and internal Judge0 tokens are strictly scrubbed in student-facing responses.

### 4.5 Self-Paced Practice Engine
| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/api/practice/attempts` | Start a self-paced practice session (`studentId`, `collegeId`, `type`, `category`, `questionCount`) |
| `GET` | `/api/practice/attempts/:attemptId` | Get attempt status and summary |
| `GET` | `/api/practice/attempts/:attemptId/questions` | Get delivered questions for this attempt (**Student-safe DTO: excludes correctAnswer, answer keys, hidden test cases**) |
| `POST` | `/api/practice/attempts/:attemptId/responses` | Submit or update candidate answer for a delivered question |
| `POST` | `/api/practice/attempts/:attemptId/submit` | Transactionally evaluate and finalize practice attempt |
| `GET` | `/api/practice/attempts/:attemptId/result` | Get finalized score breakdown, marks awarded, and explanations |

### 4.6 Contest Management & Lifecycle (Phase 5B.1)
| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/api/contests` | Create a new contest in `DRAFT` state |
| `GET` | `/api/contests` | List contests with optional filters (`collegeId`, `sipsDriveId`, `status`) |
| `GET` | `/api/contests/:contestId` | Get contest details and pinned question list |
| `POST` | `/api/contests/:contestId/questions` | Add QuestionVersion to a `DRAFT` contest (with section/type cross-validation) |
| `POST` | `/api/contests/:contestId/questions/reorder` | Transactionally reorder questions in a `DRAFT` contest |
| `DELETE` | `/api/contests/:contestId/questions/:contestQuestionId` | Remove question from a `DRAFT` contest |
| `POST` | `/api/contests/:contestId/publish` | Publish contest and lock configuration (`DRAFT` $\to$ `PUBLISHED`) |
| `POST` | `/api/contests/:contestId/live` | Transition contest to active (`PUBLISHED` $\to$ `LIVE`) |
| `POST` | `/api/contests/:contestId/end` | Transition contest to ended (`LIVE` $\to$ `ENDED`) |
| `POST` | `/api/contests/:contestId/evaluate` | Finalize contest evaluation (`ENDED` $\to$ `EVALUATED`) |
| `POST` | `/api/contests/:contestId/archive` | Archive contest (`EVALUATED` $\to$ `ARCHIVED`) |
| `POST` | `/api/contests/:contestId/cancel` | Cancel contest (`DRAFT`/`PUBLISHED`/`LIVE` $\to$ `CANCELLED`) |

#### Lifecycle & Configuration Invariants:
- **State Progression**: `DRAFT` $\to$ `PUBLISHED` $\to$ `LIVE` $\to$ `ENDED` $\to$ `EVALUATED` $\to$ `ARCHIVED`.
- **Cancellation**: Permitted from `DRAFT`, `PUBLISHED`, and `LIVE`. Blocked from terminal states (`ENDED`, `EVALUATED`, `ARCHIVED`).
- **Configuration Lock**: Once `PUBLISHED`, questions cannot be added, removed, or reordered.
- **Section Match**: Cross-validates `CODING`, `APTITUDE`, and `TECHNICAL` sections with underlying `PracticeQuestion` types.
- **Question Version Pinning**: Contests permanently pin the exact `QuestionVersion` assigned at creation, preserving historical integrity even if newer versions (v2, v3) are created later.

### 4.7 Student Contest Attempt Engine (Phase 5B.2)
| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/contests/available` | Discover active and upcoming contests for authenticated student's institution |
| `GET` | `/api/contests/:contestId/student` | Get student-safe contest details and existing attempt status |
| `POST` | `/api/contests/:contestId/attempts/start` | Validate SIPS drive eligibility and start official contest attempt |
| `GET` | `/api/contests/:contestId/attempts/:attemptId` | Retrieve attempt state, remaining time, and timer bounds (Reconnect / Resume) |
| `GET` | `/api/contests/:contestId/attempts/:attemptId/questions` | Deliver pinned contest questions (**Student-safe DTO: no answer keys, explanations, or hidden tests**) |
| `POST` | `/api/contests/:contestId/attempts/:attemptId/responses` | Save or update candidate response for a question while attempt is active |

### 4.8 Contest Submission, MCQ Scoring & Coding Evaluation (Phase 5B.3)
| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/api/contests/:contestId/attempts/:attemptId/submit` | Finalize candidate attempt and transactionally evaluate Aptitude, Technical, and Coding scores |
| `POST` | `/api/contests/:contestId/attempts/:attemptId/finalize` | Finalize contest attempt after pending Judge0 executions have resolved |
| `GET` | `/api/contests/:contestId/attempts/:attemptId/result` | Retrieve student-safe final score breakdown, section scores, and total marks |

#### Scoring Rules & Domain Invariants:
- **MCQ Evaluation & Negative Marking**:
  - Correct answer $\to$ `+marks`
  - Incorrect answer $\to$ `-negativeMarks`
  - Unanswered question $\to$ `0.00` (Negative marking is never applied to unanswered questions).
- **Multiple-Choice Set Comparison**: Selections are evaluated as sets where ordering does not matter (`[A, C]` == `[C, A]`); extra incorrect selections disqualify the answer.
- **Section Score Floor Protection**: MCQ deductions cannot produce negative section scores (`sectionScore = MAX(0, rawScore)`); aptitude losses never reduce technical or coding marks.
- **Weighted Coding Scoring**: Proportional score calculated across all configured test cases (public + hidden): `earnedMarks = (earnedWeight / totalWeight) * contestQuestion.marks`.
- **Server Authoritative Scoring**: Client-submitted marks, scores, or correctness flags are completely ignored.
### 4.9 Contest Leaderboard & Ranking Engine (Phase 5B.4)
| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/contests/:contestId/leaderboard` | Get paginated contest leaderboard with standard competition ranking and student rank |
| `GET` | `/api/contests/:contestId/leaderboard/me` | Retrieve authenticated student's individual contest rank and standing |

#### Ranking Semantics & Invariants:
- **Standard Competition Ranking (1224)**: Rank identity is determined strictly by `totalScore DESC`. Tied total scores receive identical rank (e.g., scores `100, 100, 95, 90` receive ranks `1, 1, 3, 4`).
- **Deterministic Display Ordering**: Equal scores are displayed by `submittedAt ASC`, `id ASC` without altering rank number.
- **Rankable Attempts**: Only attempts with status `SUBMITTED` or `TIMED_OUT` (with non-null `totalScore`) participate in ranking; `IN_PROGRESS` and `DISQUALIFIED` attempts are excluded.
- **Dynamic Calculation**: Ranks are computed on-demand from canonical `ContestAttempt` scores, eliminating write cascades and stale ranks.
- **Tenant & Lifecycle Isolation**: Queries enforce strict `collegeId` isolation; access is blocked for `DRAFT` (400 `CONTEST_NOT_STARTED`) and `CANCELLED` (400 `CONTEST_CANCELLED`) contests.
- **Information Hiding**: Leaderboard entries expose only public score summaries (`rank`, `studentId`, `totalScore`, `totalMarks`, section scores, `submittedAt`); all answers, source code, and test cases remain redacted.

---

## 5. Domain Rules & Security Guarantees

1. **Question Immutability**:
   - `QuestionVersion` records are strictly immutable.
   - Creating an update creates a new incremental `QuestionVersion` (`v+1`).
   - `PUT` or `PATCH` on `QuestionVersion` endpoints are strictly disabled.
2. **Answer & Test Case Security**:
   - Student question delivery endpoints serialize questions without `correctAnswer`, answer keys, or solution explanations.
   - Coding problem delivery to students filters out all test cases where `isHidden: true`.
   - Student submission serialization completely redacts hidden test inputs, expected outputs, and execution outputs.
3. **Historical Attempt Consistency**:
   - A `PracticeAttempt` locks specific `QuestionVersion` IDs upon creation.
   - If a question later receives v2, existing attempts evaluate against the locked v1 version.
4. **Authoritative Server Scoring & Execution Limits**:
   - Client scores and test selections are completely ignored.
   - Hard server-enforced resource caps: max 64 KB source code, max 10000 ms execution time, max 512000 KB memory.
   - Supported languages mapped server-side (`cpp`: 54, `java`: 62, `python`: 71, `javascript`: 63).

---

## 6. Authentication & CORS (Phase 6C.1)

### 6.1 SIPS JWT Authentication
Practice student endpoints accept the standard SIPS JWT issued upon student login:
```http
Authorization: Bearer <sips_jwt>
```

- **Cryptographic Verification**: The Practice Platform backend cryptographically verifies the token using its server-side `JWT_SECRET` (HS256).
- **Server-Derived Identity**: Identity claims (`id`, `collegeId`, `role`, `collegeSlug`) are extracted directly from the verified token payload.
- **Client Identity Redaction**: The client does not send `studentId` or `collegeId` as trusted identity. Any client-supplied body overrides or spoofed headers (`x-student-id`, `x-college-id`) are ignored and stripped.
- **Role Enforcement**: Student-facing endpoints verify `role === 'STUDENT'`. Non-student roles (e.g. `COLLEGE_ADMIN`) are rejected with `403 Forbidden`.
- **Production Boundary**: In production (`NODE_ENV=production`), legacy development headers and colon-separated test tokens are strictly rejected.

### 6.2 Configuration Variables
| Variable | Description | Example / Default |
| --- | --- | --- |
| `JWT_SECRET` | Shared server-side SIPS JWT verification secret | `replace-with-the-same-sips-jwt-secret` |
| `JWT_EXPIRES_IN` | Token expiration policy | `7d` |
| `CORS_ORIGIN` | Allowed browser origins (comma-separated or single) | `http://localhost:5173,http://localhost:5174` |

---

## 7. Testing & Verification
```bash
# Run all automated integration tests (11 test suites covering JWT, contests, coding, practice)
npm test
```

