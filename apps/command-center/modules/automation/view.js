// modules/automation/view.js — automations from idea to live.

import { el, clear } from '../../core/dom.js';
import { AutomationStatus } from '../../core/schema.js';
import { card, chip, saveBtn, metaLine, subLabel, tagRow, genericList } from '../../core/components.js';
import { automations } from './data.js';

const statusTone = (s) => (s === AutomationStatus.LIVE ? 'ok' : s === AutomationStatus.BUILDING ? 'warn' : s === AutomationStatus.PAUSED ? 'danger' : 'neutral');

function automationCard(a, ctx) {
  return card({ accent: statusTone(a.status), children: [
    el('div', { class: 'card__top' }, [
      el('div', { class: 'card__top-meta' }, [chip(a.status, statusTone(a.status))]),
      saveBtn(a.id, ctx.isSaved(a.id), ctx.onToggle),
    ]),
    el('h3', { class: 'card__title', text: a.title }),
    metaLine('Auslöser', a.trigger),
    metaLine('Aktion', a.action),
    subLabel('Tools'), tagRow(a.tools),
    metaLine('Nutzen', a.value),
  ] });
}

function render(root, store) {
  const ctx = { isSaved: store.isSaved, onToggle: store.toggleSaved };
  clear(root);
  const items = store.getSlice('automations');
  root.append(genericList({
    moduleId: 'automation', title: 'Automation', subtitle: `${items.length} Automatisierungen — Auslöser → Aktion`,
    items, card: (a) => automationCard(a, ctx),
    searchFields: (a) => [a.title, a.status, a.trigger, a.action, a.value],
    emptyMsg: 'Keine Automatisierung gefunden.',
  }));
}

export default { id: 'automation', label: 'Automation', group: 'Betrieb', render };
