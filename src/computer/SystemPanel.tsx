import { useEffect, useState } from 'react';
import HudCorners from '../components/HudCorners';
import { OS_NAME } from '../config';
import { SYSTEM_PANEL as T } from '../content/desktop';
import { useClock } from '../lib/useClock';

const SAMPLES = 30;

/** Real frame rate, one sample a second, while the desktop is on screen. */
function useFrameRate(active: boolean): number[] {
  const [history, setHistory] = useState<number[]>([]);
  useEffect(() => {
    if (!active) return;
    let frames = 0;
    let raf = 0;
    const count = () => {
      frames += 1;
      raf = requestAnimationFrame(count);
    };
    raf = requestAnimationFrame(count);
    const id = window.setInterval(() => {
      setHistory((h) => [...h.slice(-(SAMPLES - 1)), frames]);
      frames = 0;
    }, 1000);
    return () => {
      cancelAnimationFrame(raf);
      window.clearInterval(id);
    };
  }, [active]);
  return history;
}

function useSession(active: boolean): string {
  const [seconds, setSeconds] = useState(() => Math.floor(performance.now() / 1000));
  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => setSeconds(Math.floor(performance.now() / 1000)), 1000);
    return () => window.clearInterval(id);
  }, [active]);
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}

/**
 * A HUD on the cafe PC's desktop. Every reading is real: the clock, how long
 * this session has run, the frame rate this machine is drawing at, its screen.
 */
export default function SystemPanel({ active }: { active: boolean }) {
  const now = useClock();
  const fps = useFrameRate(active);
  const session = useSession(active);
  const latest = fps[fps.length - 1];
  const points = fps.map((f, i) => `${(i / (SAMPLES - 1)) * 100},${28 - Math.min(f, 120) / 120 * 26}`).join(' ');

  const rows: [string, string][] = [
    [T.session, session],
    [T.frameRate, latest === undefined ? '...' : `${latest} fps`],
    [T.display, `${window.screen.width}x${window.screen.height}`],
    [T.zone, Intl.DateTimeFormat().resolvedOptions().timeZone],
    [T.voice, T.ready],
  ];

  return (
    <aside aria-label={T.label} className="glass pointer-events-none absolute top-4 right-4 hidden w-64 rounded-2xl p-4 font-mono md:block">
      <HudCorners inset={6} size={10} />
      <p className="text-[10px] tracking-[0.2em] text-accent uppercase">{OS_NAME}</p>
      <p className="mt-2 text-4xl leading-none text-ink">{now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
      <p className="mt-1 text-[11px] text-ink-muted">{now.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' })}</p>
      <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="mt-4 h-8 w-full" aria-hidden="true">
        <polyline points={points} fill="none" stroke="#f5a35c" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
        <line x1="0" y1="29.5" x2="100" y2="29.5" stroke="rgb(233 235 242 / 0.12)" vectorEffect="non-scaling-stroke" />
      </svg>
      <dl className="mt-3 space-y-1.5 text-[11px]">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-3">
            <dt className="text-ink-muted">{k}</dt>
            <dd className="truncate text-ink">{v}</dd>
          </div>
        ))}
      </dl>
    </aside>
  );
}
