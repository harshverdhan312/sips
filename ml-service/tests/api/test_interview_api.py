import io
import wave

import numpy as np
from fastapi import FastAPI
from fastapi.testclient import TestClient

import src.api.interview_routes as interview_routes
from src.api.interview_routes import router


app = FastAPI()
app.include_router(router)
client = TestClient(app)


def create_test_wav_bytes():
    samples = np.concatenate([
        np.full(500, 10000),
        np.zeros(400),
        np.full(500, 10000),
    ]).astype(np.int16)
    buffer = io.BytesIO()

    with wave.open(buffer, "wb") as audio:
        audio.setnchannels(1)
        audio.setsampwidth(2)
        audio.setframerate(1000)
        audio.writeframes(samples.tobytes())

    return buffer.getvalue()


def test_analyze_interview_returns_objective_features():
    response = client.post(
        "/interview/analyze",
        data={
            "transcript": "Um, I designed and tested the API.",
        },
        files={
            "audio": (
                "response.wav",
                create_test_wav_bytes(),
                "audio/wav",
            ),
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["speech"]["word_count"] == 7
    assert data["speech"]["filler_count"] == 1
    assert data["audio"]["frame_count"] == 1400
    assert data["pauses"]["pause_count"] == 1


def test_analyze_interview_rejects_unsupported_media_type():
    response = client.post(
        "/interview/analyze",
        data={
            "transcript": "A valid interview response.",
        },
        files={
            "audio": (
                "response.mp3",
                b"not-a-wav-file",
                "audio/mpeg",
            ),
        },
    )

    assert response.status_code == 415
    assert response.json()["detail"] == (
        "Only WAV audio files are supported."
    )


def test_analyze_interview_rejects_invalid_wav_data():
    response = client.post(
        "/interview/analyze",
        data={
            "transcript": "A valid interview response.",
        },
        files={
            "audio": (
                "response.wav",
                b"not-valid-wav-data",
                "audio/wav",
            ),
        },
    )

    assert response.status_code == 422
    assert "detail" in response.json()


def test_analyze_interview_rejects_oversized_audio(monkeypatch):
    monkeypatch.setattr(
        interview_routes,
        "MAX_AUDIO_BYTES",
        10,
    )

    response = client.post(
        "/interview/analyze",
        data={
            "transcript": "A valid interview response.",
        },
        files={
            "audio": (
                "response.wav",
                b"more-than-ten-bytes",
                "audio/wav",
            ),
        },
    )

    assert response.status_code == 413
    assert response.json()["detail"] == (
        "Audio file exceeds the 10 MB limit."
    )
