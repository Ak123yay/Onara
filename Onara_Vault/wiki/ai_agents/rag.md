# RAG System — Onara

_ChromaDB vector store, what's in it, and how Agents 6, 7, and 9 use it to generate and validate better HTML._

---

## Overview

The RAG (Retrieval-Augmented Generation) system gives Agent 6 (Code Generator), Agent 7 (Debugger), and Agent 9 (QA Agent) access to a library of proven HTML/CSS/JS patterns for small business websites. Instead of generating structure from scratch, Agent 6 retrieves the most relevant patterns for the business category and uses them as templates.

---

## Storage

- **Vector store**: ChromaDB (local filesystem persistence)
- **Persist path**: `./chroma_db` (`CHROMA_PERSIST_PATH`)
- **Collection name**: `onara_patterns` (`CHROMA_COLLECTION_NAME`)
- **Embedding model**: all-MiniLM-L6-v2 (sentence-transformers, local)

---

## Collection Schema

Each document in `onara_patterns`:

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | Unique pattern ID (e.g., `restaurant-hero-v2`) |
| `document` | String | The HTML/CSS snippet |
| `metadata.category` | String | Business type (restaurant, salon, plumber, etc.) |
| `metadata.section` | String | Page section (hero, services, contact, footer) |
| `metadata.layout` | String | Layout variant (centered, split, card-grid) |
| `metadata.quality_score` | Float | 0.0–1.0 manual quality rating |
| `embedding` | Vector | 384-dim embedding of the snippet |

---

## Seed Content

The initial collection is seeded from `raw/10_rag_seed_content.md`, which contains curated HTML/CSS patterns for:

**Business categories**:
- Restaurant / café
- Hair salon / beauty
- Plumber / electrician / contractor
- Accountant / financial services
- Dental / medical practice
- Fitness / gym

**Page sections**:
- Hero (full-width banner with CTA)
- Services grid (3–4 card layout)
- About section (text + image)
- Contact / hours section
- Footer with links and social icons

**Pattern count**: ~60 initial patterns (6 categories × ~10 patterns each)

---

## How Agent 6 Uses RAG

Agent 6 (Code Generator) query flow:

1. Receives `business_category` and `layout_json` from blackboard
2. Queries ChromaDB:
   ```python
   results = collection.query(
       query_texts=[f"{business_category} {section_name} website section"],
       n_results=3,
       where={"category": business_category}
   )
   ```
3. Top 3 matching patterns injected into Agent 6's prompt as examples
4. Agent 6 generates HTML using patterns as structural reference, not copy-paste

**Why RAG over pure generation**:
- Consistent HTML structure across sites
- Reduces hallucinated CSS classes
- Proven patterns mean less QA failures
- Faster generation (LLM fills content, not structure)

---

## How Agent 9 Uses RAG

Agent 9 (QA Gate) uses ChromaDB to validate:

- Retrieves expected pattern for the business category + section combination
- Compares generated HTML structure against retrieved pattern
- Flags structural deviations as QA failures (Check 7: "Structural validity")

---

## Adding New Patterns

To add patterns to the collection:

```python
# FastAPI admin endpoint (internal use only)
POST /admin/patterns/add
{
  "id": "salon-services-v3",
  "html": "<section class=\"services-grid\">...",
  "metadata": {
    "category": "salon",
    "section": "services",
    "layout": "card-grid",
    "quality_score": 0.85
  }
}
```

Or directly via ChromaDB Python client during development:

```python
collection.add(
    ids=["salon-services-v3"],
    documents=["<section class=\"services-grid\">..."],
    metadatas=[{"category": "salon", "section": "services", "layout": "card-grid", "quality_score": 0.85}]
)
```

---

## Curated Learning Loop

Completed generated sites can feed ChromaDB, but only through a conservative gate:

- The user must have `training_data_consent = true`.
- The user must have `training_data_consent_at` set.
- The saved blackboard `qa_output.status` must be `pass`.
- `qa_output.blocking_issues` must be empty.
- No deterministic QA check may be false.
- The final deployment artifact is re-checked with deterministic QA after parser/reviews/contact-form mutations.
- If the final artifact fails that second check, nothing is saved.
- If ChromaDB is unavailable, site generation still completes and the blackboard records `rag_learning.status = failed`.

The loop saves redacted component patterns, not full customer sites. Business name, phone, email, address, URLs, and project/user/job data attributes are replaced with placeholders before embedding.

Duplicate prevention:

- Each learned document stores `content_hash`.
- Each source project/component pair stores `source_key_hash`.
- The pattern store skips candidates when either hash already exists.
- This prevents repeated builds from stuffing the collection with duplicate versions of the same site.

Runtime files:

- `Onara_Code/pipeline/onara_pipeline/rag/learning.py` builds the curated pattern documents.
- `Onara_Code/pipeline/onara_pipeline/rag/chroma_client.py` checks existing metadata before upsert.
- `Onara_Code/pipeline/onara_pipeline/job_queue.py` runs the learning step after deployment storage and before job completion.

---

## Maintenance

- ChromaDB persists to disk at `CHROMA_PERSIST_PATH` — back up this directory
- Collection survives FastAPI restarts (persistent mode)
- If `chroma_db/` is deleted, re-seed from `raw/10_rag_seed_content.md`
- Pattern quality improves over time: add high-performing site patterns back to collection

---

## Related Files

- `wiki/ai_agents/agents.md` — Agent 7 and Agent 9 details
- `wiki/architecture/env-vars.md` — `CHROMA_PERSIST_PATH`, `CHROMA_COLLECTION_NAME`
- `raw/10_rag_seed_content.md` — source HTML patterns for initial seeding
