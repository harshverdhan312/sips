# SIPS Admin Dashboard Backend API Documentation

The **Skill Intelligence Placement System (SIPS)** Admin Backend provides institutional administrators and placement officers with comprehensive tools to manage students, campus recruitment drives, skill intelligence, batch readiness metrics, and targeted interventions.

---

## 1. Architecture & Multi-Tenancy

### Tenant Isolation
SIPS is built on a multi-tenant institutional model. Each college/university operates as an isolated tenant identified by a unique `collegeId`. All database queries, mutations, analytics aggregations, and candidate match calculations are strictly scoped to `req.collegeId`, derived securely from verified JSON Web Tokens (JWTs).

### Role-Based Access Control (RBAC)
- **`COLLEGE_ADMIN`**: Placement officers and institutional administrators. Granted full access to all `/api/admin/*` endpoints.
- **`STUDENT`**: Candidates enrolled in an institution. Replaces access to `/api/admin/*` with `403 Forbidden`. Can access `/api/student/*` and public endpoints.

### Authentication Header
All protected endpoints require a valid JWT Bearer token in the HTTP `Authorization` header:
```http
Authorization: Bearer <JWT_TOKEN>
```

### Route Aliasing & Backward Compatibility
To guarantee backward compatibility with legacy web clients and future Flutter mobile applications:
- All new admin endpoints are mounted under `/api/admin/*` with aliases at `/admin/*`.
- Core services are accessible via both `/api/<resource>` and `/<resource>` (e.g. `/api/auth/login` and `/auth/login`).

---

## 2. Global Response Conventions

### Success Response Format
```json
{
  "success": true,
  "data": { ... } // or entity-specific payload
}
```

### Standard Error Response Format
```json
{
  "message": "Human-readable error description",
  "errors": ["Optional array of specific validation issues"]
}
```

### Common HTTP Status Codes
| Code | Meaning | Usage |
| :--- | :--- | :--- |
| `200 OK` | Success | Successful retrieval or update operation. |
| `201 Created` | Created | Resource (job, alert, college) successfully created. |
| `400 Bad Request` | Validation Error | Missing required fields, invalid format, or malformed CSV. |
| `401 Unauthorized` | Auth Required | Missing, invalid, or expired JWT token. |
| `403 Forbidden` | Access Denied | Authenticated as `STUDENT` attempting to access admin routes. |
| `404 Not Found` | Resource Not Found | Specified student, job, or alert does not exist. |
| `409 Conflict` | Duplicate Key | Student email/rollNo already registered in tenant college. |
| `500 Server Error` | Internal Error | Unexpected server or database exception. |

---

## 3. API Endpoint Reference

### Authentication (`/api/auth`)

#### 1. Domain-Based Login
Authenticates either an administrator or a student based on their institutional email domain.
- **Endpoint**: `POST /api/auth/login`
- **Access**: Public
- **Request Body**:
  ```json
  {
    "email": "admin@rvce.edu",
    "password": "MasterPassword123"
  }
  ```
- **Response (`200 OK`)**:
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6...",
    "role": "COLLEGE_ADMIN",
    "collegeSlug": "rvce",
    "collegeName": "R.V. College of Engineering",
    "userId": "507f1f77bcf86cd799439011"
  }
  ```

#### 2. Register College Tenant
Registers a new educational institution on the platform.
- **Endpoint**: `POST /api/auth/register-college`
- **Access**: Public
- **Request Body**:
  ```json
  {
    "name": "R.V. College of Engineering",
    "slug": "rvce",
    "adminEmail": "placement@rvce.edu",
    "masterPassword": "SecurePassword123",
    "acceptedDomains": ["rvce.edu", "student.rvce.edu"]
  }
  ```

---

### Admin Overview & KPIs (`/api/admin/overview`)

#### 1. Get Institutional Overview
Computes consolidated institutional metrics across students, placement status, readiness tiers, active drives, and recent activity.
- **Endpoint**: `GET /api/admin/overview`
- **Access**: `COLLEGE_ADMIN`
- **Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "data": {
      "totalStudents": 480,
      "eligibleStudents": 460,
      "placedStudents": 312,
      "unplacedStudents": 128,
      "inProcessStudents": 20,
      "optedOutStudents": 20,
      "placementRate": 68,
      "avgReadinessScore": 74,
      "avgTechnicalScore": 78,
      "avgSoftSkillScore": 71,
      "avgResumeScore": 82,
      "avgCgpa": 8.12,
      "atRiskCount": 42,
      "readyCount": 310,
      "needsImprovementCount": 128,
      "activeJobsCount": 8,
      "activeAlertsCount": 3,
      "recentActivity": [
        {
          "id": "60d0fe4f5311236168a109ca",
          "action": "CREATE_JOB",
          "actor": "admin@college.edu",
          "target": "Google - SDE 1",
          "timestamp": "2025-05-10T14:32:00.000Z"
        }
      ]
    }
  }
  ```

