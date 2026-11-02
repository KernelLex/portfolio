import { useEffect } from 'react';
import { Maximize2, X } from 'lucide-react';
import { declineFullscreen, enterFullscreen, useFullscreenOffer } from '../lib/fullscreen';
import { playClick } from '../lib/sound';

const COPY = { message: 'Full screen is off', back: 'Back to full screen', dismiss: 'Stay windowed' } as const;
/** Ignored this long, the offer counts as declined. */
const OFFER_MS = 8000;

/** After full screen is left on the page (Esc), one quiet offer to go back. */
export default function FullscreenOffer() {
  const offered = useFullscreenOffer();

  useEffect(() => {
    if (!offered) return;
    const t = window.setTimeout(declineFullscreen, OFFER_MS);
    return () => window.clearTimeout(t);
  }, [offered]);

  if (!offered) return null;
  return (
    <div
      role="status"
      className="fixed top-3 left-1/2 z-[2000] flex -translate-x-1/2 items-center gap-2 rounded-xl border border-accent/30 bg-[#0d111c]/95 py-1.5 pr-1.5 pl-3 shadow-[0_12px_40px_rgba(0,0,0,0.5)] backdrop-blur"
      style={{ animation: 'fade-in 220ms ease-out both' }}
    >
      <span className="font-mono text-[11px] text-ink-muted">{COPY.message}</span>
      <button
        type="button"
        onClick={() => {
          playClick();
          enterFullscreen();
        }}
        className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-2.5 py-1.5 text-xs font-medium text-space hover:opacity-90"
      >
        <Maximize2 className="h-3.5 w-3.5" strokeWidth={2} />
        {COPY.back}
      </button>
      <button type="button" onClick={declineFullscreen} aria-label={COPY.dismiss} title={COPY.dismiss} className="grid h-7 w-7 place-items-center rounded-lg text-ink-muted hover:bg-white/10 hover:text-ink">
        <X className="h-3.5 w-3.5" strokeWidth={2} />
      </button>
    </div>
  );
}
