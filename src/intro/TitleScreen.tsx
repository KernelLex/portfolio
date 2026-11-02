import { useCallback, useEffect, useState, type CSSProperties } from 'react';
import SoundToggle from '../components/SoundToggle';
import { TITLE, type StartMode } from '../content/title';
import { enterFullscreen } from '../lib/fullscreen';
import { playClick, playSting, playWhoosh } from '../lib/sound';
import BotSprite from '../tour/BotSprite';
import { INTRO_FILES } from './assets';
import NameEntry from './NameEntry';

type Props = {
  onStart: (mode: StartMode) => void;
  reducedMotion: boolean;
};

/** Long enough to read the studio line, short enough nobody waits on it. */
const MIN_LOADING_MS = 1900;
const OUT_MS = 450;
const BLOCKS = 24;
const EMBERS = 26;
const ART = `${import.meta.env.BASE_URL}assets/intro/`;

/** Everything the street needs, fetched while the title plays: the engine, the scenes, the fonts, the art. */
function preload(onProgress: (k: number) => void): () => void {
  let cancelled = false;
  const image = (url: string) =>
    new Promise<void>((resolve) => {
      const img = new Image();
      img.onload = img.onerror = () => resolve();
      img.src = url;
    });
  const tasks: Array<() => Promise<unknown>> = [
    () => import('phaser'),
    () => import('./scenes/BootScene'),
    () => import('./scenes/StreetScene'),
    () => import('./scenes/CafeScene'),
    () => import('./scenes/LinkScene'),
    () => Promise.all([document.fonts.load('16px "Press Start 2P"'), document.fonts.load('8px "Silkscreen"')]),
    ...INTRO_FILES.map((url) => () => image(url)),
  ];
  let done = 0;
  tasks.forEach((task) =>
    task()
      .catch(() => undefined)
      .finally(() => {
        done += 1;
        if (!cancelled) onProgress(done / tasks.length);
      }),
  );
  return () => {
    cancelled = true;
  };
}

const vars = (v: Record<string, string | number>) => v as CSSProperties;
const coarse = () => window.matchMedia('(pointer: coarse)').matches;

/** Sparks off the neon, drifting up through the rain. Placed once, at random. */
function Embers() {
  const [embers] = useState(() =>
    Array.from({ length: EMBERS }, (_, i) => ({
      left: Math.random() * 100,
      size: 2 + Math.round(Math.random() * 2),
      duration: 7 + Math.random() * 8,
      delay: -Math.random() * 15,
      drift: (Math.random() - 0.5) * 120,
      colour: i % 3 === 0 ? '#54e8e0' : i % 5 === 0 ? '#ff5fa2' : '#f5a35c',
    })),
  );
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {embers.map((e, i) => (
        <span
          key={i}
          className="title-ember"
          style={vars({ left: `${e.left}%`, width: e.size, height: e.size, background: e.colour, animationDuration: `${e.duration}s`, animationDelay: `${e.delay}s`, '--drift': `${e.drift}px` })}
        />
      ))}
    </div>
  );
}

/**
 * The title screen, like a game booting. While the street loads, the logo
 * stands hollow and fills with light as real progress comes in, over a dark
 * city and a boot log. Then the city powers on: a flash, a jolt, the letters
 * flicker into neon, sparks rise, lightning now and then, and the menu slides
 * in. Starting asks the browser for full screen (only allowed from a click or
 * a key).
 */
