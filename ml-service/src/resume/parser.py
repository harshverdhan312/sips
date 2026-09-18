import re
from os import PathLike


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


def extract_pdf_text(pdf_source) -> str:
    """Extract and clean text from a PDF path or binary file object."""
    is_path = isinstance(pdf_source, (str, PathLike))
    is_binary_file = (
        hasattr(pdf_source, "read")
        and hasattr(pdf_source, "seek")
    )

    if not is_path and not is_binary_file:
        raise TypeError(
            "PDF source must be a path or binary file object."
        )

    from pypdf import PdfReader

    reader = PdfReader(pdf_source)
    page_texts = []

    for page in reader.pages:
        page_text = page.extract_text()

        if page_text:
            page_texts.append(page_text)

    extracted_text = clean_resume_text(" ".join(page_texts))

    if not extracted_text:
        raise ValueError("PDF contains no extractable text.")

    return extracted_text
