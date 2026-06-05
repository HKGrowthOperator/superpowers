import { CardGrid } from "@/components/cards";
import { automations } from "@/lib/data/automation";
import type { CardModel, Tone, Accent } from "@/lib/data/types";

const tone = (s: string): Tone => (s === "live" ? "ok" : s === "building" ? "warn" : s === "paused" ? "bad" : "neutral");
const accent = (s: string): Accent | undefined => (s === "live" ? "ok" : s === "building" ? "warn" : s === "paused" ? "bad" : undefined);

const cards: CardModel[] = automations.map((a) => ({
  id: a.id,
  accent: accent(a.status),
  badges: [{ text: a.status, tone: tone(a.status) }],
  title: a.title,
  metas: [
    { label: "Auslöser", value: a.trigger },
    { label: "Aktion", value: a.action },
    { label: "Nutzen", value: a.value },
  ],
  footBadges: a.tools.map((t) => ({ text: t, tone: "outline" as const })),
}));

export default function Page() {
  return (
    <>
      <p className="text-muted-foreground mb-6 text-sm">Automatisierungen von der Idee bis live — Auslöser → Aktion → Nutzen.</p>
      <CardGrid items={cards} />
    </>
  );
}
