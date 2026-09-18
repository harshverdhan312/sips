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

def test_extracts_aliases_as_canonical_skills():
    result = extract_skills("Experience with JS, ML and NodeJS.")

    assert result == ["javascript", "machine learning", "node.js"]


def test_alias_and_canonical_mentions_do_not_duplicate_skills():
    result = extract_skills("JavaScript and JS; ML and machine learning.")

    assert result == ["javascript", "machine learning"]


def test_aliases_do_not_match_inside_larger_words():
    result = extract_skills("Used HTML, XML and JSON for documentation.")

    assert result == ["html"]


def test_custom_skill_list_does_not_expand_default_aliases():
    result = extract_skills(
        "Used JS, ML and Docker.",
        skills=["docker", "javascript"],
    )

    assert result == ["docker"]
