(function(){
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // header border on scroll
  var header = document.querySelector('.site-header');
  var onScroll = function(){ header.classList.toggle('scrolled', window.scrollY > 8); };
  window.addEventListener('scroll', onScroll, {passive:true}); onScroll();

  // accordions
  var uid = 0;
  document.querySelectorAll('[data-acc] .acc-item').forEach(function(item){
    var btn = item.querySelector('.acc-trigger'), panel = item.querySelector('.acc-panel');
    var id = 'acc-' + (++uid);
    panel.id = id; btn.setAttribute('aria-controls', id);
    panel.setAttribute('role','region'); panel.setAttribute('aria-label', btn.querySelector('.acc-label').textContent);
    btn.addEventListener('click', function(){
      var open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!open));
      panel.classList.toggle('open', !open);
    });
  });


  // recommendations
  var rd = document.querySelector('dialog.rec-dlg'), rdIn = rd ? rd.querySelector('.rd-inner') : null, rdOpener = null;
  if (rd) {
  document.querySelectorAll('.rec-more').forEach(function(b){
    b.addEventListener('click', function(){
      var card = b.closest('.rec');
      rdIn.innerHTML = '';
      rdIn.appendChild(card.querySelector('.rec-rel').cloneNode(true));
      rdIn.appendChild(card.querySelector('.rec-text').cloneNode(true));
      var by = card.querySelector('.rec-by').cloneNode(true); var a = by.querySelector('a'); if (a) a.id = 'rd-name'; rdIn.appendChild(by);
      rdOpener = b; if (rd.showModal) rd.showModal(); else rd.setAttribute('open','');
      rd.scrollTop = 0;
    });
  });
  rd.querySelector('.rd-close').addEventListener('click', function(){ rd.close(); });
  rd.addEventListener('click', function(e){ if (e.target === rd) rd.close(); });
  rd.addEventListener('close', function(){ if (rdOpener) rdOpener.focus({preventScroll:true}); });
  }
  var rt = document.querySelector('.rec-track');
  if (rt) {
    var rp = document.querySelector('[data-rprev]'), rn = document.querySelector('[data-rnext]');
    var step = function(d){ var c = rt.querySelector('.rec'); var w = c ? c.getBoundingClientRect().width + 20 : rt.clientWidth; rt.scrollBy({left: d * w, behavior: reduce ? 'auto' : 'smooth'}); };
    var rs = function(){ rp.disabled = rt.scrollLeft < 4; rn.disabled = rt.scrollLeft + rt.clientWidth > rt.scrollWidth - 4; };
    rp.addEventListener('click', function(){ step(-1); }); rn.addEventListener('click', function(){ step(1); });
    rt.addEventListener('scroll', rs, {passive:true}); window.addEventListener('resize', rs); rs();
  }

  // video from embedded data
  var reelUrl = null;
  reelUrl = '/assets/mabrook-reel.mp4';


  var LB = (function(){
    var lb = document.querySelector('dialog.lb'), img = lb.querySelector('img'), cnt = lb.querySelector('.lb-count');
    var list = [], li = 0, done = null;
    function show(n){ li = (n + list.length) % list.length; img.src = list[li].src; img.alt = list[li].alt; cnt.textContent = (li+1) + ' / ' + list.length; }
    lb.querySelector('.lb-close').addEventListener('click', function(){ lb.close(); });
    lb.querySelector('[data-lb-prev]').addEventListener('click', function(){ show(li-1); });
    lb.querySelector('[data-lb-next]').addEventListener('click', function(){ show(li+1); });
    lb.addEventListener('keydown', function(e){ if (e.key === 'ArrowRight') show(li+1); if (e.key === 'ArrowLeft') show(li-1); });
    lb.addEventListener('click', function(e){ if (e.target === lb || e.target.classList.contains('lb-inner')) lb.close(); });
    lb.addEventListener('close', function(){ if (done) done(li); });
    return { open: function(l, n, cb){ list = l; done = cb; show(n); if (lb.showModal) lb.showModal(); else lb.setAttribute('open',''); } };
  })();
  // gallery
  document.querySelectorAll('[data-gallery]').forEach(function(g){
    var track = g.querySelector('.track'), slides = Array.prototype.slice.call(g.querySelectorAll('.slide'));
    var cap = g.querySelector('.g-cap'), count = g.querySelector('.g-count');
    var prev = g.querySelector('[data-prev]'), next = g.querySelector('[data-next]'), thumbs = g.querySelector('.thumbs');
    var video = g.querySelector('[data-video]'), current = 0, vIdx = -1;
    if (video) { var vs = video.dataset.src || reelUrl; if (vs) { video.src = vs; if (!video.controls) video.preload = 'metadata'; } }
    var autoVid = video && !video.controls;
    if (video) vIdx = slides.indexOf(video.closest('.slide'));

    slides.forEach(function(s, i){
      s.setAttribute('role','group'); s.setAttribute('aria-roledescription','slide');
      s.setAttribute('aria-label', (i+1) + ' of ' + slides.length + ': ' + s.dataset.cap);
      var t = document.createElement('button'); t.type = 'button';
      t.setAttribute('aria-label', 'Show slide ' + (i+1) + ': ' + s.dataset.cap);
      var img = document.createElement('img'); img.alt = ''; img.loading = 'lazy';
      var src = s.querySelector('img'); img.src = src ? src.getAttribute('src') : (video ? video.getAttribute('poster') : '');
      t.appendChild(img);
      if (!src) { var p = document.createElement('span'); p.className = 'play'; p.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>'; t.appendChild(p); }
      t.addEventListener('click', function(){ go(i); });
      thumbs.appendChild(t);
    });
    var tbtns = thumbs.querySelectorAll('button');

    function go(i){ i = Math.max(0, Math.min(slides.length-1, i)); track.scrollTo({left: slides[i].offsetLeft - track.offsetLeft, behavior: reduce ? 'auto' : 'smooth'}); }
    function update(i){
      if (i === current && cap.textContent) return;
      current = i;
      var s = slides[i];
      cap.innerHTML = '<b></b>'; cap.firstChild.textContent = s.dataset.cap; cap.appendChild(document.createTextNode(s.dataset.desc));
      count.textContent = (i+1) + ' / ' + slides.length;
      prev.disabled = i === 0; next.disabled = i === slides.length-1;
      tbtns.forEach(function(b, j){ b.setAttribute('aria-current', j === i ? 'true' : 'false'); });
      var tb = tbtns[i]; thumbs.scrollTo({left: tb.offsetLeft - thumbs.clientWidth/2 + tb.clientWidth/2, behavior: reduce ? 'auto' : 'smooth'});
      if (video) { if (i === vIdx && !reduce && autoVid) { var pr = video.play(); if (pr && pr.catch) pr.catch(function(){}); } else { video.pause(); } }
    }
    current = -1; update(0);
    if (video && reduce) { video.controls = true; }

    var raf;
    track.addEventListener('scroll', function(){
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(function(){ update(Math.round(track.scrollLeft / track.clientWidth)); });
    }, {passive:true});
    prev.addEventListener('click', function(){ go(current-1); });
    next.addEventListener('click', function(){ go(current+1); });
    track.addEventListener('keydown', function(e){
      if (e.key === 'ArrowRight') { e.preventDefault(); go(current+1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(current-1); }
    });
    window.addEventListener('resize', function(){ go(current); });

    // autoplay video only when visible
    if (video && autoVid && 'IntersectionObserver' in window && !reduce) {
      new IntersectionObserver(function(es){ es.forEach(function(e){ if (!e.isIntersecting) video.pause(); else if (current === vIdx) { var pr = video.play(); if (pr && pr.catch) pr.catch(function(){}); } }); }, {threshold:.4}).observe(video);
    }

    // lightbox (shared dialog, one active gallery at a time)
    var zoomables = slides.map(function(s){ return s.querySelector('img'); }).filter(Boolean);
    g.querySelectorAll('[data-zoom]').forEach(function(b){
      b.addEventListener('click', function(){
        LB.open(zoomables, zoomables.indexOf(b.querySelector('img')), function(li){
          var s = slides.findIndex(function(sl){ return sl.querySelector('img') === zoomables[li]; });
          if (s > -1) go(s);
          var zb = zoomables[li].closest('button'); if (zb) zb.focus({preventScroll:true});
        });
      });
    });
  });
})();
// back to top (all pages)
(function(){
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var b = document.createElement('button');
  b.type = 'button'; b.className = 'to-top'; b.setAttribute('aria-label', 'Back to top'); b.tabIndex = -1;
  b.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7"/></svg>';
  document.body.appendChild(b); document.body.classList.add('has-totop');
  var shown = false;
  function update(){
    var show = window.scrollY > window.innerHeight * 1.5 && !document.querySelector('.consent');
    if (show !== shown){ shown = show; b.classList.toggle('show', show); b.tabIndex = show ? 0 : -1; }
  }
  window.addEventListener('scroll', update, {passive:true}); window.addEventListener('resize', update); update();
  b.addEventListener('click', function(){
    if (window.track) window.track('back_to_top', { page: location.pathname.replace(/^\/|\/$/g, ''), depth: Math.round(window.scrollY / Math.max(1, document.documentElement.scrollHeight - window.innerHeight) * 100) });
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    var h = document.querySelector('h1'); if (h){ h.setAttribute('tabindex','-1'); h.focus({preventScroll:true}); }
  });
})();
