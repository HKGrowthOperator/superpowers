/**
 * Einfache JSON-Datei-Persistenz fuer Nachrichten und Aufgaben.
 *
 * In einer bestehenden App kann statt dessen eine eigene Persistenz
 * verwendet werden — createInboxApi() akzeptiert jedes Objekt mit
 * derselben Schnittstelle (addMessage, addTask, findMessage, findTask,
 * state, save).
 */

import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';

export class Store {
  /**
   * @param {string} dataDir Verzeichnis fuer inbox.json
   * @param {{seedDemo?: boolean}} [options] seedDemo legt beim ersten
   *   Start Beispiel-Anfragen an (nur fuer Demos sinnvoll)
   */
  constructor(dataDir, { seedDemo = false } = {}) {
    this.file = path.join(dataDir, 'inbox.json');
    mkdirSync(dataDir, { recursive: true });
    if (existsSync(this.file)) {
      this.state = JSON.parse(readFileSync(this.file, 'utf8'));
    } else {
      this.state = { messages: [], tasks: [], nextId: 1 };
      if (seedDemo) seed(this);
      this.save();
    }
  }

  save() {
    writeFileSync(this.file, JSON.stringify(this.state, null, 2));
  }

  nextId() {
    return this.state.nextId++;
  }

  addMessage(msg) {
    this.state.messages.unshift(msg);
    this.save();
    return msg;
  }

  addTask(task) {
    this.state.tasks.unshift(task);
    this.save();
    return task;
  }

  findMessage(id) {
    return this.state.messages.find((m) => m.id === id);
  }

  findTask(id) {
    return this.state.tasks.find((t) => t.id === id);
  }
}

function seed(store) {
  const demo = [
    {
      channel: 'E-Mail',
      from: 'mueller@beispiel-gmbh.de',
      subject: 'Anfrage Website-Relaunch',
      body: 'Guten Tag, wir möchten unsere Website komplett überarbeiten lassen. Budget liegt bei ca. 5.000 €, Zeitrahmen wären 4 Wochen. Können Sie uns ein Angebot machen?',
      kategorie: 'Vertrieb', prioritaet: 'Hoch',
      zusammenfassung: 'Kunde möchte Website-Relaunch. Budget: ca. 5.000 €. Zeitrahmen: 4 Wochen.',
      naechsterSchritt: 'Angebot erstellen und Erstgespräch vorschlagen.',
      hoursAgo: 2,
    },
    {
      channel: 'Instagram',
      from: '@anna.kreativ',
      subject: '',
      body: 'Hi! Ich habe euer Reel gesehen. Was kostet bei euch so eine Automatisierung für ein kleines Studio?',
      kategorie: 'Vertrieb', prioritaet: 'Mittel',
      zusammenfassung: 'Interessentin fragt nach Preisen für Automatisierung (kleines Studio).',
      naechsterSchritt: 'Per DM antworten und Discovery-Call anbieten.',
      hoursAgo: 5,
    },
    {
      channel: 'E-Mail',
      from: 'l.schmidt@mail.de',
      subject: 'Bewerbung als Werkstudent',
      body: 'Sehr geehrte Damen und Herren, anbei meine Bewerbung als Werkstudent im Bereich Marketing. Lebenslauf im Anhang.',
      kategorie: 'Recruiting', prioritaet: 'Mittel',
      zusammenfassung: 'Bewerbung als Werkstudent Marketing, Lebenslauf im Anhang.',
      naechsterSchritt: 'An Recruiting weiterleiten und Eingangsbestätigung senden.',
      hoursAgo: 8,
    },
    {
      channel: 'WhatsApp',
      from: '+49 171 2345678',
      subject: '',
      body: 'Hallo, das Kontaktformular auf unserer Seite funktioniert seit gestern nicht mehr. Das ist dringend, uns gehen Anfragen verloren!',
      kategorie: 'Kundenbetreuung', prioritaet: 'Hoch',
      zusammenfassung: 'Bestandskunde meldet: Kontaktformular seit gestern defekt, dringend.',
      naechsterSchritt: 'Sofort prüfen und Kunde innerhalb 1 Stunde Rückmeldung geben.',
      hoursAgo: 1,
    },
    {
      channel: 'E-Mail',
      from: 'buchhaltung@hosting-partner.de',
      subject: 'Rechnung 2026-0612',
      body: 'Anbei die Rechnung für Juni. Zahlbar innerhalb von 14 Tagen.',
      kategorie: 'Buchhaltung', prioritaet: 'Niedrig',
      zusammenfassung: 'Hosting-Rechnung Juni, Zahlungsziel 14 Tage.',
      naechsterSchritt: 'Zur Zahlung freigeben und ablegen.',
      hoursAgo: 26,
    },
    {
      channel: 'Kontaktformular',
      from: 'info@werkzeugbau-krause.de',
      subject: 'Terminanfrage',
      body: 'Können wir nächste Woche einen Termin für ein Erstgespräch zur Prozessautomatisierung vereinbaren? Dienstag oder Mittwoch vormittags wäre gut.',
      kategorie: 'Termin', prioritaet: 'Mittel',
      zusammenfassung: 'Terminanfrage Erstgespräch Prozessautomatisierung, Di/Mi vormittags.',
      naechsterSchritt: 'Terminvorschlag senden (Di oder Mi vormittag).',
      hoursAgo: 30,
    },
  ];

  const zustaendig = {
    Vertrieb: 'Vertrieb', Recruiting: 'Recruiting', Buchhaltung: 'Buchhaltung',
    Kundenbetreuung: 'Kundenbetreuung', Lieferanten: 'Einkauf', Termin: 'Büro', Sonstiges: 'Büro',
  };

  for (const d of demo) {
    const id = store.nextId();
    const eingang = new Date(Date.now() - d.hoursAgo * 3600_000).toISOString();
    store.state.messages.push({
      id,
      channel: d.channel,
      from: d.from,
      subject: d.subject,
      body: d.body,
      kategorie: d.kategorie,
      prioritaet: d.prioritaet,
      zustaendig: zustaendig[d.kategorie],
      zusammenfassung: d.zusammenfassung,
      naechsterSchritt: d.naechsterSchritt,
      status: 'Neu',
      quelle: 'demo',
      eingang,
    });
    store.state.tasks.push({
      id: store.nextId(),
      messageId: id,
      titel: `${d.kategorie}: ${d.subject || d.zusammenfassung.slice(0, 60)}`,
      beschreibung: d.naechsterSchritt,
      verantwortlich: zustaendig[d.kategorie],
      status: 'offen',
      erstellt: eingang,
    });
  }
}
