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

def test_semantic_match_compares_student_skills_with_job_text(monkeypatch):
    monkeypatch.setattr(
        resume_routes,
        "calculate_semantic_similarity",
        lambda first_text, second_text: 0.812345,
    )

    response = client.post(
        "/resume/semantic-match",
        json={
            "student_skills": [
                "Python",
                "ML",
                "SQL",
            ],
            "job_text": (
                "Seeking a machine learning engineer "
                "with Python and database experience."
            ),
        },
    )

    assert response.status_code == 200
    assert response.json() == {
        "semantic_similarity": 0.8123,
        "model_name": "all-MiniLM-L6-v2",
    }


def test_semantic_match_rejects_empty_student_skills():
    response = client.post(
        "/resume/semantic-match",
        json={
            "student_skills": [],
            "job_text": "Python developer",
        },
    )

    assert response.status_code == 422
    assert response.json()["detail"] == (
        "Student skills must not be empty."
    )
