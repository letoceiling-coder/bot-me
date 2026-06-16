# S5: Telegram adapter, unified inbox UI

## Why

First live channel — highest adoption for RU SMB.

## Target

- Integration adapter `telegram`
- User enters **own bot token** in LK (encrypted at rest)
- Webhook endpoint per org
- Inbox UI: conversation list + thread view (Russian)
- Inbound → agent runtime (from S4) → outbound reply
- Connection status card with pulse indicator

## Scope IN

- TelegramAdapter implements ChannelAdapter interface
- conversations + messages tables populated
- Master-detail inbox layout per DESIGN.md

## Scope OUT

- Avito (S6)
- Human takeover (S6)

## Done when

- [ ] Real Telegram bot receives message → assistant replies in thread
- [ ] Disconnect clears webhook

## Refs

Eng review Integration Adapter Pattern
