// views.js — every screen is a view registered in VIEWS and reached via the
// sidebar nav. A view renders into `root`, reading from the store and mutating
// only through store methods. Filterable views consume store.filters; the
// filter bar itself is rendered by main.js (see showFilters).

import { el, clear } from './dom.js';
import { filterUpdates, averageRelevance } from './filters.js';
import { Category, Company, RiskLevel, HypeLevel, RiskType } from './schema.js';
import {
  sectionHead, grid, kpi, chip,
  updateCard, experimentCard, opportunityCard, learningCard, riskCard, entityCard,
  loadingState, emptyState, errorState,
} from './components.js';

const makeCtx = (store) => ({ isSaved: store.isSaved, onToggle: store.toggleSaved });

/** Guard: show loading/error before a data view renders its body. */
function withData(root, store, renderBody) {
  const { status, error } = store.getState();
  if (status === 'loading' || status === 'idle') return mountInto(root, loadingState());
  if (status === 'error') return mountInto(root, errorState(error, () => store.load()));
  return renderBody();
}

function mountInto(root, ...nodes) {
  clear(root);
  root.append(...nodes.filter(Boolean));
}

// ── Dashboard ───────────────────────────────────────────────────────────────
function renderDashboard(root, store) {
  withData(root, store, () => {
    const s = store.getState();
    const highRisk = s.updates.filter((u) => u.riskLevel === RiskLevel.HIGH).length;
    const hype = s.updates.filter((u) => u.hypeLevel === HypeLevel.HYPE).length;
    const validated = s.experiments.filter((e) => e.status === 'validated').length;
    const ctx = makeCtx(store);

    const kpis = grid([
      kpi('Updates tracked', s.updates.length, 'from all sources'),
      kpi('Avg. relevance', averageRelevance(s.updates), 'business fit (0–100)'),
      kpi('High-risk items', highRisk, 'need a mitigation'),
      kpi('Hype-flagged', hype, 'not proven yet'),
      kpi('Experiments validated', validated, `${s.experiments.length} total`),
      kpi('Saved', s.saved.size, 'bookmarked'),
    ], '200px');

    const topUpdates = [...s.updates]
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 3);

    const thisWeek = s.experiments.find((e) => e.status === 'running') ?? s.experiments[0];
    const topOpp = s.opportunities[0];

    mountInto(root,
      el('section', { class: 'view-section' }, [
        sectionHead('Command center', 'AI noise → business intelligence, at a glance.'),
        kpis,
      ]),
      el('section', { class: 'view-section' }, [
        sectionHead('Highest-relevance updates', 'What deserves attention first.'),
        grid(topUpdates.map((u) => updateCard(u, ctx))),
      ]),
      el('section', { class: 'view-section' }, [
        sectionHead('In focus', 'This week’s test and the top opportunity.'),
        grid([
          thisWeek && experimentCard(thisWeek, ctx),
          topOpp && opportunityCard(topOpp, ctx),
        ].filter(Boolean)),
      ]),
    );
  });
}

// ── Updates (filterable) ─────────────────────────────────────────────────────
function renderUpdates(root, store) {
  withData(root, store, () => {
    const s = store.getState();
    const ctx = makeCtx(store);
    const visible = filterUpdates(s.updates, s.filters, store.isSaved);

    mountInto(root,
      el('section', { class: 'view-section' }, [
        sectionHead('AI updates', `${visible.length} of ${s.updates.length} shown`),
        visible.length
          ? grid(visible.map((u) => updateCard(u, ctx)))
          : emptyState('No updates match these filters.'),
      ]),
    );
  });
}

// ── Experiments ───────────────────────────────────────────────────────────────
function renderExperiments(root, store) {
  const s = store.getState();
  const ctx = makeCtx(store);
  mountInto(root,
    el('section', { class: 'view-section' }, [
      sectionHead('Weekly experiments', 'Small, time-boxed tests with a clear validation.'),
      s.experiments.length
        ? grid(s.experiments.map((e) => experimentCard(e, ctx)))
        : emptyState('No experiments yet.'),
    ]),
  );
}

// ── Opportunities ─────────────────────────────────────────────────────────────
function renderOpportunities(root, store) {
  const s = store.getState();
  const ctx = makeCtx(store);
  mountInto(root,
    el('section', { class: 'view-section' }, [
      sectionHead('Business opportunities', 'Sellable offers, with value, tools and validation.'),
      s.opportunities.length
        ? grid(s.opportunities.map((o) => opportunityCard(o, ctx)))
        : emptyState('No opportunities yet.'),
    ]),
  );
}

// ── Learning ──────────────────────────────────────────────────────────────────
function renderLearning(root, store) {
  const s = store.getState();
  const ctx = makeCtx(store);
  mountInto(root,
    el('section', { class: 'view-section' }, [
      sectionHead('Learning', 'Plain-language concepts your team can act on.'),
      s.learning.length
        ? grid(s.learning.map((l) => learningCard(l, ctx)), '300px')
        : emptyState('No concepts yet.'),
    ]),
  );
}

