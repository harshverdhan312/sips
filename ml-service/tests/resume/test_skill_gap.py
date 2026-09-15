import pytest

from src.resume.skill_gap import analyze_skill_gap


def test_analyze_skill_gap_returns_matched_missing_and_coverage():
    result = analyze_skill_gap(
        ["Python", "ML", "Git"],
        "Machine Learning Engineer",
    )

    assert result == {
        "matched_skills": ["python", "machine learning", "git"],
        "missing_skills": ["deep learning", "sql", "docker"],
        "coverage_score": 50.0,
    }


def test_analyze_skill_gap_normalizes_aliases_and_removes_duplicates():
    result = analyze_skill_gap(
        ["JS", "JavaScript", "NodeJS", "SQL"],
        "Full Stack Developer",
    )

    assert result["matched_skills"] == ["javascript", "node.js", "sql"]
    assert result["coverage_score"] == pytest.approx(42.86)


def test_analyze_skill_gap_with_no_student_skills():
    result = analyze_skill_gap([], "Data Scientist")

    assert result["matched_skills"] == []
    assert result["missing_skills"] == [
        "python",
        "sql",
        "data analysis",
        "machine learning",
        "statistics",
        "data visualization",
    ]
    assert result["coverage_score"] == 0.0


def test_analyze_skill_gap_rejects_non_list_skills():
    with pytest.raises(TypeError, match="Skills must be provided as a list."):
        analyze_skill_gap("python", "Data Scientist")


def test_analyze_skill_gap_rejects_unsupported_role():
    with pytest.raises(ValueError, match="Unsupported role:"):
        analyze_skill_gap(["python"], "Cloud Engineer")