---

### Student Management (`/api/admin/students`)

#### 1. List Students (Search, Filter, Paginate)
- **Endpoint**: `GET /api/admin/students`
- **Access**: `COLLEGE_ADMIN`
- **Query Parameters**:
  - `search` *(string)*: Case-insensitive search across name, rollNo, usn, email, branch.
  - `branch` *(string)*: Filter by department (e.g. `'Computer Science & Engineering'`).
  - `batch` *(string)*: Filter by graduation year (e.g. `'2025'`).
  - `status` *(string)*: `'UNPLACED'`, `'PLACED'`, `'IN_PROCESS'`, `'OPTED_OUT'`.
  - `readiness` *(string)*: `'ready'` (≥75), `'needs_improvement'` (50-74), `'at_risk'` (<50).
  - `page` *(number)*: Page index (default: `1`).
  - `limit` *(number)*: Page size (default: `20`, max: `100`).
  - `sortBy` *(string)*: `'name'`, `'rollNo'`, `'cgpa'`, `'readinessScore'`, `'createdAt'`.
  - `sortOrder` *(string)*: `'asc'` or `'desc'` (default: `'asc'`).
- **Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "students": [
      {
        "_id": "60d0fe4f5311236168a109cb",
        "name": "Aarav Sharma",
        "rollNo": "1RV21CS001",
        "usn": "1RV21CS001",
        "email": "aarav.s@rvce.edu",
        "branch": "Computer Science & Engineering",
        "batch": "2025",
        "cgpa": 8.85,
        "placementStatus": "PLACED",
        "companyPlaced": "Google",
        "packageOffered": 24.5,
        "readinessScore": 88,
        "skills": ["python", "react.js", "docker"],
        "tags": ["Placement Ready"]
      }
    ],
    "pagination": {
      "total": 480,
      "page": 1,
      "limit": 20,
      "totalPages": 24
    }
  }
  ```

#### 2. Get Student by ID
Returns complete profile, readiness component breakdown, and ranked matching jobs.
- **Endpoint**: `GET /api/admin/students/:id`
- **Access**: `COLLEGE_ADMIN`
- **Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "student": {
      "_id": "60d0fe4f5311236168a109cb",
      "name": "Aarav Sharma",
      "rollNo": "1RV21CS001",
      "email": "aarav.s@rvce.edu",
      "skills": ["python", "react.js", "docker", "aws"],
      "technicalScore": 90,
      "softSkillScore": 85,
      "resumeScore": 88,
      "readinessScore": 88
    },
    "matches": [
      {
        "jobId": "60d0fe4f5311236168a109cc",
        "title": "Cloud Platform Engineer",
        "company": "Amazon",
        "ctc": "22 LPA",
        "matchScore": 75,
        "matchedSkills": ["python", "docker", "aws"],
        "missingSkills": ["kubernetes"]
      }
    ]
  }
  ```

#### 3. Update Student Record
Updates placement status, compensation, readiness tags, and administrative notes.
- **Endpoint**: `PUT /api/admin/students/:id`
- **Access**: `COLLEGE_ADMIN`
- **Request Body**:
  ```json
  {
    "placementStatus": "PLACED",
    "companyPlaced": "Microsoft",
    "packageOffered": 28.0,
    "tags": ["Top Performer", "Placed Day 1"],
    "notes": "Accepted offer letter on 2025-05-12"
  }
  ```