// ── Risks & hype ──────────────────────────────────────────────────────────────
function renderRisks(root, store) {
  const s = store.getState();
  const ctx = makeCtx(store);
  const hypeUpdates = s.updates.filter((u) => u.hypeLevel === HypeLevel.HYPE);

  mountInto(root,
    el('section', { class: 'view-section' }, [
      sectionHead('Risk register', 'Known risks and how we mitigate them.'),
      s.risks.length
        ? grid(s.risks.map((r) => riskCard(r, ctx)))
        : emptyState('No risks logged.'),
    ]),
    el('section', { class: 'view-section' }, [
      sectionHead('Hype filter', 'Updates flagged as hype — claims, not proven capability.'),
      hypeUpdates.length
        ? grid(hypeUpdates.map((u) => updateCard(u, ctx)))
        : emptyState('Nothing currently flagged as hype.'),
    ]),
  );
}

// ── Saved ─────────────────────────────────────────────────────────────────────
function renderSaved(root, store) {
  const ctx = makeCtx(store);
  const saved = store.getSaved();
  mountInto(root,
    el('section', { class: 'view-section' }, [
      sectionHead('Saved', 'Everything you bookmarked, across all sections.'),
      saved.length
        ? grid(saved.map(({ type, item }) => entityCard(type, item, ctx)))
        : emptyState('No saved items yet. Tap the bookmark on any card.'),
    ]),
  );
}

// ── Add update (form) ─────────────────────────────────────────────────────────
function selectField(name, label, options, value = options[0]) {
  const select = el('select', { class: 'input', name, id: `f-${name}` },
    options.map((opt) => el('option', { value: opt, text: opt, selected: opt === value })));
  return field(label, select);
}

function field(label, control) {
  return el('label', { class: 'field' }, [
    el('span', { class: 'field__label', text: label }),
    control,
  ]);
}

function renderAdd(root, store) {
  const note = el('p', { class: 'form-note', 'aria-live': 'polite' });

  const title = el('input', { class: 'input', name: 'title', id: 'f-title', required: true, placeholder: 'e.g. New agent mode for office tasks' });
  const summary = el('textarea', { class: 'input', name: 'summary', id: 'f-summary', rows: 2, placeholder: 'What happened, in plain language.' });
  const relevance = el('input', { class: 'input', name: 'relevanceScore', id: 'f-relevanceScore', type: 'number', min: 0, max: 100, value: 60 });
  const impact = el('textarea', { class: 'input', name: 'businessImpact', id: 'f-businessImpact', rows: 2, placeholder: 'What it changes for the business.' });
  const relevanceText = el('textarea', { class: 'input', name: 'businessRelevance', id: 'f-businessRelevance', rows: 2, placeholder: 'Why it matters to us specifically.' });
  const action = el('textarea', { class: 'input', name: 'recommendedAction', id: 'f-recommendedAction', rows: 2, placeholder: 'The concrete "so what / do this".' });
  const tags = el('input', { class: 'input', name: 'tags', id: 'f-tags', placeholder: 'comma, separated, tags' });

  const company = selectField('company', 'Company', Object.values(Company), Company.OTHER);
  const category = selectField('category', 'Category', Object.values(Category), Category.PRODUCT);
  const riskLevel = selectField('riskLevel', 'Risk level', Object.values(RiskLevel), RiskLevel.LOW);
  const hypeLevel = selectField('hypeLevel', 'Hype level', Object.values(HypeLevel), HypeLevel.MIXED);

  const form = el('form', { class: 'form', novalidate: true }, [
    field('Title *', title),
    field('Summary', summary),
    grid([company, category, riskLevel, hypeLevel], '180px'),
    field('Relevance score (0–100)', relevance),
    field('Business impact', impact),
    field('Why it matters to us', relevanceText),
    field('Recommended action', action),
    field('Tags', tags),
    el('div', { class: 'form__actions' }, [
      el('button', { class: 'btn btn--primary', type: 'submit', text: 'Add update' }),
    ]),
    note,
  ]);

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!title.value.trim()) {
      note.textContent = 'Please enter a title.';
      note.className = 'form-note form-note--error';
      title.focus();
      return;
    }
    store.addUpdate({
      title: title.value,
      summary: summary.value,
      company: company.querySelector('select').value,
      category: category.querySelector('select').value,
      relevanceScore: Number(relevance.value),
      businessImpact: impact.value,
      businessRelevance: relevanceText.value,
      recommendedAction: action.value,
      riskLevel: riskLevel.querySelector('select').value,
      hypeLevel: hypeLevel.querySelector('select').value,
      tags: tags.value.split(',').map((t) => t.trim()).filter(Boolean),
      date: new Date().toISOString().slice(0, 10),
    });
    store.setView('updates');
  });

  mountInto(root,
    el('section', { class: 'view-section view-section--narrow' }, [
      sectionHead('Add an update', 'Manually log an AI update with its business-intelligence layer.'),
      form,
    ]),
  );
}

// ── registry ──────────────────────────────────────────────────────────────────
/** Each view: { id, label, render(root, store) }. */
export const VIEWS = [
  { id: 'dashboard', label: 'Dashboard', render: renderDashboard },
  { id: 'updates', label: 'Updates', render: renderUpdates },
  { id: 'experiments', label: 'Experiments', render: renderExperiments },
  { id: 'opportunities', label: 'Opportunities', render: renderOpportunities },
  { id: 'learning', label: 'Learning', render: renderLearning },
  { id: 'risks', label: 'Risks & hype', render: renderRisks },
  { id: 'saved', label: 'Saved', render: renderSaved },
  { id: 'add', label: 'Add update', render: renderAdd },
];

export const getView = (id) => VIEWS.find((v) => v.id === id) ?? VIEWS[0];

// Re-export for main.js filter bar construction.
export const FILTER_ENUMS = { Category, Company, RiskLevel, HypeLevel, RiskType };
