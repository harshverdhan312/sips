from src.resume.semantic_matcher import calculate_semantic_similarity
from src.resume.skill_gap import compare_skill_sets


DEFAULT_SKILL_WEIGHT = 0.6
DEFAULT_SEMANTIC_WEIGHT = 0.4


def _validate_weights(
    skill_weight: float,
    semantic_weight: float,
) -> None:
    weights_are_numeric = (
        isinstance(skill_weight, (int, float))
        and not isinstance(skill_weight, bool)
        and isinstance(semantic_weight, (int, float))
        and not isinstance(semantic_weight, bool)
    )
    weights_are_in_range = (
        weights_are_numeric
        and 0.0 <= skill_weight <= 1.0
        and 0.0 <= semantic_weight <= 1.0
    )
    weights_sum_to_one = (
        weights_are_numeric
        and abs(skill_weight + semantic_weight - 1.0) < 1e-9
    )

    if not weights_are_in_range or not weights_sum_to_one:
        raise ValueError(
            "Match weights must be between 0 and 1 and sum to 1."
        )


def calculate_hybrid_match(
    student_skills: list[str],
    required_skills: list[str],
    resume_text: str,
    job_text: str,
    model=None,
    skill_weight: float = DEFAULT_SKILL_WEIGHT,
    semantic_weight: float = DEFAULT_SEMANTIC_WEIGHT,
) -> dict:
    """Combine deterministic skill coverage with semantic similarity."""
    _validate_weights(
        skill_weight,
        semantic_weight,
    )

    gap_analysis = compare_skill_sets(
        student_skills,
        required_skills,
    )
    semantic_similarity = calculate_semantic_similarity(
        resume_text,
        job_text,
        model=model,
    )
    semantic_score = round(
        max(0.0, min(1.0, semantic_similarity)) * 100,
        2,
    )
    hybrid_match_score = round(
        gap_analysis["coverage_score"] * skill_weight
        + semantic_score * semantic_weight,
        2,
    )

    return {
        "matched_skills": gap_analysis["matched_skills"],
        "missing_skills": gap_analysis["missing_skills"],
        "skill_coverage_score": gap_analysis["coverage_score"],
        "semantic_similarity": round(
            semantic_similarity,
            4,
        ),
        "semantic_score": semantic_score,
        "hybrid_match_score": hybrid_match_score,
        "skill_weight": skill_weight,
        "semantic_weight": semantic_weight,
    }