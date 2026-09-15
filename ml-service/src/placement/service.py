from pathlib import Path

import pandas as pd
import yaml

from src.placement.persistence import load_model


MODEL_PATH = Path("models/placement_model.joblib")
METADATA_PATH = Path("models/placement_model_metadata.yaml")

VALID_STREAMS = {
    "Civil",
    "Computer Science",
    "Electrical",
    "Electronics And Communication",
    "Information Technology",
    "Mechanical",
}


def load_metadata():
    """Load placement model metadata."""
    with open(
        METADATA_PATH,
        "r",
        encoding="utf-8",
    ) as file:
        return yaml.safe_load(file)


def load_placement_model():
    """Load the persisted placement model."""
    return load_model(MODEL_PATH)


METADATA = load_metadata()


def validate_student_input(student_data):
    """Validate placement prediction input before inference."""
    required_features = METADATA[
        "features"
    ]["model_features"]

    missing = [
        feature
        for feature in required_features
        if feature not in student_data
    ]

    extra = [
        feature
        for feature in student_data
        if feature not in required_features
    ]

    if missing:
        raise ValueError(
            f"Missing required features: {missing}"
        )

    if extra:
        raise ValueError(
            f"Unexpected features: {extra}"
        )

    if not 19 <= student_data["Age"] <= 30:
        raise ValueError(
            "Age must be between 19 and 30."
        )

    if not 0 <= student_data["Internships"] <= 3:
        raise ValueError(
            "Internships must be between 0 and 3."
        )

    if not 5 <= student_data["CGPA"] <= 9:
        raise ValueError(
            "CGPA must be between 5 and 9."
        )

    if student_data["Hostel"] not in {0, 1}:
        raise ValueError(
            "Hostel must be 0 or 1."
        )

    if student_data["HistoryOfBacklogs"] not in {0, 1}:
        raise ValueError(
            "HistoryOfBacklogs must be 0 or 1."
        )

    if student_data["Stream"] not in VALID_STREAMS:
        raise ValueError(
            f"Invalid Stream: {student_data['Stream']}"
        )


def predict_placement(student_data):
    """Generate calibrated placement prediction for one student."""
    validate_student_input(student_data)

    feature_order = METADATA[
        "features"
    ]["model_features"]

    input_df = pd.DataFrame(
        [student_data],
        columns=feature_order,
    )

    model = load_placement_model()

    probability = float(
        model.predict_proba(input_df)[0, 1]
    )

    threshold = float(
        METADATA["prediction"][
            "decision_threshold"
        ]
    )

    predicted_class = int(
        probability >= threshold
    )

    predicted_label = (
        METADATA["prediction"]["positive_label"]
        if predicted_class == 1
        else METADATA["prediction"]["negative_label"]
    )

    return {
        "placement_probability": probability,
        "decision_threshold": threshold,
        "predicted_class": predicted_class,
        "predicted_label": predicted_label,
        "model_version": METADATA[
            "model"
        ]["version"],
    }
