// lib/smart-offer.ts — Anbindung des Smart Offer Systems (vendor/smart-offer)
// an die Cockpit-App: Persistenz über Postgres statt JSON-Datei, API-Schlüssel
// aus der bestehenden Schlüsselverwaltung. Die Geschäftslogik selbst bleibt
// unverändert im vendor-Modul.
import { pool } from "./db";
import { getApiKey } from "./assistant";
import { createOfferSystem } from "@/vendor/smart-offer/system.mjs";

export type OfferKunde = { firma: string; ansprechpartner: string; email: string; telefon: string };
export type OfferPosition = { beschreibung: string; menge: number; einzelpreis: number };
export type OfferSummary = {
  id: string;
  nummer: string;
  status: string;
  kunde: OfferKunde;
  leistung: string;
  summe: number;
  erstelltAm: string;
  versendetAm: string | null;
  faelligeFollowUps: number;
};
export type Offer = {
  id: string;
  nummer: string;
  status: string;
  erstelltAm: string;
  versendetAm: string | null;
  entschiedenAm: string | null;
  kunde: OfferKunde;
  lead: { quelle: string; beschreibung: string; eingegangenAm: string };
  extraktion: {
    leistung: string;
    preis: number | null;
    zahlungsmodell: string | null;
    lieferzeit: string | null;
    zusammenfassung: string;
    methode: string;
  };
  positionen: OfferPosition[];
  texte: Record<string, string>;
  verlauf: { am: string; ereignis: string }[];
};
export type OfferStats = {
  gesamt: number;
  entwurf: number;
  geprueft: number;
  versendet: number;
  offen: number;
  gewonnen: number;
  verloren: number;
  abschlussquote: number | null;
  offenesVolumen: number;
  gewonnenesVolumen: number;
};
export type OfferTask = { id: string; titel: string; beschreibung: string; erledigt?: boolean; offerId?: string };
export type OutboxEntry = { id: string; status: string; betreff?: string; an?: string; text?: string };

type OfferSystem = {
  listOffers(): OfferSummary[];
  getOffer(id: string): Offer;
  createLead(lead: Record<string, unknown>): Promise<Offer>;
  updateOffer(id: string, patch: Record<string, unknown>): Offer;
  changeStatus(id: string, status: string): Offer;
  renderPdf(id: string): Uint8Array;
  stats(): { stats: OfferStats; offeneAufgaben: number; outboxEntwuerfe: number };
  listOutbox(): OutboxEntry[];
  listTasks(): OfferTask[];
  completeTask(id: string): OfferTask;
  processFollowUps(): { neueErinnerungen: number; neueAufgaben: number };
};

type Snap = Record<string, unknown>;

let ready: Promise<void> | null = null;
async function ensureSchema(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS smartoffer_kv (
      name       text PRIMARY KEY,
      data       jsonb NOT NULL,
      updated_at timestamptz NOT NULL DEFAULT now()
    );
  `);
}
function init(): Promise<void> {
  if (!ready) ready = ensureSchema();
  return ready;
}

async function loadSnap(): Promise<Snap> {
  await init();
  const { rows } = await pool.query<{ name: string; data: unknown }>("SELECT name, data FROM smartoffer_kv");
  const snap: Snap = {};
  for (const r of rows) snap[r.name] = r.data;
  return snap;
}

// Synchroner Store mit der JsonStore-Schnittstelle (load/save), der auf einem
// vorab geladenen Postgres-Snapshot arbeitet. Geänderte Schlüssel werden nach
// der Operation zurückgeschrieben.
class PgStore {
  constructor(private snap: Snap, private dirty: Set<string>) {}
  load(name: string, fallback: unknown) {
    return name in this.snap ? this.snap[name] : structuredClone(fallback);
  }
  save(name: string, data: unknown) {
    this.snap[name] = data;
    this.dirty.add(name);
  }
}

/** Führt eine Operation gegen das Offer-System aus und persistiert Änderungen in Postgres. */
export async function withOfferSystem<T>(fn: (sos: OfferSystem) => Promise<T> | T): Promise<T> {
  const snap = await loadSnap();
  const dirty = new Set<string>();
  const store = new PgStore(snap, dirty);
  const anthropicApiKey = (await getApiKey()) ?? undefined;
  const sos = createOfferSystem({ store, anthropicApiKey }) as unknown as OfferSystem;
  const result = await fn(sos);
  for (const name of dirty) {
    await pool.query(
      "INSERT INTO smartoffer_kv (name, data) VALUES ($1, $2) ON CONFLICT (name) DO UPDATE SET data = $2, updated_at = now()",
      [name, JSON.stringify(snap[name])],
    );
  }
  return result;
}
