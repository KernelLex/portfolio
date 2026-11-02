import { useEffect, useRef, useState } from 'react';
import { ArrowRight, MessageCircle, Volume2, VolumeX } from 'lucide-react';
import { useBrowser } from '../../browser/BrowserContext';
import { SCENES, STORY } from '../../content/story';
import { playClick } from '../../lib/sound';
import { useReducedMotion } from '../../lib/useReducedMotion';
import { Visual, animateVisual } from './visuals';

const HAS_VOICE = SCENES.some((s) => s.audio);

/**
 * The Story, as a short film you scroll through: each scene draws itself as it
 * comes into view, the visuals drift against the scroll, and an amber line
 * along the top shows how far in you are.
 */
export default function Story() {
  const { open } = useBrowser();
  const reducedMotion = useReducedMotion();
  const sceneRefs = useRef<(HTMLElement | null)[]>([]);
  const [progress, setProgress] = useState(0);
  const [current, setCurrent] = useState(0);
  const [voice, setVoice] = useState(false);
  const audio = useRef<HTMLAudioElement | null>(null);

  // Each scene's drawing plays once, the first time it is mostly in view.
  useEffect(() => {
    const panel = document.getElementById('page-panel');
    const played = new Set<Element>();
    const timelines: gsap.core.Timeline[] = [];
    const visuals = sceneRefs.current.map((s) => s?.querySelector('[data-visual]'));
    if (!reducedMotion) {
      visuals.forEach((v) => {
        if (!v) return;
        const tl = animateVisual(v);
        tl.pause(0);
        timelines.push(tl);
        (v as HTMLElement).dataset.index = String(timelines.length - 1);
      });
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const index = sceneRefs.current.indexOf(entry.target as HTMLElement);
          setCurrent(index);
          const v = visuals[index] as HTMLElement | undefined;
          if (v && !played.has(v) && v.dataset.index) {
            played.add(v);
            timelines[Number(v.dataset.index)]?.play();
          }
        }
      },
      { root: panel, threshold: 0.45 },
    );
    sceneRefs.current.forEach((s) => s && observer.observe(s));
    return () => {
      observer.disconnect();
      // Revert, not kill: a killed `from` tween leaves its start state behind,
      // and the next build would animate from invisible to invisible.
      timelines.forEach((tl) => tl.revert());
    };
  }, [reducedMotion]);

  // Progress along the top, and a gentle parallax on each visual.
  useEffect(() => {
    const panel = document.getElementById('page-panel');
    if (!panel) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const max = panel.scrollHeight - panel.clientHeight;
      setProgress(max > 0 ? panel.scrollTop / max : 0);
      if (reducedMotion) return;
      const view = panel.getBoundingClientRect();
      for (const scene of sceneRefs.current) {
        if (!scene) continue;
        const r = scene.getBoundingClientRect();
        const p = (r.top + r.height / 2 - (view.top + view.height / 2)) / view.height;
        scene.style.setProperty('--drift', `${Math.max(-1, Math.min(1, p)) * 36}px`);
      }
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    panel.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      panel.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(frame);
    };
  }, [reducedMotion]);

  // With the voice on, each scene's recorded line plays while it is on screen.
  useEffect(() => {
    audio.current?.pause();
    const src = voice ? SCENES[current]?.audio : undefined;
    if (!src) return;
    const line = new Audio(src);
    audio.current = line;
    void line.play().catch(() => undefined);
    return () => line.pause();
  }, [voice, current]);

  const jump = (i: number) => sceneRefs.current[i]?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });

  return (
    <div className="relative">
      <div className="sticky top-0 z-20 h-0.5 bg-white/[0.05]">
        <div className="h-full origin-left bg-accent" style={{ transform: `scaleX(${progress})` }} />
      </div>

      <nav aria-label={STORY.title} className="sticky top-1/2 z-20 float-right mr-3 hidden -translate-y-1/2 flex-col gap-2.5 md:flex">
        {SCENES.map((scene, i) => (
          <button
            key={scene.id}
            type="button"
            onClick={() => jump(i)}
            aria-label={STORY.jumpTo(scene.title)}
            aria-current={i === current ? 'step' : undefined}
            className={`h-2 w-2 rounded-full transition-all ${i === current ? 'scale-125 bg-accent' : 'bg-white/20 hover:bg-white/50'}`}
          />
        ))}
      </nav>

      <header className="mx-auto max-w-5xl px-5 pt-14 pb-4 sm:px-10">
        <p className="font-mono text-[11px] tracking-[0.25em] text-accent uppercase">{STORY.eyebrow}</p>
        <h1 className="mt-2 font-display text-6xl text-ink sm:text-7xl">{STORY.title}</h1>
        <p className="mt-3 max-w-md text-[15px] leading-relaxed text-ink-muted">{STORY.lead}</p>
        {HAS_VOICE && (
          <button
            type="button"
            aria-pressed={voice}
            onClick={() => {
              playClick();
              setVoice((v) => !v);
            }}
            className="mt-5 inline-flex items-center gap-2 rounded-lg border border-white/[0.12] px-3 py-1.5 text-sm text-ink-muted hover:text-accent"
          >
            {voice ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            {voice ? STORY.voiceOn : STORY.voiceOff}
          </button>
        )}
      </header>

      {SCENES.map((scene, i) => (
        <section
          key={scene.id}
          ref={(el) => {
            sceneRefs.current[i] = el;
          }}
          aria-labelledby={`scene-${scene.id}`}
          className="mx-auto grid min-h-[78vh] max-w-5xl items-center gap-8 px-5 py-12 sm:px-10 md:grid-cols-[1.05fr_1fr] md:gap-14"
        >
          <div>
            <p className="font-mono text-[11px] tracking-[0.2em] text-ink-muted">{String(i + 1).padStart(2, '0')} / {String(SCENES.length).padStart(2, '0')}</p>
            <h2 id={`scene-${scene.id}`} className="mt-3 font-display text-[2.6rem] leading-[1.02] text-ink sm:text-6xl">
              {scene.title}
            </h2>
            <p className="mt-5 max-w-md text-[16px] leading-relaxed text-ink/80">{scene.body}</p>
            {i === SCENES.length - 1 && (
              <div className="mt-8 flex flex-wrap gap-3">
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
          <div data-visual className="story-visual relative aspect-[4/3] w-full rounded-3xl border border-white/[0.06] bg-space/40 p-6">
            <Visual kind={scene.visual} />
          </div>
        </section>
      ))}
    </div>
  );
}
