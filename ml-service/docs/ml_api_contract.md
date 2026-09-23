# SIPS ML Service — API Contract

## Service

- Base URL: `http://127.0.0.1:8000`
- Swagger UI: `http://127.0.0.1:8000/docs`
- OpenAPI schema: `http://127.0.0.1:8000/openapi.json`
- JSON content type: `application/json`
- Latest verified suite: 117 passed, 2 dependency deprecation warnings

## Endpoint Summary

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/health` | Check service availability |
| POST | `/placement/predict` | Predict placement probability |
| POST | `/resume/extract` | Extract skills from a PDF |
| POST | `/resume/match` | Compare student and required skills |
| POST | `/resume/semantic-match` | Calculate semantic similarity |
| POST | `/resume/analyze` | Extract and compare resume skills |
| POST | `/resume/hybrid-match` | Combine skill and semantic scores |
| POST | `/interview/analyze` | Analyze transcript and WAV features |
| POST | `/employability/calculate` | Calculate a weighted index |

## 1. Health Check

`GET /health`

Successful response (`200`):

```json
{
  "status": "ok",
  "service": "SIPS ML Service"
}
2. Placement Prediction

POST /placement/predict

Request:

{
  "Age": 22,
  "Internships": 1,
  "CGPA": 7.5,
  "Hostel": 0,
  "HistoryOfBacklogs": 0,
  "Stream": "Computer Science"
}

Successful response (200):

{
  "placement_probability": 0.3196217715740204,
  "decision_threshold": 0.5,
  "predicted_class": 0,
  "predicted_label": "not_placed",
  "model_version": "1.0.0"
}

Verified constraints:

Age: 19–30
Internships: 0–3
CGPA: 5–9
Hostel: 0 or 1
HistoryOfBacklogs: 0 or 1
Invalid input returns 422.
Missing model artifact returns 503.
Placement probability is an estimate, not a guarantee.

## 3. Resume Skill Extraction

`POST /resume/extract`

Content type: `multipart/form-data`

Required field:

- `file`: PDF file

Successful response (`200`):

```json
{
  "extracted_skills": [
    "python",
    "sql",
    "machine learning",
    "git"
  ]
}

Upload rules:

Only PDF files are supported.
Maximum size is 5 MB.
Empty file returns 400.
Oversized file returns 413.
Unsupported media type returns 415.
Invalid PDF data returns 422.
4. Deterministic Skill Matching

POST /resume/match

Request:

{
  "student_skills": [
    "Python",
    "Machine Learning",
    "Git"
  ],
  "required_skills": [
    "Python",
    "Machine Learning",
    "SQL",
    "Git",
    "Docker"
  ]
}

Successful response (200):

{
  "matched_skills": [
    "python",
    "machine learning",
    "git"
  ],
  "missing_skills": [
    "sql",
    "docker"
  ],
  "coverage_score": 60
}

This uses deterministic normalization and comparison. It is not a trained ML model.

5. Semantic Resume Matching

POST /resume/semantic-match

Request:

{
  "student_skills": [
    "Python",
    "Machine Learning",
    "Data Analysis"
  ],
  "job_text": "The role requires Python, machine learning and analytical skills."
}

Successful response (200):

{
  "semantic_similarity": 0.5774,
  "model_name": "all-MiniLM-L6-v2"
}

Important notes:

Uses the pretrained Sentence-BERT model all-MiniLM-L6-v2.
The model was not fine-tuned on SIPS data.
Similarity is not a hiring probability.
The first request can be slower while the model loads.

## 6. Combined Resume Analysis

`POST /resume/analyze`

Content type: `multipart/form-data`

Required fields:

- `file`: PDF file
- `required_skills`: repeated text field

Required skills must be sent as separate repeated fields:

```text
required_skills=Python
required_skills=SQL
required_skills=Docker

Do not send all skills as one comma-separated value. FastAPI would interpret that as one skill.

Successful response (200):

