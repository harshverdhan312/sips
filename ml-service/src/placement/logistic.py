from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline

from src.data.preprocessing import build_logistic_preprocessor


def build_logistic_model():
    """Create the Logistic Regression placement model."""
    pipeline = Pipeline(
        steps=[
            (
                "preprocessor",
                build_logistic_preprocessor(),
            ),
            (
                "classifier",
                LogisticRegression(
                    max_iter=1000,
                    random_state=42,
                ),
            ),
        ]
    )

    return pipeline
