import { CardGrid } from "@/components/cards";
import { sops } from "@/lib/data/sops";
import type { CardModel } from "@/lib/data/types";

const cards: CardModel[] = sops.map((s) => ({
  id: s.id,
  accent: "brand",
  badges: [
    { text: s.area, tone: "brand" },
    { text: `aktualisiert ${s.updated}`, tone: "neutral" },
  ],
  title: s.title,
  description: s.summary,
  bullets: [{ label: "Schritte", items: s.steps }],
  metas: [{ label: "Verantwortlich", value: s.owner }],
  footBadges: s.tools.map((t) => ({ text: t, tone: "outline" as const })),
  tags: s.tags,
}));

export default function Page() {
  return (
    <>
      <p className="text-muted-foreground mb-6 text-sm">Wiederholbare Abläufe & Playbooks — durchsuchbar.</p>
      <CardGrid items={cards} />
    </>
  );
}
