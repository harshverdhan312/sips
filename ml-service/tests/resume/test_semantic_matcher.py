import numpy as np
import pytest

from src.resume.semantic_matcher import calculate_semantic_similarity


class FakeSentenceTransformer:
    def __init__(self, embeddings):
        self.embeddings = np.array(embeddings, dtype=float)
        self.received_texts = None
        self.normalize_embeddings = None

    def encode(self, texts, normalize_embeddings=False):
        self.received_texts = texts
        self.normalize_embeddings = normalize_embeddings
        return self.embeddings


def test_calculate_semantic_similarity_uses_normalized_embeddings():
    model = FakeSentenceTransformer([[1.0, 0.0], [0.8, 0.6]])

    score = calculate_semantic_similarity(
        "Python machine learning",
        "Python and ML",
        model=model,
    )

    assert score == pytest.approx(0.8)
    assert model.received_texts == [
        "Python machine learning",
        "Python and ML",
    ]
    assert model.normalize_embeddings is True


def test_calculate_semantic_similarity_returns_zero_for_orthogonal_vectors():
    model = FakeSentenceTransformer([[1.0, 0.0], [0.0, 1.0]])

    score = calculate_semantic_similarity("Python", "Java", model=model)

    assert score == pytest.approx(0.0)


@pytest.mark.parametrize("text", ["", "   "])
def test_calculate_semantic_similarity_rejects_empty_text(text):
    model = FakeSentenceTransformer([[1.0, 0.0], [1.0, 0.0]])

    with pytest.raises(ValueError, match="Text must not be empty."):
        calculate_semantic_similarity(text, "Python", model=model)


def test_calculate_semantic_similarity_rejects_non_string_text():
    model = FakeSentenceTransformer([[1.0, 0.0], [1.0, 0.0]])

    with pytest.raises(TypeError, match="Text must be a string."):
        calculate_semantic_similarity(None, "Python", model=model)
