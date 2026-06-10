// Kern des Smart Offer Systems als einbettbare Bibliothek.
//
// createOfferSystem() kapselt Persistenz + Geschäftslogik und liefert:
//  - programmatische API (createLead, changeStatus, stats, ...) für direkte Nutzung
//  - handleRequest(req, res) als HTTP-Handler für node:http ODER Express
//    (Pfad-Präfix-unabhängig: '/api/offers' und '/offers' funktionieren beide)
//
// Beispiel Express:
//   import { createOfferSystem } from './smart-offer-system/src/index.mjs';
//   const sos = createOfferSystem({ dataDir: './data/angebote' });
//   app.use('/api', (req, res) => sos.handleRequest(req, res));
//   sos.startFollowUpTimer();

import path from 'node:path';

import { JsonStore } from './store.mjs';
import { extract } from './extract.mjs';
import { createOfferFromLead, setStatus, dashboardStats, calcSumme } from './offer.mjs';
import { runFollowUps, dueFollowUps } from './followup.mjs';
import { renderOfferPdf } from './pdf.mjs';
import { DEFAULT_SETTINGS } from './templates.mjs';

function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

export function createOfferSystem(options = {}) {
  const dataDir = options.dataDir || path.join(process.cwd(), 'data');
  // In der eigenen App kann eine eigene Persistenz injiziert werden (z. B. Postgres).
  const store = options.store || new JsonStore(dataDir);
  // API-Schlüssel der Host-App durchreichen (sonst nur process.env).
  const aiKey = options.anthropicApiKey;

  let offers = store.load('angebote', []);
  let outbox = store.load('outbox', []);
  let aufgaben = store.load('aufgaben', []);
  const settings = { ...DEFAULT_SETTINGS, ...store.load('settings', {}), ...(options.settings || {}) };
  store.save('settings', settings);

  function persist() {
    store.save('angebote', offers);
    store.save('outbox', outbox);
    store.save('aufgaben', aufgaben);
  }

  function getOffer(id) {
    const offer = offers.find((o) => o.id === id);
    if (!offer) throw httpError(404, 'Angebot nicht gefunden');
    return offer;
  }

  function offerSummary(offer) {
    return {
      id: offer.id,
      nummer: offer.nummer,
      status: offer.status,
      kunde: offer.kunde,
      leistung: offer.extraktion.leistung,
      summe: calcSumme(offer.positionen),
      erstelltAm: offer.erstelltAm,
      versendetAm: offer.versendetAm,
      faelligeFollowUps: dueFollowUps(offer, new Date(), settings)
    };
  }

  const system = {
    settings,

    listOffers() {
      return [...offers]
        .sort((a, b) => b.erstelltAm.localeCompare(a.erstelltAm))
        .map(offerSummary);
    },

    getOffer,

    // Lead → AI-Extraktion → Angebotsentwurf
    async createLead(lead) {
      if (!lead || !String(lead.beschreibung || '').trim()) {
        throw httpError(400, 'Feld "beschreibung" wird benötigt');
      }
      const extracted = await extract(String(lead.beschreibung), { apiKey: aiKey });
      const offer = createOfferFromLead(lead, extracted, offers, settings);
      offers.push(offer);
      persist();
      return offer;
    },

    updateOffer(id, patch) {
      const offer = getOffer(id);
      if (patch.kunde) Object.assign(offer.kunde, patch.kunde);
      if (patch.extraktion) Object.assign(offer.extraktion, patch.extraktion);
      if (Array.isArray(patch.positionen)) offer.positionen = patch.positionen;
      if (patch.texte) Object.assign(offer.texte, patch.texte);
      offer.verlauf.push({ am: new Date().toISOString(), ereignis: 'Angebot bearbeitet' });
      persist();
      return offer;
    },

    changeStatus(id, status) {
      const offer = getOffer(id);
      try {
        setStatus(offer, status);
      } catch (err) {
        throw httpError(400, err.message);
      }
      persist();
      return offer;
    },

    renderPdf(id) {
      return renderOfferPdf(getOffer(id), settings);
    },

    stats() {
      return {
        stats: dashboardStats(offers),
        offeneAufgaben: aufgaben.filter((a) => !a.erledigt).length,
        outboxEntwuerfe: outbox.filter((o) => o.status === 'entwurf').length
      };
    },

    listOutbox() { return [...outbox].reverse(); },
    listTasks() { return [...aufgaben].reverse(); },

    completeTask(id) {
      const aufgabe = aufgaben.find((a) => a.id === id);
      if (!aufgabe) throw httpError(404, 'Aufgabe nicht gefunden');
      aufgabe.erledigt = true;
      persist();
      return aufgabe;
    },

    // Fällige Follow-ups verarbeiten (Erinnerung nach 3 Tagen, Aufgabe nach 7)
    processFollowUps(now = new Date()) {
      const result = runFollowUps(offers, now, settings);
      if (result.outbox.length || result.aufgaben.length) {
        outbox.push(...result.outbox);
        aufgaben.push(...result.aufgaben);
        persist();
      }
      return { neueErinnerungen: result.outbox.length, neueAufgaben: result.aufgaben.length };
    },

    startFollowUpTimer(intervalMs = 60 * 60 * 1000) {
      system.processFollowUps();
      const timer = setInterval(() => system.processFollowUps(), intervalMs);
      timer.unref?.();
      return timer;
    },

    // ------------------------------------------------------ HTTP-Anbindung

    // Funktioniert mit node:http direkt und als Express-Middleware.
    // Akzeptiert Pfade mit und ohne '/api'-Präfix.
    async handleRequest(req, res) {
      const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
      let pathname = url.pathname.replace(/^\/api(?=\/|$)/, '') || '/';
      const segments = pathname.split('/').filter(Boolean);

      const json = (status, data) => {
        res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify(data));
      };

      try {
        if (req.method === 'GET' && pathname === '/dashboard') return json(200, system.stats());
        if (req.method === 'GET' && pathname === '/offers') return json(200, system.listOffers());
        if (req.method === 'GET' && pathname === '/outbox') return json(200, system.listOutbox());
        if (req.method === 'GET' && pathname === '/tasks') return json(200, system.listTasks());
        if (req.method === 'GET' && pathname === '/settings') return json(200, settings);

        if (req.method === 'POST' && pathname === '/leads') {
          return json(201, await system.createLead(await readBody(req)));
        }

        if (req.method === 'POST' && pathname === '/followups/run') {
          return json(200, system.processFollowUps());
        }

        if (segments[0] === 'offers' && segments[1]) {
          const id = segments[1];
          if (req.method === 'GET' && segments.length === 2) return json(200, getOffer(id));
          if (req.method === 'PUT' && segments.length === 2) {
            return json(200, system.updateOffer(id, await readBody(req)));
          }
          if (req.method === 'POST' && segments[2] === 'status') {
            const { status } = await readBody(req);
            return json(200, system.changeStatus(id, status));
          }
          if (req.method === 'GET' && segments[2] === 'pdf') {
            const offer = getOffer(id);
            res.writeHead(200, {
              'Content-Type': 'application/pdf',
              'Content-Disposition': `inline; filename="Angebot-${offer.nummer}.pdf"`
            });
            return res.end(system.renderPdf(id));
          }
        }

        if (req.method === 'POST' && segments[0] === 'tasks' && segments[2] === 'done') {
          return json(200, system.completeTask(segments[1]));
        }

        return json(404, { fehler: 'Unbekannte Route' });
      } catch (err) {
        return json(err.status || 500, { fehler: err.message });
      }
    }
  };

  return system;
}

function readBody(req) {
  // Express mit aktivem express.json() hat den Body schon geparst
  if (req.body && typeof req.body === 'object') return Promise.resolve(req.body);
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 1e6) { req.destroy(); reject(httpError(413, 'Body zu groß')); }
    });
    req.on('end', () => {
      try { resolve(body ? JSON.parse(body) : {}); }
      catch { reject(httpError(400, 'Ungültiges JSON')); }
    });
    req.on('error', reject);
  });
}
