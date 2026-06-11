import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

// ---------------------------
// Config
// ---------------------------
const COLORS = {
  navy: 0x1a365d,
  gold: 0xc9a227,
  teal: 0x4a9b9b,
};

const waLinks = {
  primary:
    "https://wa.me/6281225345030?text=Halo%20Giri%20Jaya%20Alumindo,%20saya%20tertarik%20untuk%20konsultasi%20tentang%20%5Bproyek%20saya%5D.%20Bisa%20dibantu%3F",
  secondary: "https://wa.me/6287805461022?text=Halo,%20saya%20ingin%20menanyakan%20tentang%20...",
};

// ---------------------------
// Helpers
// ---------------------------
const $ = (q, el = document) => el.querySelector(q);
const $$ = (q, el = document) => Array.from(el.querySelectorAll(q));

function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function makeSoftCircleTexture(size = 128) {
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const ctx = c.getContext("2d");
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, "rgba(255,255,255,0.9)");
  g.addColorStop(0.35, "rgba(255,255,255,0.30)");
  g.addColorStop(1, "rgba(255,255,255,0.0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

// ---------------------------
// DOM init
// ---------------------------
$("#year").textContent = new Date().getFullYear();
$("#waPrimaryHero").href = waLinks.primary;
$("#waPrimaryFinal").href = waLinks.primary.replace("%5Bproyek%20saya%5D", "%5BKusen%20Aluminium%2FPintu%20Engineering%2FKanopi%20Kaca%2Fdll%5D");
$("#waSecondaryFinal").href = waLinks.secondary;
$("#waSticky").href = $("#waPrimaryFinal").href;

// ---------------------------
// Custom cursor (desktop)
// ---------------------------
const cursor = $("#cursor");
let cursorX = window.innerWidth / 2;
let cursorY = window.innerHeight / 2;
let cursorTX = cursorX;
let cursorTY = cursorY;

const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
if (canHover) {
  cursor.classList.add("is-on");
  window.addEventListener("mousemove", (e) => {
    cursorTX = e.clientX;
    cursorTY = e.clientY;
  });
  const hoverables = ["a", "button", ".card3d", ".pillar", ".carBtn", ".beforeAfter__imgs"];
  hoverables.forEach((sel) => {
    $$(sel).forEach((el) => {
      el.addEventListener("mouseenter", () => cursor.classList.add("is-hover"));
      el.addEventListener("mouseleave", () => cursor.classList.remove("is-hover"));
    });
  });
}

function tickCursor() {
  cursorX = lerp(cursorX, cursorTX, 0.18);
  cursorY = lerp(cursorY, cursorTY, 0.18);
  if (canHover) cursor.style.transform = `translate(${cursorX}px, ${cursorY}px) translate(-50%, -50%)`;
}

// ---------------------------
// Audio: autoplay after interaction + mute
// ---------------------------
const audio = $("#bg-music");
const muteBtn = $("#muteBtn");
let audioReady = false;

function tryStartAudio() {
  if (!audio || audioReady) return;
  audio.volume = 0.18;
  const p = audio.play();
  if (p && typeof p.then === "function") {
    p.then(() => {
      audioReady = true;
      muteBtn.classList.remove("is-muted");
    }).catch(() => {
      // file mungkin belum ada, atau autoplay ditolak; biarkan saja.
      muteBtn.classList.add("is-muted");
    });
  } else {
    audioReady = true;
  }
}

["pointerdown", "keydown", "touchstart", "wheel"].forEach((ev) =>
  window.addEventListener(
    ev,
    () => {
      tryStartAudio();
    },
    { once: true, passive: true },
  ),
);

muteBtn.addEventListener("click", () => {
  if (!audio) return;
  if (audio.paused) {
    tryStartAudio();
    muteBtn.classList.remove("is-muted");
    return;
  }
  audio.muted = !audio.muted;
  muteBtn.classList.toggle("is-muted", audio.muted);
});

// ---------------------------
// Smooth scroll: Lenis + GSAP sync
// ---------------------------
gsap.registerPlugin(ScrollTrigger);
const lenis = new Lenis({
  duration: 1.12,
  easing: (t) => 1 - Math.pow(1 - t, 3),
  wheelMultiplier: 1.0,
  smoothWheel: true,
});

lenis.on("scroll", () => {
  ScrollTrigger.update();
});

function rafLenis(time) {
  lenis.raf(time);
  requestAnimationFrame(rafLenis);
}
requestAnimationFrame(rafLenis);

// ---------------------------
// Three.js scene
// ---------------------------
const canvas = $("#bg3d");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x070a12, 0.045);

const camera = new THREE.PerspectiveCamera(46, window.innerWidth / window.innerHeight, 0.1, 120);
camera.position.set(0.0, 0.4, 7.4);

const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;

const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
keyLight.position.set(6, 7, 5);
scene.add(keyLight);

const rimLight = new THREE.DirectionalLight(0xffffff, 1.4);
rimLight.position.set(-6, 2, -3);
scene.add(rimLight);

