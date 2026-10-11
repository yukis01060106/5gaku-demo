/* =========================================================
   5GAKU — top page interactions
   ========================================================= */
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGsap = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';

  if (hasGsap && !reduced) document.documentElement.classList.add('js');

  /* ---------- split text into chars ---------- */
  $$('[data-split]').forEach(el => {
    el.innerHTML = [...el.textContent].map(c => `<span class="ch">${c}</span>`).join('');
  });

  /* ---------- smooth scroll ---------- */
  let lenis = null;
  if (hasGsap && !reduced && typeof window.Lenis !== 'undefined') {
    lenis = new Lenis({ duration: 1.2, easing: t => 1 - Math.pow(1 - t, 4) });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  const scrollToEl = el => {
    if (!el) return;
    lenis ? lenis.scrollTo(el, { offset: -60 }) : el.scrollIntoView({ behavior: 'smooth' });
  };

  /* ---------- header / drawer ---------- */
  const header = $('#header');
  const menuBtn = $('.header__menu');
  const setMenu = open => {
    document.body.classList.toggle('menu-open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    $('#drawer').setAttribute('aria-hidden', String(!open));
    if (lenis) open ? lenis.stop() : lenis.start();
  };
  menuBtn.addEventListener('click', () => setMenu(!document.body.classList.contains('menu-open')));

  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const id = a.getAttribute('href');
    if (id === '#') return;
    e.preventDefault();
    setMenu(false);
    if (a.dataset.planLink) setTab(a.dataset.planLink);
    scrollToEl(id === '#top' ? document.body : $(id));
  }));

  /* ---------- plan tabs ---------- */
  const tabs = $('.tabs');
  function setTab(name) {
    $$('.tabs__btn').forEach(b => {
      const on = b.dataset.tab === name;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-selected', String(on));
    });
    $$('.panel').forEach(p => { p.hidden = p.id !== `plan-${name}`; });
    tabs.classList.toggle('is-biz', name === 'biz');
    if (hasGsap) {
      const panel = $(`#plan-${name}`);
      gsap.fromTo(panel.children, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: .8, stagger: .06, ease: 'power3.out' });
      ScrollTrigger.refresh();
    }
  }
  $$('.tabs__btn').forEach(b => b.addEventListener('click', () => setTab(b.dataset.tab)));

  /* ---------- 法人: 拠点別ペルソナ ---------- */
  $$('.persona__btn').forEach(btn => btn.addEventListener('click', () => {
    const name = btn.dataset.persona;
    $$('.persona__btn').forEach(b => {
      const on = b === btn;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-selected', String(on));
    });
    $$('.persona__panel').forEach(p => { p.hidden = p.id !== `persona-${name}`; p.classList.toggle('is-active', !p.hidden); });
    if (hasGsap) {
      gsap.fromTo(`#persona-${name} > *`, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: .7, stagger: .08, ease: 'power3.out' });
      ScrollTrigger.refresh();
    }
  }));

  /* ---------- rooms: drag to scroll ---------- */
  const track = $('[data-drag]');
  if (track) {
    let down = false, sx = 0, sl = 0;
    track.addEventListener('pointerdown', e => {
      if (e.pointerType !== 'mouse') return;
      down = true; sx = e.clientX; sl = track.scrollLeft; track.classList.add('is-dragging');
    });
    addEventListener('pointerup', () => { down = false; track.classList.remove('is-dragging'); });
    track.addEventListener('pointermove', e => { if (down) track.scrollLeft = sl - (e.clientX - sx); });
  }

  /* ---------- map: don't trap page scroll until clicked ---------- */
  const map = $('.access__map');
  if (map) {
    map.addEventListener('click', () => map.classList.add('is-active'));
    map.addEventListener('mouseleave', () => map.classList.remove('is-active'));
  }

  /* ---------- no-animation fallback ---------- */
  if (!hasGsap || reduced) {
    const onScroll = () => {
      const past = scrollY > innerHeight * .8;
      header.classList.toggle('is-solid', past);
      $('.sp-bar').classList.toggle('is-show', past);
    };
    addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  /* =========================================================
     FIRST VIEW — opening + scroll-driven story
     ========================================================= */
  const fv = $('#fv');
  const chars = sel => $$(`${sel} .ch`, fv);

  // opening (on load)
  gsap.timeline({ defaults: { ease: 'power4.out' } })
    .from('.fv__img--1', { scale: 1.3, duration: 3.2, ease: 'power2.out' }, 0)
    .from('.fv__logo span', { yPercent: 60, opacity: 0, duration: 1.8, stagger: .08 }, .4)
    .from(['.fv__eyebrow', '.fv__lead'], { y: 16, opacity: 0, duration: 1.4, stagger: .15 }, 1.0)
    .from(['.fv__scroll', '.fv__progress', header], { opacity: 0, duration: 1.2 }, 1.6);

  // scroll story (pinned)
  const steps = ['01', '02', '03', '04'];
  const countEl = $('.fv__count b', fv);
  const barEl = $('.fv__bar i', fv);

  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: fv,
      start: 'top top',
      end: () => `+=${innerHeight * 4.5}`,
      pin: '.fv__stage',
      scrub: 1,
      anticipatePin: 1,
      onUpdate: self => {
        const p = self.progress;
        countEl.textContent = steps[Math.min(3, Math.floor(p * 4.2))];
        barEl.style.transform = `scaleX(${p})`;
      }
    }
  });

  tl
    // 0 → 1.2 : brand leaves, aerial settles
    .to('.fv__brand', { opacity: 0, y: -60, duration: 1, ease: 'power1.in' }, 0)
    .to('.fv__scroll', { opacity: 0, duration: .4 }, 0)
    .to('.fv__img--1', { scale: 1, duration: 3 }, 0)
    .to('.fv__shade', { backgroundColor: 'rgba(10,10,9,.32)', duration: 1 }, 0)

    // 1 → 2.4 : 五つの峰を、
    .to(chars('.fv__copy--a'), { opacity: 1, duration: .5, stagger: .14, ease: 'power1.out' }, 1)
    .fromTo(chars('.fv__copy--a'), { y: -24 }, { y: 0, duration: .5, stagger: .14, ease: 'power2.out' }, 1)

    // 2.6 → 3.8 : balcony view + ひとりじめする。
    .fromTo('.fv__img--2', { opacity: 0, scale: 1.14 }, { opacity: 1, scale: 1, duration: 1.6, ease: 'power1.out' }, 2.5)
    .to(chars('.fv__copy--b'), { opacity: 1, duration: .5, stagger: .12, ease: 'power1.out' }, 3)
    .fromTo(chars('.fv__copy--b'), { y: -24 }, { y: 0, duration: .5, stagger: .12, ease: 'power2.out' }, 3)

    // 4.6 : copy out
    .to(chars('.fv__copy--a, .fv__copy--b'), { opacity: 0, y: 20, duration: .5, stagger: .03, ease: 'power1.in' }, 4.6)
    .to('.fv__shade', { backgroundColor: 'rgba(10,10,9,.62)', duration: .8 }, 4.9)

    // 5.2 → 7 : sauna window opens to full frame
    .to('.fv__window', { opacity: 1, duration: .3 }, 5.2)
    .fromTo('.fv__window', { clipPath: 'inset(32% 38% 32% 38%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.8, ease: 'power2.inOut' }, 5.3)
    .fromTo('.fv__img--3', { scale: 1.35 }, { scale: 1, duration: 1.8, ease: 'power2.inOut' }, 5.3)
    .to('.fv__shade', { backgroundColor: 'rgba(10,10,9,.4)', duration: 1 }, 6)
    .to(chars('.fv__copy--c'), { opacity: 1, duration: .4, stagger: .08, ease: 'power1.out' }, 6.4)

    // 7.6 → 8.6 : löyly + final message
    .to(chars('.fv__copy--c'), { opacity: 0, duration: .4, stagger: .02 }, 7.8)
    .fromTo('.fv__img--4', { opacity: 0, scale: 1.08 }, { opacity: 1, scale: 1, duration: 1.2, ease: 'power1.out' }, 7.9)
    .to('.fv__shade', { backgroundColor: 'rgba(10,10,9,.45)', duration: 1 }, 7.9)
    .fromTo('.fv__final', { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 1, ease: 'power2.out' }, 8.5)
    .to('.fv__peaks li', { opacity: 1, duration: .5, stagger: .14 }, 8.9)

    // hold
    .to({}, { duration: 1.2 });

  /* ---------- header & sp bar state ---------- */
  ScrollTrigger.create({
    trigger: '#concept',
    start: 'top 85%',
    onEnter: () => { header.classList.add('is-solid'); $('.sp-bar').classList.add('is-show'); },
    onLeaveBack: () => { header.classList.remove('is-solid'); $('.sp-bar').classList.remove('is-show'); }
  });

  /* ---------- reveals ---------- */
  ScrollTrigger.batch('.reveal', {
    start: 'top 88%',
    once: true,
    onEnter: els => gsap.to(els, { opacity: 1, y: 0, duration: 1.3, stagger: .12, ease: 'power3.out' })
  });
  ScrollTrigger.batch('.reveal-img', {
    start: 'top 88%',
    once: true,
    onEnter: els => gsap.to(els, { opacity: 1, clipPath: 'inset(0% 0 0 0)', duration: 1.6, stagger: .15, ease: 'power3.out' })
  });

  /* ---------- parallax ---------- */
  [['.sauna__hero-img', '.sauna__hero'], ['.reserve__bg', '.reserve']].forEach(([img, wrap]) => {
    gsap.fromTo(img, { yPercent: -6 }, {
      yPercent: 6, ease: 'none',
      scrollTrigger: { trigger: wrap, start: 'top bottom', end: 'bottom top', scrub: true }
    });
  });
  $$('.step figure img').forEach(img => {
    gsap.fromTo(img, { scale: 1.12 }, {
      scale: 1, ease: 'none',
      scrollTrigger: { trigger: img, start: 'top bottom', end: 'bottom 40%', scrub: true }
    });
  });

  addEventListener('load', () => ScrollTrigger.refresh());
})();
