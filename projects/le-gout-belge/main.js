/* ==========================================================================
   Le Goût Belge — interactions
   Aucune dépendance. Chaque module est indépendant et no-op si son DOM manque.
   ========================================================================== */
(() => {
  'use strict';

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const PHONE = '+32472717260';

  /* ---------- Intro au chargement ---------- */
  function intro() {
    const start = () => requestAnimationFrame(() => document.body.classList.add('is-loaded'));
    if (document.fonts && document.fonts.ready) {
      // N'attend jamais plus de 600 ms les polices : le contenu passe avant l'effet.
      Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 600))]).then(start);
    } else start();
  }

  /* ---------- Navigation : état au scroll, masquage, section active ---------- */
  function nav() {
    const bar = $('#nav');
    const callbar = $('[data-callbar]');
    if (!bar) return;
    let lastY = window.scrollY;
    let ticking = false;

    const update = () => {
      const y = window.scrollY;
      const menuOpen = document.body.classList.contains('menu-open');
      bar.classList.toggle('is-scrolled', y > 24);
      bar.classList.toggle('is-hidden', !menuOpen && y > lastY && y > 480);
      if (callbar) callbar.classList.toggle('is-visible', y > window.innerHeight * 0.7);
      lastY = y;
      ticking = false;
    };
    window.addEventListener('scroll', () => {
      if (!ticking) { requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
    update();

    // Lien actif selon la section visible
    const links = $$('.nav__links a');
    const map = new Map(links.map(a => [a.getAttribute('href').slice(1), a]));
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        links.forEach(a => a.removeAttribute('aria-current'));
        const link = map.get(e.target.id);
        if (link) link.setAttribute('aria-current', 'true');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    map.forEach((_, id) => { const s = document.getElementById(id); if (s) io.observe(s); });
  }

  /* ---------- Menu mobile (piège de focus + Échap) ---------- */
  function drawer() {
    const btn = $('.burger');
    const panel = $('#drawer');
    if (!btn || !panel) return;
    const focusables = () => $$('a, button', panel).concat(btn);

    const set = open => {
      btn.setAttribute('aria-expanded', String(open));
      btn.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
      panel.classList.toggle('is-open', open);
      panel.setAttribute('aria-hidden', String(!open));
      document.body.classList.toggle('menu-open', open);
      document.body.style.overflow = open ? 'hidden' : '';
      if (open) setTimeout(() => $('a', panel).focus({ preventScroll: true }), 350);
    };
    btn.addEventListener('click', () => set(btn.getAttribute('aria-expanded') !== 'true'));
    $$('a', panel).forEach(a => a.addEventListener('click', () => set(false)));
    document.addEventListener('keydown', e => {
      if (!panel.classList.contains('is-open')) return;
      if (e.key === 'Escape') { set(false); btn.focus(); }
      if (e.key === 'Tab') {
        const f = focusables();
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
    window.matchMedia('(min-width: 1025px)').addEventListener('change', e => { if (e.matches) set(false); });
  }

  /* ---------- Apparitions au défilement ---------- */
  function reveal() {
    const items = $$('[data-reveal], .draw:not(.is-in)');
    if (!('IntersectionObserver' in window) || reduceMotion.matches) {
      items.forEach(el => el.classList.add('is-in'));
      return;
    }
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-in');
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });
    items.forEach(el => io.observe(el));
  }

  /* ---------- Bascule de tonalité (fond clair → sombre) ---------- */
  function tone() {
    const sections = $$('[data-tone]').filter(el => el !== document.body);
    if (!sections.length) return;
    const meta = $('meta[name="theme-color"]');
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        const dark = e.isIntersecting;
        document.body.dataset.tone = dark ? 'dark' : 'light';
        if (meta) meta.content = dark ? '#1B1713' : '#F4EEE4';
      });
    }, { rootMargin: '-40% 0px -40% 0px' });
    sections.forEach(s => io.observe(s));
  }

  /* ---------- Parallaxe légère (desktop, sans reduced motion) ---------- */
  function parallax() {
    const els = $$('[data-parallax]');
    const mq = window.matchMedia('(min-width: 761px) and (hover: hover)');
    if (!els.length) return;
    let raf = null;
    const run = () => {
      const vh = window.innerHeight;
      els.forEach(el => {
        const r = el.getBoundingClientRect();
        if (r.bottom < -100 || r.top > vh + 100) return;
        const speed = parseFloat(el.dataset.parallax) || 0;
        const offset = (r.top + r.height / 2 - vh / 2) * speed;
        el.style.setProperty('--py', offset.toFixed(1) + 'px');
      });
      raf = null;
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(run); };
    const toggle = () => {
      const on = mq.matches && !reduceMotion.matches;
      window[on ? 'addEventListener' : 'removeEventListener']('scroll', onScroll, { passive: true });
      if (on) run(); else els.forEach(el => el.style.removeProperty('--py'));
    };
    mq.addEventListener('change', toggle);
    reduceMotion.addEventListener('change', toggle);
    toggle();
  }

  /* ---------- Onglets de la carte (ARIA tabs) ---------- */
  function tabs() {
    const list = $('[role="tablist"]');
    if (!list) return;
    const tabEls = $$('[role="tab"]', list);
    const indicator = $('.tabs__indicator', list);

    const moveIndicator = tab => {
      indicator.style.width = tab.offsetWidth + 'px';
      indicator.style.transform = `translateX(${tab.offsetLeft}px)`;
    };
    const select = (tab, focus) => {
      tabEls.forEach(t => {
        const on = t === tab;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        const panel = document.getElementById(t.getAttribute('aria-controls'));
        panel.hidden = !on;
        if (on) {
          panel.classList.remove('is-entering');
          void panel.offsetWidth; // relance l'animation
          panel.classList.add('is-entering');
        }
      });
      moveIndicator(tab);
      if (focus) tab.focus();
    };
    tabEls.forEach((t, i) => {
      t.addEventListener('click', () => select(t));
      t.addEventListener('keydown', e => {
        const keys = { ArrowRight: 1, ArrowLeft: -1, Home: -i, End: tabEls.length - 1 - i };
        if (!(e.key in keys)) return;
        e.preventDefault();
        select(tabEls[(i + keys[e.key] + tabEls.length) % tabEls.length], true);
      });
    });
    const current = () => tabEls.find(t => t.getAttribute('aria-selected') === 'true');
    window.addEventListener('resize', () => moveIndicator(current()));
    if (document.fonts) document.fonts.ready.then(() => moveIndicator(current()));
    moveIndicator(current());
  }

  /* ---------- Compteurs ---------- */
  function counters() {
    const els = $$('[data-count]');
    if (reduceMotion.matches || !('IntersectionObserver' in window)) return; // valeur finale déjà dans le HTML
    const fmt = (v, d) => v.toFixed(d).replace('.', ',');
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        io.unobserve(e.target);
        const el = e.target;
        const end = parseFloat(el.dataset.count);
        const dec = parseInt(el.dataset.decimals || '0', 10);
        const t0 = performance.now(), dur = 1600;
        const step = now => {
          const p = Math.min((now - t0) / dur, 1);
          const eased = 1 - Math.pow(1 - p, 4);
          el.textContent = fmt(end * eased, dec);
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      });
    }, { threshold: 0.6 });
    els.forEach(el => io.observe(el));
  }

  /* ---------- FAQ (accordéon) ---------- */
  function faq() {
    $$('.faq__q').forEach(q => q.addEventListener('click', () => {
      q.setAttribute('aria-expanded', String(q.getAttribute('aria-expanded') !== 'true'));
    }));
  }

  /* ---------- Avis : boutons précédent / suivant ---------- */
  function reviews() {
    const track = $('.reviews__track');
    if (!track) return;
    const prev = $('[data-reviews="prev"]'), next = $('[data-reviews="next"]');
    const step = () => (track.firstElementChild?.getBoundingClientRect().width || 300) + 32;
    const sync = () => {
      prev.disabled = track.scrollLeft < 8;
      next.disabled = track.scrollLeft + track.clientWidth > track.scrollWidth - 8;
    };
    const behavior = () => (reduceMotion.matches ? 'auto' : 'smooth');
    prev.addEventListener('click', () => track.scrollBy({ left: -step(), behavior: behavior() }));
    next.addEventListener('click', () => track.scrollBy({ left: step(), behavior: behavior() }));
    track.addEventListener('scroll', sync, { passive: true });
    window.addEventListener('resize', sync);
    sync();
  }

  /* ---------- Horaires : jour courant + statut ouvert/fermé ---------- */
  function hours() {
    const now = new Date();
    const row = $(`[data-hours] [data-day="${now.getDay()}"]`);
    const label = $('[data-status]');
    const dot = $('[data-status-dot]');
    if (!row) return;
    row.setAttribute('aria-current', 'date');
    const [open, close] = row.lastElementChild.textContent.split('–').map(s => {
      const [h, m] = s.trim().split(':').map(Number);
      return h * 60 + m;
    });
    const mins = now.getHours() * 60 + now.getMinutes();
    const isOpen = mins >= open && mins < close;
    const fmt = m => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
    if (label) label.textContent = isOpen ? `Ouvert · jusqu’à ${fmt(close)}` : `Fermé · ouvre à ${fmt(open)}`;
    if (dot) dot.classList.toggle('is-closed', !isOpen);
  }

  /* ---------- Formulaire de réservation → SMS pré-rempli ---------- */
  function booking() {
    const form = $('#booking-form');
    if (!form) return;
    const date = $('#f-date', form);
    const today = new Date();
    const iso = d => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    date.min = iso(today);
    if (!date.value) date.value = iso(today);

    const setError = (input, msg) => {
      const field = input.closest('.field');
      const out = document.getElementById(input.getAttribute('aria-describedby'));
      if (msg) { field.setAttribute('data-invalid', ''); input.setAttribute('aria-invalid', 'true'); }
      else { field.removeAttribute('data-invalid'); input.removeAttribute('aria-invalid'); }
      if (out) out.textContent = msg || '';
    };

    form.addEventListener('submit', e => {
      e.preventDefault();
      const name = $('#f-name', form);
      let firstInvalid = null;
      if (!name.value.trim()) { setError(name, 'Indiquez votre nom.'); firstInvalid = firstInvalid || name; } else setError(name);
      if (!date.value || date.value < date.min) { setError(date, 'Choisissez une date à partir d’aujourd’hui.'); firstInvalid = firstInvalid || date; } else setError(date);
      if (firstInvalid) { firstInvalid.focus(); return; }

      const d = new Date(date.value + 'T12:00:00').toLocaleDateString('fr-BE', { weekday: 'long', day: 'numeric', month: 'long' });
      const body = `Bonjour, je souhaite réserver une table pour ${$('#f-guests', form).value} personne(s) le ${d} à ${$('#f-time', form).value}. Nom : ${name.value.trim()}. Merci !`;
      const sep = /iPhone|iPad|Mac/i.test(navigator.userAgent) ? '&' : '?';
      window.location.href = `sms:${PHONE}${sep}body=${encodeURIComponent(body)}`;
    });
    $$('input', form).forEach(i => i.addEventListener('input', () => setError(i)));
  }

  /* ---------- Divers ---------- */
  function misc() {
    $$('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });
  }

  intro();
  nav();
  drawer();
  reveal();
  tone();
  parallax();
  tabs();
  counters();
  faq();
  reviews();
  hours();
  booking();
  misc();
})();
