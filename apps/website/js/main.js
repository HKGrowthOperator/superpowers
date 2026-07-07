/* HK Growth — interaction layer. Vanilla, dependency-free.
   Motion follows Emil Kowalski's rules: GPU-only transforms, sub-300ms UI,
   reveal-once, reduced-motion respected, no hover-only behaviour. */
(function () {
  'use strict';

  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── Year ─────────────────────────────────────────────────────────────── */
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ── Mobile navigation ────────────────────────────────────────────────── */
  var body = document.body;
  var toggle = document.getElementById('navToggle');
  var panel = document.getElementById('navPanel');

  function setNav(open) {
    body.classList.toggle('nav-open', open);
    if (toggle) {
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Menü schließen' : 'Menü öffnen');
    }
  }
  if (toggle) {
    toggle.addEventListener('click', function () {
      setNav(!body.classList.contains('nav-open'));
    });
  }
  if (panel) {
    panel.addEventListener('click', function (e) {
      if (e.target.closest('a')) setNav(false);
    });
  }
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && body.classList.contains('nav-open')) setNav(false);
  });

  /* ── Header: scrolled + over-hero states ──────────────────────────────── */
  var header = document.getElementById('siteHeader');
  var hero = document.getElementById('hero');

  function updateHeader() {
    if (!header) return;
    var y = window.scrollY || window.pageYOffset;
    header.setAttribute('data-scrolled', String(y > 8));
    if (hero) {
      var threshold = hero.offsetHeight - header.offsetHeight - 8;
      header.setAttribute('data-over-hero', String(y < threshold));
    }
  }

  /* ── Scroll reveals (IntersectionObserver, once) ──────────────────────── */
  var reveals = document.querySelectorAll('.reveal');
  if (prefersReduced || !('IntersectionObserver' in window)) {
    reveals.forEach(function (el) { el.classList.add('is-visible'); });
  } else {
    var io = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -80px 0px' });
    reveals.forEach(function (el) { io.observe(el); });
  }

  /* ── System connector line: grows with scroll progress ────────────────── */
  var spine = document.getElementById('systemSpine');
  var lineFill = document.getElementById('systemLineFill');

  function updateSystemLine() {
    if (!spine || !lineFill) return;
    if (prefersReduced) { lineFill.style.transform = 'scaleY(1)'; return; }
    var rect = spine.getBoundingClientRect();
    var vh = window.innerHeight;
    // 0 when the spine top reaches mid-viewport, 1 when bottom passes mid-viewport
    var start = vh * 0.78;
    var end = vh * 0.32;
    var progress = (start - rect.top) / ((start - end) + rect.height);
    progress = Math.max(0, Math.min(1, progress));
    lineFill.style.transform = 'scaleY(' + progress.toFixed(3) + ')';
  }

  /* ── rAF-throttled scroll loop ────────────────────────────────────────── */
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(function () {
      updateHeader();
      updateSystemLine();
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', function () { updateHeader(); updateSystemLine(); }, { passive: true });
  updateHeader();
  updateSystemLine();

  /* ── Contact form: no-backend mailto fallback ─────────────────────────────
     Swap this for a real endpoint (Formspree / own API) when available —
     see README "Manual input". Until then we open a prefilled email so the
     inquiry is never lost. ----------------------------------------------- */
  var form = document.getElementById('contactForm');
  var note = document.getElementById('formNote');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.reportValidity()) return;
      var data = new FormData(form);
      var name = (data.get('name') || '').toString().trim();
      var email = (data.get('email') || '').toString().trim();
      var company = (data.get('company') || '').toString().trim();
      var message = (data.get('message') || '').toString().trim();

      var subject = 'Wachstumsanalyse-Anfrage von ' + (name || 'Website');
      var lines = [
        'Name: ' + name,
        'E-Mail: ' + email,
        'Unternehmen / Website: ' + company,
        '',
        message
      ];
      var href = 'mailto:info@hkgrowth-operator.de'
        + '?subject=' + encodeURIComponent(subject)
        + '&body=' + encodeURIComponent(lines.join('\n'));

      window.location.href = href;
      if (note) {
        note.textContent = 'Danke, ' + (name || 'gerne') + '. Dein E-Mail-Programm öffnet sich mit der vorbereiteten Anfrage — einmal senden und wir melden uns.';
      }
    });
  }
})();
