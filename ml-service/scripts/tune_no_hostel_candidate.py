from pathlib import Path
import sys

import yaml
from sklearn.model_selection import RandomizedSearchCV, StratifiedGroupKFold

PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

from src.data.clean import load_raw_data, clean_data, validate_dataset
from src.data.features import split_features_target_audit
from src.data.split import split_train_val_test, create_profile_groups
from src.placement.model_comparison import build_candidate_model


DATA_PATH = PROJECT_ROOT / "data" / "raw" / "collegePlace.csv"
REPORT_PATH = PROJECT_ROOT / "models" / "placement_no_hostel_tuning.yaml"

FEATURES = [
    "Age",
    "Internships",
    "CGPA",
    "HistoryOfBacklogs",
    "Stream",
]


def tune_no_hostel_candidate():
    df = clean_data(load_raw_data(DATA_PATH))
    validate_dataset(df)

    train_df, validation_df, test_df = split_train_val_test(
        df,
        random_state=42,
    )

    X_train = train_df[FEATURES]
    y_train = train_df["PlacedOrNot"]
    groups = create_profile_groups(
        train_df,
        features=FEATURES,
    )

    model = build_candidate_model(
        "xgboost",
        FEATURES,
    )

    parameters = {
        "classifier__n_estimators": [100, 200, 300, 400],
        "classifier__max_depth": [2, 3, 4, 5],
        "classifier__learning_rate": [0.03, 0.05, 0.1],
        "classifier__subsample": [0.7, 0.8, 0.9, 1.0],
        "classifier__colsample_bytree": [0.8, 0.9, 1.0],
        "classifier__min_child_weight": [1, 3, 5],
        "classifier__reg_alpha": [0.0, 0.5, 1.0],
        "classifier__reg_lambda": [1, 3, 5, 10],
    }

    cv = StratifiedGroupKFold(
        n_splits=5,
        shuffle=True,
        random_state=42,
    )

    search = RandomizedSearchCV(
        estimator=model,
        param_distributions=parameters,
        n_iter=40,
        scoring="roc_auc",
        cv=cv,
        random_state=42,
        n_jobs=-1,
        refit=True,
        return_train_score=True,
    )

    search.fit(
        X_train,
        y_train,
        groups=groups,
    )

    report = {
        "purpose": "Tune the five-feature placement candidate without Hostel",
        "selection_metric": "mean training group-CV ROC-AUC",
        "features": FEATURES,
        "grouping_features": FEATURES,
        "random_state": 42,
        "training_rows": len(train_df),
        "unused_validation_rows": len(validation_df),
        "unused_historical_test_rows": len(test_df),
        "best_cv_roc_auc": round(float(search.best_score_), 6),
        "best_train_roc_auc": round(
            float(search.cv_results_["mean_train_score"][search.best_index_]),
            6,
        ),
        "best_parameters": {
            key: (
                value.item()
                if hasattr(value, "item")
                else value
            )
            for key, value in search.best_params_.items()
        },
        "notes": [
            "Validation and historical test outcomes were not used during tuning.",
            "Groups were formed from the five actual candidate input features.",
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
    tune_no_hostel_candidate()
