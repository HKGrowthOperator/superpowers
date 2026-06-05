// components.js — reusable UI building blocks + one render function per entity.
// Data is always rendered via el()/textContent (never innerHTML).
// The html() escape hatch is used ONLY for the constant inline-SVG icons below.

import { el, html } from './dom.js';
import { RiskLevel, HypeLevel } from './schema.js';

// ── icons (constant strings only — safe for html()) ─────────────────────────
const ICONS = Object.freeze({
  bookmark:
    '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z"/></svg>',
  bookmarkOutline:
    '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" d="M6 4h12v16l-6-3.4L6 20V4z"/></svg>',
});

const icon = (name) => {
  const span = el('span', { class: 'icon' });
  span.append(html(ICONS[name]));
  return span;
};

// ── primitives ──────────────────────────────────────────────────────────────

/** A surface card. accent adds a left color rail (token-driven class). */
export function card({ children = [], accent = null, class: cls = '' } = {}) {
  return el('article', { class: `card ${accent ? `card--${accent}` : ''} ${cls}`.trim() }, children);
}

/** A small status pill. tone selects a token-driven color. */
export function chip(label, tone = 'neutral') {
  return el('span', { class: `chip chip--${tone}`, text: label });
}

/** Section header with title, optional subtitle and right-aligned actions. */
export function sectionHead(title, subtitle = '', actions = []) {
  return el('header', { class: 'section-head' }, [
    el('div', { class: 'section-head__text' }, [
      el('h2', { class: 'section-head__title', text: title }),
      subtitle && el('p', { class: 'section-head__subtitle', text: subtitle }),
    ]),
    actions.length ? el('div', { class: 'section-head__actions' }, actions) : null,
  ]);
}

/** Responsive auto-fill grid. */
export function grid(children = [], min = '320px') {
  const node = el('div', { class: 'grid' }, children);
  node.style.setProperty('--grid-min', min);
  return node;
}

/** A 0–100 score ring with a color tier (low/mid/high). */
export function score(value) {
  const v = Math.max(0, Math.min(100, Math.round(value)));
  const tier = v >= 75 ? 'high' : v >= 45 ? 'mid' : 'low';
  const ring = el('div', { class: `score score--${tier}`, role: 'img', 'aria-label': `Relevance ${v} of 100` });
  ring.style.background =
    `conic-gradient(var(--score-fill) ${v * 3.6}deg, var(--score-track) 0deg)`;
  ring.append(el('span', { class: 'score__value', text: String(v) }));
  return ring;
}

/** Bookmark toggle. Flows through store.toggleSaved via onToggle. */
export function saveBtn(id, saved, onToggle) {
  const btn = el('button', {
    class: `save-btn ${saved ? 'is-saved' : ''}`.trim(),
    type: 'button',
    'aria-pressed': saved ? 'true' : 'false',
    'aria-label': saved ? 'Remove from saved' : 'Save',
    title: saved ? 'Saved' : 'Save',
    onClick: () => onToggle(id),
  }, [icon(saved ? 'bookmark' : 'bookmarkOutline')]);
  return btn;
}

// ── state views (loading / empty / error) ───────────────────────────────────
export const loadingState = (msg = 'Loading…') =>
  el('div', { class: 'state state--loading' }, [
    el('div', { class: 'spinner', 'aria-hidden': 'true' }),
    el('p', { text: msg }),
  ]);

export const emptyState = (msg = 'Nothing here yet.') =>
  el('div', { class: 'state state--empty' }, [el('p', { text: msg })]);

export function errorState(msg, onRetry) {
  return el('div', { class: 'state state--error' }, [
    el('p', { text: `Something went wrong: ${msg}` }),
    onRetry && el('button', { class: 'btn', type: 'button', text: 'Retry', onClick: onRetry }),
  ]);
}

// ── tone mapping (keeps colors semantic, not hardcoded) ─────────────────────
const riskTone = (level) =>
  level === RiskLevel.HIGH ? 'danger' : level === RiskLevel.MEDIUM ? 'warn' : 'ok';

const hypeTone = (level) =>
  level === HypeLevel.HYPE ? 'danger' : level === HypeLevel.MIXED ? 'warn' : 'ok';

// ── small shared bits ───────────────────────────────────────────────────────
const metaLine = (label, value) =>
  el('p', { class: 'meta-line' }, [
    el('span', { class: 'meta-line__label', text: label }),
    el('span', { class: 'meta-line__value', text: value }),
  ]);

const bullets = (items) =>
  el('ul', { class: 'bullets' }, items.map((t) => el('li', { text: t })));

const tagRow = (tags) =>
  tags.length ? el('div', { class: 'tag-row' }, tags.map((t) => chip(`#${t}`, 'neutral'))) : null;

// ── entity render functions (one per entity) ────────────────────────────────

