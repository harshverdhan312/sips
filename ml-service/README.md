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

## Placement Model

The trained placement model artifact (`models/placement_model.joblib`) is version-controlled in the repository for direct production inference without requiring retraining during deployment.

To re-train or reproduce the model from raw dataset:

```bash
python scripts/train_placement_model.py
```

This updates: `models/placement_model.joblib` and evaluates metadata against `data/raw/collegePlace.csv`.

## Production Deployment & Installation

### Production (No Cache)
```bash
pip install --no-cache-dir -r requirements.txt
```

### Development & Testing
```bash
pip install -r requirements-dev.txt
```

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

This endpoint uses an ONNX Runtime CPU implementation of the pretrained `all-MiniLM-L6-v2` Sentence-BERT embedding model with attention-mask weighted mean pooling and $L_2$ unit normalization. It delivers identical 384-dimensional cosine similarity without requiring the heavy PyTorch runtime.

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

### Hybrid Job Match

`POST /resume/hybrid-match`

This endpoint combines deterministic skill coverage with pretrained Sentence-BERT semantic similarity.

Default weights:

- Skill coverage: `0.6`
- Semantic similarity: `0.4`

The weights can be customized, but each must be between `0` and `1`, and together they must sum to `1`.

Example request:

```json
{
  "student_skills": ["Python", "ML"],
  "required_skills": ["Python", "Machine Learning", "SQL"],
  "resume_text": "Python and machine learning experience.",
  "job_text": "Python ML engineer with SQL.",
  "skill_weight": 0.6,
  "semantic_weight": 0.4
}
```

Example response:

```json
{
  "matched_skills": ["python", "machine learning"],
  "missing_skills": ["sql"],
  "skill_coverage_score": 66.67,
  "semantic_similarity": 0.8,
  "semantic_score": 80.0,
  "hybrid_match_score": 72.0,
  "skill_weight": 0.6,
  "semantic_weight": 0.4
}
```
