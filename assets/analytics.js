/* Analytics: Google Analytics 4, Amplitude, Microsoft Clarity and Hotjar (Contentsquare) after consent, plus custom events.
   ?notrack=1 turns tracking off on this browser (for the owner), ?notrack=0 turns it back on. */
(function () {
  var GA_ID = 'G-5RKHK6YKF4';
  var KEY = 'iv-consent';
  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
    del: function (k) { try { localStorage.removeItem(k); } catch (e) {} }
  };

  var q = new URLSearchParams(location.search);
  if (q.get('notrack') === '1') store.set('iv-notrack', '1');
  if (q.get('notrack') === '0') store.del('iv-notrack');
  var owner = store.get('iv-notrack') === '1';

  var CLARITY_ID = 'z7gt6y40uo';
  var CSQ_TAG = '5e5fe235cd846'; // Hotjar / Contentsquare
  var AMP_KEY = '608c2bab8507cff452c9b36a858b3789';
  var AMP_SRC = 'https://cdn.jsdelivr.net/npm/@amplitude/analytics-browser@2.48.1/lib/scripts/amplitude-min.js';

  var queue = [];
  var ready = false;
  var ampQueue = [];
  function ampSend(name, params) {
    if (window.amplitude && window.amplitude.track) window.amplitude.track(name, params);
    else ampQueue.push([name, params]);
  }
  window.track = function (name, params) {
    if (owner) return;
    params = params || {};
    if (ready) { window.gtag('event', name, params); ampSend(name, params); }
    else queue.push([name, params]);
  };

  function startGA() {
    if (ready || owner) return;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', GA_ID, { anonymize_ip: true });
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(s);

    var a = document.createElement('script');
    a.async = true;
    a.src = AMP_SRC;
    a.onload = function () {
      if (!window.amplitude) return;
      window.amplitude.init(AMP_KEY, {
        serverZone: 'EU',
        autocapture: { attribution: true, pageViews: true, sessions: true, formInteractions: false, fileDownloads: false, elementInteractions: false }
      });
      ampQueue.forEach(function (e) { window.amplitude.track(e[0], e[1]); });
      ampQueue = [];
    };
    document.head.appendChild(a);

    (function (c, l, a, r, i, t, y) {
      c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
      t = l.createElement(r); t.async = 1; t.src = 'https://www.clarity.ms/tag/' + i;
      y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y);
    })(window, document, 'clarity', 'script', CLARITY_ID);
    window.clarity('consent');

    var h = document.createElement('script');
    h.defer = true;
    h.src = 'https://t.contentsquare.net/uxa/' + CSQ_TAG + '.js';
    document.head.appendChild(h);

    ready = true;
    queue.forEach(function (e) { window.gtag('event', e[0], e[1]); ampSend(e[0], e[1]); });
    queue = [];
  }

  function banner() {
    if (owner || document.querySelector('.consent')) return;
    var el = document.createElement('div');
    el.className = 'consent';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-label', 'Cookie consent');
    el.innerHTML =
      '<p>I use analytics cookies to see which case studies people read. No ads, nothing sold.</p>' +
      '<div class="consent-btns"><button class="btn" type="button" data-c="no">Decline</button>' +
      '<button class="btn primary" type="button" data-c="yes">Accept</button></div>';
    el.addEventListener('click', function (e) {
      var b = e.target.closest('[data-c]');
      if (!b) return;
      store.set(KEY, b.dataset.c === 'yes' ? 'granted' : 'denied');
      if (b.dataset.c === 'yes') startGA();
      el.remove();
    });
    document.body.appendChild(el);
  }

  function init() {
    var c = store.get(KEY);
    if (c === 'granted') startGA();
    else if (!c) banner();

    var foot = document.querySelector('footer .wrap');
    if (foot && !foot.querySelector('.cookie-link')) {
      var a = document.createElement('button');
      a.type = 'button';
      a.className = 'cookie-link';
      a.textContent = 'Cookie settings';
      a.addEventListener('click', function () { store.del(KEY); banner(); });
      foot.appendChild(a);
    }

    var page = location.pathname.replace(/^\/|\/$/g, '') || 'home';
    var caseName = (document.querySelector('.case-title') || {}).textContent || '';

    document.addEventListener('click', function (e) {
      var t = e.target;
      var a = t.closest('a');
      if (a) {
        var href = a.getAttribute('href') || '';
        if (a.hasAttribute('download') || /\.pdf$/i.test(href)) track('cv_download', { page: page });
        else if (href.indexOf('mailto:') === 0) track('contact_click', { method: 'email', page: page });
        else if (/linkedin\.com\/in\/ilja2z\/?$/.test(href)) track('contact_click', { method: 'linkedin', page: page });
        else if (a.classList.contains('next-case')) track('next_case_click', { from: page, to: href });
        else if (/^\/work\//.test(href)) track('case_click', { from: page, to: href, place: a.closest('.logos') ? 'logo' : a.closest('.work-list') ? 'table' : 'card' });
        else if (/medium\.com/.test(href)) track('article_click', { url: href });
      }
      var acc = t.closest('.acc-trigger');
      if (acc) {
        setTimeout(function () {
          if (acc.getAttribute('aria-expanded') === 'true') {
            var label = (acc.querySelector('.acc-label') || acc).textContent.trim();
            track('accordion_open', { section: label, case_name: caseName, page: page });
          }
        }, 0);
      }
      if (t.closest('[data-next],[data-prev],.thumbs button')) {
        track('slide_change', { case_name: caseName, page: page });
      }
      if (t.closest('[data-zoom]')) track('slide_zoom', { case_name: caseName, page: page });
      var rec = t.closest('.rec-more');
      if (rec) {
        var card = rec.closest('.rec');
        var who = card && card.querySelector('.rec-by a');
        track('recommendation_open', { author: who ? who.textContent.trim() : rec.dataset.rec });
      }
    });

    var done = false;
    var end = document.getElementById('contact');
    if (end && 'IntersectionObserver' in window) {
      new IntersectionObserver(function (en, ob) {
        if (en[0].isIntersecting && !done) { done = true; track('reached_contact', { page: page }); ob.disconnect(); }
      }, { threshold: 0.3 }).observe(end);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
