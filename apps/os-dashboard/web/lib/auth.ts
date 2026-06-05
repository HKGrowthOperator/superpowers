import { SignJWT, jwtVerify, type JWTPayload } from "jose";

// Geheimer Schlüssel zum Signieren der Login-Sitzung. In Produktion via AUTH_SECRET setzen.
const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET ?? "dev-only-insecure-secret-bitte-aendern",
);

export const SESSION_COOKIE = "mw_session";

export type Session = JWTPayload & { email?: string };

// Erstellt ein signiertes Sitzungs-Token (7 Tage gültig).
export async function createSession(payload: { email: string }) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

// Prüft ein Token; gibt die Sitzung zurück oder null, wenn ungültig/abgelaufen.
export async function verifySession(
  token: string | undefined,
): Promise<Session | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as Session;
  } catch {
    return null;
  }
}
