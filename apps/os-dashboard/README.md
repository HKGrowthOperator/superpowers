# Magical Wall — Agent-/Automation-Cockpit

Eine „magische Wand", die in Echtzeit zeigt, **welche KI-Automationen laufen,
mit welchem Ergebnis, zu welchen Kosten und mit welchen Fehlern**.

Self-referentiell: Jede neue Automation, die ihr baut, taucht automatisch im
Cockpit auf — euer Fortschritt Richtung „AI First" wird messbar und sichtbar.

## Stack (bewusst schlank, ~5–10 €/Monat self-hosted)

| Schicht | Tool | Rolle |
|---|---|---|
| Automations-Runtime | **n8n** | Die Automationen *sind* n8n-Workflows. AI-Nodes rufen Claude. |
| Daten-Backbone | **Postgres** | Eine Tabelle `agent_runs` als Single Source of Truth. |
| Die Wand | **Next.js-App** (`web/`) | Integriertes Live-Dashboard: KPI-Kacheln, Trend, letzte Läufe. Liest `agent_runs` direkt aus Postgres. |

```
Automation (n8n) ──ruft──▶ log_agent_run ──INSERT/UPDATE──▶ agent_runs (Postgres)
                                                                   │
                                                          liest    ▼
                                                       Next.js-App (web/)  =  die Wand
```

Die Wand ist eine eigene, integrierte App (Next.js 16 + Tailwind v4), kein
Drittanbieter-Tool. Sie wird mit `docker compose up` automatisch mitgestartet.

## Schnellstart (lokal)

```bash
cp .env.example .env
# .env öffnen und mindestens Passwörter + N8N_ENCRYPTION_KEY setzen:
#   openssl rand -hex 32   → als N8N_ENCRYPTION_KEY eintragen
docker compose up -d
```

Danach erreichbar:
- **Die Wand** → http://localhost:3000  (das Cockpit-Dashboard)
- **n8n**   → http://localhost:5678  (Login aus `.env`)
- **Postgres** → `localhost:5432`, DB `cockpit`

> Beim allerersten Start legt Postgres automatisch die Tabelle `agent_runs`,
> alle Views sowie die Begleit-DB `n8n` an (`db/init/`).

### Lokal an der Wand entwickeln

```bash
cd web
npm install
DATABASE_URL=postgres://cockpit:DEIN_PW@localhost:5432/cockpit npm run dev
# → http://localhost:3000
```

### Demo-Daten (damit die Wand sofort etwas zeigt)

```bash
docker compose exec -T postgres psql -U cockpit -d cockpit < db/seed.sql
```

## Einrichtung in n8n (einmalig)

1. **Postgres-Credential anlegen**: in n8n unter *Credentials → New → Postgres*
   Host `postgres`, Port `5432`, DB `cockpit`, User/Passwort aus `.env`.
2. **Logger importieren**: *Workflows → Import from File* →
   `n8n/log_agent_run.workflow.json`. Dem Postgres-Node das Credential aus
   Schritt 1 zuweisen. Speichern (der Workflow bekommt eine ID).
3. **Beispiel importieren**: `n8n/example_automation.workflow.json`. Den beiden
   *Execute Workflow*-Nodes den Workflow `log_agent_run` zuweisen
   (ersetzt `REPLACE_WITH_log_agent_run_WORKFLOW_ID`).
4. Beispiel manuell ausführen → ein Datensatz erscheint in `agent_runs`.

### So loggt jede neue Automation mit (das Muster)

Am **Anfang** des Workflows: UUID + Meta setzen, `log_agent_run` mit
`status: "running"` aufrufen. Am **Ende**: dieselbe `id` mit
`status: "success"` (oder `"error"` + `error`-Text) plus optional
`tokens_in/tokens_out/cost_eur/summary` erneut an `log_agent_run` geben.
Mehr muss eine Automation fürs Cockpit nicht tun.

## Die Wand (Next.js-App)

Die App unter `web/` ist das Dashboard und startet via Compose automatisch mit.
Sie liest die Views aus `db/init/01-schema.sql` (`v_runs_today`,
`v_success_rate_7d`, `v_cost_month`, `v_open_errors`, `v_daily_trend`,
`v_recent_runs`) und rendert:

