/* HK Growth — privacy-light attribution + conversion signal.
   Loads NO third-party tracker by itself (DSGVO-friendly). It only:
   1. captures UTM / click-ids on first touch (sessionStorage),
   2. carries them across the ad → onboarding hop (link rewrite),
   3. exposes them so the lead email can be attributed to a campaign/angle,
   4. fires a conversion signal to dataLayer / gtag / fbq IF you've added them
      (with consent). No IDs are hardcoded here. See README + Datenschutz. */
(function () {
  'use strict';
  var KEY = 'hk_attr';
  var UTM = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'gclid', 'fbclid'];

  // Which landing angle is this page? (for A/B attribution)
  var ANGLE = {
    'ads.html': 'ads-diagnose',
    'ads-anfragen.html': 'ads-anfragen',
    'ads-premium.html': 'ads-premium',
    'onboarding.html': 'onboarding',
    'index.html': 'site', '': 'site'
  };

  function read() { try { return JSON.parse(sessionStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
  function write(o) { try { sessionStorage.setItem(KEY, JSON.stringify(o)); } catch (e) {} }

  function capture() {
    var stored = read();
    var params = new URLSearchParams(location.search);
    var fresh = false;
    UTM.forEach(function (k) {
      var v = params.get(k);
      if (v && !stored[k]) { stored[k] = v; fresh = true; } // first-touch wins
    });
    // first-touch landing + referrer (only set once)
    if (!stored.first_landing) {
      var file = location.pathname.split('/').pop();
      stored.first_landing = ANGLE[file] || file || 'site';
      stored.referrer = document.referrer ? document.referrer.split('?')[0] : '';
      fresh = true;
    }
    if (fresh) write(stored);
    return stored;
  }

  var attr = capture();
  window.hkAttribution = function () { return read(); };

  // Carry attribution across the ad → onboarding hop and onto the Cal.com link.
  function utmQuery() {
    var a = read(), parts = [];
    UTM.forEach(function (k) { if (a[k]) parts.push(k + '=' + encodeURIComponent(a[k])); });
    return parts.join('&');
  }
  var q = utmQuery();
  if (q) {
    document.querySelectorAll('a[href]').forEach(function (a) {
      var href = a.getAttribute('href');
      if (!href) return;
      var isInternalFunnel = /onboarding\.html/.test(href);
      var isCal = /cal\.com/.test(href) || a.hasAttribute('data-cal-link');
      if (isInternalFunnel || isCal) {
        a.setAttribute('href', href + (href.indexOf('?') >= 0 ? '&' : '?') + q);
      }
    });
  }

  // Conversion signal — no-ops unless you've loaded gtag/fbq/dataLayer (with consent).
  window.hkTrackConversion = function (payload) {
    var data = Object.assign({ event: 'lead_submit' }, read(), payload || {});
    try { (window.dataLayer = window.dataLayer || []).push(data); } catch (e) {}
    try { if (typeof window.gtag === 'function') window.gtag('event', 'generate_lead', data); } catch (e) {}
    try { if (typeof window.fbq === 'function') window.fbq('track', 'Lead', { content_name: data.first_landing }); } catch (e) {}
  };
})();
