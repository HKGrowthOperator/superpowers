/**
 * Smart Inbox Widget — mountbares Dashboard fuer jede Web-App.
 *
 * Einbindung (ESM):
 *   <link rel="stylesheet" href="smart-inbox/client/smart-inbox.css">
 *   <div id="inbox"></div>
 *   <script type="module">
 *     import { SmartInbox } from './smart-inbox/client/smart-inbox.js';
 *     SmartInbox.mount('#inbox', { apiBase: '/api/inbox' });
 *   </script>
 *
 * Alle CSS-Klassen sind mit "si-" geprefixt und unter .si-root gescoped,
 * damit nichts mit den Styles der Host-App kollidiert.
 */

const KATEGORIEN = ['Alle', 'Vertrieb', 'Recruiting', 'Buchhaltung', 'Kundenbetreuung', 'Lieferanten', 'Termin', 'Sonstiges'];
const STATUS = ['Neu', 'In Bearbeitung', 'Wartet auf Antwort', 'Erledigt'];
const KANAL_ICON = { 'E-Mail': '✉️', WhatsApp: '💬', Instagram: '📸', Kontaktformular: '📝' };

export const SmartInbox = {
  /**
   * @param {string|HTMLElement} target  Selektor oder Element, in das gerendert wird
   * @param {object} [options]
   * @param {string}  [options.apiBase='/api/inbox']  Basis-URL der Inbox-API
   * @param {string}  [options.title='Smart Inbox']   Ueberschrift
   * @param {number}  [options.pollInterval=15000]    Auto-Refresh in ms (0 = aus)
   * @param {boolean} [options.simulator=true]        "Anfrage simulieren"-Button anzeigen
   * @returns {{refresh: () => Promise<void>, destroy: () => void}}
   */
  mount(target, options = {}) {
    const el = typeof target === 'string' ? document.querySelector(target) : target;
    if (!el) throw new Error(`SmartInbox: Element "${target}" nicht gefunden`);
    return createInstance(el, {
      apiBase: options.apiBase ?? '/api/inbox',
      title: options.title ?? 'Smart Inbox',
      pollInterval: options.pollInterval ?? 15_000,
      simulator: options.simulator ?? true,
    });
  },
};

// Auch als Global verfuegbar, falls ohne Module-Import eingebunden
if (typeof window !== 'undefined') window.SmartInbox = SmartInbox;

