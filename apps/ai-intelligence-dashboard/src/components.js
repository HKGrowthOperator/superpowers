// Card renderers — one function per entity type. Pure-ish: given data and a
// store, return a DOM node. Save toggles call back into the store.

import { el, chip, mount } from './dom.js';
import { store } from './store.js';

const riskVariant = { low: 'good', medium: 'warn', high: 'bad' };
const hypeVariant = {
  'Genuinely useful': 'good',
  'Worth testing': 'info',
  'Strategic watch': 'info',
  'Mostly hype': 'warn',
  Risky: 'bad',
  'Not relevant right now': 'muted',
};

function saveButton(id) {
  const saved = store.isSaved(id);
  return el(
    'button',
    {
      class: `save-btn${saved ? ' is-saved' : ''}`,
      title: saved ? 'Remove from saved' : 'Save for later',
      'aria-pressed': String(saved),
      onClick: (e) => {
        e.stopPropagation();
        store.toggleSaved(id);
      },
    },
    [saved ? '★ Saved' : '☆ Save'],
  );
}

function scoreBar(score) {
  return el('div', { class: 'score', title: `Relevance ${score}/100` }, [
    el('div', { class: 'score__track' }, [
      el('div', { class: 'score__fill', style: `width:${Math.max(0, Math.min(100, score))}%` }),
    ]),
    el('span', { class: 'score__num' }, [String(score)]),
  ]);
}

/** @param {import('./data/schema.js').AIUpdate} u */
export function updateCard(u) {
  return el('article', { class: 'card', dataset: { id: u.id } }, [
    el('header', { class: 'card__head' }, [
      el('div', { class: 'card__meta' }, [
        chip(u.company, 'company'),
        chip(u.category),
        chip(u.priority, `prio-${u.priority}`),
      ]),
      saveButton(u.id),
    ]),
    el('h3', { class: 'card__title' }, [u.title]),
    el('p', { class: 'card__summary' }, [u.summary]),
    scoreBar(u.relevanceScore),
    el('dl', { class: 'card__facts' }, [
      el('dt', {}, ['Business impact']),
      el('dd', {}, [u.businessImpact]),
      el('dt', {}, ['Why it matters']),
      el('dd', {}, [chip(u.businessRelevance, 'relevance')]),
      el('dt', {}, ['Next action']),
      el('dd', {}, [u.recommendedAction]),
      el('dt', {}, ['Hype filter']),
      el('dd', {}, [chip(u.hypeLevel, hypeVariant[u.hypeLevel] || 'muted')]),
      el('dt', {}, ['Risk']),
      el('dd', {}, [
        chip(u.riskLevel, riskVariant[u.riskLevel]),
        ...(u.riskTypes || []).map((r) => chip(r, 'risk')),
      ]),
    ]),
    el('footer', { class: 'card__foot' }, [
      el('div', { class: 'tags' }, (u.tags || []).map((t) => chip(`#${t}`, 'tag'))),
      el('time', {}, [u.publishedAt]),
    ]),
  ]);
}

/** @param {import('./data/schema.js').WeeklyExperiment} x */
export function experimentCard(x) {
  return el('article', { class: 'card', dataset: { id: x.id } }, [
    el('header', { class: 'card__head' }, [
      el('div', { class: 'card__meta' }, [
        chip(x.difficulty, 'diff'),
        x.canBeClientOffer ? chip('Client offer ✓', 'good') : chip('Internal', 'muted'),
      ]),
      saveButton(x.id),
    ]),
    el('h3', { class: 'card__title' }, [x.name]),
    el('p', { class: 'card__summary' }, [x.objective]),
    el('dl', { class: 'card__facts' }, [
      el('dt', {}, ['Tools']),
      el('dd', {}, [el('div', { class: 'tags' }, x.toolsNeeded.map((t) => chip(t, 'tag')))]),
      el('dt', {}, ['Business value']),
      el('dd', {}, [x.businessValue]),
      el('dt', {}, ['Steps']),
      el('dd', {}, [el('ol', { class: 'steps' }, x.steps.map((s) => el('li', {}, [s])))]),
      el('dt', {}, ['Validate']),
      el('dd', {}, [x.validation]),
    ]),
  ]);
}

/** @param {import('./data/schema.js').BusinessOpportunity} o */
export function opportunityCard(o) {
  return el('article', { class: 'card', dataset: { id: o.id } }, [
    el('header', { class: 'card__head' }, [
      el('div', { class: 'card__meta' }, [
        chip(o.deliveryComplexity, 'diff'),
        chip(`risk: ${o.riskLevel}`, riskVariant[o.riskLevel]),
      ]),
      saveButton(o.id),
    ]),
    el('h3', { class: 'card__title' }, [o.offerName]),
    el('p', { class: 'card__summary' }, [o.problemSolved]),
    el('dl', { class: 'card__facts' }, [
      el('dt', {}, ['Target customer']),
      el('dd', {}, [o.targetCustomer]),
      el('dt', {}, ['Price range']),
      el('dd', {}, [chip(o.priceRange, 'price')]),
      el('dt', {}, ['Required tools']),
      el('dd', {}, [el('div', { class: 'tags' }, o.requiredTools.map((t) => chip(t, 'tag')))]),
      el('dt', {}, ['Delivery']),
      el('dd', {}, [el('ol', { class: 'steps' }, o.deliverySteps.map((s) => el('li', {}, [s])))]),
      el('dt', {}, ['Retainer']),
      el('dd', {}, [o.retainerPotential]),
      el('dt', {}, ['Proof of concept']),
      el('dd', {}, [o.proofOfConcept]),
    ]),
  ]);
}

/** @param {import('./data/schema.js').LearningConcept} c */
export function learningCard(c) {
  return el('article', { class: 'card', dataset: { id: c.id } }, [
    el('header', { class: 'card__head' }, [
      el('div', { class: 'card__meta' }, [chip('Learn', 'info')]),
      saveButton(c.id),
    ]),
    el('h3', { class: 'card__title' }, [c.concept]),
    el('p', { class: 'card__summary' }, [c.explanation]),
    el('dl', { class: 'card__facts' }, [
      el('dt', {}, ['Business use case']),
      el('dd', {}, [c.businessUseCase]),
      el('dt', {}, ['Example']),
      el('dd', {}, [c.practicalExample]),
      el('dt', {}, ['Use in your agency']),
      el('dd', {}, [c.agencyUse]),
      el('dt', {}, ['Mistake to avoid']),
      el('dd', {}, [chip('⚠', 'warn'), ' ', c.mistakeToAvoid]),
      el('dt', {}, ['Exercise']),
      el('dd', {}, [c.exercise]),
    ]),
  ]);
}

/** @param {import('./data/schema.js').RiskAssessment} r */
export function riskCard(r) {
  return el('article', { class: 'card card--risk', dataset: { id: r.id } }, [
    el('header', { class: 'card__head' }, [
      el('div', { class: 'card__meta' }, [chip(r.riskType, 'risk'), chip(r.level, riskVariant[r.level])]),
    ]),
    el('h3', { class: 'card__title' }, [r.subject]),
    el('dl', { class: 'card__facts' }, [
      el('dt', {}, ['Risk']),
      el('dd', {}, [r.note]),
      el('dt', {}, ['Mitigation']),
      el('dd', {}, [r.mitigation]),
    ]),
  ]);
}

/** Empty-state placeholder. */
export function emptyState(message) {
  return el('div', { class: 'empty' }, [
    el('div', { class: 'empty__icon' }, ['◍']),
    el('p', {}, [message || 'Nothing matches your filters yet.']),
  ]);
}

export { mount };
