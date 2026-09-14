from pathlib import Path
import sys

PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

from src.data.clean import load_raw_data, clean_data, validate_dataset
from src.data.features import split_features_target_audit
from src.data.split import split_train_val_test, create_profile_groups
from src.placement.calibration import build_calibrated_model
from src.placement.persistence import save_model

DATA_PATH = PROJECT_ROOT / "data" / "raw" / "collegePlace.csv"
MODEL_PATH = PROJECT_ROOT / "models" / "placement_model_rebuilt.joblib"


def train_and_save_model():
    """Reproduce and persist the production placement model."""
    df = load_raw_data(DATA_PATH)
    df = clean_data(df)
    validate_dataset(df)

    train_df, val_df, test_df = split_train_val_test(
        df,
        random_state=42,
    )

    X_train, y_train, _ = split_features_target_audit(
        train_df
    )
    train_groups = create_profile_groups(train_df)

    model = build_calibrated_model(
        X_train,
        y_train,
        train_groups,
        method="isotonic",
        random_state=42,
    )

    model.fit(
        X_train,
        y_train,
    )

    save_model(
        model,
        MODEL_PATH,
    )

    print(f"Saved placement model to: {MODEL_PATH}")
    print(f"Training rows: {len(train_df)}")
    print(f"Validation rows: {len(val_df)}")
    print(f"Test rows: {len(test_df)}")


if __name__ == "__main__":
    train_and_save_model()
