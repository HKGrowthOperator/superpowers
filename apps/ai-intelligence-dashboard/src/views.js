// View layer: turns current state into the section for the active nav tab.
// Filtering + search live here so every list view is consistent.

import { el, chip } from './dom.js';
import { store } from './store.js';
import {
  updateCard, experimentCard, opportunityCard, learningCard, riskCard, emptyState,
} from './components.js';

/** Apply the active filters + search query to the updates list. */
export function filterUpdates(updates, filters, query) {
  const q = (query || '').trim().toLowerCase();
  return updates.filter((u) => {
    if (filters.company !== 'all' && u.company !== filters.company) return false;
    if (filters.category !== 'all' && u.category !== filters.category) return false;
    if (filters.priority !== 'all' && u.priority !== filters.priority) return false;
    if (filters.riskLevel !== 'all' && u.riskLevel !== filters.riskLevel) return false;
    if (filters.hypeLevel !== 'all' && u.hypeLevel !== filters.hypeLevel) return false;
    if (u.relevanceScore < filters.minRelevance) return false;
    if (filters.savedOnly && !store.isSaved(u.id)) return false;
    if (q) {
      const hay = [u.title, u.summary, u.company, u.category, u.businessImpact, ...(u.tags || [])]
        .join(' ')
        .toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

function grid(nodes) {
  return el('div', { class: 'grid' }, nodes);
}

function sectionHead(title, subtitle, count) {
  return el('div', { class: 'section-head' }, [
    el('h2', {}, [title]),
    subtitle ? el('p', { class: 'section-sub' }, [subtitle]) : null,
    count != null ? chip(`${count}`, 'count') : null,
  ]);
}

// ---- Overview -------------------------------------------------------
function statTile(label, value, hint) {
  return el('div', { class: 'stat' }, [
    el('div', { class: 'stat__value' }, [String(value)]),
    el('div', { class: 'stat__label' }, [label]),
    hint ? el('div', { class: 'stat__hint' }, [hint]) : null,
  ]);
}

function overviewView(s) {
  const u = s.updates;
  const highImpact = u.filter((x) => x.relevanceScore >= 80);
  const saved = s.savedIds.size;
  const clientOffers = s.experiments.filter((x) => x.canBeClientOffer).length + s.opportunities.length;
  const topToday = [...u].sort((a, b) => b.relevanceScore - a.relevanceScore).slice(0, 3);

  return el('div', {}, [
    sectionHead('AI Intelligence Overview', 'Turn AI noise into business decisions.'),
    el('div', { class: 'stats' }, [
      statTile('Tracked updates', u.length, 'across all sources'),
      statTile('High-impact', highImpact.length, 'relevance ≥ 80'),
      statTile('Saved insights', saved, 'bookmarked'),
      statTile('Offer ideas', clientOffers, 'experiments + opportunities'),
    ]),
    sectionHead("Today's most important updates", 'Highest relevance first.'),
    grid(topToday.length ? topToday.map(updateCard) : [emptyState('No updates loaded.')]),
    sectionHead('High-impact opportunities', 'Sellable now.'),
    grid(s.opportunities.slice(0, 3).map(opportunityCard)),
  ]);
}

// ---- List views -----------------------------------------------------
function updatesView(s, { title, subtitle, predicate } = {}) {
  let list = filterUpdates(s.updates, s.filters, s.query);
  if (predicate) list = list.filter(predicate);
  return el('div', {}, [
    sectionHead(title || 'Latest AI updates', subtitle, list.length),
    grid(list.length ? list.map(updateCard) : [emptyState()]),
  ]);
}

function experimentsView(s) {
  const q = s.query.trim().toLowerCase();
  const list = s.experiments.filter(
    (x) => !q || `${x.name} ${x.objective} ${x.tags.join(' ')}`.toLowerCase().includes(q),
  );
  return el('div', {}, [
    sectionHead('What to test this week', 'Concrete, time-boxed experiments.', list.length),
    grid(list.length ? list.map(experimentCard) : [emptyState()]),
  ]);
}

function opportunitiesView(s) {
  const q = s.query.trim().toLowerCase();
  const list = s.opportunities.filter(
    (o) => !q || `${o.offerName} ${o.problemSolved} ${o.tags.join(' ')}`.toLowerCase().includes(q),
  );
  return el('div', {}, [
    sectionHead('Client offer opportunities', 'AI updates turned into sellable offers.', list.length),
    grid(list.length ? list.map(opportunityCard) : [emptyState()]),
  ]);
}

function learningView(s) {
  const q = s.query.trim().toLowerCase();
  const list = s.learning.filter(
    (c) => !q || `${c.concept} ${c.explanation} ${c.tags.join(' ')}`.toLowerCase().includes(q),
  );
  return el('div', {}, [
    sectionHead('Learning module', 'One concept at a time.', list.length),
    grid(list.length ? list.map(learningCard) : [emptyState()]),
  ]);
}

function risksView(s) {
  const flagged = filterUpdates(s.updates, { ...s.filters, savedOnly: false }, s.query).filter(
    (u) => u.hypeLevel === 'Mostly hype' || u.hypeLevel === 'Risky' || u.riskLevel === 'high',
  );
  return el('div', {}, [
    sectionHead('Risks & hype filter', 'What to be careful about.'),
    sectionHead('Cross-cutting risk assessments', null, s.risks.length),
    grid(s.risks.map(riskCard)),
    sectionHead('Flagged updates', 'High risk or mostly hype.', flagged.length),
    grid(flagged.length ? flagged.map(updateCard) : [emptyState('No flagged updates right now.')]),
  ]);
}

function savedView(s) {
  const updates = s.updates.filter((u) => store.isSaved(u.id));
  const experiments = s.experiments.filter((x) => store.isSaved(x.id));
  const opportunities = s.opportunities.filter((o) => store.isSaved(o.id));
  const learning = s.learning.filter((c) => store.isSaved(c.id));
  const total = updates.length + experiments.length + opportunities.length + learning.length;
  if (!total) {
    return el('div', {}, [
      sectionHead('Saved insights', 'Bookmark anything with the ☆ button.'),
      emptyState('Nothing saved yet. Tap ☆ on any card to keep it here.'),
    ]);
  }
  return el('div', {}, [
    sectionHead('Saved insights', 'Everything you bookmarked.', total),
    updates.length ? sectionHead('High priority / updates', null, updates.length) : null,
    updates.length ? grid(updates.map(updateCard)) : null,
    experiments.length ? sectionHead('Test this week', null, experiments.length) : null,
    experiments.length ? grid(experiments.map(experimentCard)) : null,
    opportunities.length ? sectionHead('Client offer ideas', null, opportunities.length) : null,
    opportunities.length ? grid(opportunities.map(opportunityCard)) : null,
    learning.length ? sectionHead('Internal improvements / learning', null, learning.length) : null,
    learning.length ? grid(learning.map(learningCard)) : null,
  ]);
}

/** Map nav id -> render function. */
export const VIEWS = {
  overview: { label: 'Overview', render: overviewView },
  updates: { label: 'Latest Updates', render: (s) => updatesView(s) },
  automation: {
    label: 'Automation',
    render: (s) =>
      updatesView(s, {
        title: 'Automation opportunities',
        subtitle: 'Automation, sales & marketing updates.',
        predicate: (u) => ['Automation', 'Sales automation', 'Marketing automation'].includes(u.category),
      }),
  },
  coding: {
    label: 'Coding Agents',
    render: (s) =>
      updatesView(s, {
        title: 'Coding agent updates',
        subtitle: 'Coding agents & dev tooling.',
        predicate: (u) => u.category === 'Coding agent',
      }),
  },
  media: {
    label: 'Voice & Video',
    render: (s) =>
      updatesView(s, {
        title: 'Voice & video AI',
        subtitle: 'Voice and video model updates.',
        predicate: (u) => ['Voice AI', 'Video AI'].includes(u.category),
      }),
  },
  experiments: { label: 'Test This Week', render: experimentsView },
  opportunities: { label: 'Client Offers', render: opportunitiesView },
  risks: { label: 'Risks / Hype', render: risksView },
  learning: { label: 'Learning', render: learningView },
  saved: { label: 'Saved', render: savedView },
};
