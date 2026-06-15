import hashlib
import math
import re
from collections.abc import Sequence

TOKEN_RE = re.compile(r"[a-z0-9][a-z0-9-]{1,}", re.IGNORECASE)


def tokenize(text: str) -> list[str]:
    return [match.group(0).lower() for match in TOKEN_RE.finditer(text)]


class HashEmbeddingFunction:
    """Deterministic local embeddings for bootstrapping retrieval without another API key."""

    def __init__(self, dimensions: int = 384) -> None:
        self.dimensions = dimensions

    def embed(self, text: str) -> list[float]:
        vector = [0.0] * self.dimensions

        for token in tokenize(text):
            digest = hashlib.sha256(token.encode("utf-8")).digest()
            index = int.from_bytes(digest[:4], "big") % self.dimensions
            sign = 1.0 if digest[4] % 2 == 0 else -1.0
            vector[index] += sign

        magnitude = math.sqrt(sum(value * value for value in vector))
        if magnitude == 0:
            return vector

        return [value / magnitude for value in vector]

    def embed_many(self, texts: list[str]) -> list[list[float]]:
        return [self.embed(text) for text in texts]


class MiniLMEmbeddingFunction:
    """Chroma's local all-MiniLM-L6-v2 embedder with deterministic fallback."""

    name = "chroma-all-MiniLM-L6-v2"

    def __init__(self) -> None:
        self._fallback = HashEmbeddingFunction()
        self._default_function = None
        self.last_error: str | None = None

    def embed(self, text: str) -> list[float]:
        return self.embed_many([text])[0]

    def embed_many(self, texts: list[str]) -> list[list[float]]:
        try:
            default_function = self._get_default_function()
            return [self._coerce_vector(vector) for vector in default_function(texts)]
        except Exception as exc:  # Chroma downloads the ONNX model on first use.
            self.last_error = f"{type(exc).__name__}: {exc}"
            return self._fallback.embed_many(texts)

    def _get_default_function(self):
        if self._default_function is None:
            from chromadb.utils.embedding_functions import DefaultEmbeddingFunction

            self._default_function = DefaultEmbeddingFunction()

        return self._default_function

    def _coerce_vector(self, vector: Sequence[float]) -> list[float]:
        return [float(value) for value in vector]
