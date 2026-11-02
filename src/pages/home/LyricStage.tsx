import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { CornerDownLeft, Mic, RotateCcw } from 'lucide-react';
import HudCorners from '../../components/HudCorners';
import { LYRICS, type Mood } from '../../content/lyrics';
import { playerName } from '../../lib/player';
import { playClick } from '../../lib/sound';
import { useReducedMotion } from '../../lib/useReducedMotion';
import { useWisprInput } from '../../voice/useWisprInput';
import VoiceBadge from '../../voice/VoiceBadge';
import WisprHint from '../../voice/WisprHint';
import LiveWords from './LiveWords';
import { perform, type Performance } from './lyrics/perform';

/** The demo breathes between loops, until a visitor gives the stage words of their own. */
const DEMO_GAP_MS = 2600;
/** After raw speech settles, wait this long for Wispr's clean text before performing the raw words. */
const WISPR_GRACE_MS = 1800;
/** Raw speech that arrives this soon after a Wispr chunk is the same sentence, already performed. */
const WISPR_ECHO_MS = 4000;

const MOODS: ReadonlyArray<[Mood, string]> = [
  ['neutral', 'radial-gradient(ellipse 80% 70% at 30% 20%, rgb(139 108 255 / 0.16), transparent 70%), radial-gradient(ellipse 60% 60% at 85% 90%, rgb(84 232 224 / 0.06), transparent 70%)'],
  ['bright', 'radial-gradient(ellipse 80% 70% at 70% 25%, rgb(245 163 92 / 0.2), transparent 70%), radial-gradient(ellipse 60% 60% at 15% 85%, rgb(255 95 162 / 0.07), transparent 70%)'],
  ['low', 'radial-gradient(ellipse 80% 70% at 50% 100%, rgb(60 90 200 / 0.2), transparent 70%), radial-gradient(ellipse 50% 50% at 20% 10%, rgb(20 30 70 / 0.5), transparent 70%)'],
  ['calm', 'radial-gradient(ellipse 80% 70% at 25% 75%, rgb(84 232 224 / 0.13), transparent 70%), radial-gradient(ellipse 60% 60% at 80% 15%, rgb(139 108 255 / 0.08), transparent 70%)'],
];

// The welcome plays through once per visit.
let welcomed = false;

/**
 * The hero of New Tab: whatever the visitor says through Wispr Flow (or types,
 * or says into the fallback mic) is performed as kinetic typography.
 * Inspired by lyric speakers; the scenes and rules are original.
 */
