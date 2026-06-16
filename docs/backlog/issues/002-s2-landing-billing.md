# S2: Premium landing, pricing, ЮKassa sandbox

## Why

Conversion surface + monetization before feature depth.

## Target

- Marketing landing (RU): hero, features bento, pricing 3 tiers, FAQ, animations per DESIGN.md
- Registration flow → plan selection
- ЮKassa sandbox: checkout session, webhook `payment.succeeded`, activate subscription
- Entitlements JSON on Organization blocks features by plan

## Scope IN

- Landing pages `(marketing)/` route group
- Plans: Start / Pro / Business (from CEO review)
- Billing module in API: plans, subscriptions, yookassa webhooks
- Framer Motion scroll animations, reduced-motion support

## Scope OUT

- Agent/KB features
- Production ЮKassa keys (sandbox only)

## Done when

- [ ] Landing responsive 375–1440px
- [ ] Sandbox payment activates plan in DB
- [ ] E2E: register → select plan → mock/sandbox checkout

## Refs

`DESIGN.md`, `docs/plans/2026-06-16-ceo-review.md`