#### 4. Delete Student Record
Removes a student and cascades deletion to all associated candidate match records.
- **Endpoint**: `DELETE /api/admin/students/:id`
- **Access**: `COLLEGE_ADMIN`

#### 5. Bulk Upload Students via CSV
Parses CSV data, creates student accounts with hashed default credentials, and logs results.
- **Endpoint**: `POST /api/admin/students/upload`
- **Access**: `COLLEGE_ADMIN`
- **Request Body**:
  ```json
  {
    "csvData": "Name, Roll No, Email, Branch, Batch, CGPA, Skills\nAarav Sharma, 1RV21CS001, aarav@rvce.edu, CSE, 2025, 8.8, \"python, react\"\nPriya Nair, 1RV21IS042, priya@rvce.edu, ISE, 2025, 9.1, \"java, sql\""
  }
  ```

#### 6. Export Students to CSV
Streams/downloads filtered students as a formatted CSV file.
- **Endpoint**: `GET /api/admin/students/export`
- **Access**: `COLLEGE_ADMIN`
- **Response**: `Content-Type: text/csv` with `Content-Disposition: attachment; filename="sips-students-export.csv"`

---

### Institutional Analytics (`/api/admin/analytics`)

#### 1. Student Readiness Analytics
- **Endpoint**: `GET /api/admin/analytics/students`
- **Access**: `COLLEGE_ADMIN`
- **Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "data": {
      "readinessTiers": [
        { "tier": "Placement Ready (≥75)", "count": 310, "color": "#10B981" },
        { "tier": "Needs Improvement (50-74)", "count": 128, "color": "#F59E0B" },
        { "tier": "At Risk (<50)", "count": 42, "color": "#EF4444" }
      ],
      "departments": [
        {
          "branch": "Computer Science & Engineering",
          "total": 180,
          "placed": 140,
          "atRisk": 8,
          "avgReadiness": 82,
          "avgCgpa": 8.45
        }
      ],
      "cgpaDistribution": [
        { "bracket": "< 6.0", "count": 12 },
        { "bracket": "6.0 - 7.0", "count": 45 },
        { "bracket": "7.0 - 8.0", "count": 160 },
        { "bracket": "8.0 - 9.0", "count": 210 },
        { "bracket": "9.0 - 10.0", "count": 53 }
      ]
    }
  }
  ```

#### 2. Placement Outcomes Analytics
- **Endpoint**: `GET /api/admin/analytics/placement`
- **Access**: `COLLEGE_ADMIN`
- **Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "data": {
      "statusBreakdown": {
        "PLACED": 312,
        "UNPLACED": 128,
        "IN_PROCESS": 20,
        "OPTED_OUT": 20
      },
      "departments": [
        {
          "branch": "Computer Science & Engineering",
          "total": 180,
          "placed": 140,
          "placementRate": 77.8,
          "avgPackage": 14.8
        }
      ],
      "ctcDistribution": [
        { "tier": "< 5 LPA", "count": 28 },
        { "tier": "5 - 10 LPA", "count": 114 },
        { "tier": "10 - 15 LPA", "count": 102 },
        { "tier": "15+ LPA", "count": 68 }
      ],
      "topRecruiters": [
        { "company": "Google", "hires": 12, "avgPackage": 26.5 },
        { "company": "Amazon", "hires": 18, "avgPackage": 22.0 }
      ],
      "batchTrends": [
        { "batch": "2024", "total": 450, "placed": 380, "placementRate": 84.4, "avgPackage": 11.8 },
        { "batch": "2025", "total": 480, "placed": 312, "placementRate": 65.0, "avgPackage": 13.2 }
      ]
    }
  }
  ```

---

### Campus Drives & Job Management (`/api/admin/jobs`)

