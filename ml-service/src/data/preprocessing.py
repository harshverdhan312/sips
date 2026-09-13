from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder

from src.data.features import (
    NUMERIC_FEATURES,
    BINARY_FEATURES,
    CATEGORICAL_FEATURES,
)


def build_preprocessor():
    """Create the reusable preprocessing pipeline for placement features."""
    preprocessor = ColumnTransformer(
        transformers=[
            ("numeric", "passthrough", NUMERIC_FEATURES),
            ("binary", "passthrough", BINARY_FEATURES),
            (
                "categorical",
                OneHotEncoder(handle_unknown="ignore"),
                CATEGORICAL_FEATURES,
            ),
        ],
        remainder="drop",
    )

    return preprocessor

from sklearn.preprocessing import StandardScaler


def build_logistic_preprocessor():
    """Create preprocessing tailored for Logistic Regression."""
    preprocessor = ColumnTransformer(
        transformers=[
            (
                "numeric",
                StandardScaler(),
                NUMERIC_FEATURES,
            ),
            (
                "binary",
                "passthrough",
                BINARY_FEATURES,
            ),
            (
                "categorical",
                OneHotEncoder(handle_unknown="ignore"),
                CATEGORICAL_FEATURES,
            ),
        ],
        remainder="drop",
    )

    return preprocessor
