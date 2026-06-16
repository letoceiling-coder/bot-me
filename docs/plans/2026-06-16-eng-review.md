---
status: ACTIVE
generated_by: gstack-plan-eng-review
date: 2026-06-16
design_doc: docs/designs/2026-06-16-botme-platform-design.md
ceo_plan: docs/plans/2026-06-16-ceo-review.md
---

# Engineering Plan: botme Platform

Branch: main  
Design doc: `docs/designs/2026-06-16-botme-platform-design.md`

---

## Step 0: Scope Challenge

| Check | Result |
|-------|--------|
| Existing code | Greenfield — no reuse |
| Minimum viable | 8 bounded modules (see architecture) |
| Complexity | 12+ services in logical modules — **within limit** if strict module boundaries |
| Distribution | Docker Compose staging + VPS/K8s prod; CI GitHub Actions |
| Completeness | Full error paths + tests required (not shortcut MVP) |

**Scope locked:** CEO-approved wedge. No additional CRM UI in v1.

---

## Tech Stack (recommended)

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Frontend | **Next.js 15** (App Router) + TypeScript | SSR landing SEO + SPA LK |
| UI | **Tailwind CSS 4** + **Radix UI** + **Framer Motion** | Premium adaptive + animations |
| API | **NestJS** (or Next.js Route Handlers + tRPC for speed) | Clear modules; recommend NestJS for integrations |
| DB | **PostgreSQL 16** | Relational CRM + billing |
| Cache/Queue | **Redis 7** + **BullMQ** | Webhooks, LLM jobs, notifications |
| Object storage | **Selectel S3** | KB files, exports |
| Vector | **pgvector** (v1) → Qdrant optional v2 | Simplicity |
| Auth | **NextAuth v5** / Lucia + JWT sessions | Org-scoped |
| Payments | **ЮKassa** API | Subscriptions + receipts |
| LLM | **OpenRouter** HTTP API | Model chain |
| Email | **Resend** / UniSender | Notifications |
| Observability | **OpenTelemetry** + Grafana Cloud or self-hosted | Required day 1 |

**Innovation tokens spent:** 1 (pgvector in Postgres) — acceptable.

---

## System Architecture

```
                         ┌─────────────────────────────────────┐
                         │           CDN / Edge                │
                         └─────────────────┬───────────────────┘
                                           │
              ┌────────────────────────────┼────────────────────────────┐
              │                     Next.js App                        │
              │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
              │  │   Landing    │  │  Auth/Bill   │  │  LK (App)    │  │
              │  │   (marketing)│  │   pages      │  │  dashboard   │  │
              │  └──────────────┘  └──────────────┘  └──────────────┘  │
              └────────────────────────────┬───────────────────────────┘
                                           │ HTTPS / tRPC or REST
              ┌────────────────────────────▼───────────────────────────┐
              │                    API Gateway (NestJS)                 │
              │  auth │ tenants │ billing │ agents │ kb │ crm │ notify  │
              └─┬──────────┬──────────┬──────────┬──────────┬───────────┘
                │          │          │          │          │
        ┌───────▼──┐ ┌─────▼────┐ ┌───▼───┐ ┌────▼────┐ ┌──▼──────────┐
        │ Postgres │ │  Redis   │ │  S3   │ │ Workers │ │ Integration │
        │ +pgvector│ │  BullMQ  │ │Selectel│ │ (LLM,  │ │  Adapters   │
        └──────────┘ └──────────┘ └───────┘ │ ingest)│ └───┬────┬────┘
                                             └────────┘     │    │
                                                    ┌────────┘    └────────┐
                                                    ▼                    ▼
                                              OpenRouter            Avito / TG
                                                                    VK / MAX (v1.1)
```

---

## Module Boundaries

```
packages/
  shared/          # types, zod schemas, tool definitions
  ui/              # design system components
apps/
  web/             # Next.js marketing + app
  api/             # NestJS backend
  worker/          # BullMQ consumers
```

