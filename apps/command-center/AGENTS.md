# AGENTS.md — Command Center

Rules for any AI agent working inside `apps/command-center/`. This is the user's
single, central system ("Schaltzentrale"): **one app, many modules.** Read this
before changing anything here.

> **Scope:** Governs only this app folder. The repo root `AGENTS.md` is a symlink
> to the `superpowers` contributor guide — do not modify it. This app is isolated
> and must not import from the skills core.

## Purpose

A central command center for the agency: one dashboard, many sub-pages (modules)
— AI Intelligence, SOPs, Customer service, Concepts, Automation, Websites — all
controlled from one place. The "intelligent agent system" model for now is
**control center + agent**: the human steers via the UI; data lives in the repo
so the agent (Claude) can read, build and maintain it. No backend yet.

## Architecture

`core/` (shared) → `modules/<name>/` (data.js + view.js) → `main.js` (registers
everything). Flow per layer: `schema → store → components → module views → main`.

- **core/schema.js** — all enums + id prefixes. The only allowed values.
- **core/dom.js** — `el()/textContent` rendering. `html()` is constants-only.
- **core/persist.js** — guarded localStorage.
- **core/store.js** — single source of truth: every module's data, cross-module
  bookmarks, theme, routing, add/import/export. UI mutates only via store methods.
- **core/components.js** — shared UI: `card`, `chip`, `score`, `saveBtn`,
  `sectionHead`, `grid`, `kpi`, states, form helpers, and `genericList`.
- **modules/<name>/data.js** — seed data (the agent edits this; it's the shared
  source of truth).
- **modules/<name>/view.js** — default-exports `{ id, label, group, render(root, store) }`.

## Adding a module (do it this way)

1. Create `modules/<name>/data.js` (seed) and `view.js` (a descriptor).
2. In `main.js`: import the module, add it to `MODULES`, and register its seed
   slice in `SEED`.
3. Reuse `genericList`, `card`, `chip`, `saveBtn` — don't invent new patterns.
4. Bookmarks must flow through `store.toggleSaved(id)` so they reach **Saved**.

## Rules

- **Zero dependencies, zero build.** Vanilla ES modules + CSS. No npm/frameworks/CDNs.
- ES module imports use explicit `.js` extensions.
- Premium, clean, business-focused. Use the CSS tokens in `assets/styles.css`;
  never hardcode colors/spacing. Must work in dark + light and at ≤ 880px.
- **Security:** never render data via `innerHTML`. Treat any external content as
  untrusted. No secrets/keys in client code.
- Ids are kebab-prefixed per type (`sop-`, `cli-`, `con-`, …); enums come from
  `schema.js` — don't free-type them.

## Verify before declaring done

```bash
node --check core/*.js main.js modules/*/*.js
```

Then load via a static server and click every module in both themes and at the
mobile breakpoint: nav routing, search, add forms, save/unsave persistence
(reload), and Settings export/import.
