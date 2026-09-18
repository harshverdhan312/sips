import pytest

from src.resume.skill_normalizer import normalize_skill, normalize_skills


def test_normalize_skill_maps_alias_to_canonical_name():
    assert normalize_skill("JS") == "javascript"
    assert normalize_skill("ML") == "machine learning"


def test_normalize_skill_cleans_case_and_whitespace():
    assert normalize_skill("  Machine   Learning  ") == "machine learning"


def test_normalize_skills_removes_duplicates():
    result = normalize_skills(
        ["Python", "JS", "JavaScript", "ML", "Machine Learning"]
    )

    assert result == ["python", "javascript", "machine learning"]


def test_normalize_skill_rejects_empty_skill():
    with pytest.raises(ValueError, match="Skill must not be empty."):
        normalize_skill("   ")


def test_normalize_skill_rejects_non_string():
    with pytest.raises(TypeError, match="Skill must be a string."):
        normalize_skill(None)


def test_normalize_skills_rejects_non_list():
    with pytest.raises(TypeError, match="Skills must be provided as a list."):
        normalize_skills("python")