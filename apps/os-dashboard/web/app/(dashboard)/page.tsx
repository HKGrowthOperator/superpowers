import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/stat-card";
import { RunsChart } from "@/components/runs-chart";
import { RecentRunsTable } from "@/components/recent-runs-table";
import { AutoRefresh } from "@/components/auto-refresh";
import { getKpis, getTrend, getRecentRuns } from "@/lib/queries";

// Always fresh (live cockpit, no static optimization).
export const dynamic = "force-dynamic";

export default async function Page() {
  const [kpis, trend, runs] = await Promise.all([getKpis(), getTrend(), getRecentRuns()]);
  const successRate = kpis.success_rate_pct != null ? `${kpis.success_rate_pct}%` : "–";

  return (
    <>
      <AutoRefresh seconds={30} />
      <p className="text-muted-foreground mb-6 text-sm">
        Live-Cockpit für KI-Automationen — aktualisiert sich automatisch.
      </p>

      <section className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Läufe heute" value={String(kpis.runs_today ?? 0)} />
        <StatCard
          label="Erfolgsquote (7 Tage)"
          value={successRate}
          tone={
            kpis.success_rate_pct == null
              ? "default"
              : kpis.success_rate_pct >= 90
                ? "good"
                : kpis.success_rate_pct >= 70
                  ? "warn"
                  : "bad"
          }
        />
        <StatCard label="Kosten diesen Monat" value={`${Number(kpis.cost_eur_month ?? 0).toFixed(2)} €`} />
        <StatCard
          label="Offene Fehler (7 Tage)"
          value={String(kpis.open_errors ?? 0)}
          tone={Number(kpis.open_errors) > 0 ? "bad" : "good"}
        />
      </section>

      <section className="mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Läufe &amp; Fehler pro Tag (30 Tage)</CardTitle>
          </CardHeader>
          <CardContent>
            {trend.length ? (
              <RunsChart data={trend} />
            ) : (
              <p className="text-muted-foreground py-12 text-center text-sm">Noch keine Läufe erfasst.</p>
            )}
          </CardContent>
        </Card>
      </section>

      <section>
        <Card>
          <CardHeader>
            <CardTitle>Letzte Läufe</CardTitle>
          </CardHeader>
          <CardContent>
            {runs.length ? (
              <RecentRunsTable runs={runs} />
            ) : (
              <p className="text-muted-foreground py-8 text-center text-sm">Noch keine Läufe erfasst.</p>
            )}
          </CardContent>
        </Card>
      </section>
    </>
  );
}
