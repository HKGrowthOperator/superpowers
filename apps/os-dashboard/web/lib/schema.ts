// lib/schema.ts — legt das Kern-Schema bei Bedarf selbst an (idempotent).
// Nötig auf verwalteten Datenbanken (z. B. Neon), wo die Docker-Init-Skripte
// nicht laufen. Alles CREATE ... IF NOT EXISTS / CREATE OR REPLACE.
import { pool } from "./db";

const DDL = `
CREATE TABLE IF NOT EXISTS agent_runs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  automation  text NOT NULL,
  trigger     text NOT NULL DEFAULT 'manual',
  status      text NOT NULL DEFAULT 'running' CHECK (status IN ('running','success','error')),
  started_at  timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  tokens_in   integer NOT NULL DEFAULT 0,
  tokens_out  integer NOT NULL DEFAULT 0,
  cost_eur    numeric(10,4) NOT NULL DEFAULT 0,
  summary     text,
  output      text,
  error       text
);
CREATE INDEX IF NOT EXISTS idx_agent_runs_started ON agent_runs (started_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_runs_status ON agent_runs (status);
CREATE INDEX IF NOT EXISTS idx_agent_runs_automation ON agent_runs (automation);

CREATE OR REPLACE VIEW v_runs AS
  SELECT *, EXTRACT(EPOCH FROM (COALESCE(finished_at, now()) - started_at)) AS duration_sec FROM agent_runs;
CREATE OR REPLACE VIEW v_runs_today AS
  SELECT count(*) AS runs_today FROM agent_runs WHERE started_at >= date_trunc('day', now());
CREATE OR REPLACE VIEW v_success_rate_7d AS
  SELECT round(100.0 * count(*) FILTER (WHERE status='success') / NULLIF(count(*) FILTER (WHERE status IN ('success','error')),0),1) AS success_rate_pct
  FROM agent_runs WHERE started_at >= now() - interval '7 days';
CREATE OR REPLACE VIEW v_cost_month AS
  SELECT COALESCE(sum(cost_eur),0) AS cost_eur_month FROM agent_runs WHERE started_at >= date_trunc('month', now());
CREATE OR REPLACE VIEW v_open_errors AS
  SELECT count(*) AS open_errors FROM agent_runs WHERE status='error' AND started_at >= now() - interval '7 days';
CREATE OR REPLACE VIEW v_daily_trend AS
  SELECT date_trunc('day', started_at)::date AS day, count(*) AS runs,
         count(*) FILTER (WHERE status='error') AS errors, sum(cost_eur) AS cost_eur
  FROM agent_runs WHERE started_at >= now() - interval '30 days' GROUP BY 1 ORDER BY 1;
CREATE OR REPLACE VIEW v_recent_runs AS
  SELECT automation, trigger, status, started_at,
         round(EXTRACT(EPOCH FROM (COALESCE(finished_at, now()) - started_at))::numeric,1) AS duration_sec,
         cost_eur, summary, error
  FROM agent_runs ORDER BY started_at DESC LIMIT 20;

CREATE TABLE IF NOT EXISTS users (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email         text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS module_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), module text NOT NULL, data jsonb NOT NULL,
  position double precision NOT NULL DEFAULT 0, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS module_items_module_idx ON module_items (module);

CREATE TABLE IF NOT EXISTS app_secrets (
  key text PRIMARY KEY, value jsonb NOT NULL, updated_at timestamptz NOT NULL DEFAULT now()
);
`;

let ready: Promise<void> | null = null;
export function ensureCoreSchema(): Promise<void> {
  if (!ready) ready = pool.query(DDL).then(() => undefined);
  return ready;
}
