// =====================================================================
// Source adapter layer.
//
// Every data source (mock today; RSS / blog / API / web-search tomorrow)
// implements the same Source interface. The registry composes multiple
// sources, deduplicates, and applies a freshness window — so swapping mock
// data for live data is a one-line change in main.js, not a rewrite.
// =====================================================================

/**
 * @typedef {Object} Source
 * @property {string} id                         Stable source id.
 * @property {string} name                       Human-readable name.
 * @property {() => Promise<import('../schema.js').AIUpdate[]>} fetchUpdates
 */

/**
 * Deduplicate updates by id, then by a normalised title+company key.
 * Keeps the first occurrence (sources earlier in the list win).
 * @param {import('../schema.js').AIUpdate[]} updates
 */
export function dedupe(updates) {
  const seen = new Set();
  const out = [];
  for (const u of updates) {
    const key = u.id || `${u.company}|${(u.title || '').trim().toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(u);
  }
  return out;
}

/**
 * Basic freshness filter: drop updates older than `maxAgeDays`.
 * Pass 0 / falsy to disable (useful for seed data demos).
 * @param {import('../schema.js').AIUpdate[]} updates
 * @param {number} maxAgeDays
 * @param {Date} [now]
 */
export function filterFresh(updates, maxAgeDays, now = new Date()) {
  if (!maxAgeDays) return updates;
  const cutoff = now.getTime() - maxAgeDays * 24 * 60 * 60 * 1000;
  return updates.filter((u) => {
    const t = Date.parse(u.publishedAt);
    return Number.isNaN(t) ? true : t >= cutoff;
  });
}

/**
 * Compose multiple Source adapters into one ingestion call.
 * Failures in one source never break the others.
 *
 * @param {Source[]} sources
 * @param {{ maxAgeDays?: number }} [opts]
 * @returns {Promise<{ updates: import('../schema.js').AIUpdate[], errors: {source: string, error: string}[] }>}
 */
export async function ingest(sources, opts = {}) {
  const errors = [];
  const collected = [];

  const results = await Promise.allSettled(sources.map((s) => s.fetchUpdates()));
  results.forEach((res, i) => {
    const src = sources[i];
    if (res.status === 'fulfilled') {
      for (const u of res.value) collected.push({ ...u, sourceName: u.sourceName || src.name });
    } else {
      errors.push({ source: src.name, error: String(res.reason) });
    }
  });

  let updates = dedupe(collected);
  updates = filterFresh(updates, opts.maxAgeDays || 0);
  updates.sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));
  return { updates, errors };
}
