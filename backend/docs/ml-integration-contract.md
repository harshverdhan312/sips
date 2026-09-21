# SIPS ML Service Integration Contract

**Document Version:** 1.0.0  
**Target Backend:** Node.js Express Backend (`backend/`)  
**Target ML Service:** FastAPI Service (`ml-service/`)  
**Phase:** Phase 5 — Node-Only ML Integration Boundary  
**Status:** Read-Only Contract Specification & Boundary Definition  

---

## 1. Architectural Overview

The SIPS platform integrates a Node.js/Express core backend with a FastAPI Python ML microservice. In Phase 5, a centralized integration client (`backend/services/mlService.js`) establishes a resilient, decoupled boundary on the Node.js side.

```
+--------------------------+                      +--------------------------+
|      Node.js Backend     |                      |     FastAPI ML Service   |
|                          |   HTTP / JSON        |                          |
|  - Auth & Controllers    | -------------------> |  - Skill Extraction (PDF)|
|  - MongoDB Persistence   |                      |  - Semantic Embeddings   |
|  - MLService Client      | <------------------- |  - Placement Prediction  |
|    (Validation/Fallback) |    Response / Error  |  - Audio/Speech Analysis |
+--------------------------+                      +--------------------------+
```

### Core Design Principles
1. **Isolated Boundary**: Domain controllers do not make direct HTTP calls; all communication routes through `MLService`.
2. **Resilience & Non-blocking Startup**: The Node backend boots independently of FastAPI availability.
3. **Controlled Error Normalization**: Upstream failures, timeouts, and validation errors are converted into standard `AppError` instances without leaking Python traces or secrets.
4. **Zero Production Mutation**: Existing deterministic algorithms (e.g. `matchingEngine.js`, `placementTelemetry.js`) remain untouched until future phases formally wire ML contracts.

---

## 2. Configuration Parameters

The Node.js backend manages ML service configuration via environment variables in `backend/config/index.js`:

| Variable Name | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `ML_SERVICE_URL` | String | `http://127.0.0.1:8000` | Base URL of the running FastAPI ML service instance. |
| `ML_SERVICE_TIMEOUT_MS` | Number | `5000` (5s) | Milliseconds before aborting an in-flight HTTP request to the ML service. |
| `ML_SERVICE_API_KEY` | String | `""` (empty) | Optional shared secret / API key sent in `X-API-Key` and `Authorization` headers. |

---

## 3. Service Authentication Status

* **FastAPI State:** `ml-service` currently does **not** enforce authentication middleware or require API keys on incoming requests.
* **Node.js Client State:** Node is forward-compatible. If `ML_SERVICE_API_KEY` is provided in the environment, the client automatically attaches `X-API-Key: <key>` and `Authorization: Bearer <key>` headers.
* **Contract Status:** **CONTRACT GAP / PENDING FUTURE FASTAPI IMPLEMENTATION**. Authentication is optional in dev and will not block communication when empty.

---

## 4. Discovered FastAPI Endpoints & Status Matrix

| Endpoint | HTTP Method | FastAPI Schema / Handler | Node Client Method | Integration Status |
| :--- | :--- | :--- | :--- | :--- |
| `/health` | `GET` | `health_check` | `checkHealth()` | **READY** |
| `/resume/extract` | `POST` | Multipart `file: UploadFile` | `extractResumeSkills(buffer, name)` | **READY** |
| `/resume/match` | `POST` | `SkillMatchRequest` -> `SkillMatchResponse` | `matchResumeSkills(student, req)` | **READY** |
| `/resume/semantic-match` | `POST` | `SemanticMatchRequest` -> `SemanticMatchResponse` | `semanticMatchResume(skills, text)` | **READY** |
| `/resume/hybrid-match` | `POST` | `HybridMatchRequest` -> `HybridMatchResponse` | `hybridMatchResume(options)` | **READY** |
| `/interview/analyze` | `POST` | Multipart `transcript: str`, `audio: UploadFile` | `analyzeInterview(options)` | **READY** |
| `/placement/predict` | `POST` | `PlacementRequest` (`extra='forbid'`) | `predictPlacement(payload)` | **BLOCKED / CONTRACT-PENDING** |

---

## 5. Detailed Endpoint Contracts

