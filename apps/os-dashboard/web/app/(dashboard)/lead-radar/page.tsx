import { LeadRadar } from "@/components/lead-radar";
import { LEAD_CATEGORIES, LEAD_SERVICES } from "@/lib/leads";

export const dynamic = "force-dynamic";

export default function Page() {
  const categories = LEAD_CATEGORIES.map(({ id, label, emoji }) => ({ id, label, emoji }));
  return (
    <>
      <p className="text-muted-foreground mb-6 text-sm">
        Finde echte Betriebe in deiner Zielbranche & Region. Jeder Lead wird gegen euer AI-First-Leistungsspektrum geprüft (Content & Branding, E-Mail/Outreach, Automatisierung & KI) — du siehst pro Betrieb die Lücken und die passenden Leistungen. Speichern als Interessent oder direkt eine Cold-Mail im AI-First-Ton erzeugen.
      </p>
      <LeadRadar categories={categories} services={LEAD_SERVICES} />
    </>
  );
}
