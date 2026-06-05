// modules/websites/view.js — client websites and their build status.

import { el, clear } from '../../core/dom.js';
import { WebsiteStatus } from '../../core/schema.js';
import { card, chip, saveBtn, metaLine, genericList } from '../../core/components.js';
import { websites } from './data.js';

const statusTone = (s) => (s === WebsiteStatus.LIVE ? 'ok' : s === WebsiteStatus.BUILDING ? 'warn' : s === WebsiteStatus.MAINTENANCE ? 'brand' : 'neutral');

function websiteCard(w, ctx) {
  return card({ accent: statusTone(w.status), children: [
    el('div', { class: 'card__top' }, [
      el('div', { class: 'card__top-meta' }, [chip(w.status, statusTone(w.status))]),
      saveBtn(w.id, ctx.isSaved(w.id), ctx.onToggle),
    ]),
    el('h3', { class: 'card__title', text: w.name }),
    metaLine('Kunde', w.client),
    metaLine('Technik', w.stack),
    w.url ? el('a', { class: 'card__link', href: w.url, target: '_blank', rel: 'noopener noreferrer', text: w.url }) : null,
    el('p', { class: 'card__summary', text: w.notes }),
  ] });
}

function render(root, store) {
  const ctx = { isSaved: store.isSaved, onToggle: store.toggleSaved };
  clear(root);
  const items = store.getSlice('websites');
  root.append(genericList({
    moduleId: 'websites', title: 'Webseiten', subtitle: `${items.length} Projekte`,
    items, card: (w) => websiteCard(w, ctx),
    searchFields: (w) => [w.name, w.client, w.status, w.stack, w.notes],
    emptyMsg: 'Keine Webseite gefunden.',
  }));
}

export default { id: 'websites', label: 'Webseiten', group: 'Wachstum', render };
