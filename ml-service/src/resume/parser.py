import re


def clean_resume_text(text: str) -> str:
    """Clean raw resume text for downstream skill extraction."""
    if not isinstance(text, str):
        raise TypeError("Resume text must be a string.")

    text = text.strip()

    text = re.sub(
        r"\s+",
        " ",
        text,
    )

    return text
