from collections.abc import Sequence

import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    average_precision_score,
    brier_score_loss,
    f1_score,
    roc_auc_score,
)
from sklearn.model_selection import StratifiedGroupKFold
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from xgboost import XGBClassifier

from src.data.features import MODEL_FEATURES
from src.data.split import create_profile_groups


CANDIDATE_FEATURE_SETS = {
    "full": [
        "Age",
        "Internships",
        "CGPA",
        "Hostel",
        "HistoryOfBacklogs",
        "Stream",
    ],
    "no_hostel": [
        "Age",
        "Internships",
        "CGPA",
        "HistoryOfBacklogs",
        "Stream",
    ],
    "no_backlogs": [
        "Age",
        "Internships",
        "CGPA",
        "Hostel",
        "Stream",
    ],
    "reduced": [
        "Age",
        "Internships",
        "CGPA",
        "Stream",
    ],
    "no_age": [
        "Internships",
        "CGPA",
        "Hostel",
        "HistoryOfBacklogs",
        "Stream",
    ],
    "minimal": [
        "Internships",
        "CGPA",
    ],
}

SUPPORTED_MODELS = {
    "logistic",
    "random_forest",
    "xgboost",
}


def validate_candidate_features(
    features: Sequence[str],
) -> list[str]:
    """Validate and normalize a candidate placement feature list."""
    normalized = list(features)

    if not normalized:
        raise ValueError(
            "At least one placement feature is required."
        )

    if len(normalized) != len(set(normalized)):
        raise ValueError(
            "Candidate placement features must not contain duplicates."
        )

    unsupported = sorted(
        set(normalized) - set(MODEL_FEATURES)
    )

    if unsupported:
        raise ValueError(
            f"Unsupported placement features: {unsupported}"
        )

    return normalized


def build_candidate_preprocessor(
    features: Sequence[str],
    scale_numeric: bool = False,
) -> ColumnTransformer:
    """Build preprocessing for a selected placement feature set."""
    selected = validate_candidate_features(features)

    numeric = [
        feature
        for feature in [
            "Age",
            "Internships",
            "CGPA",
        ]
        if feature in selected
    ]
    binary = [
        feature
        for feature in [
            "Hostel",
            "HistoryOfBacklogs",
        ]
        if feature in selected
    ]
    categorical = [
        feature
        for feature in ["Stream"]
        if feature in selected
    ]

    transformers = []

    if numeric:
        numeric_transformer = (
            StandardScaler()
            if scale_numeric
            else "passthrough"
        )
        transformers.append(
            (
                "numeric",
                numeric_transformer,
                numeric,
            )
        )

    if binary:
        transformers.append(
            (
                "binary",
                "passthrough",
                binary,
            )
        )

    if categorical:
        transformers.append(
            (
                "categorical",
                OneHotEncoder(
                    handle_unknown="ignore"
                ),
                categorical,
            )
        )

    return ColumnTransformer(
        transformers=transformers,
        remainder="drop",
    )


def build_candidate_model(
    model_name: str,
    features: Sequence[str],
) -> Pipeline:
    """Build a model pipeline for placement comparison."""
    if model_name not in SUPPORTED_MODELS:
        raise ValueError(
            f"Unsupported placement model: {model_name}"
        )

    scale_numeric = model_name == "logistic"
    preprocessor = build_candidate_preprocessor(
        features,
        scale_numeric=scale_numeric,
    )

    if model_name == "logistic":
        classifier = LogisticRegression(
            max_iter=1000,
            random_state=42,
        )
    elif model_name == "random_forest":
        classifier = RandomForestClassifier(
            n_estimators=300,
            min_samples_leaf=2,
            random_state=42,
            n_jobs=-1,
        )
    else:
        classifier = XGBClassifier(
            n_estimators=200,
            max_depth=3,
            learning_rate=0.1,
            subsample=0.9,
            colsample_bytree=0.9,
            min_child_weight=1,
            reg_lambda=5,
            objective="binary:logistic",
            eval_metric="logloss",
            random_state=42,
            n_jobs=-1,
        )

    return Pipeline(
        steps=[
            ("preprocessor", preprocessor),
            ("classifier", classifier),
        ]
    )


def evaluate_candidate_cv(
    df: pd.DataFrame,
    model_name: str,
    features: Sequence[str],
    n_splits: int = 5,
    random_state: int = 42,
) -> dict:
    """Evaluate one candidate without using the held-out test set."""
    selected = validate_candidate_features(features)
    X = df[selected]
    y = df["PlacedOrNot"]
    groups = create_profile_groups(df, features=selected)

    cv = StratifiedGroupKFold(
        n_splits=n_splits,
        shuffle=True,
        random_state=random_state,
    )

    fold_rows = []

    for train_index, validation_index in cv.split(
        X,
        y,
        groups,
    ):
        model = build_candidate_model(
            model_name,
            selected,
        )
        model.fit(
            X.iloc[train_index],
            y.iloc[train_index],
        )

        probabilities = model.predict_proba(
            X.iloc[validation_index]
        )[:, 1]
        predictions = (
            probabilities >= 0.5
        ).astype(int)
        actual = y.iloc[validation_index]

        fold_rows.append(
            {
                "accuracy": accuracy_score(
                    actual,
                    predictions,
                ),
                "f1": f1_score(
                    actual,
                    predictions,
                ),
                "roc_auc": roc_auc_score(
                    actual,
                    probabilities,
                ),
                "pr_auc": average_precision_score(
                    actual,
                    probabilities,
                ),
                "brier_score": brier_score_loss(
                    actual,
                    probabilities,
                ),
            }
        )

    fold_metrics = pd.DataFrame(fold_rows)

    result = {
        "model": model_name,
        "features": selected,
        "feature_count": len(selected),
        "rows": len(df),
    }

    for metric in [
        "accuracy",
        "f1",
        "roc_auc",
        "pr_auc",
        "brier_score",
    ]:
        result[f"{metric}_mean"] = float(
            fold_metrics[metric].mean()
        )
        result[f"{metric}_std"] = float(
            fold_metrics[metric].std()
        )

    return result
