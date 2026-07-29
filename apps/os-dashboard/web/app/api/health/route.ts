import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { ensureCoreSchema } from "@/lib/schema";

// Diagnose ohne Login: Ist die Datenbank erreichbar, und gibt es Benutzer?
// Bewusst minimal gehalten (keine Secrets, kein Datenzugriff) — beantwortet
// die eine Frage "redet die App mit der richtigen DB?" in Sekunden.
export const dynamic = "force-dynamic";

function dbHost(): string | null {
  try {
    return new URL(process.env.DATABASE_URL ?? "").hostname.split(".")[0] || null;
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    await ensureCoreSchema();
    const { rows } = await pool.query<{ n: string }>("SELECT count(*)::text AS n FROM users");
    return NextResponse.json({
      ok: true,
      datenbank: "erreichbar",
      dbHost: dbHost(),
      benutzerAngelegt: Number(rows[0]?.n ?? 0) > 0,
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        datenbank: "fehler",
        dbHost: dbHost(),
        fehler: (err as Error).message.slice(0, 160),
      },
      { status: 503 },
    );
  }
}
