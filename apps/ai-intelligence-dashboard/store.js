// store.js — the single source of truth. UI never holds state; it reads here
// and mutates only through these methods. Subscribers re-render on change.

import { normalizeUpdate } from './adapter.js';
import { EXPERIMENTS, OPPORTUNITIES, LEARNING, RISKS } from './seed.js';

const LS = Object.freeze({
  saved: 'aiid.saved',
  theme: 'aiid.theme',
  added: 'aiid.added',
});

const defaultFilters = () => ({
  q: '',
  category: 'all',
  company: 'all',
  riskLevel: 'all',
  hypeLevel: 'all',
  savedOnly: false,
});

/**
 * @param {{sources: import('./schema.js').Source[]}} config
 */
export function createStore({ sources = [] }) {
  const listeners = new Set();

  const state = {
    status: 'idle', // idle | loading | ready | error
    error: null,
    updates: [],
    experiments: EXPERIMENTS,
    opportunities: OPPORTUNITIES,
    learning: LEARNING,
    risks: RISKS,
    saved: loadSaved(),
    theme: loadTheme(),
    activeView: 'dashboard',
    filters: defaultFilters(),
  };

  const notify = () => listeners.forEach((fn) => fn(state));

  function subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  }

  async function load() {
    state.status = 'loading';
    state.error = null;
    notify();
    try {
      const batches = await Promise.all(
        sources.map(async (src) => {
          const raw = await src.fetch();
          return raw.map((item) => normalizeUpdate(item, src.id));
        }),
      );
      const fromSources = batches.flat();
      const added = loadAdded();
      state.updates = dedupeById([...added, ...fromSources])
        .sort((a, b) => b.date.localeCompare(a.date));
      state.status = 'ready';
    } catch (err) {
      state.status = 'error';
      state.error = err instanceof Error ? err.message : String(err);
    }
    notify();
  }

  // ── selectors ─────────────────────────────────────────────────────────────
  const getState = () => state;
  const isSaved = (id) => state.saved.has(id);

  function allEntities() {
    return [
      ...state.updates.map((item) => ({ type: 'update', item })),
      ...state.experiments.map((item) => ({ type: 'experiment', item })),
      ...state.opportunities.map((item) => ({ type: 'opportunity', item })),
      ...state.learning.map((item) => ({ type: 'learning', item })),
      ...state.risks.map((item) => ({ type: 'risk', item })),
    ];
  }

  /** Saved bookmarks across every entity type, as {type, item}. */
  const getSaved = () => allEntities().filter(({ item }) => state.saved.has(item.id));

  // ── mutations ─────────────────────────────────────────────────────────────
  function setView(viewId) {
    if (state.activeView === viewId) return;
    state.activeView = viewId;
    notify();
  }

  function setFilter(patch) {
    state.filters = { ...state.filters, ...patch };
    notify();
  }

  function resetFilters() {
    state.filters = defaultFilters();
    notify();
  }

  function toggleSaved(id) {
    if (state.saved.has(id)) state.saved.delete(id);
    else state.saved.add(id);
    persistSaved(state.saved);
    notify();
  }

  function setTheme(theme) {
    state.theme = theme === 'light' ? 'light' : 'dark';
    persistTheme(state.theme);
    notify();
  }

  const toggleTheme = () => setTheme(state.theme === 'dark' ? 'light' : 'dark');

  /** Add a manually-entered update through the same adapter validation. */
  function addUpdate(raw) {
    const update = normalizeUpdate({ ...raw, sourceId: 'manual' }, 'manual');
    state.updates = dedupeById([update, ...state.updates])
      .sort((a, b) => b.date.localeCompare(a.date));
    persistAdded(state.updates.filter((u) => u.sourceId === 'manual'));
    notify();
    return update;
  }

  return {
    subscribe, load, getState, isSaved, getSaved,
    setView, setFilter, resetFilters, toggleSaved, setTheme, toggleTheme, addUpdate,
  };
}

// ── helpers ───────────────────────────────────────────────────────────────
function dedupeById(items) {
  const seen = new Set();
  const out = [];
  for (const item of items) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    out.push(item);
  }
  return out;
}

function loadSaved() {
  try {
    const raw = JSON.parse(localStorage.getItem(LS.saved) ?? '[]');
    return new Set(Array.isArray(raw) ? raw : []);
  } catch {
    return new Set();
  }
}

function persistSaved(set) {
  try {
    localStorage.setItem(LS.saved, JSON.stringify([...set]));
  } catch {
    /* storage unavailable — stay in-memory */
  }
}

function loadTheme() {
  const stored = safeGet(LS.theme);
  if (stored === 'light' || stored === 'dark') return stored;
  const prefersLight = typeof matchMedia === 'function'
    && matchMedia('(prefers-color-scheme: light)').matches;
  return prefersLight ? 'light' : 'dark';
}

function persistTheme(theme) {
  try { localStorage.setItem(LS.theme, theme); } catch { /* ignore */ }
}

function loadAdded() {
  try {
    const raw = JSON.parse(localStorage.getItem(LS.added) ?? '[]');
    return Array.isArray(raw) ? raw.map((item) => normalizeUpdate(item, 'manual')) : [];
  } catch {
    return [];
  }
}

function persistAdded(updates) {
  try { localStorage.setItem(LS.added, JSON.stringify(updates)); } catch { /* ignore */ }
}

function safeGet(key) {
  try { return localStorage.getItem(key); } catch { return null; }
}
