import pandas as pd
import pytest
from sklearn.pipeline import Pipeline

from src.data.split import create_profile_groups

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


def test_profile_groups_use_selected_features():
    rows = pd.DataFrame(
        {
            "Age": [21, 21],
            "Internships": [1, 1],
            "CGPA": [7, 7],
            "Hostel": [0, 1],
            "HistoryOfBacklogs": [0, 0],
            "Stream": [
                "Computer Science",
                "Computer Science",
            ],
        }
    )

    groups_without_hostel = create_profile_groups(
        rows,
        features=[
            "Age",
            "Internships",
            "CGPA",
            "HistoryOfBacklogs",
            "Stream",
        ],
    )
    groups_with_hostel = create_profile_groups(
        rows,
        features=[
            "Age",
            "Internships",
            "CGPA",
            "Hostel",
            "HistoryOfBacklogs",
            "Stream",
        ],
    )

    assert groups_without_hostel.nunique() == 1
    assert groups_with_hostel.nunique() == 2


def test_profile_groups_reject_empty_feature_list(
    placement_rows,
):
    with pytest.raises(
        ValueError,
        match="At least one grouping feature is required",
    ):
        create_profile_groups(
            placement_rows,
            features=[],
        )


def test_profile_groups_reject_missing_columns(
    placement_rows,
):
    with pytest.raises(
        ValueError,
        match="Missing grouping features",
    ):
        create_profile_groups(
            placement_rows,
            features=["CGPA", "UnknownFeature"],
        )
