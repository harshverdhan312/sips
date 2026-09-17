import re


WORD_PATTERN = re.compile(
    r"[A-Za-z]+(?:'[A-Za-z]+)?"
)
SENTENCE_END_PATTERN = re.compile(
    r"[.!?]+"
)
FILLER_WORDS = frozenset({
    "um",
    "uh",
    "erm",
    "hmm",
})


def analyze_text_response(text: str) -> dict:
    """Extract transparent text features from an interview response."""
    if not isinstance(text, str):
        raise TypeError(
            "Interview response must be a string."
        )

    cleaned_text = " ".join(
        text.strip().split()
    )

    if not cleaned_text:
        raise ValueError(
            "Interview response must not be empty."
        )

    words = [
        word.lower()
        for word in WORD_PATTERN.findall(
            cleaned_text
        )
    ]

    if not words:
        raise ValueError(
            "Interview response must contain at least one word."
        )

    word_count = len(words)
    unique_word_count = len(set(words))
    filler_count = sum(
        word in FILLER_WORDS
        for word in words
    )
    sentence_count = (
        len(
            SENTENCE_END_PATTERN.findall(
                cleaned_text
            )
        )
        or 1
    )

    return {
        "word_count": word_count,
        "sentence_count": sentence_count,
        "unique_word_count": unique_word_count,
        "lexical_diversity": (
            unique_word_count / word_count
        ),
        "filler_count": filler_count,
        "filler_rate": (
            filler_count / word_count
        ),
    }