const fill = new THREE.AmbientLight(0xffffff, 0.55);
scene.add(fill);

// Group root
const root = new THREE.Group();
scene.add(root);

// Aluminum frame (procedural)
function makeFrame() {
  const g = new THREE.Group();
  const beamGeo = new THREE.BoxGeometry(3.8, 0.18, 0.18);
  const beamGeoV = new THREE.BoxGeometry(0.18, 2.4, 0.18);

  const aluMat = new THREE.MeshStandardMaterial({
    color: 0xb9c6d8,
    metalness: 0.92,
    roughness: 0.25,
    envMapIntensity: 1.1,
  });

  const top = new THREE.Mesh(beamGeo, aluMat);
  top.position.set(0, 1.25, 0);
  const bottom = new THREE.Mesh(beamGeo, aluMat);
  bottom.position.set(0, -1.25, 0);
  const left = new THREE.Mesh(beamGeoV, aluMat);
  left.position.set(-1.9, 0, 0);
  const right = new THREE.Mesh(beamGeoV, aluMat);
  right.position.set(1.9, 0, 0);

  // inner brace
  const brace = new THREE.Mesh(new THREE.BoxGeometry(0.14, 2.0, 0.14), aluMat);
  brace.position.set(0, 0, 0);

  g.add(top, bottom, left, right, brace);
  g.rotation.x = THREE.MathUtils.degToRad(10);
  return g;
}

const frame = makeFrame();
root.add(frame);

// Floating glass panels
function makeGlassPanel(w, h) {
  const geo = new THREE.PlaneGeometry(w, h, 1, 1);
  const mat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(COLORS.teal),
    metalness: 0.0,
    roughness: 0.12,
    transmission: 0.96,
    thickness: 0.6,
    ior: 1.45,
    envMapIntensity: 1.1,
    clearcoat: 0.6,
    clearcoatRoughness: 0.15,
    opacity: 0.95,
    transparent: true,
  });
  const m = new THREE.Mesh(geo, mat);
  return m;
}

const glassA = makeGlassPanel(2.3, 1.2);
glassA.position.set(-1.35, 0.55, 0.35);
glassA.rotation.y = THREE.MathUtils.degToRad(18);
root.add(glassA);

const glassB = makeGlassPanel(1.8, 1.0);
glassB.position.set(1.45, -0.25, 0.5);
glassB.rotation.y = THREE.MathUtils.degToRad(-22);
root.add(glassB);

const glassC = makeGlassPanel(1.2, 0.8);
glassC.position.set(0.2, 1.15, -0.2);
glassC.rotation.y = THREE.MathUtils.degToRad(8);
root.add(glassC);

// Subtle "dust" particles
const dustTex = makeSoftCircleTexture(128);
const dustCount = 900;
const dustGeo = new THREE.BufferGeometry();
const dustPos = new Float32Array(dustCount * 3);
const dustSeed = new Float32Array(dustCount);
for (let i = 0; i < dustCount; i++) {
  const r = 8.0 * Math.pow(Math.random(), 0.9);
  const a = Math.random() * Math.PI * 2;
  const y = (Math.random() - 0.5) * 5.0;
  dustPos[i * 3 + 0] = Math.cos(a) * r + (Math.random() - 0.5) * 0.6;
  dustPos[i * 3 + 1] = y;
  dustPos[i * 3 + 2] = Math.sin(a) * r - 2.0;
  dustSeed[i] = Math.random() * 10;
}
dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPos, 3));
dustGeo.setAttribute("aSeed", new THREE.BufferAttribute(dustSeed, 1));

const dustMat = new THREE.PointsMaterial({
  size: 0.06,
  map: dustTex,
  transparent: true,
  opacity: 0.35,
  depthWrite: false,
  color: 0xe7edf6,
  blending: THREE.AdditiveBlending,
});

const dust = new THREE.Points(dustGeo, dustMat);
scene.add(dust);

// ---------------------------
// Scroll choreography (depth layers)
// ---------------------------
const sceneTL = gsap.timeline({
  scrollTrigger: {
    trigger: "#smooth-root",
    start: "top top",
    end: "bottom bottom",
    scrub: true,
  },
});

// Hero -> About: push camera in & rotate slightly
sceneTL
  .to(camera.position, { z: 6.2, y: 0.55, x: -0.2, ease: "none" }, 0.0)
  .to(root.rotation, { y: THREE.MathUtils.degToRad(22), ease: "none" }, 0.05)
  .to(frame.rotation, { x: THREE.MathUtils.degToRad(14), ease: "none" }, 0.1)
  // Services: shift to right, show depth
  .to(camera.position, { x: 0.55, y: 0.15, z: 7.1, ease: "none" }, 0.33)
  .to(root.position, { x: -0.25, y: 0.08, z: 0.0, ease: "none" }, 0.33)
  .to(root.rotation, { y: THREE.MathUtils.degToRad(-18), ease: "none" }, 0.33)
  // Portfolio: rotate to face, a bit closer
  .to(camera.position, { x: 0.0, y: 0.35, z: 6.5, ease: "none" }, 0.55)
  .to(root.rotation, { y: THREE.MathUtils.degToRad(35), ease: "none" }, 0.55)
  // Why -> Testimonials: drift, cinematic
  .to(camera.position, { x: -0.45, y: 0.55, z: 7.6, ease: "none" }, 0.72)
  .to(root.rotation, { y: THREE.MathUtils.degToRad(65), ease: "none" }, 0.72)
  // CTA: center & subtle zoom
  .to(camera.position, { x: 0.0, y: 0.35, z: 6.0, ease: "none" }, 0.9)
  .to(root.rotation, { y: THREE.MathUtils.degToRad(90), ease: "none" }, 0.9);

