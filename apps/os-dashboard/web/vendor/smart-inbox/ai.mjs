/**
 * Optionale AI-Analyse via Claude API.
 *
 * Aktivierung: Option `anthropicApiKey` an createInboxApi() uebergeben
 * oder ANTHROPIC_API_KEY als Umgebungsvariable setzen.
 * Ohne Key liefert aiAnalyze() null und die regelbasierte
 * Klassifizierung aus classifier.mjs greift.
 */

import { KATEGORIEN, PRIORITAETEN, ZUSTAENDIG } from './classifier.mjs';

const API_URL = 'https://api.anthropic.com/v1/messages';
// Klassifizierung + Kurzfassung ist eine einfache Aufgabe: Haiku reicht und
// kostet pro Anfrage einen Bruchteil eines Cents.
const DEFAULT_MODEL = 'claude-haiku-4-5-20251001';

/**
 * Analysiert eine Nachricht mit Claude: Kategorie, Prioritaet,
 * Zusammenfassung und konkreter naechster Schritt.
 *
 * @param {{channel: string, from: string, subject?: string, body?: string}} msg
 * @param {{apiKey?: string, model?: string, zustaendig?: Record<string, string>}} [options]
 * @returns {Promise<object|null>} Analyse oder null (dann Regel-Fallback nutzen)
 */
export async function aiAnalyze(msg, options = {}) {
  const apiKey = options.apiKey ?? process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  const model = options.model ?? process.env.SMART_INBOX_MODEL ?? DEFAULT_MODEL;
  const zustaendig = options.zustaendig ?? ZUSTAENDIG;

  const prompt = [
    'Du bist das Sortier-System einer zentralen Firmen-Inbox.',
    'Analysiere die folgende eingehende Nachricht und antworte AUSSCHLIESSLICH mit einem JSON-Objekt, ohne Markdown.',
    '',
    `Erlaubte Kategorien: ${KATEGORIEN.join(', ')}`,
    `Erlaubte Prioritaeten: ${PRIORITAETEN.join(', ')}`,
    '',
    'JSON-Format:',
    '{"kategorie": "...", "prioritaet": "...", "zusammenfassung": "1-2 Saetze: Wer will was? Budget/Zeitrahmen falls genannt.", "naechsterSchritt": "Eine konkrete Handlungsempfehlung in einem Satz."}',
    '',
    `Kanal: ${msg.channel}`,
    `Absender: ${msg.from}`,
    `Betreff: ${msg.subject ?? '(kein Betreff)'}`,
    'Nachricht:',
    (msg.body ?? '').slice(0, 4000),
  ].join('\n');

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: 400,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    if (!res.ok) {
      console.error(`[smart-inbox] Claude API ${res.status}: ${await res.text()}`);
      return null;
    }
    const data = await res.json();
    const text = data.content?.[0]?.text ?? '';
    const json = JSON.parse(text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1));

    const kategorie = KATEGORIEN.includes(json.kategorie) ? json.kategorie : 'Sonstiges';
    const prioritaet = PRIORITAETEN.includes(json.prioritaet) ? json.prioritaet : 'Mittel';
    return {
      kategorie,
      prioritaet,
      zustaendig: zustaendig[kategorie] ?? 'Büro',
      zusammenfassung: String(json.zusammenfassung ?? '').slice(0, 500),
      naechsterSchritt: String(json.naechsterSchritt ?? '').slice(0, 300),
      quelle: 'ai',
    };
  } catch (err) {
    console.error('[smart-inbox] AI-Analyse fehlgeschlagen, nutze Regel-Fallback:', err.message);
    return null;
  }
}
