# S1: Monorepo, auth, DB schema, design tokens

## Why

Greenfield foundation for botme. Without monorepo + auth + schema, no sprint can ship safely.

## Who

Solo dev / team implementing botme platform.

## Current behavior

Empty repo with docs only.

## Target behavior

Runnable monorepo: Next.js web shell, NestJS API, Postgres via Prisma, JWT auth, org/roles, design tokens from DESIGN.md, Docker Compose for local dev.

## Done when

- [ ] `npm install` + `docker compose up -d` + migrations apply
- [ ] POST `/api/auth/register` and `/api/auth/login` return JWT
- [ ] Web shows Russian shell with sidebar layout matching DESIGN.md
- [ ] Prisma schema includes core entities (org, user, integration stub tables)
- [ ] CI workflow runs lint on push

## Scope IN

- pnpm/npm workspaces: `apps/web`, `apps/api`, `packages/shared`, `packages/ui`
- NestJS API with auth module (register, login, JWT, guards)
- Prisma schema: Organization, User, UserRole enum, Session optional
- Stub tables: Integration, Assistant, KnowledgeBase (schema only, minimal API)
- Next.js 15 App Router, Russian UI shell, Tailwind + tokens from DESIGN.md
- docker-compose: postgres 16, redis 7
- `.env.example` documented
- GitHub Actions: lint

## Scope OUT

- ЮKassa, OpenRouter, S3, channel adapters
- Full CRUD for assistants/KB
- Landing marketing pages (S2)

## Technical notes

- Stack: Next.js 15 + NestJS + Prisma + PostgreSQL + Redis
- UI: Russian only
- Integration credentials: per-user fields on Integration model (`credentialsEnc` JSON), not global env
- Auth: bcrypt passwords, JWT access token 7d, org created on register
- Reference: `docs/plans/2026-06-16-eng-review.md`, `DESIGN.md`

## Acceptance tests

1. Register user → org created → login → GET `/api/auth/me` returns user + org
2. Invalid login → 401
3. Web `/` redirects or shows dashboard shell in Russian

## Rollback

Delete branch; no production yet.
