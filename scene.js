// Fixed 3D scene: 216 parts that disassemble and re-assemble into a new
// formation as each [data-stage] section scrolls into view.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const canvas = document.getElementById('scene');
const hudState = document.getElementById('hudState');
const N = 216, G = 6;
const BG = 0x06080b;

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
} catch (e) {
  canvas.style.display = 'none';
  throw e;
}
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.setClearColor(BG, 1);

const scene = new THREE.Scene();
scene.background = new THREE.Color(BG);
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 200);
camera.position.set(0, 0, 27);

const key = new THREE.DirectionalLight(0xffffff, 2.2); key.position.set(-6, 9, 8); scene.add(key);
const rim = new THREE.PointLight(0x6ee7ff, 220, 60); rim.position.set(10, -2, 6); scene.add(rim);
const fill = new THREE.PointLight(0x3a6cff, 90, 60); fill.position.set(-12, -6, -4); scene.add(fill);

/* ---------- deterministic random ---------- */
let seed = 1337;
const rnd = () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const R = Array.from({ length: N }, () => ({ a: rnd(), b: rnd(), c: rnd(), dir: new THREE.Vector3(rnd() - .5, rnd() - .5, rnd() - .5).normalize() }));
const perm = Array.from({ length: N }, (_, i) => i).sort(() => rnd() - .5);

/* ---------- formations ---------- */
const E = new THREE.Euler(), V = new THREE.Vector3();
function make(fn) {
  const f = { pos: new Float32Array(N * 3), quat: new Float32Array(N * 4), scl: new Float32Array(N * 3) };
  const p = new THREE.Vector3(), q = new THREE.Quaternion(), s = new THREE.Vector3();
  for (let i = 0; i < N; i++) {
    p.set(0, 0, 0); q.identity(); s.set(1, 1, 1);
    fn(i, p, q, s);
    p.toArray(f.pos, i * 3); q.toArray(f.quat, i * 4); s.toArray(f.scl, i * 3);
  }
  return f;
}
const cell = (i, p) => p.set(i % G - 2.5, Math.floor(i / G) % G - 2.5, Math.floor(i / (G * G)) - 2.5);
const FORMS = [
  // 0 · assembled core
  make((i, p, q, s) => { cell(i, p).multiplyScalar(1.03); s.setScalar(.95); }),
  // 1 · exploded view: layers pulled apart
  make((i, p, q, s) => {
    cell(i, p); p.y *= 2.5; p.x *= 1.55; p.z *= 1.55;
    p.addScaledVector(R[i].dir, .35);
    if (R[i].a > .7) q.setFromEuler(E.set(R[i].b * 1.2, R[i].c * 1.2, 0));
    s.setScalar(.82);
  }),
  // 2 · neural sphere
  make((i, p, q, s) => {
    const k = perm[i], y = 1 - (k + .5) / N * 2, r = Math.sqrt(1 - y * y), th = k * 2.399963;
    p.set(Math.cos(th) * r, y, Math.sin(th) * r).multiplyScalar(4.6);
    q.setFromUnitVectors(V.set(0, 0, 1), p.clone().normalize());
    s.set(.42, .42, .16 + R[i].a * .9);
  }),
  // 3 · screen wall
  make((i, p, q, s) => {
    const k = perm[i], c = k % 18, r = Math.floor(k / 18);
    p.set((c - 8.5) * 1.06, (r - 5.5) * 1.06, 0); p.z = -0.022 * p.x * p.x;
    q.setFromEuler(E.set(0, -p.x * .045, 0));
    s.set(1, 1, .14);
  }),
  // 4 · pipeline helix
  make((i, p, q, s) => {
    const t = i / N, a = i * .42;
    p.set((t - .5) * 32, Math.cos(a) * 2.5, Math.sin(a) * 2.5);
    q.setFromEuler(E.set(a, 0, 0));
    s.set(.5, .5, .5);
  })
];

