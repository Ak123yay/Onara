from typing import Any

from onara_pipeline.config import Settings, get_settings
from onara_pipeline.rag.bm25 import BM25Index
from onara_pipeline.rag.embeddings import MiniLMEmbeddingFunction
from onara_pipeline.rag.patterns import DEFAULT_PATTERNS
from onara_pipeline.rag.types import PatternDocument, PatternSearchResult

PATTERN_LIBRARY_VERSION = "2026-06-15.1"


class PatternStore:
    def __init__(
        self,
        *,
        collection_name: str,
        persist_path: str,
        embedding_function: MiniLMEmbeddingFunction | None = None,
    ) -> None:
        self.collection_name = collection_name
        self.persist_path = persist_path
        self.embedding_function = embedding_function or MiniLMEmbeddingFunction()
        self._collection: Any | None = None

    @property
    def collection(self) -> Any:
        if self._collection is None:
            import chromadb

            client = chromadb.PersistentClient(path=self.persist_path)
            self._collection = client.get_or_create_collection(
                name=self.collection_name,
                metadata={"description": "Reusable Onara contractor website generation patterns"},
            )

        return self._collection

    def count(self) -> int:
        return int(self.collection.count())

    def upsert_patterns(self, patterns: list[PatternDocument]) -> int:
        if not patterns:
            return 0

        documents = [pattern.searchable_text() for pattern in patterns]
        self.collection.upsert(
            ids=[pattern.id for pattern in patterns],
            documents=documents,
            embeddings=self.embedding_function.embed_many(documents),
            metadatas=[pattern.metadata() for pattern in patterns],
        )
        return len(patterns)

    def seed_defaults_if_empty(self) -> int:
        metadata = self.collection.metadata or {}
        expected_metadata = self._collection_metadata()

        if self.count() >= len(DEFAULT_PATTERNS) and all(
            metadata.get(key) == value for key, value in expected_metadata.items()
        ):
            return 0

        count = self.upsert_patterns(DEFAULT_PATTERNS)
        self.collection.modify(metadata=expected_metadata)
        return count

    def search(
        self,
        *,
        query: str,
        top_k: int = 5,
        vertical: str | None = None,
        pattern_type: str | None = None,
        vector_weight: float = 0.6,
        bm25_weight: float = 0.4,
    ) -> list[PatternSearchResult]:
        self.seed_defaults_if_empty()
        where = self._where(vertical=vertical, pattern_type=pattern_type)
        documents = self._get_documents(where=where)

        if not documents:
            return []

        vector_results = self._vector_search(query=query, top_k=min(max(top_k * 3, top_k), len(documents)), where=where)
        bm25_scores = BM25Index({doc_id: item["document"] for doc_id, item in documents.items()}).score(query)
        normalized_bm25 = self._normalize_scores(bm25_scores)

        merged_ids = set(documents.keys()) | set(vector_results)
        results: list[PatternSearchResult] = []

        for doc_id in merged_ids:
            item = documents.get(doc_id)
            if not item:
                continue

            vector_score = vector_results.get(doc_id, 0.0)
            bm25_score = normalized_bm25.get(doc_id, 0.0)
            score = vector_weight * vector_score + bm25_weight * bm25_score
            metadata = item["metadata"]

            results.append(
                PatternSearchResult(
                    id=doc_id,
                    title=str(metadata.get("title", "")),
                    vertical=str(metadata.get("vertical", "")),
                    pattern_type=str(metadata.get("pattern_type", "")),
                    tags=self._split_tags(metadata.get("tags")),
                    summary=str(metadata.get("summary", "")),
                    content=item["document"],
                    score=round(score, 6),
                    vector_score=round(vector_score, 6),
                    bm25_score=round(bm25_score, 6),
                )
            )

        return sorted(results, key=lambda result: result.score, reverse=True)[:top_k]

    def _get_documents(self, *, where: dict[str, str] | None) -> dict[str, dict[str, Any]]:
        result = self.collection.get(where=where, include=["documents", "metadatas"])
        ids = result.get("ids") or []
        docs = result.get("documents") or []
        metadatas = result.get("metadatas") or []

        return {
            doc_id: {"document": doc, "metadata": metadata or {}}
            for doc_id, doc, metadata in zip(ids, docs, metadatas, strict=False)
            if isinstance(doc, str)
        }

    def _vector_search(
        self,
        *,
        query: str,
        top_k: int,
        where: dict[str, str] | None,
    ) -> dict[str, float]:
        result = self.collection.query(
            query_embeddings=[self.embedding_function.embed(query)],
            n_results=top_k,
            where=where,
            include=["distances"],
        )
        ids = (result.get("ids") or [[]])[0]
        distances = (result.get("distances") or [[]])[0]

        return {
            doc_id: 1 / (1 + max(float(distance), 0.0))
            for doc_id, distance in zip(ids, distances, strict=False)
        }

    def _where(self, *, vertical: str | None, pattern_type: str | None) -> dict[str, Any] | None:
        filters = {}
        if vertical:
            filters["vertical"] = vertical
        if pattern_type:
            filters["pattern_type"] = pattern_type

        if len(filters) > 1:
            return {"$and": [{key: value} for key, value in filters.items()]}
        return filters or None

    def _normalize_scores(self, scores: dict[str, float]) -> dict[str, float]:
        max_score = max(scores.values(), default=0.0)
        if max_score <= 0:
            return {doc_id: 0.0 for doc_id in scores}
        return {doc_id: score / max_score for doc_id, score in scores.items()}

    def _split_tags(self, tags: Any) -> list[str]:
        if not isinstance(tags, str):
            return []
        return [tag for tag in tags.split(",") if tag]

    def _collection_metadata(self) -> dict[str, str]:
        return {
            "description": "Reusable Onara contractor website generation patterns",
            "embedding_model": self.embedding_function.name,
            "pattern_library_version": PATTERN_LIBRARY_VERSION,
        }


def build_pattern_store(settings: Settings | None = None) -> PatternStore:
    active_settings = settings or get_settings()
    return PatternStore(
        collection_name=active_settings.chroma_collection_name,
        persist_path=active_settings.chroma_persist_path,
    )
