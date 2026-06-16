---
status: ACTIVE
generated_by: gstack-plan-ceo-review
date: 2026-06-16
mode: SELECTIVE_EXPANSION
design_doc: docs/designs/2026-06-16-botme-platform-design.md
---

# CEO Plan: botme Platform

Branch: main | Mode: SELECTIVE EXPANSION  
Repo: botme

---

## Step 0A: Premise Challenge

| # | Question | Verdict |
|---|----------|---------|
| 1 | Правильная ли проблема? | Да — **multichannel revenue leakage**, не «обучение агентов». |
| 2 | Outcome | Больше закрытых лидов при меньшем времени владельца. |
| 3 | Do nothing | Потеря заявок, выгорание, хаос в переписках. |

**Reframe locked:** botme = **AI Business Desk for Russian SMB multichannel sales**.

---

## Step 0B: Existing Code Leverage

Greenfield. Leverage:

- gstack workflows для delivery
- OpenRouter, ЮKassa SDK, Avito/TG API docs
- Selectel S3-compatible API

Нет смысла форкать готовую CRM — интегрировать позже через webhooks.

---

## Step 0C: Dream State (12 months)

```
CURRENT          →  THIS PLAN (6 mo)        →  IDEAL
Manual 4 apps       Unified inbox + AI         Autonomous revenue desk:
No AI training      KB + coach agent           predictive follow-ups,
Lost leads          Billing + 2 channels       full CRM, media, site ingest,
                    Premium UX                 marketplace of skills/tools
```

---

## Step 0C-bis: Implementation Alternatives

### APPROACH A: Landing + waitlist only
**Effort:** S | **Risk:** Low | **Completeness:** 3/10  
Validate demand before build. Не даёт вашему ТЗ ценности.

### APPROACH B: Modular monolith (RECOMMENDED)
**Effort:** L | **Risk:** Med | **Completeness:** 9/10  
Полный wedge с архитектурой под расширение.

### APPROACH C: Buy white-label chatbot + skin
**Effort:** M | **Risk:** High | **Completeness:** 5/10  
Быстро, но не Avito-native, не coach agent, не ваш premium UX.

**RECOMMENDATION:** B — единственный путь к заявленному premium + extensibility.

**Decision (auto-approved from user brief):** Approach B accepted.

---

## Step 0F: Mode — SELECTIVE EXPANSION

Baseline = design doc v1 scope.  
Cherry-pick expansions evaluated below.

---

## Scope Decisions

| # | Proposal | Effort | Decision | Reasoning |
|---|----------|--------|----------|-----------|
| 1 | Avito + TG only v1 | M | **ACCEPTED** | Wedge |
| 2 | VK + MAX v1 | M | **DEFERRED v1.1** | Same adapter pattern, не блокирует MVP |
| 3 | Full CRM (deals, calendar) v1 | L | **DEFERRED v1.1** | Schema now, UI later |
| 4 | Admin coach agent v1 | M | **ACCEPTED** | Key differentiator |
| 5 | Site parser adapter stub | S | **ACCEPTED** | Port only |
| 6 | Media gen adapter stub | S | **ACCEPTED** | Port only |
| 7 | Premium landing animations | M | **ACCEPTED** | Conversion critical |
| 8 | OpenRouter free-only chain | S | **ACCEPTED** with fallback paid | Cost control |
| 9 | White-label / agency mode | XL | **SKIPPED** | Post-PMF |

---

## Accepted Scope (CEO-approved)

### Phase 0 — Foundation (2 weeks)
- Monorepo, CI, staging/prod, design tokens shell
- Auth, org, roles (owner, admin, operator)

### Phase 1 — Growth surface (2 weeks)
- Premium landing + pricing + ЮKassa checkout
- Registration → onboarding wizard

### Phase 2 — Agent core (3 weeks)
- Assistant CRUD, preset prompts, skills, tool registry
- KB: upload → S3 Selectel → chunk → embed → retrieve
- Test chat + model chain OpenRouter

### Phase 3 — Channels (3 weeks)
- Telegram bot/webhook integration
- Avito messaging integration
- Unified inbox + human takeover

### Phase 4 — Business ops (2 weeks)
- Leads, clients (basic), notifications
- Admin dialog viewer + coach agent sessions

### Phase 5 — Hardening (2 weeks)
- Billing limits per tariff, audit logs, rate limits
- QA, security review, launch

**Total:** ~14 weeks human calendar / ~2–3 weeks intensive CC+gstack sprints

---

## 10-Star Product Check

| Dimension | Current plan | 10-star version |
|-----------|--------------|-----------------|
| Time-to-value | 30 min to first test reply | 5 min: paste Avito URL → auto KB |
| Trust | Test chat + takeover | «Assistant said X» approval mode |
| Differentiation | Coach agent | Weekly «conversation insights» digest |
| Pricing | 3 tiers | Usage-based + channel add-ons |

**10-star wedge for marketing:** «Подключите Avito и Telegram — ассистент начнёт отвечать сегодня вечером».

---

## Section Summaries (CEO Review)

### 1. Architecture — PASS with note
Modular monolith + adapter ports — правильно для stage. Platform event bus заложить early.

### 2. Error & Rescue — GAP flagged
LLM malformed JSON, channel API 429 — must be in eng plan (delegated).

### 3. Security — PASS with conditions
OAuth tokens encrypted, tenant isolation, prompt injection guard — mandatory.

### 4. Data Flow — PASS
Per-tenant KB isolation, conversation ownership model clear.

### 5. UX / Go-to-market — STRONG
Premium landing + wizard onboarding = correct for low-tech users.

### 6. Monetization — PASS
3 tiers suggested:
- **Start** — 1 assistant, 1 channel, 500 dialog msgs/mo
- **Pro** — 3 assistants, 2 channels, KB 5GB, coach agent
- **Business** — unlimited channels, operators, webhooks, priority support

### 7. Competitive — Moat = coach + Avito-native + RU stack (ЮKassa, Selectel)

### 8. Ops — Need status page + integration health dashboard v1

### 9. Team — Solo feasible with gstack; hire integration specialist at v1.1

### 10. Verdict — SHIP phased wedge, resist CRM big-bang

---

## NOT in Scope (CEO)

- Native mobile apps
- Custom model training
- Marketplace third-party skills (v2)
- MAX/VK UI in v1 (adapters only in codebase)

---

## GSTACK REVIEW REPORT

**Skill:** plan-ceo-review  
**Mode:** SELECTIVE EXPANSION  
**Design doc:** docs/designs/2026-06-16-botme-platform-design.md  
**Date:** 2026-06-16

### VERDICT: APPROVED_WITH_PHASED_SCOPE

The product is ambitious but correctly reframed as an **AI Business Desk**, not a generic agent trainer. CEO-approved wedge: **landing + billing + Avito/TG + KB + inbox + takeover + coach agent**. VK, MAX, full CRM modules deferred to v1.1 with schema prepared now.

### Key decisions locked

1. Modular monolith (Approach B)
2. OpenRouter model chain with cost tiers
3. S3 Selectel for KB artifacts
4. Extensible tool registry with auto prompt injection
5. Premium UX non-negotiable for landing and LK

### Risks accepted

- Integration API instability (Avito)
- LLM cost overrun without tariff limits
- Scope creep if CRM modules ship before inbox is excellent

### Recommended next steps

1. gstack-plan-eng-review (architecture lock) — **DONE in companion doc**
2. gstack-design-consultation — premium design system
3. gstack-spec — sprint backlog as issues

**STATUS:** DONE
