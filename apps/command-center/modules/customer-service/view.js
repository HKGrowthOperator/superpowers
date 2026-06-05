// modules/customer-service/view.js — clients + reusable response templates.

import { el, clear } from '../../core/dom.js';
import { ClientStatus } from '../../core/schema.js';
import {
  card, chip, saveBtn, metaLine, tagRow, subLabel, genericList, btn,
} from '../../core/components.js';
import { clients, templates } from './data.js';

const TABS = [{ id: 'clients', label: 'Kunden' }, { id: 'templates', label: 'Vorlagen' }];
let activeTab = 'clients';

const statusTone = (s) =>
  s === ClientStatus.ACTIVE ? 'ok' : s === ClientStatus.LEAD ? 'brand' : s === ClientStatus.PAUSED ? 'warn' : 'danger';

function clientCard(c, ctx) {
  return card({ accent: statusTone(c.status), children: [
    el('div', { class: 'card__top' }, [
      el('div', { class: 'card__top-meta' }, [chip(c.status, statusTone(c.status))]),
      saveBtn(c.id, ctx.isSaved(c.id), ctx.onToggle),
    ]),
    el('h3', { class: 'card__title', text: c.name }),
    metaLine('Kontakt', c.contact),
    metaLine('Kunde seit', c.since),
    el('p', { class: 'card__summary', text: c.notes }),
    tagRow((c.tags || []).map((t) => `#${t}`)),
  ] });
}

function templateCard(t, ctx) {
  const pre = el('pre', { class: 'template-body', text: t.body });
  const copyBtn = btn('Kopieren', { onClick: async () => {
    try { await navigator.clipboard.writeText(t.body); copyBtn.textContent = 'Kopiert ✓'; setTimeout(() => { copyBtn.textContent = 'Kopieren'; }, 1500); }
    catch { copyBtn.textContent = 'Strg+C zum Kopieren'; }
  } });
  return card({ children: [
    el('div', { class: 'card__top' }, [
      el('div', { class: 'card__top-meta' }, [chip(t.channel, 'brand'), chip(t.category, 'neutral')]),
      saveBtn(t.id, ctx.isSaved(t.id), ctx.onToggle),
    ]),
    el('h3', { class: 'card__title', text: t.title }),
    subLabel('Vorlage'), pre,
    el('div', { class: 'card__foot' }, [copyBtn]),
  ] });
}

function render(root, store) {
  const ctx = { isSaved: store.isSaved, onToggle: store.toggleSaved };
  clear(root);

  const tabBar = el('div', { class: 'tabs' }, TABS.map((t) =>
    el('button', { class: `tab ${t.id === activeTab ? 'is-active' : ''}`.trim(), type: 'button', text: t.label, onClick: () => { activeTab = t.id; render(root, store); } })));

  const list = activeTab === 'clients'
    ? genericList({ moduleId: 'cs-clients', title: 'Kunden', subtitle: `${store.getSlice('clients').length} Kunden`, items: store.getSlice('clients'), card: (c) => clientCard(c, ctx), searchFields: (c) => [c.name, c.status, c.contact, c.notes, ...(c.tags || [])], emptyMsg: 'Keine Kunden gefunden.' })
    : genericList({ moduleId: 'cs-templates', title: 'Antwortvorlagen', subtitle: `${store.getSlice('templates').length} Vorlagen — {{Platzhalter}} vor dem Senden ersetzen`, items: store.getSlice('templates'), card: (t) => templateCard(t, ctx), searchFields: (t) => [t.title, t.channel, t.category, t.body], min: '360px', emptyMsg: 'Keine Vorlagen gefunden.' });

  root.append(el('section', { class: 'view-section' }, [tabBar, list]));
}

export default { id: 'customer-service', label: 'Kundenbedienung', group: 'Betrieb', render };
