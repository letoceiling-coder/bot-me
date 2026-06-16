# botme — Design System

Source of truth for all UI. Read before any visual work. UI language: **Russian only (v1)**.

## Product Context

**botme** — premium SaaS для малого бизнеса: AI-ассистент отвечает в Avito, Telegram, VK, MAX; владелец управляет обучением, интеграциями и переписками из одного кабинета.

**Memorable thing:** «Ваш бизнес не спит — и ассистент тоже».

**Audience:** владельцы и админы без технического бэкграунда. Интерфейс должен ощущаться как современный банковский/CRM продукт, не как «очередной AI-чат».

---

## Aesthetic Direction

**Name:** Trusted Intelligence

**Mood:** спокойная уверенность, ночная премиальность, живой акцент без «AI-purple slop».

**Principles:**

1. Clarity over decoration — каждый экран отвечает на один вопрос.
2. Depth through layering — мягкие поверхности, тонкие бордеры, без flat Bootstrap.
3. Motion with purpose — анимации объясняют состояние, не украшают.
4. Cyrillic-first — шрифты и line-height оптимизированы под русский текст.

**Avoid:** фиолетовые градиенты, 3-колоночные icon-grid hero, decorative blobs, Inter/Roboto как единственный шрифт, английский UI в v1.

---

## Typography

| Role | Font | Weight | Size (desktop) | Line-height |
|------|------|--------|----------------|-------------|
| Display | **Manrope** | 700–800 | 48–64px (hero) | 1.05 |
| H1 | Manrope | 700 | 32px | 1.15 |
| H2 | Manrope | 600 | 24px | 1.2 |
| H3 | Manrope | 600 | 18px | 1.3 |
| Body | **Onest** | 400–500 | 16px | 1.55 |
| Small | Onest | 400 | 14px | 1.45 |
| Caption | Onest | 500 | 12px | 1.4 |
| Mono | **JetBrains Mono** | 400 | 13px | 1.5 |

**Loading:** Google Fonts — Manrope, Onest, JetBrains Mono (cyrillic subsets).

**Landing headlines:** tight tracking `-0.02em`. Body: normal.

---

## Color

### Dark theme (primary — LK + optional landing)

```css
:root {
  --bg-base: #070B14;
  --bg-elevated: #0E1524;
  --bg-surface: #141E32;
  --bg-muted: #1A2740;
  --border-subtle: rgba(255, 255, 255, 0.06);
  --border-strong: rgba(255, 255, 255, 0.12);
  --text-primary: #F4F7FB;
  --text-secondary: #9AADCC;
  --text-muted: #6B7F9E;
  --accent: #2DD4BF;
  --accent-hover: #14B8A6;
  --accent-muted: rgba(45, 212, 191, 0.12);
  --gold: #E8C468;
  --gold-muted: rgba(232, 196, 104, 0.15);
  --success: #34D399;
  --warning: #FBBF24;
  --error: #F87171;
  --info: #60A5FA;
  --channel-avito: #00AAFF;
  --channel-telegram: #29B6F6;
  --channel-vk: #0077FF;
  --channel-max: #7C3AED;
}
```

### Light theme (landing sections alternate)

```css
[data-theme="light"] {
  --bg-base: #F8FAFC;
  --bg-elevated: #FFFFFF;
  --bg-surface: #F1F5F9;
  --text-primary: #0F172A;
  --text-secondary: #475569;
  --accent: #0D9488;
}
```

**Accent usage:** teal для CTA и активных состояний; gold для premium badges («Pro», «Рекомендуем»).

---

## Spacing

Base unit: **4px**. Scale: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96.

| Context | Padding |
|---------|---------|
| Card | 20–24px |
| Section (landing) | 80px vertical (desktop), 48px (mobile) |
| App page | 24px (desktop), 16px (mobile) |
| Input height | 44px (touch-friendly) |
| Button height | 44px default, 36px compact |

---

## Layout

### Landing

- Max width content: **1200px**
- Hero: asymmetric — текст 55% / визуал 45%
- Features: bento grid (2+1 или 1+2), не равные 3 колонки
- Pricing: 3 cards, средняя выделена (scale 1.02 + gold border)

### App (LK)

- Sidebar: **260px** fixed (desktop), drawer (mobile)
- Top bar: 56px — org name, notifications, avatar
- Content max-width: **1280px**
- Inbox: master-detail (list + thread), test chat — sticky panel справа на xl

**Breakpoints:** sm 640, md 768, lg 1024, xl 1280, 2xl 1536

---

## Components

### Buttons

| Variant | Use |
|---------|-----|
| Primary | главное действие (teal fill) |
| Secondary | outline on surface |
| Ghost | toolbar, secondary nav |
| Destructive | delete, disconnect |

Radius: **10px** (buttons), **14px** (cards), **20px** (modals)

### Cards

- Background: `--bg-surface`
- Border: 1px `--border-subtle`
- Shadow: `0 4px 24px rgba(0,0,0,0.25)` on hover for interactive cards

### Integration cards

- Logo channel + status pill (Подключено / Ошибка / Выключено)
- Pulse dot green when active
- Form fields for **user-owned credentials** (Avito API, TG bot token, etc.)

### Status pills

- `активен` — success muted bg
- `ожидание` — warning
- `ошибка` — error
- `выключен` — muted

---

## Motion

| Pattern | Duration | Easing |
|---------|----------|--------|
| Page enter | 300ms | cubic-bezier(0.22, 1, 0.36, 1) |
| Stagger children | 50ms delay | same |
| Hover lift | 200ms | ease-out |
| Modal | 250ms scale 0.98→1 | spring-ish |
| Skeleton shimmer | 1.5s loop | linear |

**Respect:** `prefers-reduced-motion: reduce` — disable stagger, use opacity only.

**Landing hero:** subtle gradient mesh animation (CSS only, low CPU).

---

## Iconography

- **Lucide React** — stroke 1.75px, size 20 default
- Channel logos: official brand colors in rounded 10px containers

---

## Copy tone (RU)

- Короткие заголовки: «Подключите Telegram», не «Интеграция с мессенджером Telegram»
- Ошибки: что случилось + что сделать («Проверьте токен бота и сохраните снова»)
- Empty states: одно предложение + одна кнопка

---

## Decisions Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-06-16 | Dark-first LK | Premium feel, reduces eye strain for inbox-heavy use |
| 2026-06-16 | Teal accent | Trust + tech without generic purple AI |
| 2026-06-16 | Manrope + Onest | Strong Cyrillic, modern SaaS |
| 2026-06-16 | RU-only v1 | User requirement |
| 2026-06-16 | Per-user integration credentials | User fills own Avito/TG/VK keys in LK |

---

## QA Checklist

- [ ] All user-facing strings in Russian
- [ ] Touch targets ≥ 44px on mobile
- [ ] Contrast ratio ≥ 4.5:1 for body text
- [ ] Reduced motion honored
- [ ] Integration forms mask secrets by default
