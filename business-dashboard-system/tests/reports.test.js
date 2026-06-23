import { test } from "node:test";
import assert from "node:assert/strict";
import { generateWeeklySummary, generateMonthlyReport, createCEOReport, salesReport, marketingReport, recommendations } from "../src/reports.js";
import { interpret } from "../src/ai.js";
import { months } from "../src/data.js";

test("generateWeeklySummary ist vollständig", () => {
  const w = generateWeeklySummary();
  assert.equal(w.type, "weekly_summary");
  assert.equal(w.headline.length, 3);
  assert.ok(w.period && w.status && w.topRecommendation);
});

test("generateMonthlyReport enthält alle Sektionen", () => {
  const m = generateMonthlyReport();
  for (const key of ["kpis", "metrics", "funnel", "bottlenecks", "recommendations", "period", "status"]) {
    assert.ok(key in m, `Sektion ${key} vorhanden`);
  }
  assert.ok(m.metrics.length > 0);
});

test("createCEOReport liefert Lage, Risiko und Entscheidung", () => {
  const c = createCEOReport();
  assert.ok(c.headline.length > 0);
  assert.ok("biggestRisk" in c);
  assert.ok(c.decision.length > 0);
  assert.ok(["gruen", "gelb", "rot"].includes(c.status));
});

test("sales- und marketingReport sind erzeugbar", () => {
  assert.equal(salesReport().type, "sales_report");
  assert.equal(salesReport().funnel.length, 4);
  assert.equal(marketingReport().type, "marketing_report");
});

test("recommendations sind nach Priorität nutzbar", () => {
  const recs = recommendations();
  assert.ok(Array.isArray(recs));
  recs.forEach((r) => assert.ok(r.action && typeof r.priority === "number"));
});

test("interpret läuft offline (Regel-Fallback) und liefert JSON", async () => {
  const out = await interpret(generateMonthlyReport(), { rows: months });
  assert.equal(out.source, "rules");
  assert.ok(Array.isArray(out.recommendations));
  assert.ok(typeof out.summary === "string");
});
