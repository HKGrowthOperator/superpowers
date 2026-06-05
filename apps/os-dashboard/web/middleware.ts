import { NextResponse, type NextRequest } from "next/server";
import { verifySession, SESSION_COOKIE } from "@/lib/auth";

// Schützt die gesamte App: ohne gültige Sitzung geht es zurück zum Login.
export async function middleware(req: NextRequest) {
  const session = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);
  if (!session) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  // Alles abdecken AUSSER: Login-Seite, Login-API, Next-interne Pfade, Favicon.
  matcher: ["/((?!login|api/login|_next/static|_next/image|favicon.ico).*)"],
};
