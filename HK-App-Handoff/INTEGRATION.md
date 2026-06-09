# INTEGRATION — wie die HK-App an den Lead-Vertrag andockt

Sprach-neutral. Übersetze den Pseudocode unten in Luis' Sprache (egal ob
JavaScript, Python, Google Apps Script o.a.). Es gibt nur **drei Bausteine**:
**Lead bauen → validieren → an `sendLead()` geben.**

---

## DAS PRINZIP (Entkopplung)
Die HK-App ist eigenständig. Sie kennt KEINEN Server und KEIN externes Zielsystem.
Sie kennt nur:
1. ihr Radar (findet Daten),
2. den **Lead-Vertrag** (`lead-contract.schema.json`),
3. **eine einzige Übergabe-Funktion**: `sendLead(lead)`.

`sendLead()` ist heute ein **Stub** (loggt / schreibt Datei). Morgen/später wird
NUR der Inhalt dieser einen Funktion gegen die echte Übergabe getauscht — der
Rest der App bleibt unangetastet. So ist Luis unabhängig von Server & Radar-2.

```
[ Radar findet Rohdaten ]
        |
        v
[ mapToLead(roh) ]  -> Lead im Vertragsformat (siehe schema)
        |
        v
[ validateLead(lead) ]  -> sicherstellen, dass das Format stimmt
        |
        v
[ sendLead(lead) ]  -> STUB: console/log + Datei.  (Server kommt SPÄTER hierhin)
```

---

## PSEUDOCODE (1:1 übersetzbar)

```
// 1) Rohdaten aus dem Radar -> Lead-Vertrag
function mapToLead(roh):
    return {
        lead_id:   generiereId(),                 // eindeutig
        timestamp: jetztAlsISO8601(),
        source:    "hk-app-radar",
        status:    "neu",
        company:   { name: roh.firma, domain: roh.domain, branche: ..., groesse: ..., ort: ... },
        kontakt:   { name: roh.kontakt, rolle: ..., email: ..., telefon: ... },
        signale:   { trigger: roh.ausloeser, score: roh.score, matched_kriterien: roh.treffer },
        meta:      { notiz: "", raw: roh }
    }

// 2) Kriterien-Filter: nur gute Leads gehen weiter (Werte siehe LEAD-KRITERIEN)
function istQualifiziert(lead):
    return lead.signale.score >= MINDEST_SCORE   // z.B. 70
        // + ggf. weitere Kriterien aus eurer Liste

// 3) Minimal-Validierung gegen den Vertrag
function validateLead(lead):
    pruefe: lead_id, timestamp, source=="hk-app-radar", status in [neu,qualifiziert,uebergeben]
    pruefe: company.name vorhanden
    pruefe: signale.score zwischen 0 und 100
    wenn etwas fehlt -> Fehler werfen / loggen

// 4) Adapter-STUB — die EINZIGE Stelle, die später real angebunden wird
function sendLead(lead):
    validateLead(lead)
    log("LEAD ->", lead)
    schreibeDatei("leads_out/" + lead.lead_id + ".json", lead)   // lokal, kein Server
    // SPÄTER (nicht heute): hier echten Webhook/DB-Call einsetzen

// 5) Hauptablauf (da, wo das Radar einen Treffer hat)
function onRadarTreffer(roh):
    lead = mapToLead(roh)
    if istQualifiziert(lead):
        lead.status = "qualifiziert"
        sendLead(lead)
```

---

## LEAD-KRITERIEN (morgen final eintragen)
- MINDEST_SCORE = [PLATZHALTER, z.B. 70]
- Kriterium 1: [PLATZHALTER]
- Kriterium 2: [PLATZHALTER]
- Kriterium 3: [PLATZHALTER]

---

## WAS HEUTE BEWUSST OFFEN BLEIBT (kein Blocker)
- Echte Server-Anbindung -> kommt SPÄTER, nur in `sendLead()`.
- Externes Zielsystem / anderes Radar -> NICHT Luis' Thema.
- Echte Feldnamen -> morgen mit Luis' echtem Schema (A–G) abgleichen.

Bis dahin läuft die HK-App komplett lokal und testbar.
