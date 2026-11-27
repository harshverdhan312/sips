from pathlib import Path
import sys

import numpy as np
import yaml
from sklearn.calibration import CalibratedClassifierCV
from sklearn.metrics import (
    accuracy_score,
    average_precision_score,
    brier_score_loss,
    f1_score,
    log_loss,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import StratifiedGroupKFold

PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

from src.data.clean import load_raw_data, clean_data, validate_dataset
from src.data.split import split_train_val_test, create_profile_groups
from src.placement.calibration import expected_calibration_error
from src.placement.model_comparison import build_candidate_model
from src.placement.persistence import load_model


DATA_PATH = PROJECT_ROOT / "data" / "raw" / "collegePlace.csv"
CURRENT_MODEL_PATH = PROJECT_ROOT / "models" / "placement_model.joblib"
REPORT_PATH = PROJECT_ROOT / "models" / "placement_no_hostel_validation.yaml"

FEATURES = [
    "Age",
    "Internships",
    "CGPA",
    "HistoryOfBacklogs",
    "Stream",
]

BEST_PARAMETERS = {
    "classifier__subsample": 0.7,
    "classifier__reg_lambda": 5,
    "classifier__reg_alpha": 0.0,
    "classifier__n_estimators": 200,
    "classifier__min_child_weight": 1,
    "classifier__max_depth": 5,
    "classifier__learning_rate": 0.05,
    "classifier__colsample_bytree": 1.0,
}


def build_tuned_candidate():
    model = build_candidate_model(
        "xgboost",
        FEATURES,
    )
    model.set_params(**BEST_PARAMETERS)
    return model


def calculate_metrics(actual, probabilities):
    predictions = (
        probabilities >= 0.5
    ).astype(int)

    return {
        "accuracy": round(
            float(accuracy_score(actual, predictions)),
            6,
        ),
        "precision": round(
            float(
                precision_score(
                    actual,
                    predictions,
                    zero_division=0,
                )
            ),
            6,
        ),
        "recall": round(
            float(recall_score(actual, predictions)),
            6,
        ),
        "f1": round(
            float(f1_score(actual, predictions)),
            6,
        ),
        "roc_auc": round(
            float(roc_auc_score(actual, probabilities)),
            6,
        ),
        "pr_auc": round(
            float(
                average_precision_score(
                    actual,
                    probabilities,
                )
            ),
            6,
        ),
        "brier_score": round(
            float(
                brier_score_loss(
                    actual,
                    probabilities,
                )
            ),
            6,
        ),
        "log_loss": round(
            float(log_loss(actual, probabilities)),
            6,
        ),
        "ece": round(
            expected_calibration_error(
                actual,
                probabilities,
            ),
            6,
        ),
    }


def evaluate_validation_candidates():
    df = clean_data(load_raw_data(DATA_PATH))
    validate_dataset(df)

    train_df, validation_df, test_df = split_train_val_test(
        df,
        random_state=42,
    )

    X_train = train_df[FEATURES]
    y_train = train_df["PlacedOrNot"]
    X_validation = validation_df[FEATURES]
    y_validation = validation_df["PlacedOrNot"]

    groups = create_profile_groups(
        train_df,
        features=FEATURES,
    )
    group_cv = StratifiedGroupKFold(
        n_splits=5,
        shuffle=True,
        random_state=42,
    )
    cv_splits = list(
        group_cv.split(
            X_train,
            y_train,
            groups,
        )
    )

    results = {}

    uncalibrated = build_tuned_candidate()
    uncalibrated.fit(X_train, y_train)
    uncalibrated_probabilities = uncalibrated.predict_proba(
        X_validation
    )[:, 1]
    results["no_hostel_uncalibrated"] = calculate_metrics(
        y_validation,
        uncalibrated_probabilities,
    )

    for method in ["isotonic", "sigmoid"]:
        calibrated = CalibratedClassifierCV(
            estimator=build_tuned_candidate(),
            method=method,
            cv=cv_splits,
        )
        calibrated.fit(X_train, y_train)
        probabilities = calibrated.predict_proba(
            X_validation
        )[:, 1]
        results[
            f"no_hostel_{method}"
        ] = calculate_metrics(
            y_validation,
            probabilities,
        )

    current_model = load_model(CURRENT_MODEL_PATH)
    current_features = [
        "Age",
        "Internships",
        "CGPA",
        "Hostel",
        "HistoryOfBacklogs",
        "Stream",
    ]
    current_probabilities = current_model.predict_proba(
        validation_df[current_features]
    )[:, 1]
    results["current_production"] = calculate_metrics(
        y_validation,
        current_probabilities,
    )

    report = {
        "purpose": "Select probability calibration using reserved validation data",
        "features": FEATURES,
        "decision_threshold": 0.5,
        "training_rows": len(train_df),
        "validation_rows": len(validation_df),
        "unused_historical_test_rows": len(test_df),
        "best_parameters": BEST_PARAMETERS,
        "results": results,
        "notes": [
            "The historical test set was not used in this comparison.",
            "Lower Brier score, log loss, and ECE indicate better probability quality.",
            "The decision threshold remained fixed at 0.50 for this comparison.",
        ],
    }

    with open(
        REPORT_PATH,
        "w",
        encoding="utf-8",
    ) as file:
        yaml.safe_dump(
            report,
            file,
            sort_keys=False,
        )

    print(yaml.safe_dump(report, sort_keys=False))
    print(f"Saved report to: {REPORT_PATH}")


if __name__ == "__main__":
    evaluate_validation_candidates()
