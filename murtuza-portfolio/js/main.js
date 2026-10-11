(function () {
  var root = document.documentElement;
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function safeGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function safeSet(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* private mode */ } }
  var calm = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  try {
    /* ---------- welcome gate: opens only on tap ---------- */
    var gate = $('#gate');
    var entered = false;
    function enter() {
      if (entered) return;
      entered = true;
      root.classList.add('entering');
      gate.classList.add('leaving');
      window.setTimeout(function () {
        root.classList.remove('gated');
        gate.hidden = true;
        window.scrollTo(0, 0);
      }, calm ? 60 : 1000);
    }
    if (root.classList.contains('gated')) {
      gate.addEventListener('click', enter);
      window.setTimeout(function () { try { gate.focus({ preventScroll: true }); } catch (e) { gate.focus(); } }, 50);
    } else {
      root.classList.add('entering');
      gate.hidden = true;
    }

    /* ---------- skin toggle: red <-> night ---------- */
    function applySkin(night, persist) {
      if (night) root.setAttribute('data-skin', 'night'); else root.removeAttribute('data-skin');
      $$('.skin-toggle').forEach(function (b) {
        b.setAttribute('aria-pressed', night ? 'true' : 'false');
        b.setAttribute('aria-label', night ? 'Switch to red theme' : 'Switch to night mode');
        b.setAttribute('title', night ? 'Red theme' : 'Night mode');
      });
      $$('.skin-text').forEach(function (t) { t.textContent = night ? 'Red' : 'Night'; });
      $$('.skin-menu-text').forEach(function (t) { t.textContent = night ? 'Switch to red theme' : 'Switch to night mode'; });
      if (persist) safeSet('mh-skin', night ? 'night' : 'red');
    }
    applySkin(root.getAttribute('data-skin') === 'night', false);
    $$('.skin-toggle').forEach(function (b) {
      b.addEventListener('click', function () { applySkin(root.getAttribute('data-skin') !== 'night', true); });
    });

    /* ---------- navigation ---------- */
    var nav = $('#nav');
    var menu = $('#menu');
    var menuBtn = $('#menuBtn');
    function setMenu(open) {
      menu.hidden = !open;
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    }
    menuBtn.addEventListener('click', function () { setMenu(menu.hidden); });
    $$('#menu a').forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });
    document.addEventListener('click', function (e) {
      if (!menu.hidden && !menu.contains(e.target) && !menuBtn.contains(e.target)) setMenu(false);
    });
    function onScroll() { nav.classList.toggle('solid', (window.scrollY || root.scrollTop) > 24); }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    var links = $$('[data-nav]');
    function setActive(id) {
      links.forEach(function (a) { a.classList.toggle('active', a.getAttribute('data-nav') === id); });
    }
    setActive('home');
    if ('IntersectionObserver' in window) {
      var spy = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) setActive(e.target.id); });
      }, { rootMargin: '-45% 0px -50% 0px' });
      ['home', 'about', 'skills', 'projects', 'resume', 'contact'].forEach(function (id) {
        var el = document.getElementById(id);
        if (el) spy.observe(el);
      });
    }

    /* ---------- scroll reveals and skill bars ---------- */
    function reveal(el) {
      el.classList.add('in');
      $$('.bar > span', el).forEach(function (s) { s.style.width = s.getAttribute('data-w') + '%'; });
    }
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) { reveal(e.target); io.unobserve(e.target); } });
      }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
      $$('.rv').forEach(function (el) { io.observe(el); });
    } else {
      $$('.rv').forEach(reveal);
    }

    /* ---------- hero role rotator ---------- */
    var roles = ['React.js', 'React Native', 'TypeScript', 'AI-Integrated Apps'];
    var rw = $('#roleWord');
    var ri = 0;
    if (rw && !calm) {
      window.setInterval(function () {
        rw.style.opacity = '0';
        window.setTimeout(function () { ri = (ri + 1) % roles.length; rw.textContent = roles[ri]; rw.style.opacity = '1'; }, 300);
      }, 2600);
    }

    /* ---------- lanyard ID card: drag to swing, spring back ---------- */
    var swing = $('#idSwing');
    var hint = $('#idHint');
    var ang = 0, vel = 0, drag = false, raf = 0, last = 0, sx = 0, sa = 0, lx = 0, lt = 0, kicked = false;
    function paint() { swing.style.transform = 'rotate(' + ang.toFixed(2) + 'deg)'; }
    function tick(t) {
      var dt = Math.min(0.034, (t - last) / 1000 || 0.016);
      last = t;
      if (!drag) {
        vel += (-34 * ang - 2.1 * vel) * dt;
        ang += vel * dt;
      }
      paint();
      if (!drag && Math.abs(ang) < 0.03 && Math.abs(vel) < 0.08) { ang = 0; vel = 0; swing.style.transform = ''; raf = 0; return; }
      raf = window.requestAnimationFrame(tick);
    }
    function run() { if (!raf) { last = performance.now(); raf = window.requestAnimationFrame(tick); } }
    function nudge(v) { vel += v; run(); }
    if (swing && !calm) {
      swing.addEventListener('pointerdown', function (e) {
        drag = true; sx = e.clientX; sa = ang; lx = e.clientX; lt = performance.now(); vel = 0;
        try { swing.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
        if (hint) hint.classList.add('gone');
        run();
      });
      swing.addEventListener('pointermove', function (e) {
        if (!drag) return;
        ang = Math.max(-26, Math.min(26, sa + (e.clientX - sx) * 0.16));
        var now = performance.now();
        var dt = (now - lt) / 1000;
        if (dt > 0) vel = 0.7 * vel + 0.3 * (((e.clientX - lx) * 0.16) / dt);
        lx = e.clientX; lt = now;
      });
      var release = function () {
        if (!drag) return;
        drag = false;
        vel = Math.max(-170, Math.min(170, vel));
        run();
      };
      swing.addEventListener('pointerup', release);
      swing.addEventListener('pointercancel', release);
      swing.addEventListener('lostpointercapture', release);
      swing.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowLeft') { nudge(-70); if (hint) hint.classList.add('gone'); }
        if (e.key === 'ArrowRight') { nudge(70); if (hint) hint.classList.add('gone'); }
      });
      if ('IntersectionObserver' in window) {
        var kick = new IntersectionObserver(function (es) {
          es.forEach(function (e) {
            if (e.isIntersecting && !kicked) { kicked = true; window.setTimeout(function () { nudge(80); }, 350); kick.disconnect(); }
          });
        }, { threshold: 0.45 });
        kick.observe(swing);
      }
    }

    /* ---------- resume: shown only after "View Resume"; real download ---------- */
    var viewer = $('#resumeViewer');
    var viewBtn = $('#viewResume');
    var viewTxt = $('#viewResumeText');
    function setResume(open, scroll) {
      viewer.hidden = !open;
      viewBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      viewTxt.textContent = open ? 'Hide Resume' : 'View Resume';
      if (open && scroll) window.setTimeout(function () { viewer.scrollIntoView({ behavior: calm ? 'auto' : 'smooth', block: 'start' }); }, 60);
    }
    viewBtn.addEventListener('click', function () { setResume(viewer.hidden, true); });
    $('#closeResume').addEventListener('click', function () {
      setResume(false, false);
      var r = $('#resume'); if (r) r.scrollIntoView({ behavior: calm ? 'auto' : 'smooth', block: 'start' });
    });

    // In the Claude preview a plain download link is blocked, so use the viewer's save prompt there.
    // On a normal browser (the ZIP) the <a download> attribute does the work.
    function pdfBlob() {
      var el = document.getElementById('pdfB64');
      if (!el) return null;
      var bin = atob(el.textContent.trim());
      var arr = new Uint8Array(bin.length);
      for (var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
      return new Blob([arr], { type: 'application/pdf' });
    }
    $$('[data-download]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        if (!(window.claude && window.claude.use) || !document.getElementById('pdfB64')) return;
        e.preventDefault();
        var note = $('#dlNote');
        window.claude.use('downloads').then(function (d) {
          if (!d) { window.open(a.getAttribute('href'), '_blank'); return; }
          return d.save({ filename: 'Murtuza_Husain_Resume.pdf', data: pdfBlob() }).then(function () {
            if (note) note.textContent = 'Resume saved. Thank you!';
          }, function (err) {
            if (err && err.code === 'declined') return;
            window.open(a.getAttribute('href'), '_blank');
          });
        }).catch(function () { window.open(a.getAttribute('href'), '_blank'); });
      });
    });

    /* ---------- copy buttons ---------- */
    function copyText(text, btn, done) {
      var original = btn.textContent;
      function ok() { btn.textContent = done || 'Copied'; window.setTimeout(function () { btn.textContent = original; }, 1800); }
      function fallback() {
        var ta = document.createElement('textarea');
        ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
        document.body.appendChild(ta); ta.select();
        try { document.execCommand('copy'); ok(); } catch (err) { btn.textContent = 'Select and copy'; }
        document.body.removeChild(ta);
      }
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(ok, fallback);
      else fallback();
    }
    $$('.copy').forEach(function (b) { b.addEventListener('click', function () { copyText(b.getAttribute('data-copy'), b); }); });

    /* ---------- contact form: no server, so it prepares the message ---------- */
    var TO = 'sh7597293@gmail.com';
    var form = $('#contactForm');
    var errEl = $('#formError');
    var ready = $('#formReady');
    var msgText = '';
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var f = $('#firstName').value.trim();
      var l = $('#lastName').value.trim();
      var em = $('#email').value.trim();
      var m = $('#message').value.trim();
      if (!f || !m || !/^\S+@\S+\.\S+$/.test(em)) {
        errEl.hidden = false;
        errEl.textContent = 'Please add your first name, a valid email address and a message.';
        ready.hidden = true;
        return;
      }
      errEl.hidden = true;
      var who = (f + ' ' + l).trim();
      var subject = 'Portfolio enquiry from ' + who;
      var body = m + '\n\n— ' + who + '\n' + em;
      msgText = 'Subject: ' + subject + '\n\n' + body;
      $('#formPreview').textContent = msgText;
      $('#gmailLink').setAttribute('href', 'https://mail.google.com/mail/?view=cm&fs=1&to=' + encodeURIComponent(TO) + '&su=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body));
      $('#mailLink').setAttribute('href', 'mailto:' + TO + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body));
      ready.hidden = false;
    });
    $('#copyMsg').addEventListener('click', function () { copyText(msgText, $('#copyMsg'), 'Copied'); });

    /* ---------- footer name: fit to the width of the screen ---------- */
    var fit = $('#fitName');
    var fitSpan = fit ? fit.firstElementChild : null;
    var fitRaf = 0;
    function fitName() {
      if (!fit || !fitSpan) return;
      var box = fit.parentNode;
      var cs = window.getComputedStyle(box);
      var avail = box.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      fit.style.fontSize = '100px';
      var w = fitSpan.getBoundingClientRect().width;
      if (w > 0 && avail > 0) fit.style.fontSize = Math.max(28, Math.floor((100 * avail) / w * 0.985)) + 'px';
    }
    function queueFit() { if (fitRaf) return; fitRaf = window.requestAnimationFrame(function () { fitRaf = 0; fitName(); }); }
    window.addEventListener('resize', queueFit);
    window.addEventListener('orientationchange', queueFit);
    fitName();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(queueFit);
    window.addEventListener('load', queueFit);

    var yr = $('#year');
    if (yr) yr.textContent = new Date().getFullYear();

    window.__mh = true;
  } catch (err) {
    root.classList.remove('js', 'gated');
    if (window.console) console.error(err);
  }
})();
window.addEventListener('load', function () {
  window.setTimeout(function () {
    if (!window.__mh) document.documentElement.classList.remove('js', 'gated');
  }, 2500);
});
