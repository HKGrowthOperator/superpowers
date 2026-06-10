import { withInbox, inboxStats, INBOX_STATUS, INBOX_KATEGORIEN } from "@/lib/smart-inbox";
import { InboxView } from "@/components/inbox-view";

export const dynamic = "force-dynamic";

export default async function Page() {
  const initial = await withInbox((inbox) => ({
    messages: inbox.store.state.messages,
    tasks: inbox.store.state.tasks,
    stats: inboxStats(inbox.store.state),
  }));
  return (
    <>
      <p className="text-muted-foreground mb-6 text-sm">
        Zentraler Posteingang für alle Kanäle (E-Mail, WhatsApp, Instagram, Formular). Jede Anfrage wird
        automatisch kategorisiert, priorisiert und mit einer Aufgabe versehen. Ein Anthropic-Schlüssel
        verbessert die Erkennung – ohne läuft die regelbasierte Klassifizierung.
      </p>
      <InboxView initial={initial} statuses={INBOX_STATUS} kategorien={INBOX_KATEGORIEN} />
    </>
  );
}
