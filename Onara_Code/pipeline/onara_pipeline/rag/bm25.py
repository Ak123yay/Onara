import math
from collections import Counter

from onara_pipeline.rag.embeddings import tokenize


class BM25Index:
    def __init__(self, documents: dict[str, str], *, k1: float = 1.5, b: float = 0.75) -> None:
        self.documents = documents
        self.k1 = k1
        self.b = b
        self.term_frequencies = {doc_id: Counter(tokenize(text)) for doc_id, text in documents.items()}
        self.document_lengths = {
            doc_id: sum(term_counts.values()) for doc_id, term_counts in self.term_frequencies.items()
        }
        self.average_document_length = self._average_document_length()
        self.document_frequencies = self._document_frequencies()

    def score(self, query: str) -> dict[str, float]:
        query_terms = tokenize(query)
        if not query_terms or not self.documents:
            return {doc_id: 0.0 for doc_id in self.documents}

        scores: dict[str, float] = {}
        total_documents = len(self.documents)

        for doc_id, term_counts in self.term_frequencies.items():
            score = 0.0
            doc_length = self.document_lengths[doc_id]

            for term in query_terms:
                frequency = term_counts.get(term, 0)
                if frequency == 0:
                    continue

                document_frequency = self.document_frequencies.get(term, 0)
                idf = math.log(1 + (total_documents - document_frequency + 0.5) / (document_frequency + 0.5))
                denominator = frequency + self.k1 * (
                    1 - self.b + self.b * doc_length / max(self.average_document_length, 1)
                )
                score += idf * (frequency * (self.k1 + 1)) / denominator

            scores[doc_id] = score

        return scores

    def _average_document_length(self) -> float:
        if not self.document_lengths:
            return 0.0
        return sum(self.document_lengths.values()) / len(self.document_lengths)

    def _document_frequencies(self) -> Counter[str]:
        frequencies: Counter[str] = Counter()
        for term_counts in self.term_frequencies.values():
            frequencies.update(term_counts.keys())
        return frequencies
