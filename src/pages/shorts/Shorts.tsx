import { useEffect, useRef, useState } from 'react';
import { ArrowRight, ChevronDown, ChevronUp, Play } from 'lucide-react';
import { useBrowser } from '../../browser/BrowserContext';
import { SHORTS, SHORTS_PAGE as P } from '../../content/shorts';

/**
 * Shorts: one video per screen, snapping as you scroll. Nothing loads from
 * YouTube until the first tap; after that, each short plays as it arrives and
 * stops as it leaves.
 */
export default function Shorts() {
  const { open } = useBrowser();
  const feedRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLElement | null)[]>([]);
  const [current, setCurrent] = useState(0);
  const [engaged, setEngaged] = useState(false);

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

  const go = (i: number) => itemRefs.current[Math.max(0, Math.min(SHORTS.length - 1, i))]?.scrollIntoView({ behavior: 'smooth', block: 'start' });

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
      {SHORTS.map((s, i) => {
        const playing = engaged && current === i;
        const params = new URLSearchParams({ autoplay: '1', rel: '0', playsinline: '1', modestbranding: '1' });
        if (s.start) params.set('start', String(s.start));
        if (s.end) params.set('end', String(s.end));
        return (
          <section
            key={s.slug}
            ref={(el) => {
              itemRefs.current[i] = el;
            }}
            className="relative flex h-full snap-start items-center justify-center p-4"
          >
            <div className="relative aspect-[9/16] h-full max-h-[min(100%,52rem)] overflow-hidden rounded-3xl border border-white/[0.1] bg-black shadow-[0_30px_80px_rgba(0,0,0,0.5)]">
              <img src={`https://i.ytimg.com/vi/${s.video.id}/hqdefault.jpg`} alt="" className="absolute inset-0 h-full w-full scale-125 object-cover opacity-50 blur-2xl" />
              <div className="absolute inset-x-0 top-1/2 aspect-video -translate-y-1/2">
                {playing ? (
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${s.video.id}?${params}`}
                    title={s.video.title}
                    allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                    allowFullScreen
                    className="h-full w-full"
                  />
                ) : (
                  <button type="button" onClick={() => setEngaged(true)} aria-label={`${P.play}: ${s.title}`} className="group relative h-full w-full">
                    <img src={`https://i.ytimg.com/vi/${s.video.id}/hqdefault.jpg`} alt="" loading="lazy" className="h-full w-full object-cover" />
                    <span className="absolute top-1/2 left-1/2 grid h-14 w-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-accent/60 bg-space/70 text-accent backdrop-blur transition-transform group-hover:scale-105">
                      <Play className="ml-0.5 h-5 w-5" fill="currentColor" strokeWidth={1.8} />
                    </span>
                  </button>
                )}
              </div>
              <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-5 pt-16">
                <p className="font-mono text-[10px] tracking-[0.2em] text-accent uppercase">
                  {String(i + 1).padStart(2, '0')} / {String(SHORTS.length).padStart(2, '0')}
                </p>
                <h2 className="mt-1 font-display text-3xl text-white">{s.title}</h2>
                <p className="mt-1.5 text-sm leading-snug text-white/80">{s.caption}</p>
                <button type="button" onClick={() => open(`work/${s.slug}`)} className="pointer-events-auto mt-3 inline-flex items-center gap-1.5 text-sm text-accent hover:underline">
                  {P.open}
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
        );
      })}
      <p className="pointer-events-none fixed bottom-10 left-1/2 hidden -translate-x-1/2 font-mono text-[10px] text-ink-muted md:block">{engaged ? P.hint : P.note}</p>
    </div>
  );
}
