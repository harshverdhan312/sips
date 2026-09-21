from fastapi.testclient import TestClient

from src.api.main import app


client = TestClient(app)


def test_calculate_employability_index_returns_breakdown():
    response = client.post(
        "/employability/calculate",
        json={
            "component_scores": {
                "placement": 80,
                "resume": 70,
                "interview": 60,
            },
            "weights": {
                "placement": 0.40,
                "resume": 0.35,
                "interview": 0.25,
            },
        },
    )

    assert response.status_code == 200
    assert response.json() == {
        "employability_index": 71.5,
        "component_contributions": {
            "placement": 32.0,
            "resume": 24.5,
            "interview": 15.0,
        },
        "weights": {
            "placement": 0.40,
            "resume": 0.35,
            "interview": 0.25,
        },
    }


def test_calculate_employability_index_rejects_mismatched_components():
    response = client.post(
        "/employability/calculate",
        json={
            "component_scores": {
                "placement": 80,
                "resume": 70,
            },
            "weights": {
                "placement": 0.60,
                "interview": 0.40,
            },
        },
    )

    assert response.status_code == 422
    assert response.json()["detail"] == (
        "Component scores and weights must use the same keys."
    )


def test_calculate_employability_index_rejects_invalid_weight_total():
    response = client.post(
        "/employability/calculate",
        json={
            "component_scores": {
                "placement": 80,
                "resume": 70,
            },
            "weights": {
                "placement": 0.60,
                "resume": 0.30,
            },
        },
    )

    assert response.status_code == 422
    assert response.json()["detail"] == (
        "Weights must sum to 1."
    )


def test_calculate_employability_index_rejects_extra_fields():
    response = client.post(
        "/employability/calculate",
        json={
            "component_scores": {
                "placement": 80,
            },
            "weights": {
                "placement": 1.0,
            },
            "unexpected": True,
        },
    )

    assert response.status_code == 422
