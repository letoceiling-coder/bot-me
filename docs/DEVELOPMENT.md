# botme — локальная разработка

## Требования

- Node.js 20+
- Docker Desktop (Postgres + Redis)

## Первый запуск

```powershell
# 1. Зависимости
npm install

# 2. Окружение
Copy-Item .env.example .env
Copy-Item .env.example apps\api\.env

# 3. База данных
docker compose up -d
npm run db:generate
npm run db:push

# 4. Сборка shared
npm run build --workspace=@botme/shared

# 5. Запуск (два терминала)
npm run dev:api
npm run dev:web
```

- Web: http://localhost:3000
- API: http://localhost:3001/api/health

## Регистрация (API)

```powershell
Invoke-RestMethod -Method POST -Uri http://localhost:3001/api/auth/register `
  -ContentType "application/json" `
  -Body '{"email":"demo@example.com","password":"password123","organizationName":"Демо Компания"}'
```

## Backlog → GitHub

```powershell
winget install GitHub.cli
gh auth login
.\scripts\file-backlog-issues.ps1
```
