# Workflow: Lead-Qualifizierung

## Der Standard-Prozess

```
┌──────────────────────────────────────────────────────────────┐
│ 1. EINGANGSKANAL                                             │
│    Formular · E-Mail · WhatsApp · Social DM · Telefonnotiz   │
│    → Webhook (Make/Zapier) sammelt alles in EINEM Format:    │
│      { source, name?, email?, phone?, original_message }     │
└──────────────────────────────┬───────────────────────────────┘
                               ↓
┌──────────────────────────────────────────────────────────────┐
│ 2. AI-ANALYSE                 classifyLead()                 │
│    Absicht · Kategorie · Budget · Dringlichkeit · Phase ·    │
│    Anforderungen · fehlende Infos                            │
│    Prompt: prompts/lead-classification-prompt.md             │
└──────────────────────────────┬───────────────────────────────┘
                               ↓
┌──────────────────────────────────────────────────────────────┐
│ 3. SCORING                    scoreLead()                    │
│    0–100 Punkte aus 6 Dimensionen, mit Begründung            │
│    🔥 hot ≥ 70   ·   🌤 warm 40–69   ·   ❄️ cold < 40        │
└──────────────────────────────┬───────────────────────────────┘
                               ↓
┌──────────────────────────────────────────────────────────────┐
│ 4. CRM-EINTRAG                formatLeadForCRM()             │
│    Airtable/Notion-Record mit allen Feldern + Status "new"   │
└──────────────────────────────┬───────────────────────────────┘
                               ↓
┌──────────────────────────────────────────────────────────────┐
│ 5. ANTWORTENTWURF             generateReplyDraft()           │
│    Persönlicher Entwurf — IMMER zur Freigabe, nie Auto-Send  │
│    Prompt: prompts/reply-generation-prompt.md                │
└──────────────────────────────┬───────────────────────────────┘
                               ↓
┌──────────────────────────────────────────────────────────────┐
│ 6. AUFGABE FÜR VERTRIEB       generateNextStep()             │
│    🔥 hot  → Slack-Alarm + "in 1–2 h anrufen" (an Inhaber)   │
│    🌤 warm → Aufgabe "heute antworten" (an Vertrieb)         │
│    ❄️ cold → Standardantwort + Wiedervorlage                 │
│    Interne Summary: prompts/sales-summary-prompt.md          │
└──────────────────────────────┬───────────────────────────────┘
                               ↓
┌──────────────────────────────────────────────────────────────┐
│ 7. FOLLOW-UP                                                 │
│    Keine Antwort? Wiedervorlage nach 2 / 5 / 10 Tagen        │
│    Status-Pflege: contacted → meeting → proposal → won/lost  │
└──────────────────────────────────────────────────────────────┘
```

**Menschliche Kontrollpunkte (bewusst eingebaut):**
- Antwortentwurf wird vor Versand freigegeben (Schritt 5→6)
- `unclear`-Leads bekommen Rückfragen, keine Auto-Kategorisierung
- Status-Wechsel ab `contacted` macht der Mensch, nicht das System

---

## Branchen-Varianten

Die Pipeline bleibt identisch — angepasst werden Kategorien (`src/config.js`), Prompts (Rollen-Absatz) und die Schwellen für "hot".

### 1. Handwerksbetrieb (z. B. Elektro, SHK, Dachdecker)

| Anpassung | Wert |
|-----------|------|
| Kategorien | `notfall`, `reparatur`, `neubau_projekt`, `wartung`, `angebot_anfrage` |
| Besonderheit | **`notfall` schlägt alles**: direkt SMS/Anruf an Bereitschaft, Score egal |
| Budget-Logik | Projektgröße statt Euro schätzen (Einfamilienhaus vs. Steckdose) |
| Hot-Kriterium | Notfall ODER Neubau/Sanierung mit Zeitangabe |
| Antwort-Ton | kurz, bodenständig, Termin statt Konzeptgespräch |

### 2. Autohaus / Werkstatt

| Anpassung | Wert |
|-----------|------|
| Kategorien | `fahrzeug_kauf`, `probefahrt`, `inzahlungnahme`, `werkstatt_termin`, `finanzierung` |
| Besonderheit | Anfragen von mobile.de/AutoScout (`marketplace`) sind preissensibel → eigene Antwortstrategie |
| Hot-Kriterium | Probefahrt-Wunsch + konkretes Fahrzeug = sofort Termin anbieten |
| Extraktion zusätzlich | Fahrzeugmodell, Wunschtermin, Inzahlungnahme-Fahrzeug |
| Follow-up | nach Probefahrt automatisch +1 Tag Nachfass-Aufgabe |

### 3. Marketing-Agentur (= dieses Repo, Referenz-Setup)

| Anpassung | Wert |
|-----------|------|
| Kategorien | `website`, `social_media`, `recruiting`, `ecommerce`, `local_service`, … (Default) |
| Besonderheit | `price_inquiry` separat behandeln — Wert argumentieren statt rabattieren |
| Hot-Kriterium | Budget genannt + Vergleichs-/Kaufphase, oder Empfehlung |
| Follow-up | Wiedervorlage 3 Tage nach Konzept-/Angebotsversand |

### 4. Lokaler Dienstleister (z. B. Physiotherapie, Steuerberater, Friseur)

| Anpassung | Wert |
|-----------|------|
| Kategorien | `termin_anfrage`, `leistungs_frage`, `preis_frage`, `notfall_kurzfristig` |
| Besonderheit | Es geht um **Termine, nicht Projekte** → Budget-Dimension auf 5 Punkte senken, Kontakt/Dringlichkeit hochgewichten |
| Hot-Kriterium | Terminwunsch diese Woche + Telefonnummer |
| Antwortentwurf | direkt 2 freie Slots vorschlagen (Kalender-Anbindung als Ausbaustufe) |

### 5. Online-Shop

| Anpassung | Wert |
|-----------|------|
| Kategorien | `bestellstatus`, `produkt_frage`, `retoure`, `b2b_grossbestellung`, `kooperation` |
| Besonderheit | Großteil ist Support, kein Sales → erst Support/Sales-Weiche, nur Sales-Anfragen durchs Scoring |
| Hot-Kriterium | `b2b_grossbestellung` mit Mengenangabe |
| Extraktion zusätzlich | Bestellnummer, Produktname, Menge |
| Follow-up | B2B: 2 Tage · Kooperation: 5 Tage · Support: an Helpdesk übergeben |
