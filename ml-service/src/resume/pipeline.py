from src.resume.parser import clean_resume_text
from src.resume.role_profiles import get_role_profile
from src.resume.skill_extractor import extract_skills
from src.resume.skill_gap import analyze_skill_gap
from src.resume.skill_normalizer import normalize_skills


def analyze_resume_text(text: str, role: str) -> dict:
    """Analyze already-extracted resume text against a supported role."""
    cleaned_text = clean_resume_text(text)

    if not cleaned_text:
        raise ValueError("Resume text must not be empty.")

    required_skills = get_role_profile(role)

    default_matches = extract_skills(cleaned_text)
    role_matches = extract_skills(cleaned_text, skills=required_skills)
    extracted_skills = normalize_skills(default_matches + role_matches)

    gap_analysis = analyze_skill_gap(extracted_skills, role)

    return {
        "extracted_skills": extracted_skills,
        **gap_analysis,
    }
