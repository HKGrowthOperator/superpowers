# AI Intelligence Dashboard

An AI-first business command center: it turns AI updates/noise into structured
**business intelligence** — relevance scoring, weekly experiments, a risk/hype
filter, learning concepts, and sellable client opportunities.

Zero dependencies, zero build step. Plain ES modules + CSS. See
[`AGENTS.md`](./AGENTS.md) for the architecture and rules.

## Run it (it needs a tiny static server — not `file://`)

Because the app uses native ES modules, open it through a local web server,
not by double-clicking `index.html`.

### Easiest on Windows (uses Docker Desktop you already have)

Double-click **`start-windows.cmd`**. A browser tab opens at
<http://localhost:8080>. Leave the black window open while you use the app;
close it to stop. (If the first tab is blank, refresh once.)

### Or, one command (Windows PowerShell, macOS, Linux)

From inside this folder:

```bash
docker run --rm -p 8080:80 -v "${PWD}:/usr/share/nginx/html:ro" nginx
```

Then open <http://localhost:8080>.

### Or, if you have Python

```bash
python -m http.server 8080
```

Then open <http://localhost:8080>.

## What's inside

| Layer | File | Role |
|---|---|---|
| schema | `schema.js` | Typedefs + the allowed enum values |
| sources | `sources/mockSource.js` | Curated updates (add real sources here) |
| adapter | `adapter.js` | `Source` interface + `normalizeUpdate()` validation |
| seed | `seed.js` | Experiments, opportunities, learning, risks |
| store | `store.js` | Single source of truth (state, saved, persistence) |
| filters | `filters.js` | `filterUpdates()` for list views |
| components | `components.js` | `card`, `chip`, `score`, `save-btn`, entity cards |
| views | `views.js` | Dashboard, Updates, Experiments, Opportunities, Learning, Risks & hype, Saved, Add |
| shell | `main.js`, `index.html`, `assets/styles.css` | Layout, nav, theme, filter bar |

## Verify after changes

```bash
node --check schema.js dom.js adapter.js store.js filters.js components.js views.js main.js sources/mockSource.js seed.js
```

Then load via a static server and click through every view in **both** themes
and at the **≤ 880px** mobile breakpoint.
