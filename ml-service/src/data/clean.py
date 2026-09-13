import pandas as pd


def load_raw_data(path: str) -> pd.DataFrame:
    """Load the raw placement dataset without modifying the source file."""
    df = pd.read_csv(path)
    return df.copy()


EXPECTED_COLUMNS = [
    "Age",
    "Gender",
    "Stream",
    "Internships",
    "CGPA",
    "Hostel",
    "HistoryOfBacklogs",
    "PlacedOrNot",
]


def validate_columns(df: pd.DataFrame) -> None:
    """Ensure the dataset contains exactly the expected columns."""
    actual_columns = list(df.columns)

    if actual_columns != EXPECTED_COLUMNS:
        raise ValueError(
            f"Unexpected dataset columns. "
            f"Expected {EXPECTED_COLUMNS}, got {actual_columns}"
        )


def validate_missing_values(df: pd.DataFrame) -> None:
    """Fail if any required dataset value is missing."""
    missing = df.isna().sum()

    if missing.any():
        missing_columns = missing[missing > 0].to_dict()
        raise ValueError(
            f"Missing values detected: {missing_columns}"
        )


def validate_target(df: pd.DataFrame) -> None:
    """Ensure the placement target is binary: 0 or 1."""
    valid_values = {0, 1}
    actual_values = set(df["PlacedOrNot"].unique())

    if not actual_values.issubset(valid_values):
        raise ValueError(
            f"Invalid PlacedOrNot values: {actual_values}. "
            f"Expected only {valid_values}."
        )


def validate_feature_ranges(df: pd.DataFrame) -> None:
    """Validate allowed ranges for numeric placement features."""
    checks = {
        "Age": (19, 30),
        "Internships": (0, 3),
        "CGPA": (5, 9),
        "Hostel": (0, 1),
        "HistoryOfBacklogs": (0, 1),
    }

    for column, (minimum, maximum) in checks.items():
        invalid = ~df[column].between(minimum, maximum)

        if invalid.any():
            bad_values = sorted(df.loc[invalid, column].unique().tolist())
            raise ValueError(
                f"Invalid values in {column}: {bad_values}. "
                f"Expected range {minimum} to {maximum}."
            )


def validate_categories(df: pd.DataFrame) -> None:
    """Validate allowed categorical values."""
    allowed = {
        "Gender": {"Male", "Female"},
        "Stream": {
            "Civil",
            "Computer Science",
            "Electrical",
            "Electronics And Communication",
            "Information Technology",
            "Mechanical",
        },
    }

    for column, valid_values in allowed.items():
        actual_values = set(df[column].unique())
        unexpected = actual_values - valid_values

        if unexpected:
            raise ValueError(
                f"Unexpected values in {column}: {sorted(unexpected)}"
            )


def validate_dataset(df: pd.DataFrame) -> None:
    """Run all dataset validation checks."""
    validate_columns(df)
    validate_missing_values(df)
    validate_target(df)
    validate_feature_ranges(df)
    validate_categories(df)


def report_duplicates(df: pd.DataFrame) -> dict:
    """Return duplicate statistics without modifying the dataset."""
    total_rows = len(df)
    duplicate_rows = int(df.duplicated().sum())
    unique_rows = int(len(df.drop_duplicates()))

    return {
        "total_rows": total_rows,
        "duplicate_rows": duplicate_rows,
        "unique_rows": unique_rows,
    }


def clean_data(df: pd.DataFrame) -> pd.DataFrame:
    """Apply deterministic cleaning without removing observations."""
    cleaned = df.copy()

    text_columns = ["Gender", "Stream"]

    for column in text_columns:
        cleaned[column] = cleaned[column].str.strip()

    return cleaned