### Core domains

| Module | Responsibility |
|--------|----------------|
| `tenants` | org, users, roles, limits |
| `billing` | plans, ЮKassa, usage metering |
| `integrations` | adapter registry, OAuth tokens, webhooks |
| `agents` | assistants, prompts, skills, model config |
| `tools` | registry, JSON schemas, per-tool settings |
| `knowledge` | documents, chunks, embeddings, S3 |
| `conversations` | threads, messages, takeover state |
| `crm` | leads, clients, deals (schema v1, UI partial) |
| `calendar` | events, appointments (schema v1) |
| `notifications` | in-app, email, webhooks out |
| `coach` | admin agent sessions, training suggestions |

---

## Integration Adapter Pattern

```typescript
interface ChannelAdapter {
  id: 'avito' | 'telegram' | 'vk' | 'max';
  connect(accountId: string, credentials: unknown): Promise<Connection>;
  disconnect(connectionId: string): Promise<void>;
  sendMessage(connectionId: string, threadExtId: string, text: string): Promise<void>;
  verifyWebhook(req: Request): boolean;
  parseInbound(payload: unknown): InboundMessage[];
}

interface ExternalServiceAdapter {
  id: 'site_parser' | 'media_gen';
  invoke(params: unknown): Promise<unknown>; // stub returns NotImplemented
}
```

New adapter = register in DI container → appears in LK integrations list → no core code changes.

---

## Agent Runtime Flow

```
Inbound webhook
  → normalize message (integration adapter)
  → load thread + assistant binding
  → assemble context:
        - system prompt (preset + overrides)
        - skills enabled
        - tool manifest (auto from registry)
        - KB retrieval (top-k chunks)
        - dialog summary (rolling window + long-term store)
  → LLM chain (OpenRouter):
        1. router model: need tools? escalate?
        2. main model: reply or tool_calls
        3. tool executor (idempotent, audited)
        4. loop until final or max_steps
  → policy guard (forbidden topics, PII, channel rules)
  → persist outbound + side effects (lead, notification)
  → adapter.sendMessage
```

### Context memory

| Store | TTL | Content |
|-------|-----|---------|
| Redis | 24h | active session tokens, rate limits |
| Postgres `messages` | forever | raw messages |
| Postgres `conversation_summaries` | rolling | compressed context per thread |
| pgvector | forever | KB chunks |

---

## Data Model (core entities)

```
organizations ─┬─ users (role: owner|admin|operator)
               ├─ subscriptions (plan, yukassa_id, status)
               ├─ integrations (type, credentials_enc, enabled)
               ├─ assistants ─┬─ system_prompts
               │                ├─ skills[]
               │                ├─ tool_configs{}
               │                └─ knowledge_bases[]
               ├─ knowledge_documents (s3_key, status, source_type)
               ├─ knowledge_chunks (embedding vector)
               ├─ conversations ─ messages
               ├─ leads
               ├─ clients
               ├─ deals (v1.1 UI)
               ├─ calendar_events (v1.1 UI)
               └─ notifications
```

**Tenant isolation:** every query scoped by `organization_id`; row-level security optional phase 2.

---

## Tool Registry Schema

```json
{
  "id": "create_lead",
  "name": "Создать лид",
  "description": "Создаёт лид в CRM когда пользователь выражает намерение купить",
  "parameters": { "type": "object", "properties": { "name": {}, "phone": {}, "note": {} } },
  "settings_schema": {
    "default_pipeline_stage": "string",
    "auto_assign": "boolean"
  },
  "required_permissions": ["crm:write"]
}
```

On deploy/migration: `ToolRegistry.sync()` → updates `agent_tool_manifest` table → prompt builder reads latest.

---

## System Prompt Presets (implementation)

Store as versioned templates in DB + seed JSON:

```
presets/
  sales-assistant.ru.md
  support-assistant.ru.md
  avito-specialist.ru.md
  admin-coach.ru.md
```

