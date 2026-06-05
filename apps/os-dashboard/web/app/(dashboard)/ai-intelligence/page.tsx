import { TabbedCards } from "@/components/cards";
import { updates, experiments, opportunities, learning, risks } from "@/lib/data/ai-intelligence";
import { riskTone, hypeTone, type CardModel } from "@/lib/data/types";

const updateCards: CardModel[] = [...updates]
  .sort((a, b) => b.relevanceScore - a.relevanceScore)
  .map((u) => ({
    id: u.id,
    accent: riskTone(u.riskLevel),
    score: u.relevanceScore,
    badges: [
      { text: u.company, tone: "brand" as const },
      { text: u.category, tone: "neutral" as const },
      { text: u.date, tone: "neutral" as const },
    ],
    title: u.title,
    description: u.summary,
    metas: [
      { label: "Business impact", value: u.businessImpact },
      { label: "Warum es für uns zählt", value: u.businessRelevance },
    ],
    highlight: { label: "Empfohlene Aktion", value: u.recommendedAction, tone: "brand" as const },
    footBadges: [
      { text: `Risiko: ${u.riskLevel}`, tone: riskBadge(u.riskLevel) },
      { text: `Hype: ${u.hypeLevel}`, tone: hypeBadge(u.hypeLevel) },
      ...u.riskTypes.map((t) => ({ text: t, tone: "outline" as const })),
    ],
    tags: u.tags,
  }));

const experimentCards: CardModel[] = experiments.map((e) => ({
  id: e.id,
  badges: [
    { text: e.week, tone: "neutral" as const },
    { text: e.status, tone: e.status === "validated" ? ("ok" as const) : e.status === "dropped" ? ("bad" as const) : ("warn" as const) },
  ],
  title: e.title,
  metas: [{ label: "Wert", value: e.value }, { label: "Validierung", value: e.validation }],
  bullets: [{ label: "Schritte", items: e.steps }],
  tags: e.tools,
}));

const opportunityCards: CardModel[] = opportunities.map((o) => ({
  id: o.id,
  accent: "brand" as const,
  badges: [{ text: `Aufwand: ${o.effort}`, tone: "neutral" as const }],
  title: o.title,
  metas: [{ label: "Verkaufbarer Wert", value: o.value }, { label: "Nachfrage validieren", value: o.validate }],
  bullets: [{ label: "Schritte", items: o.steps }],
  tags: o.tools,
}));

const learningCards: CardModel[] = learning.map((l) => ({
  id: l.id,
  title: l.term,
  description: l.definition,
  metas: [{ label: "Warum es zählt", value: l.whyItMatters }, { label: "Beispiel", value: l.example }],
}));

const riskCards: CardModel[] = risks.map((r) => ({
  id: r.id,
  accent: riskTone(r.riskLevel),
  badges: [{ text: `Risiko: ${r.riskLevel}`, tone: riskBadge(r.riskLevel) }, ...r.riskTypes.map((t) => ({ text: t, tone: "outline" as const }))],
  title: r.title,
  description: r.description,
  highlight: { label: "Gegenmaßnahme", value: r.mitigation },
}));

const hypeCards = updateCards.filter((c) => c.footBadges?.some((b) => b.text === "Hype: hype"));

function riskBadge(l: "low" | "medium" | "high") { return l === "high" ? ("bad" as const) : l === "medium" ? ("warn" as const) : ("ok" as const); }
function hypeBadge(l: "grounded" | "mixed" | "hype") { return l === "hype" ? ("bad" as const) : l === "mixed" ? ("warn" as const) : ("ok" as const); }

export default function Page() {
  return (
    <>
      <p className="text-muted-foreground mb-6 text-sm">KI-Updates als Business-Intelligence — Relevanz, Risiko und Hype auf einen Blick.</p>
      <TabbedCards
        sections={[
          { label: "Updates", items: updateCards },
          { label: "Experimente", items: experimentCards },
          { label: "Chancen", items: opportunityCards },
          { label: "Lernen", items: learningCards },
          { label: "Risiken & Hype", items: [...riskCards, ...hypeCards] },
        ]}
      />
    </>
  );
}
