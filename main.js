(() => {
'use strict';
document.documentElement.classList.add('js');

const PROJECTS = [
  { slug: 'sercom',      name: 'SERCOM',                kind: 'Ingeniería y gestión de negocios', type: 'Sitio corporativo',     year: '2025' },
  { slug: 'csa',         name: 'Ingeniería CSA',        kind: 'Movimientos de tierra',            type: 'Sitio corporativo',     year: '2024' },
  { slug: 'optica',      name: 'Óptica San Pedro',      kind: 'Óptica y salud visual',            type: 'Sitio comercial',       year: '2023' },
  { slug: 'sabra',       name: 'Sabra',                 kind: 'Gestión inmobiliaria',             type: 'Portal de propiedades', year: '2023' },
  { slug: 'dolor',       name: 'Tratamiento del Dolor', kind: 'Dr. German Acuña',                 type: 'Sitio médico',          year: '2025' },
  { slug: 'audiosalud',  name: 'Audiosalud Regional',   kind: 'Salud auditiva',                   type: 'Sitio clínico',         year: '2023' },
  { slug: 'citsalud',    name: 'Citsalud',              kind: 'Centro médico',                    type: 'Reserva de horas',      year: '2022' },
  { slug: 'capas',       name: 'CapasChile',            kind: 'Belleza y cuidado capilar',        type: 'E-commerce',            year: '2023' },
  { slug: 'nvm',         name: 'NVM Arquitectos',       kind: 'Arquitectura',                     type: 'Portafolio',            year: '2024' },
  { slug: 'puntomatica', name: 'Puntomatica',           kind: 'Vending y mini-market 24/7',       type: 'Sitio corporativo',     year: '2026' }
];

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const desktop = matchMedia('(min-width: 821px)');
$('#yr').textContent = new Date().getFullYear();

/* ---------- smooth scroll ---------- */
let lenis = null;
if (!reduce && window.Lenis) {
  lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
  const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
  requestAnimationFrame(raf);
}
const scrollToY = (y) => (lenis ? lenis.scrollTo(y, { duration: 1.4 }) : scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' }));
$$('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
  const el = $(a.getAttribute('href'));
  if (!el) return;
  e.preventDefault();
  scrollToY(el.getBoundingClientRect().top + scrollY);
}));

/* ---------- console tabs + typewriter ---------- */
const tabs = $$('.console-tab'), panes = $$('.console-pane');
let typeTimer = null;
function typePane(pane) {
  clearInterval(typeTimer);
  const el = $('[data-typed]', pane);
  if (!el) return;
  const text = el.dataset.typed;
  if (reduce) { el.textContent = text; return; }
  el.textContent = '';
  let i = 0;
  typeTimer = setInterval(() => {
    el.textContent = text.slice(0, ++i);
    if (i >= text.length) clearInterval(typeTimer);
  }, 42);
}
function activate(name) {
  tabs.forEach((t) => t.classList.toggle('is-active', t.dataset.pane === name));
  panes.forEach((p) => { const on = p.dataset.pane === name; p.classList.toggle('is-active', on); if (on) typePane(p); });
}
tabs.forEach((t) => t.addEventListener('click', () => { activate(t.dataset.pane); clearInterval(autoTab); }));
activate('web');
let tabI = 0;
const autoTab = setInterval(() => { tabI = (tabI + 1) % tabs.length; activate(tabs[tabI].dataset.pane); }, 5200);

/* ---------- reveals + counters ---------- */
const io = new IntersectionObserver((es) => es.forEach((e) => {
  if (!e.isIntersecting) return;
  e.target.classList.add('is-in');
  io.unobserve(e.target);
}), { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
$$('[data-reveal]').forEach((el, i) => { el.style.transitionDelay = (i % 4) * 70 + 'ms'; io.observe(el); });

const cio = new IntersectionObserver((es) => es.forEach((e) => {
  if (!e.isIntersecting) return;
  cio.unobserve(e.target);
  const el = e.target, to = +el.dataset.count, from = +el.textContent, t0 = performance.now(), dur = 1500;
  if (reduce) { el.textContent = to; return; }
  const tick = (now) => {
    const k = clamp((now - t0) / dur), ease = 1 - Math.pow(1 - k, 4);
    el.textContent = Math.round(from + (to - from) * ease);
    if (k < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}), { threshold: 0.6 });
$$('[data-count]').forEach((el) => cio.observe(el));

/* ---------- manifesto: words light up with scroll ---------- */
const man = $('#manifesto');
man.innerHTML = man.textContent.trim().split(/\s+/).map((w) => `<span class="w">${w}</span>`).join(' ');
const words = $$('.w', man);

/* ---------- portfolio deck ---------- */
const deck = $('#deck'), flow = $('#flow');
deck.innerHTML = PROJECTS.map((p, i) => `
  <a class="wcard" href="proyecto-${p.slug}.html">
    <div class="wcard__frame">
      <div class="wcard__bar"><i></i><i></i><i></i><span>sarp / ${p.slug}</span></div>
      <img src="assets/img/${p.slug}.webp" alt="Sitio web ${p.name}" loading="${i < 2 ? 'eager' : 'lazy'}" decoding="async">
    </div>
    <div class="wcard__cap"><div><b>${p.name}</b><small>${p.kind}</small></div><em>${p.type} · ${p.year}</em></div>
  </a>`).join('');
const cards = $$('.wcard', deck), caps = cards.map((c) => $('.wcard__cap', c));
const flowIdx = $('#flowIdx'), flowBar = $('#flowBar');

function paintFlow(vh) {
  if (!desktop.matches) return;
  const r = flow.getBoundingClientRect();
  if (r.bottom < -vh || r.top > vh * 2) return;
  const p = clamp(-r.top / (r.height - vh));
  const raw = p * (cards.length - 1), fi = Math.floor(raw), fr = raw - fi;
  // dwell on each project, then flip quickly to the next
  const f = fi + clamp((fr - 0.3) / 0.4) ** 2 * (3 - 2 * clamp((fr - 0.3) / 0.4));
  const W = cards[0].offsetWidth;
  cards.forEach((c, i) => {
    const d = i - f, ad = Math.abs(d), sg = Math.sign(d);
    const x = sg * (Math.min(ad, 1) * 0.86 + Math.max(ad - 1, 0) * 0.22) * W;
    const z = -Math.min(ad, 1) * 360 - Math.max(Math.min(ad, 3) - 1, 0) * 260;
    const ry = -clamp(d, -1, 1) * 58;
    c.style.transform = `translate3d(${x.toFixed(1)}px,-50%,${z.toFixed(1)}px) rotateY(${ry.toFixed(2)}deg)`;
    c.style.opacity = ad > 2.6 ? 0 : clamp(1.25 - ad * 0.42).toFixed(3);
    c.style.zIndex = 100 - Math.round(ad * 10);
    c.style.pointerEvents = ad < 0.5 ? 'auto' : 'none';
    caps[i].style.opacity = clamp(1 - ad * 1.6).toFixed(3);
  });
  flowIdx.textContent = String(Math.round(f) + 1).padStart(2, '0');
  flowBar.style.transform = `scaleX(${p})`;
}
desktop.addEventListener('change', () => cards.forEach((c, i) => { c.removeAttribute('style'); caps[i].removeAttribute('style'); }));

/* ---------- services accordion ---------- */
const acc = $('#servicios'), stack = $('#accStack');
const accCards = $$('.accordion-card', stack), accTabs = $$('.acc-tab');
function paintAcc(vh) {
  const r = acc.getBoundingClientRect();
  if (r.bottom < 0 || r.top > vh) return;
  const p = clamp(-r.top / (r.height - vh));
  const n = accCards.length, H = stack.offsetHeight, collapsed = desktop.matches ? 84 : 62;
  const seg = p * (n - 1);
  accCards.forEach((card, i) => {
    if (!i) return;
    const local = clamp(seg - (i - 1)), e = 1 - Math.pow(1 - local, 3);
    card.style.setProperty('--card-y', ((H + collapsed) + (i * collapsed - (H + collapsed)) * e).toFixed(1) + 'px');
  });
  const active = Math.round(seg);
  accTabs.forEach((t, i) => t.classList.toggle('is-active', i === active));
}
accTabs.forEach((t, i) => t.addEventListener('click', () => {
  const top = acc.getBoundingClientRect().top + scrollY;
  scrollToY(top + (acc.offsetHeight - innerHeight) * (i / (accTabs.length - 1)));
}));

/* ---------- IA iframes: lazy-load + fit ---------- */
const frames = $$('iframe[data-fit]');
const fit = () => frames.forEach((fr) => {
  const box = fr.parentNode.getBoundingClientRect();
  if (!box.width) return;
  const s = Math.max(box.width / 1200, box.height / 675);
  fr.style.transform = `translate(${(box.width - 1200 * s) / 2}px, ${(box.height - 675 * s) / 2 + parseFloat(fr.dataset.fitDy || '0')}px) scale(${s})`;
});
fit(); addEventListener('resize', fit);
const fio = new IntersectionObserver((es) => es.forEach((e) => {
  if (e.isIntersecting && !e.target.src) { e.target.src = e.target.dataset.anim; fio.unobserve(e.target); }
}), { rootMargin: '500px' });
frames.forEach((f) => fio.observe(f));

/* ---------- per-frame scroll painting ---------- */
const header = $('#header'), hudBar = $('#hudBar'), hudPct = $('#hudPct');
let lastY = -1, navY = 0;
function frame() {
  const y = scrollY;
  if (y !== lastY) {
    const vh = innerHeight;
    header.classList.toggle('is-hidden', y > navY && y > 300);
    navY = y; lastY = y;
    const total = clamp(y / (document.documentElement.scrollHeight - vh));
    hudBar.style.transform = `scaleY(${total})`;
    hudPct.textContent = String(Math.round(total * 100)).padStart(3, '0');
    if (!reduce) {
      const mr = man.getBoundingClientRect();
      const mp = (vh * 0.82 - mr.top) / (mr.height + vh * 0.35);
      words.forEach((w, i) => { w.style.opacity = (0.14 + 0.86 * clamp((mp - i / words.length) * 6)).toFixed(2); });
    }
    paintFlow(vh);
    paintAcc(vh);
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
addEventListener('resize', () => { lastY = -1; });

/* ---------- contact ---------- */
$('#form').addEventListener('submit', (e) => {
  e.preventDefault();
  const f = e.target, g = (n) => (f.elements[n] ? f.elements[n].value.trim() : '');
  const body = `Nombre: ${g('nombre')}\nCorreo: ${g('correo')}\nTeléfono: ${g('telefono')}\n\n${g('mensaje')}`;
  const note = $('#formNote'); note.style.opacity = '1'; setTimeout(() => { note.style.opacity = '0'; }, 5000);
  location.href = 'mailto:seba.romanp@gmail.com?subject=' + encodeURIComponent('Nuevo contacto desde la web — ' + (g('nombre') || 'sin nombre')) + '&body=' + encodeURIComponent(body);
});
const burstBtn = $('#burstBtn');
burstBtn.addEventListener('click', () => {
  const on = burstBtn.getAttribute('aria-pressed') !== 'true';
  burstBtn.setAttribute('aria-pressed', String(on));
  burstBtn.textContent = on ? '[ Armar núcleo ]' : '[ Desarmar núcleo ]';
  dispatchEvent(new CustomEvent('sarp:burst', { detail: on }));
});
})();