/* ---------- stages (one per [data-stage] section, in DOM order) ---------- */
const STAGES = [
  { name: 'ENSAMBLADO',      f: 0, x: 5.2, y: 0,   s: .82, rot: [.52, .62, 0],  spin: [0, .16, 0],  op: 1 },
  { name: 'DESPIECE',        f: 1, x: 5.6, y: 0,   s: .6,  rot: [.22, .5, 0],   spin: [0, .12, 0],  op: 1 },
  { name: 'RED NEURONAL',    f: 2, x: 5.8, y: 1.2, s: .95, rot: [.2, 0, .25],   spin: [0, .14, 0],  op: .8 },
  { name: 'PANTALLA',        f: 3, x: 0,   y: .6,  s: 1.05, rot: [-.12, 0, 0],  spin: [0, 0, 0],    op: .2 },
  { name: 'EN ESPERA',       f: 4, x: 0,   y: 0,   s: .8,  rot: [0, 0, 0],      spin: [.2, 0, 0],   op: 0 },
  { name: 'LÍNEA DE MONTAJE', f: 4, x: 0,  y: -5, s: .78, rot: [0, 0, -.1],   spin: [.3, 0, 0],   op: .9 },
  { name: 'ENSAMBLADO',      f: 0, x: 5.4, y: 2.6, s: .8,  rot: [.52, .62, 0],  spin: [.08, .2, 0], op: 1 }
];
const sections = [...document.querySelectorAll('[data-stage]')];

/* ---------- meshes: dark metal body + a few emissive parts ---------- */
const geo = new RoundedBoxGeometry(1, 1, 1, 3, .09);
const bodyMat = new THREE.MeshStandardMaterial({ color: 0x1b232b, metalness: .9, roughness: .3, envMapIntensity: 1.1 });
const glowMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(.15, 1.4, 1.9), toneMapped: false });
const isGlow = R.map((r) => r.c > .9);
const nGlow = isGlow.filter(Boolean).length;
const body = new THREE.InstancedMesh(geo, bodyMat, N - nGlow);
const glow = new THREE.InstancedMesh(geo, glowMat, nGlow);
const slot = []; { let b = 0, g = 0; for (let i = 0; i < N; i++) slot.push(isGlow[i] ? g++ : b++); }
const group = new THREE.Group();
group.add(body, glow);
scene.add(group);

/* ---------- post ---------- */
let composer = null, narrow = false;
function setup() {
  const w = innerWidth, h = innerHeight;
  narrow = w < 821;
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, narrow ? 1.5 : 2));
  renderer.setSize(w, h, false);
  camera.aspect = w / h; camera.updateProjectionMatrix();
  composer = null;
  if (!narrow) {
    try {
      composer = new EffectComposer(renderer);
      composer.addPass(new RenderPass(scene, camera));
      composer.addPass(new UnrealBloomPass(new THREE.Vector2(w, h), .7, .75, .82));
      composer.addPass(new OutputPass());
    } catch (e) { composer = null; }
  }
}
setup();
let rz; addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(setup, 180); });

/* ---------- interaction state ---------- */
const mouse = { x: 0, y: 0 }, sm = { x: 0, y: 0 };
addEventListener('pointermove', (e) => { mouse.x = e.clientX / innerWidth - .5; mouse.y = e.clientY / innerHeight - .5; }, { passive: true });
let burstTarget = 0, burst = 0;
addEventListener('sarp:burst', (e) => { burstTarget = e.detail ? 1 : 0; });
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- frame ---------- */
const pA = new THREE.Vector3(), pB = new THREE.Vector3(), sA = new THREE.Vector3(), sB = new THREE.Vector3();
const qA = new THREE.Quaternion(), qB = new THREE.Quaternion(), M = new THREE.Matrix4();
const lerp = (a, b, t) => a + (b - a) * t;
const ease = (t) => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
let stageSmooth = 0, lastName = '';
const clock = new THREE.Clock();

function stageFloat() {
  // each section boundary is crossed over one viewport of scrolling
  const vh = innerHeight; let sf = 0;
  for (let k = 1; k < sections.length; k++) sf += Math.min(1, Math.max(0, (vh * .8 - sections[k].getBoundingClientRect().top) / vh));
  return sf;
}

