import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

type Props = {
  /** What the card shows. */
  card: ReactNode;
  /** What a click does. Without one, a click (or tap) toggles the card. */
  onActivate?: () => void;
  label?: string;
  className?: string;
  children: ReactNode;
};

type Place = { left: number; top: number; above: boolean };

const WIDTH = 288;
const OPEN_MS = 120;
const CLOSE_MS = 140;

/**
 * An inline button with a small card on hover, focus or tap: citations and
 * link previews. The card is portalled to the body and placed in viewport
 * space, so it never gets clipped by the scrolling page.
 */
export default function Hovercard({ card, onActivate, label, className = '', children }: Props) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const timer = useRef(0);
  const [place, setPlace] = useState<Place | null>(null);
  const id = useId();

  const measure = () => {
    const r = triggerRef.current?.getBoundingClientRect();
    if (!r) return;
    const above = r.top > 220;
    setPlace({
      left: Math.min(Math.max(8, r.left + r.width / 2 - WIDTH / 2), window.innerWidth - WIDTH - 8),
      top: above ? r.top - 8 : r.bottom + 8,
      above,
    });
  };
  const later = (fn: () => void, ms: number) => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(fn, ms);
  };
  const show = () => later(measure, OPEN_MS);
  const hide = () => later(() => setPlace(null), CLOSE_MS);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  // Anything that moves the trigger closes the card rather than leaving it adrift.
  useEffect(() => {
    if (!place) return;
    const close = () => setPlace(null);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
    const panel = document.getElementById('page-panel');
    panel?.addEventListener('scroll', close, { passive: true });
    window.addEventListener('resize', close);
    window.addEventListener('keydown', onKey);
    return () => {
      panel?.removeEventListener('scroll', close);
      window.removeEventListener('resize', close);
      window.removeEventListener('keydown', onKey);
    };
  }, [place]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label={label}
        aria-describedby={place ? id : undefined}
        onPointerEnter={(e) => e.pointerType === 'mouse' && show()}
        onPointerLeave={(e) => e.pointerType === 'mouse' && hide()}
        onFocus={show}
        onBlur={hide}
        onClick={() => {
          if (onActivate) onActivate();
          else if (place) setPlace(null);
          else measure();
        }}
        className={className}
      >
        {children}
      </button>
      {place &&
        createPortal(
          <div
            id={id}
            role="tooltip"
            onPointerEnter={() => window.clearTimeout(timer.current)}
            onPointerLeave={hide}
            className="fixed z-[1200] rounded-xl border border-white/[0.1] bg-surface p-3.5 text-left text-sm text-ink shadow-[0_18px_50px_rgba(0,0,0,0.55)]"
            style={{
              left: place.left,
              top: place.top,
              width: WIDTH,
              transform: place.above ? 'translateY(-100%)' : undefined,
              animation: 'fade-in 140ms ease-out both',
            }}
          >
            {card}
          </div>,
          document.body,
        )}
    </>
  );
}