// ---------------------------
// UI interactions
// ---------------------------
// Portfolio carousel (CSS 3D)
const track = $("#portfolioTrack");
const btnPrev = $(".carBtn--prev");
const btnNext = $(".carBtn--next");
let carIndex = 0;

function updateCarousel() {
  if (!track) return;
  const rot = -carIndex * 60;
  track.style.setProperty("--rot", `${rot}deg`);
}
btnPrev?.addEventListener("click", () => {
  carIndex = (carIndex - 1 + 6) % 6;
  updateCarousel();
});
btnNext?.addEventListener("click", () => {
  carIndex = (carIndex + 1) % 6;
  updateCarousel();
});
updateCarousel();

// Before/After slider
const ba = $("#ba");
const baClip = $("#baClip");
const baHandle = $("#baHandle");
let dragging = false;

function setBAFromClientX(clientX) {
  const r = ba.getBoundingClientRect();
  const pct = clamp(((clientX - r.left) / r.width) * 100, 8, 92);
  baClip.style.setProperty("--clip", `${pct}%`);
  baHandle.style.left = `${pct}%`;
}

function onDown(e) {
  dragging = true;
  ba.setPointerCapture?.(e.pointerId);
  setBAFromClientX(e.clientX);
}
function onMove(e) {
  if (!dragging) return;
  setBAFromClientX(e.clientX);
}
function onUp() {
  dragging = false;
}

if (ba) {
  ba.addEventListener("pointerdown", onDown);
  window.addEventListener("pointermove", onMove);
  window.addEventListener("pointerup", onUp);
}

// Testimonials carousel
const testiTrack = $("#testiTrack");
const testiDots = $("#testiDots");
const bubbles = $$(".bubble");
let testiIndex = 0;
let testiTimer = null;

function renderDots() {
  if (!testiDots) return;
  testiDots.innerHTML = "";
  bubbles.forEach((_, i) => {
    const d = document.createElement("span");
    d.className = `dot ${i === testiIndex ? "is-active" : ""}`;
    testiDots.appendChild(d);
  });
}

function updateTestimonials() {
  if (!testiTrack) return;
  const bubble = bubbles[0];
  const gap = 14;
  const w = bubble.getBoundingClientRect().width;
  const x = -(w + gap) * testiIndex;
  testiTrack.style.transform = `translateX(${x}px)`;
  renderDots();
}

function startTestiAuto() {
  if (!bubbles.length) return;
  testiTimer = window.setInterval(() => {
    testiIndex = (testiIndex + 1) % bubbles.length;
    updateTestimonials();
  }, 4200);
}

updateTestimonials();
startTestiAuto();

// ---------------------------
// Resize
// ---------------------------
function onResize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  renderer.setSize(w, h);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
window.addEventListener("resize", onResize, { passive: true });

// ---------------------------
// Render loop
// ---------------------------
const clock = new THREE.Clock();

function animate() {
  const t = clock.getElapsedTime();

  // Idle motion
  frame.rotation.y = t * 0.22;
  glassA.position.y = 0.55 + Math.sin(t * 0.9) * 0.08;
  glassB.position.y = -0.25 + Math.cos(t * 0.75) * 0.07;
  glassC.position.y = 1.15 + Math.sin(t * 0.85 + 1.2) * 0.06;

  // Dust drift
  const pos = dustGeo.attributes.position.array;
  for (let i = 0; i < dustCount; i++) {
    const idx = i * 3;
    const seed = dustSeed[i];
    pos[idx + 0] += Math.sin(t * 0.18 + seed) * 0.00045;
    pos[idx + 1] += Math.cos(t * 0.21 + seed) * 0.00035;
    if (pos[idx + 1] > 3.0) pos[idx + 1] = -3.0;
    if (pos[idx + 1] < -3.0) pos[idx + 1] = 3.0;
  }
  dustGeo.attributes.position.needsUpdate = true;

  tickCursor();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
animate();

// ---------------------------
// Loading screen (simulate, then hide)
// ---------------------------
const loading = $("#loading");
const bar = $(".loading__barFill");

gsap.to(bar, {
  width: "100%",
  duration: 1.4,
  ease: "power2.out",
  onComplete: () => {
    loading?.classList.add("is-hidden");
  },
});
