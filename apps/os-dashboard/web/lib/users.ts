import bcrypt from "bcryptjs";
import { q, pool } from "./db";
import { ensureCoreSchema } from "./schema";

type UserRow = { email: string; password_hash: string };

let bootstrapDone = false;
// Legt das Schema an und – falls noch kein Benutzer existiert – den ersten Login
// aus BOOTSTRAP_EMAIL/BOOTSTRAP_PASSWORD. So braucht ein frisches Deployment
// (z. B. Vercel + Neon) keinen manuellen Skript-Aufruf.
export async function ensureBootstrapUser(): Promise<void> {
  if (bootstrapDone) return;
  await ensureCoreSchema();
  const email = process.env.BOOTSTRAP_EMAIL;
  const password = process.env.BOOTSTRAP_PASSWORD;
  if (email && password) {
    const { rows } = await pool.query<{ n: string }>("SELECT count(*)::text AS n FROM users");
    if (rows[0]?.n === "0") {
      const hash = await bcrypt.hash(password, 10);
      await pool.query("INSERT INTO users (email, password_hash) VALUES ($1, $2) ON CONFLICT (email) DO NOTHING", [email, hash]);
    }
  }
  bootstrapDone = true;
}

// Prüft E-Mail + Passwort gegen die users-Tabelle. Gibt den Benutzer zurück oder null.
export async function verifyCredentials(email: string, password: string) {
  const rows = await q<UserRow>(
    "SELECT email, password_hash FROM users WHERE lower(email) = lower($1) LIMIT 1",
    [email],
  );
  const user = rows[0];
  if (!user) return null;
  const ok = await bcrypt.compare(password, user.password_hash);
  return ok ? { email: user.email } : null;
}
