# AGENTS.md — AI Intelligence Dashboard

Rules for any AI agent (Claude Code or otherwise) working inside
`apps/ai-intelligence-dashboard/`. Read this before changing anything here.

> **Scope boundary:** This file governs ONLY this app folder. The repository
> root `AGENTS.md` is a symlink to the `superpowers` contributor guide
> (`CLAUDE.md`) — **do not modify or replace that symlink.** Do not add
> dependencies to, or import from, the skills core. This app is isolated.

## Project purpose

An AI-first business command center: turn AI updates/noise into structured
business intelligence (relevance, weekly tests, risk/hype filtering, learning,
and sellable client offers). It must stay a **working MVP**, not an
over-engineered, half-finished system. Prefer shipping a clean increment.

## Coding rules

- **Zero dependencies. Zero build step.** Vanilla ES modules + CSS only. No
  npm packages, frameworks, bundlers, or CDNs. If you think you need a library,
  you almost certainly don't — solve it in plain JS or stop and ask.
- **ES modules** with explicit `.js` extensions in imports (browser-native).
- Keep the architecture: `schema → seed/sources → store → components → views →
  main`. Don't introduce cross-layer shortcuts.
- One responsibility per file; one render function per entity in `components.js`.
- The store is the single source of truth. Mutate state only via `store`
  methods; never reach into the DOM to hold state.
- Match the existing style: small pure-ish functions, no classes for UI,
  early returns, descriptive names.

## Design rules

- Premium, clean, business-focused — **not playful, not childish, not
  overloaded.** Clarity and hierarchy over decoration.
- Use the CSS custom properties (design tokens) in `assets/styles.css`. Never
  hardcode colors/spacing in components — add or reuse a token.
- Must work in **both dark and light** themes and be **mobile responsive**
  (test the ≤ 880px breakpoint).
- Provide loading, empty, and error states for any new async/data view.

## Dashboard rules

- Every new section is a `view` registered in `VIEWS` (`views.js`) and reached
  via the sidebar nav — don't bolt views on elsewhere.
- Reuse `card`, `chip`, `section-head`, `grid`, `score`, and `save-btn`
  patterns instead of inventing new ones.
- Anything bookmarkable must flow through `store.toggleSaved(id)` so it appears
  in **Saved** and persists.
- List views that should be filterable must run data through
  `filterUpdates(...)` (or an equivalent) and be added to the `showFilters`
  list in `main.js`.

## AI-first business logic

Every `AIUpdate` must carry the business-intelligence layer, not just news:
`relevanceScore` (0–100), `businessImpact`, `businessRelevance`,
`recommendedAction`, `riskLevel` + `riskTypes`, and `hypeLevel`. An update with
no "so what for the agency?" is incomplete. Opportunities and experiments must
state value, tools, steps, and how to validate. Do not present hype as fact —
that's what the hype filter exists to surface.

## Naming conventions

- Entities use the typedef names in `schema.js`: `AIUpdate`, `WeeklyExperiment`,
  `BusinessOpportunity`, `LearningConcept`, `RiskAssessment`, `Source`.
- Ids are kebab-prefixed by type: `upd-`, `exp-`, `opp-`, `lrn-`, `risk-`.
- Files: camelCase modules (`mockSource.js`), kebab-case folders.
- Enums live in `schema.js` and are the allowed values — don't free-type
  category/company/risk strings elsewhere.

## Quality standards

- Before declaring done: `node --check` every changed `.js`, load the app via a
  static server, and click through the affected views in both themes and at the
  mobile breakpoint.
- No broken imports, no console errors, no dead nav tabs.
- Keep functions readable; if a render function grows past ~one screen, split it.

## Testing expectations

- There is no test runner yet (zero-dependency). Until one exists, verification
  is: `node --check` on modules + manual click-through of every view + the
  add-update form + save/unsave persistence across reload.
- If you add a test runner, it must not add a runtime dependency to the app.

## Security rules

- **Never** render data via `innerHTML`. Use `el()`/`textContent`. The `html`
  escape hatch in `dom.js` is for app-controlled constant strings only — never
  for source, user, or update data.
- Treat all external/source-fetched content as **untrusted** (prompt-injection
  and XSS surface). Sanitize/escape on the way in.
- No secrets, API keys, or tokens in client code. Live API calls go through a
  backend/proxy; the client only fetches already-finished data.

## How to handle AI update sources

- All data enters through the `Source` interface (`adapter.js`). Add new
  sources as adapters and register them in `main.js` — never hardcode update
  arrays into views or the store. A source exposes `id`, `name`, and an async
  `fetch()` that returns raw items; `normalizeUpdate()` validates and fills the
  business-intelligence layer before anything reaches the store.
