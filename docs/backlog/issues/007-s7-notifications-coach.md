# S7: Notifications, admin dialog viewer, coach agent

## Why

Ops visibility + differentiated admin-coach value.

## Target

- Notification service: in-app + email (new lead, takeover request, integration error, usage 80%)
- Admin role: view all org dialogs (audit logged)
- Coach agent sessions: analyze threads, suggest prompt improvements (stronger model tier)
- Admin UI pages under `/admin`

## Scope IN

- notifications module + event bus
- coach module API
- Role guard: owner/admin/operator
- AuditLog table for admin views

## Scope OUT

- Push notifications mobile

## Done when

- [ ] New lead triggers in-app notification
- [ ] Admin opens any dialog → audit entry created
- [ ] Coach session returns suggestion list in Russian

## Refs

Design doc admin-coach preset
