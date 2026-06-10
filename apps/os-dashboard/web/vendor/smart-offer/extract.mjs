// AI-Extraktion: erkennt aus Freitext (Gesprächsnotizen, WhatsApp, E-Mails,
// Formularen) die Angebots-Eckdaten: Leistung, Preis, Zahlungsmodell, Lieferzeit.
//
// Zwei Wege:
//  1. Claude API (wenn ANTHROPIC_API_KEY gesetzt) — versteht auch unstrukturierte Notizen
//  2. Heuristik-Parser (Fallback, läuft offline) — Regex für deutsche Formate

import { LEISTUNGS_KEYWORDS } from './templates.mjs';

const CLAUDE_MODEL = process.env.CLAUDE_MODEL || 'claude-opus-4-8';

const EXTRACTION_SCHEMA = {
  type: 'object',
  properties: {
    leistung: { type: 'string', description: 'Die angefragte Leistung, kurz benannt, z.B. "Website Relaunch"' },
    preis: { type: ['number', 'null'], description: 'Genannter oder geschätzter Nettopreis in Euro, null wenn unbekannt' },
    zahlungsmodell: { type: ['string', 'null'], description: 'z.B. "50/50" oder "30 % Anzahlung", null wenn nicht genannt' },
    lieferzeit: { type: ['string', 'null'], description: 'z.B. "3 Wochen", null wenn nicht genannt' },
    zusammenfassung: { type: 'string', description: 'Anforderungen des Kunden in 2-4 Sätzen zusammengefasst, auf Deutsch' }
  },
  required: ['leistung', 'preis', 'zahlungsmodell', 'lieferzeit', 'zusammenfassung'],
  additionalProperties: false
};

// ---------------------------------------------------------------- Heuristik

export function parsePreis(text) {
  // Deutsche Formate: "4.500 €", "4500€", "EUR 4.500,00", "4.500 Euro"
  const m = text.match(/(?:€|eur(?:o)?\s*)?(\d{1,3}(?:\.\d{3})+|\d{4,6}|\d{1,3})(?:,(\d{2}))?\s*(?:€|eur(?:o)?\b)/i)
    || text.match(/(?:€|eur(?:o)?)\s*(\d{1,3}(?:\.\d{3})+|\d{4,6})(?:,(\d{2}))?/i);
  if (!m) return null;
  const ganz = m[1].replace(/\./g, '');
  const dezimal = m[2] ? `.${m[2]}` : '';
  const wert = Number(ganz + dezimal);
  return Number.isFinite(wert) && wert > 0 ? wert : null;
}

export function parseZahlungsmodell(text) {
  if (/50\s*\/\s*50/.test(text)) return '50/50';
  const anzahlung = text.match(/(\d{1,3})\s*%\s*(?:anzahlung|vorab|vorkasse)/i);
  if (anzahlung) return `${anzahlung[1]} % Anzahlung`;
  if (/vorkasse/i.test(text)) return '100 % Vorkasse';
  if (/(?:nach|bei)\s+fertigstellung/i.test(text) && !/anzahlung/i.test(text)) return 'Zahlung bei Fertigstellung';
  return null;
}

export function parseLieferzeit(text) {
  const m = text.match(/(\d{1,3})\s*(wochen?|tagen?|tage|monaten?|monate)/i);
  if (!m) return null;
  const einheit = m[2].toLowerCase();
  const normalisiert = einheit.startsWith('woche') ? (m[1] === '1' ? 'Woche' : 'Wochen')
    : einheit.startsWith('tag') ? (m[1] === '1' ? 'Tag' : 'Tage')
    : (m[1] === '1' ? 'Monat' : 'Monate');
  return `${m[1]} ${normalisiert}`;
}

export function parseLeistung(text) {
  const lower = text.toLowerCase();
  for (const [keyword, label] of LEISTUNGS_KEYWORDS) {
    if (lower.includes(keyword)) return label;
  }
  const ersteZeile = text.split('\n').map((z) => z.trim()).find(Boolean);
  return ersteZeile ? ersteZeile.slice(0, 80) : 'Projektanfrage';
}

export function extractHeuristic(text) {
  const kompakt = text.trim().replace(/\s+/g, ' ');
  return {
    leistung: parseLeistung(text),
    preis: parsePreis(text),
    zahlungsmodell: parseZahlungsmodell(text),
    lieferzeit: parseLieferzeit(text),
    zusammenfassung: kompakt.length > 400 ? kompakt.slice(0, 400) + '…' : kompakt,
    methode: 'heuristik'
  };
}

// ---------------------------------------------------------------- Claude API

async function extractWithClaude(text, apiKey) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 2048,
      system:
        'Du extrahierst Angebots-Eckdaten aus Anfragen, Gesprächsnotizen und Nachrichten ' +
        'für eine deutsche Digitalagentur. Antworte ausschließlich mit den geforderten Feldern.',
      output_config: { format: { type: 'json_schema', schema: EXTRACTION_SCHEMA } },
      messages: [{ role: 'user', content: `Extrahiere die Angebotsdaten aus folgender Anfrage:\n\n${text}` }]
    })
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Claude API ${response.status}: ${body.slice(0, 200)}`);
  }

  const data = await response.json();
  const textBlock = data.content.find((b) => b.type === 'text');
  const parsed = JSON.parse(textBlock.text);
  return { ...parsed, methode: 'claude' };
}

// Öffentlicher Einstiegspunkt: Claude wenn möglich, sonst Heuristik.
export async function extract(text, opts = {}) {
  const apiKey = opts.apiKey ?? process.env.ANTHROPIC_API_KEY;
  if (apiKey) {
    try {
      return await extractWithClaude(text, apiKey);
    } catch (err) {
      console.error('[extract] Claude API fehlgeschlagen, nutze Heuristik:', err.message);
    }
  }
  return extractHeuristic(text);
}