function createInstance(root, opts) {
  const state = { messages: [], tasks: [], stats: null, filter: 'Alle', selectedId: null };

  root.classList.add('si-root');
  root.innerHTML = `
    <div class="si-head">
      <div>
        <h2 class="si-title"></h2>
        <p class="si-subtitle">AI Communication System · alle Anfragen an einem Ort</p>
      </div>
      ${opts.simulator ? '<button class="si-btn si-btn-primary" data-si="simulate">+ Anfrage simulieren</button>' : ''}
    </div>
    <div class="si-stats" data-si="stats"></div>
    <div class="si-layout">
      <section class="si-panel">
        <div class="si-panel-head">
          <h3>Eingehende Anfragen</h3>
          <div class="si-filters" data-si="filters"></div>
        </div>
        <ul class="si-list" data-si="messages"></ul>
      </section>
      <div class="si-side">
        <section class="si-panel">
          <div class="si-panel-head"><h3>Details</h3></div>
          <div class="si-detail-empty" data-si="detail">Anfrage auswählen…</div>
        </section>
        <section class="si-panel">
          <div class="si-panel-head"><h3>Aufgaben</h3></div>
          <ul class="si-list" data-si="tasks"></ul>
        </section>
      </div>
    </div>
    <dialog class="si-dialog" data-si="dialog">
      <form method="dialog" data-si="form">
        <h3>Neue Anfrage simulieren</h3>
        <p class="si-hint">Im Live-Betrieb posten E-Mail, WhatsApp &amp; Co. automatisch an <code>POST ${esc(opts.apiBase)}/messages</code>.</p>
        <label>Kanal
          <select name="channel"><option>E-Mail</option><option>WhatsApp</option><option>Instagram</option><option>Kontaktformular</option></select>
        </label>
        <label>Absender <input name="from" required placeholder="kunde@firma.de" /></label>
        <label>Betreff <input name="subject" placeholder="Anfrage…" /></label>
        <label>Nachricht <textarea name="body" rows="5" required placeholder="Guten Tag, wir hätten gerne ein Angebot für…"></textarea></label>
        <div class="si-dialog-actions">
          <button type="button" class="si-btn" data-si="cancel">Abbrechen</button>
          <button type="submit" class="si-btn si-btn-primary">Senden</button>
        </div>
      </form>
    </dialog>`;

  root.querySelector('.si-title').textContent = opts.title;
  const $ = (name) => root.querySelector(`[data-si="${name}"]`);

  async function api(path, init) {
    const res = await fetch(opts.apiBase + path, init);
    if (!res.ok) throw new Error((await res.json()).error ?? res.statusText);
    return res.json();
  }

  async function refresh() {
    const [messages, tasks, stats] = await Promise.all([
      api('/messages'),
      api('/tasks'),
      api('/stats'),
    ]);
    state.messages = messages;
    state.tasks = tasks;
    state.stats = stats;
    render();
  }

  function render() {
    renderStats();
    renderFilters();
    renderMessages();
    renderDetail();
    renderTasks();
  }

  function renderStats() {
    const s = state.stats;
    const card = (value, label) =>
      `<div class="si-stat"><div class="si-stat-value">${value}</div><div class="si-stat-label">${label}</div></div>`;
    $('stats').innerHTML = [
      card(s.neu, 'Neue Anfragen'),
      card(s.inBearbeitung, 'In Bearbeitung'),
      card(s.heuteEingegangen, 'Heute eingegangen'),
      card(s.offeneAufgaben, 'Offene Aufgaben'),
      card(s.proPrioritaet?.Hoch ?? 0, 'Priorität Hoch'),
      card(s.gesamt, 'Gesamt'),
    ].join('');
  }

  function renderFilters() {
    $('filters').innerHTML = KATEGORIEN.map((k) => {
      const n = k === 'Alle' ? state.messages.length : (state.stats.proKategorie[k] ?? 0);
      return `<button class="si-chip ${state.filter === k ? 'si-active' : ''}" data-kat="${k}">${k} (${n})</button>`;
    }).join('');
    $('filters').querySelectorAll('.si-chip').forEach((c) =>
      c.addEventListener('click', () => { state.filter = c.dataset.kat; render(); }));
  }

  function renderMessages() {
    const list = state.messages.filter((m) => state.filter === 'Alle' || m.kategorie === state.filter);
    $('messages').innerHTML = list.map((m) => `
      <li class="si-message ${m.id === state.selectedId ? 'si-selected' : ''} ${m.status === 'Erledigt' ? 'si-done' : ''}" data-id="${m.id}">
        <span class="si-dot si-prio-${m.prioritaet}" title="Priorität: ${m.prioritaet}"></span>
        <div>
          <div class="si-from">${KANAL_ICON[m.channel] ?? '📥'} ${esc(m.from)} ${m.subject ? '· ' + esc(m.subject) : ''}</div>
          <div class="si-summary">${esc(m.zusammenfassung)}</div>
        </div>
        <div class="si-meta">
          <span class="si-badge si-kat-${m.kategorie}">${m.kategorie}</span>
          <span>${m.status}</span>
          <span>${zeit(m.eingang)}</span>
        </div>
      </li>`).join('') || '<li class="si-detail-empty">Keine Anfragen in dieser Kategorie.</li>';
    $('messages').querySelectorAll('.si-message').forEach((li) =>
      li.addEventListener('click', () => { state.selectedId = Number(li.dataset.id); render(); }));
  }

  function renderDetail() {
    const el = $('detail');
    const m = state.messages.find((x) => x.id === state.selectedId);
    if (!m) { el.className = 'si-detail-empty'; el.textContent = 'Anfrage auswählen…'; return; }
    el.className = 'si-detail';
    el.innerHTML = `
      <div class="si-row">
        <span class="si-badge si-kat-${m.kategorie}">${m.kategorie}</span>
        <span class="si-badge">Priorität: ${m.prioritaet}</span>
        <span class="si-badge">${m.channel}</span>
        <span class="si-badge">Zuständig: ${esc(m.zustaendig)}</span>
      </div>
      <h4>${esc(m.subject || '(kein Betreff)')}</h4>
      <div><strong>Von:</strong> ${esc(m.from)} · ${new Date(m.eingang).toLocaleString('de-DE')}</div>
      <div class="si-ai-box">
        <strong>${m.quelle === 'ai' ? '🤖 AI-Zusammenfassung' : '⚙️ Zusammenfassung'}</strong><br>
        ${esc(m.zusammenfassung)}
        ${m.naechsterSchritt ? `<br><strong>Nächster Schritt:</strong> ${esc(m.naechsterSchritt)}` : ''}
      </div>
      <div class="si-body-text">${esc(m.body)}</div>
      <div class="si-row">
        <label>Status
          <select data-si="d-status">${STATUS.map((s) => `<option ${s === m.status ? 'selected' : ''}>${s}</option>`).join('')}</select>
        </label>
        <label>Kategorie
          <select data-si="d-kategorie">${KATEGORIEN.slice(1).map((k) => `<option ${k === m.kategorie ? 'selected' : ''}>${k}</option>`).join('')}</select>
        </label>
      </div>`;
    $('d-status').addEventListener('change', (e) => update(m.id, { status: e.target.value }));
    $('d-kategorie').addEventListener('change', (e) => update(m.id, { kategorie: e.target.value }));
  }

  function renderTasks() {
    const offen = state.tasks.filter((t) => t.status === 'offen');
    const erledigt = state.tasks.filter((t) => t.status === 'erledigt').slice(0, 5);
    $('tasks').innerHTML = [...offen, ...erledigt].map((t) => `
      <li class="si-task ${t.status === 'erledigt' ? 'si-done' : ''}">
        <input type="checkbox" data-id="${t.id}" ${t.status === 'erledigt' ? 'checked' : ''} />
        <div>
          <div class="si-task-titel">${esc(t.titel)}</div>
          <div class="si-task-sub">${esc(t.beschreibung)} · 👤 ${esc(t.verantwortlich)}</div>
        </div>
      </li>`).join('') || '<li class="si-detail-empty">Keine Aufgaben.</li>';
    $('tasks').querySelectorAll('input').forEach((cb) =>
      cb.addEventListener('change', async () => {
        await api(`/tasks/${cb.dataset.id}`, {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ status: cb.checked ? 'erledigt' : 'offen' }),
        });
        refresh();
      }));
  }

  async function update(id, patch) {
    await api(`/messages/${id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(patch),
    });
    refresh();
  }

  if (opts.simulator) {
    $('simulate').addEventListener('click', () => $('dialog').showModal());
    $('cancel').addEventListener('click', () => $('dialog').close());
    $('form').addEventListener('submit', async (e) => {
      const data = Object.fromEntries(new FormData(e.target));
      await api('/messages', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(data),
      });
      e.target.reset();
      refresh();
    });
  }

  refresh();
  const timer = opts.pollInterval > 0 ? setInterval(refresh, opts.pollInterval) : null;

  return {
    refresh,
    destroy() {
      if (timer) clearInterval(timer);
      root.classList.remove('si-root');
      root.innerHTML = '';
    },
  };
}

function zeit(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3600_000);
  if (h < 1) return `vor ${Math.max(1, Math.floor(diff / 60_000))} Min`;
  if (h < 24) return `vor ${h} Std`;
  return `vor ${Math.floor(h / 24)} Tg`;
}

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
