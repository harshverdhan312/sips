from src.resume.role_profiles import get_role_profile
from src.resume.skill_normalizer import normalize_skills


def compare_skill_sets(
    student_skills: list[str],
    required_skills: list[str],
) -> dict:
    """Compare student skills with an arbitrary requirement list."""
    normalized_student_skills = normalize_skills(student_skills)
    normalized_required_skills = normalize_skills(required_skills)
    student_skill_set = set(normalized_student_skills)

    matched_skills = [
        skill
        for skill in normalized_required_skills
        if skill in student_skill_set
    ]
    missing_skills = [
        skill
        for skill in normalized_required_skills
        if skill not in student_skill_set
    ]

    coverage_score = (
        round(
            len(matched_skills)
            / len(normalized_required_skills)
            * 100,
            2,
        )
        if normalized_required_skills
        else 0.0
    )

    return {
        "matched_skills": matched_skills,
        "missing_skills": missing_skills,
        "coverage_score": coverage_score,
    }


def analyze_skill_gap(student_skills: list[str], role: str) -> dict:
    """Compare student skills with a supported role profile."""
    required_skills = get_role_profile(role)

    return compare_skill_sets(
        student_skills,
        required_skills,
    )
