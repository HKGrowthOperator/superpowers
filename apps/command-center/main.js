// main.js — bootstrap. Registers every module + its seed data, creates the
// store, builds the shell (grouped sidebar, topbar, theme), and routes the
// active module into the content area. Add a new module by importing it,
// adding it to MODULES, and registering its seed slice in SEED.

import { el, clear, mount } from './core/dom.js';
import { createStore } from './core/store.js';

import overview from './modules/overview/view.js';
import aiIntelligence from './modules/ai-intelligence/view.js';
import sopsModule from './modules/sops/view.js';
import customerService from './modules/customer-service/view.js';
import concepts from './modules/concepts/view.js';
import automation from './modules/automation/view.js';
import websites from './modules/websites/view.js';
import saved from './modules/saved/view.js';
import settings from './modules/settings/view.js';

import { updates, experiments, opportunities, learning, risks } from './modules/ai-intelligence/data.js';
import { sops } from './modules/sops/data.js';
import { clients, templates } from './modules/customer-service/data.js';
import { concepts as conceptsData } from './modules/concepts/data.js';
import { automations } from './modules/automation/data.js';
import { websites as websitesData } from './modules/websites/data.js';

const MODULES = [overview, aiIntelligence, sopsModule, customerService, concepts, automation, websites, saved, settings];
const getModule = (id) => MODULES.find((m) => m.id === id) || MODULES[0];

const SEED = {
  aiUpdates: updates, experiments, opportunities, learning, risks,
  sops, clients, templates, concepts: conceptsData, automations, websites: websitesData,
};

const GROUP_ORDER = ['Start', 'Intelligenz', 'Betrieb', 'Wachstum', 'System'];

const store = createStore({ seed: SEED, firstModule: 'overview' });
const root = document.getElementById('app');

// ── shell (built once) ───────────────────────────────────────────────────────
const navButtons = new Map();

const brand = el('div', { class: 'brand', role: 'button', tabindex: '0',
  onClick: () => { store.setActiveModule('overview'); closeNav(); } }, [
  el('span', { class: 'brand__mark', text: 'CC' }),
  el('div', { class: 'brand__text' }, [el('strong', { text: 'Command Center' }), el('span', { class: 'brand__sub', text: 'Deine Schaltzentrale' })]),
]);

function buildNav() {
  const nav = el('nav', { class: 'nav', 'aria-label': 'Module' });
  for (const group of GROUP_ORDER) {
    const inGroup = MODULES.filter((m) => (m.group || 'System') === group);
    if (!inGroup.length) continue;
    nav.append(el('p', { class: 'nav__group', text: group }));
    for (const m of inGroup) {
      const btn = el('button', { class: 'nav__item', type: 'button', text: m.label,
        onClick: () => { store.setActiveModule(m.id); closeNav(); } });
      navButtons.set(m.id, btn);
      nav.append(btn);
    }
  }
  return nav;
}

const sidebar = el('aside', { class: 'sidebar' }, [brand, buildNav()]);

const menuBtn = el('button', { class: 'icon-btn menu-btn', type: 'button', 'aria-label': 'Navigation', text: '☰', onClick: () => root.classList.toggle('is-nav-open') });
const viewTitle = el('h1', { class: 'topbar__title' });
const themeBtn = el('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Theme umschalten', onClick: () => store.toggleTheme() });
const topbar = el('header', { class: 'topbar' }, [menuBtn, viewTitle, el('div', { class: 'topbar__spacer' }), themeBtn]);

const content = el('main', { class: 'content', id: 'content', tabindex: '-1' });
const scrim = el('div', { class: 'scrim', onClick: () => closeNav() });

mount(root, sidebar, el('div', { class: 'main' }, [topbar, content]), scrim);

function closeNav() { root.classList.remove('is-nav-open'); }

// ── render loop ──────────────────────────────────────────────────────────────
function render(state) {
  document.documentElement.dataset.theme = state.ui.theme;
  themeBtn.textContent = state.ui.theme === 'dark' ? '☀' : '☾';

  for (const [id, btn] of navButtons) btn.classList.toggle('is-active', id === state.ui.activeModule);

  const mod = getModule(state.ui.activeModule);
  viewTitle.textContent = mod.label;
  clear(content);
  mod.render(content, store);
}

store.subscribe(render);
render(store.getState());
