import pytest

import src.resume.hybrid_matcher as hybrid_matcher
from src.resume.hybrid_matcher import calculate_hybrid_match


def test_calculate_hybrid_match_combines_component_scores(monkeypatch):
    monkeypatch.setattr(
        hybrid_matcher,
        "calculate_semantic_similarity",
        lambda first_text, second_text, model=None: 0.75,
    )

    result = calculate_hybrid_match(
        student_skills=["Python", "ML"],
        required_skills=["Python", "SQL", "Machine Learning", "Docker"],
        resume_text="Python and machine learning experience.",
        job_text="Python ML engineer with SQL and Docker.",
    )

    assert result == {
        "matched_skills": ["python", "machine learning"],
        "missing_skills": ["sql", "docker"],
        "skill_coverage_score": 50.0,
        "semantic_similarity": 0.75,
        "semantic_score": 75.0,
        "hybrid_match_score": 60.0,
        "skill_weight": 0.6,
        "semantic_weight": 0.4,
    }


def test_calculate_hybrid_match_clamps_negative_semantic_score(monkeypatch):
    monkeypatch.setattr(
        hybrid_matcher,
        "calculate_semantic_similarity",
        lambda first_text, second_text, model=None: -0.25,
    )

    result = calculate_hybrid_match(
        student_skills=["Python"],
        required_skills=["Python"],
        resume_text="Python",
        job_text="Unrelated role",
    )

    assert result["semantic_score"] == 0.0
    assert result["hybrid_match_score"] == 60.0


@pytest.mark.parametrize(
    ("skill_weight", "semantic_weight"),
    [
        (0.7, 0.4),
        (-0.1, 1.1),
        (1.1, -0.1),
    ],
)
def test_calculate_hybrid_match_rejects_invalid_weights(
    skill_weight,
    semantic_weight,
):
    with pytest.raises(
        ValueError,
        match="Match weights must be between 0 and 1 and sum to 1.",
    ):
        calculate_hybrid_match(
            student_skills=["Python"],
            required_skills=["Python"],
            resume_text="Python",
            job_text="Python developer",
            skill_weight=skill_weight,
            semantic_weight=semantic_weight,
        )