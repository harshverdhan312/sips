from sklearn.dummy import DummyClassifier
from sklearn.pipeline import Pipeline

from src.data.preprocessing import build_preprocessor


def build_dummy_baseline():
    """Create a majority-class baseline model."""
    pipeline = Pipeline(
        steps=[
            ("preprocessor", build_preprocessor()),
            (
                "classifier",
                DummyClassifier(strategy="most_frequent"),
            ),
        ]
    )

    return pipeline
