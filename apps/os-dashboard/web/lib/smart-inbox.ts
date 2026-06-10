// lib/smart-inbox.ts — Anbindung des Smart-Inbox-Moduls (vendor/smart-inbox)
// an die Cockpit-App: zentrale Persistenz über Postgres, API-Schlüssel aus der
// bestehenden Schlüsselverwaltung. Die Klassifizierungs-/AI-Logik bleibt
// unverändert im vendor-Modul.
import { pool } from "./db";
import { getApiKey } from "./assistant";
import { createInboxApi } from "@/vendor/smart-inbox/inbox-api.mjs";
import { STATUS, KATEGORIEN } from "@/vendor/smart-inbox/classifier.mjs";

export const INBOX_STATUS = STATUS as string[];
export const INBOX_KATEGORIEN = KATEGORIEN as string[];

export type InboxMessage = {
  id: number;
  channel: string;
  from: string;
  subject: string;
  body: string;
  kategorie: string;
  prioritaet: string;
  zustaendig: string;
  zusammenfassung: string;
  naechsterSchritt?: string;
  status: string;
  quelle: string;
  eingang: string;
};
export type InboxTask = {
  id: number;
  messageId: number;
  titel: string;
  beschreibung: string;
  verantwortlich: string;
  status: string;
  erstellt: string;
};
export type InboxState = { messages: InboxMessage[]; tasks: InboxTask[]; nextId: number };

export type InboxStats = {
  gesamt: number;
  neu: number;
  inBearbeitung: number;
  heuteEingegangen: number;
  offeneAufgaben: number;
  proKategorie: Record<string, number>;
  proKanal: Record<string, number>;
  proStatus: Record<string, number>;
  proPrioritaet: Record<string, number>;
};

export type IngestInput = { channel: string; from: string; subject?: string; body?: string };

type InboxApi = {
  ingest(input: IngestInput): Promise<InboxMessage>;
  store: { state: InboxState; save(): void };
  basePath: string;
};

let ready: Promise<void> | null = null;
async function ensureSchema(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS smartinbox_state (
      id         int PRIMARY KEY DEFAULT 1,
      state      jsonb NOT NULL,
      updated_at timestamptz NOT NULL DEFAULT now()
    );
  `);
}
function init(): Promise<void> {
  if (!ready) ready = ensureSchema();
  return ready;
}

async function loadState(): Promise<InboxState> {
  await init();
  const { rows } = await pool.query<{ state: InboxState }>("SELECT state FROM smartinbox_state WHERE id = 1");
  return rows[0]?.state ?? { messages: [], tasks: [], nextId: 1 };
}

async function saveState(state: InboxState): Promise<void> {
  await pool.query(
    "INSERT INTO smartinbox_state (id, state) VALUES (1, $1) ON CONFLICT (id) DO UPDATE SET state = $1, updated_at = now()",
    [JSON.stringify(state)],
  );
}

// In-Memory-Store mit der vom Inbox-Modul erwarteten Schnittstelle, der auf dem
// aus Postgres geladenen Zustand arbeitet. save() ist ein No-Op; persistiert
// wird einmal nach der Operation (withInbox).
class MemStore {
  constructor(public state: InboxState) {}
  nextId() {
    return this.state.nextId++;
  }
  addMessage(msg: InboxMessage) {
    this.state.messages.unshift(msg);
    return msg;
  }
  addTask(task: InboxTask) {
    this.state.tasks.unshift(task);
    return task;
  }
  findMessage(id: number) {
    return this.state.messages.find((m) => m.id === id);
  }
  findTask(id: number) {
    return this.state.tasks.find((t) => t.id === id);
  }
  save() {}
}

/** Führt eine Operation gegen die Inbox aus und persistiert den Zustand in Postgres. */
export async function withInbox<T>(fn: (inbox: InboxApi) => Promise<T> | T): Promise<T> {
  const state = await loadState();
  const store = new MemStore(state);
  const anthropicApiKey = (await getApiKey()) ?? undefined;
  const inbox = createInboxApi({ store, anthropicApiKey }) as unknown as InboxApi;
  const result = await fn(inbox);
  await saveState(state);
  return result;
}

/** Kennzahlen fürs Dashboard (entspricht buildStats im vendor-Modul). */
export function inboxStats(state: InboxState): InboxStats {
  const msgs = state.messages;
  const heute = new Date().toISOString().slice(0, 10);
  const count = (arr: InboxMessage[], key: keyof InboxMessage) =>
    arr.reduce<Record<string, number>>((acc, m) => {
      const k = String(m[key]);
      acc[k] = (acc[k] ?? 0) + 1;
      return acc;
    }, {});
  return {
    gesamt: msgs.length,
    neu: msgs.filter((m) => m.status === "Neu").length,
    inBearbeitung: msgs.filter((m) => m.status === "In Bearbeitung").length,
    heuteEingegangen: msgs.filter((m) => m.eingang.slice(0, 10) === heute).length,
    offeneAufgaben: state.tasks.filter((t) => t.status === "offen").length,
    proKategorie: count(msgs, "kategorie"),
    proKanal: count(msgs, "channel"),
    proStatus: count(msgs, "status"),
    proPrioritaet: count(msgs, "prioritaet"),
  };
}
