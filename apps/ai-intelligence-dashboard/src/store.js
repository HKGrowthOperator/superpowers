// =====================================================================
// App state store. Tiny pub/sub — no framework.
//
// Holds: loaded data, active view, filters, search query, and the set of
// saved insight ids (persisted to localStorage so bookmarks survive reload).
// =====================================================================

const SAVED_KEY = 'ai-dashboard:saved';
const THEME_KEY = 'ai-dashboard:theme';

function loadSaved() {
  try {
    return new Set(JSON.parse(localStorage.getItem(SAVED_KEY) || '[]'));
  } catch {
    return new Set();
  }
}

function persistSaved(set) {
  try {
    localStorage.setItem(SAVED_KEY, JSON.stringify([...set]));
  } catch {
    /* ignore quota / privacy-mode errors */
  }
}

export const store = {
  state: {
    loading: true,
    error: null,
    view: 'overview',
    updates: [],
    experiments: [],
    opportunities: [],
    learning: [],
    risks: [],
    ingestErrors: [],
    savedIds: loadSaved(),
    filters: {
      company: 'all',
      category: 'all',
      priority: 'all',
      riskLevel: 'all',
      hypeLevel: 'all',
      minRelevance: 0,
      savedOnly: false,
    },
    query: '',
  },

  _subs: new Set(),
  subscribe(fn) {
    this._subs.add(fn);
    return () => this._subs.delete(fn);
  },
  _emit() {
    for (const fn of this._subs) fn(this.state);
  },

  set(patch) {
    this.state = { ...this.state, ...patch };
    this._emit();
  },

  setFilter(key, value) {
    this.state.filters = { ...this.state.filters, [key]: value };
    this._emit();
  },

  setView(view) {
    this.state.view = view;
    this._emit();
  },

  setQuery(q) {
    this.state.query = q;
    this._emit();
  },

  isSaved(id) {
    return this.state.savedIds.has(id);
  },

  toggleSaved(id) {
    const set = new Set(this.state.savedIds);
    if (set.has(id)) set.delete(id);
    else set.add(id);
    this.state.savedIds = set;
    persistSaved(set);
    this._emit();
  },
};

// Theme persistence is independent of the reactive state.
export const theme = {
  get() {
    return localStorage.getItem(THEME_KEY) || 'dark';
  },
  set(value) {
    try {
      localStorage.setItem(THEME_KEY, value);
    } catch {
      /* ignore */
    }
    document.documentElement.setAttribute('data-theme', value);
  },
  toggle() {
    this.set(this.get() === 'dark' ? 'light' : 'dark');
    return this.get();
  },
  init() {
    document.documentElement.setAttribute('data-theme', this.get());
  },
};
