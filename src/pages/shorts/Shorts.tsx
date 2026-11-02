import { useEffect, useRef, useState } from 'react';
import { ArrowRight, ChevronDown, ChevronUp, Volume2, VolumeX } from 'lucide-react';
import { useBrowser } from '../../browser/BrowserContext';
import { SHORTS, SHORTS_PAGE as P } from '../../content/shorts';

/**
 * Shorts: one vertical video per screen, snapping as you scroll. The one in
 * view plays, muted until you tap for sound; the rest wait. ?v=<id> starts on
 * a particular short.
 */
export default function Shorts() {
  const { address, open } = useBrowser();
  const feedRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLElement | null)[]>([]);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const [current, setCurrent] = useState(0);
  const [sound, setSound] = useState(false);

  const go = (i: number, behavior: ScrollBehavior = 'smooth') =>
    itemRefs.current[Math.max(0, Math.min(SHORTS.length - 1, i))]?.scrollIntoView({ behavior, block: 'start' });

  // Start on the short a link asked for.
  useEffect(() => {
    const wanted = SHORTS.findIndex((s) => s.id === address.query.get('v'));
    if (wanted > 0) go(wanted, 'auto');
  }, [address]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setCurrent(itemRefs.current.indexOf(e.target as HTMLElement));
      },
      { root: feedRef.current, threshold: 0.6 },
    );
    itemRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // Only the short on screen plays.
  useEffect(() => {
    videoRefs.current.forEach((v, i) => {
      if (!v) return;
      if (i === current) {
        v.muted = !sound;
        void v.play().catch(() => undefined);
      } else {
        v.pause();
      }
    });
  }, [current, sound]);

  return (
    <div
      ref={feedRef}
      tabIndex={0}
      aria-label={P.title}
      onKeyDown={(e) => {
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
          e.preventDefault();
          go(current + (e.key === 'ArrowDown' ? 1 : -1));
        }
      }}
      className="absolute inset-0 snap-y snap-mandatory overflow-y-auto focus-visible:outline-none"
    >
      {SHORTS.map((s, i) => (
        <section
          key={s.id}
          ref={(el) => {
            itemRefs.current[i] = el;
          }}
          className="relative flex h-full snap-start items-center justify-center p-3 sm:p-4"
        >
          <div className="relative aspect-[9/16] h-full max-h-[min(100%,54rem)] overflow-hidden rounded-[1.75rem] border border-white/[0.12] bg-black shadow-[0_30px_80px_rgba(0,0,0,0.55),0_0_40px_rgb(245_163_92/0.08)]">
            <video
              ref={(el) => {
                videoRefs.current[i] = el;
              }}
              src={s.clip.src}
              poster={s.clip.poster}
              muted
              loop
              playsInline
              preload={Math.abs(i - current) <= 1 ? 'auto' : 'none'}
              onClick={() => s.clip.audio && setSound((v) => !v)}
              aria-label={s.clip.title}
              className="h-full w-full cursor-pointer object-cover"
            />
            <button
              type="button"
              disabled={!s.clip.audio}
              onClick={() => setSound((v) => !v)}
              className="absolute top-4 right-4 flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 font-mono text-[10.5px] text-white backdrop-blur disabled:opacity-50"
            >
              {sound && s.clip.audio ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
              {!s.clip.audio ? P.noSound : sound ? P.soundOn : P.soundOff}
            </button>
            <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-5 pt-20">
              <p className="font-mono text-[10px] tracking-[0.2em] text-accent uppercase">
                {String(i + 1).padStart(2, '0')} / {String(SHORTS.length).padStart(2, '0')}
              </p>
              <h2 className="mt-1 font-display text-3xl text-white">{s.clip.title}</h2>
              <p className="mt-1.5 text-sm leading-snug text-white/80">{s.caption}</p>
              <button type="button" onClick={() => open(s.link.to)} className="pointer-events-auto mt-3 inline-flex items-center gap-1.5 text-sm text-accent hover:underline">
                {s.link.label}
                <ArrowRight className="h-4 w-4" strokeWidth={2} />
              </button>
            </div>
          </div>
          <div className="absolute right-6 hidden flex-col gap-2 md:flex">
            <button type="button" onClick={() => go(i - 1)} disabled={i === 0} aria-label={P.previous} className="grid h-10 w-10 place-items-center rounded-full border border-white/[0.12] text-ink-muted hover:text-ink disabled:opacity-20">
              <ChevronUp className="h-5 w-5" />
            </button>
            <button type="button" onClick={() => go(i + 1)} disabled={i === SHORTS.length - 1} aria-label={P.next} className="grid h-10 w-10 place-items-center rounded-full border border-white/[0.12] text-ink-muted hover:text-ink disabled:opacity-20">
              <ChevronDown className="h-5 w-5" />
            </button>
          </div>
        </section>
      ))}
      <p className="pointer-events-none fixed bottom-10 left-1/2 hidden -translate-x-1/2 font-mono text-[10px] text-ink-muted md:block">{P.hint}</p>
    </div>
  );
}
