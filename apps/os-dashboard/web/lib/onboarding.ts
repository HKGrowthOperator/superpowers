// lib/onboarding.ts — Kunden-Onboarding nach gewonnenem Angebot.
// Hält pro Kunde eine 6-Schritte-Checkliste und versendet die zugehörigen
// E-Mails (echter SMTP-Versand via lib/email). Persistenz in Postgres.
import { randomUUID } from "node:crypto";
import { pool } from "./db";
import { sendMail, type SendResult } from "./email";
import { ONBOARDING_STEPS, ONBOARDING_EMAILS, type OnboardingEmailData } from "./onboarding-emails";

export type OnboardingStep = {
  key: string;
  label: string;
  status: "offen" | "erledigt";
  emailSentAt: string | null;
  lastResult?: string;
};
export type Onboarding = {
  id: string;
  offerId: string | null;
  firma: string;
  email: string;
  ansprechpartner: string;
  projekt: string;
  erstelltAm: string;
  steps: OnboardingStep[];
};

const BRAND = process.env.BRAND_NAME || "HK Growth Operator";

let ready: Promise<void> | null = null;
async function ensureSchema(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS onboarding_items (
      id         text PRIMARY KEY,
      data       jsonb NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    );
  `);
}
function init(): Promise<void> {
  if (!ready) ready = ensureSchema();
  return ready;
}

function freshSteps(): OnboardingStep[] {
  return ONBOARDING_STEPS.map((s) => ({ key: s.key, label: s.label, status: "offen", emailSentAt: null }));
}

export async function listOnboarding(): Promise<Onboarding[]> {
  await init();
  const { rows } = await pool.query<{ data: Onboarding }>(
    "SELECT data FROM onboarding_items ORDER BY created_at DESC",
  );
  return rows.map((r) => r.data);
}

export async function getOnboarding(id: string): Promise<Onboarding | null> {
  await init();
  const { rows } = await pool.query<{ data: Onboarding }>("SELECT data FROM onboarding_items WHERE id = $1", [id]);
  return rows[0]?.data ?? null;
}

async function save(o: Onboarding): Promise<void> {
  await pool.query(
    "INSERT INTO onboarding_items (id, data) VALUES ($1, $2) ON CONFLICT (id) DO UPDATE SET data = $2",
    [o.id, JSON.stringify(o)],
  );
}

export async function createOnboarding(input: {
  offerId?: string | null;
  firma: string;
  email?: string;
  ansprechpartner?: string;
  projekt: string;
}): Promise<Onboarding> {
  await init();
  const o: Onboarding = {
    id: randomUUID(),
    offerId: input.offerId ?? null,
    firma: input.firma,
    email: input.email ?? "",
    ansprechpartner: input.ansprechpartner ?? "",
    projekt: input.projekt,
    erstelltAm: new Date().toISOString(),
    steps: freshSteps(),
  };
  await save(o);
  return o;
}

/** Legt aus einem gewonnenen Angebot ein Onboarding an – idempotent pro Angebot. */
export async function createFromOffer(offer: {
  id: string;
  kunde: { firma: string; email: string; ansprechpartner: string };
  extraktion: { leistung: string };
}): Promise<Onboarding | null> {
  await init();
  const { rows } = await pool.query<{ id: string }>(
    "SELECT id FROM onboarding_items WHERE data->>'offerId' = $1 LIMIT 1",
    [offer.id],
  );
  if (rows.length) return null; // schon vorhanden
  return createOnboarding({
    offerId: offer.id,
    firma: offer.kunde.firma,
    email: offer.kunde.email,
    ansprechpartner: offer.kunde.ansprechpartner,
    projekt: offer.extraktion.leistung || offer.kunde.firma || "Projekt",
  });
}

export async function toggleStep(id: string, stepKey: string): Promise<Onboarding | null> {
  const o = await getOnboarding(id);
  if (!o) return null;
  const step = o.steps.find((s) => s.key === stepKey);
  if (!step) return null;
  step.status = step.status === "erledigt" ? "offen" : "erledigt";
  await save(o);
  return o;
}

export async function sendStepEmail(
  id: string,
  stepKey: string,
): Promise<{ onboarding: Onboarding; result: SendResult } | null> {
  const o = await getOnboarding(id);
  if (!o) return null;
  const step = o.steps.find((s) => s.key === stepKey);
  const builder = ONBOARDING_EMAILS[stepKey];
  if (!step || !builder) return null;

  const data: OnboardingEmailData = {
    kundeName: o.ansprechpartner || o.firma || "",
    firma: o.firma,
    projekt: o.projekt,
    absender: BRAND,
    firmaName: BRAND,
    portalUrl: process.env.APP_PUBLIC_URL || undefined,
  };
  const mail = builder(data);
  const result = await sendMail({ to: o.email, subject: mail.subject, html: mail.html });

  if (result.sent) {
    step.emailSentAt = new Date().toISOString();
    step.status = "erledigt";
    step.lastResult = "gesendet";
  } else {
    step.lastResult = result.reason === "no-smtp" ? "SMTP nicht eingerichtet" : `Fehler: ${result.reason}`;
  }
  await save(o);
  return { onboarding: o, result };
}
