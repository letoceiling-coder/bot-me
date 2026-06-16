# S3: Tool registry, assistants, system prompt presets

## Why

Core product: configurable AI assistants with extensible tools.

## Target

- Tool registry in DB + seed JSON (create_lead, create_client, schedule_meeting, send_notification, call_webhook, search_kb, handoff_human)
- Assistant CRUD API + UI (Russian)
- System prompt presets: sales, support, avito-specialist, admin-coach
- Prompt builder auto-injects enabled tools from registry
- Per-tool settings schema (Zod) stored on AssistantToolConfig

## Scope IN

- `packages/shared` tool definitions
- API modules: tools, assistants
- LK pages: assistants list, edit, preset picker
- OpenRouter config fields on assistant (model ids) — no runtime yet

## Scope OUT

- Live LLM calls (S4 test chat)
- Channel integrations

## Done when

- [ ] Create assistant with preset → tools listed in generated system prompt preview
- [ ] Add new tool to registry → appears in prompt without code change to assistant service

## Refs

`docs/designs/2026-06-16-botme-platform-design.md` (Tool Registry section)