export default function LyricStage() {
  const reducedMotion = useReducedMotion();
  const stageRef = useRef<HTMLDivElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const show = useRef<Performance | null>(null);
  const demoTimer = useRef(0);
  const [mood, setMood] = useState<Mood>('neutral');
  const [visitorText, setVisitorText] = useState<string | null>(null);
  const [playing, setPlaying] = useState(true);
  const [draft, setDraft] = useState('');
  const [hearing, setHearing] = useState('');
  const [heardRaw, setHeardRaw] = useState('');
  const wisprAt = useRef(0);
  const rawTimer = useRef(0);
  const pendingRaw = useRef('');
  const [focused, setFocused] = useState(false);

  const play = useCallback(
    (text: string, fromVisitor: boolean) => {
      const layer = layerRef.current;
      if (!layer) return;
      window.clearTimeout(demoTimer.current);
      show.current?.stop();
      setMood('neutral');
      setPlaying(true);
      if (fromVisitor) setVisitorText(text);
      show.current = perform(layer, text, {
        reducedMotion,
        onPhrase: (phrase) => phrase.mood && setMood(phrase.mood),
        onDone: () => {
          setPlaying(false);
          if (fromVisitor) return;
          welcomed = true;
          demoTimer.current = window.setTimeout(() => playRef.current(LYRICS.demo, false), DEMO_GAP_MS);
        },
      });
    },
    [reducedMotion],
  );
  const playRef = useRef(play);
  playRef.current = play;

  useEffect(() => {
    // A visitor who said their name at the start hears it first, until it has played through once.
    const name = welcomed ? '' : playerName();
    playRef.current(name ? LYRICS.welcome(name) : LYRICS.demo, false);
    return () => {
      window.clearTimeout(demoTimer.current);
      show.current?.stop();
    };
  }, []);

  // Nothing performs to an empty room: pause while the stage is scrolled away.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const observer = new IntersectionObserver(
      ([entry]) => (entry.isIntersecting ? show.current?.resume() : show.current?.pause()),
      { root: document.getElementById('page-panel'), threshold: 0.15 },
    );
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  const submit = (text: string) => {
    const words = text.trim();
    if (!words) return;
    window.clearTimeout(rawTimer.current);
    pendingRaw.current = '';
    setDraft('');
    setHeardRaw('');
    playRef.current(words, true);
  };

  // Wispr lands its text in one go and never presses Enter: perform it at once,
  // in place of the raw words the live mic was showing.
  const reading = useWisprInput(inputRef, () => {
    wisprAt.current = performance.now();
    submit(inputRef.current?.value ?? '');
  });

  // Raw speech from the live mic: show it, and perform it only if Wispr does not.
  const onRawPhrase = (text: string) => {
    if (performance.now() - wisprAt.current < WISPR_ECHO_MS) return;
    pendingRaw.current = `${pendingRaw.current} ${text}`.trim();
    setHeardRaw(pendingRaw.current);
    window.clearTimeout(rawTimer.current);
    rawTimer.current = window.setTimeout(() => {
      const words = pendingRaw.current;
      pendingRaw.current = '';
      setHeardRaw('');
      if (words) playRef.current(words, true);
    }, WISPR_GRACE_MS);
  };
  useEffect(() => () => window.clearTimeout(rawTimer.current), []);
  const live = `${heardRaw} ${hearing}`.trim();

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    submit(draft);
  };

  return (
    <section aria-label={LYRICS.label}>
      <div
        ref={stageRef}
        onClick={() => inputRef.current?.focus()}
        className="relative h-[clamp(300px,54vh,560px)] cursor-text overflow-hidden rounded-[1.75rem] border border-white/[0.08] bg-space/60"
      >
        {MOODS.map(([name, background]) => (
          <div
            key={name}
            aria-hidden="true"
            className={`absolute inset-0 transition-opacity duration-[1400ms] ease-out ${mood === name ? 'opacity-100' : 'opacity-0'}`}
            style={{ background }}
          />
        ))}
        <div aria-hidden="true" className="lyric-scan absolute inset-0" />
        <HudCorners inset={14} />

        <div ref={layerRef} aria-hidden="true" className="absolute inset-0 text-ink select-none" />

        <div className="pointer-events-none absolute top-5 left-6 flex items-center gap-2 font-mono text-[10px] tracking-[0.2em] text-ink-muted uppercase">
          <span className={`h-1.5 w-1.5 rounded-full ${visitorText ? 'bg-accent' : 'bg-ink-muted/60'}`} />
          {LYRICS.label} · {visitorText ? LYRICS.visitorTag : LYRICS.demoTag}
        </div>
        <VoiceBadge reading={reading} className="absolute top-4 left-1/2 -translate-x-1/2" />
        {!playing && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              playClick();
              playRef.current(visitorText ?? LYRICS.demo, visitorText !== null);
            }}
            className="absolute top-3.5 right-5 flex items-center gap-1.5 rounded-lg border border-white/[0.1] bg-space/70 px-2.5 py-1.5 font-mono text-[11px] text-ink-muted transition-colors hover:border-accent/50 hover:text-accent"
          >
            <RotateCcw className="h-3 w-3" strokeWidth={2} />
            {LYRICS.replay}
          </button>
        )}

        {live ? (
          <div className="pointer-events-none absolute inset-x-6 bottom-6 text-center" aria-hidden="true">
            <p className="font-mono text-[10px] tracking-[0.2em] text-accent uppercase">{LYRICS.live.tag}</p>
            <p className="mx-auto mt-1.5 line-clamp-2 max-w-3xl font-mono text-lg leading-snug text-ink/85 sm:text-2xl">
              {live.length > 140 ? `…${live.slice(-140)}` : live}
              <span className="story-caret ml-1 inline-block h-5 w-2.5 translate-y-1 bg-accent" />
            </p>
          </div>
        ) : (
          !focused &&
          !visitorText && (
            <p className="pointer-events-none absolute inset-x-6 bottom-5 flex items-center justify-center gap-2 text-center font-mono text-[11px] text-ink-muted">
              <Mic className="h-3 w-3 shrink-0 text-accent" strokeWidth={2} />
              {LYRICS.prompt}
            </p>
          )
        )}
        <p className="sr-only" aria-live="polite">
          {visitorText ?? ''}
        </p>
      </div>

      <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-start">
        <form onSubmit={onSubmit} className="flex min-w-0 flex-1 flex-col gap-1.5">
          <div className="flex h-11 items-center gap-2 rounded-xl border border-white/[0.08] bg-surface/70 pr-1.5 pl-3.5 transition-colors focus-within:border-accent/40">
            <Mic className="h-4 w-4 shrink-0 text-accent" strokeWidth={1.8} aria-hidden="true" />
            <input
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              aria-label={LYRICS.inputLabel}
              placeholder={LYRICS.placeholder}
              enterKeyHint="send"
              autoComplete="off"
              className="h-full min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-muted/70 focus-visible:outline-none"
            />
            <button
              type="submit"
              disabled={!draft.trim()}
              className="flex h-8 shrink-0 items-center gap-1.5 rounded-lg bg-accent px-3 text-xs font-medium text-space transition-opacity disabled:opacity-30"
            >
              {LYRICS.perform}
              <CornerDownLeft className="h-3 w-3" strokeWidth={2.2} />
            </button>
          </div>
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 px-1">
            <WisprHint />
            <span className="text-[11px] text-ink-muted/80">{LYRICS.languages}</span>
          </p>
        </form>
        <LiveWords onHearing={setHearing} onPhrase={onRawPhrase} />
      </div>
    </section>
  );
}
