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