function frame() {
  requestAnimationFrame(frame);
  if (document.hidden) return;
  const time = reduce ? 4 : clock.getElapsedTime();
  const target = stageFloat();
  stageSmooth += (target - stageSmooth) * (reduce ? 1 : .04);
  const a = Math.min(STAGES.length - 1, Math.floor(stageSmooth)), b = Math.min(STAGES.length - 1, a + 1);
  // hold each formation, transition in the middle of the boundary
  const t = Math.min(1, Math.max(0, (stageSmooth - a - .12) / .76));
  const A = STAGES[a], B = STAGES[b], FA = FORMS[A.f], FB = FORMS[B.f];
  burst += (burstTarget - burst) * .07;
  sm.x += (mouse.x - sm.x) * .03; sm.y += (mouse.y - sm.y) * .03;

  const name = t > .08 && t < .92 && A.name !== B.name ? 'RECONFIGURANDO' : (t < .5 ? A : B).name;
  if (name !== lastName && hudState) { hudState.textContent = name; lastName = name; }

  const te = ease(t);
  const op = lerp(A.op, B.op, te) * (narrow ? .5 : 1);
  renderer.toneMappingExposure = Math.max(.001, op * 1.15);
  const gk = op < .5 ? op * 1.6 : .8 + (op - .5) * .4;
  glowMat.color.setRGB(.15 * gk, 1.4 * gk, 1.9 * gk);

  const side = narrow ? 0 : 1;
  group.position.set(lerp(A.x, B.x, te) * side, lerp(A.y, B.y, te) * (narrow ? .4 : 1) + (narrow ? 1.5 : 0), 0);
  group.scale.setScalar(lerp(A.s, B.s, te) * (narrow ? .62 : 1));
  // gentle bounded sway instead of continuous spin, so a stage change never whips the model around
  const sway = Math.sin(time * .22) * 2.2;
  group.rotation.set(
    lerp(A.rot[0] + A.spin[0] * sway, B.rot[0] + B.spin[0] * sway, te) + sm.y * .1,
    lerp(A.rot[1] + A.spin[1] * sway, B.rot[1] + B.spin[1] * sway, te) + sm.x * .14,
    lerp(A.rot[2] + A.spin[2] * sway, B.rot[2] + B.spin[2] * sway, te)
  );

  const same = FA === FB;
  for (let i = 0; i < N; i++) {
    const r = R[i];
    // staggered per-part timing: parts leave and arrive one after another
    const ti = same ? 0 : ease(Math.min(1, Math.max(0, t * 1.35 - r.a * .35)));
    pA.fromArray(FA.pos, i * 3); qA.fromArray(FA.quat, i * 4); sA.fromArray(FA.scl, i * 3);
    if (!same) {
      pB.fromArray(FB.pos, i * 3); qB.fromArray(FB.quat, i * 4); sB.fromArray(FB.scl, i * 3);
      pA.lerp(pB, ti); qA.slerp(qB, ti); sA.lerp(sB, ti);
      const arc = Math.sin(Math.PI * ti);
      pA.addScaledVector(r.dir, arc * .7);
      qA.multiply(qB.setFromAxisAngle(r.dir, arc * (r.b - .5) * 1.1));
    }
    if (burst > .001) { pA.multiplyScalar(1 + burst * (.6 + r.b * 1.6)); pA.addScaledVector(r.dir, burst * 2.5); qA.multiply(qB.setFromAxisAngle(r.dir, burst * (r.a - .5) * 4)); }
    pA.y += Math.sin(time * .9 + r.c * 20) * .04;
    M.compose(pA, qA, sA);
    (isGlow[i] ? glow : body).setMatrixAt(slot[i], M);
  }
  body.instanceMatrix.needsUpdate = true;
  glow.instanceMatrix.needsUpdate = true;

  if (op < .01) { renderer.clear(); return; }
  composer ? composer.render() : renderer.render(scene, camera);
}
requestAnimationFrame(frame);
