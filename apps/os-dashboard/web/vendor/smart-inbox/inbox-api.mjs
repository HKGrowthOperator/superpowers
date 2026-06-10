/**
 * Smart Inbox API — als Modul in jede Node-App einbindbar.
 *
 * Express:
 *   import { createInboxApi } from './smart-inbox/server/inbox-api.mjs';
 *   const inbox = createInboxApi({ dataDir: './data' });
 *   app.use(inbox.middleware());
 *
 * Plain node:http:
 *   const inbox = createInboxApi();
 *   http.createServer(async (req, res) => {
 *     if (await inbox.handle(req, res)) return;
 *     // ... eigene Routen
 *   });
 *
 * Programmatisch (ohne HTTP, z. B. aus eigenem Mail-Parser):
 *   await inbox.ingest({ channel: 'E-Mail', from: '...', subject: '...', body: '...' });
 */

import { Store } from './store.mjs';
import { classify, STATUS, ZUSTAENDIG } from './classifier.mjs';
import { aiAnalyze } from './ai.mjs';

/**
 * @param {object} [options]
 * @param {string}  [options.dataDir='./data']  Ablage fuer inbox.json
 * @param {string}  [options.basePath='/api/inbox']  URL-Prefix aller Endpunkte
 * @param {string}  [options.anthropicApiKey]  aktiviert Claude-Analyse (sonst ENV oder Regel-Modus)
 * @param {string}  [options.model]  Claude-Modell fuer die Analyse
 * @param {string}  [options.notifyWebhookUrl]  Webhook bei neuer Anfrage (Slack/Make/Zapier/n8n)
 * @param {Record<string,string>} [options.zustaendig]  Kategorie → Person/Abteilung
 * @param {boolean} [options.seedDemo=false]  Demo-Daten beim ersten Start anlegen
 * @param {boolean} [options.cors=true]  Access-Control-Allow-Origin: * setzen
 * @param {object}  [options.store]  eigene Persistenz statt JSON-Datei
 */
