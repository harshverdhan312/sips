import importlib

from fastapi.testclient import TestClient

import src.api.main as api_main
from src.api.main import app
from src.placement import service as placement_service


client = TestClient(app)


VALID_STUDENT = {
    "Age": 22,
    "Internships": 1,
    "CGPA": 7,
    "Hostel": 0,
    "HistoryOfBacklogs": 0,
    "Stream": "Computer Science",
}


def test_health_endpoint():
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "service": "SIPS ML Service",
    }


def test_valid_placement_prediction():
    response = client.post(
        "/placement/predict",
        json=VALID_STUDENT,
    )

    assert response.status_code == 200

    data = response.json()

    assert 0.0 <= data["placement_probability"] <= 1.0
    assert data["decision_threshold"] == 0.5
    assert data["predicted_class"] in {0, 1}
    assert data["predicted_label"] in {
        "placed",
        "not_placed",
    }
    assert data["model_version"] == "1.0.0"


def test_invalid_cgpa_returns_422():
    payload = VALID_STUDENT.copy()
    payload["CGPA"] = 10

    response = client.post(
        "/placement/predict",
        json=payload,
    )

    assert response.status_code == 422


def test_invalid_stream_returns_422():
    payload = VALID_STUDENT.copy()
    payload["Stream"] = "Biotechnology"

    response = client.post(
        "/placement/predict",
        json=payload,
    )

    assert response.status_code == 422
    assert response.json()["detail"] == (
        "Invalid Stream: Biotechnology"
    )

def test_extra_field_returns_422():
    payload = VALID_STUDENT.copy()
    payload["UnexpectedField"] = "should fail"

    response = client.post(
        "/placement/predict",
        json=payload,
    )

    assert response.status_code == 422


def test_health_does_not_require_model_artifact(monkeypatch, tmp_path):
    monkeypatch.setattr(
        placement_service,
        "MODEL_PATH",
        tmp_path / "missing-model.joblib",
    )

    reloaded_main = importlib.reload(api_main)
    reloaded_client = TestClient(reloaded_main.app)

    response = reloaded_client.get("/health")

    assert response.status_code == 200


def test_missing_model_returns_503(monkeypatch, tmp_path):
    placement_service.load_placement_model.cache_clear()

    monkeypatch.setattr(
        placement_service,
        "MODEL_PATH",
        tmp_path / "missing-model.joblib",
    )

    response = client.post(
        "/placement/predict",
        json=VALID_STUDENT,
    )

    assert response.status_code == 503
    assert response.json()["detail"] == (
        "Placement model artifact is unavailable. "
        "Run the placement model training script before prediction."
    )
