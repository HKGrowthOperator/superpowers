# Command Center

Deine zentrale Schaltzentrale — **ein System, viele Module.** Von hier steuerst
du alles: AI Intelligence, SOPs, Kundenbedienung, Konzepte, Automation,
Webseiten. Zero-Dependency, kein Build-Schritt. Erweiterbar Modul für Modul.

## Starten (braucht einen kleinen lokalen Server — nicht `file://`)

Weil die App native ES-Module nutzt, öffne sie über einen lokalen Webserver,
nicht per Doppelklick auf `index.html`.

### Am einfachsten unter Windows (nutzt dein Docker Desktop)

Doppelklick auf **`start-windows.cmd`**. Es öffnet sich ein Browser-Tab unter
<http://localhost:8080>. Lass das schwarze Fenster offen, solange du die App
nutzt; zum Beenden schließen. (Falls der erste Tab leer ist: einmal F5.)

### Oder ein Befehl (PowerShell / macOS / Linux), im Ordner ausführen

```bash
docker run --rm -p 8080:80 -v "${PWD}:/usr/share/nginx/html:ro" nginx
```

Dann <http://localhost:8080> öffnen.

### Oder mit Python

```bash
python -m http.server 8080
```

## Aufbau

```
command-center/
  core/        gemeinsame Basis (schema, dom, store, components, persist)
  modules/     je Modul ein Ordner: data.js (Inhalte) + view.js (Ansicht)
  main.js      registriert alle Module + Daten, baut Sidebar & Routing
  index.html, assets/styles.css
```

Module: Übersicht · AI Intelligence · SOPs · Kundenbedienung · Konzepte ·
Automation · Webseiten · Gespeichert · Einstellungen.

## Daten & Agent

Deine eigenen Einträge und Lesezeichen werden lokal im Browser gespeichert.
Unter **Einstellungen** kannst du sie als JSON **exportieren** (und mir geben,
damit ich sie fest ins Projekt einbaue) oder wieder **importieren**.

## Nach Änderungen prüfen

```bash
node --check core/*.js main.js modules/*/*.js
```

Dann über einen lokalen Server laden und jedes Modul in beiden Themes und am
Mobil-Breakpoint (≤ 880px) durchklicken.
