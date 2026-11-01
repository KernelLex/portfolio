import { useEffect, useRef } from 'react';

/** Deterministic, so the sky does not reshuffle every time the window resizes. */
function seeded(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * The calm side of the cut: deep space, a faint nebula, and the dark limb of
 * a planet catching amber light in the corner. Static on purpose - the desktop
 * is a place to breathe after the street.
 */
export default function Wallpaper() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;

    const draw = () => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const sky = ctx.createLinearGradient(0, 0, 0, h);
      sky.addColorStop(0, '#0b0e17');
      sky.addColorStop(1, '#101626');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, h);

      const nebula = (x: number, y: number, r: number, color: string) => {
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, color);
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
      };
      nebula(w * 0.28, h * 0.32, Math.max(w, h) * 0.45, 'rgba(139,108,255,0.10)');
      nebula(w * 0.7, h * 0.18, Math.max(w, h) * 0.3, 'rgba(84,232,224,0.05)');

      const rand = seeded(7);
      for (let i = 0; i < Math.round((w * h) / 5200); i++) {
        ctx.globalAlpha = 0.15 + rand() * 0.6;
        ctx.fillStyle = rand() > 0.92 ? '#ffd3a0' : '#cfd8ff';
        ctx.beginPath();
        ctx.arc(rand() * w, rand() * h, rand() < 0.88 ? 0.6 : 1.2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // A planet's dark limb, lit from behind in amber.
      const r = Math.max(w, h) * 0.55;
      const cx = w * 0.92;
      const cy = h + r * 0.62;
      const rim = ctx.createRadialGradient(cx, cy, r * 0.96, cx, cy, r * 1.06);
      rim.addColorStop(0, 'rgba(245,163,92,0.0)');
      rim.addColorStop(0.45, 'rgba(245,163,92,0.32)');
      rim.addColorStop(1, 'rgba(245,163,92,0)');
      ctx.fillStyle = rim;
      ctx.beginPath();
      ctx.arc(cx, cy, r * 1.06, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#070912';
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
    };

    draw();
    let frame = 0;
    const onResize = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(draw);
    };
    window.addEventListener('resize', onResize);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return <canvas ref={ref} className="absolute inset-0 h-full w-full" aria-hidden="true" />;
}
