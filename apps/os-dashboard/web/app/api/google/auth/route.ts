import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { authUrl, googleConfigured } from "@/lib/google";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const origin = new URL(req.url).origin;
  if (!googleConfigured()) {
    return NextResponse.redirect(`${origin}/drive?error=not-configured`);
  }
  const state = crypto.randomUUID();
  (await cookies()).set("g_oauth_state", state, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 600 });
  return NextResponse.redirect(authUrl(state));
}
