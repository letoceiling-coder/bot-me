# Production deploy — botme

Reference: [`deploy/deploy.sh`](../deploy/deploy.sh) and [gstack ship workflow](file:///C:/Users/dsc-2/projects/botme/.cursor/skills/gstack/SKILL.md).

## Server

- **Host:** `root@212.67.9.173`
- **App dir:** `/var/www/bot-me.neeklo.ru`
- **URL:** https://bot-me.neeklo.ru

## First-time setup

1. Clone repo to `/var/www/bot-me.neeklo.ru`
2. Copy `.env.production.example` → `.env` and fill:
   - `POSTGRES_PASSWORD`, `JWT_SECRET`, `ENCRYPTION_KEY` (64 hex chars)
   - `WEB_ORIGIN=https://bot-me.neeklo.ru`
   - `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`
3. Run `bash deploy/deploy.sh`

## Routine deploy (after push to `main`)

```bash
ssh root@212.67.9.173 "bash /var/www/bot-me.neeklo.ru/deploy/deploy.sh"
```

The script:

1. `git fetch && git reset --hard origin/main`
2. `docker compose -f docker-compose.prod.yml build`
3. `prisma migrate deploy` + seed
4. Restart api/web containers
5. Reload nginx

## Verify (gstack QA)

```bash
curl https://bot-me.neeklo.ru/api/health
# → {"status":"ok","checks":{"api":"ok","database":"ok"},...}
```

Check landing, login, dashboard inbox after deploy.

## Local CI before push

```bash
npm run lint
npm run build
npm run test --workspace=@botme/api
npx playwright test -c e2e/playwright.config.ts
```

## VK / MAX (stubs)

Adapters not implemented in v1. Schema supports integration types `vk`, `max` — see backlog S9+.

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| API 502 | `docker compose -f docker-compose.prod.yml logs api` |
| Migration failed | Run migrate manually in api container |
| Telegram webhook 403 | Re-connect integration (new webhook secret) |
| LLM limit hit | `/api/billing/usage` — upgrade tariff |
