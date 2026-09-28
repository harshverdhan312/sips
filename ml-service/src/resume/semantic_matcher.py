from functools import lru_cache
import os
from pathlib import Path

import numpy as np


DEFAULT_MODEL_NAME = "all-MiniLM-L6-v2"
DEFAULT_HF_REPO = "sentence-transformers/all-MiniLM-L6-v2"
MAX_SEQUENCE_LENGTH = 256


def _validate_text(text: str) -> str:
    """Validate and clean text before semantic encoding."""
    if not isinstance(text, str):
        raise TypeError("Text must be a string.")

    cleaned_text = " ".join(text.strip().split())

    if not cleaned_text:
        raise ValueError("Text must not be empty.")

    return cleaned_text


class ONNXSemanticModel:
    """Lightweight ONNX Runtime CPU Sentence-BERT embedding model."""

    def __init__(self, model_path: str, tokenizer_path: str):
        import onnxruntime as ort
        from tokenizers import Tokenizer

        opts = ort.SessionOptions()
        opts.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL
        opts.intra_op_num_threads = 1
        opts.inter_op_num_threads = 1

        self.session = ort.InferenceSession(
            str(model_path),
            sess_options=opts,
            providers=["CPUExecutionProvider"],
        )
        self.tokenizer = Tokenizer.from_file(str(tokenizer_path))
        self.tokenizer.enable_truncation(max_length=MAX_SEQUENCE_LENGTH)
        self.tokenizer.enable_padding(length=None, pad_id=0, pad_token="[PAD]")

        input_names = {inp.name for inp in self.session.get_inputs()}
        self._needs_token_type_ids = "token_type_ids" in input_names

    def encode(self, texts: list[str] | str, normalize_embeddings: bool = True) -> np.ndarray:
        """Encode text inputs into 384-dimensional sentence embeddings."""
        if isinstance(texts, str):
            texts = [texts]

        if not texts:
            return np.empty((0, 384), dtype=np.float32)

        encoded = self.tokenizer.encode_batch(texts)
        input_ids = np.array([e.ids for e in encoded], dtype=np.int64)
        attention_mask = np.array([e.attention_mask for e in encoded], dtype=np.int64)

        inputs = {
            "input_ids": input_ids,
            "attention_mask": attention_mask,
        }
        if self._needs_token_type_ids:
            inputs["token_type_ids"] = np.array([e.type_ids for e in encoded], dtype=np.int64)

        outputs = self.session.run(None, inputs)
        last_hidden_state = outputs[0]

        # Mean pooling weighted by attention mask
        mask_expanded = np.expand_dims(attention_mask, -1).astype(float)
        sum_embeddings = np.sum(last_hidden_state * mask_expanded, axis=1)
        sum_mask = np.clip(mask_expanded.sum(axis=1), a_min=1e-9, a_max=None)
        sentence_embeddings = sum_embeddings / sum_mask

        if normalize_embeddings:
            norms = np.linalg.norm(sentence_embeddings, axis=1, keepdims=True)
            norms = np.where(norms == 0, 1e-12, norms)
            sentence_embeddings = sentence_embeddings / norms

        return sentence_embeddings


def _resolve_model_and_tokenizer_paths(model_name: str = DEFAULT_MODEL_NAME) -> tuple[str, str]:
    """Resolve ONNX model and tokenizer file paths locally or from Hugging Face cache."""
    # 1. Check custom ONNX model dir environment variable if set
    custom_dir = os.getenv("ONNX_MODEL_DIR")
    if custom_dir:
        model_p = Path(custom_dir) / "model.onnx"
        tok_p = Path(custom_dir) / "tokenizer.json"
        if model_p.is_file() and tok_p.is_file():
            return str(model_p), str(tok_p)

    # 2. Check repository local models directory
    repo_root = Path(__file__).resolve().parents[2]
    local_model_p = repo_root / "models" / "onnx" / "model.onnx"
    local_tok_p = repo_root / "models" / "onnx" / "tokenizer.json"
    if local_model_p.is_file() and local_tok_p.is_file():
        return str(local_model_p), str(local_tok_p)

    # 3. Resolve / download from Hugging Face Hub snapshot cache
    from huggingface_hub import hf_hub_download

    repo_id = DEFAULT_HF_REPO if model_name == DEFAULT_MODEL_NAME else model_name
    model_path = hf_hub_download(repo_id=repo_id, filename="onnx/model.onnx")
    tokenizer_path = hf_hub_download(repo_id=repo_id, filename="tokenizer.json")

    return str(model_path), str(tokenizer_path)


@lru_cache(maxsize=1)
def load_semantic_model(model_name: str = DEFAULT_MODEL_NAME):
    """Load and cache a pretrained ONNX Sentence-BERT model."""
    model_path, tokenizer_path = _resolve_model_and_tokenizer_paths(model_name)
    return ONNXSemanticModel(model_path=model_path, tokenizer_path=tokenizer_path)


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