export function createInboxApi(options = {}) {
  const {
    dataDir = './data',
    basePath = '/api/inbox',
    anthropicApiKey,
    model,
    notifyWebhookUrl = process.env.NOTIFY_WEBHOOK_URL,
    zustaendig = ZUSTAENDIG,
    seedDemo = false,
    cors = true,
  } = options;

  const store = options.store ?? new Store(dataDir, { seedDemo });

  /** Nachricht aufnehmen: AI-Analyse (falls Key) sonst Regeln, Aufgabe anlegen, benachrichtigen. */
  async function ingest(input) {
    const base = {
      channel: String(input.channel),
      from: String(input.from),
      subject: String(input.subject ?? ''),
      body: String(input.body ?? ''),
    };

    const analyse =
      (await aiAnalyze(base, { apiKey: anthropicApiKey, model, zustaendig })) ??
      classify(base, zustaendig);

    const msg = store.addMessage({
      id: store.nextId(),
      ...base,
      ...analyse,
      status: 'Neu',
      eingang: new Date().toISOString(),
    });

    store.addTask({
      id: store.nextId(),
      messageId: msg.id,
      titel: `${msg.kategorie}: ${msg.subject || msg.zusammenfassung.slice(0, 60)}`,
      beschreibung: msg.naechsterSchritt ?? 'Anfrage pruefen und beantworten.',
      verantwortlich: msg.zustaendig,
      status: 'offen',
      erstellt: msg.eingang,
    });

    notify(msg).catch((err) => console.error('[smart-inbox] notify:', err.message));
    return msg;
  }

  /** Verantwortliche Person informieren (Slack/Teams/Make/Zapier/n8n Webhook). */
  async function notify(msg) {
    if (!notifyWebhookUrl) return;
    await fetch(notifyWebhookUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        text: `📥 Neue Anfrage [${msg.kategorie} | ${msg.prioritaet}] für ${msg.zustaendig}\nVon: ${msg.from} (${msg.channel})\n${msg.zusammenfassung}`,
        ...msg,
      }),
    });
  }

  function buildStats() {
    const msgs = store.state.messages;
    const heute = new Date().toISOString().slice(0, 10);
    const count = (arr, key) =>
      arr.reduce((acc, m) => ((acc[m[key]] = (acc[m[key]] ?? 0) + 1), acc), {});
    return {
      gesamt: msgs.length,
      neu: msgs.filter((m) => m.status === 'Neu').length,
      inBearbeitung: msgs.filter((m) => m.status === 'In Bearbeitung').length,
      heuteEingegangen: msgs.filter((m) => m.eingang.slice(0, 10) === heute).length,
      offeneAufgaben: store.state.tasks.filter((t) => t.status === 'offen').length,
      proKategorie: count(msgs, 'kategorie'),
      proKanal: count(msgs, 'channel'),
      proStatus: count(msgs, 'status'),
      proPrioritaet: count(msgs, 'prioritaet'),
    };
  }

  function sendJson(res, status, obj) {
    const headers = { 'content-type': 'application/json; charset=utf-8' };
    if (cors) headers['access-control-allow-origin'] = '*';
    res.writeHead(status, headers);
    res.end(JSON.stringify(obj));
  }

  function readBody(req) {
    return new Promise((resolve) => {
      let data = '';
      req.on('data', (c) => (data += c));
      req.on('end', () => {
        try {
          resolve(data ? JSON.parse(data) : {});
        } catch {
          resolve(null);
        }
      });
    });
  }

  /**
   * Behandelt einen HTTP-Request, falls er unter basePath faellt.
   * @returns {Promise<boolean>} true = behandelt, false = nicht zustaendig
   */
  async function handle(req, res) {
    const url = new URL(req.url, `http://${req.headers.host ?? 'localhost'}`);
    if (url.pathname !== basePath && !url.pathname.startsWith(basePath + '/')) {
      return false;
    }
    const sub = url.pathname.slice(basePath.length) || '/';

    if (req.method === 'OPTIONS' && cors) {
      res.writeHead(204, {
        'access-control-allow-origin': '*',
        'access-control-allow-methods': 'GET,POST,PATCH,OPTIONS',
        'access-control-allow-headers': 'content-type',
      });
      res.end();
      return true;
    }

    // GET {base}/messages?status=&kategorie=&channel=
    if (req.method === 'GET' && sub === '/messages') {
      let list = store.state.messages;
      for (const key of ['status', 'kategorie', 'channel']) {
        const v = url.searchParams.get(key);
        if (v) list = list.filter((m) => m[key] === v);
      }
      sendJson(res, 200, list);
      return true;
    }

    // POST {base}/messages — zentraler Eingang fuer alle Kanaele
    if (req.method === 'POST' && sub === '/messages') {
      const input = await readBody(req);
      if (!input || !input.channel || !input.from || !(input.subject || input.body)) {
        sendJson(res, 400, { error: 'channel, from und subject oder body sind erforderlich' });
        return true;
      }
      sendJson(res, 201, await ingest(input));
      return true;
    }

    // PATCH {base}/messages/:id — Status / Kategorie / Zustaendigkeit aendern
    const msgMatch = sub.match(/^\/messages\/(\d+)$/);
    if (req.method === 'PATCH' && msgMatch) {
      const msg = store.findMessage(Number(msgMatch[1]));
      if (!msg) {
        sendJson(res, 404, { error: 'Nachricht nicht gefunden' });
        return true;
      }
      const patch = await readBody(req);
      if (patch?.status && !STATUS.includes(patch.status)) {
        sendJson(res, 400, { error: `Ungueltiger Status. Erlaubt: ${STATUS.join(', ')}` });
        return true;
      }
      for (const key of ['status', 'kategorie', 'prioritaet', 'zustaendig']) {
        if (patch?.[key] !== undefined) msg[key] = patch[key];
      }
      store.save();
      sendJson(res, 200, msg);
      return true;
    }

    // GET {base}/tasks
    if (req.method === 'GET' && sub === '/tasks') {
      sendJson(res, 200, store.state.tasks);
      return true;
    }

    // PATCH {base}/tasks/:id
    const taskMatch = sub.match(/^\/tasks\/(\d+)$/);
    if (req.method === 'PATCH' && taskMatch) {
      const task = store.findTask(Number(taskMatch[1]));
      if (!task) {
        sendJson(res, 404, { error: 'Aufgabe nicht gefunden' });
        return true;
      }
      const patch = await readBody(req);
      if (patch?.status) task.status = patch.status === 'erledigt' ? 'erledigt' : 'offen';
      store.save();
      sendJson(res, 200, task);
      return true;
    }

    // GET {base}/stats — Kennzahlen fuers Dashboard
    if (req.method === 'GET' && sub === '/stats') {
      sendJson(res, 200, buildStats());
      return true;
    }

    sendJson(res, 404, { error: 'Unbekannter Endpunkt' });
    return true;
  }

  /** Express-/Connect-kompatible Middleware. */
  function middleware() {
    return (req, res, next) => {
      handle(req, res)
        .then((handled) => {
          if (!handled) next();
        })
        .catch(next);
    };
  }

  return { handle, middleware, ingest, store, basePath };
}
