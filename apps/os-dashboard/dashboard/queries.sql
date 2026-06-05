-- Fertige Abfragen für die Metabase-Karten ("Fragen").
-- In Metabase: Neu → SQL-Abfrage → auf die Cockpit-DB → eine dieser Queries einfügen.
-- Tipp: Die Views aus 01-schema.sql machen die Karten noch einfacher
--       (z. B. "SELECT * FROM v_runs_today").

-- ── Kachel: Läufe heute (Skalar) ─────────────────────────────────────────────
SELECT runs_today FROM v_runs_today;

-- ── Kachel: Erfolgsquote 7 Tage in % (Skalar) ────────────────────────────────
SELECT success_rate_pct FROM v_success_rate_7d;

-- ── Kachel: Kosten diesen Monat in EUR (Skalar) ──────────────────────────────
SELECT cost_eur_month FROM v_cost_month;

-- ── Kachel: offene Fehler (Skalar; als Ampel/rot einfärben) ──────────────────
SELECT open_errors FROM v_open_errors;

-- ── Chart: Läufe & Fehler pro Tag (Balken/Linie) ─────────────────────────────
SELECT day, runs, errors FROM v_daily_trend ORDER BY day;

-- ── Chart: Kosten pro Tag (Linie) ────────────────────────────────────────────
SELECT day, cost_eur FROM v_daily_trend ORDER BY day;

-- ── Tabelle: letzte 20 Läufe ─────────────────────────────────────────────────
SELECT * FROM v_recent_runs;

-- ── Optional: Läufe je Automation (für Drilldown) ────────────────────────────
SELECT automation,
       count(*)                                   AS runs,
       count(*) FILTER (WHERE status = 'error')   AS errors,
       round(sum(cost_eur), 2)                    AS cost_eur
FROM   agent_runs
WHERE  started_at >= now() - interval '30 days'
GROUP  BY automation
ORDER  BY runs DESC;
