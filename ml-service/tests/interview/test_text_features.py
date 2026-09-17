import pytest

from src.interview.text_features import analyze_text_response


def test_returns_basic_text_features():
    result = analyze_text_response(
        "Um, I built a Python API and, uh, tested it."
    )

    assert result["word_count"] == 10
    assert result["sentence_count"] == 1
    assert result["unique_word_count"] == 10
    assert result["lexical_diversity"] == 1.0
    assert result["filler_count"] == 2
    assert result["filler_rate"] == 0.2


def test_rejects_empty_text():
    with pytest.raises(
        ValueError,
        match="Interview response must not be empty.",
    ):
        analyze_text_response("   ")


def test_rejects_non_string_text():
    with pytest.raises(
        TypeError,
        match="Interview response must be a string.",
    ):
        analyze_text_response(None)


def test_rejects_text_without_words():
    with pytest.raises(
        ValueError,
        match="Interview response must contain at least one word.",
    ):
        analyze_text_response("...")


def test_counts_repeated_words_case_insensitively():
    result = analyze_text_response(
        "Python python testing."
    )

    assert result["word_count"] == 3
    assert result["unique_word_count"] == 2
    assert result["lexical_diversity"] == pytest.approx(2 / 3)
