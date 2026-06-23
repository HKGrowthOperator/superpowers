import { test } from "node:test";
import assert from "node:assert/strict";
import { collectMetrics, computeKpis, change, ratio, findMissing } from "../src/metrics.js";
import { months } from "../src/data.js";

test("ratio schützt vor null und Division durch 0", () => {
  assert.equal(ratio(10, 5), 2);
  assert.equal(ratio(5, 0), null);
  assert.equal(ratio(null, 5), null);
  assert.equal(ratio(5, null), null);
});

test("collectMetrics liefert alle Monate und erkennt Datenlücken", () => {
  const c = collectMetrics();
  assert.equal(c.count, months.length);
  assert.ok(c.count >= 12, "mindestens 12 Monatsdatensätze");
  // 2026-02 hat website_visitors = null → muss als Lücke auftauchen
  const gap = c.missing.find((m) => m.month === "2026-02" && m.field === "website_visitors");
  assert.ok(gap, "fehlende website_visitors in 2026-02 werden erkannt");
});

test("findMissing meldet nichts bei vollständigem Monat", () => {
  const full = { month: "x", leads: 1, calls: 1, proposals: 1, wins: 1, impressions: 1, website_visitors: 1, content_count: 1, revenue: 1, open_invoices: 1, average_project_value: 1 };
  assert.equal(findMissing([full]).length, 0);
});

test("computeKpis rechnet Trichterquoten korrekt", () => {
  const row = { leads: 100, calls: 60, proposals: 30, wins: 12, website_visitors: 4000, revenue: 60000, open_invoices: 15000, average_project_value: 5000 };
  const k = computeKpis(row);
  assert.equal(k.lead_to_call, 0.6);
  assert.equal(k.call_to_proposal, 0.5);
  assert.equal(k.proposal_to_win, 0.4);
  assert.equal(k.lead_to_win, 0.12);
  assert.equal(k.visitor_to_lead, 0.025);
  assert.equal(k.revenue_per_win, 5000);
  assert.equal(k.pipeline_value, 150000);
  assert.equal(k.liquidity_pressure, 0.25);
});

test("computeKpis gibt null zurück, wenn Eingaben fehlen", () => {
  const k = computeKpis({ leads: 100, calls: 60, proposals: 30, wins: 12, website_visitors: null, revenue: 60000, open_invoices: 15000, average_project_value: 5000 });
  assert.equal(k.visitor_to_lead, null);
});

test("change liefert absolute und prozentuale Veränderung", () => {
  assert.deepEqual(change(120, 100), { abs: 20, pct: 0.2 });
  assert.deepEqual(change(80, 100), { abs: -20, pct: -0.2 });
  assert.deepEqual(change(100, null), { abs: null, pct: null });
});