Template variables: `{business_name}`, `{tone}`, `{forbidden_actions}`, `{enabled_tools_list}`.

---

## Knowledge Base Pipeline

```
Upload (pdf/docx/txt) or paste text or URL metadata
  → validate size/tariff limit
  → store original in S3 Selectel
  → job: extract text (pdf-parse, mammoth)
  → chunk (512-1024 tokens, overlap 128)
  → embed via OpenRouter embedding model
  → store in knowledge_chunks
  → status: ready | failed
```

URL-only v1: store URL + manual text; **site_parser adapter stub** for future fetch.

---

## Billing (ЮKassa)

```
Plan selection → create payment / subscription
  → redirect ЮKassa
  → webhook payment.succeeded
  → activate subscription + set limits
  → cron: usage reset monthly
  → block features on past_due
```

Store: `yookassa_payment_id`, receipt metadata, plan entitlements JSON.

---

## Notifications

| Event | Channels |
|-------|----------|
| New lead | in-app, email |
| Human takeover requested | in-app, push (later) |
| Integration disconnected | in-app, email |
| Usage 80% limit | in-app |
| Coach suggestion ready | in-app |

Event bus: `domain_events` table + BullMQ fanout.

---

## Security Architecture

| Threat | Mitigation |
|--------|------------|
| Tenant data leak | org_id on all queries; integration tests |
| OAuth token theft | encrypt at rest (AES-256-GCM, KMS/env key) |
| Webhook spoofing | HMAC signatures per adapter |
| Prompt injection | KB delimiter tags; system prompt hardening; output filter |
| LLM tool abuse | tool allowlist per assistant; confirm for destructive ops |
| Admin impersonation | audit log all admin dialog views |

---

## Error & Rescue Map (critical paths)

| Codepath | Failure | Action | User sees |
|----------|---------|--------|-----------|
| OpenRouter chat | 429 | exponential backoff 3x | «Ассистент занят, повтор...» |
| OpenRouter chat | malformed JSON tool call | retry once + log | fallback polite reply |
| Avito send | 401 | mark integration invalid + notify | «Переподключите Avito» |
| Avito send | timeout | retry 2x queue | delayed send |
| KB embed job | S3 fail | retry + dead letter | «Документ не обработан» |
| ЮKassa webhook | invalid sig | 401 + alert | (internal) |

No bare `catch (e) {}` — ever.

---

## Frontend Structure (LK)

```
/app
  (marketing)/          # landing, pricing, legal
  (auth)/               # login, register
  (onboarding)/         # wizard: plan → channel → agent → kb → test
  (dashboard)/
    inbox/              # conversations + takeover
    assistants/         # list, edit, test chat
    knowledge/          # docs, upload
    integrations/       # connect toggles
    leads/
    clients/
    settings/           # billing, team, notifications
    admin/              # coach, all dialogs (role gated)
```

**Premium UX notes:**

- Sticky test chat panel on assistant edit
- Integration cards with live status pulse
- Motion: page transitions 200ms, stagger lists, reduced-motion respect
- Mobile: bottom nav for inbox/leads/settings

---

## API Surface (v1 endpoints)

```
POST   /api/auth/register
POST   /api/billing/checkout
POST   /api/webhooks/yukassa
POST   /api/webhooks/telegram/:orgId
POST   /api/webhooks/avito/:orgId

GET    /api/conversations
POST   /api/conversations/:id/takeover
POST   /api/conversations/:id/reply

CRUD   /api/assistants
POST   /api/assistants/:id/test-chat

CRUD   /api/knowledge/documents
POST   /api/knowledge/documents/upload

GET    /api/integrations
POST   /api/integrations/:type/connect
DELETE /api/integrations/:id

GET    /api/tools/registry
PATCH  /api/assistants/:id/tools/:toolId/settings

GET    /api/leads
POST   /api/coach/sessions
```

---

## Test Diagram

