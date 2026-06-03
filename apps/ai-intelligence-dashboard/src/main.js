// =====================================================================
// App bootstrap. Wires sources -> store -> views, builds the chrome
// (sidebar nav, filter bar, search, theme toggle, manual-add form), and
// re-renders the active view on every state change.
// =====================================================================

import { el, mount } from './dom.js';
import { store, theme } from './store.js';
import { VIEWS } from './views.js';
import { ingest } from './data/sources/adapter.js';
import { mockSource } from './data/sources/mockSource.js';
import { seedExperiments } from './data/seed/experiments.js';
import { seedOpportunities } from './data/seed/opportunities.js';
import { seedLearning } from './data/seed/learning.js';
import { seedRisks } from './data/seed/risks.js';
import { COMPANIES, CATEGORIES, PRIORITIES, RISK_LEVELS, HYPE_LEVELS } from './data/schema.js';

// --- Register data sources here. Add live adapters alongside mockSource. --
const SOURCES = [mockSource];

theme.init();

const app = document.getElementById('app');

function navItem(id, label) {
  return el(
    'button',
    {
      class: `nav__item${store.state.view === id ? ' is-active' : ''}`,
      onClick: () => store.setView(id),
    },
    [label],
  );
}

function sidebar() {
  return el('aside', { class: 'sidebar' }, [
    el('div', { class: 'brand' }, [
      el('span', { class: 'brand__mark' }, ['◆']),
      el('div', {}, [
        el('strong', {}, ['AI Intelligence']),
        el('span', { class: 'brand__sub' }, ['Command Center']),
      ]),
    ]),
    el('nav', { class: 'nav' }, Object.entries(VIEWS).map(([id, v]) => navItem(id, v.label))),
    el('div', { class: 'sidebar__foot' }, [
      el('button', { class: 'ghost-btn', onClick: () => theme.toggle() && rerender() }, ['◐ Theme']),
    ]),
  ]);
}

function selectFilter(label, key, options, withAll = true) {
  const current = store.state.filters[key];
  const opts = (withAll ? [['all', 'All']] : []).concat(options.map((o) => [o, o]));
  return el('label', { class: 'filter' }, [
    el('span', {}, [label]),
    el(
      'select',
      { onChange: (e) => store.setFilter(key, e.target.value) },
      opts.map(([val, text]) =>
        el('option', { value: val, ...(String(current) === String(val) ? { selected: '' } : {}) }, [text]),
      ),
    ),
  ]);
}

function filterBar() {
  const f = store.state.filters;
  return el('div', { class: 'filterbar' }, [
    selectFilter('Company', 'company', COMPANIES),
    selectFilter('Category', 'category', CATEGORIES),
    selectFilter('Priority', 'priority', PRIORITIES),
    selectFilter('Risk', 'riskLevel', RISK_LEVELS),
    selectFilter('Hype', 'hypeLevel', HYPE_LEVELS),
    el('label', { class: 'filter' }, [
      el('span', {}, [`Min relevance: ${f.minRelevance}`]),
      el('input', {
        type: 'range', min: '0', max: '100', step: '5', value: String(f.minRelevance),
        onInput: (e) => store.setFilter('minRelevance', Number(e.target.value)),
      }),
    ]),
    el('label', { class: 'filter filter--check' }, [
      el('input', {
        type: 'checkbox', ...(f.savedOnly ? { checked: '' } : {}),
        onChange: (e) => store.setFilter('savedOnly', e.target.checked),
      }),
      el('span', {}, ['Saved only']),
    ]),
  ]);
}

function topbar() {
  return el('header', { class: 'topbar' }, [
    el('div', { class: 'search' }, [
      el('span', { class: 'search__icon' }, ['⌕']),
      el('input', {
        type: 'search', placeholder: 'Search updates, tools, tags…', value: store.state.query,
        onInput: (e) => store.setQuery(e.target.value),
      }),
    ]),
    el('div', { class: 'topbar__actions' }, [
      el('span', { class: 'badge badge--sample' }, ['SAMPLE DATA']),
      el('button', { class: 'primary-btn', onClick: openAddForm }, ['+ Add update']),
    ]),
  ]);
}

