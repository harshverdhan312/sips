from sklearn.pipeline import Pipeline
from xgboost import XGBClassifier

from src.data.preprocessing import build_preprocessor


def build_xgboost_model():
    """Create the initial XGBoost placement model."""
    pipeline = Pipeline(
        steps=[
            (
                "preprocessor",
                build_preprocessor(),
            ),
            (
                "classifier",
                XGBClassifier(
                    n_estimators=200,
                    max_depth=3,
                    learning_rate=0.05,
                    subsample=0.8,
                    colsample_bytree=0.8,
                    objective="binary:logistic",
                    eval_metric="logloss",
                    random_state=42,
                    n_jobs=-1,
                ),
            ),
        ]
    )

    return pipeline

def build_tuned_xgboost_model():
    """Create XGBoost using the selected training-CV hyperparameters."""
    pipeline = Pipeline(
        steps=[
            (
                "preprocessor",
                build_preprocessor(),
            ),
            (
                "classifier",
                XGBClassifier(
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
                ),
            ),
        ]
    )

    return pipeline

def build_weighted_xgboost_model(scale_pos_weight=0.8096):
    """Create tuned XGBoost with configurable positive-class weighting."""
    pipeline = Pipeline(
        steps=[
            (
                "preprocessor",
                build_preprocessor(),
            ),
            (
                "classifier",
                XGBClassifier(
                    n_estimators=200,
                    max_depth=3,
                    learning_rate=0.1,
                    subsample=0.9,
                    colsample_bytree=0.9,
                    min_child_weight=1,
                    reg_lambda=5,
                    scale_pos_weight=scale_pos_weight,
                    objective="binary:logistic",
                    eval_metric="logloss",
                    random_state=42,
                    n_jobs=-1,
                ),
            ),
        ]
    )

    return pipeline
