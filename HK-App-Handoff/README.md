# HANDOFF-KIT — HK-App Lead-Pipeline
Vorbereitet am 2026-06-09. Ziel: morgen nur noch Luis' App-Datei finden, Kit
einrasten, läuft.

## INHALT
- `lead-contract.schema.json` — Das feste Lead-Format (JSON-Schema). Der Vertrag.
- `lead-example.json`         — Ein fertiger Beispiel-Lead zum Testen.
- `INTEGRATION.md`            — Pseudocode + Anleitung, wie die App andockt
                                (mapToLead → filter → validate → sendLead-Stub).
- `claude-code-prompt.md`     — Prompt, den Luis in Claude Code pastet.

## ABLAUF MORGEN (in Reihenfolge)
1. Diesen `handoff-kit`-Ordner in Luis' Projekt-Repo legen.
2. Luis' App-Datei (das Radar) finden.
3. `claude-code-prompt.md` in Claude Code pasten; die [PLATZHALTER] ausfüllen:
   - was zuletzt gebaut wurde
   - die echten Lead-Kriterien + Mindest-Score
4. Claude Code setzt mapToLead/filter/validate/sendLead aus `INTEGRATION.md` um.
5. Mit `lead-example.json` testen → Pipeline läuft lokal (ohne Server/Radar-2).
6. Luis' echtes Schema (A–G) gegen `lead-contract.schema.json` abgleichen,
   Feldnamen fixieren.
7. Fertig zum Weiterbauen.

## DREI DINGE BLEIBEN BEWUSST OFFEN (kein Blocker)
- Server/Infra  → später, nur in der einen Funktion `sendLead()`.
- Externes Zielsystem / anderes Radar → nicht Luis' Thema.
- Echte Feldnamen → Schritt 6.

So bleibt Luis' Teil eigenständig und genau wie vor der Unterbrechung.
