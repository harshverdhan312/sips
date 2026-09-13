from pathlib import Path

import joblib


def save_model(model, path):
    """Persist a trained model artifact to disk."""
    path = Path(path)
    path.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    joblib.dump(
        model,
        path,
    )


def load_model(path):
    """Load a persisted model artifact from disk."""
    return joblib.load(path)
