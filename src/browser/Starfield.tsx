import { useEffect, useRef } from 'react';
import { BufferAttribute, BufferGeometry, Mesh, PerspectiveCamera, PlaneGeometry, Points, Scene, ShaderMaterial, WebGLRenderer } from 'three';
import { seeded } from '../lib/random';

const COUNT = 1600;

// Mostly cool white, a little blue, a few warm stars and the odd amber one.
const WHITE = [0.81, 0.85, 1.0];
const BLUE = [0.62, 0.71, 1.0];
const WARM = [1.0, 0.83, 0.63];
const AMBER = [0.96, 0.64, 0.36];

const VERT = /* glsl */ `
attribute float aSize;
attribute float aPhase;
attribute vec3 aColor;
uniform float uTime;
uniform float uPixelRatio;
varying vec3 vColor;
varying float vAlpha;

void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;
  float depth = -mv.z;
  // Never below a pixel: sub-pixel points shimmer as they drift.
  gl_PointSize = max(aSize * uPixelRatio * (70.0 / depth), 1.0);
  vColor = aColor;
  // A slow, shallow twinkle - breathing, not blinking.
  float twinkle = 0.82 + 0.18 * sin(uTime * (0.35 + fract(aPhase) * 0.4) + aPhase);
  vAlpha = twinkle * clamp(80.0 / depth, 0.35, 1.0);
}
`;

const FRAG = /* glsl */ `
varying vec3 vColor;
varying float vAlpha;

void main() {
  float d = length(gl_PointCoord - 0.5);
  float glow = smoothstep(0.5, 0.0, d);
  float a = glow * glow * vAlpha;
  if (a < 0.01) discard;
  gl_FragColor = vec4(vColor, a);
}
`;

