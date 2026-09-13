from sklearn.calibration import CalibratedClassifierCV
from sklearn.metrics import brier_score_loss, log_loss
from sklearn.model_selection import StratifiedGroupKFold

from src.placement.xgboost_model import build_tuned_xgboost_model


def evaluate_probability_quality(y_true, probabilities):
    """Evaluate how well predicted probabilities match observed outcomes."""
    return {
        "brier_score": brier_score_loss(y_true, probabilities),
        "log_loss": log_loss(y_true, probabilities),
    }


def build_calibrated_model(X, y, groups, method="sigmoid", random_state=42):
    """Create a group-aware calibrated tuned XGBoost model."""
    base_model = build_tuned_xgboost_model()

    group_cv = StratifiedGroupKFold(
        n_splits=5,
        shuffle=True,
        random_state=random_state,
    )

    cv_splits = list(
        group_cv.split(
            X,
            y,
            groups,
        )
    )

    calibrated_model = CalibratedClassifierCV(
        estimator=base_model,
        method=method,
        cv=cv_splits,
    )

    return calibrated_model

def expected_calibration_error(y_true, probabilities, n_bins=10):
    """Calculate expected calibration error using equal-width bins."""
    import numpy as np

    y_true = np.asarray(y_true)
    probabilities = np.asarray(probabilities)

    bin_edges = np.linspace(0.0, 1.0, n_bins + 1)
    ece = 0.0

    for i in range(n_bins):
        if i == n_bins - 1:
            mask = (
                (probabilities >= bin_edges[i])
                & (probabilities <= bin_edges[i + 1])
            )
        else:
            mask = (
                (probabilities >= bin_edges[i])
                & (probabilities < bin_edges[i + 1])
            )

        if mask.any():
            mean_confidence = probabilities[mask].mean()
            observed_rate = y_true[mask].mean()
            bin_weight = mask.mean()

            ece += bin_weight * abs(
                mean_confidence - observed_rate
            )

    return float(ece)
