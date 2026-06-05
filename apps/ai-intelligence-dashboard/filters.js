// filters.js — pure filtering for list views. Filterable views must run their
// data through filterUpdates(); the active filter UI is driven by main.js.

/**
 * @param {import('./schema.js').AIUpdate[]} updates
 * @param {object} filters  from store.state.filters
 * @param {(id:string)=>boolean} isSaved
 * @returns {import('./schema.js').AIUpdate[]}
 */
export function filterUpdates(updates, filters, isSaved) {
  const q = (filters.q ?? '').trim().toLowerCase();

  return updates.filter((u) => {
    if (filters.category !== 'all' && u.category !== filters.category) return false;
    if (filters.company !== 'all' && u.company !== filters.company) return false;
    if (filters.riskLevel !== 'all' && u.riskLevel !== filters.riskLevel) return false;
    if (filters.hypeLevel !== 'all' && u.hypeLevel !== filters.hypeLevel) return false;
    if (filters.savedOnly && !isSaved(u.id)) return false;
    if (q && !matchesText(u, q)) return false;
    return true;
  });
}

function matchesText(u, q) {
  const haystack = [
    u.title, u.summary, u.company, u.category,
    u.businessImpact, u.businessRelevance, u.recommendedAction,
    ...(u.tags ?? []),
  ].join(' ').toLowerCase();
  return haystack.includes(q);
}

/** Count updates by a field — used for dashboard KPIs. */
export function countBy(updates, field) {
  const counts = new Map();
  for (const u of updates) {
    const key = u[field];
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

/** Average relevance score (0–100), rounded. */
export function averageRelevance(updates) {
  if (updates.length === 0) return 0;
  const total = updates.reduce((sum, u) => sum + u.relevanceScore, 0);
  return Math.round(total / updates.length);
}
