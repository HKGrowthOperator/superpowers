/**
 * Regelbasierte Klassifizierung eingehender Anfragen.
 *
 * Funktioniert komplett offline (kein API-Key noetig) und dient als
 * Fallback, wenn die AI-Analyse (ai.mjs) nicht verfuegbar ist.
 */

export const KATEGORIEN = [
  'Vertrieb',
  'Recruiting',
  'Buchhaltung',
  'Kundenbetreuung',
  'Lieferanten',
  'Termin',
  'Sonstiges',
];

export const STATUS = ['Neu', 'In Bearbeitung', 'Wartet auf Antwort', 'Erledigt'];

export const PRIORITAETEN = ['Hoch', 'Mittel', 'Niedrig'];

// Standard-Zuordnung Kategorie → verantwortliche Person/Abteilung.
// Ueberschreibbar via createInboxApi({ zustaendig: {...} }).
export const ZUSTAENDIG = {
  Vertrieb: 'Vertrieb',
  Recruiting: 'Recruiting',
  Buchhaltung: 'Buchhaltung',
  Kundenbetreuung: 'Kundenbetreuung',
  Lieferanten: 'Einkauf',
  Termin: 'Büro',
  Sonstiges: 'Büro',
};

const KEYWORDS = {
  Recruiting: [
    'bewerbung', 'bewerbe', 'lebenslauf', 'praktikum', 'ausbildung',
    'stellenanzeige', 'stelle', 'job', 'mitarbeit', 'arbeitsprobe',
  ],
  Buchhaltung: [
    'rechnung', 'zahlung', 'mahnung', 'gutschrift', 'invoice',
    'ueberweisung', 'überweisung', 'zahlungserinnerung', 'steuer', 'beleg',
  ],
  Kundenbetreuung: [
    'problem', 'fehler', 'funktioniert nicht', 'support', 'hilfe',
    'reklamation', 'beschwerde', 'defekt', 'kaputt', 'stoerung', 'störung',
  ],
  Lieferanten: [
    'lieferung', 'liefertermin', 'bestellung', 'lieferant', 'material',
    'versand', 'bestellnummer',
  ],
  Termin: [
    'termin', 'meeting', 'rueckruf', 'rückruf', 'besichtigung',
    'vor ort', 'kalender', 'verschieben',
  ],
  Vertrieb: [
    'angebot', 'anfrage', 'preis', 'kosten', 'kostenvoranschlag',
    'interesse', 'projekt', 'website', 'zusammenarbeit', 'beauftragen',
    'budget', 'relaunch', 'automatisierung',
  ],
};

const HOCH_PRIO = [
  'dringend', 'sofort', 'asap', 'eilig', 'heute noch', 'notfall',
  'reklamation', 'beschwerde', 'mahnung', 'frist',
];

const NIEDRIG_PRIO = ['newsletter', 'werbung', 'unsubscribe', 'kein interesse'];

// Matcht nur ganze Woerter ("werbung" darf nicht in "Bewerbung" treffen).
function hatKeyword(text, keyword) {
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(?<![a-zäöüß])${escaped}(?![a-zäöüß])`, 'u').test(text);
}

/**
 * Klassifiziert eine Nachricht.
 * @param {{subject?: string, body?: string}} msg
 * @param {Record<string, string>} [zustaendig] eigene Kategorie→Person-Zuordnung
 * @returns {{kategorie: string, prioritaet: string, zustaendig: string, zusammenfassung: string, quelle: string}}
 */
export function classify(msg, zustaendig = ZUSTAENDIG) {
  const text = `${msg.subject ?? ''} ${msg.body ?? ''}`.toLowerCase();

  let kategorie = 'Sonstiges';
  let bestScore = 0;
  for (const [kat, words] of Object.entries(KEYWORDS)) {
    const score = words.reduce((n, w) => n + (hatKeyword(text, w) ? 1 : 0), 0);
    if (score > bestScore) {
      bestScore = score;
      kategorie = kat;
    }
  }

  let prioritaet = 'Mittel';
  if (HOCH_PRIO.some((w) => hatKeyword(text, w))) prioritaet = 'Hoch';
  else if (NIEDRIG_PRIO.some((w) => hatKeyword(text, w))) prioritaet = 'Niedrig';
  // Neue Kundenanfragen sind Umsatz: nie niedriger als Mittel
  if (kategorie === 'Vertrieb' && prioritaet === 'Niedrig') prioritaet = 'Mittel';

  return {
    kategorie,
    prioritaet,
    zustaendig: zustaendig[kategorie] ?? 'Büro',
    zusammenfassung: kurzfassung(msg),
    quelle: 'regeln',
  };
}

function kurzfassung(msg) {
  const body = (msg.body ?? '').replace(/\s+/g, ' ').trim();
  if (body.length <= 180) return body;
  return body.slice(0, 177).trimEnd() + '…';
}
