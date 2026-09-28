import pytest
import numpy as np

from src.resume.semantic_matcher import (
    load_semantic_model,
    calculate_semantic_similarity,
    ONNXSemanticModel,
)


def test_onnx_semantic_model_loading():
    model = load_semantic_model()
    assert isinstance(model, ONNXSemanticModel)


def test_onnx_semantic_model_encoding_shape_and_norm():
    model = load_semantic_model()
    texts = ["Python data science", "Full stack web developer"]
    embeddings = model.encode(texts, normalize_embeddings=True)

    assert embeddings.shape == (2, 384)
    # Check L2 norm is approximately 1.0 for each embedding
    norms = np.linalg.norm(embeddings, axis=1)
    for norm in norms:
        assert norm == pytest.approx(1.0, abs=1e-5)


def test_onnx_semantic_similarity_identical_text():
    text = "Machine learning engineer with Python and PyTorch"
    score = calculate_semantic_similarity(text, text)
    assert score == pytest.approx(1.0, abs=1e-3)


def test_onnx_semantic_similarity_similar_vs_unrelated():
    base_text = "Python software engineer with machine learning and data science experience"
    similar_text = "Machine learning developer proficient in Python and data analytics"
    unrelated_text = "Gardening tips for planting spring flowers in the backyard"

    similar_score = calculate_semantic_similarity(base_text, similar_text)
    unrelated_score = calculate_semantic_similarity(base_text, unrelated_text)

    assert similar_score > 0.70
    assert unrelated_score < 0.25
    assert similar_score > unrelated_score


def test_onnx_semantic_similarity_within_bounds():
    score = calculate_semantic_similarity("Java Spring Boot", "Node.js Express")
    assert -1.0 <= score <= 1.0