### 5.1 Health Check
* **Endpoint:** `GET /health`
* **Status:** `READY`
* **Request:** No parameters or payload.
* **FastAPI Response:**
  ```json
  {
    "status": "ok",
    "service": "SIPS ML Service"
  }
  ```
* **Node Validation:** Checks that `status` and `service` fields exist.

---

### 5.2 Resume Skill Extraction
* **Endpoint:** `POST /resume/extract`
* **Status:** `READY`
* **Request Content-Type:** `multipart/form-data`
* **Fields:**
  * `file`: Binary PDF file (maximum 5MB).
* **FastAPI Response:**
  ```json
  {
    "skills": ["python", "machine learning", "docker", "fastapi"],
    "raw_text": "Extracted text content from resume..."
  }
  ```
* **Node Validation:** Confirms `skills` is an array.

---

### 5.3 Keyword Skill Matching
* **Endpoint:** `POST /resume/match`
* **Status:** `READY`
* **Request Content-Type:** `application/json`
* **Body:**
  ```json
  {
    "student_skills": ["python", "react", "sql"],
    "required_skills": ["python", "docker", "sql", "aws"]
  }
  ```
* **FastAPI Response:**
  ```json
  {
    "match_score": 50.0,
    "matching_skills": ["python", "sql"],
    "missing_skills": ["docker", "aws"]
  }
  ```
* **Node Validation:** Confirms `match_score` is a number and skill lists are arrays.

---

### 5.4 Semantic Skill Matching
* **Endpoint:** `POST /resume/semantic-match`
* **Status:** `READY`
* **Request Content-Type:** `application/json`
* **Body:**
  ```json
  {
    "student_skills": ["deep learning", "pytorch", "computer vision"],
    "job_text": "Looking for an AI researcher with experience in convolutional networks and model training."
  }
  ```
* **FastAPI Response:**
  ```json
  {
    "semantic_score": 78.4
  }
  ```
* **Node Validation:** Confirms `semantic_score` is a numeric value.

---

### 5.5 Hybrid Skill & Semantic Matching
* **Endpoint:** `POST /resume/hybrid-match`
* **Status:** `READY`
* **Request Content-Type:** `application/json`
* **Body:**
  ```json
  {
    "student_skills": ["node.js", "mongodb", "express"],
    "required_skills": ["node.js", "mongodb", "docker"],
    "resume_text": "Full-stack developer experienced in building scalable MERN APIs...",
    "job_text": "Seeking a backend engineer to design REST APIs and microservices...",
    "skill_weight": 0.6,
    "semantic_weight": 0.4
  }
  ```
* **FastAPI Response:**
  ```json
  {
    "hybrid_score": 82.5,
    "keyword_score": 66.7,
    "semantic_score": 90.0,
    "matching_skills": ["node.js", "mongodb"],
    "missing_skills": ["docker"]
  }
  ```
* **Node Validation:** Validates numeric presence of `hybrid_score`.

---

### 5.6 Mock Interview Analysis
* **Endpoint:** `POST /interview/analyze`
* **Status:** `READY`
* **Request Content-Type:** `multipart/form-data`
* **Fields:**
  * `transcript`: String representing the candidate's answers.
  * `audio`: (Optional) WAV audio file (maximum 10MB) for vocal tone/pace analysis.
* **FastAPI Response:**
  ```json
  {
    "transcript_analysis": {
      "clarity": 85,
      "sentiment": "positive",
      "keyword_density": 0.72
    },
    "audio_analysis": {
      "pace_wpm": 130,
      "pause_count": 4,
      "pitch_variation": "normal"
    },
    "overall_score": 82,
    "feedback": ["Good pacing", "Strong technical terminology"]
  }
  ```

---

### 5.7 Placement Prediction
* **Endpoint:** `POST /placement/predict`
* **Status:** **BLOCKED / CONTRACT-PENDING**
* **Request Content-Type:** `application/json`
* **FastAPI Required Schema (`PlacementRequest` with `extra="forbid"`):**
  ```json
  {
    "Age": 22,
    "Internships": 2,
    "CGPA": 8.4,
    "Hostel": 0,
    "HistoryOfBacklogs": 0,
    "Stream": "Computer Science"
  }
  ```
* **FastAPI Response:**
  ```json
  {
    "prediction": 1,
    "probability": 0.88
  }
  ```

---

