import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { GUIDE, GUIDE_TIPS } from '../content/guide';
import { isSoundOn, playClick } from '../lib/sound';

type Props = {
  step: number;
  onStep: (step: number) => void;
  onClose: () => void;
  reducedMotion: boolean;
};

type Box = { left: number; top: number; width: number; height: number };

const SPRITE = `${import.meta.env.BASE_URL}assets/intro/player-idle.png`;
const RING = 6;

/**
 * The pixel character from the street, now a guide: a few tips, one at a time,
 * each lighting up the part of the browser it is about.
 */
export default function Guide({ step, onStep, onClose, reducedMotion }: Props) {
  const layerRef = useRef<HTMLDivElement>(null);
  const [spot, setSpot] = useState<Box | null>(null);
  const tip = GUIDE_TIPS[step];
  const last = step === GUIDE_TIPS.length - 1;

  // Ring the tip's target - whichever copy is on screen (sidebar or bottom bar).
  useLayoutEffect(() => {
    const measure = () => {
      const layer = layerRef.current?.getBoundingClientRect();
      const el = tip.target
        ? [...document.querySelectorAll<HTMLElement>(`[data-guide="${tip.target}"]`)].find((e) => e.offsetWidth > 0)
        : undefined;
      if (!layer || !el) {
        setSpot(null);
        return;
      }
      const r = el.getBoundingClientRect();
      setSpot({ left: r.left - layer.left - RING, top: r.top - layer.top - RING, width: r.width + RING * 2, height: r.height + RING * 2 });
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [tip]);

  useEffect(() => {
    if (!tip.audio || !isSoundOn()) return;
    const line = new Audio(tip.audio);
    void line.play().catch(() => undefined);
    return () => line.pause();
  }, [tip]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div ref={layerRef} className="pointer-events-none absolute inset-0 z-40">
      {spot && (
        <div
          aria-hidden="true"
          className="absolute rounded-xl border border-accent/70 shadow-[0_0_0_4px_rgb(245_163_92/0.12)] transition-all duration-300 ease-out"
          style={spot}
        />
      )}

      <div
        role="dialog"
        aria-label={GUIDE.name}
        className="pointer-events-auto absolute bottom-[calc(4.25rem+env(safe-area-inset-bottom))] left-3 flex items-end gap-1 sm:bottom-5 sm:left-[4.75rem]"
        style={reducedMotion ? undefined : { animation: 'guide-in 420ms ease-out both' }}
      >
        <div aria-hidden="true" className="guide-sprite shrink-0" style={{ backgroundImage: `url(${SPRITE})` }} />
        <div className="relative mb-12 w-[min(18rem,calc(100vw-6rem))] rounded-2xl rounded-bl-sm border border-white/[0.1] bg-surface p-4 shadow-[0_18px_50px_rgba(0,0,0,0.5)]">
          <button
            type="button"
            aria-label={GUIDE.close}
            onClick={onClose}
            className="absolute top-2 right-2 grid h-7 w-7 place-items-center rounded-md text-ink-muted transition-colors hover:bg-white/10 hover:text-ink"
          >
            <X className="h-3.5 w-3.5" strokeWidth={2} />
          </button>
          <p aria-live="polite" className="pr-6 text-sm leading-relaxed text-ink">
            {tip.text}
          </p>
          <div className="mt-3 flex items-center justify-between">
            <span className="font-mono text-[10px] text-ink-muted">{GUIDE.step(step + 1, GUIDE_TIPS.length)}</span>
            <button
              type="button"
              onClick={() => {
                playClick();
                if (last) onClose();
                else onStep(step + 1);
              }}
              className="rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-space transition-colors hover:bg-accent/90"
            >
              {last ? GUIDE.done : GUIDE.next}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
