# botme

Telegram bot project. AI-assisted development uses **gstack** workflows.

## gstack setup (one time)

Skills are installed globally in Cursor (`~/.cursor/skills/gstack-*`). Runtime binaries link to the local gstack checkout:

```powershell
.\scripts\setup-gstack.ps1
```

Source: `C:\Users\dsc-2\projects\gstack`

## Development with gstack

See [AGENTS.md](AGENTS.md) for the full skill catalog and routing rules.

**Product plans:** [docs/README.md](docs/README.md)

Typical flow:

1. **gstack-office-hours** — define what you're building
2. **gstack-plan-ceo-review** / **gstack-plan-eng-review** — plan
3. Build
4. **gstack-review** / **gstack-qa** — verify
5. **gstack-ship** — PR

Cursor rule `.cursor/rules/gstack.mdc` enforces using gstack skills during all work in this repo.

## Design System

Always read [DESIGN.md](DESIGN.md) before UI work. Preview: [docs/design-preview/index.html](docs/design-preview/index.html).

- UI language: **Russian only (v1)**
- Integration credentials: **per-user** (Avito, Telegram, VK, MAX)
