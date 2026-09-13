import numpy as np
import pandas as pd
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
)


def evaluate_thresholds(y_true, scores, thresholds=None):
    """Evaluate classification performance across decision thresholds."""
    if thresholds is None:
        thresholds = np.arange(0.10, 0.91, 0.05)

    rows = []

    for threshold in thresholds:
        preds = (scores >= threshold).astype(int)

        rows.append(
            {
                "threshold": round(float(threshold), 2),
                "accuracy": accuracy_score(y_true, preds),
                "precision": precision_score(
                    y_true,
                    preds,
                    zero_division=0,
                ),
                "recall": recall_score(
                    y_true,
                    preds,
                    zero_division=0,
                ),
                "f1": f1_score(
                    y_true,
                    preds,
                    zero_division=0,
                ),
            }
        )

    return pd.DataFrame(rows)

def select_best_f1_threshold(results):
    """Select the validation threshold with the highest F1 score."""
    best_index = results["f1"].idxmax()
    return results.loc[best_index].to_dict()
