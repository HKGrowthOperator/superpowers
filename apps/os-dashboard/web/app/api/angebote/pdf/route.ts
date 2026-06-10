import { withOfferSystem } from "@/lib/smart-offer";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return new Response("id fehlt", { status: 400 });
  try {
    const { pdf, nummer } = await withOfferSystem((sos) => ({
      pdf: sos.renderPdf(id),
      nummer: sos.getOffer(id).nummer,
    }));
    return new Response(pdf as BodyInit, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="Angebot-${nummer}.pdf"`,
      },
    });
  } catch (err) {
    const e = err as { status?: number; message?: string };
    return new Response(e.message ?? "Fehler", { status: e.status ?? 500 });
  }
}
