import re


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
    """Extract known skills that appear in resume text."""
    if not isinstance(text, str):
        raise TypeError("Resume text must be a string.")

    skill_list = skills if skills is not None else DEFAULT_SKILLS
    found_skills = []

    for skill in skill_list:
        pattern = rf"(?<!\w){re.escape(skill)}(?!\w)"

        if re.search(pattern, text, flags=re.IGNORECASE):
            found_skills.append(skill)

    return found_skills
