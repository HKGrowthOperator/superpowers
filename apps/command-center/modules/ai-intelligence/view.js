// modules/ai-intelligence/view.js — AI updates turned into business intelligence.
// Internal sub-tabs; cross-module bookmarks via store.toggleSaved.

import { el, clear } from '../../core/dom.js';
import { RiskLevel, HypeLevel } from '../../core/schema.js';
import {
  card, chip, score, saveBtn, sectionHead, grid, kpi,
  metaLine, accentLine, bullets, subLabel, tagRow, emptyState,
} from '../../core/components.js';
import { updates, experiments, opportunities, learning, risks } from './data.js';

const riskTone = (l) => (l === RiskLevel.HIGH ? 'danger' : l === RiskLevel.MEDIUM ? 'warn' : 'ok');
const hypeTone = (l) => (l === HypeLevel.HYPE ? 'danger' : l === HypeLevel.MIXED ? 'warn' : 'ok');

const TABS = [
  { id: 'updates', label: 'Updates' },
  { id: 'experiments', label: 'Experiments' },
  { id: 'opportunities', label: 'Opportunities' },
  { id: 'learning', label: 'Learning' },
  { id: 'risks', label: 'Risks & hype' },
];

let activeTab = 'updates';

// ── card builders ────────────────────────────────────────────────────────────
function updateCard(u, ctx) {
  return card({
    accent: riskTone(u.riskLevel),
    children: [
      el('div', { class: 'card__top' }, [
        el('div', { class: 'card__top-meta' }, [chip(u.company, 'brand'), chip(u.category, 'neutral'), el('span', { class: 'card__date', text: u.date })]),
        score(u.relevanceScore),
      ]),
      el('h3', { class: 'card__title', text: u.title }),
      u.summary && el('p', { class: 'card__summary', text: u.summary }),
      el('div', { class: 'bi-block' }, [
        metaLine('Business impact', u.businessImpact),
        metaLine('Why it matters to us', u.businessRelevance),
        accentLine('Recommended action', u.recommendedAction),
      ]),
      el('div', { class: 'card__chips' }, [
        chip(`Risk: ${u.riskLevel}`, riskTone(u.riskLevel)),
        chip(`Hype: ${u.hypeLevel}`, hypeTone(u.hypeLevel)),
        ...u.riskTypes.map((t) => chip(t, 'outline')),
      ]),
      tagRow((u.tags || []).map((t) => `#${t}`)),
      el('div', { class: 'card__foot' }, [saveBtn(u.id, ctx.isSaved(u.id), ctx.onToggle)]),
    ],
  });
}

function experimentCard(e, ctx) {
  const tone = e.status === 'validated' ? 'ok' : e.status === 'dropped' ? 'danger' : 'warn';
  return card({ children: [
    el('div', { class: 'card__top' }, [el('div', { class: 'card__top-meta' }, [chip(e.week, 'neutral'), chip(e.status, tone)]), saveBtn(e.id, ctx.isSaved(e.id), ctx.onToggle)]),
    el('h3', { class: 'card__title', text: e.title }),
    metaLine('Value', e.value),
    subLabel('Tools'), tagRow(e.tools),
    subLabel('Steps'), bullets(e.steps),
    metaLine('How we validate', e.validation),
  ] });
}

function opportunityCard(o, ctx) {
  return card({ accent: 'brand', children: [
    el('div', { class: 'card__top' }, [el('div', { class: 'card__top-meta' }, [chip(`Effort: ${o.effort}`, 'neutral')]), saveBtn(o.id, ctx.isSaved(o.id), ctx.onToggle)]),
    el('h3', { class: 'card__title', text: o.title }),
    metaLine('Sellable value', o.value),
    subLabel('Tools'), tagRow(o.tools),
    subLabel('Steps'), bullets(o.steps),
    metaLine('Validate demand', o.validate),
  ] });
}

function learningCard(l, ctx) {
  return card({ children: [
    el('div', { class: 'card__top' }, [el('h3', { class: 'card__title', text: l.term }), saveBtn(l.id, ctx.isSaved(l.id), ctx.onToggle)]),
    el('p', { class: 'card__summary', text: l.definition }),
    metaLine('Why it matters', l.whyItMatters),
    metaLine('Example', l.example),
  ] });
}

function riskCard(r, ctx) {
  return card({ accent: riskTone(r.riskLevel), children: [
    el('div', { class: 'card__top' }, [el('div', { class: 'card__top-meta' }, [chip(`Risk: ${r.riskLevel}`, riskTone(r.riskLevel)), ...r.riskTypes.map((t) => chip(t, 'outline'))]), saveBtn(r.id, ctx.isSaved(r.id), ctx.onToggle)]),
    el('h3', { class: 'card__title', text: r.title }),
    el('p', { class: 'card__summary', text: r.description }),
    accentLine('Mitigation', r.mitigation),
  ] });
}

export const aiCard = (slice, item, ctx) => ({
  aiUpdates: updateCard, experiments: experimentCard, opportunities: opportunityCard,
  learning: learningCard, risks: riskCard,
}[slice] || updateCard)(item, ctx);

// ── render ───────────────────────────────────────────────────────────────────
function render(root, store) {
  const ctx = { isSaved: store.isSaved, onToggle: store.toggleSaved };
  clear(root);

  const tabBar = el('div', { class: 'tabs' }, TABS.map((t) =>
    el('button', { class: `tab ${t.id === activeTab ? 'is-active' : ''}`.trim(), type: 'button', text: t.label, onClick: () => { activeTab = t.id; render(root, store); } })));

  const body = el('div');
  if (activeTab === 'updates') {
    const top = [...updates].sort((a, b) => b.relevanceScore - a.relevanceScore);
    body.append(sectionHead('AI updates', `${updates.length} tracked — sorted by business relevance`), grid(top.map((u) => updateCard(u, ctx))));
  } else if (activeTab === 'experiments') {
    body.append(sectionHead('Weekly experiments', 'Small, time-boxed tests with a clear validation.'), grid(experiments.map((e) => experimentCard(e, ctx))));
  } else if (activeTab === 'opportunities') {
    body.append(sectionHead('Business opportunities', 'Sellable offers with value, tools and validation.'), grid(opportunities.map((o) => opportunityCard(o, ctx))));
  } else if (activeTab === 'learning') {
    body.append(sectionHead('Learning', 'Plain-language concepts your team can act on.'), grid(learning.map((l) => learningCard(l, ctx)), '300px'));
  } else {
    const hype = updates.filter((u) => u.hypeLevel === HypeLevel.HYPE);
    body.append(
      sectionHead('Risk register', 'Known risks and how we mitigate them.'), grid(risks.map((r) => riskCard(r, ctx))),
      el('div', { class: 'view-section' }, [sectionHead('Hype filter', 'Updates flagged as hype — claims, not proven capability.'), hype.length ? grid(hype.map((u) => updateCard(u, ctx))) : emptyState('Nothing currently flagged as hype.')]),
    );
  }

  root.append(el('section', { class: 'view-section' }, [tabBar, body]));
}

export default { id: 'ai-intelligence', label: 'AI Intelligence', group: 'Intelligenz', render };
