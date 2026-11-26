from pathlib import Path
import sys

import pandas as pd
import yaml

PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

from src.data.clean import (
    clean_data,
    load_raw_data,
    validate_dataset,
)
from src.data.split import split_train_val_test
from src.placement.model_comparison import (
    CANDIDATE_FEATURE_SETS,
    evaluate_candidate_cv,
)


DATA_PATH = (
    PROJECT_ROOT
    / "data"
    / "raw"
    / "collegePlace.csv"
)
REPORT_PATH = (
    PROJECT_ROOT
    / "models"
    / "placement_candidate_cv.yaml"
)

MODEL_NAMES = [
    "logistic",
    "random_forest",
    "xgboost",
]


def round_result(result: dict) -> dict:
    """Round metric values for a readable, versioned report."""
    rounded = {}

    for key, value in result.items():
        if isinstance(value, float):
            rounded[key] = round(value, 6)
        else:
            rounded[key] = value

    return rounded


def run_candidate_comparison() -> dict:
    """Compare placement candidates without using the test set."""
    df = clean_data(
        load_raw_data(DATA_PATH)
    )
    validate_dataset(df)

    train_df, validation_df, test_df = (
        split_train_val_test(
            df,
            random_state=42,
        )
    )

    development_df = pd.concat(
        [
            train_df,
            validation_df,
        ],
        ignore_index=True,
    )

    datasets = {
        "raw": development_df,
        "deduplicated_sensitivity": (
            development_df
            .drop_duplicates()
            .reset_index(drop=True)
        ),
    }

    results = []

    for dataset_name, candidate_df in datasets.items():
        for feature_set_name, features in (
            CANDIDATE_FEATURE_SETS.items()
        ):
            for model_name in MODEL_NAMES:
                result = evaluate_candidate_cv(
                    df=candidate_df,
                    model_name=model_name,
                    features=features,
                    n_splits=5,
                    random_state=42,
                )
                result["dataset"] = dataset_name
                result["feature_set"] = (
                    feature_set_name
                )
                results.append(
                    round_result(result)
                )

    results.sort(
        key=lambda row: (
            row["dataset"],
            -row["roc_auc_mean"],
            row["brier_score_mean"],
        )
    )

    report = {
        "purpose": (
            "Development-only placement model and "
            "feature comparison"
        ),
        "selection_metric": "mean group-CV ROC-AUC",
        "random_state": 42,
        "cross_validation": (
            "5-fold StratifiedGroupKFold using "
            "full production-feature profiles"
        ),
        "dataset": {
            "total_rows": len(df),
            "training_rows": len(train_df),
            "validation_rows": len(validation_df),
            "development_rows": len(
                development_df
            ),
            "deduplicated_development_rows": len(
                datasets[
                    "deduplicated_sensitivity"
                ]
            ),
            "untouched_test_rows": len(test_df),
        },
        "important_notes": [
            (
                "The held-out test set was not used "
                "for candidate selection."
            ),
            (
                "Deduplication is reported only as "
                "a sensitivity analysis because the "
                "dataset has no student identifier."
            ),
            (
                "Predictive association does not "
                "establish causation or fairness."
            ),
        ],
        "results": results,
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

    return report


if __name__ == "__main__":
    comparison_report = (
        run_candidate_comparison()
    )

    table = pd.DataFrame(
        comparison_report["results"]
    )[
        [
            "dataset",
            "feature_set",
            "model",
            "feature_count",
            "accuracy_mean",
            "f1_mean",
            "roc_auc_mean",
            "pr_auc_mean",
            "brier_score_mean",
        ]
    ]

    print(
        table.to_string(
            index=False
        )
    )
    print()
    print(
        f"Saved report to: {REPORT_PATH}"
    )
