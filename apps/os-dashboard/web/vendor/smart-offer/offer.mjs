// Angebots-Logik: Erstellung aus Lead + Extraktion, Nummernvergabe,
// Summenberechnung und Status-Übergänge mit Zeitstempeln.

import { randomUUID } from 'node:crypto';
import { DEFAULT_SETTINGS, TEXTBAUSTEINE, STATUS } from './templates.mjs';

const STATUS_FLOW = {
  [STATUS.ENTWURF]: [STATUS.GEPRUEFT, STATUS.VERLOREN],
  [STATUS.GEPRUEFT]: [STATUS.ENTWURF, STATUS.VERSENDET, STATUS.VERLOREN],
  [STATUS.VERSENDET]: [STATUS.GEWONNEN, STATUS.VERLOREN],
  [STATUS.GEWONNEN]: [],
  [STATUS.VERLOREN]: []
};

export function nextOfferNumber(offers, now = new Date()) {
  const jahr = now.getFullYear();
  const prefix = `AN-${jahr}-`;
  const max = offers
    .filter((o) => o.nummer?.startsWith(prefix))
    .reduce((acc, o) => Math.max(acc, Number(o.nummer.slice(prefix.length)) || 0), 0);
  return `${prefix}${String(max + 1).padStart(4, '0')}`;
}

export function calcSumme(positionen) {
  return positionen.reduce((sum, p) => sum + (Number(p.menge) || 0) * (Number(p.einzelpreis) || 0), 0);
}

export function createOfferFromLead(lead, extracted, offers, settings = DEFAULT_SETTINGS, now = new Date()) {
  const zahlungsmodell = extracted.zahlungsmodell || settings.zahlungsmodellStandard;
  const positionen = [{
    beschreibung: extracted.leistung || 'Projektleistung',
    menge: 1,
    einzelpreis: extracted.preis ?? 0
  }];

  return {
    id: randomUUID(),
    nummer: nextOfferNumber(offers, now),
    status: STATUS.ENTWURF,
    erstelltAm: now.toISOString(),
    versendetAm: null,
    entschiedenAm: null,
    kunde: {
      firma: lead.firma || '',
      ansprechpartner: lead.ansprechpartner || '',
      email: lead.email || '',
      telefon: lead.telefon || ''
    },
    lead: {
      quelle: lead.quelle || 'unbekannt',
      beschreibung: lead.beschreibung || '',
      eingegangenAm: now.toISOString()
    },
    extraktion: {
      leistung: extracted.leistung || '',
      preis: extracted.preis,
      zahlungsmodell,
      lieferzeit: extracted.lieferzeit,
      zusammenfassung: extracted.zusammenfassung || '',
      methode: extracted.methode || 'manuell'
    },
    positionen,
    texte: {
      intro: TEXTBAUSTEINE.intro({ ansprechpartner: lead.ansprechpartner }),
      zahlungsbedingungen: TEXTBAUSTEINE.zahlungsbedingungen({ zahlungsmodell }),
      lieferzeit: TEXTBAUSTEINE.lieferzeit({ lieferzeit: extracted.lieferzeit }),
      gueltigkeit: TEXTBAUSTEINE.gueltigkeit({ tage: settings.angebotGueltigTage }),
      schluss: TEXTBAUSTEINE.schluss()
    },
    followUps: [],
    verlauf: [{ am: now.toISOString(), ereignis: 'Angebotsentwurf automatisch erstellt' }]
  };
}

export function setStatus(offer, neuerStatus, now = new Date()) {
  const erlaubt = STATUS_FLOW[offer.status] || [];
  if (!erlaubt.includes(neuerStatus)) {
    throw new Error(`Statuswechsel von "${offer.status}" nach "${neuerStatus}" nicht erlaubt`);
  }
  offer.status = neuerStatus;
  if (neuerStatus === STATUS.VERSENDET) offer.versendetAm = now.toISOString();
  if (neuerStatus === STATUS.GEWONNEN || neuerStatus === STATUS.VERLOREN) {
    offer.entschiedenAm = now.toISOString();
  }
  offer.verlauf.push({ am: now.toISOString(), ereignis: `Status geändert: ${neuerStatus}` });
  return offer;
}

export function dashboardStats(offers) {
  const count = (s) => offers.filter((o) => o.status === s).length;
  const gewonnen = count(STATUS.GEWONNEN);
  const verloren = count(STATUS.VERLOREN);
  const entschieden = gewonnen + verloren;
  return {
    gesamt: offers.length,
    entwurf: count(STATUS.ENTWURF),
    geprueft: count(STATUS.GEPRUEFT),
    versendet: count(STATUS.VERSENDET),
    offen: count(STATUS.ENTWURF) + count(STATUS.GEPRUEFT) + count(STATUS.VERSENDET),
    gewonnen,
    verloren,
    abschlussquote: entschieden > 0 ? Math.round((gewonnen / entschieden) * 100) : null,
    offenesVolumen: offers
      .filter((o) => [STATUS.ENTWURF, STATUS.GEPRUEFT, STATUS.VERSENDET].includes(o.status))
      .reduce((sum, o) => sum + calcSumme(o.positionen), 0),
    gewonnenesVolumen: offers
      .filter((o) => o.status === STATUS.GEWONNEN)
      .reduce((sum, o) => sum + calcSumme(o.positionen), 0)
  };
}
