// modules/sops/view.js — flagship module: searchable list, detail view, add
// form, bookmarks. The pattern other modules follow.

import { el, clear } from '../../core/dom.js';
import { SopArea } from '../../core/schema.js';
import { makeId } from '../../core/schema.js';
import {
  card, chip, saveBtn, sectionHead, grid, metaLine, bullets, subLabel, tagRow,
  genericList, field, input, textarea, select, btn,
} from '../../core/components.js';
import { sops } from './data.js';

let mode = 'list';     // list | detail | add
let detailId = null;

const go = (root, store, nextMode, id = null) => { mode = nextMode; detailId = id; render(root, store); };

function sopCard(s, root, store, ctx) {
  return card({ accent: 'brand', children: [
    el('div', { class: 'card__top' }, [
      el('div', { class: 'card__top-meta' }, [chip(s.area, 'brand'), el('span', { class: 'card__date', text: `aktualisiert ${s.updated || '—'}` })]),
      saveBtn(s.id, ctx.isSaved(s.id), ctx.onToggle),
    ]),
    el('button', { class: 'card__title card__title--link', type: 'button', text: s.title, onClick: () => go(root, store, 'detail', s.id) }),
    el('p', { class: 'card__summary', text: s.summary }),
    metaLine('Verantwortlich', s.owner),
    tagRow((s.tags || []).map((t) => `#${t}`)),
    el('div', { class: 'card__foot' }, [btn('Öffnen', { onClick: () => go(root, store, 'detail', s.id) })]),
  ] });
}

function renderDetail(root, store, ctx) {
  const s = store.getSlice('sops').find((x) => x.id === detailId);
  clear(root);
  if (!s) { go(root, store, 'list'); return; }
  root.append(el('section', { class: 'view-section view-section--narrow' }, [
    el('div', { class: 'detail-back' }, [btn('← Zurück', { onClick: () => go(root, store, 'list') })]),
    el('div', { class: 'card__top' }, [
      el('div', { class: 'card__top-meta' }, [chip(s.area, 'brand'), el('span', { class: 'card__date', text: `aktualisiert ${s.updated || '—'}` })]),
      saveBtn(s.id, ctx.isSaved(s.id), ctx.onToggle),
    ]),
    el('h2', { class: 'detail-title', text: s.title }),
    el('p', { class: 'card__summary', text: s.summary }),
    subLabel('Schritte'), bullets(s.steps),
    subLabel('Tools'), tagRow(s.tools),
    metaLine('Verantwortlich', s.owner),
    tagRow((s.tags || []).map((t) => `#${t}`)),
  ]));
}

function renderAdd(root, store) {
  clear(root);
  const fTitle = input({ placeholder: 'z. B. Angebots-Nachverfolgung', required: true });
  const fArea = select(Object.values(SopArea), SopArea.DELIVERY);
  const fSummary = textarea({ rows: 2, placeholder: 'Worum geht es in einem Satz?' });
  const fSteps = textarea({ rows: 5, placeholder: 'Ein Schritt pro Zeile' });
  const fTools = input({ placeholder: 'Tools, kommagetrennt' });
  const fOwner = input({ placeholder: 'z. B. Account management' });
  const fTags = input({ placeholder: 'Tags, kommagetrennt' });
  const note = el('p', { class: 'form-note', 'aria-live': 'polite' });

  const form = el('form', { class: 'form', novalidate: true }, [
    field('Titel *', fTitle),
    field('Bereich', fArea),
    field('Kurzbeschreibung', fSummary),
    field('Schritte', fSteps, 'Ein Schritt pro Zeile.'),
    field('Tools', fTools),
    field('Verantwortlich', fOwner),
    field('Tags', fTags),
    el('div', { class: 'form__actions' }, [btn('SOP speichern', { primary: true, type: 'submit' }), btn('Abbrechen', { onClick: () => go(root, store, 'list') })]),
    note,
  ]);

  form.addEventListener('submit', (ev) => {
    ev.preventDefault();
    if (!fTitle.value.trim()) { note.textContent = 'Bitte einen Titel eingeben.'; note.className = 'form-note form-note--error'; fTitle.focus(); return; }
    const splitLines = (v) => v.split('\n').map((t) => t.trim()).filter(Boolean);
    const splitCommas = (v) => v.split(',').map((t) => t.trim()).filter(Boolean);
    store.addItem('sops', {
      id: makeId('sop-', fTitle.value), title: fTitle.value.trim(), area: fArea.value,
      summary: fSummary.value.trim(), steps: splitLines(fSteps.value), tools: splitCommas(fTools.value),
      owner: fOwner.value.trim(), updated: new Date().toISOString().slice(0, 10), tags: splitCommas(fTags.value),
    });
    go(root, store, 'list');
  });

  root.append(el('section', { class: 'view-section view-section--narrow' }, [
    el('div', { class: 'detail-back' }, [btn('← Zurück', { onClick: () => go(root, store, 'list') })]),
    sectionHead('Neue SOP', 'Lege einen wiederholbaren Ablauf an.'), form,
  ]));
}

function render(root, store) {
  const ctx = { isSaved: store.isSaved, onToggle: store.toggleSaved };
  if (mode === 'detail') return renderDetail(root, store, ctx);
  if (mode === 'add') return renderAdd(root, store);
  clear(root);
  const items = store.getSlice('sops');
  root.append(genericList({
    moduleId: 'sops', title: 'SOPs', subtitle: `${items.length} Abläufe — durchsuchbar`,
    items, card: (s) => sopCard(s, root, store, ctx),
    searchFields: (s) => [s.title, s.area, s.summary, s.owner, ...(s.tags || [])],
    actions: [btn('+ Neue SOP', { primary: true, onClick: () => go(root, store, 'add') })],
    emptyMsg: 'Keine SOP gefunden.',
  }));
}

export default { id: 'sops', label: 'SOPs', group: 'Betrieb', render };
