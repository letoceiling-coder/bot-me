# S4: Knowledge base pipeline, S3 Selectel, test chat

## Why

KB + test chat prove assistant value before channel integrations.

## Target

- Upload docs (pdf/docx/txt) + paste text + URL metadata
- S3 Selectel storage for originals
- Worker job: extract → chunk → embed (pgvector) → status ready/failed
- Test chat UI: sticky panel, calls OpenRouter model chain with KB retrieval
- Tariff limits on doc size/count

## Scope IN

- knowledge module API
- BullMQ worker in `apps/worker` or api worker module
- pgvector extension migration
- Test chat endpoint POST `/api/assistants/:id/test-chat`

## Scope OUT

- Site parser (adapter stub only)
- Production S3 — use Selectel or MinIO locally

## Done when

- [ ] Upload PDF → chunks in DB → test question returns grounded answer
- [ ] Failed embed shows Russian error in UI

## Refs

Eng review KB pipeline section
