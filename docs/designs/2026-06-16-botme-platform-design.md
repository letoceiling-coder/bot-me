---
status: APPROVED
mode: startup
branch: main
generated_by: gstack-office-hours
date: 2026-06-16
---

# Design Doc: botme — Multichannel AI Business Desk

## Executive Summary

**botme** — SaaS-платформа, где владелец малого бизнеса за один вечер подключает Avito, Telegram, VK и MAX, обучает AI-ассистента на своих документах и получает единый кабинет: лиды, переписки, календарь, сделки, перехват диалога оператором.

**Рефрейм:** вы строите не «конструктор обучения агентов», а **AI-операционный стол для продаж и сервиса** — ассистент, который знает прайс, ведёт диалог, создаёт лиды и не теряет клиента между каналами.

**Рекомендуемый wedge (v1):** Avito + Telegram + лендинг + тарифы + ЮKassa + ЛК с базой знаний, тестовым чатом и ручным перехватом. VK и MAX — v1.1. CRM-модули (календарь, сделки, записи) — поэтапно, но архитектурно заложены с первого дня.

---

## Problem Statement

### Что болит у клиента

Владелец бизнеса на Avito/TG/VK/MAX:

- отвечает в 4 мессенджерах вручную, теряет лиды ночью и в выходные;
- не может «обучить» типовые ответы без программиста;
- не видит единую картину: кто написал, на каком этапе, что обещали;
- боится «глупого бота», который испортит репутацию.

### Status quo (настоящий конкурент)

- Ручные ответы + заметки + Excel/Google Sheets;
- разрозненные автоответчики без контекста;
- CRM (Amo, Bitrix) без нативной связки с Avito/MAX и без «обучаемого» ассистента из коробки.

### Demand signal (из вашего ТЗ)

Вы описали **полный операционный контур**, а не «чат-виджет». Это сигнал, что целевой пользователь уже платит временем и деньгами за обходные решения.

---

## Target User (v1)

| Поле | Значение |
|------|----------|
| Кто | Владелец или админ малого бизнеса (1–15 человек) |
| Где продаёт | Avito, Telegram, позже VK, MAX |
| Отрасли | услуги, ремонт, авто, недвижимость, B2C-розница |
| Техграмотность | низкая–средняя; нужен «понятный как WhatsApp» интерфейс |
| Готовность платить | после первого «ассистент ответил пока я спал» |

**Desperate specificity:** менеджер Avito-объявлений, который теряет 3–5 заявок в день из-за медленных ответов.

---

## Product Vision (12 months)

```
Сегодня                          v1 wedge                    12-month ideal
────────                         ────────                    ──────────────
4 канала вручную        →    1 ассистент + 2 канала    →   Полный AI desk:
Excel лидов                    + KB + billing                 все каналы,
Нет контекста                  + human takeover               admin-coach agent,
                               + notifications                media gen, site parse,
                                                              deals pipeline, analytics
```

---

## Premises (согласованы из ТЗ)

1. **Мультиканальность обязательна**, но релиз по каналам: TG+Avito first.
2. **База знаний — ядро продукта**, хранится в S3 Selectel, привязана к агенту.
3. **Модели — cost-aware:** OpenRouter free/cheap chain для ассистентов; отдельная цепочка для admin-coach agent.
4. **Инструменты расширяемы:** plugin registry; новый tool автоматически попадает в system prompt агента.
5. **ЮKassa** — единственный платёжный провайдер v1.
6. **Парсинг сайтов и генерация медиа** — внешние сервисы через adapter layer (stub → реализация позже).
7. **Premium UX** — не «админка Bootstrap», а адаптивный marketing + app shell уровня Stripe/Linear.

---

## Approaches Considered

### APPROACH A: Monolith MVP (Fast wedge)

Next.js full-stack + PostgreSQL + Redis + worker queue.  
**Effort:** M | **Risk:** Low | **Completeness:** 7/10

- Pros: быстрый time-to-market, один деплой, проще биллинг и auth.
- Cons: интеграции и LLM-воркеры в одном процессе — позже нужен split.

### APPROACH B: Modular monolith + integration adapters (RECOMMENDED)

Next.js (web) + NestJS/FastAPI API + Postgres + Redis + BullMQ + S3 Selectel.  
**Effort:** L | **Risk:** Med | **Completeness:** 9/10

- Pros: чёткие границы: Integrations / Agents / CRM / Billing; расширяемость без переписывания.
- Cons: больше начальной настройки.

### APPROACH C: Microservices day one

