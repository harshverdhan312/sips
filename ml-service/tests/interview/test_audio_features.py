import wave

import numpy as np
import pytest

from src.interview.audio_features import (
    analyze_wav_audio,
    analyze_wav_pauses,
)


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


def test_analyze_wav_pauses_detects_internal_pause(tmp_path):
    audio_path = tmp_path / "internal-pause.wav"
    samples = np.concatenate([
        np.full(500, 10000),
        np.zeros(400),
        np.full(500, 10000),
    ])
    write_test_wav(
        audio_path,
        samples,
    )

    result = analyze_wav_pauses(
        audio_path,
        silence_threshold=0.01,
        minimum_pause_seconds=0.3,
        frame_duration_seconds=0.1,
    )

    assert result["pause_count"] == 1
    assert result["total_pause_seconds"] == pytest.approx(0.4)
    assert result["mean_pause_seconds"] == pytest.approx(0.4)
    assert result["max_pause_seconds"] == pytest.approx(0.4)
    assert result["pause_ratio"] == pytest.approx(0.4 / 1.4)


def test_analyze_wav_pauses_ignores_edge_silence(tmp_path):
    audio_path = tmp_path / "edge-silence.wav"
    samples = np.concatenate([
        np.zeros(300),
        np.full(500, 10000),
        np.zeros(300),
    ])
    write_test_wav(
        audio_path,
        samples,
    )

    result = analyze_wav_pauses(
        audio_path,
        silence_threshold=0.01,
        minimum_pause_seconds=0.3,
        frame_duration_seconds=0.1,
    )

    assert result["pause_count"] == 0
    assert result["total_pause_seconds"] == 0.0
    assert result["mean_pause_seconds"] == 0.0
    assert result["max_pause_seconds"] == 0.0
    assert result["pause_ratio"] == 0.0


def test_analyze_wav_pauses_ignores_short_internal_silence(tmp_path):
    audio_path = tmp_path / "short-pause.wav"
    samples = np.concatenate([
        np.full(500, 10000),
        np.zeros(200),
        np.full(500, 10000),
    ])
    write_test_wav(
        audio_path,
        samples,
    )

    result = analyze_wav_pauses(
        audio_path,
        silence_threshold=0.01,
        minimum_pause_seconds=0.3,
        frame_duration_seconds=0.1,
    )

    assert result["pause_count"] == 0
    assert result["total_pause_seconds"] == 0.0
    assert result["mean_pause_seconds"] == 0.0
    assert result["max_pause_seconds"] == 0.0
    assert result["pause_ratio"] == 0.0


def test_analyze_wav_pauses_returns_zero_for_silent_audio(tmp_path):
    audio_path = tmp_path / "silent.wav"
    write_test_wav(
        audio_path,
        np.zeros(1000),
    )

    result = analyze_wav_pauses(
        audio_path,
        silence_threshold=0.01,
        minimum_pause_seconds=0.3,
        frame_duration_seconds=0.1,
    )

    assert result["pause_count"] == 0
    assert result["total_pause_seconds"] == 0.0
    assert result["mean_pause_seconds"] == 0.0
    assert result["max_pause_seconds"] == 0.0
    assert result["pause_ratio"] == 0.0


def test_analyze_wav_pauses_rejects_non_positive_frame_duration(tmp_path):
    audio_path = tmp_path / "response.wav"
    write_test_wav(
        audio_path,
        np.full(1000, 10000),
    )

    with pytest.raises(
        ValueError,
        match="Frame duration must be greater than zero seconds.",
    ):
        analyze_wav_pauses(
            audio_path,
            frame_duration_seconds=0,
        )


def test_analyze_wav_pauses_rejects_non_positive_minimum_pause(tmp_path):
    audio_path = tmp_path / "response.wav"
    write_test_wav(
        audio_path,
        np.full(1000, 10000),
    )

    with pytest.raises(
        ValueError,
        match="Minimum pause must be greater than zero seconds.",
    ):
        analyze_wav_pauses(
            audio_path,
            minimum_pause_seconds=0,
        )


@pytest.mark.parametrize(
    "silence_threshold",
    [-0.1, 1.1],
)
def test_analyze_wav_pauses_rejects_out_of_range_threshold(
    tmp_path,
    silence_threshold,
):
    audio_path = tmp_path / "response.wav"
    write_test_wav(
        audio_path,
        np.full(1000, 10000),
    )

    with pytest.raises(
        ValueError,
        match="Silence threshold must be between 0 and 1.",
    ):
        analyze_wav_pauses(
            audio_path,
            silence_threshold=silence_threshold,
        )
