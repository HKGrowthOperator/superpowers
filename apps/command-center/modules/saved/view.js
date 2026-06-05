// modules/saved/view.js — every bookmarked item across all modules.

import { el, clear } from '../../core/dom.js';
import { card, chip, saveBtn, sectionHead, grid, emptyState } from '../../core/components.js';

const SLICE_LABEL = {
  aiUpdates: 'AI Update', experiments: 'Experiment', opportunities: 'Opportunity',
  learning: 'Learning', risks: 'Risk', sops: 'SOP', clients: 'Kunde',
  templates: 'Vorlage', concepts: 'Konzept', automations: 'Automation', websites: 'Webseite',
};

const titleOf = (item) => item.title || item.name || item.term || item.id;
const descOf = (item) => item.summary || item.definition || item.notes || item.description || item.value || '';

function savedCard(slice, item, ctx) {
  return card({ children: [
    el('div', { class: 'card__top' }, [
      el('div', { class: 'card__top-meta' }, [chip(SLICE_LABEL[slice] || slice, 'brand')]),
      saveBtn(item.id, true, ctx.onToggle),
    ]),
    el('h3', { class: 'card__title', text: titleOf(item) }),
    descOf(item) && el('p', { class: 'card__summary', text: descOf(item) }),
  ] });
}

function render(root, store) {
  const ctx = { onToggle: store.toggleSaved };
  clear(root);
  const saved = store.getSaved();
  root.append(el('section', { class: 'view-section' }, [
    sectionHead('Gespeichert', 'Alle Lesezeichen aus allen Bereichen.'),
    saved.length
      ? grid(saved.map(({ slice, item }) => savedCard(slice, item, ctx)))
      : emptyState('Noch nichts gespeichert. Tippe das Lesezeichen auf einer Karte.'),
  ]));
}

export default { id: 'saved', label: 'Gespeichert', group: 'Start', render };
