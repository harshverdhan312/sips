import pytest

from src.interview.speech_features import analyze_spoken_response


def test_analyze_spoken_response_adds_speaking_rate():
    result = analyze_spoken_response(
        "I designed and tested the service.",
        duration_seconds=30,
    )

    assert result["word_count"] == 6
    assert result["duration_seconds"] == 30.0
    assert result["words_per_minute"] == 12.0


@pytest.mark.parametrize(
    "duration",
    [0, -1],
)
def test_analyze_spoken_response_rejects_non_positive_duration(
    duration,
):
    with pytest.raises(
        ValueError,
        match="Duration must be greater than zero seconds.",
    ):
        analyze_spoken_response(
            "A valid response.",
            duration_seconds=duration,
        )


@pytest.mark.parametrize(
    "duration",
    [None, "30", True],
)
def test_analyze_spoken_response_rejects_invalid_duration_type(
    duration,
):
    with pytest.raises(
        TypeError,
        match="Duration must be a number of seconds.",
    ):
        analyze_spoken_response(
            "A valid response.",
            duration_seconds=duration,
        )


@pytest.mark.parametrize(
    "duration",
    [float("nan"), float("inf"), float("-inf")],
)
def test_analyze_spoken_response_rejects_non_finite_duration(
    duration,
):
    with pytest.raises(
        ValueError,
        match="Duration must be finite.",
    ):
        analyze_spoken_response(
            "A valid response.",
            duration_seconds=duration,
        )
