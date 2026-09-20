# SIPS ML Service

Machine Learning microservice for the Skill Intelligence Placement System.

## Current Status

Stage 1: Project environment and repository structure.

## Python Version

Python 3.11

## Planned Components

- Placement prediction
- Resume intelligence
- Skill-gap analysis
- Interview analysis
- Employability scoring
- Peer matching
- Recommendation engine
- FastAPI integration

## Placement Model Reproduction

The trained placement model artifact is intentionally excluded from Git.

From the repository root, regenerate it with:

.\ml-service\.venv\Scripts\python.exe .\ml-service\scripts\train_placement_model.py

This creates: ml-service/models/placement_model.joblib

The placement API loads this artifact for inference.

## Resume Intelligence API

The resume intelligence endpoints are registered under `/resume`.

### Extract Skills from a PDF

`POST /resume/extract`

- Content type: `multipart/form-data`
- File field: `file`
- Accepted type: PDF
- Maximum size: 5 MB
- Supports text-based PDFs; scanned image PDFs require OCR, which is not yet implemented.

Example response:

```json
{
  "extracted_skills": ["python", "sql", "machine learning"]
}
```

### Deterministic Job Skill Match

`POST /resume/match`

Example request:

```json
{
  "student_skills": ["Python", "ML", "SQL"],
  "required_skills": ["Python", "SQL", "Docker"]
}
```

Example response:

```json
{
  "matched_skills": ["python", "sql"],
  "missing_skills": ["docker"],
  "coverage_score": 66.67
}
```

### Semantic Job Match

`POST /resume/semantic-match`

This endpoint uses pretrained `all-MiniLM-L6-v2` Sentence-BERT embeddings with cosine similarity. It does not use a fine-tuned model.

Example request:

```json
{
  "student_skills": ["Python", "ML", "SQL"],
  "job_text": "Seeking a machine learning engineer with Python experience."
}
```

Example response:

```json
{
  "semantic_similarity": 0.8123,
  "model_name": "all-MiniLM-L6-v2"
}
```

### Analyze a PDF Against Job Requirements

`POST /resume/analyze`

- Content type: `multipart/form-data`
- PDF field: `file`
- Repeat the `required_skills` form field once for each required skill
- Accepted file type: PDF
- Maximum file size: 5 MB

Example form fields:

```text
file: resume.pdf
required_skills: Python
required_skills: Machine Learning
required_skills: Kubernetes
required_skills: SQL
```

Example response:

```json
{
  "extracted_skills": ["python", "sql", "machine learning", "docker"],
  "matched_skills": ["python", "machine learning", "sql"],
  "missing_skills": ["kubernetes"],
  "coverage_score": 75.0
}
```
