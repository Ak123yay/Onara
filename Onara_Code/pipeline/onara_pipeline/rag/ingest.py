from onara_pipeline.config import get_settings
from onara_pipeline.rag.chroma_client import PatternStore
from onara_pipeline.rag.patterns import DEFAULT_PATTERNS


def ingest_default_patterns(store: PatternStore | None = None) -> int:
    active_store = store
    if active_store is None:
        settings = get_settings()
        active_store = PatternStore(
            collection_name=settings.chroma_collection_name,
            persist_path=settings.chroma_persist_path,
        )

    return active_store.upsert_patterns(DEFAULT_PATTERNS)


def main() -> None:
    count = ingest_default_patterns()
    print(f"Ingested {count} Onara RAG patterns.")


if __name__ == "__main__":
    main()