{
  "extracted_skills": [
    "python",
    "sql",
    "git"
  ],
  "matched_skills": [
    "python",
    "sql"
  ],
  "missing_skills": [
    "docker"
  ],
  "coverage_score": 66.67
}
7. Hybrid Resume Matching

POST /resume/hybrid-match

Request:

{
  "student_skills": [
    "Python",
    "Machine Learning",
    "Git"
  ],
  "required_skills": [
    "Python",
    "Machine Learning",
    "SQL",
    "Git",
    "Docker"
  ],
  "resume_text": "Developed machine learning APIs using Python and Git.",
  "job_text": "Seeking Python and machine learning experience with SQL and Docker.",
  "skill_weight": 0.6,
  "semantic_weight": 0.4
}

Successful response (200):

{
  "matched_skills": [
    "python",
    "machine learning",
    "git"
  ],
  "missing_skills": [
    "sql",
    "docker"
  ],
  "skill_coverage_score": 60,
  "semantic_similarity": 0.8075,
  "semantic_score": 80.75,
  "hybrid_match_score": 68.3,
  "skill_weight": 0.6,
  "semantic_weight": 0.4
}

Verified formula:

hybrid_match_score =
    skill_coverage_score × skill_weight
    + semantic_score × semantic_weight

Weights must be between 0 and 1 and must sum to 1.

## 8. Interview Analysis

`POST /interview/analyze`

Content type: `multipart/form-data`

Required fields:

- `transcript`: text between 1 and 10,000 characters
- `audio`: WAV audio file

Successful response (`200`):

```json
{
  "speech": {
    "word_count": 9,
    "sentence_count": 1,
    "unique_word_count": 9,
    "lexical_diversity": 1,
    "filler_count": 1,
    "filler_rate": 0.1111111111111111,
    "duration_seconds": 2.5,
    "words_per_minute": 216
  },
  "audio": {
    "duration_seconds": 2.5,
    "sample_rate_hz": 16000,
    "channel_count": 1,
    "sample_width_bytes": 2,
    "frame_count": 40000
  },
  "pauses": {
    "pause_count": 1,
    "total_pause_seconds": 0.5,
    "mean_pause_seconds": 0.5,
    "max_pause_seconds": 0.5,
    "pause_ratio": 0.2
  }
}

Important notes:

Returns objective transcript, timing, WAV metadata and pause features.
Pause detection uses RMS-based silence detection on 16-bit PCM WAV audio.
It does not infer emotion, personality, confidence, accent or hiring suitability.
Maximum audio size is 10 MB.
Oversized audio returns 413.
Unsupported audio type returns 415.
Invalid audio or input returns 422.
The temporary server-side audio file is deleted after processing.

## 9. Employability Index

`POST /employability/calculate`

Request:

```json
{
  "component_scores": {
    "placement": 80,
    "resume": 70,
    "interview": 60
  },
  "weights": {
    "placement": 0.4,
    "resume": 0.35,
    "interview": 0.25
  }
}

Successful response (200):

{
  "employability_index": 71.5,
  "component_contributions": {
    "placement": 32,
    "resume": 24.5,
    "interview": 15
  },
  "weights": {
    "placement": 0.4,
    "resume": 0.35,
    "interview": 0.25
  }
}

Validation rules:

Component scores and weights must use identical keys.
Component scores must be between 0 and 100.
Weights must be between 0 and 1.
Weights must sum to 1.
Invalid requests return 422.

Important notes:

This index uses transparent weighted arithmetic.
It is not a trained ML model.
The caller supplies the component scores and weights.
It must not be described as certainty or a guaranteed hiring outcome.
Integration Notes
The response fields in this document are the verified FastAPI contract.
Backend clients must use these exact field names.
Placement probability and employability index are different:
Placement probability comes from the trained placement model.
Employability index is calculated from caller-supplied scores and weights.
API tests verify request handling and response contracts; they are not model-evaluation metrics.
X-API-Key support exists in the Node client configuration, but FastAPI API-key enforcement has not been verified.
Sentence-BERT cold loading may exceed a short backend timeout.
The service documentation is available through Swagger at /docs.