```
                    ┌─────────────────────────────────────────┐
                    │           E2E (Playwright)              │
                    │ register → onboarding → test chat reply │
                    │ yukassa sandbox checkout                │
                    └────────────────────┬────────────────────┘
                                         │
        ┌────────────────────────────────┼────────────────────────────────┐
        │                         Integration                           │
        │  webhook telegram → agent runtime → lead created              │
        │  openrouter mock → tool create_lead                           │
        └────────────────────────────────┬────────────────────────────────┘
                                         │
        ┌────────────────────────────────┼────────────────────────────────┐
        │                          Unit / Component                       │
        │  tool registry schema validation                              │
        │  prompt builder injects all tools                             │
        │  kb chunker, embed job handler                                │
        │  billing entitlement checks                                   │
        │  adapter parseInbound fixtures                                │
        └─────────────────────────────────────────────────────────────────┘
```

### Test matrix (must-have v1)

| Area | Tests |
|------|-------|
| Auth | register, login, org isolation |
| Billing | plan limits, webhook activation |
| Agent runtime | tool loop, max steps, guardrails |
| KB | upload → chunk → retrieve relevance |
| Integrations | telegram webhook signature, avito mock |
| Takeover | assistant stops when operator active |
| Coach | admin-only access, suggestion audit |

Target: **80%+ coverage** on `agents`, `tools`, `knowledge`, `billing` modules.

---

## Deployment

```yaml
# docker-compose.staging.yml
services:
  web, api, worker, postgres, redis
```

Env secrets: `OPENROUTER_API_KEY`, `YUKASSA_*`, `S3_*`, `ENCRYPTION_KEY`, `DATABASE_URL`.

CI: lint → test → build images → deploy staging on main.

---

## Sprint Backlog (engineering)

| Sprint | Deliverable |
|--------|-------------|
| S1 | Monorepo, DB schema, auth, design tokens, landing shell |
| S2 | Landing premium + pricing + ЮKassa sandbox |
| S3 | Tool registry + assistant CRUD + prompt presets |
| S4 | KB pipeline + S3 + test chat |
| S5 | Telegram adapter + inbox UI |
| S6 | Avito adapter + leads + takeover |
| S7 | Notifications + admin viewer + coach agent |
| S8 | Hardening, E2E, production launch |

---

## Deferred (explicit)

- VK/MAX adapter implementations (interfaces ready)
- Calendar/deals UI (DB tables migrated empty)
- site_parser, media_gen real implementations
- pg → Qdrant migration path documented

---

## GSTACK REVIEW REPORT

**Skill:** plan-eng-review  
**Design doc:** docs/designs/2026-06-16-botme-platform-design.md  
**CEO plan:** docs/plans/2026-06-16-ceo-review.md  
**Date:** 2026-06-16

### VERDICT: APPROVED — READY FOR DESIGN + SPEC

Architecture locked as **modular monolith** with adapter ports for channels and external services. Agent runtime uses OpenRouter model chain, extensible tool registry with auto prompt injection, Selectel S3 + pgvector for KB.

### Architecture decisions locked

1. Next.js + NestJS + Postgres + Redis + BullMQ
2. Integration adapter interface for Avito/TG/VK/MAX
3. External service adapter stubs for parser/media
4. Tenant-scoped data model with encrypted integration credentials
5. Test chat + human takeover as first-class conversation states
6. Admin coach agent on separate stronger model tier

### Hardening required before prod

- Rate limits per org and per channel
- LLM cost metering tied to tariff
- Webhook idempotency keys
- Audit log for admin dialog access

### Open questions for user (non-blocking)

1. NestJS separate vs Next.js API routes only? **Recommend NestJS** if >2 integrations in v1.
2. Primary language UI: RU only v1? **Assume RU**.
3. Avito API access — do you already have partner credentials?

### Next steps

1. **gstack-design-consultation** — DESIGN.md, tokens, landing components
2. **gstack-spec** — GitHub issues per sprint
3. Begin S1 scaffold after design approval

**STATUS:** DONE