## 6. Student Placement Data Model & Mapping Contract (Phase 6A)

### 6.1 Placement Model Input Schema
FastAPI placement prediction (`POST /placement/predict`) expects:
* `Age` (Integer, 19–30)
* `Internships` (Integer, 0–3)
* `CGPA` (Float, 5.0–9.0)
* `Hostel` (Integer binary, 0 or 1)
* `HistoryOfBacklogs` (Integer binary, 0 or 1)
* `Stream` (String enum)

### 6.2 Node.js Student Field Source Mapping

In Phase 6A, the Node `Student` model (`backend/models/Student.js`) is extended to legitimately provide these profile attributes:

| ML Feature | Type Expected by ML | Node Student Field | Node Schema Type | Transformation / Mapping Rule |
| :--- | :--- | :--- | :--- | :--- |
| `Age` | `int` (19..30) | `student.age` | `Number` (integer) | Direct integer value. Must be present. |
| `Internships` | `int` (0..3) | `student.internships` | `Number` (integer) | Direct integer value >= 0. Must be present. |
| `CGPA` | `float` (5..9) | `student.cgpa` | `Number` (float) | Float rounded to 2 decimals. Must be present. |
| `Hostel` | `int` (0 or 1) | `student.hostel` | `Boolean` | `true` -> `1`, `false` -> `0`. Must not be null. |
| `HistoryOfBacklogs` | `int` (0 or 1) | `student.historyOfBacklogs` | `Number` (integer) | `> 0` -> `1`, `0` -> `0`. Must not be null. |
| `Stream` | `str` | `student.branch` | `String` | Deterministic normalization via `placementDataMapper.js`. |

### 6.3 Deterministic Branch-to-Stream Mapping Matrix

The mapping layer (`backend/utils/placementDataMapper.js`) normalizes institutional branch names into canonical ML streams:

| SIPS Institutional Branch (`student.branch`) | Canonical ML Stream (`Stream`) |
| :--- | :--- |
| `Computer Science & Engineering` | `Computer Science` |
| `Computer Science and Engineering` | `Computer Science` |
| `Computer Science` / `CSE` | `Computer Science` |
| `Information Technology` / `IT` | `Information Technology` |
| `Electronics And Communication` | `Electronics And Communication` |
| `Electronics & Communication Engineering` | `Electronics And Communication` |
| `Mechanical` / `Mechanical Engineering` | `Mechanical` |
| `Civil` / `Civil Engineering` | `Civil` |
| `Electrical` / `Electrical Engineering` | `Electrical` |
| `Electrical & Electronics Engineering` | `Electrical` |

> [!IMPORTANT]
> **No Synthetic Defaults Rule:** If any required placement input field is missing (`null` or `undefined`) or if an institutional branch cannot be safely mapped to a valid stream, the mapping layer marks the request as incomplete (`isComplete: false`). SIPS NEVER fabricates dummy or synthetic values.

### 6.4 Service-to-Service Authentication
* FastAPI currently does not validate API tokens or client origins.
* Node is configured to transmit `X-API-Key` and `Authorization: Bearer <key>` if configured, maintaining zero code changes when authentication is introduced to `ml-service` in future phases.

---

## 7. Error Mapping Matrix

| Scenario | Upstream Symptom | Node Client Result | HTTP Status |
| :--- | :--- | :--- | :--- |
| Service Down / Connection Refused | `ECONNREFUSED` / Network Error | `AppError('ML Service is currently unavailable. Please try again later.', 503)` | `503 Service Unavailable` |
| Request Timeout | AbortController triggers after 5s | `AppError('ML Service request timed out.', 504)` | `504 Gateway Timeout` |
| Upstream Validation Error | HTTP 422 with `{ detail: [...] }` | `AppError('ML Service validation error: ...', 422)` | `422 Unprocessable Entity` |
| Auth Failure | HTTP 401 / 403 | `AppError('ML Service authentication failed.', 502)` | `502 Bad Gateway` |
| Upstream Internal Crash | HTTP 500 / 503 from FastAPI | `AppError('ML Service encountered an internal server error.', 502)` | `502 Bad Gateway` |
| Malformed JSON / HTML error | `SyntaxError` during `res.json()` | `AppError('ML Service returned an unparseable response.', 502)` | `502 Bad Gateway` |
