# Auf dem Server betreiben — CasaOS + Tailscale

Diese Anleitung bringt das Cockpit von „läuft auf meinem Rechner" zu
„läuft auf dem Server, erreichbar über Tailscale" — mit echtem HTTPS.

## Es gibt KEINE geheimen Zugangsdaten von außen

Alles, was die App braucht, legst **du** fest. Hier die vollständige Liste:

| Wert | Wofür | Woher |
|---|---|---|
| `POSTGRES_PASSWORD` | Datenbank-Passwort | **du wählst** (stark) |
| `AUTH_SECRET` | Session-Signatur der App | `openssl rand -hex 32` |
| `N8N_ENCRYPTION_KEY` | n8n-Verschlüsselung | `openssl rand -hex 32` |
| `ANTHROPIC_API_KEY` | KI-Assistent | dein Anthropic-Konto |
| `GOOGLE_CLIENT_ID` / `..._SECRET` | Google Drive | deine Google-Cloud-App |
| `GOOGLE_REDIRECT_URI` | Drive-Rücksprung | deine Tailscale-URL + `/api/google/callback` |
| **App-Login (E-Mail + Passwort)** | Dashboard-Login | **du legst ihn selbst an** (Schritt 4) |
| Tailscale-Hostname | öffentliche URL | dein Tailnet (MagicDNS) |

Es gibt **keine** vorgegebenen IPs, keine versteckten Passwörter, keinen
externen Login. Die Datenbank ist im Server-Compose gar nicht nach außen offen.

---

## Schritt 1 — Projekt auf den Server bringen

Per Tailscale auf den Server (SSH) und den Projektordner dort ablegen
(`git clone` oder den Ordner kopieren — derselbe, den du lokal hast, inkl.
`web/`, `db/`, `docker-compose.server.yml`, `.env.server.example`).

## Schritt 2 — `.env` ausfüllen

```bash
cd <projektordner>
cp .env.server.example .env
openssl rand -hex 32   # → AUTH_SECRET
openssl rand -hex 32   # → N8N_ENCRYPTION_KEY
nano .env              # alle Werte eintragen
```

`GOOGLE_REDIRECT_URI` setzt du erst in Schritt 5 final (du brauchst die
Tailscale-URL). Vorerst leer lassen ist ok.

## Schritt 3 — Starten

```bash
docker compose -f docker-compose.server.yml --env-file .env up -d --build
```

Das baut die Web-App und startet Postgres, n8n und Web. Beim ersten Start legt
Postgres automatisch Tabellen + leere `users`-Tabelle an.

## Schritt 4 — Login-Benutzer anlegen (wichtig!)

Es existiert noch kein Login. Lege deinen an:

```bash
docker compose -f docker-compose.server.yml exec -T web \
  node scripts/create-user.mjs "deine@mail.de" "DEIN_PASSWORT"
```

Damit loggst du dich später im Dashboard ein. (Befehl erneut ausführen =
Passwort ändern.)

## Schritt 5 — Öffentlich via Tailscale (HTTPS)

Tailscale liefert eine echte HTTPS-Adresse — wichtig, weil die App das
Login-Cookie nur über HTTPS setzt **und** Google für den Drive-Rücksprung
HTTPS verlangt.

1. Im **Tailscale-Admin** (login.tailscale.com → DNS) **MagicDNS** und
   **HTTPS-Zertifikate** aktivieren.
2. Auf dem Server den Web-Port freigeben:
   ```bash
   tailscale serve --bg 3000
   tailscale serve status     # zeigt die URL, z. B. https://server.tailXXXX.ts.net
   ```
3. Diese URL ist deine Cockpit-Adresse. (Nur Geräte in deinem Tailnet sehen sie.)

## Schritt 6 — Google-Drive-URL nachziehen

1. In der **Google-Cloud-Konsole** beim **Webanwendung**-Client unter
   „Autorisierte Weiterleitungs-URIs" zusätzlich eintragen:
   ```
   https://server.tailXXXX.ts.net/api/google/callback
   ```
2. In `.env` denselben Wert setzen:
   ```
   GOOGLE_REDIRECT_URI=https://server.tailXXXX.ts.net/api/google/callback
   ```
3. Neu laden:
   ```bash
   docker compose -f docker-compose.server.yml --env-file .env up -d
   ```

Fertig: `https://server.tailXXXX.ts.net` öffnen → einloggen →
**Google Drive → Mit Google verbinden**.

---

## CasaOS-Hinweise

- CasaOS zeigt die drei Container (web, n8n, postgres) nach dem `up -d` in
  seiner Oberfläche an; Start/Stop/Logs gehen auch dort.
- Willst du n8n ebenfalls extern: zweite Freigabe, z. B.
  `tailscale serve --bg --set-path /n8n 5678` (oder eigener Serve-Port).
- Backups: sichere die Ordner `pg_data/` und `n8n_data/` — darin stecken alle
  Daten bzw. n8n-Workflows.

## Häufige Stolpersteine

- **Login-Schleife / „Passwort falsch", obwohl richtig:** Du rufst die App über
  `http://…` statt der `https://…ts.net`-Adresse auf. Das Cookie braucht HTTPS
  → immer die Tailscale-Serve-URL nutzen.
- **`redirect_uri_mismatch` bei Google:** Die URL in `.env` und in der Google-
  Konsole müssen **zeichengenau** gleich sein (inkl. `https://` und Pfad).
- **„noch nicht eingerichtet" auf /drive:** `GOOGLE_CLIENT_ID/SECRET` fehlen in
  `.env` oder `up -d` nach dem Eintragen vergessen.
