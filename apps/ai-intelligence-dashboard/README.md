# AI Intelligence Dashboard

A self-contained, **zero-dependency** AI-first intelligence dashboard. It turns
AI news/noise into structured business intelligence for an AI-first agency:
latest updates, business relevance, weekly tests, risk/hype filtering, a
learning module, and a client-offer engine.

> **Status: MVP with sample seed data.** Every entry is illustrative SAMPLE
> content (clearly badged `SAMPLE DATA` in the UI), not verified live news.
> See [Connecting real sources](#connecting-real-sources) to make it live.

## Why it's built this way

This lives inside the `superpowers` repo, which is a Claude Code **skills
plugin** with no app framework, bundler, database, or build step — and a
strict zero-dependency philosophy. So the dashboard is intentionally:

- **Vanilla ES modules + CSS** — no React/Vue, no npm install, no build.
- **Adapter-first** — data comes through a `Source` interface, so swapping
  seed data for live RSS/API/web-search is a one-line change, not a rewrite.
- **Isolated** — it touches nothing in the skills core and adds no dependencies.

## Run it

No build needed. Serve the folder with any static server (ES modules need
HTTP, not `file://`):

```bash
cd apps/ai-intelligence-dashboard
python3 -m http.server 8080
# open http://localhost:8080
```

## Features

| Section | What it does |
|---|---|
| **Overview** | KPIs + today's top updates + high-impact opportunities |
| **Latest Updates** | All updates with full business-intelligence layer |
| **Automation / Coding / Voice & Video** | Category-scoped update views |
| **Test This Week** | Concrete, time-boxed experiments (`WeeklyExperiment`) |
| **Client Offers** | Agency opportunity engine (`BusinessOpportunity`) |
| **Risks / Hype** | Cross-cutting risk assessments + flagged updates |
| **Learning** | One-concept-at-a-time learning cards |
| **Saved** | Bookmarked insights (persisted in `localStorage`) |

Plus: full-text **search**, **filters** (company, category, priority, risk,
hype, min relevance, saved-only), **dark/light** theme toggle, **manual add**
form, loading/empty/error states, and responsive layout.

## Architecture

```
index.html              # shell, loads src/main.js as a module
assets/styles.css       # design tokens (dark/light) + layout
src/
  main.js               # bootstrap: sources -> store -> views, chrome, add-form
  store.js              # tiny pub/sub state + saved-insights persistence
  dom.js                # safe element builder (textContent, no innerHTML on data)
  components.js         # one render function per entity (cards)
  views.js              # filtering + section assembly per nav tab
  data/
    schema.js           # data model (typedefs + enums) — maps 1:1 to future DB
    sources/
      adapter.js        # Source interface, dedupe, freshness, ingest()
      mockSource.js     # the only wired source today (+ live-adapter template)
    seed/               # sample data: updates, experiments, opportunities,
                        # learning, risks
```

### Data model

Defined as JSDoc typedefs + runtime enums in `src/data/schema.js`:
`AIUpdate`, `WeeklyExperiment`, `BusinessOpportunity`, `LearningConcept`,
`RiskAssessment`, plus a `Source` interface in `adapter.js`. When you add a
database later, these typedefs are your table/collection shapes.

## Connecting real sources

1. Implement the `Source` interface (`src/data/sources/adapter.js`) — see the
   commented `createRssSource` template in `mockSource.js`:
   ```js
   export const myBlogSource = {
     id: 'openai-blog',
     name: 'OpenAI Blog',
     async fetchUpdates() {
       const res = await fetch('/api/openai-feed'); // via your backend proxy
       return mapFeedItemsToAIUpdate(await res.json());
     },
   };
   ```
2. Register it in `src/main.js`:
   ```js
   const SOURCES = [mockSource, myBlogSource];
   ```
3. `ingest()` already handles **dedupe**, **freshness window**
   (`{ maxAgeDays }`), per-source error isolation, and newest-first sorting.

**Browser CORS note:** call third-party RSS/APIs through a small backend proxy
or scheduled job that writes a JSON file the dashboard fetches. Classification,
summarisation, and business-impact scoring (Section 10 of the brief) belong in
that backend/cron step — the adapter just returns finished `AIUpdate` objects.

## What still needs improvement

- Real source adapters + a backend/cron ingestion + scoring pipeline.
- Persistence beyond `localStorage` (a real DB) and multi-user/auth.
- Editing/deleting manually-added updates (currently add-only, in-memory).
- Automated tests and an a11y pass.

See `AGENTS.md` in this folder for the rules future agents should follow here.
