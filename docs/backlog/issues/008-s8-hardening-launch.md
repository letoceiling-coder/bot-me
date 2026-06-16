# S8: Hardening, E2E, production launch

## Why

Ship safely after feature complete wedge.

## Target

- Rate limits per org + channel
- LLM cost metering tied to tariff
- Webhook idempotency keys
- Playwright E2E: register → onboarding → test chat → sandbox payment
- Security review checklist (CSO skill)
- Production deploy docs + docker-compose prod
- VK/MAX adapter stubs documented

## Scope IN

- E2E test suite
- Observability: health endpoints, structured logs
- Load test smoke on inbox webhook
- README deploy section

## Scope OUT

- VK/MAX live integrations

## Done when

- [ ] CI green: lint + unit + E2E
- [ ] Staging deploy runbook verified
- [ ] 80%+ coverage on agents, tools, knowledge, billing modules

## Refs

Eng review hardening + test matrix
