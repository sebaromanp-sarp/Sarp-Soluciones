(() => {
'use strict';
const root = document.documentElement;
root.classList.add('js');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

/* staggered entrance */
$$('[data-in]').forEach((el, i) => el.style.setProperty('--d', i));
requestAnimationFrame(() => requestAnimationFrame(() => document.body.classList.add('is-ready')));

/* screenshot assembles from slices, piece by piece */
const box = $('[data-assemble]');
if (box && !reduce) {
  const img = $('img', box), N = 8;
  const build = () => {
    box.classList.add('is-building');
    const strips = [];
    for (let i = 0; i < N; i++) {
      const s = img.cloneNode();
      s.className = 'strip'; s.alt = ''; s.setAttribute('aria-hidden', 'true');
      s.style.setProperty('--i', i);
      // 0.2% overlap hides hairlines between slices
      s.style.setProperty('--a', Math.max(0, i * 100 / N - .2) + '%');
      s.style.setProperty('--b', Math.max(0, 100 - (i + 1) * 100 / N - .2) + '%');
      s.style.setProperty('--dx', (i % 2 ? 9 : -9) + '%');
      s.style.setProperty('--ry', (i % 2 ? -32 : 32) + 'deg');
      box.appendChild(s); strips.push(s);
    }
    const done = () => { box.classList.remove('is-building'); strips.forEach((s) => s.remove()); };
    strips[N - 1].addEventListener('animationend', done, { once: true });
    setTimeout(done, 3000);
  };
  if (img.complete && img.naturalWidth) build();
  else { img.addEventListener('load', build, { once: true }); }
}

/* gentle tilt of the browser frame */
const tilt = $('[data-tilt]');
if (tilt && !reduce && matchMedia('(min-width: 901px) and (pointer: fine)').matches) {
  let tx = 0, ty = 0, x = 0, y = 0, running = false;
  const step = () => {
    x += (tx - x) * .06; y += (ty - y) * .06;
    tilt.style.setProperty('--mx', x.toFixed(4)); tilt.style.setProperty('--my', y.toFixed(4));
    if (Math.abs(tx - x) + Math.abs(ty - y) > .001) requestAnimationFrame(step); else running = false;
  };
  addEventListener('pointermove', (e) => {
    tx = e.clientX / innerWidth - .5; ty = e.clientY / innerHeight - .5;
    if (!running) { running = true; requestAnimationFrame(step); }
  }, { passive: true });
}

/* gallery reveal + lightbox */
const shots = $$('.shot');
if (shots.length) {
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
  }), { threshold: .12 });
  shots.forEach((s, i) => { s.style.transitionDelay = (i % 2) * 90 + 'ms'; io.observe(s); });

  const lb = $('#lightbox'), lbImg = $('img', lb);
  let opener = null;
  const open = (fig) => { const im = $('img', fig); lbImg.src = im.src; lbImg.alt = im.alt; lb.hidden = false; opener = fig; $('button', lb).focus(); };
  const close = () => { lb.hidden = true; if (opener) opener.focus(); opener = null; };
  shots.forEach((fig) => {
    fig.addEventListener('click', () => open(fig));
    fig.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(fig); } });
  });
  lb.addEventListener('click', close);
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && !lb.hidden) close(); });
}
})();
