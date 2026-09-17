import math
from numbers import Real

from src.interview.text_features import analyze_text_response


def analyze_spoken_response(
    text: str,
    duration_seconds: float,
) -> dict:
    """Combine transcript features with measured response duration."""
    if (
        isinstance(duration_seconds, bool)
        or not isinstance(duration_seconds, Real)
    ):
        raise TypeError(
            "Duration must be a number of seconds."
        )

    duration = float(duration_seconds)

    if not math.isfinite(duration):
        raise ValueError(
            "Duration must be finite."
        )

    if duration <= 0:
        raise ValueError(
            "Duration must be greater than zero seconds."
        )

    text_features = analyze_text_response(
        text
    )
    words_per_minute = (
        text_features["word_count"]
        / duration
        * 60
    )

    return {
        **text_features,
        "duration_seconds": duration,
        "words_per_minute": words_per_minute,
    }
