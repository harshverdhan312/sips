import pandas as pd
import pytest
from sklearn.pipeline import Pipeline

from src.placement.model_comparison import (
    CANDIDATE_FEATURE_SETS,
    build_candidate_model,
    validate_candidate_features,
)


@pytest.fixture
def placement_rows():
    return pd.DataFrame(
        {
            "Age": [
                19, 20, 21, 22, 23, 24,
                19, 20, 21, 22, 23, 24,
            ],
            "Internships": [
                0, 1, 2, 0, 1, 3,
                0, 1, 2, 0, 2, 3,
            ],
            "CGPA": [
                5, 6, 7, 8, 7, 9,
                6, 7, 8, 6, 8, 9,
            ],
            "Hostel": [
                0, 1, 0, 1, 0, 1,
                1, 0, 1, 0, 1, 0,
            ],
            "HistoryOfBacklogs": [
                1, 0, 0, 0, 1, 0,
                1, 0, 0, 1, 0, 0,
            ],
            "Stream": [
                "Civil",
                "Computer Science",
                "Electrical",
                "Information Technology",
                "Mechanical",
                "Electronics And Communication",
                "Civil",
                "Computer Science",
                "Electrical",
                "Information Technology",
                "Mechanical",
                "Electronics And Communication",
            ],
            "PlacedOrNot": [
                0, 0, 0, 1, 0, 1,
                0, 0, 1, 0, 1, 1,
            ],
        }
    )


def test_reduced_candidate_excludes_weak_features():
    assert CANDIDATE_FEATURE_SETS["reduced"] == [
        "Age",
        "Internships",
        "CGPA",
        "Stream",
    ]


def test_validate_candidate_features_accepts_supported_features():
    features = [
        "Age",
        "Internships",
        "CGPA",
        "Stream",
    ]

    assert validate_candidate_features(features) == features


@pytest.mark.parametrize(
    ("features", "message"),
    [
        (
            [],
            "At least one placement feature is required.",
        ),
        (
            ["CGPA", "CGPA"],
            "Candidate placement features must not contain duplicates.",
        ),
        (
            ["CGPA", "AptitudeScore"],
            "Unsupported placement features",
        ),
    ],
)
def test_validate_candidate_features_rejects_invalid_lists(
    features,
    message,
):
    with pytest.raises(
        ValueError,
        match=message,
    ):
        validate_candidate_features(features)


@pytest.mark.parametrize(
    "model_name",
    [
        "logistic",
        "random_forest",
        "xgboost",
    ],
)
def test_candidate_models_fit_and_predict(
    placement_rows,
    model_name,
):
    features = CANDIDATE_FEATURE_SETS["reduced"]
    model = build_candidate_model(
        model_name,
        features,
    )

    assert isinstance(model, Pipeline)

    model.fit(
        placement_rows[features],
        placement_rows["PlacedOrNot"],
    )
    probabilities = model.predict_proba(
        placement_rows[features]
    )

    assert probabilities.shape == (
        len(placement_rows),
        2,
    )


def test_candidate_model_rejects_unknown_model():
    with pytest.raises(
        ValueError,
        match="Unsupported placement model",
    ):
        build_candidate_model(
            "unsupported",
            CANDIDATE_FEATURE_SETS["reduced"],
        )
