import numpy as np
from sklearn.metrics import (
    accuracy_score,
    f1_score,
    roc_auc_score,
    average_precision_score,
)
from sklearn.model_selection import StratifiedGroupKFold

from src.data.features import split_features_target_audit
from src.data.split import create_profile_groups
from src.placement.xgboost_model import build_xgboost_model


def cross_validate_xgboost(df, n_splits=5, random_state=42):
    """Evaluate XGBoost using profile-group-aware stratified cross-validation."""
    X, y, _ = split_features_target_audit(df)
    groups = create_profile_groups(df)

    cv = StratifiedGroupKFold(
        n_splits=n_splits,
        shuffle=True,
        random_state=random_state,
    )

    results = []

    for fold, (train_idx, val_idx) in enumerate(
        cv.split(X, y, groups),
        start=1,
    ):
        X_train = X.iloc[train_idx]
        y_train = y.iloc[train_idx]
        X_val = X.iloc[val_idx]
        y_val = y.iloc[val_idx]

        model = build_xgboost_model()
        model.fit(X_train, y_train)

        preds = model.predict(X_val)
        scores = model.predict_proba(X_val)[:, 1]

        results.append(
            {
                "fold": fold,
                "accuracy": accuracy_score(y_val, preds),
                "f1": f1_score(y_val, preds),
                "roc_auc": roc_auc_score(y_val, scores),
                "pr_auc": average_precision_score(y_val, scores),
            }
        )

    return results

from sklearn.model_selection import RandomizedSearchCV


def tune_xgboost(X, y, groups, random_state=42):
    """Tune XGBoost using profile-group-aware cross-validation."""
    model = build_xgboost_model()

    param_distributions = {
        "classifier__n_estimators": [100, 200, 300, 400],
        "classifier__max_depth": [2, 3, 4, 5],
        "classifier__learning_rate": [0.01, 0.03, 0.05, 0.1],
        "classifier__subsample": [0.7, 0.8, 0.9, 1.0],
        "classifier__colsample_bytree": [0.7, 0.8, 0.9, 1.0],
        "classifier__min_child_weight": [1, 3, 5],
        "classifier__reg_lambda": [1, 3, 5, 10],
    }

    cv = StratifiedGroupKFold(
        n_splits=5,
        shuffle=True,
        random_state=random_state,
    )

    search = RandomizedSearchCV(
        estimator=model,
        param_distributions=param_distributions,
        n_iter=30,
        scoring="roc_auc",
        cv=cv,
        random_state=random_state,
        n_jobs=-1,
        refit=True,
    )

    search.fit(X, y, groups=groups)

    return search
