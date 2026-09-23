# SIPS — Skill Intelligence & Placement System

> A multi-tenant placement management and skill intelligence platform connecting students, institutional placement cells, and job drives through centralized recruitment workflows, deterministic skill matching, and ML-assisted placement intelligence.

---

## 1. Overview

**SIPS (Skill Intelligence & Placement System)** is an integrated career intelligence and campus placement automation platform designed to eliminate **"Data Blindness"** in higher-education institutions. 

### The Problem
Traditional higher-education placement cells operate as reactive logistics hubs. They manage disconnected spreadsheets, non-standardized resumes, fragmented coding assessment scores, and manual communication blasts. Consequently, placement directors and students remain blind to actual recruiter standards until Day-0 campus drives arrive.

### The Solution
SIPS centralizes and streamlines placement operations through:
- **Institutional Multi-Tenancy**: Isolated spaces for universities and colleges scoped by verified email domains.
- **Unified Candidate Management**: Centralized student profiles tracking CGPA, skills, placement status, and resumes.
- **Automated Campus Drives**: Structured Job Description (JD) posting with eligibility filtering and candidate shortlisting.
- **Deterministic & Semantic Matching**: Comprehensive skill overlap evaluation combined with Sentence-BERT embeddings.
- **Machine Learning Telemetry**: Placement probability prediction models and interview transcript speech analysis.

### Target Users
1. **Institutional Placement Cells & College Administrators**: Manage students, broadcast placement alerts, configure campus recruitment drives, review candidate match rankings, and monitor cohort readiness.
2. **Student Candidates**: Access institutional drives, upload and validate resumes, identify skill gaps against recruiter requirements, submit applications, and track selection stages.

---

## 2. Key Features

### Implemented Features