Отдельные сервисы на каждый канал + agent runtime + billing.  
**Effort:** XL | **Risk:** High | **Completeness:** 10/10 long-term, 4/10 v1

- Pros: scale story.
- Cons: убьёт скорость для solo/small team; отклонено для v1.

**RECOMMENDATION:** Approach B — modular monolith с adapter ports для Avito/TG/VK/MAX, OpenRouter, ЮKassa, будущих парсеров и media-gen.

---

## Recommended v1 Scope

### In scope (MVP)

| Область | Функции |
|---------|---------|
| Marketing | Premium landing, анимации, адаптив, тарифы, FAQ, CTA |
| Auth | Email + OAuth (optional phase 2), org/workspace |
| Billing | Тарифы, trial, ЮKassa subscription/one-time |
| Integrations | Avito + Telegram connect/disconnect, webhook ingest |
| Agents | 1+ assistants, system prompts (presets), skills, tool config |
| Knowledge | Upload docs, text, URLs metadata; S3 storage; chunk + embed |
| Conversations | Inbox, threads, test chat, human takeover |
| Leads | Auto-create from dialog rules, manual edit |
| Notifications | In-app + email (Telegram admin bot optional) |
| Admin | View all dialogs, coach agent via admin agent |
| Tools (v1) | create_lead, create_client, schedule_meeting, send_notification, webhook_call, search_kb, handoff_human |

### v1.1 (fast follow)

- VK, MAX integrations
- Clients, calendar, appointments, price lists, deals pipeline
- Site parser adapter
- Media generation adapter

### NOT in scope v1

- White-label reseller portal
- Mobile native apps
- Custom model fine-tuning
- On-prem deploy

---

## System Prompt Presets (catalog v1)

| Preset | Роль | Делает | Не делает |
|--------|------|--------|-----------|
| Sales Assistant | Менеджер по продажам | квалификация, прайс, запись, лид | юридические гарантии, скидки без правил |
| Support Assistant | Поддержка | FAQ, статус, эскалация | возвраты без политики |
| Avito Specialist | Объявления | уточнение товара, торг в рамках | перевод off-platform без согласия |
| Admin Coach | Тренер для владельца | анализ переписок, предложения промптов | изменения без approve |

Каждый preset = system prompt + allowed tools + skill tags + exception rules.

---

## Tool Registry (extensible)

```yaml
tools:
  - id: create_lead
    category: crm
    settings: [auto_on_intent, pipeline_stage, assignee]
  - id: create_client
  - id: schedule_meeting
  - id: send_notification
  - id: call_webhook
  - id: search_knowledge_base
  - id: request_human_handoff
  - id: get_price_list
  - id: create_deal  # v1.1
```

**Auto-discovery:** при регистрации tool → JSON schema + description → inject в agent runtime manifest → prompt builder подхватывает без ручного деплоя.

---

## Model Chain (assistants)

```
User message
    → intent router (cheap/free)
    → context assembly (KB retrieval + dialog memory + CRM facts)
    → planner (optional, complex cases)
    → responder (quality model)
    → tool executor loop (max N steps)
    → guardrails (policy + PII + channel rules)
    → outbound message
```

OpenRouter models (example tiers):

- Router/summary: `google/gemma-2-9b-it:free` or similar free tier
- Main reply: `anthropic/claude-3-haiku` / `openai/gpt-4o-mini` (cost/quality)
- Admin coach: stronger model on demand only

---

## UX Principles

1. **Один экран — одна задача** (подключить канал, обучить, протестировать).
2. **Wizard > settings matrix** для первого запуска.
3. **Test chat always visible** при настройке агента.
4. **Premium visual:** typography scale, motion on scroll, dark/light, mobile-first.
5. **Status everywhere:** интеграция OK / ассистент активен / лимит тарифа.

---

## What I Noticed (founder signals)

- Вы мыслите **платформой**, не фичей — правильно, но нужен жёсткий wedge.
- Сильный акцент на **admin-coach agent** — дифференциатор vs конкуренты.
- Риск: построить CRM+AI+integrations одновременно → рекомендован phased delivery.

---

## The Assignment

1. Утвердить wedge: **Avito + Telegram + KB + billing + inbox + takeover**.
2. Зафиксировать стек (см. eng review).
3. Запустить **gstack-design-consultation** для premium design system лендинга и ЛК.
4. Разбить MVP на 6 спринтов (см. eng plan).

---

## Handoff

Downstream skills:

- `/plan-ceo-review` — scope & ambition
- `/plan-eng-review` — architecture lock
- `/design-consultation` — DESIGN.md + tokens
- `/spec` — GitHub issues / backlog
