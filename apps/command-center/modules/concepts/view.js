// modules/concepts/view.js — offers, strategies and campaigns in development.

import { el, clear } from '../../core/dom.js';
import { ConceptType, ConceptStatus, makeId } from '../../core/schema.js';
import {
  card, chip, saveBtn, metaLine, bullets, subLabel, genericList,
  field, input, textarea, select, btn,
} from '../../core/components.js';
import { concepts } from './data.js';

let mode = 'list';
const go = (root, store, m) => { mode = m; render(root, store); };

const statusTone = (s) => (s === ConceptStatus.LIVE ? 'ok' : s === ConceptStatus.READY ? 'brand' : s === ConceptStatus.DRAFT ? 'warn' : 'neutral');

function conceptCard(c, ctx) {
  return card({ accent: 'brand', children: [
    el('div', { class: 'card__top' }, [
      el('div', { class: 'card__top-meta' }, [chip(c.type, 'neutral'), chip(c.status, statusTone(c.status))]),
      saveBtn(c.id, ctx.isSaved(c.id), ctx.onToggle),
    ]),
    el('h3', { class: 'card__title', text: c.title }),
    el('p', { class: 'card__summary', text: c.summary }),
    metaLine('Wert', c.value),
    subLabel('Schritte'), bullets(c.steps),
  ] });
}

function renderAdd(root, store) {
  clear(root);
  const fTitle = input({ placeholder: 'z. B. Premium-Onboarding-Paket', required: true });
  const fType = select(Object.values(ConceptType), ConceptType.OFFER);
  const fStatus = select(Object.values(ConceptStatus), ConceptStatus.IDEA);
  const fSummary = textarea({ rows: 2, placeholder: 'Worum geht es?' });
  const fValue = input({ placeholder: 'Welchen Wert / Nutzen bringt es?' });
  const fSteps = textarea({ rows: 4, placeholder: 'Ein Schritt pro Zeile' });
  const note = el('p', { class: 'form-note', 'aria-live': 'polite' });

  const form = el('form', { class: 'form', novalidate: true }, [
    field('Titel *', fTitle), field('Art', fType), field('Status', fStatus),
    field('Kurzbeschreibung', fSummary), field('Wert', fValue), field('Schritte', fSteps, 'Ein Schritt pro Zeile.'),
    el('div', { class: 'form__actions' }, [btn('Konzept speichern', { primary: true, type: 'submit' }), btn('Abbrechen', { onClick: () => go(root, store, 'list') })]),
    note,
  ]);
  form.addEventListener('submit', (ev) => {
    ev.preventDefault();
    if (!fTitle.value.trim()) { note.textContent = 'Bitte einen Titel eingeben.'; note.className = 'form-note form-note--error'; fTitle.focus(); return; }
    store.addItem('concepts', {
      id: makeId('con-', fTitle.value), title: fTitle.value.trim(), type: fType.value, status: fStatus.value,
      summary: fSummary.value.trim(), value: fValue.value.trim(),
      steps: fSteps.value.split('\n').map((t) => t.trim()).filter(Boolean),
    });
    go(root, store, 'list');
  });

  root.append(el('section', { class: 'view-section view-section--narrow' }, [
    el('div', { class: 'detail-back' }, [btn('← Zurück', { onClick: () => go(root, store, 'list') })]),
    el('h2', { class: 'detail-title', text: 'Neues Konzept' }), form,
  ]));
}

function render(root, store) {
  const ctx = { isSaved: store.isSaved, onToggle: store.toggleSaved };
  if (mode === 'add') return renderAdd(root, store);
  clear(root);
  const items = store.getSlice('concepts');
  root.append(genericList({
    moduleId: 'concepts', title: 'Konzepte', subtitle: `${items.length} Ideen & Angebote`,
    items, card: (c) => conceptCard(c, ctx),
    searchFields: (c) => [c.title, c.type, c.status, c.summary, c.value],
    actions: [btn('+ Neues Konzept', { primary: true, onClick: () => go(root, store, 'add') })],
    emptyMsg: 'Kein Konzept gefunden.',
  }));
}

export default { id: 'concepts', label: 'Konzepte', group: 'Wachstum', render };
