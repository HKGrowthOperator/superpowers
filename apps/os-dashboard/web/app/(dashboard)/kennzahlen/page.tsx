import { loadRows, prepareDashboardData, interpret } from "@/lib/biz-dashboard";
import { KennzahlenView } from "@/components/kennzahlen-view";

export const dynamic = "force-dynamic";

export default async function Page() {
  const rows = await loadRows();
  const dashboard = prepareDashboardData(rows);
  const interpretation = await interpret(rows);
  return (
    <>
      <p className="text-muted-foreground mb-6 text-sm">
        Alle Kennzahlen aus Vertrieb, Marketing und Finanzen an einem Ort. Das System erkennt Engpässe und
        Datenlücken automatisch und fasst die Lage zusammen. Mit hinterlegtem Anthropic-Schlüssel kommt die
        Auswertung von Claude, sonst aus der Regel-Analyse.
      </p>
      <KennzahlenView dashboard={dashboard} interpretation={interpretation} />
    </>
  );
}
