import { NextResponse } from "next/server";
import { withInbox, inboxStats, INBOX_STATUS } from "@/lib/smart-inbox";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const status = url.searchParams.get("status");
  const kategorie = url.searchParams.get("kategorie");
  const channel = url.searchParams.get("channel");
  return withInbox((inbox) => {
    let messages = inbox.store.state.messages;
    if (status) messages = messages.filter((m) => m.status === status);
    if (kategorie) messages = messages.filter((m) => m.kategorie === kategorie);
    if (channel) messages = messages.filter((m) => m.channel === channel);
    return NextResponse.json({
      messages,
      tasks: inbox.store.state.tasks,
      stats: inboxStats(inbox.store.state),
    });
  });
}

type Body = {
  action?: string;
  id?: number;
  channel?: string;
  from?: string;
  subject?: string;
  body?: string;
  status?: string;
  kategorie?: string;
  prioritaet?: string;
  zustaendig?: string;
};

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as Body;

  if (body.action === "ingest") {
    if (!body.channel || !body.from || !(body.subject || body.body)) {
      return NextResponse.json({ error: "channel, from und subject oder body sind erforderlich" }, { status: 400 });
    }
    const msg = await withInbox((inbox) =>
      inbox.ingest({ channel: body.channel!, from: body.from!, subject: body.subject, body: body.body }),
    );
    return NextResponse.json(msg, { status: 201 });
  }

  if (body.action === "patchMessage") {
    const id = Number(body.id);
    const out = await withInbox((inbox) => {
      const msg = inbox.store.state.messages.find((m) => m.id === id);
      if (!msg) return { error: "Nachricht nicht gefunden", status: 404 as const };
      if (body.status && !INBOX_STATUS.includes(body.status)) {
        return { error: `Ungültiger Status. Erlaubt: ${INBOX_STATUS.join(", ")}`, status: 400 as const };
      }
      if (typeof body.status === "string") msg.status = body.status;
      if (typeof body.kategorie === "string") msg.kategorie = body.kategorie;
      if (typeof body.prioritaet === "string") msg.prioritaet = body.prioritaet;
      if (typeof body.zustaendig === "string") msg.zustaendig = body.zustaendig;
      return { msg };
    });
    if ("error" in out) return NextResponse.json({ error: out.error }, { status: out.status });
    return NextResponse.json(out.msg);
  }

  if (body.action === "patchTask") {
    const id = Number(body.id);
    const out = await withInbox((inbox) => {
      const task = inbox.store.state.tasks.find((t) => t.id === id);
      if (!task) return { error: "Aufgabe nicht gefunden", status: 404 as const };
      if (body.status) task.status = body.status === "erledigt" ? "erledigt" : "offen";
      return { task };
    });
    if ("error" in out) return NextResponse.json({ error: out.error }, { status: out.status });
    return NextResponse.json(out.task);
  }

  return NextResponse.json({ error: "Unbekannte Aktion" }, { status: 400 });
}
