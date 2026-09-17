import wave

import numpy as np
import pytest

from src.interview.service import analyze_interview_response


def write_test_wav(
    path,
    samples,
    sample_rate=1000,
):
    samples = np.asarray(
        samples,
        dtype=np.int16,
    )

    with wave.open(str(path), "wb") as audio:
        audio.setnchannels(1)
        audio.setsampwidth(2)
        audio.setframerate(sample_rate)
        audio.writeframes(samples.tobytes())


def test_analyze_interview_response_combines_objective_features(tmp_path):
    audio_path = tmp_path / "response.wav"
    samples = np.concatenate([
        np.full(500, 10000),
        np.zeros(400),
        np.full(500, 10000),
    ])
    write_test_wav(
        audio_path,
        samples,
    )

    result = analyze_interview_response(
        text="Um, I designed and tested the API.",
        audio_path=audio_path,
        silence_threshold=0.01,
        minimum_pause_seconds=0.3,
        frame_duration_seconds=0.1,
    )

    assert result["speech"]["word_count"] == 7
    assert result["speech"]["filler_count"] == 1
    assert result["speech"]["duration_seconds"] == pytest.approx(1.4)
    assert result["speech"]["words_per_minute"] == pytest.approx(
        7 / 1.4 * 60
    )
    assert result["audio"]["sample_rate_hz"] == 1000
    assert result["audio"]["frame_count"] == 1400
    assert result["pauses"]["pause_count"] == 1
    assert result["pauses"]["total_pause_seconds"] == pytest.approx(0.4)
