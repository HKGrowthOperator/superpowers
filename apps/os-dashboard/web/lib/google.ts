// lib/google.ts — Google-OAuth (Drive read-only) per reinem fetch, ohne SDK.
import { getSecret, setSecret, delSecret } from "./secrets";

const TOKEN_KEY = "google_drive";
const AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const SCOPES = [
  "https://www.googleapis.com/auth/drive.readonly",
  "https://www.googleapis.com/auth/userinfo.email",
];

export type GoogleTokens = { access_token: string; refresh_token: string; expiry: number; email?: string };
export type DriveFile = { id: string; name: string; mimeType: string; modifiedTime?: string; webViewLink?: string };

export function googleConfigured(): boolean {
  return !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

/** Öffentliche Origin der App (hinter Funnel via Forwarded-Header rekonstruiert). */
export function publicOrigin(req: Request): string {
  const proto = req.headers.get("x-forwarded-proto")?.split(",")[0].trim();
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  if (proto && host) return `${proto}://${host}`;
  return new URL(req.url).origin;
}
function redirectUri(): string {
  return process.env.GOOGLE_REDIRECT_URI || "http://localhost:3000/api/google/callback";
}

export function authUrl(state: string): string {
  const p = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID ?? "",
    redirect_uri: redirectUri(),
    response_type: "code",
    scope: SCOPES.join(" "),
    access_type: "offline",
    prompt: "consent",
    state,
  });
  return `${AUTH_ENDPOINT}?${p.toString()}`;
}

export async function exchangeCode(code: string): Promise<void> {
  const res = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID ?? "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      redirect_uri: redirectUri(),
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) throw new Error(`Token-Austausch fehlgeschlagen (${res.status}): ${await res.text()}`);
  const t = (await res.json()) as { access_token: string; refresh_token?: string; expires_in?: number };
  const tokens: GoogleTokens = {
    access_token: t.access_token,
    refresh_token: t.refresh_token ?? "",
    expiry: Date.now() + (t.expires_in ?? 3600) * 1000,
  };
  try {
    const u = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    if (u.ok) tokens.email = ((await u.json()) as { email?: string }).email;
  } catch {
    /* E-Mail ist nur fürs Anzeigen, nicht kritisch */
  }
  await setSecret(TOKEN_KEY, tokens);
}

export async function getStatus(): Promise<{ connected: boolean; email?: string }> {
  const t = await getSecret<GoogleTokens>(TOKEN_KEY);
  return t ? { connected: true, email: t.email } : { connected: false };
}

export async function disconnect(): Promise<void> {
  await delSecret(TOKEN_KEY);
}

async function accessToken(): Promise<string> {
  const t = await getSecret<GoogleTokens>(TOKEN_KEY);
  if (!t) throw new Error("not-connected");
  if (Date.now() < t.expiry - 60000) return t.access_token;
  if (!t.refresh_token) throw new Error("not-connected");
  const res = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: t.refresh_token,
      client_id: process.env.GOOGLE_CLIENT_ID ?? "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) throw new Error(`Token-Refresh fehlgeschlagen (${res.status})`);
  const r = (await res.json()) as { access_token: string; expires_in?: number };
  const updated: GoogleTokens = { ...t, access_token: r.access_token, expiry: Date.now() + (r.expires_in ?? 3600) * 1000 };
  await setSecret(TOKEN_KEY, updated);
  return updated.access_token;
}

export async function listFiles(search?: string): Promise<DriveFile[]> {
  const token = await accessToken();
  const q = search?.trim()
    ? `name contains '${search.replace(/'/g, "\\'")}' and trashed = false`
    : "trashed = false";
  const p = new URLSearchParams({
    q,
    pageSize: "50",
    orderBy: "modifiedTime desc",
    fields: "files(id,name,mimeType,modifiedTime,webViewLink)",
  });
  const res = await fetch(`https://www.googleapis.com/drive/v3/files?${p.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Drive-Liste fehlgeschlagen (${res.status})`);
  const data = (await res.json()) as { files?: DriveFile[] };
  return data.files ?? [];
}

const EXPORT_AS: Record<string, string> = {
  "application/vnd.google-apps.document": "text/plain",
  "application/vnd.google-apps.spreadsheet": "text/csv",
  "application/vnd.google-apps.presentation": "text/plain",
};
const DOWNLOADABLE = new Set(["text/plain", "text/markdown", "text/csv", "application/json", "application/xml", "text/html"]);

/** Holt den Textinhalt einer Datei (Google Docs/Sheets/Slides oder Text-Dateien). null = nicht unterstützt. */
export async function fetchText(fileId: string, mimeType: string): Promise<string | null> {
  const token = await accessToken();
  let url: string;
  if (EXPORT_AS[mimeType]) {
    url = `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=${encodeURIComponent(EXPORT_AS[mimeType])}`;
  } else if (DOWNLOADABLE.has(mimeType)) {
    url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
  } else {
    return null;
  }
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`Inhalt laden fehlgeschlagen (${res.status})`);
  const text = await res.text();
  return text.slice(0, 20000); // Tokens begrenzen
}