/** @param {import('./schema.js').AIUpdate} u */
export function updateCard(u, ctx) {
  return card({
    accent: riskTone(u.riskLevel),
    children: [
      el('div', { class: 'card__top' }, [
        el('div', { class: 'card__top-meta' }, [
          chip(u.company, 'brand'),
          chip(u.category, 'neutral'),
          el('span', { class: 'card__date', text: u.date }),
        ]),
        score(u.relevanceScore),
      ]),
      el('h3', { class: 'card__title', text: u.title }),
      u.summary && el('p', { class: 'card__summary', text: u.summary }),
      el('div', { class: 'bi-block' }, [
        metaLine('Business impact', u.businessImpact || '—'),
        metaLine('Why it matters to us', u.businessRelevance || '—'),
        el('p', { class: 'recommend' }, [
          el('span', { class: 'recommend__label', text: 'Recommended action' }),
          el('span', { class: 'recommend__text', text: u.recommendedAction || '—' }),
        ]),
      ]),
      el('div', { class: 'card__chips' }, [
        chip(`Risk: ${u.riskLevel}`, riskTone(u.riskLevel)),
        chip(`Hype: ${u.hypeLevel}`, hypeTone(u.hypeLevel)),
        ...u.riskTypes.map((t) => chip(t, 'outline')),
      ]),
      tagRow(u.tags),
      el('div', { class: 'card__foot' }, [saveBtn(u.id, ctx.isSaved(u.id), ctx.onToggle)]),
    ],
  });
}

/** @param {import('./schema.js').WeeklyExperiment} e */
export function experimentCard(e, ctx) {
  const statusTone = e.status === 'validated' ? 'ok' : e.status === 'dropped' ? 'danger' : 'warn';
  return card({
    children: [
      el('div', { class: 'card__top' }, [
        el('div', { class: 'card__top-meta' }, [chip(e.week, 'neutral'), chip(e.status, statusTone)]),
        saveBtn(e.id, ctx.isSaved(e.id), ctx.onToggle),
      ]),
      el('h3', { class: 'card__title', text: e.title }),
      metaLine('Value', e.value),
      el('p', { class: 'sub-label', text: 'Tools' }),
      el('div', { class: 'tag-row' }, e.tools.map((t) => chip(t, 'outline'))),
      el('p', { class: 'sub-label', text: 'Steps' }),
      bullets(e.steps),
      metaLine('How we validate', e.validation),
    ],
  });
}

/** @param {import('./schema.js').BusinessOpportunity} o */
export function opportunityCard(o, ctx) {
  return card({
    accent: 'brand',
    children: [
      el('div', { class: 'card__top' }, [
        el('div', { class: 'card__top-meta' }, [chip(`Effort: ${o.effort}`, 'neutral')]),
        saveBtn(o.id, ctx.isSaved(o.id), ctx.onToggle),
      ]),
      el('h3', { class: 'card__title', text: o.title }),
      metaLine('Sellable value', o.value),
      el('p', { class: 'sub-label', text: 'Tools' }),
      el('div', { class: 'tag-row' }, o.tools.map((t) => chip(t, 'outline'))),
      el('p', { class: 'sub-label', text: 'Steps' }),
      bullets(o.steps),
      metaLine('Validate demand', o.validate),
    ],
  });
}

/** @param {import('./schema.js').LearningConcept} l */
export function learningCard(l, ctx) {
  return card({
    children: [
      el('div', { class: 'card__top' }, [
        el('h3', { class: 'card__title', text: l.term }),
        saveBtn(l.id, ctx.isSaved(l.id), ctx.onToggle),
      ]),
      el('p', { class: 'card__summary', text: l.definition }),
      metaLine('Why it matters', l.whyItMatters),
      metaLine('Example', l.example),
    ],
  });
}

/** @param {import('./schema.js').RiskAssessment} r */
export function riskCard(r, ctx) {
  return card({
    accent: riskTone(r.riskLevel),
    children: [
      el('div', { class: 'card__top' }, [
        el('div', { class: 'card__top-meta' }, [
          chip(`Risk: ${r.riskLevel}`, riskTone(r.riskLevel)),
          ...r.riskTypes.map((t) => chip(t, 'outline')),
        ]),
        saveBtn(r.id, ctx.isSaved(r.id), ctx.onToggle),
      ]),
      el('h3', { class: 'card__title', text: r.title }),
      el('p', { class: 'card__summary', text: r.description }),
      el('p', { class: 'recommend' }, [
        el('span', { class: 'recommend__label', text: 'Mitigation' }),
        el('span', { class: 'recommend__text', text: r.mitigation }),
      ]),
    ],
  });
}

/** A compact KPI tile for the dashboard. */
export function kpi(label, value, hint = '') {
  return el('div', { class: 'kpi' }, [
    el('span', { class: 'kpi__label', text: label }),
    el('span', { class: 'kpi__value', text: String(value) }),
    hint && el('span', { class: 'kpi__hint', text: hint }),
  ]);
}

/** Dispatch the right card for a saved {type,item}. */
export function entityCard(type, item, ctx) {
  if (type === 'update') return updateCard(item, ctx);
  if (type === 'experiment') return experimentCard(item, ctx);
  if (type === 'opportunity') return opportunityCard(item, ctx);
  if (type === 'learning') return learningCard(item, ctx);
  if (type === 'risk') return riskCard(item, ctx);
  return emptyState('Unknown item.');
}