- **KPI-Kacheln**: Läufe heute · Erfolgsquote (7 Tage) · Kosten diesen Monat ·
  offene Fehler (rot, wenn > 0)
- **Trend**: Läufe & Fehler pro Tag (30 Tage)
- **Tabelle**: die letzten 20 Läufe mit Status, Dauer, Kosten, Ergebnis

Die Seite aktualisiert sich alle 30 s selbst (`components/auto-refresh.tsx`).
Für die „Wand" einfach im Browser-Vollbild auf den Monitor/TV legen.

> `dashboard/queries.sql` bleibt als SQL-Referenz erhalten (gleiche Views) —
> nützlich, falls ihr zusätzlich ein BI-Tool anschließen wollt.

## Robustheit (Phase 3)

- **Fehler-Alert**: in n8n einen Schedule-Workflow, der
  `SELECT * FROM v_open_errors` prüft und bei `> 0` eine Nachricht
  (Slack/E-Mail) schickt.
- **Kosten**: Token→€ zentral im Code-Node der Automation berechnen, bevor
  `log_agent_run` aufgerufen wird (so bleibt die Logik an einer Stelle).

## Auf einem Server (Hetzner) deployen

1. Kleinen VPS anlegen (z. B. Hetzner CX22), Docker + Compose installieren.
2. Repo auf den Server kopieren, `.env` mit **starken** Passwörtern füllen,
   `N8N_HOST`/`WEBHOOK_URL` auf eure Domain setzen.
3. Reverse-Proxy mit HTTPS davor (Caddy oder Traefik) — und in `.env`
   `N8N_PROTOCOL=https`.
4. In `docker-compose.yml` die `ports:`-Einträge für `postgres` entfernen,
   damit die DB nicht öffentlich erreichbar ist.
5. `docker compose up -d`. Backups: regelmäßig `pg_dump` des `cockpit`-Volumes.

## Verifikation (End-to-End)

- [ ] `docker compose ps` → alle Container laufen (postgres healthy).
- [ ] Wand öffnen → http://localhost:3000 zeigt Kacheln, Trend und Läufe.
- [ ] Beispiel-Automation in n8n auslösen → neuer Eintrag:
      `docker compose exec postgres psql -U cockpit -d cockpit -c \
      "select automation,status,started_at from agent_runs order by started_at desc limit 5;"`
- [ ] Fehlerfall simulieren (im Code-Node `status:'error'`) → Kachel
      „offene Fehler" zählt hoch (rot).
- [ ] Wand im Vollbild auf zweitem Gerät öffnen → aktualisiert sich alle 30 s.

## Bewusst (noch) NICHT drin

- Keine Mandanten/Rollen/Rechte (Team ≤ 10, intern).
- Keine Authentifizierung an der Wand (intern / hinter Reverse-Proxy betreiben).
- Nur Automation-Tracking. Sales-/Projekt-/KPI-Tracking folgen später nach
  demselben Muster (zusätzliche Tabellen + Views + Seiten in `web/`).

## Projektstruktur

```
magical-wall/
├── docker-compose.yml          # Postgres + n8n + web (die Wand)
├── .env.example                # Konfiguration (nach .env kopieren)
├── db/
│   ├── init/                   # läuft beim ersten DB-Start
│   │   ├── 00-create-databases.sh
│   │   └── 01-schema.sql        # agent_runs + alle Views
│   └── seed.sql                # Demo-Daten (manuell)
├── n8n/
│   ├── log_agent_run.workflow.json      # der wiederverwendbare Logger
│   └── example_automation.workflow.json # Vorlage für eine Automation
├── dashboard/
│   └── queries.sql             # SQL-Referenz (gleiche Views), optional für BI
└── web/                        # die Wand: Next.js 16 + Tailwind v4
    ├── app/page.tsx            # Dashboard (Server Component, liest Postgres)
    ├── components/             # Cards, KPI-Kacheln, Chart, Tabelle, Auto-Refresh
    ├── lib/{db,queries}.ts     # Postgres-Pool + Abfragen der Views
    ├── components.json         # shadcn-Config (inkl. @efferd-Registry)
    └── Dockerfile              # Standalone-Image (von docker-compose gebaut)
```
