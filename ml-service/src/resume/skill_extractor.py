import re

from src.resume.skill_normalizer import DEFAULT_SKILL_ALIASES


DEFAULT_SKILLS = [
    "python",
    "java",
    "javascript",
    "sql",
    "machine learning",
    "deep learning",
    "data science",
    "data analysis",
    "html",
    "css",
    "react",
    "node.js",
    "git",
]


def extract_skills(text: str, skills=None) -> list[str]:
    """Extract known skills, resolving aliases for the default vocabulary."""
    if not isinstance(text, str):
        raise TypeError("Resume text must be a string.")

    skill_list = skills if skills is not None else DEFAULT_SKILLS
    found_skills = []

    for skill in skill_list:
        variants = [skill]

        if skills is None:
            variants.extend(
                alias
                for alias, canonical in DEFAULT_SKILL_ALIASES.items()
                if canonical == skill and alias != skill
            )

        for variant in variants:
            pattern = rf"(?<!\w){re.escape(variant)}(?!\w)"

            if re.search(pattern, text, flags=re.IGNORECASE):
                found_skills.append(skill)
                break

    return found_skills
