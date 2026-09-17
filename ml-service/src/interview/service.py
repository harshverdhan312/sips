from src.interview.audio_features import (
    analyze_wav_audio,
    analyze_wav_pauses,
)
from src.interview.speech_features import analyze_spoken_response


def analyze_interview_response(
    text: str,
    audio_path,
    silence_threshold=0.02,
    minimum_pause_seconds=0.3,
    frame_duration_seconds=0.02,
) -> dict:
    """Combine objective transcript, timing, and WAV audio features."""
    audio_features = analyze_wav_audio(
        audio_path
    )
    speech_features = analyze_spoken_response(
        text=text,
        duration_seconds=audio_features[
            "duration_seconds"
        ],
    )
    pause_features = analyze_wav_pauses(
        audio_path=audio_path,
        silence_threshold=silence_threshold,
        minimum_pause_seconds=minimum_pause_seconds,
        frame_duration_seconds=frame_duration_seconds,
    )

    return {
        "speech": speech_features,
        "audio": audio_features,
        "pauses": pause_features,
    }
