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

    var opened = {};
    /* ---- helpers for the reading / media events ---- */
    var main = document.querySelector('main') || document.body;
    function clip(s, n) { s = (s || '').replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n - 1) + '…' : s; }
    function headLabel(h) { return clip((h.querySelector('.acc-label') || h).textContent, 80); }
    // headings that mark a part of the page (h2 and h3 in the content, not the contact band)
    var heads = [].slice.call(main.querySelectorAll('h2, h3')).filter(function (h) {
      return !h.closest('#contact, .consent, footer, header') && headLabel(h);
    });
    function sectionOf(el) {
      var acc = el.closest && el.closest('.acc-panel');
      if (acc && acc.previousElementSibling) return headLabel(acc.previousElementSibling);
      if (el.closest && el.closest('#contact')) return 'Contact';
      if (el.closest && el.closest('header, .site-header, nav')) return 'Header';
      if (el.closest && el.closest('footer')) return 'Footer';
      var cur = 'Top';
      for (var i = 0; i < heads.length; i++) {
        if (heads[i].compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING) cur = headLabel(heads[i]);
        else break;
      }
      return cur;
    }
    function placeOf(el) {
      if (el.closest('header, .site-header, nav')) return 'header';
      if (el.closest('footer')) return 'footer';
      if (el.closest('#contact')) return 'contact';
      if (el.classList.contains('btn')) return 'button';
      return 'text';
    }
    function linkKind(url) {
      if (/linkedin\.com\/in\//.test(url)) return 'linkedin_profile';
      if (/claude\.ai\/artifact/.test(url)) return 'artifact';
      if (/github\.com/.test(url)) return 'github';
      if (/vercel\.app/.test(url)) return 'live_demo';
      if (/dribbble\.com|behance\.net/.test(url)) return 'portfolio';
      if (/medium\.com/.test(url)) return 'article';
      return 'website';
    }

    document.addEventListener('click', function (e) {
      var t = e.target;
      var a = t.closest('a');
      if (a) {
        var href = a.getAttribute('href') || '';
        var text = clip(a.innerText || a.textContent || a.getAttribute('aria-label') || (a.querySelector('img') || {}).alt, 80);
        var section = sectionOf(a);
        var place = placeOf(a);
        var abs = a.href || href;
        var external = /^https?:/i.test(abs) && a.hostname && a.hostname !== location.hostname;
        if (a.hasAttribute('download') || /\.pdf$/i.test(href)) track('cv_download', { page: page, section: section, place: place });
        else if (href.indexOf('mailto:') === 0) track('contact_click', { method: 'email', page: page, section: section, place: place });
        else if (/linkedin\.com\/in\/ilja2z\/?$/.test(href)) track('contact_click', { method: 'linkedin', page: page, section: section, place: place });
        else if (a.classList.contains('next-case')) track('next_case_click', { from: page, to: href });
        else if (/^\/work\//.test(href)) track('case_click', { from: page, to: href, text: text, section: section, place: a.closest('.logos') ? 'logo' : a.closest('.work-list') ? 'table' : 'card', link_place: place });
        else if (/\.(webp|png|jpe?g|gif|svg)(\?|$)/i.test(href)) track('image_open', { page: page, image: href.split('/').pop(), alt: text, section: section });
        else if (/^\/writing\//.test(href)) track('writing_click', { from: page, to: href, text: text, section: section, place: place });
        else if (!external && !/^(mailto|tel|javascript):/i.test(href) && href !== '#main') track('internal_click', { from: page, to: href, text: text, section: section, place: place });
        if (a.hasAttribute('data-deck')) track('deck_open', { page: page, section: section, place: place });
        if (external && !/linkedin\.com\/in\/ilja2z\/?$/.test(href)) {
          var kind = linkKind(abs);
          if (a.closest('.post-links')) track('example_click', { url: href, page: page });
          if (kind === 'article') track('article_click', { url: href });
          track('outbound_click', { page: page, url: clip(abs, 100), domain: a.hostname.replace(/^www\./, ''), kind: kind, text: text, section: section, place: place });
        }
      }
      var acc = t.closest('.acc-trigger');
      if (acc) {
        setTimeout(function () {
          var label = (acc.querySelector('.acc-label') || acc).textContent.trim();
          if (acc.getAttribute('aria-expanded') === 'true') {
            opened[label] = Date.now();
            track('accordion_open', { section: label, case_name: caseName, page: page });
          } else if (opened[label]) {
            track('accordion_close', { section: label, page: page, seconds_open: Math.round((Date.now() - opened[label]) / 1000) });
            delete opened[label];
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
        if (en[0].isIntersecting && !done) { done = true; track('reached_contact', { page: page, seconds: activeSec }); ob.disconnect(); }
      }, { threshold: 0.3 }).observe(end);
    }

    /* ---- engaged time: seconds the tab is visible and the visitor is active (or a video plays) ---- */
    var activeSec = 0, lastAct = Date.now(), playing = 0;
    var timeMarks = [10, 30, 60, 120, 180, 300, 600];
    ['scroll', 'mousemove', 'keydown', 'touchstart', 'click', 'wheel'].forEach(function (ev) {
      window.addEventListener(ev, function () { lastAct = Date.now(); }, { passive: true });
    });
    setInterval(function () {
      if (document.visibilityState !== 'visible') return;
      if (Date.now() - lastAct > 30000 && !playing) return;
      activeSec++;
      if (timeMarks.length && activeSec >= timeMarks[0]) track('engaged_time', { page: page, seconds: timeMarks.shift(), section: lastSection });
    }, 1000);

    /* ---- scroll depth: 25 / 50 / 75 / 90 / 100 % of the page ---- */
    var maxScroll = 0, scrollMarks = [25, 50, 75, 90, 100];
    function onScroll() {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      var pct = h <= 0 ? 100 : Math.min(100, Math.round(window.scrollY / h * 100));
      if (pct > maxScroll) maxScroll = pct;
      while (scrollMarks.length && maxScroll >= scrollMarks[0]) track('scroll_depth', { page: page, percent: scrollMarks.shift(), seconds: activeSec });
    }
    window.addEventListener('scroll', onScroll, { passive: true });

    /* ---- sections: which headings came into view, in what order ---- */
    var seen = {}, seenCount = 0, lastSection = 'Top';
    if ('IntersectionObserver' in window && heads.length) {
      var so = new IntersectionObserver(function (en) {
        en.forEach(function (x) {
          if (!x.isIntersecting) return;
          var name = headLabel(x.target);
          lastSection = name;
          if (seen[name]) return;
          seen[name] = 1; seenCount++;
          track('section_view', { page: page, section: name, index: heads.indexOf(x.target) + 1, total: heads.length, seconds: activeSec });
        });
      }, { rootMargin: '0px 0px -35% 0px', threshold: 0 });
      heads.forEach(function (h) { so.observe(h); });
    }

    /* ---- copying text (an email, a quote) ---- */
    document.addEventListener('copy', function () {
      var sel = String(window.getSelection ? window.getSelection() : '');
      if (!sel.trim()) return;
      var node = window.getSelection().anchorNode;
      track('copy_text', { page: page, chars: sel.length, snippet: clip(sel, 80), section: node ? sectionOf(node.nodeType === 1 ? node : node.parentElement) : '' });
    });

    /* ---- videos: start, 25/50/75 %, complete, pause, seek, sound, fullscreen ---- */
    var videosPlayed = [];
    [].slice.call(document.querySelectorAll('video')).forEach(function (v, i) {
      var src = (v.currentSrc || v.getAttribute('src') || v.getAttribute('data-src') || (v.querySelector('source') || {}).src || '').split('/').pop().split('?')[0];
      var name = clip(v.getAttribute('aria-label') || src || ('video ' + (i + 1)), 80);
      var auto = v.autoplay || (v.muted && v.loop && !v.controls);
      var marks = [25, 50, 75], started = false, completed = false, watched = 0, lastT = 0, seeking = false;
      function base(extra) {
        var o = { page: page, video: name, file: src, autoplay: auto, muted: v.muted, position: Math.round(v.currentTime || 0), duration: Math.round(v.duration || 0), section: sectionOf(v) };
        for (var k in extra) o[k] = extra[k];
        return o;
      }
      v.addEventListener('play', function () {
        playing++;
        if (!started) { started = true; videosPlayed.push(name); track('video_start', base({})); }
        else track('video_resume', base({}));
      });
      v.addEventListener('pause', function () {
        playing = Math.max(0, playing - 1);
        if (!v.ended && !auto) track('video_pause', base({ watched_seconds: Math.round(watched) }));
      });
      v.addEventListener('ended', function () { playing = Math.max(0, playing - 1); });
      v.addEventListener('seeking', function () { seeking = true; });
      v.addEventListener('seeked', function () {
        if (!auto) track('video_seek', base({ from: Math.round(lastT), to: Math.round(v.currentTime) }));
        lastT = v.currentTime; seeking = false;
      });
      v.addEventListener('timeupdate', function () {
        var t = v.currentTime;
        if (!seeking && t > lastT && t - lastT < 2) watched += t - lastT;
        lastT = t;
        if (!v.duration || completed) return;
        var pct = t / v.duration * 100;
        while (marks.length && pct >= marks[0]) track('video_progress', base({ percent: marks.shift(), watched_seconds: Math.round(watched) }));
        if (pct >= 97) { completed = true; track('video_complete', base({ watched_seconds: Math.round(watched) })); }
      });
      var wasMuted = v.muted;
      v.addEventListener('volumechange', function () {
        if (wasMuted && !v.muted) track('video_unmute', base({}));
        wasMuted = v.muted;
      });
      v.addEventListener('webkitbeginfullscreen', function () { track('video_fullscreen', base({})); });
      v._ivWatched = function () { return Math.round(watched); };
    });
    document.addEventListener('fullscreenchange', function () {
      var f = document.fullscreenElement;
      if (f && f.tagName === 'VIDEO') track('video_fullscreen', { page: page, video: clip(f.getAttribute('aria-label') || '', 80), position: Math.round(f.currentTime || 0) });
    });

    /* ---- one summary when the visitor leaves the page ---- */
    var sent = false;
    function summary() {
      if (sent) return;
      sent = true;
      var vids = [].slice.call(document.querySelectorAll('video')).map(function (v) { return v._ivWatched ? v._ivWatched() : 0; });
      var p = { page: page, seconds: activeSec, max_scroll: maxScroll, sections_seen: seenCount, sections_total: heads.length, last_section: lastSection, videos_started: videosPlayed.length, video_seconds: vids.reduce(function (s, x) { return s + x; }, 0) };
      if (window.amplitude && window.amplitude.setTransport) { try { window.amplitude.setTransport('beacon'); } catch (e) {} }
      track('page_summary', p);
      if (window.amplitude && window.amplitude.flush) { try { window.amplitude.flush(); } catch (e) {} }
    }
    window.addEventListener('pagehide', summary);
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'hidden') track('tab_hidden', { page: page, seconds: activeSec, max_scroll: maxScroll, section: lastSection, sections_seen: seenCount });
      else if (!sent) track('tab_return', { page: page, seconds: activeSec });
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
