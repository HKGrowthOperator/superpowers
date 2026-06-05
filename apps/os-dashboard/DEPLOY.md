# So bringst du die App online (Schritt für Schritt)

Diese Anleitung ist bewusst einfach gehalten. Du brauchst **kein** Technik-Wissen –
nur Kopieren & Einfügen. Geschätzte Zeit: ~30–45 Minuten.

Am Ende erreichst du dein Cockpit unter `https://cockpit.deinefirma.de` und
meldest dich mit E-Mail + Passwort an.

---

## Überblick: Was wir tun

1. Einen kleinen Server mieten (~5 €/Monat).
2. Zwei Adressen (Subdomains) deiner Domain auf den Server zeigen lassen.
3. Das Projekt auf den Server bringen und mit **einem Befehl** starten.
4. Dein Login-Konto anlegen.

Deine bestehende Website und E-Mail bleiben davon **unberührt** – wir hängen
nur zwei neue Unter-Adressen an deine Domain.

---

## Schritt 1 — Kleinen Server mieten

Empfehlung: **Hetzner Cloud** (deutsches Rechenzentrum, günstig, DSGVO-freundlich).

1. Konto erstellen auf https://console.hetzner.cloud
2. „New Project" → Namen geben (z. B. `magical-wall`).
3. „Add Server":
   - Standort: **Nürnberg** oder **Falkenstein**
   - Image: **Ubuntu 24.04**
   - Typ: **CX22** (genügt locker, ~4–5 €/Monat)
   - Authentifizierung: am einfachsten **Passwort** setzen (oder SSH-Key, falls bekannt)
4. „Create & Buy now".
5. Notiere dir die **IP-Adresse** des Servers (z. B. `49.12.34.56`).

> 💡 Wenn du hier unsicher bist: Schick mir einfach die IP-Adresse und sag Bescheid –
> ich führe dich durch den Rest oder übernehme die Server-Schritte mit dir zusammen.

---

## Schritt 2 — Deine Subdomains auf den Server zeigen lassen

Bei deinem **Domain-Anbieter** (wo Website + E-Mail liegen) gibt es einen Bereich
„DNS" oder „DNS-Einstellungen". Dort legst du **zwei Einträge** an:

| Typ | Name        | Wert (Ziel)        |
|-----|-------------|--------------------|
| A   | `cockpit`       | deine Server-IP |
| A   | `automationen`  | deine Server-IP |

Daraus werden `cockpit.deinefirma.de` (die App) und
`automationen.deinefirma.de` (die Werkstatt n8n).

> Wichtig: Nur **A-Einträge hinzufügen**. Vorhandene Einträge (Website, E-Mail/MX)
> bleiben unverändert. Es kann bis zu einer Stunde dauern, bis sie aktiv sind.

---

## Schritt 3 — Projekt auf den Server bringen & starten

Verbinde dich mit dem Server (im Terminal/Eingabeaufforderung):

```bash
ssh root@DEINE-SERVER-IP
```

**Docker installieren** (einmalig, ein Befehl):

```bash
curl -fsSL https://get.docker.com | sh
```

**Projekt holen** (eine der beiden Varianten):

```bash
# Variante A: wenn das Projekt in einem Git-Repo liegt
git clone DEINE-REPO-URL magical-wall && cd magical-wall

# Variante B: Projekt vom eigenen Rechner hochladen (vom eigenen Rechner aus):
# scp -r ./magical-wall root@DEINE-SERVER-IP:/root/
```

**Konfiguration anlegen** und ausfüllen:

```bash
cp .env.example .env
nano .env     # Werte eintragen, dann mit Strg+O speichern, Strg+X schließen
```

In der `.env` mindestens setzen:
- `POSTGRES_PASSWORD` – ein starkes Passwort (frei wählbar)
- `N8N_BASIC_AUTH_PASSWORD` – Passwort für die n8n-Werkstatt
- `N8N_ENCRYPTION_KEY` – mit `openssl rand -hex 32` erzeugen
- `AUTH_SECRET` – mit `openssl rand -hex 32` erzeugen
- `APP_DOMAIN=cockpit.deinefirma.de`
- `N8N_DOMAIN=automationen.deinefirma.de`
- `ACME_EMAIL=info@deinefirma.de`

**Starten** (ein Befehl – baut & startet alles, https kommt automatisch):

```bash
docker compose up -d
```

---

## Schritt 4 — Dein Login-Konto anlegen

```bash
docker compose exec web node scripts/create-user.mjs info@hkgrowth-operator.de 'DEIN-PASSWORT'
```

Weitere Teammitglieder fügst du genauso hinzu – einfach mit deren E-Mail und Passwort.

---

## Fertig 🎉

Öffne im Browser: **https://cockpit.deinefirma.de**
→ Login-Seite → E-Mail + Passwort → dein Cockpit.

Auf dem Handy: Adresse in Safari öffnen → Teilen-Symbol → „Zum Home-Bildschirm" →
du hast ein App-Symbol wie eine echte App.

Die Werkstatt (Automationen bauen) erreichst du unter
**https://automationen.deinefirma.de**.

---

## Updates später einspielen

Wenn wir das Dashboard verbessern oder neue Agents bauen:

```bash
cd magical-wall
git pull          # oder neue Dateien hochladen
docker compose up -d --build
```

## Sicherheit (empfohlen, optional)

Nur die Web-Eingänge offen lassen:

```bash
ufw allow 22 && ufw allow 80 && ufw allow 443 && ufw enable
```
