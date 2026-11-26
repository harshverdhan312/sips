from collections.abc import Sequence

import pandas as pd
from sklearn.model_selection import StratifiedGroupKFold

from src.data.features import MODEL_FEATURES


def create_profile_groups(
    df: pd.DataFrame,
    features: Sequence[str] | None = None,
) -> pd.Series:
    """Assign one group ID to each unique selected-feature profile."""
    selected = (
        list(MODEL_FEATURES)
        if features is None
        else list(features)
    )

    if not selected:
        raise ValueError(
            "At least one grouping feature is required."
        )

    missing = sorted(
        set(selected) - set(df.columns)
    )

    if missing:
        raise ValueError(
            f"Missing grouping features: {missing}"
        )

    groups = df.groupby(
        selected,
        dropna=False,
        sort=True,
    ).ngroup()

    return groups


def split_train_val_test(
    df: pd.DataFrame,
    random_state: int = 42,
):
    """Create reproducible group-aware train, validation, and test splits."""
    groups = create_profile_groups(df)
    y = df["PlacedOrNot"]

    outer_cv = StratifiedGroupKFold(
        n_splits=7,
        shuffle=True,
        random_state=random_state,
    )

    train_val_idx, test_idx = next(
        outer_cv.split(df, y, groups)
    )

    train_val_df = df.iloc[
        train_val_idx
    ].copy()
    test_df = df.iloc[
        test_idx
    ].copy()

    train_val_groups = groups.iloc[
        train_val_idx
    ]
    train_val_y = y.iloc[
        train_val_idx
    ]

    inner_cv = StratifiedGroupKFold(
        n_splits=6,
        shuffle=True,
        random_state=random_state,
    )

    train_rel_idx, val_rel_idx = next(
        inner_cv.split(
            train_val_df,
            train_val_y,
            train_val_groups,
        )
    )

    train_df = train_val_df.iloc[
        train_rel_idx
    ].copy()
    val_df = train_val_df.iloc[
        val_rel_idx
    ].copy()

    return train_df, val_df, test_df
