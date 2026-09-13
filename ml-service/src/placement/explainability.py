import numpy as np
import pandas as pd
import shap

from src.data.features import split_features_target_audit
from src.placement.xgboost_model import build_tuned_xgboost_model


def fit_shap_explainer(train_df):
    """Fit the tuned XGBoost model and create a SHAP TreeExplainer."""
    X_train, y_train, _ = split_features_target_audit(train_df)

    pipeline = build_tuned_xgboost_model()
    pipeline.fit(X_train, y_train)

    preprocessor = pipeline.named_steps["preprocessor"]
    classifier = pipeline.named_steps["classifier"]

    X_train_transformed = preprocessor.transform(X_train)
    feature_names = preprocessor.get_feature_names_out()

    explainer = shap.TreeExplainer(classifier)

    return pipeline, explainer, feature_names


def compute_shap_values(pipeline, explainer, feature_names, X):
    """Compute SHAP values for placement model inputs."""
    preprocessor = pipeline.named_steps["preprocessor"]

    X_transformed = preprocessor.transform(X)

    shap_values = explainer(X_transformed)

    shap_values.feature_names = list(feature_names)

    return shap_values


def global_shap_importance(shap_values):
    """Return mean absolute SHAP importance for each transformed feature."""
    importance = np.abs(shap_values.values).mean(axis=0)

    return (
        pd.DataFrame(
            {
                "feature": shap_values.feature_names,
                "mean_abs_shap": importance,
            }
        )
        .sort_values(
            "mean_abs_shap",
            ascending=False,
        )
        .reset_index(drop=True)
    )

def local_shap_explanation(shap_values, row_index=0):
    """Return feature contributions for one prediction."""
    if row_index < 0 or row_index >= len(shap_values):
        raise IndexError(
            f"row_index {row_index} is outside the SHAP result range."
        )

    row = shap_values[row_index]

    explanation = pd.DataFrame(
        {
            "feature": row.feature_names,
            "feature_value": row.data,
            "shap_value": row.values,
        }
    )

    explanation["abs_shap"] = explanation[
        "shap_value"
    ].abs()

    return (
        explanation
        .sort_values(
            "abs_shap",
            ascending=False,
        )
        .reset_index(drop=True)
    )

def split_local_factors(local_explanation, top_n=5):
    """Separate strongest positive and negative SHAP contributions."""
    positive = (
        local_explanation[
            local_explanation["shap_value"] > 0
        ]
        .sort_values(
            "shap_value",
            ascending=False,
        )
        .head(top_n)
        .reset_index(drop=True)
    )

    negative = (
        local_explanation[
            local_explanation["shap_value"] < 0
        ]
        .sort_values(
            "shap_value",
            ascending=True,
        )
        .head(top_n)
        .reset_index(drop=True)
    )

    return positive, negative

def aggregate_local_shap(local_explanation):
    """Aggregate transformed SHAP contributions back to original features."""
    rows = []

    for _, row in local_explanation.iterrows():
        feature = row["feature"]

        if feature.startswith("numeric__"):
            original_feature = feature.replace("numeric__", "")

        elif feature.startswith("binary__"):
            original_feature = feature.replace("binary__", "")

        elif feature.startswith("categorical__Stream_"):
            original_feature = "Stream"

        else:
            original_feature = feature

        rows.append(
            {
                "feature": original_feature,
                "shap_value": row["shap_value"],
            }
        )

    aggregated = (
        pd.DataFrame(rows)
        .groupby(
            "feature",
            as_index=False,
        )["shap_value"]
        .sum()
    )

    aggregated["abs_shap"] = aggregated[
        "shap_value"
    ].abs()

    return (
        aggregated
        .sort_values(
            "abs_shap",
            ascending=False,
        )
        .reset_index(drop=True)
    )
