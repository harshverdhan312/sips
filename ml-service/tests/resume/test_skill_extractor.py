import pytest

from src.resume.skill_extractor import extract_skills


def test_extracts_known_skills_case_insensitively():
    text = "Experienced with Python, SQL, Machine Learning, React and Git."

    result = extract_skills(text)

    assert result == ["python", "sql", "machine learning", "react", "git"]


def test_returns_empty_list_when_no_skills_match():
    result = extract_skills("Strong communication and leadership experience.")

    assert result == []


def test_supports_custom_skill_list():
    result = extract_skills(
        "Worked with Docker and Kubernetes.",
        skills=["docker", "kubernetes"],
    )

    assert result == ["docker", "kubernetes"]


def test_rejects_non_string_resume_text():
    with pytest.raises(TypeError, match="Resume text must be a string."):
        extract_skills(None)