import { useEffect } from 'react';
import { ChevronRight, Play, X } from 'lucide-react';
import { GUIDE, TIPS, tourLines } from '../content/guide';
import { playClick } from '../lib/sound';
import BotSprite from './BotSprite';
import { guide, useGuide, type Place } from './guide';

/** How long each line of the tour stays up; the last one in a place a little longer. */
const LINE_MS = 4200;
const LAST_MS = 5200;

/** Where Byte floats: clear of the taskbar, the sidebar and the phone's bottom bar. */
const SPOT: Record<Place, string> = {
  street: 'bottom-4 left-4',
  cafe: 'bottom-4 left-4',
  link: '',
  boot: '',
  desktop: 'bottom-16 left-4',
  browser: 'bottom-[calc(4.5rem+env(safe-area-inset-bottom))] left-3 sm:bottom-10 sm:left-[4.5rem]',
};

const coarse = () => typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;

const BUTTON = 'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors';
const PRIMARY = `${BUTTON} bg-accent text-space hover:opacity-90`;
const SECONDARY = `${BUTTON} border border-white/[0.14] text-ink hover:border-accent/50 hover:text-accent`;

/**
 * Byte, everywhere: on the street, in the cafe, on the PC and in the browser.
 * It asks once how the visitor wants to go, then narrates the walkthrough or
 * gives a tip per place. Ctrl+B starts the walkthrough from wherever you are.
 */
export default function GuideBot() {
  const g = useGuide();
  const lines = tourLines(g.place);
  const hidden = g.place === 'link' || g.place === 'boot';

  // The shortcut works everywhere, game included.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        playClick();
        guide.toggle();
      } else if (e.key === 'Escape' && guide.get().mode === 'tour') {
        guide.explore();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // The tour's narration runs itself; the browser's last line ends the tour.
  useEffect(() => {
    if (g.mode !== 'tour' || hidden || !lines.length) return;
    if (g.narrated && g.place === 'browser') {
      const t = window.setTimeout(() => {
        guide.explore();
        guide.setOpen(false);
      }, 400);
      return () => window.clearTimeout(t);
    }
    const t = window.setTimeout(() => guide.advance(lines.length), g.line === lines.length - 1 ? LAST_MS : LINE_MS);
    return () => window.clearTimeout(t);
  }, [g.mode, g.place, g.line, g.narrated, hidden, lines.length]);

  if (hidden) return null;

  const tip = TIPS[g.place];
  const text =
    g.mode === 'choose' ? GUIDE.choose.text : g.mode === 'tour' ? lines[g.line] : tip ? (coarse() ? tip.touch : tip.keys) : null;
  const showBubble = g.open && text;

  return (
    <div className={`pointer-events-none fixed z-[1500] flex items-end gap-2 ${SPOT[g.place]}`} role="complementary" aria-label={GUIDE.label}>
      <button
        type="button"
        onClick={() => {
          playClick();
          guide.setOpen(!g.open);
        }}
        aria-label={GUIDE.reopen}
        aria-expanded={Boolean(showBubble)}
        className="bot-hover pointer-events-auto relative shrink-0"
      >
        <BotSprite className="h-14 w-[3.25rem] drop-shadow-[0_6px_14px_rgba(0,0,0,0.6)]" />
        {!showBubble && (
          <span className="absolute -top-1 -right-2 rounded bg-accent px-1 font-mono text-[9px] leading-4 text-space">{GUIDE.shortcut}</span>
        )}
      </button>

      {showBubble && (
        <div
          key={`${g.mode}-${g.place}-${g.line}`}
          className="pointer-events-auto relative mb-8 w-[min(21rem,calc(100vw-6.5rem))] rounded-2xl rounded-bl-sm border border-accent/25 bg-[#0d111c]/95 p-4 shadow-[0_18px_50px_rgba(0,0,0,0.55),0_0_0_1px_rgb(245_163_92/0.08)] backdrop-blur"
          style={{ animation: 'guide-in 260ms ease-out both' }}
        >
          <p className="mb-1.5 font-mono text-[10px] tracking-[0.2em] text-accent uppercase">{GUIDE.name}</p>
          {g.mode !== 'choose' && (
            <button
              type="button"
              aria-label={g.mode === 'tour' ? GUIDE.exitTour : GUIDE.gotIt}
              onClick={() => (g.mode === 'tour' ? guide.explore() : guide.setOpen(false))}
              className="absolute top-2.5 right-2.5 grid h-6 w-6 place-items-center rounded-md text-ink-muted hover:bg-white/10 hover:text-ink"
            >
              <X className="h-3.5 w-3.5" strokeWidth={2} />
            </button>
          )}
          <p aria-live="polite" className="pr-5 text-sm leading-relaxed text-ink">
            {text}
          </p>

          {g.mode === 'choose' && (
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" onClick={guide.tour} className={`${PRIMARY} inline-flex items-center gap-1.5`}>
                <Play className="h-3 w-3" fill="currentColor" strokeWidth={0} />
                {GUIDE.choose.tour}
              </button>
              <button type="button" onClick={guide.explore} className={SECONDARY}>
                {GUIDE.choose.explore}
              </button>
            </div>
          )}

          {g.mode === 'tour' && (
            <div className="mt-3 flex items-center justify-between gap-3">
              <span className="flex gap-1" aria-hidden="true">
                {lines.map((_, i) => (
                  <span key={i} className={`h-1 w-4 rounded-full ${i <= g.line ? 'bg-accent' : 'bg-white/15'}`} />
                ))}
              </span>
              {!g.narrated && (
                <button type="button" onClick={() => guide.advance(lines.length)} className={`${SECONDARY} inline-flex items-center gap-1`}>
                  {GUIDE.next}
                  <ChevronRight className="h-3 w-3" strokeWidth={2} />
                </button>
              )}
            </div>
          )}

          {g.mode === 'explore' && (
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" onClick={() => guide.setOpen(false)} className={PRIMARY}>
                {GUIDE.gotIt}
              </button>
              <button type="button" onClick={guide.tour} className={SECONDARY}>
                {GUIDE.startTour}
              </button>
            </div>
          )}

          <p className="mt-3 border-t border-white/[0.06] pt-2 font-mono text-[10px] text-ink-muted">{GUIDE.shortcutHint}</p>
        </div>
      )}
    </div>
  );
}
