// main.js — bootstrap. Builds the shell, registers sources, wires the store to
// the views, and owns the filter bar. Entry point loaded by index.html.

import { el, clear, mount } from './dom.js';
import { createStore } from './store.js';
import { mockSource } from './sources/mockSource.js';
import { VIEWS, getView } from './views.js';
import { Category, Company, RiskLevel, HypeLevel } from './schema.js';

// Views that get the filter bar (must consume store.filters via filterUpdates).
const showFilters = ['updates'];

// Register sources here — never hardcode update arrays into views/store.
const store = createStore({ sources: [mockSource] });

const root = document.getElementById('app');

// ── shell (built once) ───────────────────────────────────────────────────────
const navButtons = new Map();

const brand = el('div', { class: 'brand' }, [
  el('span', { class: 'brand__mark', text: 'AI' }),
  el('div', { class: 'brand__text' }, [
    el('strong', { text: 'AI Intelligence' }),
    el('span', { class: 'brand__sub', text: 'Business command center' }),
  ]),
]);

const nav = el('nav', { class: 'nav', 'aria-label': 'Sections' },
  VIEWS.map((view) => {
    const btn = el('button', {
      class: 'nav__item',
      type: 'button',
      text: view.label,
      onClick: () => { store.setView(view.id); closeNavOnMobile(); },
    });
    navButtons.set(view.id, btn);
    return btn;
  }));

const sidebar = el('aside', { class: 'sidebar' }, [brand, nav]);

const menuBtn = el('button', {
  class: 'icon-btn menu-btn', type: 'button', 'aria-label': 'Toggle navigation',
  text: '☰', onClick: () => root.classList.toggle('is-nav-open'),
});

const viewTitle = el('h1', { class: 'topbar__title' });

const themeBtn = el('button', {
  class: 'icon-btn', type: 'button', 'aria-label': 'Toggle light/dark theme',
  onClick: () => store.toggleTheme(),
});

const addBtn = el('button', {
  class: 'btn btn--primary', type: 'button', text: '+ Add update',
  onClick: () => store.setView('add'),
});

const topbar = el('header', { class: 'topbar' }, [
  menuBtn, viewTitle, el('div', { class: 'topbar__spacer' }), addBtn, themeBtn,
]);

const filterBar = el('div', { class: 'filter-bar', hidden: true });
const content = el('main', { class: 'content', id: 'content', tabindex: '-1' });

mount(root, sidebar, el('div', { class: 'main' }, [topbar, filterBar, content]));

// ── filter bar controls (built once, synced from state) ──────────────────────
const allOption = (label) => el('option', { value: 'all', text: label });
const enumOptions = (enumObj) => Object.values(enumObj).map((v) => el('option', { value: v, text: v }));

const search = el('input', {
  class: 'input', type: 'search', placeholder: 'Search updates…', 'aria-label': 'Search updates',
  onInput: () => store.setFilter({ q: search.value }),
});
const selCategory = filterSelect('All categories', Category, (v) => store.setFilter({ category: v }));
const selCompany = filterSelect('All companies', Company, (v) => store.setFilter({ company: v }));
const selRisk = filterSelect('All risk levels', RiskLevel, (v) => store.setFilter({ riskLevel: v }));
const selHype = filterSelect('All hype levels', HypeLevel, (v) => store.setFilter({ hypeLevel: v }));

const savedOnly = el('input', { type: 'checkbox', onChange: () => store.setFilter({ savedOnly: savedOnly.checked }) });
const savedToggle = el('label', { class: 'filter-bar__saved' }, [savedOnly, el('span', { text: 'Saved only' })]);

const resetBtn = el('button', {
  class: 'btn', type: 'button', text: 'Reset',
  onClick: () => {
    search.value = '';
    store.resetFilters();
  },
});

mount(filterBar,
  search, selCategory, selCompany, selRisk, selHype, savedToggle, resetBtn);

function filterSelect(allLabel, enumObj, onChange) {
  const select = el('select', { class: 'input', onChange: () => onChange(select.value) });
  mount(select, allOption(allLabel), ...enumOptions(enumObj));
  return select;
}

// ── render loop ──────────────────────────────────────────────────────────────
function render(state) {
  document.documentElement.dataset.theme = state.theme;
  themeBtn.textContent = state.theme === 'dark' ? '☀' : '☾';

  for (const [id, btn] of navButtons) {
    btn.classList.toggle('is-active', id === state.activeView);
  }

  const view = getView(state.activeView);
  viewTitle.textContent = view.label;

  const filtersOn = showFilters.includes(state.activeView);
  filterBar.hidden = !filtersOn;
  if (filtersOn) syncFilterControls(state.filters);

  view.render(content, store);
}

function syncFilterControls(filters) {
  // Selects/checkbox are safe to sync every render; only touch the search box
  // when it isn't focused, so typing is never interrupted.
  selCategory.value = filters.category;
  selCompany.value = filters.company;
  selRisk.value = filters.riskLevel;
  selHype.value = filters.hypeLevel;
  savedOnly.checked = filters.savedOnly;
  if (document.activeElement !== search) search.value = filters.q;
}

function closeNavOnMobile() {
  root.classList.remove('is-nav-open');
}

store.subscribe(render);
render(store.getState());
store.load();