- **Multi-Tenant Institutional Isolation**: Every college operates within an isolated tenant space identified by `collegeId` and authorized institutional email domains.
- **Role-Based Access Control (RBAC)**: Secure access division between College Administrators (`COLLEGE_ADMIN`) and Student Candidates (`STUDENT`).
- **Domain-Based Authentication**: Centralized authentication signing JSON Web Tokens (JWT) with password hashing via `bcryptjs`.
- **Student Profile & Readiness Tracking**: Dynamic student profiles tracking academic CGPA, backlogs, branch, batch, skills, GitHub links, and auto-computed placement readiness scores.
- **Bulk Student CSV Import & Export**: Administrators can upload cohorts via CSV with auto-detection for alternate headers (`USN` vs. `Roll No`, `CGPA` vs. `Score`) and export student rosters.
- **Job Description (JD) Management**: Institutional job drive creation supporting branch restrictions, minimum CGPA cutoffs, package value (CTC in LPA), and required skill sets.
- **Deterministic Skill Matching Engine**: Built-in backend matcher with an extensive synonym dictionary (e.g., `k8s` ↔ `kubernetes`, `py` ↔ `python`, `sklearn` ↔ `scikit-learn`).
- **Application Lifecycle Tracking**: Formal state-machine transitions for job applications (`APPLIED` → `SHORTLISTED` → `SELECTED` / `REJECTED` / `WITHDRAWN`).
- **Targeted Notification & Alert Center**: Administrative alerts with priority classifications (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`) and role/status target filtering (`ALL`, `STUDENTS`, `UNPLACED`, `PLACED`).
- **Audit Logging**: Traceability of administrative actions, candidate status changes, and drive creation.
- **Multi-Format File Upload System**: Validated file handling via Multer for college branding logos (JPEG, PNG, WebP, GIF) and student resumes (PDF format with 5MB ceiling).
- **Resilient In-Memory Fallback**: Backend features a resilient in-memory database store (`memoryDb.js`) allowing core APIs to function seamlessly during development or MongoDB offline states.
- **Dedicated Python FastAPI ML Microservice (`ml-service`)**:
  - **Placement Probability Prediction**: Machine learning inference engine predicting placement likelihood from student profile metrics.
  - **PDF Resume Skill Extraction**: Programmatic text parsing and skill discovery from uploaded PDF resumes using `pypdf`.
  - **Semantic Skill & Job Matching**: Embedding-based similarity matching using Sentence-BERT (`all-MiniLM-L6-v2`).
  - **Hybrid Matching**: Configurable composite scoring merging deterministic skill coverage (default 0.6) with semantic similarity (default 0.4).
  - **Interview Acoustic & Speech Analysis**: Analyzes candidate audio recordings (WAV) and transcripts for pause duration, speaking pace, and STAR delivery.
  - **Employability Index Computation**: Mathematical composite index evaluating weighted contributions across technical, soft, and academic competencies.
- **Multiplatform Client Ecosystem**:
  - **Web Application (`frontend/`)**: Modern responsive SaaS portal built with React 19, Vite, and Tailwind CSS.
  - **Mobile Application (`app/`)**: Native cross-platform student client built with Flutter and Riverpod.

### Planned / Future Features

- **OCR-Based Resume Parsing**: Optical Character Recognition for scanned image resumes.
- **Automated Email & Push Notifications**: Automated email delivery via SMTP/SendGrid and mobile push via FCM.
- **Granular Departmental Roles**: Sub-roles for department-level placement coordinators and faculty mentors.
- **Direct Recruiter Portal**: External portal for visiting company HR representatives to manage assessment rounds.
- **Refresh-Token Rotation**: Automatic JWT rotation using secure HTTP-only cookies.

---

## 3. User Roles & Permissions

| Role | Identifier | Responsibilities & Capabilities |
| :--- | :--- | :--- |
| **College Administrator / Placement Officer** | `COLLEGE_ADMIN` | • Manage college profile, branding, and accepted student email domains.<br>• Add individual students or bulk import student cohorts via CSV.<br>• Create, update, and manage Job Descriptions (JDs) and campus drives.<br>• Run candidate matching to rank batch candidates against JD skill requirements.<br>• Manage student applications and advance statuses (`SHORTLISTED`, `SELECTED`, `REJECTED`).<br>• Publish institutional placement alerts, drive reminders, and announcements.<br>• View institutional analytics, readiness distributions, and export placement CSVs. |
| **Student Candidate** | `STUDENT` | • Authenticate using college-enrolled credentials / email.<br>• Manage profile details, academic records, coding handles, and skills.<br>• Upload and update PDF resumes.<br>• Browse active campus recruitment drives and filter by eligibility.<br>• View match scores, skill gap breakdowns, and missing requirements for posted jobs.<br>• Submit and track job applications across selection stages.<br>• Review placement readiness telemetry and personalized practice suggestions. |

---

## 4. System Architecture

SIPS is structured around a decoupled, modular service-oriented architecture:

```
                                    +-----------------------------------------------+
                                    |                 Client Tier                   |
                                    |                                               |
                                    |   +--------------------+  +---------------+   |
                                    |   | React 19 Web App   |  |  Flutter App  |   |
                                    |   | (Vite + Tailwind)  |  |  (Dart App)   |   |
                                    |   +--------------------+  +---------------+   |
                                    +-----------------------+-----------------------+
                                                            | HTTP / REST (JWT)
                                                            v
+-------------------------------------------------------------------------------------------------------------------+
|                                                 Backend Core Tier                                                 |
|                                                                                                                   |
|  +-------------------------------------------------------------------------------------------------------------+  |
|  |                                          Node.js / Express Server                                           |  |
|  |                                                                                                             |  |
|  |  +-----------------+  +-----------------+  +------------------+  +--------------------+  +---------------+  |  |
|  |  | Auth & Security |  | Tenant Scoping  |  | Validation & Err |  | Deterministic      |  | File Storage  |  |  |
|  |  | (JWT + bcrypt)  |  | (req.collegeId) |  | (errorHandler)   |  | Matching Engine   |  | (Multer /fs)  |  |  |
|  |  +-----------------+  +-----------------+  +------------------+  +--------------------+  +---------------+  |  |
|  |                                                                                                             |  |
|  |  Controllers & Routes:                                                                                      |  |
|  |  - /api/auth          : Registration, domain login, tokens                                                  |  |
|  |  - /api/admin         : Student management, job drives, analytics, alerts                                   |  |
|  |  - /api/student       : Profile, resume upload, jobs, applications                                          |  |
|  |  - /api/jd            : Job description lifecycle and matching                                             |  |
|  |  - /api/notification  : Broadcast announcements and alerts                                                  |  |
|  +-------------------------------------------------------+-----------------------------------------------------+  |
|                                                          |                                                        |
|                                  HTTP / JSON (REST)      |             Persistence Layer                          |
|                                                          v                                                        v
|                      +---------------------------------------+         +---------------------------------------+  |
|                      |        Python FastAPI ML Service      |         |          Database & Storage           |  |
|                      |                                       |         |                                       |  |
|                      |  - PDF Skill Extractor (pypdf)        |         |  - MongoDB (Mongoose ODM)             |  |
|                      |  - Sentence-BERT Semantic Matcher     |         |  - Resilient In-Memory Fallback Store |  |
|                      |  - Hybrid Keyword + SBERT Scorer      |         |  - Local File System (/uploads)       |  |
|                      |  - Placement Predictor (XGBoost)      |         +---------------------------------------+  |
|                      |  - Interview Audio & Speech Analyzer  |                                                    |
|                      |  - Employability Index Calculator     |                                                    |
|                      +---------------------------------------+                                                    |
+-------------------------------------------------------------------------------------------------------------------+
```

### Component Responsibilities
- **Frontend (`frontend/`)**: Single-Page Application (SPA) built with React 19 providing dedicated dashboards for Students, Placement Officers, and System Administrators. Communicates with the backend via a centralized API service abstraction with route-aware 401 handling.
- **Backend API (`backend/`)**: Node.js & Express REST API managing authentication, tenant-scoped data isolation, file upload streams, deterministic matching, and institutional analytics.
- **ML Service (`ml-service/`)**: Independent Python FastAPI microservice providing machine learning inference, semantic text embeddings, resume text extraction, and audio speech processing.
- **Mobile Client (`app/`)**: Flutter-based mobile application giving students instant mobile access to recruitment announcements, drives, application tracking, and profile management.
- **Database**: MongoDB storing documents across colleges, students, job postings, applications, matches, alerts, and audit logs.

---

## 5. System Workflows

### 5.1 Authentication & Institution Onboarding Flow

```text
Visitor / College Admin
  │
  ├─► [Register College] ──► POST /api/auth/register-college ──► Validates slug & domains ──► Creates College Record ──► Issues Admin JWT
  │
  └─► [Sign In] ──────────► POST /api/auth/login ─────────────► Checks credentials against College / Student ──────► Issues Scoped JWT
                                                                                                                          │
                                                                                                                          ▼
                                                                                                            Client stores token in localStorage
                                                                                                                          │
                                                                                                                          ▼
                                                                                                            Redirects to Role Dashboard
```

1. **College Registration**: An institution submits its name, desired unique slug, admin email, master password, and accepted domain list (e.g., `["rvce.edu"]`).
2. **Domain-Based Login**: When logging in with an email address, the system checks whether the email domain matches a registered institution.
3. **Token Issuance**: A signed JWT containing `{ id, role, collegeId, collegeSlug }` is returned to the client and injected into subsequent `Authorization: Bearer <token>` request headers.

### 5.2 Job Posting & Candidate Matching Flow

```text
Admin creates Job Description (Title, CTC, Min CGPA, Required Skills, Branches)
  │
  ▼
POST /api/admin/jobs (Stores JobDescription in MongoDB)
  │
  ▼
Matching Engine Evaluates Candidates:
  ├─► Filter: Student collegeId === Job collegeId
  ├─► Filter: Student branch in allowedBranches
  ├─► Filter: Student CGPA >= minCgpa
  ├─► Calculate: Skill Overlap via Synonym Dictionary & Normalizer
  └─► (Optional ML): Sentence-BERT Semantic Similarity via ML Microservice
  │
  ▼
Stores / Updates Match records in MongoDB
  │
  ▼
Admin views ranked candidate list with match % and missing skill gaps
```

### 5.3 Student Application Lifecycle Flow

Applications enforce a strict state-machine transition sequence:

```text
[APPLIED] ──────► [SHORTLISTED] ──────► [SELECTED]
    │                    │
    ├────────────────────┴────────────► [REJECTED]
    │
    └─────────────────────────────────► [WITHDRAWN]
```

- When a student applies, an `Application` document is created with status `APPLIED`.
- An institutional administrator reviews candidates and updates the status to `SHORTLISTED`.
- After recruitment interviews, the candidate is marked as `SELECTED` or `REJECTED`.
- Withdrawn applications cannot be transitioned to active states.
- Automated `Notification` entries are created upon status updates to alert the candidate.

---

## 6. Technology Stack

| Layer | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Web Frontend** | React | `^19.2.8` | Component-based User Interface |
| **Build & Tooling** | Vite | `^8.3.0` | Ultra-fast development server & bundler |
| **Styling** | Tailwind CSS | `^4.3.3` | Utility-first responsive design system |
| **Routing** | React Router | `^7.18.3` | Client-side routing & route guards |
| **Data Visualization** | Recharts | `^3.10.1` | Analytics, readiness charts, radar graphs |
| **Icons** | Lucide React | `^1.46.0` | SVG icons across all dashboards |
| **Mobile App** | Flutter / Dart | `^3.12.0` | Cross-platform student mobile application |
| **State Management (App)**| Flutter Riverpod | `^2.5.1` | Reactive state management in Flutter |
| **Backend Core** | Node.js | `>=18.0.0` | JavaScript server runtime environment |
| **Web Framework** | Express.js | `^4.18.3` | REST API routing and middleware pipeline |
| **Database ODM** | Mongoose | `^8.2.1` | Schema modeling and MongoDB interaction |
| **Security & Auth** | JSON Web Tokens | `^9.0.2` | Stateless signed bearer authentication |
| **Password Hashing** | bcryptjs | `^2.4.3` | Salted credential hashing |
| **File Handling** | Multer | `^1.4.5-lts.1` | Multipart form-data handling for resumes and logos |
| **Backend Testing** | Jest & Supertest | `^30.5.1` / `^7.2.2` | Automated unit, route, and integration testing |
| **ML Framework** | Python / FastAPI | `3.11` | High-performance asynchronous ML microservice |
| **ML Inference** | XGBoost & Scikit-learn| `^3.2.0` | Placement probability prediction model |
| **Embeddings & NLP** | Sentence-Transformers | Latest | Pretrained Sentence-BERT (`all-MiniLM-L6-v2`) |
| **PDF Extraction** | PyPDF | Latest | Text extraction from student PDF resumes |
| **Database** | MongoDB | `>=6.0` | Document-oriented multi-tenant persistence |

---

## 7. Project Structure

```text
SIPS/
├── app/                               # Flutter Cross-Platform Mobile Client
│   ├── android/                       # Android native project configurations
│   ├── ios/                           # iOS native project configurations
│   ├── lib/                           # Dart source code
│   │   ├── app/                       # Application entrypoint & theme configuration
│   │   ├── core/                      # Constants, network client, and theme tokens
│   │   ├── features/                  # Feature modules (auth, dashboard, jobs, profile)
│   │   ├── models/                    # Data models (Student, Job, Application)
│   │   ├── providers/                 # Riverpod state providers
│   │   └── repositories/              # API repository implementations
│   └── pubspec.yaml                   # Flutter dependency specifications
│
├── backend/                           # Node.js Express REST API Core
│   ├── config/                        # Configuration loader and environment bindings
│   ├── controllers/                   # Request controllers (admin, auth, student, etc.)
│   ├── docs/                          # Architecture contracts and API specifications
│   ├── middleware/                    # Auth, tenant scoping, RBAC, and error handlers
│   ├── models/                        # Mongoose schemas (Student, College, JD, etc.)
│   ├── routes/                        # Express route definitions (/api/*)
│   ├── services/                      # ML microservice HTTP client boundary
│   ├── tests/                         # Jest test suites (auth, matching, routes)
│   ├── uploads/                       # Storage destination for uploaded files
│   ├── utils/                         # Matching engine, CSV parser, resilient in-memory DB
│   ├── server.js                      # Server bootstrap, root landing page router
│   └── package.json                   # Node.js backend dependencies and test scripts
│
├── frontend/                          # React 19 + Vite Web Application
│   ├── public/                        # Static assets, favicon, icons
│   ├── src/
│   │   ├── components/                # Reusable UI components (Button, Card, Modal, etc.)
│   │   ├── context/                   # Context providers (AuthContext, NotificationContext)
│   │   ├── data/                      # Default benchmarks and initial mock data
│   │   ├── pages/                     # Application pages
│   │   │   ├── admin/                 # Institutional Admin & Placement Cell pages
│   │   │   ├── auth/                  # Unified Login & College Registration pages
│   │   │   ├── placement/             # Placement operations pages
│   │   │   ├── student/               # Student portal & career intelligence pages
│   │   │   └── LandingPage.jsx        # Public institutional landing page
│   │   ├── routes/                    # AppRoutes and ProtectedRoute guards
│   │   ├── services/                  # Centralized HTTP API client with 401 handling
│   │   └── utils/                     # Formatting, score coloring, and helpers
│   ├── index.html                     # HTML5 entry template
│   ├── vite.config.js                 # Vite configuration with API reverse proxy
│   └── package.json                   # Frontend dependencies and build scripts
│
├── ml-service/                        # Python FastAPI Machine Learning Microservice
│   ├── config/                        # Python service settings
│   ├── data/                          # Model training datasets
│   ├── models/                        # Serialized ML model artifacts (.joblib)
│   ├── scripts/                       # Model training and artifact generation scripts
│   ├── src/                           # Python microservice package
│   │   ├── api/                       # FastAPI router endpoints (placement, resume, etc.)
│   │   ├── employability/             # Employability index calculation logic
│   │   ├── interview/                 # Audio feature & speech pause extraction
│   │   ├── placement/                 # Placement prediction inference engine
│   │   └── resume/                    # PDF parsing, SBERT semantic matcher, hybrid matcher
│   ├── tests/                         # Pytest test suites
│   └── requirements.txt               # Python package dependencies
│
└── README.md                          # Master system-level documentation
```

---

## 8. Database Architecture

SIPS uses **MongoDB** via **Mongoose**. All operational collections enforce multi-tenant isolation via compound indexes indexed on `collegeId`.

```
+--------------------+        1:N        +--------------------+
|      College       |------------------<|      Student       |
|--------------------|                   |--------------------|
| _id (PK)           |                   | _id (PK)           |
| name, slug (unique)|                   | collegeId (FK)     |
| adminEmail (unique)|                   | email, rollNo, usn |
| acceptedDomains [] |                   | cgpa, branch, batch|
| masterPasswordHash |                   | skills [], resume  |
+--------------------+                   +--------------------+
          |                                      |         |
          | 1:N                                  |         |
          v                                      |         |
+--------------------+                           |         |
|   JobDescription   |                           |         |
|--------------------|                           |         |
| _id (PK)           |                           |         |
| collegeId (FK)     |                           |         |
| title, company     |                           |         |
| minCgpa, ctc       |                           |         |
| requiredSkills []  |                           |         |
+--------------------+                           |         |
          |                                      |         |
          | 1:N                      1:N         |         |
          +---------------->+--------------------+         |
                            |                              |
                            v                              v
                 +--------------------+         +--------------------+
                 |    Application     |         |       Match        |
                 |--------------------|         |--------------------|
                 | _id (PK)           |         | _id (PK)           |
                 | collegeId (FK)     |         | collegeId (FK)     |
                 | studentId (FK)     |         | studentId (FK)     |
                 | jobId (FK)         |         | jdId (FK)          |
                 | status (ENUM)      |         | score (0-100)      |
                 +--------------------+         | matchedSkills []   |
                                                | missingSkills []   |
                                                +--------------------+
```

### Primary Collections & Schemas

1. **`colleges`**: Institutional tenant profile, administrative credentials, branding logo, and domain whitelist.
   - Fields: `name`, `slug` (unique), `adminEmail` (unique), `masterPasswordHash`, `acceptedDomains`, `logoUrl`, `website`, `address`.
2. **`students`**: Student records scoped to an institution.
   - Fields: `collegeId` (ref), `name`, `rollNo`, `usn`, `email`, `passwordHash`, `branch`, `batch`, `cgpa`, `placementStatus`, `technicalScore`, `softSkillScore`, `resumeScore`, `readinessScore`, `skills`, `resumeUrl`, `profileImageUrl`.
   - Indexes: `{ email: 1, collegeId: 1 }` (unique), `{ rollNo: 1, collegeId: 1 }` (unique), `{ collegeId: 1 }`.
3. **`jobdescriptions`**: Campus placement drives and job postings.
   - Fields: `collegeId` (ref), `title`, `role`, `company`, `description`, `ctc`, `ctcValue`, `minCgpa`, `allowedBranches`, `status`, `requiredSkills`.
4. **`applications`**: Student submissions for posted recruitment drives.
   - Fields: `collegeId` (ref), `studentId` (ref), `jobId` (ref), `status` (`APPLIED`, `SHORTLISTED`, `REJECTED`, `SELECTED`, `WITHDRAWN`), `appliedAt`.
   - Index: `{ collegeId: 1, studentId: 1, jobId: 1 }` (unique).
5. **`matches`**: Computed compatibility scores between students and job requirements.
   - Fields: `collegeId` (ref), `studentId` (ref), `jdId` (ref), `score` (0-100), `matchedSkills`, `missingSkills`.
6. **`placementpredictions`**: Machine learning placement likelihood predictions.
   - Fields: `collegeId` (ref), `studentId` (ref), `placementProbability`, `decisionThreshold`, `predictedClass` (0/1), `predictedLabel`, `modelVersion`, `inputSnapshot`.
7. **`notifications`**: Targeted user alerts and drive updates.
   - Fields: `collegeId` (ref), `studentId` (ref, nullable), `title`, `message`, `type`, `target`, `read`, `readAt`.
8. **`alerts`**: High-priority placement cell notices and deadlines.
   - Fields: `collegeId` (ref), `title`, `message`, `type`, `priority`, `target`, `active`, `expiresAt`.
9. **`auditlogs`**: Administrative operation logs for institutional auditing.
   - Fields: `collegeId` (ref), `action`, `actor`, `target`, `details`, `timestamp`.

---

## 9. Authentication & Authorization

SIPS implements stateless JSON Web Token (JWT) authentication combined with institutional multi-tenancy.

### Credential Handling
- **Passwords**: Hashed with a random salt using `bcryptjs` (minimum 10 salt rounds) prior to database persistence. Plaintext passwords are never logged or stored.
- **Tokens**: Signed using a server-side secret (`JWT_SECRET`) with an expiration window (`JWT_EXPIRES_IN`, default 7 days).

### Middleware Pipeline

```text
Incoming Request
       │
       ▼
1. auth.js middleware:
   - Validates "Authorization: Bearer <token>" header
   - Verifies JWT signature and expiry
   - Attaches decoded user payload { id, role, collegeId, collegeSlug } to req.user
       │
       ▼
2. tenant.js middleware:
   - Sets req.collegeId = req.user.collegeId
   - Enforces that subsequent operations cannot query across tenant boundaries
       │
       ▼
3. adminOnly.js middleware (Admin routes only):
   - Verifies req.user.role === 'COLLEGE_ADMIN'
   - Rejects non-admin callers with 403 Forbidden
       │
       ▼
Controller Execution
```

---

## 10. API Documentation

### 10.1 Authentication Routes (`/api/auth`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register-college` | Register new institutional tenant and generate initial admin JWT | No |
| `POST` | `/api/auth/login` | Authenticate student or administrator; returns signed JWT | No |
| `POST` | `/api/auth/register` | Student self-registration (disabled; returns 403 guidance) | No |

### 10.2 Student Management & Profile (`/api/student`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/student/profile` | Retrieve profile of the authenticated student | Yes (`STUDENT`) |
| `PUT` | `/api/student/profile` | Update profile fields (skills, CGPA, GitHub, notes) | Yes (`STUDENT`) |
| `POST` | `/api/student/profile/image` | Upload student profile avatar (JPEG, PNG, WebP) | Yes (`STUDENT`) |
| `DELETE`| `/api/student/profile/image` | Remove student profile avatar | Yes (`STUDENT`) |
| `POST` | `/api/student/resume` | Upload PDF resume (max 5MB); parses and extracts skills | Yes (`STUDENT`) |
| `GET` | `/api/student/jobs` | List active campus recruitment drives | Yes (`STUDENT`) |
| `POST` | `/api/student/jobs/:id/apply`| Submit application for an active job drive | Yes (`STUDENT`) |
| `GET` | `/api/student/preferred-jobs` | Retrieve job drives matching student's skills | Yes (`STUDENT`) |
| `GET` | `/api/student/applications` | List applications submitted by student | Yes (`STUDENT`) |
| `GET` | `/api/student/applications/:id`| Retrieve single application status | Yes (`STUDENT`) |
| `PATCH`| `/api/student/applications/:id/withdraw` | Withdraw active job application | Yes (`STUDENT`) |
| `GET` | `/api/student/analytics/placement` | Retrieve placement readiness score and breakdown | Yes (`STUDENT`) |
| `POST` | `/api/student/analytics/placement/predict` | Request ML placement probability prediction | Yes (`STUDENT`) |
| `GET` | `/api/student/analytics/placement/prediction` | Retrieve latest recorded prediction result | Yes (`STUDENT`) |

### 10.3 Institutional Admin & Placement Operations (`/api/admin`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/admin/overview` | Institutional KPIs (placed %, drives, at-risk count) | Yes (`COLLEGE_ADMIN`) |
| `GET` | `/api/admin/college/profile` | Retrieve institutional details, whitelisted domains, logo | Yes (`COLLEGE_ADMIN`) |
| `PUT` | `/api/admin/college/profile` | Update college details and domain settings | Yes (`COLLEGE_ADMIN`) |
| `POST` | `/api/admin/college/profile/image`| Upload institutional logo | Yes (`COLLEGE_ADMIN`) |
| `DELETE`| `/api/admin/college/profile/image`| Delete institutional logo | Yes (`COLLEGE_ADMIN`) |
| `GET` | `/api/admin/students` | Search and filter students with pagination | Yes (`COLLEGE_ADMIN`) |
| `POST` | `/api/admin/students` | Manually enroll an individual student | Yes (`COLLEGE_ADMIN`) |
| `POST` | `/api/admin/students/upload` | Bulk enroll student batch via CSV file upload | Yes (`COLLEGE_ADMIN`) |
| `GET` | `/api/admin/students/export` | Export institutional student cohort as CSV | Yes (`COLLEGE_ADMIN`) |
| `GET` | `/api/admin/students/:id` | Retrieve detailed student record | Yes (`COLLEGE_ADMIN`) |
| `PUT` | `/api/admin/students/:id` | Update student academic / placement status | Yes (`COLLEGE_ADMIN`) |
| `DELETE`| `/api/admin/students/:id` | Delete student record | Yes (`COLLEGE_ADMIN`) |
| `GET` | `/api/admin/jobs` | List institutional recruitment drives | Yes (`COLLEGE_ADMIN`) |
| `POST` | `/api/admin/jobs` | Create a new campus recruitment drive / JD | Yes (`COLLEGE_ADMIN`) |
| `GET` | `/api/admin/jobs/:id` | Retrieve job details and eligibility metrics | Yes (`COLLEGE_ADMIN`) |
| `PUT` | `/api/admin/jobs/:id` | Update job parameters or close drive | Yes (`COLLEGE_ADMIN`) |
| `DELETE`| `/api/admin/jobs/:id` | Remove job posting | Yes (`COLLEGE_ADMIN`) |
| `GET` | `/api/admin/jobs/:id/matches`| Retrieve ranked candidate matches with skill overlap | Yes (`COLLEGE_ADMIN`) |
| `GET` | `/api/admin/jobs/:id/applicants`| Retrieve candidates who applied to this drive | Yes (`COLLEGE_ADMIN`) |
| `POST` | `/api/admin/jobs/:id/recompute`| Force recompute skill matches for this drive | Yes (`COLLEGE_ADMIN`) |
| `PATCH`| `/api/admin/applications/:id/status`| Update student application status | Yes (`COLLEGE_ADMIN`) |
| `GET` | `/api/admin/analytics/students` | Batch readiness and department breakdown analytics | Yes (`COLLEGE_ADMIN`) |
| `GET` | `/api/admin/analytics/placement`| Placement trends and CTC salary distribution | Yes (`COLLEGE_ADMIN`) |
| `GET` | `/api/admin/skills/intelligence`| Institutional skill gap frequencies | Yes (`COLLEGE_ADMIN`) |
| `GET` | `/api/admin/alerts` | List broadcast alerts | Yes (`COLLEGE_ADMIN`) |
| `POST` | `/api/admin/alerts` | Broadcast a new placement alert | Yes (`COLLEGE_ADMIN`) |
| `PUT` | `/api/admin/alerts/:id` | Update alert details or deactivate | Yes (`COLLEGE_ADMIN`) |
| `DELETE`| `/api/admin/alerts/:id` | Delete broadcast alert | Yes (`COLLEGE_ADMIN`) |

### 10.4 Notifications (`/api/notification`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/notification` | Fetch notifications for authenticated caller | Yes |
| `POST` | `/api/notification` | Broadcast institutional notification | Yes (`COLLEGE_ADMIN`) |
| `PATCH`| `/api/notification/read-all` | Mark all notifications as read | Yes |
| `PATCH`| `/api/notification/:id/read` | Mark single notification as read | Yes |

### 10.5 Core System & Health Endpoints

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | Serves web landing page HTML or JSON metadata | No |
| `GET` | `/health` / `/api/health` | Health check returning MongoDB connection status | No |

---

## 11. Environment Variables

### Backend Configuration (`backend/.env`)

| Variable | Required | Default Value | Description |
| :--- | :--- | :--- | :--- |
| `PORT` | No | `5000` | Port for Express server |
| `NODE_ENV` | No | `development` | Environment mode (`development`, `test`, `production`) |
| `MONGODB_URI` | Yes | `mongodb://127.0.0.1:27017/sips`| MongoDB connection URI |
| `JWT_SECRET` | Yes | `sips-dev-secret-key-2025` | Secret key used to sign and verify JWTs |
| `JWT_EXPIRES_IN` | No | `7d` | Token expiration duration |
| `FRONTEND_URL` | No | `http://localhost:5173` | Allowed CORS origin and landing redirect target |
| `UPLOAD_DIR` | No | `uploads` | Local directory for storing uploaded files |
| `ML_SERVICE_URL` | No | `http://127.0.0.1:8000` | Base URL of FastAPI ML service |
| `ML_SERVICE_TIMEOUT_MS`| No | `5000` | Timeout in ms for requests to ML service |
| `ML_SERVICE_API_KEY` | No | `""` | Optional shared secret for ML service requests |

### Frontend Configuration (`frontend/.env`)

| Variable | Required | Default Value | Description |
| :--- | :--- | :--- | :--- |
| `VITE_API_URL` | No | `""` (empty in dev) | Base backend API URL (Vite dev proxy forwards `/api` to port 5000) |

### ML Microservice Configuration (`ml-service/.env`)

| Variable | Required | Default Value | Description |
| :--- | :--- | :--- | :--- |
| `PORT` | No | `8000` | Port for FastAPI Uvicorn server |
| `ENVIRONMENT` | No | `development` | Runtime environment |

---

## 12. Installation & Setup

### Prerequisites

- **Node.js**: v18.x or v20.x
- **npm**: v9.x or higher
- **Python**: v3.11 (for `ml-service`)
- **MongoDB**: v6.0+ (local instance or MongoDB Atlas)
- **Flutter SDK**: v3.12+ (optional, only needed for mobile app development)

---

### Step 1: Clone the Repository

```bash
git clone https://github.com/harshverdhan312/sips.git
cd sips
```

---

### Step 2: Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install Node dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables by creating `.env`:
   ```env
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=mongodb://127.0.0.1:27017/sips
   JWT_SECRET=your_secure_random_jwt_secret
   FRONTEND_URL=http://localhost:5173
   ML_SERVICE_URL=http://127.0.0.1:8000
   ```
4. Run the test suite to verify installation:
   ```bash
   npm test -- --ci --runInBand
   ```
5. Start the backend development server:
   ```bash
   npm run dev
   ```
   *The backend will boot on `http://localhost:5000`.*

---

### Step 3: Frontend Setup

1. In a new terminal window, navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install frontend dependencies:
   ```bash
   npm install
   ```
3. Build production assets to verify bundling:
   ```bash
   npm run build
   ```
4. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *The frontend will launch at `http://localhost:5173`.*

---

### Step 4: Python ML Service Setup (Optional / Recommended)

1. In a new terminal, navigate to the ML service directory:
   ```bash
   cd ml-service
   ```
2. Create and activate a Python 3.11 virtual environment:
   - **Windows**:
     ```powershell
     python -m venv .venv
     .\.venv\Scripts\activate
     ```
   - **macOS / Linux**:
     ```bash
     python3 -m venv .venv
     source .venv/bin/activate
     ```
3. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Generate the placement model artifact:
   ```bash
   python scripts/train_placement_model.py
   ```
   *(This creates `ml-service/models/placement_model.joblib` for inference).*
5. Start the FastAPI microservice:
   ```bash
   uvicorn src.api.main:app --host 127.0.0.1 --port 8000 --reload
   ```
   *The ML service will be live on `http://127.0.0.1:8000` (interactive Swagger docs at `/docs`).*

---

### Step 5: Flutter Mobile Application Setup (Optional)

1. In a new terminal, navigate to the mobile app directory:
   ```bash
   cd app
   ```
2. Fetch Flutter packages:
   ```bash
   flutter pub get
   ```
3. Run tests:
   ```bash
   flutter test
   ```
4. Run on a connected device or emulator:
   ```bash
   flutter run
   ```

---

## 13. Running the Complete System

To run the entire system for local development, launch services in the following order:

```text
1. MongoDB            ──►  mongodb://127.0.0.1:27017/sips
2. Python ML Service  ──►  http://127.0.0.1:8000
3. Node.js Backend    ──►  http://localhost:5000
4. React Frontend     ──►  http://localhost:5173
```

### Port Allocation Reference

| Service | Port | Local URL |
| :--- | :--- | :--- |
| **Frontend (Vite)** | `5173` | `http://localhost:5173` |
| **Backend (Express)** | `5000` | `http://localhost:5000` |
| **ML Service (FastAPI)**| `8000` | `http://127.0.0.1:8000` |
| **Database (MongoDB)**| `27017` | `mongodb://127.0.0.1:27017` |

---

## 14. File Upload System

SIPS includes a robust file validation and storage pipeline managed via Multer:

| Upload Type | Supported Formats | Max Size | Storage Path | Security & Validation Rules |
| :--- | :--- | :--- | :--- | :--- |
| **College Logo** | JPEG, PNG, WebP, GIF | `5 MB` | `backend/uploads/` | • Validates MIME type and file extension.<br>• Generates collision-resistant filenames: `logo-<collegeId>-<timestamp>-<rand>.<ext>`. |
| **Student Avatar** | JPEG, PNG, WebP, GIF | `5 MB` | `backend/uploads/` | • Restricts MIME types to image formats.<br>• Stored with user-scoped naming: `profile-<userId>-<timestamp>-<rand>.<ext>`. |
| **Student Resume** | PDF only (`.pdf`) | `5 MB` | `backend/uploads/` | • Strictly enforces `application/pdf` MIME type and `.pdf` extension.<br>• Passes buffer to ML microservice or local parser for skill extraction.<br>• Rejects executables and malicious payloads with `400 Bad Request`. |
| **Student Bulk CSV** | CSV (`.csv`) | `5 MB` | Memory Stream | • Processed in-memory via stream buffer (not saved permanently to disk).<br>• Validates required columns (`Name`, `Email`, `RollNo` / `USN`). |

---

## 15. Skill Intelligence & Matching System

The candidate matching subsystem operates in two complementary layers:

### 1. Deterministic Rule & Keyword Engine (`backend/utils/matchingEngine.js`)
- **Normalization**: Input skills are lowercased and stripped of punctuation.
- **Synonym Mapping**: Resolves equivalent technological terms to standard canonical forms (e.g., `reactjs` → `react.js`, `postgres` → `postgresql`, `cpp` → `c++`).
- **Match Calculation**:
  $$\text{Match Score} = \left( \frac{|\text{Student Skills} \cap \text{Required Skills}|}{|\text{Required Skills}|} \right) \times 100$$
- Identifies **`matchedSkills`** and identifies **`missingSkills`** to generate actionable gap analysis for the student.

### 2. Semantic & Hybrid AI Matcher (`ml-service/src/resume/`)
- **Sentence-BERT (`all-MiniLM-L6-v2`)**: Generates 384-dimensional dense semantic vector embeddings for student skill sets and job description requirements.
- **Cosine Similarity**: Calculates semantic affinity to reward conceptually related competencies (e.g., matching a candidate skilled in PyTorch with a job requiring Deep Learning).
- **Hybrid Scoring**:
  $$\text{Hybrid Score} = (0.6 \times \text{Skill Coverage Score}) + (0.4 \times \text{Semantic Score})$$

---

## 16. Error Handling & Resilience

### Backend Sanitization (`backend/middleware/errorHandler.js`)
- All errors are formatted into clean JSON payloads: `{ "success": false, "message": "..." }`.
- **Sensitive Data Redaction**: Automatic regex masking strips internal server paths, MongoDB stack traces, and `CastError` details before sending responses to clients.
- **Multer Error Mapping**: Translates file size limit errors (`LIMIT_FILE_SIZE`) into clear messages: `"File size exceeds the allowed limit."`.
- **Database Fallback Mode**: When MongoDB is unavailable, the backend seamlessly switches to `memoryDb.js`, allowing core read and write flows to continue operating in memory during demonstrations or network outages.

### Frontend API Client (`frontend/src/services/api.js`)
- **Network Failure Interception**: Catches offline states and connection refused errors, displaying: `"Unable to connect to the server. Please check your connection and try again."`.
- **Route-Aware 401 Interception**:
  - `401 Unauthorized` responses on protected routes automatically clear expired tokens from `localStorage` and redirect to `/login`.
  - Public routes (the Landing Page `/` and Login page `/login`) **never** redirect upon receiving 401s, ensuring unauthenticated visitors can browse without interruptions.

---

## 17. Security Considerations

- **Password Encryption**: All passwords are irreversibly hashed with salted `bcryptjs` using 10 rounds.
- **Stateless Tokens**: Authentication state is stored in cryptographically signed JWT tokens rather than stateful server sessions.
- **Multi-Tenant Scoping**: All database operations (`find`, `create`, `update`, `aggregate`) enforce `collegeId: req.collegeId` to prevent cross-tenant data leaks.
- **Strict File Type Verification**: File uploads strictly validate both extension and MIME type before writing to disk.
- **CORS Policies**: Explicit origin validation restricting requests to configured frontend addresses (`localhost:5173`, `localhost:5137`, and production domains).
- **No Plaintext Secrets in Repository**: Sensitive credentials, database URIs, and JWT signing keys are loaded strictly from environment variables.

---

## 18. Testing & Verification

### Running Backend Tests
The backend test suite is powered by **Jest** and **Supertest**:
```bash
cd backend
npm test -- --ci --runInBand
```
- **Coverage**: All 10 test suites covering admin auth, candidate matching, CSV parsing, student management, job drive lifecycles, and root route behaviors.
- **Result**: `56 passed, 56 total`.

### Running Frontend Verification
```bash
cd frontend
npm run build
```
- Compiles 2,500+ modules via Vite and Tailwind CSS with 0 compilation errors.

### Running ML Service Tests
```bash
cd ml-service
pytest
```
- Executes unit tests across placement prediction, skill normalization, resume parsing, and audio pause extraction.

---

## 19. Development Guidelines

1. **Separation of Concerns**: Keep business logic in controllers/services and presentation in UI components.
2. **Never Commit Secrets**: Do not commit `.env` files, production credentials, or JWT signing keys to version control.
3. **Tenant Context**: When writing new backend models or queries, always include `collegeId` in schemas and queries.
4. **Meaningful Commits**: Use conventional commits (e.g., `feat:`, `fix:`, `docs:`, `test:`).
5. **Branching Strategy**: Create descriptive feature branches (e.g., `feature/integration-landing-page`) from `main` and submit pull requests.

---

## 20. Contributors

- **Harsh Verdhan Singh** ([@harshverdhan312](https://github.com/harshverdhan312))
- **Khushi Sahu** ([@KhushiCodes02](https://github.com/KhushiCodes02))
- **Kavya Shukla** ([@kavya1342](https://github.com/kavya1342))
- **Kushagra Shukla** ([@Shukla-Kushagra10](https://github.com/Shukla-Kushagra10))

---

## 21. License

This project is licensed for academic, institutional, and research evaluation. All rights reserved.
