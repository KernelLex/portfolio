import { useEffect, useRef } from 'react';
import { BufferAttribute, BufferGeometry, PerspectiveCamera, Points, Scene, ShaderMaterial, WebGLRenderer } from 'three';
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
  gl_PointSize = max(aSize * uPixelRatio * (70.0 / depth), uPixelRatio);
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
};

/**
 * The browser's live wallpaper: a slow drift of stars with a little mouse
 * parallax. Deliberately faint - it sits behind every page and must never
 * compete with one. Its own chunk, loaded after the browser is on screen.
 */
export default function Starfield({ paused, onReady }: Props) {
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
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.domElement.style.display = 'block';
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
    scene.add(stars);

    const resize = () => {
      const w = Math.max(1, host.clientWidth);
      const h = Math.max(1, host.clientHeight);
      renderer.setSize(w, h);
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
      // After a pause the first gap covers the whole pause; never jump the sky.
      const dt = last ? Math.min((now - last) / 1000, 0.1) : 0;
      last = now;
      time += dt;
      material.uniforms.uTime.value = time;
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
      renderer.dispose();
      // Browsers cap live WebGL contexts; give this one back now, not at GC.
      renderer.forceContextLoss();
      renderer.domElement.remove();
    };
  }, []);

  useEffect(() => {
    pausedRef.current = paused;
    if (paused) loop.current?.stop();
    else loop.current?.start();
  }, [paused]);

  return <div ref={hostRef} className="absolute inset-0" />;
}
