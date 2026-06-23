// Demo-Runner: zeigt das ganze System mit Mock-Daten.
//   node src/index.js
import { collectMetrics } from "./metrics.js";
import { generateWeeklySummary, generateMonthlyReport, createCEOReport } from "./reports.js";
import { detectBottlenecks } from "./analysis.js";
import { prepareDashboardData } from "./dashboard.js";
import { interpret } from "./ai.js";
import { months } from "./data.js";

function line(t) { console.log("\n" + "─".repeat(64) + "\n" + t); }

const collected = collectMetrics();
line("📥 collectMetrics()");
console.log(`Monate: ${collected.count} · Datenlücken: ${collected.missing.length}`);
collected.missing.forEach((m) => console.log(`  fehlt: ${m.field} (${m.month})`));

line("🗓️  generateWeeklySummary()");
console.log(JSON.stringify(generateWeeklySummary(), null, 2));

line("🚧 detectBottlenecks()");
detectBottlenecks().forEach((b) => console.log(`  [${b.severity}] ${b.title} — ${b.detail}`));

line("📊 generateMonthlyReport() — Kurzform");
const m = generateMonthlyReport();
console.log(`Periode ${m.period} · Status ${m.status}`);
m.metrics.forEach((x) => console.log(`  ${x.metric}: ${x.value} (${x.change.pct == null ? "—" : (x.change.pct * 100).toFixed(0) + "%"})`));

line("👔 createCEOReport()");
console.log(JSON.stringify(createCEOReport(), null, 2));

line("🤖 interpret() — AI-Auswertung (Regel-Fallback)");
console.log(JSON.stringify(await interpret(generateMonthlyReport(), { rows: months }), null, 2));

line("🖥️  prepareDashboardData() — Kacheln");
prepareDashboardData().tiles.forEach((t) => console.log(`  ${t.metric}: ${t.value} (${t.change.pct == null ? "—" : (t.change.pct * 100).toFixed(0) + "%"})`));
console.log("");
