// Follow-up-Engine: Niemand vergisst mehr das Nachfassen.
//
// Regel 1: 3 Tage nach Versand ohne Entscheidung → Erinnerungs-E-Mail (Entwurf in Outbox)
// Regel 2: 7 Tage nach Versand ohne Entscheidung → Aufgabe für den Vertrieb

import { randomUUID } from 'node:crypto';
import { DEFAULT_SETTINGS, TEXTBAUSTEINE, STATUS } from './templates.mjs';

const TAG_MS = 24 * 60 * 60 * 1000;

export function dueFollowUps(offer, now = new Date(), settings = DEFAULT_SETTINGS) {
  if (offer.status !== STATUS.VERSENDET || !offer.versendetAm) return [];
  const tageSeitVersand = (now.getTime() - new Date(offer.versendetAm).getTime()) / TAG_MS;
  const bereits = new Set(offer.followUps.map((f) => f.typ));
  const due = [];
  if (tageSeitVersand >= settings.followUpErinnerungTage && !bereits.has('erinnerung')) {
    due.push('erinnerung');
  }
  if (tageSeitVersand >= settings.followUpVertriebTage && !bereits.has('vertriebsaufgabe')) {
    due.push('vertriebsaufgabe');
  }
  return due;
}

// Verarbeitet alle fälligen Follow-ups. Mutiert offers und gibt die neu
// erzeugten Outbox-Einträge und Aufgaben zurück.
export function runFollowUps(offers, now = new Date(), settings = DEFAULT_SETTINGS) {
  const outbox = [];
  const aufgaben = [];

  for (const offer of offers) {
    for (const typ of dueFollowUps(offer, now, settings)) {
      offer.followUps.push({ typ, am: now.toISOString() });

      if (typ === 'erinnerung') {
        outbox.push({
          id: randomUUID(),
          angebotId: offer.id,
          angebotNummer: offer.nummer,
          an: offer.kunde.email,
          betreff: `Erinnerung: Unser Angebot ${offer.nummer}`,
          text: TEXTBAUSTEINE.followUpErinnerung({
            ansprechpartner: offer.kunde.ansprechpartner,
            angebotNummer: offer.nummer,
            leistung: offer.extraktion.leistung
          }),
          erstelltAm: now.toISOString(),
          status: 'entwurf'
        });
        offer.verlauf.push({ am: now.toISOString(), ereignis: 'Follow-up: Erinnerungs-E-Mail erstellt (Outbox)' });
      }

      if (typ === 'vertriebsaufgabe') {
        aufgaben.push({
          id: randomUUID(),
          angebotId: offer.id,
          angebotNummer: offer.nummer,
          titel: `Nachfassen: ${offer.kunde.firma || offer.kunde.email} — Angebot ${offer.nummer}`,
          beschreibung:
            `Angebot ${offer.nummer} (${offer.extraktion.leistung}) ist seit ` +
            `${settings.followUpVertriebTage}+ Tagen ohne Rückmeldung. Bitte telefonisch nachfassen.`,
          erstelltAm: now.toISOString(),
          erledigt: false
        });
        offer.verlauf.push({ am: now.toISOString(), ereignis: 'Follow-up: Aufgabe für Vertrieb erzeugt' });
      }
    }
  }

  return { outbox, aufgaben };
}
