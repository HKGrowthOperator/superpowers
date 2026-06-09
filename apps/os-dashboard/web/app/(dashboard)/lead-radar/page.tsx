import { LeadRadar } from "@/components/lead-radar";
import { LEAD_CATEGORIES } from "@/lib/leads";

export const dynamic = "force-dynamic";

export default function Page() {
  const categories = LEAD_CATEGORIES.map(({ id, label, emoji }) => ({ id, label, emoji }));
  return (
    <>
      <p className="text-muted-foreground mb-6 text-sm">
        Finde echte Betriebe in deiner Zielbranche & Region. Wer keine Website hat, verschenkt Online-Anfragen — das sind deine heißesten Leads. Speichere sie als Interessent oder lass Tobias direkt eine Cold-Mail schreiben.
      </p>
      <LeadRadar categories={categories} />
    </>
  );
}
