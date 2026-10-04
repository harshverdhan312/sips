# SIPS Practice Platform

> **Important Boundary Rule**:  
> The Practice Platform is independently deployable.  
> SIPS remains the authoritative source of truth for identity, students, colleges, placement drives, and eligibility.

---

## 1. Overview & Purpose
The **SIPS Practice Platform** is a dedicated, modular, and independently deployable subsystem within the Smart Institutional Placement System ecosystem. It provides:
- Coding practice and algorithmic challenges
- Aptitude practice (Quantitative, Logical Reasoning, Verbal, Data Interpretation)
- Technical MCQ assessments (DSA, OOP, DBMS, OS, Networks, SQL, Java, Python, Flutter, etc.)
- Multi-section campus recruitment contests tied to placement drives
- Code execution sandbox orchestration via Judge0
- Category-isolated scoring and real-time leaderboards

---

## 2. Directory Structure

```text
practice-platform/
├── backend/
│   ├── prisma/
│   │   ├── migrations/
│   │   │   └── 20260930150000_init_domain_schema/
│   │   │       └── migration.sql # Initial PostgreSQL DDL migration
│   │   └── schema.prisma         # Prisma PostgreSQL domain schema
│   ├── src/
│   │   ├── config/               # Environment configuration
│   │   ├── controllers/          # Route controllers (health, question, coding, practice)
│   │   ├── middleware/           # Error handler, 404, auth delegation
│   │   ├── routes/               # API route declarations
│   │   ├── services/             # Question, versioning, coding, practice services
│   │   ├── utils/                # Prisma client, serializers, evaluator, appError, response
│   │   ├── validators/           # Question, coding, and practice payload validators
│   │   ├── app.js                # Express application instance
│   │   └── server.js             # HTTP server entry point
│   ├── tests/                    # Jest + Supertest integration tests
│   ├── .env.example
│   ├── .gitignore
│   ├── package.json              # Express + Prisma dependencies
│   └── README.md
├── frontend/                     # Minimal React + Vite testing frontend
│   ├── src/
│   │   ├── components/           # StatusCard, UI widgets
│   │   ├── hooks/                # useHealthCheck
│   │   ├── pages/                # LandingPage
│   │   ├── services/             # API fetch client
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── .env.example
│   ├── .gitignore
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── README.md
└── README.md                     # System Architecture & Design Specification
```

---

## 3. Database Ownership & Storage Boundary

The Practice Platform adheres to a **Shared-Nothing Database** architecture. The Practice Platform PostgreSQL database never directly queries or shares tables with the SIPS MongoDB database.

```text
┌──────────────────────────────────────┐     ┌──────────────────────────────────────┐
│            SIPS DATABASE             │     │      PRACTICE PLATFORM DATABASE      │
│          (MongoDB / Mongoose)        │     │         (PostgreSQL / Prisma)        │
├──────────────────────────────────────┤     ├──────────────────────────────────────┤
│ - Students (Identity & Profiles)     │     │ - PracticeQuestions (Stable Identity)│
│ - Colleges (Institutions & Slugs)    │     │ - QuestionVersions (Immutable Data)  │
│ - JobDescriptions (Placement Drives) │     │ - CodingProblems & CodingTestCases   │
│ - Applications (Drive Submissions)   │     │ - PracticeAttempts & Responses       │
│ - Matches & Predictions              │     │ - Contests & ContestQuestions        │
│ - Institutional Alerts & Logs        │     │ - ContestAttempts & Submissions      │
│                                      │     │ - Category-Specific Scores           │
│                                      │     │ - Leaderboards & Analytics           │
└──────────────────────────────────────┘     └──────────────────────────────────────┘
```

> **Note on External Identifiers**: Keys such as `collegeId`, `studentId`, and `sipsDriveId` (referencing SIPS Placement Drives) are stored as scalar values in the Practice PostgreSQL database and are **never** direct foreign key constraints across database engines.

---

## 4. Entity-Relationship Architecture

```text
PracticeQuestion
   │ 1
   └── * QuestionVersion (Immutable snapshots)
            │
            ├── 1 (optional)
            │   └── CodingProblem
            │          │ 1
            │          └── * CodingTestCase (Weighted test cases)
            │
            ├── * ContestQuestion
            │        │ *
            │        └── 1 Contest (Linked via sipsDriveId to SIPS)
            │                 │ 1
            │                 └── * ContestAttempt (Student assessment attempt)
            │                          ├── * QuestionResponse (MCQ responses)
            │                          └── * CodeSubmission (Judge0 code runs)
            │
            └── (Practice Mode)
                 PracticeAttempt
                     ├── * QuestionResponse
                     └── * CodeSubmission
```

---

## 5. Question Versioning & Immutability

Questions use an **Immutable Version Snapshot** model:
1. `PracticeQuestion` holds the question's stable identity, type (`CODING`, `APTITUDE`, `TECHNICAL`), category, difficulty, and provenance metadata (`sourceType`, `sourceUrl`, `attribution`).
2. `QuestionVersion` contains the versioned content (`title`, `statement`, `options`, `correctAnswer`, `explanation`, `metadata`).
3. `(questionId, versionNumber)` is strictly unique.
4. When a question is updated, a new `QuestionVersion` is created. Existing practice attempts and historical contests retain their exact pinned `questionVersionId`, ensuring scores and test cases remain invariant over time.

---

## 6. Self-Paced Practice Engine & Scoring

- **Attempt Creation**: Selects usable `QuestionVersion` records and creates initial `QuestionResponse` records.
- **Delivery**: Excludes `correctAnswer`, answer keys, and hidden test cases/outputs from student responses.
- **Evaluation**: Server-side deterministic scoring on attempt submission ($+1$ or $\text{maxMarks}$ for correct, $0$ for incorrect/unanswered).
- **Transactional State Transition**: Attempt transitions from `IN_PROGRESS` $\to$ `SUBMITTED`. Duplicate submissions and post-submission responses are rejected.

---

## 7. Web vs. Flutter Scope

| Feature Area | Web Platform Scope | Flutter Mobile Scope |
| --- | :---: | :---: |
| **Coding Practice & Editor** | Full Monaco/CodeMirror + Judge0 | Excluded initially |
| **Aptitude MCQs** | Full Support | Full Support (Self-Paced) |
| **Technical MCQs** | Full Support | Full Support (Self-Paced) |
| **Contest Participation** | Full Multi-Section Timed Engine | Excluded initially |
| **Live Leaderboards** | Full Real-time View | Excluded (Past summaries only) |
| **Question Bank Authoring** | College Admin Web Portal | Excluded |
| **Practice Streaks & Scores** | Full Support | Full Support |

*Flashcard practice is classified as future Phase 2+ scope.*

---

## 8. Implementation Roadmap

- **Phase 1 (Complete)**: Foundation Scaffold (Backend, Minimal Frontend, Prisma Setup, Health Endpoint, Architecture Documentation).
- **Phase 2 (Complete)**: PostgreSQL + Prisma Domain Schema (10 Models, 9 Enums, Relations, Decimal Precision, Migrations).
- **Phase 3 (Current)**: Question Bank + Practice APIs (Question CRUD, Versioning, Coding Problems, Practice Attempts, Responses, Answer Security, Authoritative Scoring).
- **Phase 4**: Judge0 Sandbox Execution Integration (Run vs. Submit pipelines).
- **Phase 5**: Timed Contests, Multi-Section Scoring & SIPS Placement Drive Handshake.
- **Phase 6**: Minimal Testing Frontend UI Integration.
