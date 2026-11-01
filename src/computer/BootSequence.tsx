import { useEffect, useRef, useState } from 'react';
import { OS_NAME, timings } from '../config';
import { useSitePreload } from '../lib/useSitePreload';
import { OsLogo } from './icons';

type Props = {
  /** BIOS lines to type out first, or null to go straight to the splash. */
  lines: string[] | null;
  onDone: () => void;
};

const LINE_MS = 110;
const POST_HOLD_MS = 380;

/**
 * The cafe PC starting up. It opens on a black screen with a cursor in the
 * corner - the same picture the Phaser camera ends on, so the cut from the
 * pixel world lands without a jump. The splash's amber bar is wired to the
 * real preload of the browser, not a timer.
 */
export default function BootSequence({ lines, onDone }: Props) {
  const [stage, setStage] = useState<'post' | 'splash'>(lines ? 'post' : 'splash');
  const [shown, setShown] = useState(0);

  // BIOS text, a line at a time. Any key or click skips ahead.
  useEffect(() => {
    if (stage !== 'post' || !lines) return;
    if (shown >= lines.length) {
      const t = window.setTimeout(() => setStage('splash'), POST_HOLD_MS);
      return () => window.clearTimeout(t);
    }
    const t = window.setTimeout(() => setShown((n) => n + 1), shown === 0 ? 260 : LINE_MS);
    return () => window.clearTimeout(t);
  }, [stage, shown, lines]);

  useEffect(() => {
    if (stage !== 'post') return;
    const skip = () => setStage('splash');
    window.addEventListener('keydown', skip);
    window.addEventListener('pointerdown', skip);
    return () => {
      window.removeEventListener('keydown', skip);
      window.removeEventListener('pointerdown', skip);
    };
  }, [stage]);

  return (
    <div className="absolute inset-0 z-[2000] bg-black">
      {stage === 'post' && lines ? (
        <pre className="p-6 font-mono text-[13px] leading-6 text-[#b3bdd6] sm:p-10 sm:text-sm">
          {lines.slice(0, shown).join('\n')}
          <span className="ml-0.5 inline-block h-[1.05em] w-[0.6em] translate-y-[3px] animate-pulse bg-[#b3bdd6]" />
        </pre>
      ) : (
        <Splash onDone={onDone} />
      )}
    </div>
  );
}

function Splash({ onDone }: { onDone: () => void }) {
  const ready = useSitePreload();
  const readyRef = useRef(ready);
  readyRef.current = ready;
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;
  const barRef = useRef<HTMLDivElement>(null);

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
      if ((readyRef.current && elapsed >= timings.bootMin && value > 0.985) || elapsed >= timings.bootMax) {
        value = 1;
      }
      bar.style.transform = `scaleX(${value})`;

      if (value >= 1) {
        if (!finished) {
          finished = true;
          window.setTimeout(() => onDoneRef.current(), 220);
        }
        return;
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="grid h-full w-full place-items-center bg-space" style={{ animation: 'fade-in 400ms ease-out both' }}>
      <div className="flex w-[min(70vw,20rem)] flex-col items-center gap-6">
        <OsLogo className="h-14 w-14 text-ink" />
        <p className="text-lg font-medium tracking-tight text-ink">{OS_NAME}</p>
        <div className="h-px w-full overflow-hidden bg-white/10" role="progressbar" aria-label={`Starting ${OS_NAME}`}>
          {/* Inline transform, not Tailwind's scale-x-*: v4 sets the CSS
              `scale` property, which a script-set transform cannot override. */}
          <div ref={barRef} className="h-full w-full origin-left bg-accent" style={{ transform: 'scaleX(0)' }} />
        </div>
      </div>
    </div>
  );
}
