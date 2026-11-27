from pathlib import Path
import sys

import pandas as pd
import yaml
from sklearn.metrics import (
    accuracy_score,
    average_precision_score,
    brier_score_loss,
    confusion_matrix,
    f1_score,
    log_loss,
    precision_score,
    recall_score,
    roc_auc_score,
)

PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

from src.data.clean import load_raw_data, clean_data, validate_dataset
from src.data.split import split_train_val_test
from src.placement.calibration import expected_calibration_error
from src.placement.model_comparison import build_candidate_model
from src.placement.persistence import save_model


DATA_PATH = PROJECT_ROOT / "data" / "raw" / "collegePlace.csv"
MODEL_PATH = PROJECT_ROOT / "models" / "placement_model_v2_candidate.joblib"
REPORT_PATH = PROJECT_ROOT / "models" / "placement_model_v2_metrics.yaml"

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

THRESHOLD = 0.5


def calculate_metrics(actual, probabilities):
    predictions = (
        probabilities >= THRESHOLD
    ).astype(int)
    tn, fp, fn, tp = confusion_matrix(
        actual,
        predictions,
    ).ravel()

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
        "confusion_matrix": {
            "true_negative": int(tn),
            "false_positive": int(fp),
            "false_negative": int(fn),
            "true_positive": int(tp),
        },
    }


def subgroup_metrics(frame, predictions, column):
    results = {}

    for value in sorted(frame[column].unique()):
        mask = frame[column] == value
        actual = frame.loc[
            mask,
            "PlacedOrNot",
        ]
        predicted = predictions[mask.to_numpy()]

        results[str(value)] = {
            "rows": int(mask.sum()),
            "accuracy": round(
                float(
                    accuracy_score(
                        actual,
                        predicted,
                    )
                ),
                6,
            ),
            "precision": round(
                float(
                    precision_score(
                        actual,
                        predicted,
                        zero_division=0,
                    )
                ),
                6,
            ),
            "recall": round(
                float(
                    recall_score(
                        actual,
                        predicted,
                        zero_division=0,
                    )
                ),
                6,
            ),
            "f1": round(
                float(
                    f1_score(
                        actual,
                        predicted,
                        zero_division=0,
                    )
                ),
                6,
            ),
        }

    return results


def train_and_confirm_candidate():
    df = clean_data(load_raw_data(DATA_PATH))
    validate_dataset(df)

    train_df, validation_df, test_df = split_train_val_test(
        df,
        random_state=42,
    )
    development_df = pd.concat(
        [train_df, validation_df],
        ignore_index=True,
    )

    model = build_candidate_model(
        "xgboost",
        FEATURES,
    )
    model.set_params(**BEST_PARAMETERS)
    model.fit(
        development_df[FEATURES],
        development_df["PlacedOrNot"],
    )

    probabilities = model.predict_proba(
        test_df[FEATURES]
    )[:, 1]
    predictions = (
        probabilities >= THRESHOLD
    ).astype(int)

    age_audit = test_df.copy()
    age_audit["age_group"] = pd.cut(
        age_audit["Age"],
        bins=[18, 20, 22, 30],
        labels=["19-20", "21-22", "23-30"],
        include_lowest=True,
    ).astype(str)

    report = {
        "model": {
            "name": "SIPS Placement Predictor",
            "candidate_version": "2.0.0",
            "algorithm": "XGBoost",
            "calibration": "none",
            "decision_threshold": THRESHOLD,
        },
        "features": FEATURES,
        "excluded_features": [
            "Hostel",
            "Gender",
        ],
        "best_parameters": BEST_PARAMETERS,
        "development_rows": len(development_df),
        "historical_test_rows": len(test_df),
        "metrics": calculate_metrics(
            test_df["PlacedOrNot"],
            probabilities,
        ),
        "subgroup_audit": {
            "gender": subgroup_metrics(
                test_df,
                predictions,
                "Gender",
            ),
            "age_group": subgroup_metrics(
                age_audit,
                predictions,
                "age_group",
            ),
        },
        "limitations": [
            "The historical test partition was previously inspected during experimentation.",
            "Results are specific to the available proof-of-concept dataset.",
            "CGPA 8 and 9 have unusually deterministic outcomes in this dataset.",
            "Subgroup results may be unstable where subgroup sample sizes are small.",
            "Predictions are guidance and not placement guarantees.",
        ],
    }

    save_model(model, MODEL_PATH)

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
    print(f"Saved candidate model to: {MODEL_PATH}")
    print(f"Saved metrics to: {REPORT_PATH}")


if __name__ == "__main__":
    train_and_confirm_candidate()
