import { NextResponse } from "next/server";
import { verifyCredentials, ensureBootstrapUser } from "@/lib/users";
import { createSession, SESSION_COOKIE, isSecureRequest } from "@/lib/auth";

// ── Login-Bremse gegen Passwort-Durchprobieren ──────────────────────────────
// Max. 10 Fehlversuche pro IP in 15 Minuten. In-Memory: gilt pro Server-Instanz
// (auf Serverless pro warmer Instanz) — als Grundschutz bewusst einfach gehalten.
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 10;
const attempts = new Map<string, { count: number; first: number }>();

function clientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  // Aufräumen, damit die Map nicht wächst
  if (attempts.size > 1000) {
    for (const [k, v] of attempts) if (now - v.first > WINDOW_MS) attempts.delete(k);
  }
  const entry = attempts.get(ip);
  if (!entry || now - entry.first > WINDOW_MS) return false;
  return entry.count >= MAX_ATTEMPTS;
}

function recordFailure(ip: string): void {
  const now = Date.now();
  const entry = attempts.get(ip);
  if (!entry || now - entry.first > WINDOW_MS) attempts.set(ip, { count: 1, first: now });
  else entry.count++;
}

export async function POST(req: Request) {
  const { email, password } = await req.json().catch(() => ({}));
  if (!email || !password) {
    return NextResponse.json(
      { error: "E-Mail und Passwort sind nötig." },
      { status: 400 },
    );
  }

  const ip = clientIp(req);
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Zu viele Versuche. Bitte in 15 Minuten erneut probieren." },
      { status: 429 },
    );
  }

  // Auf frischer DB (z. B. Neon): Schema + ersten Benutzer sicherstellen.
  // DB-Fehler klar melden statt als generisches "Login fehlgeschlagen".
  let user: { email: string } | null = null;
  try {
    await ensureBootstrapUser();
    user = await verifyCredentials(email, password);
  } catch (err) {
    console.error("[login] DB-Fehler:", (err as Error).message);
    return NextResponse.json(
      { error: "Datenbank nicht erreichbar. Bitte DATABASE_URL prüfen (siehe /api/health)." },
      { status: 503 },
    );
  }

  if (!user) {
    recordFailure(ip);
    return NextResponse.json(
      { error: "E-Mail oder Passwort ist falsch." },
      { status: 401 },
    );
  }
  attempts.delete(ip);

  const token = await createSession({ email: user.email });
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: isSecureRequest(req), // hinter Funnel via X-Forwarded-Proto erkannt
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 Tage
  });
  return res;
}
