import { CardGrid } from "@/components/cards";
import { websites } from "@/lib/data/websites";
import type { CardModel, Tone, Accent } from "@/lib/data/types";

const tone = (s: string): Tone => (s === "live" ? "ok" : s === "building" ? "warn" : s === "maintenance" ? "brand" : "neutral");
const accent = (s: string): Accent | undefined => (s === "live" ? "ok" : s === "building" ? "warn" : s === "maintenance" ? "brand" : undefined);

const cards: CardModel[] = websites.map((w) => ({
  id: w.id,
  accent: accent(w.status),
  badges: [{ text: w.status, tone: tone(w.status) }],
  title: w.name,
  metas: [{ label: "Kunde", value: w.client }, { label: "Technik", value: w.stack }],
  description: w.notes,
  link: w.url ? { href: w.url, text: w.url } : undefined,
}));

export default function Page() {
  return (
    <>
      <p className="text-muted-foreground mb-6 text-sm">Kundenprojekte und ihr Build-Status.</p>
      <CardGrid items={cards} />
    </>
  );
}
