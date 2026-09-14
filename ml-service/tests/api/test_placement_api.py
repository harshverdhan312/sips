from fastapi.testclient import TestClient

from src.api.main import app


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