// --- Manual add (Section 11): minimal inline form, in-memory insert. ---
function openAddForm() {
  const overlay = el('div', { class: 'modal' }, []);
  const field = (name, label, type = 'text') =>
    el('label', { class: 'form-field' }, [
      el('span', {}, [label]),
      type === 'textarea'
        ? el('textarea', { name, rows: '2' }, [])
        : el('input', { name, type }),
    ]);

  const form = el('form', { class: 'modal__panel' }, [
    el('h3', {}, ['Add AI update']),
    field('title', 'Title'),
    field('summary', 'Summary', 'textarea'),
    selectField('company', 'Company', COMPANIES),
    selectField('category', 'Category', CATEGORIES),
    field('businessImpact', 'Business impact', 'textarea'),
    field('recommendedAction', 'Recommended next action'),
    selectField('priority', 'Priority', PRIORITIES),
    selectField('riskLevel', 'Risk level', RISK_LEVELS),
    field('tags', 'Tags (comma separated)'),
    el('div', { class: 'modal__actions' }, [
      el('button', { type: 'button', class: 'ghost-btn', onClick: () => overlay.remove() }, ['Cancel']),
      el('button', { type: 'submit', class: 'primary-btn' }, ['Add update']),
    ]),
  ]);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    if (!data.title) return;
    const now = new Date().toISOString().slice(0, 10);
    const update = {
      id: `upd-${Date.now()}`,
      title: data.title,
      summary: data.summary || '',
      sourceName: 'Manual entry',
      sourceUrl: '',
      company: data.company || 'Other',
      category: data.category || 'Platform',
      tags: (data.tags || '').split(',').map((t) => t.trim()).filter(Boolean),
      publishedAt: now,
      createdAt: now,
      relevanceScore: 70,
      businessImpact: data.businessImpact || '',
      businessRelevance: 'Watch later',
      recommendedAction: data.recommendedAction || '',
      riskLevel: data.riskLevel || 'low',
      riskTypes: [],
      hypeLevel: 'Worth testing',
      status: 'new',
      saved: false,
      priority: data.priority || 'medium',
    };
    store.set({ updates: [update, ...store.state.updates], view: 'updates' });
    overlay.remove();
  });

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });
  overlay.appendChild(form);
  document.body.appendChild(overlay);
}

function selectField(name, label, options) {
  return el('label', { class: 'form-field' }, [
    el('span', {}, [label]),
    el('select', { name }, options.map((o) => el('option', { value: o }, [o]))),
  ]);
}

// --- Render loop -----------------------------------------------------
function content() {
  const s = store.state;
  if (s.loading) return el('div', { class: 'loading' }, [el('div', { class: 'spinner' }), 'Loading intelligence…']);
  if (s.error) return el('div', { class: 'error' }, [`Failed to load: ${s.error}`]);
  const view = VIEWS[s.view] || VIEWS.overview;
  const showFilters = ['updates', 'automation', 'coding', 'media'].includes(s.view);
  return el('div', {}, [
    topbar(),
    s.ingestErrors.length
      ? el('div', { class: 'notice' }, [`${s.ingestErrors.length} source(s) failed; showing what loaded.`])
      : null,
    showFilters ? filterBar() : null,
    el('section', { class: 'view' }, [view.render(s)]),
    el('footer', { class: 'app-foot' }, [
      'Sample/seed data — connect a live source in src/data/sources/. See README.md.',
    ]),
  ]);
}

function rerender() {
  mount(app, sidebar(), el('main', { class: 'main' }, [content()]));
}

store.subscribe(rerender);
rerender();

// --- Initial data load ----------------------------------------------
(async () => {
  try {
    const { updates, errors } = await ingest(SOURCES, { maxAgeDays: 0 });
    store.set({
      loading: false,
      updates,
      ingestErrors: errors,
      experiments: seedExperiments,
      opportunities: seedOpportunities,
      learning: seedLearning,
      risks: seedRisks,
    });
  } catch (err) {
    store.set({ loading: false, error: String(err) });
  }
})();
