import pytest

from src.resume.pipeline import analyze_resume_text


def test_pipeline_combines_aliases_and_role_specific_skills():
    result = analyze_resume_text(
        "  Python, ML, SQL, Git and Docker.\nAlso JavaScript and JS.  ",
        "Machine Learning Engineer",
    )

    assert set(result["extracted_skills"]) == {
        "python", "machine learning", "sql", "git", "docker", "javascript",
    }
    assert len(result["extracted_skills"]) == 6
    assert result["matched_skills"] == [
        "python", "machine learning", "sql", "git", "docker",
    ]
    assert result["missing_skills"] == ["deep learning"]
    assert result["coverage_score"] == pytest.approx(83.33)


def test_pipeline_recognizes_all_data_analyst_profile_skills():
    result = analyze_resume_text(
        "Python, SQL, data analysis, statistics, Excel and data visualization.",
        "  DATA   ANALYST  ",
    )

    assert result["matched_skills"] == [
        "python", "sql", "data analysis",
        "statistics", "excel", "data visualization",
    ]
    assert result["missing_skills"] == []
    assert result["coverage_score"] == 100.0


def test_pipeline_handles_text_without_known_skills():
    result = analyze_resume_text(
        "Strong communication and leadership experience.",
        "Machine Learning Engineer",
    )

    assert result["extracted_skills"] == []
    assert result["matched_skills"] == []
    assert result["missing_skills"] == [
        "python", "machine learning", "deep learning", "sql", "git", "docker",
    ]
    assert result["coverage_score"] == 0.0


@pytest.mark.parametrize("text", ["", " \n\t "])
def test_pipeline_rejects_blank_resume_text(text):
    with pytest.raises(ValueError, match="Resume text must not be empty"):
        analyze_resume_text(text, "Data Analyst")


def test_pipeline_rejects_non_string_resume_text():
    with pytest.raises(TypeError, match="Resume text must be a string"):
        analyze_resume_text(None, "Data Analyst")


def test_pipeline_rejects_unsupported_role():
    with pytest.raises(ValueError, match="Unsupported role:"):
        analyze_resume_text("Python", "Unknown Role")