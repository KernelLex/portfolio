import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, MessageCircle, Target } from 'lucide-react';
import { useBrowser } from '../../browser/BrowserContext';
import HudCorners from '../../components/HudCorners';
import { CHAPTERS, STORY } from '../../content/story';
import { playClick, playPickup } from '../../lib/sound';
import { useReducedMotion } from '../../lib/useReducedMotion';
import { Piece } from './pieces';

// Progress outlives the tab, like any save file - until the page reloads.
let saved = { at: 0, done: CHAPTERS.map(() => false) };

/**
 * The Story as a mission: one chapter at a time, each with a small thing to
 * do. Finishing a chapter unlocks the next; any finished chapter can be
 * revisited from the track along the top.
 */
export default function Story() {
  const { open } = useBrowser();
  const reduced = useReducedMotion();
  const [at, setAt] = useState(saved.at);
  const [done, setDone] = useState(saved.done);
  const chapter = CHAPTERS[at];
  const last = at === CHAPTERS.length - 1;
  const unlocked = (i: number) => i === 0 || done[i - 1];

  useEffect(() => {
    saved = { at, done };
  }, [at, done]);

  const go = useCallback(
    (i: number) => {
      if (i < 0 || i >= CHAPTERS.length || !(i === 0 || done[i - 1])) return;
      playClick();
      setAt(i);
    },
    [done],
  );

  const complete = useCallback(() => {
    setDone((d) => {
      if (d[at]) return d;
      playPickup();
      return d.map((v, i) => v || i === at);
    });
  }, [at]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement | null)?.closest('input, textarea, [contenteditable]')) return;
      if (e.key === 'ArrowRight' && done[at]) go(at + 1);
      if (e.key === 'ArrowLeft') go(at - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [at, done, go]);

  return (
    <div className="mx-auto flex min-h-full w-full max-w-6xl 2xl:max-w-[1440px] flex-col px-4 pt-6 pb-10 sm:px-8 sm:pt-8 xl:px-12">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] tracking-[0.25em] text-accent uppercase">{STORY.eyebrow}</p>
          <h1 className="mt-2 font-display text-5xl text-ink sm:text-6xl">{STORY.title}</h1>
          <p className="mt-2 text-[15px] text-ink-muted">{STORY.lead}</p>
        </div>
        <p className="hidden font-mono text-[10.5px] text-ink-muted md:block">{STORY.keys}</p>
      </header>

      {/* The mission track: done, current, and still locked. */}
      <ol className="mt-6 flex gap-1.5" aria-label={STORY.title}>
        {CHAPTERS.map((c, i) => (
          <li key={c.id} className="flex-1">
            <button
              type="button"
              onClick={() => go(i)}
              disabled={!unlocked(i)}
              aria-current={i === at ? 'step' : undefined}
              aria-label={`${STORY.chapter(i + 1, CHAPTERS.length)}: ${c.title}`}
              className={`block h-2 w-full rounded-full transition-all ${
                i === at ? 'bg-accent shadow-[0_0_12px_rgb(245_163_92/0.6)]' : done[i] ? 'bg-accent/50 hover:bg-accent/70' : unlocked(i) ? 'bg-white/25' : 'bg-white/[0.07]'
              }`}
            />
          </li>
        ))}
      </ol>

      <section key={chapter.id} className="relative mt-6 grid flex-1 gap-6 rounded-3xl border border-white/[0.08] bg-surface/50 p-5 backdrop-blur-sm sm:p-8 lg:grid-cols-[1fr_1.15fr]" style={reduced ? undefined : { animation: 'guide-in 380ms ease-out both' }}>
        <HudCorners inset={12} size={14} />
        <div className="flex flex-col">
          <p className="font-mono text-[11px] tracking-[0.2em] text-ink-muted">{STORY.chapter(at + 1, CHAPTERS.length)}</p>
          <h2 className="mt-3 font-display text-[2.6rem] leading-[1.02] text-ink sm:text-6xl">{chapter.title}</h2>
          <p className="mt-4 max-w-md text-[16px] leading-relaxed text-ink/80">{chapter.body}</p>

          <div className={`mt-6 flex items-center gap-3 rounded-xl border px-4 py-3 ${done[at] ? 'border-accent/50 bg-accent/10' : 'border-white/[0.1] bg-space/50'}`}>
            {done[at] ? <Check className="h-4 w-4 shrink-0 text-accent" strokeWidth={2.2} /> : <Target className="h-4 w-4 shrink-0 text-accent" strokeWidth={1.8} />}
            <div>
              <p className="font-mono text-[10px] tracking-[0.2em] text-ink-muted uppercase">{done[at] ? STORY.complete : STORY.objective}</p>
              <p className="text-sm text-ink">{done[at] ? chapter.done : chapter.objective}</p>
            </div>
          </div>

          <div className="mt-auto flex flex-wrap items-center gap-3 pt-6">
            <button type="button" onClick={() => go(at - 1)} disabled={at === 0} className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink disabled:opacity-30">
              <ArrowLeft className="h-4 w-4" strokeWidth={1.8} />
              {STORY.previous}
            </button>
            {!last && (
              <button
                type="button"
                onClick={() => go(at + 1)}
                disabled={!done[at]}
                className="ml-auto inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-space transition-opacity disabled:opacity-25"
              >
                {STORY.next}
                <ArrowRight className="h-4 w-4" strokeWidth={2} />
              </button>
            )}
            {!last && !done[at] && (
              <button type="button" onClick={complete} className="font-mono text-[11px] text-ink-muted underline-offset-4 hover:text-ink hover:underline">
                {STORY.skip}
              </button>
            )}
            {last && (
              <div className="ml-auto flex flex-wrap gap-3">
                <button type="button" onClick={() => open('work')} className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-space hover:opacity-90">
                  {STORY.ctaWork}
                  <ArrowRight className="h-4 w-4" strokeWidth={2} />
                </button>
                <button type="button" onClick={() => open('ask')} className="inline-flex items-center gap-2 rounded-lg border border-accent/40 px-4 py-2.5 text-sm text-accent hover:bg-accent/10">
                  <MessageCircle className="h-4 w-4" strokeWidth={1.8} />
                  {STORY.ctaAsk}
                </button>
              </div>
            )}
          </div>
        </div>
        <Piece widget={chapter.widget} done={done[at]} onDone={complete} reduced={reduced} />
      </section>
    </div>
  );
}