#### 1. List Jobs
- **Endpoint**: `GET /api/admin/jobs`
- **Query Params**: `status` (`'ACTIVE'`, `'CLOSED'`, `'UPCOMING'`), `search`.
- **Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "count": 4,
    "jobs": [
      {
        "_id": "60d0fe4f5311236168a109cc",
        "title": "Software Development Engineer",
        "role": "Software Development Engineer",
        "company": "Amazon",
        "department": "Engineering",
        "location": "Bengaluru, India",
        "ctc": "18 LPA - 24 LPA",
        "type": "Full-time",
        "status": "ACTIVE",
        "minCgpa": 7.5,
        "allowedBranches": ["CSE", "ISE", "ECE"],
        "requiredSkills": ["java", "python", "aws", "algorithms"],
        "batchEligibleCount": 240,
        "batchMatchedCount": 86
      }
    ]
  }
  ```

#### 2. Create Job / Campus Drive
Creates recruitment drive, extracts skills if not provided, calculates batch eligibility and matches.
- **Endpoint**: `POST /api/admin/jobs`
- **Request Body**:
  ```json
  {
    "title": "Full Stack Developer",
    "role": "Full Stack Developer",
    "company": "Infosys InStep",
    "description": "Looking for developers proficient in React, Node.js, and MongoDB.",
    "ctc": "12 LPA",
    "minCgpa": 7.0,
    "allowedBranches": ["CSE", "ISE"],
    "requiredSkills": ["react.js", "node.js", "mongodb"],
    "deadline": "2025-06-15T23:59:59.000Z"
  }
  ```

#### 3. Get Ranked Student Matches for a Job
- **Endpoint**: `GET /api/admin/jobs/:id/matches`
- **Query Params**: `minScore` (e.g. `60`)
- **Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "totalMatches": 42,
    "matches": [
      {
        "rank": 1,
        "student": {
          "name": "Aarav Sharma",
          "rollNo": "1RV21CS001",
          "email": "aarav.s@rvce.edu",
          "cgpa": 8.85
        },
        "score": 100,
        "matchedSkills": ["react.js", "node.js", "mongodb"],
        "missingSkills": []
      }
    ]
  }
  ```

---

### Skill Intelligence (`/api/admin/skills/intelligence`)

#### 1. Get Institutional Skill Demand & Gap Matrix
Analyzes student supply versus recruiter demand to discover skill gaps and training targets.
- **Endpoint**: `GET /api/admin/skills/intelligence`
- **Access**: `COLLEGE_ADMIN`
- **Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "data": {
      "studentSkills": [
        { "skill": "python", "count": 340 },
        { "skill": "javascript", "count": 280 }
      ],
      "demandedSkills": [
        { "skill": "docker", "count": 14 },
        { "skill": "kubernetes", "count": 10 }
      ],
      "topMissingSkills": [
        { "skill": "docker", "frequency": 182 },
        { "skill": "kubernetes", "frequency": 145 }
      ],
      "gapAnalysis": [
        {
          "skill": "docker",
          "studentCount": 38,
          "demandCount": 14,
          "studentPercentage": 8,
          "demandPercentage": 85,
          "gapScore": 77
        }
      ],
      "branchSkills": [
        {
          "branch": "Computer Science & Engineering",
          "topSkills": [{ "skill": "python", "count": 160 }]
        }
      ]
    }
  }
  ```

---

### Placement Alerts & Interventions (`/api/admin/alerts`)

#### 1. List Alerts
- **Endpoint**: `GET /api/admin/alerts`
- **Query Params**: `active` (`'true'`, `'false'`, `'all'`), `target` (`'ALL'`, `'STUDENTS'`, `'UNPLACED'`), `type`.

#### 2. Create Alert Broadcast
- **Endpoint**: `POST /api/admin/alerts`
- **Request Body**:
  ```json
  {
    "title": "Google Drive Application Deadline",
    "message": "Eligible candidates must complete their profiles by 6:00 PM today.",
    "type": "DEADLINE",
    "priority": "HIGH",
    "target": "STUDENTS",
    "expiresAt": "2025-05-30T18:00:00.000Z"
  }
  ```

#### 3. Update Alert
- **Endpoint**: `PUT /api/admin/alerts/:id`
- **Request Body**:
  ```json
  {
    "active": false
  }
  ```

#### 4. Delete Alert
- **Endpoint**: `DELETE /api/admin/alerts/:id`
