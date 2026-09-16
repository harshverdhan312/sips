import wave

import numpy as np
import pytest

from src.interview.audio_features import analyze_wav_audio


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


def test_analyze_wav_audio_returns_basic_metadata(tmp_path):
    audio_path = tmp_path / "response.wav"
    write_test_wav(
        audio_path,
        np.zeros(1000),
    )

    result = analyze_wav_audio(
        audio_path
    )

    assert result == {
        "duration_seconds": 1.0,
        "sample_rate_hz": 1000,
        "channel_count": 1,
        "sample_width_bytes": 2,
        "frame_count": 1000,
    }


def test_analyze_wav_audio_rejects_missing_file(tmp_path):
    missing_path = tmp_path / "missing.wav"

    with pytest.raises(
        FileNotFoundError,
        match="Audio file does not exist",
    ):
        analyze_wav_audio(
            missing_path
        )


def test_analyze_wav_audio_rejects_empty_audio(tmp_path):
    audio_path = tmp_path / "empty.wav"
    write_test_wav(
        audio_path,
        [],
    )

    with pytest.raises(
        ValueError,
        match="Audio file must contain at least one frame.",
    ):
        analyze_wav_audio(
            audio_path
        )
