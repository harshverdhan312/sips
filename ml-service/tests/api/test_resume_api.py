from fastapi.testclient import TestClient

import src.api.resume_routes as resume_routes
from src.api.main import app


client = TestClient(app)


def test_extract_resume_skills_from_pdf(monkeypatch):
    monkeypatch.setattr(
        resume_routes,
        "extract_pdf_text",
        lambda source: "Python ML SQL",
    )

    response = client.post(
        "/resume/extract",
        files={
            "file": (
                "resume.pdf",
                b"%PDF-fake",
                "application/pdf",
            )
        },
    )

    assert response.status_code == 200
    assert response.json() == {
        "extracted_skills": [
            "python",
            "sql",
            "machine learning",
        ]
    }


def test_extract_resume_rejects_non_pdf():
    response = client.post(
        "/resume/extract",
        files={
            "file": (
                "resume.txt",
                b"Python SQL",
                "text/plain",
            )
        },
    )

    assert response.status_code == 415
    assert response.json()["detail"] == (
        "Only PDF files are supported."
    )


def test_extract_resume_rejects_empty_pdf():
    response = client.post(
        "/resume/extract",
        files={
            "file": (
                "resume.pdf",
                b"",
                "application/pdf",
            )
        },
    )

    assert response.status_code == 400
    assert response.json()["detail"] == (
        "Uploaded PDF must not be empty."
    )


def test_match_resume_skills_against_job_requirements():
    response = client.post(
        "/resume/match",
        json={
            "student_skills": ["Python", "JS", "ML"],
            "required_skills": [
                "JavaScript",
                "Python",
                "SQL",
                "Machine Learning",
            ],
        },
    )

    assert response.status_code == 200
    assert response.json() == {
        "matched_skills": [
            "javascript",
            "python",
            "machine learning",
        ],
        "missing_skills": ["sql"],
        "coverage_score": 75.0,
    }


def test_match_resume_rejects_extra_fields():
    response = client.post(
        "/resume/match",
        json={
            "student_skills": ["Python"],
            "required_skills": ["Python"],
            "unexpected": True,
        },
    )

    assert response.status_code == 422