export default function TitleScreen({ onStart, reducedMotion }: Props) {
  const [progress, setProgress] = useState(0);
  const [minDone, setMinDone] = useState(false);
  const [choice, setChoice] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const ready = progress >= 1 && minDone;

  useEffect(() => preload(setProgress), []);
  useEffect(() => {
    const t = window.setTimeout(() => setMinDone(true), reducedMotion ? 300 : MIN_LOADING_MS);
    return () => window.clearTimeout(t);
  }, [reducedMotion]);
  useEffect(() => {
    if (ready && !reducedMotion) playSting();
  }, [ready, reducedMotion]);

  const start = useCallback(
    (index: number) => {
      if (leaving) return;
      enterFullscreen();
      playWhoosh();
      setLeaving(true);
      window.setTimeout(() => onStart(TITLE.menu[index].id), reducedMotion ? 0 : OUT_MS);
    },
    [leaving, onStart, reducedMotion],
  );

  const move = useCallback((delta: -1 | 1) => {
    playClick();
    setChoice((c) => (c + delta + TITLE.menu.length) % TITLE.menu.length);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement | null)?.closest('input, textarea')) return;
      if (['ArrowUp', 'ArrowDown', 'KeyW', 'KeyS'].includes(e.code)) {
        e.preventDefault();
        move(e.code === 'ArrowUp' || e.code === 'KeyW' ? -1 : 1);
      } else if (e.code === 'Enter' || e.code === 'Space' || e.code === 'NumpadEnter') {
        e.preventDefault();
        start(choice);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [ready, choice, start, move]);

  const moving = !reducedMotion;
  const lit = Math.round(progress * BLOCKS);
  const logged = Math.min(TITLE.flavour.length, Math.floor(progress * TITLE.flavour.length) + 1);
  const layer = (file: string, style: CSSProperties) => (
    <div aria-hidden="true" className={`title-layer ${moving ? 'title-move' : ''}`} style={{ backgroundImage: `url(${ART}${file})`, ...style }} />
  );

  return (
    <div className={`title-screen fixed inset-0 z-50 overflow-hidden bg-[#070912] select-none ${ready ? 'title-ready' : ''} ${moving ? 'title-motion' : ''} ${leaving ? 'title-leaving' : ''}`}>
      {/* The city, from the intro's own art, drifting at four depths under a slow push in. */}
      <div aria-hidden="true" className="title-world absolute inset-0">
        {layer('sky.png', { height: '100%', bottom: 0, animationDuration: '240s', ['--tile' as string]: 'calc(100vh * 1.778)' })}
        {layer('megacity.png', { height: '78%', bottom: '14%', animationDuration: '160s', opacity: 0.9, ['--tile' as string]: 'calc(78vh * 2.286)' })}
        {layer('skyline.png', { height: '42%', bottom: '18%', animationDuration: '110s', ['--tile' as string]: 'calc(42vh * 4.364)' })}
        {layer('buildings.png', { height: '64%', bottom: '6%', animationDuration: '70s', ['--tile' as string]: 'calc(64vh * 2.824)' })}
      </div>
      {moving && <div aria-hidden="true" className="title-rain absolute inset-0" />}
      {moving && ready && <div aria-hidden="true" className="title-lightning absolute inset-0" />}
      <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(90deg,rgb(7_9_18/0.92)_0%,rgb(7_9_18/0.55)_45%,rgb(7_9_18/0.15)_100%)]" />
      <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(0deg,rgb(7_9_18/0.9),transparent_35%)]" />
      {/* Until it is ready the city is a silhouette; then it powers on in flickers. */}
      <div aria-hidden="true" className="title-dim absolute inset-0 bg-[#04050b]" />
      {moving && <Embers />}
      <div aria-hidden="true" className="lyric-scan absolute inset-0 opacity-80" />
      <div aria-hidden="true" className="title-vignette absolute inset-0" />
      {moving && ready && <div aria-hidden="true" className="title-flash absolute inset-0 bg-white" />}

      <div className="absolute top-4 right-4 z-10">
        <SoundToggle label="Music" />
      </div>

      <div className="title-stage relative flex h-full flex-col justify-between px-[7vw] pt-[9vh] pb-[7vh]">
        <p className="font-pixel text-[10px] tracking-[0.3em] text-ink-muted" aria-label={TITLE.studio}>
          {[...TITLE.studio].map((ch, i) => (
            <span key={i} aria-hidden="true" className={moving ? 'title-key' : undefined} style={vars({ '--i': i })}>
              {ch}
            </span>
          ))}
        </p>

        <div>
          {/* One logo throughout: hollow while loading, filling with light, then neon. */}
          <div className="relative w-fit">
            <h1 data-text={TITLE.name} aria-label={TITLE.name} className={`title-mark font-pixel text-[clamp(44px,9vw,148px)] leading-none ${ready ? 'title-logo text-white' : 'title-hollow'} ${ready && moving ? 'title-glitch' : ''}`}>
              {[...TITLE.name].map((ch, i) => (
                <span key={i} aria-hidden="true" className="title-letter" style={vars({ '--i': i })}>
                  {ch}
                </span>
              ))}
            </h1>
            {!ready && (
              <span aria-hidden="true" className="title-fill absolute inset-0 font-pixel text-[clamp(44px,9vw,148px)] leading-none text-accent" style={{ clipPath: `inset(${(1 - progress) * 100}% 0 0 0)` }}>
                {TITLE.name}
              </span>
            )}
          </div>

          {ready ? (
            <>
              <p className="title-sub mt-5 font-pixel text-[clamp(12px,1.6vw,22px)] tracking-[0.5em] text-accent">{TITLE.subtitle}</p>
              <p className="title-rise mt-3 font-sign text-sm text-ink/80" style={vars({ '--d': '1050ms' })}>
                {TITLE.tagline}
              </p>

              <div className="title-rise mt-[4vh]" style={vars({ '--d': '1150ms' })}>
                <NameEntry onMove={move} onEnter={() => start(choice)} autoFocus={!coarse()} moving={moving} />
              </div>

              <ul className="mt-[4vh] space-y-3">
                {TITLE.menu.map((item, i) => {
                  const on = i === choice;
                  return (
                    <li key={item.id} className="title-slide" style={vars({ '--d': `${1250 + i * 140}ms` })}>
                      <button
                        type="button"
                        onMouseEnter={() => setChoice(i)}
                        onFocus={() => setChoice(i)}
                        onClick={() => start(i)}
                        aria-current={on ? 'true' : undefined}
                        className={`title-option flex items-center gap-4 font-pixel text-[clamp(13px,1.5vw,20px)] transition-colors ${on ? 'title-option-on text-white' : 'text-ink-muted hover:text-ink'}`}
                      >
                        <span className={`w-5 text-accent ${on && moving ? 'title-blink' : ''}`} aria-hidden="true">
                          {on ? '▶' : ''}
                        </span>
                        {item.label}
                        {item.id === 'tour' && <BotSprite className="h-7 w-[1.6rem]" />}
                        <span className={`font-sign text-[11px] tracking-normal ${on ? 'text-accent' : 'text-transparent'}`}>{item.hint}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </>
          ) : (
            <div className="mt-8 max-w-md" role="status" aria-live="polite">
              <p className="font-pixel text-[11px] tracking-[0.25em] text-white">
                {TITLE.loading} <span className="text-accent">{Math.round(progress * 100)}%</span>
              </p>
              <div className="mt-3 flex gap-1 border-2 border-white/70 p-1.5" aria-hidden="true">
                {Array.from({ length: BLOCKS }, (_, i) => (
                  <span key={i} className={`h-4 flex-1 ${i < lit ? 'bg-accent shadow-[0_0_8px_rgb(245_163_92/0.7)]' : 'bg-white/[0.06]'}`} />
                ))}
              </div>
              <ul className="mt-3 space-y-0.5 font-sign text-[11px]" aria-hidden="true">
                {TITLE.flavour.slice(0, logged).map((line, i) => {
                  const done = i < logged - 1 || progress >= 1;
                  return (
                    <li key={line} className="flex gap-2 text-ink-muted" style={moving ? { animation: 'fade-in 200ms ease-out both' } : undefined}>
                      <span className="text-accent">&gt;</span>
                      {line}
                      <span className={done ? 'text-[#54e8e0]' : `text-ink-muted ${moving ? 'title-blink' : ''}`}>{done ? TITLE.ok : '..'}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-end justify-between gap-3 font-sign text-[11px] text-ink-muted">
          {ready ? (
            <p className="title-rise" style={vars({ '--d': '1600ms' })}>
              <span className={`mr-4 font-pixel text-[10px] text-white ${moving ? 'title-blink' : ''}`}>{TITLE.press}</span>
              {TITLE.controls} · {TITLE.fullscreen}
            </p>
          ) : (
            <span />
          )}
          <p>{TITLE.footer}</p>
        </div>
      </div>
    </div>
  );
}
