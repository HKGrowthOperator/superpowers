// modules/overview/view.js — the home screen: a glance across every module
// plus quick links and a short "how this works" intro.

import { el, clear } from '../../core/dom.js';
import { ClientStatus, AutomationStatus } from '../../core/schema.js';
import { sectionHead, grid, kpi, card, btn } from '../../core/components.js';

const QUICK_LINKS = [
  { id: 'ai-intelligence', label: 'AI Intelligence', desc: 'KI-Updates als Business-Intelligence.' },
  { id: 'sops', label: 'SOPs', desc: 'Wiederholbare Abläufe & Playbooks.' },
  { id: 'customer-service', label: 'Kundenbedienung', desc: 'Kunden & Antwortvorlagen.' },
  { id: 'concepts', label: 'Konzepte', desc: 'Angebote & Strategien entwickeln.' },
  { id: 'automation', label: 'Automation', desc: 'Abläufe automatisieren.' },
  { id: 'websites', label: 'Webseiten', desc: 'Projekte & Status.' },
];

function avg(list, key) {
  if (!list.length) return 0;
  return Math.round(list.reduce((s, x) => s + (x[key] || 0), 0) / list.length);
}

function render(root, store) {
  clear(root);
  const d = store.getState().data;
  const activeClients = (d.clients || []).filter((c) => c.status === ClientStatus.ACTIVE).length;
  const liveAuto = (d.automations || []).filter((a) => a.status === AutomationStatus.LIVE).length;

  const kpis = grid([
    kpi('AI-Updates', (d.aiUpdates || []).length, `Ø Relevanz ${avg(d.aiUpdates || [], 'relevanceScore')}/100`),
    kpi('SOPs', (d.sops || []).length, 'Abläufe dokumentiert'),
    kpi('Aktive Kunden', activeClients, `${(d.clients || []).length} gesamt`),
    kpi('Konzepte', (d.concepts || []).length, 'in Entwicklung'),
    kpi('Automationen live', liveAuto, `${(d.automations || []).length} gesamt`),
    kpi('Gespeichert', store.getSaved().length, 'Lesezeichen'),
  ], '200px');

  const links = grid(QUICK_LINKS.map((l) => card({ children: [
    el('h3', { class: 'card__title', text: l.label }),
    el('p', { class: 'card__summary', text: l.desc }),
    el('div', { class: 'card__foot' }, [btn('Öffnen →', { primary: true, onClick: () => store.setActiveModule(l.id) })]),
  ] })), '240px');

  const intro = card({ accent: 'brand', children: [
    el('h3', { class: 'card__title', text: 'So funktioniert deine Schaltzentrale' }),
    el('p', { class: 'card__summary', text: 'Alles an einem Ort: Jede Unterseite links ist ein Modul. Du steuerst hier, deine Daten liegen im Projekt — ich (dein Agent) kann sie lesen, bauen und pflegen.' }),
    el('ul', { class: 'bullets' }, [
      el('li', { text: 'Karten mit dem Lesezeichen speichern → erscheinen unter „Gespeichert".' }),
      el('li', { text: 'Eigene Einträge (z. B. SOPs, Konzepte) anlegen → bleiben lokal erhalten.' }),
      el('li', { text: 'Unter „Einstellungen" exportieren und mir geben, damit ich sie fest einbaue.' }),
    ]),
  ] });

  root.append(
    el('section', { class: 'view-section' }, [sectionHead('Übersicht', 'Dein Business auf einen Blick.'), kpis]),
    el('section', { class: 'view-section' }, [sectionHead('Schnellzugriff', 'Direkt in ein Modul springen.'), links]),
    el('section', { class: 'view-section' }, [intro]),
  );
}

export default { id: 'overview', label: 'Übersicht', group: 'Start', render };
