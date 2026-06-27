# HK Growth — Marketing Website

Premium, conversion-focused **AI-First Growth Partner** landing page for HK Growth
(„Digitale Wachstumssysteme"). Dependency-free static site — semantic HTML, modern
CSS, a little vanilla JS. No build step, no framework, no npm install.

## Run locally

It's static, so any static server works:

```bash
cd apps/website
python3 -m http.server 4321      # → http://localhost:4321
# or:  npx serve .   /   bunx serve .
```

Open `http://localhost:4321/`. Legal pages: `/impressum.html`, `/datenschutz.html`.

## Structure

```
apps/website/
├── index.html          # Landing page (all sections)
├── ads.html            # Top-of-funnel ad landing — angle: free Wachstumsanalyse (diagnostic)
├── ads-anfragen.html   # Ad variant — angle: "mehr qualifizierte Anfragen"
├── ads-premium.html    # Ad variant — angle: "Premium-Auftritt / dein Wert sichtbar"
├── onboarding.html     # Onboarding funnel: multi-step intake wizard → offer request
├── impressum.html      # Legal — Impressum (contains TODO placeholders)
├── datenschutz.html    # Legal — Datenschutz (contains TODO placeholders)
├── styles/main.css     # Design system: tokens, components, sections, motion, responsive
├── styles/funnel.css   # Funnel UI: slim header, outcome grid, FAQ, wizard, choice cards
├── js/main.js          # Nav, header states, scroll reveals, growing system line, form
├── js/funnel.js        # Onboarding wizard: steps, progress, choice cards, recap, submit
└── assets/
    ├── favicon.svg     # Brand mark (geometric "rooted node")
    └── og-image.svg    # Social share image
```

## Design system (ownable to HK)

Reuses HK's real brand tokens (from `apps/os-dashboard`):

| Token | Value | Role |
| --- | --- | --- |
| Creme | `#EFEBE1` | Default warm base (~70% of page) |
| Waldgrün / forest | `#2E3A2A` | Ink + the 3 dark "operating layer" surfaces (hero, AI section, contact/footer) |
| Messing-Gold / brass | `#A2854F` | The single accent + the root/network line that stitches the two surfaces |
| Terrakotta | `#A9472F` | One scalpel use (problem accents) |
| Salbei / sage | `#6B8F71` | Positive / check states only |

- **Type:** Fraunces (display) with a metric-matched fallback so it swaps without
  layout shift; body uses the system sans stack (zero extra download). Fluid
  `clamp()` scale.
- **Motion:** Emil Kowalski's rules — GPU-only `transform`/`opacity`, custom
  ease-out curve, sub-300ms UI transitions, `scale(0.97)` press feedback, scroll
  reveals fire once, hover gated behind `@media (hover: hover)`, full
  `prefers-reduced-motion` fallback.

## ⚠️ Manual input still needed before going live

| # | Item | Where |
| --- | --- | --- |
| 1 | **Cal.com booking link** — replace the placeholder URL | `index.html` → `data-cal-link` (`https://cal.com/hk-growth/wachstumsanalyse`) |
| 2 | **Contact form backend** — currently opens a prefilled `mailto:`. Wire a real endpoint (Formspree / own API) if you want server-side submissions | `js/main.js` → `#contactForm` handler |
| 3 | **Real project screenshots** — 4 SVG mockup placeholders are in place (16:9). Swap for real screenshots/mockups | `index.html` → `.project-card__media` |
| 4 | **Client / industry logos** — currently anonymized industry chips (no fake logos, by design). Add real logos only if you have permission | `index.html` → `.trust__label-row` |
| 5 | **Impressum legal fields** — owner name / legal form, phone, USt-IdNr, register, responsible person | `impressum.html` → `[BITTE ERGÄNZEN: …]` markers |
| 6 | **Datenschutz details** — hoster + AVV, form provider, Cal.com provider | `datenschutz.html` → `[BITTE ERGÄNZEN: …]` markers |
| 7 | **Self-host Fraunces (recommended for DSGVO)** — currently loaded from Google Fonts. Download WOFF2, add `@font-face`, drop the Google `<link>` in all 3 HTML files. Site already falls back to Georgia if removed | all `*.html` + `styles/main.css` |
| 8 | **Confirm the "30+" projects claim** is accurate before publishing | `index.html` → trust bar |
| 9 | **og-image.svg → PNG** — some social platforms don't render SVG OG images. Export a 1200×630 PNG and update the `og:image` URLs | `assets/` + `*.html` |
| 10 | **Production domain** — `og:url` / `canonical` assume `https://hkgrowth-operator.de/` | `*.html` |

Search the tree for `BITTE ERGÄNZEN` and `data-cal-link` to find every spot that
needs your input:

```bash
grep -rn "BITTE ERGÄNZEN\|data-cal-link\|cal.com/hk-growth" .
```

## Company data (kept consistent everywhere)

- **HK Growth Operator**, Weststraße 2, 53709 Marienheide, Deutschland
- **info@hkgrowth-operator.de** (single email used site-wide)
- NRW · deutschlandweit

## Tracking & Attribution (`js/analytics.js`)

Privacy-light by design — **loads no third-party tracker on its own** (DSGVO-friendly):

- **UTM attribution end-to-end:** `utm_source/medium/campaign/content/term` (+ `gclid`/`fbclid`)
  are captured on the ad landing (first-touch), carried across to `onboarding.html`
  (link rewrite + sessionStorage), and written into the lead email under
  "Herkunft / Kampagne" — so every inquiry shows which campaign **and which ad
  angle** produced it (`first_landing` = `ads-diagnose` / `ads-anfragen` / `ads-premium`).
- **Conversion signal:** on submit, fires `dataLayer.push({event:'lead_submit', …})`
  and calls `gtag('event','generate_lead')` / `fbq('track','Lead')` **only if you've
  loaded them**. The success state also sets the URL to `#danke` for URL-based
  conversion tracking.
- **To enable ad-platform conversions:** add your GA4/Google Ads/Meta Pixel snippet
  (ideally behind a consent banner), then update the Datenschutz accordingly. No IDs
  are hardcoded; nothing tracks until you opt in.
- Attribution uses **sessionStorage only** (first-party, no cookies), so the default
  "no tracking cookies" statement in Datenschutz stays accurate.

Run an A/B test: point each campaign at its variant with UTMs, e.g.
`ads-anfragen.html?utm_source=meta&utm_campaign=q3&utm_content=hookA`.
