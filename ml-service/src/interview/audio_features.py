from pathlib import Path
import wave


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
