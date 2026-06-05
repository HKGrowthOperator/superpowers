import { CardGrid } from "@/components/cards";
import { concepts } from "@/lib/data/concepts";
import type { CardModel, Tone } from "@/lib/data/types";

const statusTone = (s: string): Tone =>
  s === "live" ? "ok" : s === "ready" ? "brand" : s === "draft" ? "warn" : "neutral";

const cards: CardModel[] = concepts.map((c) => ({
  id: c.id,
  accent: "brand",
  badges: [{ text: c.type, tone: "neutral" }, { text: c.status, tone: statusTone(c.status) }],
  title: c.title,
  description: c.summary,
  metas: [{ label: "Wert", value: c.value }],
  bullets: [{ label: "Schritte", items: c.steps }],
}));

export default function Page() {
  return (
    <>
      <p className="text-muted-foreground mb-6 text-sm">Angebote, Strategien und Kampagnen in Entwicklung.</p>
      <CardGrid items={cards} />
    </>
  );
}
