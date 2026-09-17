import math
from numbers import Real
from pathlib import Path
import wave

import numpy as np


def analyze_wav_audio(
    audio_path,
) -> dict:
    """Read objective metadata from an uncompressed PCM WAV file."""
    path = Path(audio_path)

    if not path.is_file():
        raise FileNotFoundError(
            f"Audio file does not exist: {path}"
        )

    with wave.open(
        str(path),
        "rb",
    ) as audio:
        frame_count = audio.getnframes()
        sample_rate = audio.getframerate()
        channel_count = audio.getnchannels()
        sample_width = audio.getsampwidth()

    if frame_count == 0:
        raise ValueError(
            "Audio file must contain at least one frame."
        )

    duration_seconds = (
        frame_count / sample_rate
    )

    return {
        "duration_seconds": duration_seconds,
        "sample_rate_hz": sample_rate,
        "channel_count": channel_count,
        "sample_width_bytes": sample_width,
        "frame_count": frame_count,
    }


def analyze_wav_pauses(
    audio_path,
    silence_threshold=0.02,
    minimum_pause_seconds=0.3,
    frame_duration_seconds=0.02,
) -> dict:
    """Measure internal silent intervals in 16-bit PCM WAV audio."""
    if (
        isinstance(silence_threshold, bool)
        or not isinstance(silence_threshold, Real)
    ):
        raise TypeError(
            "Silence threshold must be a number."
        )

    threshold = float(silence_threshold)

    if not math.isfinite(threshold):
        raise ValueError(
            "Silence threshold must be finite."
        )

    if not 0 <= threshold <= 1:
        raise ValueError(
            "Silence threshold must be between 0 and 1."
        )

    if (
        isinstance(minimum_pause_seconds, bool)
        or not isinstance(minimum_pause_seconds, Real)
    ):
        raise TypeError(
            "Minimum pause must be a number of seconds."
        )

    minimum_pause = float(minimum_pause_seconds)

    if not math.isfinite(minimum_pause):
        raise ValueError(
            "Minimum pause must be finite."
        )

    if minimum_pause <= 0:
        raise ValueError(
            "Minimum pause must be greater than zero seconds."
        )

    if (
        isinstance(frame_duration_seconds, bool)
        or not isinstance(frame_duration_seconds, Real)
    ):
        raise TypeError(
            "Frame duration must be a number of seconds."
        )

    frame_duration = float(frame_duration_seconds)

    if not math.isfinite(frame_duration):
        raise ValueError(
            "Frame duration must be finite."
        )

    if frame_duration <= 0:
        raise ValueError(
            "Frame duration must be greater than zero seconds."
        )
    metadata = analyze_wav_audio(
        audio_path
    )

    if metadata["sample_width_bytes"] != 2:
        raise ValueError(
            "Pause analysis requires 16-bit PCM WAV audio."
        )

    path = Path(audio_path)

    with wave.open(
        str(path),
        "rb",
    ) as audio:
        raw_frames = audio.readframes(
            metadata["frame_count"]
        )

    samples = np.frombuffer(
        raw_frames,
        dtype="<i2",
    ).astype(np.float64)
    samples /= 32768.0
    samples = samples.reshape(
        -1,
        metadata["channel_count"],
    )

    frame_size = max(
        1,
        round(
            metadata["sample_rate_hz"]
            * frame_duration
        ),
    )

    silent_frames = []
    frame_lengths = []

    for start in range(
        0,
        metadata["frame_count"],
        frame_size,
    ):
        frame = samples[
            start:start + frame_size
        ]
        root_mean_square = float(
            np.sqrt(
                np.mean(
                    np.square(frame)
                )
            )
        )
        silent_frames.append(
            root_mean_square
            <= threshold
        )
        frame_lengths.append(
            len(frame)
            / metadata["sample_rate_hz"]
        )

    non_silent_indices = [
        index
        for index, is_silent
        in enumerate(silent_frames)
        if not is_silent
    ]

    if not non_silent_indices:
        pause_durations = []
    else:
        first_signal = non_silent_indices[0]
        last_signal = non_silent_indices[-1]
        pause_durations = []
        current_pause = 0.0

        for index in range(
            first_signal,
            last_signal + 1,
        ):
            if silent_frames[index]:
                current_pause += frame_lengths[index]
            elif current_pause:
                if (
                    current_pause
                    >= minimum_pause
                ):
                    pause_durations.append(
                        current_pause
                    )
                current_pause = 0.0

    pause_count = len(
        pause_durations
    )
    total_pause_seconds = sum(
        pause_durations
    )

    return {
        "pause_count": pause_count,
        "total_pause_seconds": total_pause_seconds,
        "mean_pause_seconds": (
            total_pause_seconds / pause_count
            if pause_count
            else 0.0
        ),
        "max_pause_seconds": (
            max(pause_durations)
            if pause_durations
            else 0.0
        ),
        "pause_ratio": (
            total_pause_seconds
            / metadata["duration_seconds"]
        ),
    }
