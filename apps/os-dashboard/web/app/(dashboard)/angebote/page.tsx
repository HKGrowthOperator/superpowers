import { withOfferSystem } from "@/lib/smart-offer";
import { OfferView } from "@/components/offer-view";

export const dynamic = "force-dynamic";

export default async function Page() {
  const initial = await withOfferSystem((sos) => {
    const s = sos.stats();
    return {
      stats: s.stats,
      offers: sos.listOffers(),
      outbox: sos.listOutbox(),
      tasks: sos.listTasks(),
    };
  });
  return (
    <>
      <p className="text-muted-foreground mb-6 text-sm">
        Von der Anfrage zum Angebot: Freitext einfügen → automatische Extraktion (Leistung, Preis,
        Zahlung, Lieferzeit) → Entwurf prüfen → PDF → Follow-up. Erinnerung nach 3 Tagen, Vertriebsaufgabe
        nach 7 Tagen.
      </p>
      <OfferView initial={initial} />
    </>
  );
}
