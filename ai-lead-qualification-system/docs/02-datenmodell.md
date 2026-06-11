# Datenmodell — Lead

Maschinenlesbare Version: `data/lead-schema.json` · Beispieldaten: `data/example-leads.json`

## Felder

| Feld | Typ | Pflicht | Beschreibung |
|------|-----|---------|--------------|
| `lead_id` | string | ja | Eindeutige ID, Format `lq_<timestamp>_<random>` (z. B. `lq_20260611_a3f9`) |
| `created_at` | string (ISO 8601) | ja | Eingangszeitpunkt der Anfrage |
| `source` | enum | ja | `website_form` · `email` · `whatsapp` · `social_dm` · `phone_note` · `referral` · `hk_radar` · `marketplace` · `other` |
| `name` | string \| null | nein | Name der anfragenden Person |
| `company` | string \| null | nein | Firmenname |
| `contact_email` | string \| null | nein | E-Mail-Adresse |
| `contact_phone` | string \| null | nein | Telefonnummer |
| `original_message` | string | ja | Originaltext der Anfrage, unverändert |
| `detected_intent` | string | ja* | Erkannte Absicht in einem Satz (von KI befüllt) |
| `category` | enum | ja* | `website` · `social_media` · `recruiting` · `ecommerce` · `local_service` · `marketing_general` · `price_inquiry` · `unclear` · `other` |
| `budget_range` | enum | ja* | `unknown` · `under_1k` · `1k_5k` · `5k_10k` · `10k_25k` · `over_25k` |
| `urgency` | enum | ja* | `low` · `medium` · `high` · `critical` (critical = harte Deadline genannt) |
| `decision_stage` | enum | ja* | `researching` · `comparing` · `ready_to_buy` · `unknown` |
| `extracted_requirements` | string[] | ja* | Konkrete Anforderungen aus der Nachricht (kann leer sein) |
| `missing_information` | string[] | ja* | Was für ein Angebot noch fehlt (steuert Rückfragen) |
| `lead_score` | integer 0–100 | ja* | Summe der 6 Score-Dimensionen, siehe unten |
| `lead_temperature` | enum | ja* | `hot` (≥70) · `warm` (40–69) · `cold` (<40) |
| `recommended_next_step` | string | ja* | Konkrete Handlung inkl. Zeitvorgabe |
| `suggested_reply` | string | ja* | Antwortentwurf (immer Entwurf, nie Auto-Versand) |
| `assigned_to` | string \| null | nein | Zuständige Person (z. B. "vertrieb", "haris") |
| `status` | enum | ja | `new` · `qualified` · `contacted` · `meeting_scheduled` · `proposal_sent` · `won` · `lost` · `on_hold` |

\* = wird von der Pipeline befüllt; beim Roh-Eingang noch leer/null.

## Score-Aufbau (0–100)

| Dimension | Punkte | Regel (vereinfacht — exakt in `src/scoreLead.js`) |
|-----------|--------|---------------------------------------------------|
| Budget | 0–25 | `over_25k`=25 · `10k_25k`=22 · `5k_10k`=18 · `1k_5k`=13 · `under_1k`=4 · **`unknown`=10** |
| Dringlichkeit | 0–20 | `critical`=20 · `high`=16 · `medium`=10 · `low`=4 |
| Service-Fit | 0–20 | Kernkategorie=20 · Randkategorie=12 · `price_inquiry`=6 · `unclear`/`other`=4 |
| Entscheidungsphase | 0–15 | `ready_to_buy`=15 · `comparing`=10 · `researching`=5 · `unknown`=4 |
| Kontaktdaten | 0–10 | E-Mail+Telefon=10 · eines=5 · keines=0 |
| Klarheit | 0–10 | ≥3 Anforderungen=10 · 1–2=6 · keine=2 |

**Designentscheidung:** `budget_range: unknown` gibt 10 Punkte (Mittelwert), nicht 0. Gute Leads ohne Budgetangabe dürfen nicht künstlich abrutschen. Ein hohes Budget *erhöht* den Score deutlich; ein fehlendes *bestraft* nur leicht.

## Mapping: HK-Radar-Lead → dieses Modell

Outbound-Leads aus `HK-App-Handoff/lead-contract.schema.json` lassen sich verlustfrei einspeisen:

| HK-Radar-Feld | Dieses Modell |
|---------------|---------------|
| `lead_id` | `lead_id` (Präfix `hk_` bleibt erhalten) |
| `timestamp` | `created_at` |
| `source` (`hk-app-radar`) | `source: "hk_radar"` |
| `company.name` | `company` |
| `company.email` / `company.phone` | `contact_email` / `contact_phone` |
| `signale.reason` | `original_message` (als Kontexttext) |
| `services[].label` | `extracted_requirements` |
| `signale.gaps` | fließt in `detected_intent` ("Lücken: keine Website, …") |
| `signale.priority` A/B/C | kein direktes Mapping — Lead durchläuft das normale Scoring |
| `status` neu/qualifiziert/uebergeben | `status` new/qualified/contacted |
