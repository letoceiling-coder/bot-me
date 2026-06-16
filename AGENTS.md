# botme — AI Engineering Workflow

This project is configured to use **gstack** from `C:/Users/dsc-2/projects/gstack` for all AI-assisted development in Cursor.

Skills live in `~/.cursor/skills/gstack-*` (global) and `.cursor/skills/gstack/` (project runtime: bin, browse, assets).

## Before any work

Verify gstack runtime is available:

```powershell
Test-Path .cursor/skills/gstack/bin/gstack-config
Test-Path .cursor/skills/gstack/browse/dist/browse.exe
```

Both should return `True`. If not, re-run `scripts/setup-gstack.ps1`.

## Available skills

Invoke by name in chat (e.g. "run gstack-office-hours") or use the Skill tool when available.

### Plan-mode reviews

| Skill | What it does |
|-------|-------------|
| gstack-office-hours | Start here. Reframes your product idea before you write code. |
| gstack-plan-ceo-review | CEO-level review: find the 10-star product in the request. |
| gstack-plan-eng-review | Lock architecture, data flow, edge cases, and tests. |
| gstack-plan-design-review | Rate each design dimension 0-10. |
| gstack-plan-devex-review | DX-mode review: TTHW, friction points. |
| gstack-plan-tune | Self-tune AskUserQuestion sensitivity. |
| gstack-autoplan | One command runs CEO → design → eng → DX review. |
| gstack-design-consultation | Build a complete design system from scratch. |
| gstack-spec | Turn vague intent into a precise, executable spec. |

### Implementation + review

| Skill | What it does |
|-------|-------------|
| gstack-review | Pre-landing PR review. |
| gstack-investigate | Systematic root-cause debugging. |
| gstack-design-review | Live-site visual audit + fix loop. |
| gstack-design-shotgun | Generate multiple AI design variants. |
| gstack-design-html | Production-quality Pretext-native HTML/CSS. |
| gstack-devex-review | Live developer experience audit. |
| gstack-qa | Open a real browser, find bugs, fix them, re-verify. |
| gstack-qa-only | Same as gstack-qa but report only. |
| gstack-browse | Headless browser — real Chromium, ~100ms/command. |

### Release + deploy

| Skill | What it does |
|-------|-------------|
| gstack-ship | Run tests, review, push, open PR. |
| gstack-land-and-deploy | Merge PR, wait for CI/deploy, verify prod. |
| gstack-canary | Post-deploy monitoring loop. |
| gstack-document-release | Update docs to match what you shipped. |
| gstack-setup-deploy | One-time deploy config detection. |
| gstack-gstack-upgrade | Update gstack to the latest version. |

### Operational + memory

| Skill | What it does |
|-------|-------------|
| gstack-context-save | Save working context (git state, decisions). |
| gstack-context-restore | Resume from saved context. |
| gstack-learn | Manage what gstack learned across sessions. |
| gstack-retro | Weekly retro with shipping streaks. |
| gstack-health | Code quality dashboard. |
| gstack-cso | OWASP Top 10 + STRIDE security audit. |

### Safety

| Skill | What it does |
|-------|-------------|
| gstack-careful | Warn before destructive commands. |
| gstack-freeze / gstack-guard / gstack-unfreeze | Restrict edits to one directory. |

## Recommended sprint flow

**Think → Plan → Build → Review → Test → Ship → Reflect**

1. gstack-office-hours — describe what you're building
2. gstack-plan-ceo-review → gstack-plan-eng-review
3. Implement
4. gstack-review → gstack-qa
5. gstack-ship

## Design System

Always read [DESIGN.md](DESIGN.md) before making any visual or UI decisions. In QA mode, flag code that doesn't match DESIGN.md.

- UI: Russian only (v1)
- Aesthetic: Trusted Intelligence (see DESIGN.md)
- Integration API keys: each user enters their own in LK

## Skill routing

When the user's request matches an available skill, invoke it via the Skill tool. When in doubt, invoke the skill. Do not answer ad-hoc when a structured gstack workflow exists.
