NUMERIC_FEATURES = [
    "Age",
    "Internships",
    "CGPA",
]

BINARY_FEATURES = [
    "Hostel",
    "HistoryOfBacklogs",
]

CATEGORICAL_FEATURES = [
    "Stream",
]

MODEL_FEATURES = (
    NUMERIC_FEATURES
    + BINARY_FEATURES
    + CATEGORICAL_FEATURES
)

TARGET = "PlacedOrNot"

AUDIT_ONLY_FEATURES = [
    "Gender",
]

def split_features_target_audit(df):
    """Separate model features, target, and audit-only columns."""
    X = df[MODEL_FEATURES].copy()
    y = df[TARGET].copy()
    audit = df[AUDIT_ONLY_FEATURES].copy()

    return X, y, audit

def validate_feature_columns(df):
    """Ensure all required model, target, and audit columns are present."""
    required = set(MODEL_FEATURES + [TARGET] + AUDIT_ONLY_FEATURES)
    missing = required - set(df.columns)

    if missing:
        raise ValueError(
            f"Missing required feature columns: {sorted(missing)}"
        )
