import { useEffect, useRef } from 'react';
import { BROWSER_NAME, timings } from '../config';
import { useSitePreload } from '../lib/useSitePreload';

type Props = { onDone: () => void };

/**
 * The calm side of the cut. Deep space navy, a faint starfield and one thin
 * amber bar wired to the real preload promise - it is a progress bar, not a
 * stage prop, and it is held to a minimum so it never just blinks past.
 */
export default function BootScreen({ onDone }: Props) {
  const ready = useSitePreload();
  const readyRef = useRef(ready);
  readyRef.current = ready;

  const barRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  // Static starfield: cheaper than an animated layer and it reads as "space"
  // in the half-second this screen is on.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    for (let i = 0; i < 160; i++) {
      const x = Math.random() * w;
      const y = Math.random() * h;
      const r = Math.random() < 0.85 ? 0.6 : 1.1;
      ctx.globalAlpha = 0.12 + Math.random() * 0.5;
      ctx.fillStyle = '#cfd8ff';
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }, []);

  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;

    const started = performance.now();
    let value = 0;
    let last = started;
    let raf = 0;
    let finished = false;

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const elapsed = now - started;

      // Creep to 92% while the real work is in flight, then close it out.
      const target = readyRef.current ? 1 : 0.92;
      value += (target - value) * Math.min(1, dt * 3.5);

      const minElapsed = elapsed >= timings.bootMin;
      if ((readyRef.current && minElapsed && value > 0.985) || elapsed >= timings.bootMax) {
        value = 1;
      }

      bar.style.transform = `scaleX(${value})`;

      if (value >= 1) {
        if (!finished) {
          finished = true;
          // Let the full bar register before handing over.
          window.setTimeout(() => onDoneRef.current(), 180);
        }
        return;
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="relative grid h-full w-full place-items-center bg-space">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden="true" />

      <div className="relative flex w-[min(78vw,26rem)] flex-col items-center gap-6">
        <h1 className="text-center text-2xl font-medium tracking-tight text-ink sm:text-3xl">
          {BROWSER_NAME}
        </h1>

        <div
          className="h-px w-full overflow-hidden bg-white/10"
          role="progressbar"
          aria-label={`Loading ${BROWSER_NAME}`}
        >
          <div ref={barRef} className="h-full w-full origin-left scale-x-0 bg-accent" />
        </div>

        <p className="font-mono text-[0.65rem] tracking-[0.2em] text-ink-muted uppercase">
          out of the noise
        </p>
      </div>
    </div>
  );
}
