# Training Data Pipeline

_Consent-gated storage for QA-approved, redacted generation examples._

## Purpose

The training data pipeline stores examples that can improve Onara later without saving bad, private, or duplicate generated sites.

It is separate from normal project storage:

- `projects` stores the user's actual site metadata.
- ChromaDB stores small reusable RAG patterns.
- `training_examples` stores redacted generation examples for future RAG analysis and model fine-tuning.

## Consent Gate

Training data is opt-in only.

The pipeline reads these fields from `public.users`:

- `training_data_consent`
- `training_data_consent_at`
- `training_data_consent_version`
- `training_data_opted_out_at`

If consent is not enabled, both Chroma learning and `training_examples` storage are skipped.

## Quality Gate

An example can be stored only when:

- Agent 9 QA status is `pass`.
- Agent 9 has no blocking issues.
- No deterministic QA check failed.
- The final deployment artifact passes deterministic QA again after parser, reviews badge, and lead-form mutations.

If any check fails, nothing is stored.

## Redaction

Stored examples are redacted before Supabase insert.

Redacted fields include:

- business name
- phone
- email
- address
- website URLs
- project/user/job data attributes

Private owner notes are not copied into the training snapshot.

## Storage

Migration:

- `Onara_Code/supabase/migrations/017_training_examples.sql`

Runtime files:

- `Onara_Code/pipeline/onara_pipeline/training_examples.py`
- `Onara_Code/pipeline/onara_pipeline/deployment/supabase.py`
- `Onara_Code/pipeline/onara_pipeline/job_queue.py`

The `training_examples.content_hash` column is unique, so duplicate redacted examples are skipped.

## User Controls

The Account page exposes the production controls for this pipeline:

- opt in to optional use of QA-approved, redacted generation examples
- stop future optional training-data use
- delete saved approved examples connected to the account

Deleting saved examples also turns off future optional training-data use. It does not delete live projects, generated
sites, billing records, or operational logs.

## Privacy Disclosure

The public Privacy Policy states that optional training-data use is opt-in, redacted, and limited to QA-approved
examples. It also tells users they can withdraw consent or delete saved approved examples from the Account page.
