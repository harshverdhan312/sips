from src.resume.role_profiles import get_role_profile
from src.resume.skill_normalizer import normalize_skills


def analyze_skill_gap(student_skills: list[str], role: str) -> dict:
    """Compare normalized student skills with a supported role profile."""
    normalized_student_skills = normalize_skills(student_skills)
    required_skills = normalize_skills(get_role_profile(role))
    student_skill_set = set(normalized_student_skills)

    matched_skills = [
        skill for skill in required_skills if skill in student_skill_set
    ]
    missing_skills = [
        skill for skill in required_skills if skill not in student_skill_set
    ]

    coverage_score = (
        round(len(matched_skills) / len(required_skills) * 100, 2)
        if required_skills
        else 0.0
    )

    return {
        "matched_skills": matched_skills,
        "missing_skills": missing_skills,
        "coverage_score": coverage_score,
    }