// A slow nebula behind the stars: domain-warped noise in the site's violet,
// teal and a touch of amber. Drawn as a full-screen quad, ignoring the camera.
const NEBULA_VERT = /* glsl */ `
void main() {
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

const NEBULA_FRAG = /* glsl */ `
precision mediump float;
uniform float uTime;
uniform vec2 uRes;
uniform vec2 uLean;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++) { v += a * noise(p); p = p * 2.03 + 17.0; a *= 0.5; }
  return v;
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y + uLean * 0.04;
  float t = uTime * 0.012;
  vec2 q = vec2(fbm(uv * 1.3 + t), fbm(uv * 1.3 - t + 3.1));
  float n = fbm(uv * 1.7 + q * 1.8 + vec2(t * 0.7, -t * 0.4));
  vec3 col = mix(vec3(0.36, 0.26, 0.70), vec3(0.12, 0.46, 0.50), smoothstep(0.3, 0.8, q.x));
  col = mix(col, vec3(0.92, 0.56, 0.28), smoothstep(0.66, 0.95, n) * 0.6);
  float a = smoothstep(0.32, 0.92, n) * 0.5;
  a *= 1.0 - smoothstep(0.7, 1.7, length(uv - vec2(-0.2, 0.1)));
  gl_FragColor = vec4(col, a);
}
`;

/** A seeded shell of stars around the camera, so the sky is the same every visit. */
function buildStars(): BufferGeometry {
  const rand = seeded(11);
  const position = new Float32Array(COUNT * 3);
  const color = new Float32Array(COUNT * 3);
  const size = new Float32Array(COUNT);
  const phase = new Float32Array(COUNT);

  for (let i = 0; i < COUNT; i++) {
    const u = rand() * 2 - 1;
    const theta = rand() * Math.PI * 2;
    const ring = Math.sqrt(1 - u * u);
    const r = 30 + Math.pow(rand(), 0.6) * 170;
    position.set([ring * Math.cos(theta) * r, u * r, ring * Math.sin(theta) * r], i * 3);

    const pick = rand();
    const c = pick > 0.97 ? AMBER : pick > 0.92 ? WARM : pick > 0.8 ? BLUE : WHITE;
    const bright = 0.45 + rand() * 0.55;
    color.set([c[0] * bright, c[1] * bright, c[2] * bright], i * 3);

    size[i] = rand() < 0.9 ? 1 + rand() * 1.6 : 2.6 + rand() * 1.8;
    phase[i] = rand() * Math.PI * 2;
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(position, 3));
  geometry.setAttribute('aColor', new BufferAttribute(color, 3));
  geometry.setAttribute('aSize', new BufferAttribute(size, 1));
  geometry.setAttribute('aPhase', new BufferAttribute(phase, 1));
  return geometry;
}

type Props = {
  paused: boolean;
  onReady: () => void;
  /** Render at a fraction of the resolution and scale up blocky: the pixel skin's sky. */
  pixel?: boolean;
};

/** The pixel skin's sky: roughly one drawn pixel for every three on screen. */
const PIXEL_RATIO = 0.34;

/** The sky drifts slowly enough that half the frames are plenty. */
const FRAME_MS = 1000 / 30;

/**
 * The live wallpaper: a slow nebula and a drift of stars with a little mouse
 * parallax. Quiet on purpose - it sits behind every page and must never
 * compete with one. Its own chunk, loaded after the screen is up.
 */
export default function Starfield({ paused, onReady, pixel = false }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const loop = useRef<{ start: () => void; stop: () => void } | null>(null);
  const pausedRef = useRef(paused);
  const readyRef = useRef(onReady);
  readyRef.current = onReady;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    // Throws without WebGL; LiveWallpaper's boundary falls back to the static sky.
    const renderer = new WebGLRenderer({ antialias: false, alpha: true, powerPreference: 'low-power' });
    renderer.setPixelRatio(pixel ? PIXEL_RATIO : Math.min(window.devicePixelRatio || 1, 1.25));
    renderer.domElement.style.display = 'block';
    if (pixel) renderer.domElement.style.imageRendering = 'pixelated';
    host.appendChild(renderer.domElement);

    const scene = new Scene();
    const camera = new PerspectiveCamera(60, 1, 1, 400);
    const geometry = buildStars();
    const material = new ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: { uTime: { value: 0 }, uPixelRatio: { value: renderer.getPixelRatio() } },
      transparent: true,
      depthWrite: false,
    });
    const stars = new Points(geometry, material);
    const nebulaShader = new ShaderMaterial({
      vertexShader: NEBULA_VERT,
      fragmentShader: NEBULA_FRAG,
      uniforms: { uTime: { value: 0 }, uRes: { value: [1, 1] }, uLean: { value: [0, 0] } },
      transparent: true,
      depthTest: false,
      depthWrite: false,
    });
    const nebulaGeometry = new PlaneGeometry(2, 2);
    const nebula = new Mesh(nebulaGeometry, nebulaShader);
    nebula.frustumCulled = false;
    nebula.renderOrder = -1;
    scene.add(nebula, stars);

    const resize = () => {
      const w = Math.max(1, host.clientWidth);
      const h = Math.max(1, host.clientHeight);
      renderer.setSize(w, h);
      nebulaShader.uniforms.uRes.value = [w * renderer.getPixelRatio(), h * renderer.getPixelRatio()];
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.render(scene, camera);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    resize();

    const pointer = { x: 0, y: 0 };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener('pointermove', onMove, { passive: true });

    let raf = 0;
    let last = 0;
    let time = 0;
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (last && now - last < FRAME_MS) return;
      // After a pause the first gap covers the whole pause; never jump the sky.
      const dt = last ? Math.min((now - last) / 1000, 0.1) : 0;
      last = now;
      time += dt;
      material.uniforms.uTime.value = time;
      nebulaShader.uniforms.uTime.value = time;
      nebulaShader.uniforms.uLean.value = [camera.position.x, camera.position.y];
      stars.rotation.y += dt * 0.0045;
      stars.rotation.x += dt * 0.0012;
      // Parallax: the camera leans towards the mouse, so near stars slide past far ones.
      const ease = 1 - Math.exp(-dt * 1.4);
      camera.position.x += (pointer.x * 3 - camera.position.x) * ease;
      camera.position.y += (pointer.y * 2 - camera.position.y) * ease;
      renderer.render(scene, camera);
    };
    const start = () => {
      if (raf) return;
      last = 0;
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };
    loop.current = { start, stop };
    if (!pausedRef.current) start();
    readyRef.current();

    return () => {
      stop();
      loop.current = null;
      observer.disconnect();
      window.removeEventListener('pointermove', onMove);
      geometry.dispose();
      material.dispose();
      nebulaGeometry.dispose();
      nebulaShader.dispose();
      renderer.dispose();
      // Browsers cap live WebGL contexts; give this one back now, not at GC.
      renderer.forceContextLoss();
      renderer.domElement.remove();
    };
    // `pixel` is fixed per instance: LiveWallpaper remounts this when the skin changes.
  }, []);

  useEffect(() => {
    pausedRef.current = paused;
    if (paused) loop.current?.stop();
    else loop.current?.start();
  }, [paused]);

  return <div ref={hostRef} className="absolute inset-0" />;
}
