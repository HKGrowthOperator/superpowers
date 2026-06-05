import { TabbedCards } from "@/components/cards";
import { clients, templates } from "@/lib/data/customer-service";
import type { CardModel, Tone } from "@/lib/data/types";

const statusTone = (s: string): Tone =>
  s === "active" ? "ok" : s === "lead" ? "brand" : s === "paused" ? "warn" : "bad";

const clientCards: CardModel[] = clients.map((c) => ({
  id: c.id,
  accent: statusTone(c.status) === "bad" ? "bad" : statusTone(c.status) === "warn" ? "warn" : statusTone(c.status) === "ok" ? "ok" : "brand",
  badges: [{ text: c.status, tone: statusTone(c.status) }],
  title: c.name,
  metas: [{ label: "Kontakt", value: c.contact }, { label: "Kunde seit", value: c.since }],
  description: c.notes,
  tags: c.tags,
}));

const templateCards: CardModel[] = templates.map((t) => ({
  id: t.id,
  badges: [{ text: t.channel, tone: "brand" }, { text: t.category, tone: "neutral" }],
  title: t.title,
  pre: t.body,
}));

export default function Page() {
  return (
    <>
      <p className="text-muted-foreground mb-6 text-sm">Kunden verwalten und Antwortvorlagen nutzen ({"{{Platzhalter}}"} vor dem Senden ersetzen).</p>
      <TabbedCards
        sections={[
          { label: "Kunden", items: clientCards },
          { label: "Vorlagen", items: templateCards },
        ]}
        min="360px"
      />
    </>
  );
}
