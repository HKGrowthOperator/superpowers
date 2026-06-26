/* HK Growth — onboarding wizard. Vanilla, dependency-free.
   Choice steps auto-advance on commit (click / Enter), NOT on arrow-key nav,
   so keyboard users still browse options freely. Reduced-motion safe. */
(function () {
  'use strict';
  var wiz = document.getElementById('wiz');
  if (!wiz) return;

  var total = parseInt(wiz.getAttribute('data-total'), 10) || 5;
  var steps = Array.prototype.slice.call(wiz.querySelectorAll('.wizard__step'));
  var barFill = document.getElementById('barFill');
  var bar = wiz.querySelector('.wizard__bar');
  var stepNow = document.getElementById('stepNow');
  var recapList = document.getElementById('recapList');
  var success = document.getElementById('wizSuccess');
  var progressWrap = wiz.querySelector('.wizard__progress');
  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var current = 1;
  var answers = {}; // name -> { value, label }
  var QUESTION_LABEL = { focus: 'Schwerpunkt', status: 'Auftritt heute', goal: 'Ziel', timing: 'Start' };

  // Distinguish a real pointer commit from keyboard radio-nav (Chromium fires a
  // synthesized click on arrow-key radio navigation). Pointer → auto-advance;
  // keyboard → the explicit "Weiter" button advances (no surprise jumps).
  var pointerMode = false;
  document.addEventListener('pointerdown', function () { pointerMode = true; }, true);
  document.addEventListener('keydown', function (e) {
    if (['Tab', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', ' ', 'Spacebar'].indexOf(e.key) >= 0) pointerMode = false;
  }, true);

  function setProgress() {
    var pct = Math.round((current / total) * 100);
    if (barFill) barFill.style.width = pct + '%';
    if (bar) bar.setAttribute('aria-valuenow', String(pct));
    if (stepNow) stepNow.textContent = String(current);
  }

  function scrollToTop() {
    if (!progressWrap) return;
    var y = wiz.getBoundingClientRect().top + window.scrollY - 70;
    if (window.scrollY > y + 40 || window.scrollY < y - 40) {
      window.scrollTo({ top: Math.max(0, y), behavior: prefersReduced ? 'auto' : 'smooth' });
    }
  }

  function show(step) {
    current = Math.max(1, Math.min(total, step));
    steps.forEach(function (s) {
      s.classList.toggle('is-active', parseInt(s.getAttribute('data-step'), 10) === current);
    });
    setProgress();
    if (current === total) fillRecap();
    var active = steps[current - 1];
    // reflect any existing selection on this step's "Weiter" button
    var nb = active && active.querySelector('.wizard__next');
    if (nb) nb.disabled = !active.querySelector('input[type="radio"]:checked');
    // focus the heading for screen readers
    var h = active && active.querySelector('.wizard__q');
    if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
    scrollToTop();
  }

  function store(input) {
    answers[input.name] = { value: input.value, label: input.getAttribute('data-label') || input.value };
  }

  function fillRecap() {
    if (!recapList) return;
    recapList.innerHTML = '';
    ['focus', 'status', 'goal', 'timing'].forEach(function (k) {
      if (!answers[k]) return;
      var row = document.createElement('div'); row.className = 'recap-row';
      var dt = document.createElement('dt'); dt.textContent = QUESTION_LABEL[k];
      var dd = document.createElement('dd'); dd.textContent = answers[k].label;
      row.appendChild(dt); row.appendChild(dd); recapList.appendChild(row);
    });
  }

  // Choice grids: store on change (keyboard-safe), advance on commit (click/Enter).
  // A <label> wrapping its <input> fires click twice (label + synthesized input);
  // we only act on the input-targeted click and guard on the originating step so
  // one selection advances exactly one step. Arrow-key nav fires change, not click,
  // so keyboard users browse options without auto-advancing.
  wiz.querySelectorAll('.choice-grid').forEach(function (grid) {
    var step = grid.closest('.wizard__step');
    var nextBtn = step && step.querySelector('.wizard__next');
    grid.addEventListener('change', function (e) {
      if (e.target && e.target.matches('input[type="radio"]')) { store(e.target); if (nextBtn) nextBtn.disabled = false; }
    });
    grid.addEventListener('click', function (e) {
      if (!e.target || !e.target.matches || !e.target.matches('input[type="radio"]')) return;
      if (!pointerMode) return; // keyboard commit → use the Weiter button instead
      var input = e.target;
      var fromStep = current;
      window.setTimeout(function () {
        if (input.checked && current === fromStep) { store(input); show(current + 1); }
      }, prefersReduced ? 0 : 240);
    });
  });

  // Back + Weiter (Next) buttons
  wiz.querySelectorAll('.wizard__back').forEach(function (btn) {
    btn.addEventListener('click', function () { show(current - 1); });
  });
  wiz.querySelectorAll('.wizard__next').forEach(function (btn) {
    btn.addEventListener('click', function () { if (!btn.disabled) show(current + 1); });
  });

  // Submit
  var form = document.getElementById('onbForm');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.reportValidity()) return;
      var d = new FormData(form);
      var get = function (k) { return (d.get(k) || '').toString().trim(); };
      var name = get('name');

      var lines = ['— Wachstumsanalyse-Anfrage —', ''];
      ['focus', 'status', 'goal', 'timing'].forEach(function (k) {
        if (answers[k]) lines.push(QUESTION_LABEL[k] + ': ' + answers[k].label);
      });
      lines.push('');
      lines.push('Name: ' + name);
      if (get('email')) lines.push('E-Mail: ' + get('email'));
      if (get('company')) lines.push('Unternehmen/Website: ' + get('company'));
      if (get('phone')) lines.push('Telefon: ' + get('phone'));
      if (get('message')) lines.push('', 'Nachricht: ' + get('message'));

      var href = 'mailto:info@hkgrowth-operator.de'
        + '?subject=' + encodeURIComponent('Wachstumsanalyse-Anfrage von ' + (name || 'Website'))
        + '&body=' + encodeURIComponent(lines.join('\n'));

      // Success state
      steps.forEach(function (s) { s.classList.remove('is-active'); });
      if (progressWrap) progressWrap.style.display = 'none';
      if (barFill) barFill.style.width = '100%';
      var sn = document.getElementById('successName');
      if (sn && name) sn.textContent = ', ' + name.split(' ')[0];
      if (success) {
        success.classList.add('is-active');
        var h = success.querySelector('h2');
        if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
      }
      scrollToTop();
      window.location.href = href; // open prefilled email (no backend yet — see README)
    });
  }

  // init
  setProgress();
})();
