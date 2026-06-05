// modules/settings/view.js — theme, the data bridge to the agent (export/import),
// and an about section.

import { el, clear } from '../../core/dom.js';
import { card, sectionHead, subLabel, btn } from '../../core/components.js';

function download(filename, text) {
  const blob = new Blob([text], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = el('a', { href: url, download: filename });
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function render(root, store) {
  clear(root);
  const state = store.getState();

  const themeCard = card({ children: [
    el('h3', { class: 'card__title', text: 'Darstellung' }),
    el('p', { class: 'card__summary', text: `Aktuelles Theme: ${state.ui.theme === 'dark' ? 'Dunkel' : 'Hell'}` }),
    el('div', { class: 'card__foot' }, [btn('Theme umschalten', { onClick: () => store.toggleTheme() })]),
  ] });

  const note = el('p', { class: 'form-note', 'aria-live': 'polite' });
  const fileInput = el('input', { type: 'file', accept: 'application/json,.json', class: 'input',
    onChange: async (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      try { store.importData(await file.text()); note.textContent = 'Import erfolgreich.'; note.className = 'form-note'; }
      catch (err) { note.textContent = `Import fehlgeschlagen: ${err.message}`; note.className = 'form-note form-note--error'; }
    } });

  const dataCard = card({ accent: 'brand', children: [
    el('h3', { class: 'card__title', text: 'Daten – Brücke zum Agenten' }),
    el('p', { class: 'card__summary', text: 'Deine eigenen Einträge & Lesezeichen liegen lokal in diesem Browser. Exportiere sie, um sie mir zu geben (damit ich sie fest ins Projekt einbaue) oder auf ein anderes Gerät zu übertragen.' }),
    el('div', { class: 'card__foot card__foot--start' }, [btn('Exportieren (JSON)', { primary: true, onClick: () => download(`command-center-${new Date().toISOString().slice(0, 10)}.json`, store.exportData()) })]),
    subLabel('Importieren'),
    fileInput,
    note,
  ] });

  const aboutCard = card({ children: [
    el('h3', { class: 'card__title', text: 'Über' }),
    el('p', { class: 'card__summary', text: 'Command Center — deine zentrale Schaltzentrale. Ein einziges System, viele Module. Zero-Dependency, Vanilla JS. Erweiterbar Modul für Modul.' }),
  ] });

  root.append(el('section', { class: 'view-section view-section--narrow' }, [
    sectionHead('Einstellungen', 'Darstellung, Daten und Infos.'),
    themeCard, dataCard, aboutCard,
  ]));
}

export default { id: 'settings', label: 'Einstellungen', group: 'System', render };
