import { Pool } from "pg";

// Eine geteilte Connection-Pool-Instanz (überlebt Hot-Reloads im Dev-Modus).
const globalForPg = globalThis as unknown as { pgPool?: Pool };

const connectionString =
  process.env.DATABASE_URL ??
  "postgres://cockpit:change-me-strong-password@localhost:5432/cockpit";

// Verwaltete Anbieter (Neon, Supabase) verlangen SSL. Serverless (Vercel) mag
// kleine Pools + gepoolte Verbindungen. Beides automatisch erkennen.
const needsSsl = /sslmode=require|neon\.tech|supabase|render\.com/.test(connectionString);

export const pool =
  globalForPg.pgPool ??
  new Pool({
    connectionString,
    max: Number(process.env.PG_POOL_MAX ?? 5),
    ssl: needsSsl ? { rejectUnauthorized: false } : undefined,
  });

if (process.env.NODE_ENV !== "production") globalForPg.pgPool = pool;

export async function q<T>(sql: string, params: unknown[] = []): Promise<T[]> {
  const res = await pool.query(sql, params);
  return res.rows as T[];
}
