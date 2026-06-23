import { test } from "node:test";
import assert from "node:assert/strict";
import { trend, detectBottlenecks, statusLight } from "../src/analysis.js";

const rising = [
  { month: "m1", revenue: 100, open_invoices: 10, content_count: 5, leads: 100, calls: 60, proposals: 30, wins: 12, impressions: 40000, website_visitors: 4000, average_project_value: 5000 },
  { month: "m2", revenue: 120, open_invoices: 10, content_count: 5, leads: 110, calls: 66, proposals: 33, wins: 13, impressions: 44000, website_visitors: 4200, average_project_value: 5000 },
  { month: "m3", revenue: 140, open_invoices: 10, content_count: 5, leads: 120, calls: 72, proposals: 36, wins: 14, impressions: 48000, website_visitors: 4400, average_project_value: 5000 },
];

test("trend erkennt steigende Reihe", () => {
  assert.equal(trend("revenue", rising, 3).direction, "up");
});

test("trend erkennt fallende Reihe", () => {
  const falling = rising.map((r, i) => ({ ...r, revenue: 200 - i * 40 }));
  assert.equal(trend("revenue", falling, 3).direction, "down");
});

test("detectBottlenecks meldet Datenlücke im aktuellen Monat", () => {
  const rows = [...rising, { ...rising[2], month: "m4", website_visitors: null }];
  const findings = detectBottlenecks(rows);
  assert.ok(findings.some((f) => f.type === "data_gap"), "Datenlücke wird erkannt");
});

test("detectBottlenecks erkennt Abschluss-Engpass", () => {
  // proposal_to_win = 3/40 = 7,5 % → deutlich unter Richtwert 35 %
  const rows = [{ month: "m1", leads: 200, calls: 120, proposals: 40, wins: 3, impressions: 80000, website_visitors: 6000, content_count: 6, revenue: 50000, open_invoices: 5000, average_project_value: 5000 }];
  const findings = detectBottlenecks(rows);
  const funnel = findings.find((f) => f.type === "funnel_bottleneck");
  assert.ok(funnel, "Engpass im Trichter wird erkannt");
  assert.equal(funnel.metric, "proposal_to_win");
});

test("statusLight ist grün bei gesunden Zahlen", () => {
  assert.equal(statusLight(rising), "gruen");
});

test("statusLight wird rot bei hartem Engpass", () => {
  const rows = [{ month: "m1", leads: 200, calls: 120, proposals: 40, wins: 2, impressions: 80000, website_visitors: 6000, content_count: 6, revenue: 50000, open_invoices: 30000, average_project_value: 5000 }];
  assert.equal(statusLight(rows), "rot");
});
