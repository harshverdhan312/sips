from functools import lru_cache

import numpy as np


DEFAULT_MODEL_NAME = "all-MiniLM-L6-v2"


def _validate_text(text: str) -> str:
    """Validate and clean text before semantic encoding."""
    if not isinstance(text, str):
        raise TypeError("Text must be a string.")

    cleaned_text = " ".join(text.strip().split())

    if not cleaned_text:
        raise ValueError("Text must not be empty.")

    return cleaned_text


@lru_cache(maxsize=1)
def load_semantic_model(model_name: str = DEFAULT_MODEL_NAME):
    """Load and cache a pretrained Sentence-BERT model."""
    from sentence_transformers import SentenceTransformer

    return SentenceTransformer(model_name)


def calculate_semantic_similarity(
    first_text: str,
    second_text: str,
    model=None,
) -> float:
    """Calculate cosine similarity between two texts using embeddings."""
    cleaned_first_text = _validate_text(first_text)
    cleaned_second_text = _validate_text(second_text)
    semantic_model = model if model is not None else load_semantic_model()

    embeddings = semantic_model.encode(
        [cleaned_first_text, cleaned_second_text],
        normalize_embeddings=True,
    )
    similarity = float(np.dot(embeddings[0], embeddings[1]))

    return max(-1.0, min(1.0, similarity))
