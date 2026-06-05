// core/components.js — shared UI building blocks used by every module.
// Data is rendered via el()/textContent. html() is used only for constant icons.

import { el, clear, html } from './dom.js';

const ICONS = Object.freeze({
  bookmark: '<svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true"><path fill="currentColor" d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z"/></svg>',
  bookmarkOutline: '<svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" d="M6 4h12v16l-6-3.4L6 20V4z"/></svg>',
});
const icon = (name) => { const s = el('span', { class: 'icon' }); s.append(html(ICONS[name])); return s; };

// ── primitives ───────────────────────────────────────────────────────────────
export function card({ children = [], accent = null, class: cls = '' } = {}) {
  return el('article', { class: `card ${accent ? `card--${accent}` : ''} ${cls}`.trim() }, children);
}

export function chip(label, tone = 'neutral') {
  return el('span', { class: `chip chip--${tone}`, text: label });
}

export function sectionHead(title, subtitle = '', actions = []) {
  return el('header', { class: 'section-head' }, [
    el('div', { class: 'section-head__text' }, [
      el('h2', { class: 'section-head__title', text: title }),
      subtitle && el('p', { class: 'section-head__subtitle', text: subtitle }),
    ]),
    actions.length ? el('div', { class: 'section-head__actions' }, actions) : null,
  ]);
}

export function grid(children = [], min = '320px') {
  const node = el('div', { class: 'grid' }, children);
  node.style.setProperty('--grid-min', min);
  return node;
}

export function kpi(label, value, hint = '') {
  return el('div', { class: 'kpi' }, [
    el('span', { class: 'kpi__label', text: label }),
    el('span', { class: 'kpi__value', text: String(value) }),
    hint && el('span', { class: 'kpi__hint', text: hint }),
  ]);
}

export function score(value) {
  const v = Math.max(0, Math.min(100, Math.round(value)));
  const tier = v >= 75 ? 'high' : v >= 45 ? 'mid' : 'low';
  const ring = el('div', { class: `score score--${tier}`, role: 'img', 'aria-label': `Score ${v} of 100` });
  ring.style.background = `conic-gradient(var(--score-fill) ${v * 3.6}deg, var(--score-track) 0deg)`;
  ring.append(el('span', { class: 'score__value', text: String(v) }));
  return ring;
}

export function saveBtn(id, saved, onToggle) {
  return el('button', {
    class: `save-btn ${saved ? 'is-saved' : ''}`.trim(), type: 'button',
    'aria-pressed': saved ? 'true' : 'false',
    'aria-label': saved ? 'Remove from saved' : 'Save', title: saved ? 'Saved' : 'Save',
    onClick: () => onToggle(id),
  }, [icon(saved ? 'bookmark' : 'bookmarkOutline')]);
}

// ── shared bits ──────────────────────────────────────────────────────────────
export const metaLine = (label, value) =>
  el('p', { class: 'meta-line' }, [
    el('span', { class: 'meta-line__label', text: label }),
    el('span', { class: 'meta-line__value', text: value || '—' }),
  ]);

export const accentLine = (label, value, tone = 'brand') =>
  el('p', { class: `recommend recommend--${tone}` }, [
    el('span', { class: 'recommend__label', text: label }),
    el('span', { class: 'recommend__text', text: value || '—' }),
  ]);

export const bullets = (items = []) =>
  items.length ? el('ul', { class: 'bullets' }, items.map((t) => el('li', { text: t }))) : null;

export const subLabel = (text) => el('p', { class: 'sub-label', text });

export const tagRow = (tags = [], tone = 'outline') =>
  tags.length ? el('div', { class: 'tag-row' }, tags.map((t) => chip(t, tone))) : null;

// ── states ───────────────────────────────────────────────────────────────────
export const loadingState = (msg = 'Loading…') =>
  el('div', { class: 'state state--loading' }, [el('div', { class: 'spinner', 'aria-hidden': 'true' }), el('p', { text: msg })]);

export const emptyState = (msg = 'Nothing here yet.') =>
  el('div', { class: 'state state--empty' }, [el('p', { text: msg })]);

export function errorState(msg, onRetry) {
  return el('div', { class: 'state state--error' }, [
    el('p', { text: `Something went wrong: ${msg}` }),
    onRetry && el('button', { class: 'btn', type: 'button', text: 'Retry', onClick: onRetry }),
  ]);
}

export const comingSoon = (what) =>
  el('div', { class: 'state state--empty' }, [
    el('p', { class: 'coming-soon__title', text: 'In Arbeit' }),
    el('p', { text: what }),
  ]);

// ── form helpers ─────────────────────────────────────────────────────────────
export const btn = (label, opts = {}) =>
  el('button', { class: `btn ${opts.primary ? 'btn--primary' : ''} ${opts.class || ''}`.trim(), type: opts.type || 'button', text: label, onClick: opts.onClick });

export function field(label, control, hint = '') {
  return el('label', { class: 'field' }, [
    el('span', { class: 'field__label', text: label }),
    control,
    hint && el('span', { class: 'field__hint', text: hint }),
  ]);
}

export const input = (props = {}) => el('input', { class: 'input', ...props });
export const textarea = (props = {}) => el('textarea', { class: 'input', rows: props.rows || 3, ...props });

export function select(options, value, props = {}) {
  return el('select', { class: 'input', ...props },
    options.map((opt) => el('option', { value: opt, text: opt, selected: opt === value })));
}

// ── generic searchable list (reused by most modules) ─────────────────────────
const searchCache = new Map(); // moduleId -> term, survives store-driven re-renders

/**
 * @param {object} cfg
 *  moduleId, title, subtitle, items[], card(item)=>Node,
 *  searchFields(item)=>string[] (optional), actions[] (optional),
 *  min (grid min width), emptyMsg
 */
export function genericList(cfg) {
  const term = searchCache.get(cfg.moduleId) ?? '';
  const section = el('section', { class: 'view-section' });
  const results = el('div');

  const renderResults = () => {
    clear(results);
    const t = (searchCache.get(cfg.moduleId) ?? '').trim().toLowerCase();
    const list = !t || !cfg.searchFields
      ? cfg.items
      : cfg.items.filter((it) => cfg.searchFields(it).join(' ').toLowerCase().includes(t));
    results.append(list.length
      ? grid(list.map(cfg.card), cfg.min)
      : emptyState(cfg.emptyMsg || 'No matches.'));
  };

  const head = sectionHead(cfg.title, cfg.subtitle, cfg.actions || []);
  section.append(head);

  if (cfg.searchFields) {
    const searchInput = input({
      type: 'search', placeholder: 'Suchen…', 'aria-label': `Search ${cfg.title}`, value: term,
      onInput: (e) => { searchCache.set(cfg.moduleId, e.target.value); renderResults(); },
    });
    section.append(el('div', { class: 'list-search' }, [searchInput]));
  }

  renderResults();
  section.append(results);
  return section;
}

/** Reset a module's cached search term (call when leaving a module if desired). */
export const clearSearch = (moduleId) => searchCache.delete(moduleId);
