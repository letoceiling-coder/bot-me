# S6: Avito adapter, leads, human takeover

## Why

Wedge channel #2 + CRM hook + operator control.

## Target

- Avito adapter — user provides **own API credentials** in LK form
- Auto create_lead tool wired to CRM module
- Human takeover: operator sends message → assistant paused for thread
- Leads list UI (Russian)

## Scope IN

- AvitoAdapter + credential form fields
- Lead CRUD API + UI
- Conversation state: `bot_active` | `human_active`
- Takeover button in thread

## Scope OUT

- VK/MAX implementations (schema ready)

## Done when

- [ ] Avito message → lead created when intent detected
- [ ] Takeover → bot stops replying until released

## Refs

User clarification: per-user Avito/TG/VK credentials
