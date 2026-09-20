from src.resume.skill_catalog import SKILL_ALIASES


DEFAULT_SKILL_ALIASES = SKILL_ALIASES


def normalize_skill(skill: str, aliases=None) -> str:
    """Normalize a skill name to its canonical representation."""
    if not isinstance(skill, str):
        raise TypeError("Skill must be a string.")

    normalized = " ".join(skill.strip().lower().split())

    if not normalized:
        raise ValueError("Skill must not be empty.")

    alias_map = aliases if aliases is not None else DEFAULT_SKILL_ALIASES

    return alias_map.get(normalized, normalized)


def normalize_skills(skills: list[str], aliases=None) -> list[str]:
    """Normalize a collection of skills and remove duplicates."""
    if not isinstance(skills, list):
        raise TypeError("Skills must be provided as a list.")

    normalized_skills = []

    for skill in skills:
        normalized = normalize_skill(skill, aliases=aliases)

        if normalized not in normalized_skills:
            normalized_skills.append(normalized)

    return normalized_skills
