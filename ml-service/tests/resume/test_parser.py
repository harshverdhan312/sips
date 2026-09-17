from io import BytesIO

import pytest

from src.resume.parser import clean_resume_text, extract_pdf_text


class FakePage:
    def __init__(self, text):
        self.text = text

    def extract_text(self):
        return self.text


class FakeReader:
    def __init__(self, pages):
        self.pages = pages


def test_clean_resume_text_collapses_whitespace():
    result = clean_resume_text("  Python\n\nMachine   Learning\tSQL  ")

    assert result == "Python Machine Learning SQL"


def test_clean_resume_text_rejects_non_string():
    with pytest.raises(TypeError, match="Resume text must be a string."):
        clean_resume_text(None)


def test_extract_pdf_text_combines_and_cleans_pages(monkeypatch):
    reader = FakeReader([
        FakePage("  Python\nMachine Learning  "),
        FakePage(None),
        FakePage("SQL\tGit"),
    ])
    monkeypatch.setattr("pypdf.PdfReader", lambda source: reader)

    result = extract_pdf_text(BytesIO(b"fake pdf"))

    assert result == "Python Machine Learning SQL Git"


def test_extract_pdf_text_rejects_pdf_without_extractable_text(monkeypatch):
    reader = FakeReader([FakePage(None), FakePage("   ")])
    monkeypatch.setattr("pypdf.PdfReader", lambda source: reader)

    with pytest.raises(
        ValueError,
        match="PDF contains no extractable text.",
    ):
        extract_pdf_text(BytesIO(b"fake pdf"))


def test_extract_pdf_text_rejects_invalid_source():
    with pytest.raises(
        TypeError,
        match="PDF source must be a path or binary file object.",
    ):
        extract_pdf_text(None)