import { useCallback, useEffect, useState } from 'react';
import SoundToggle from '../components/SoundToggle';
import { TITLE, type StartMode } from '../content/title';
import { enterFullscreen } from '../lib/fullscreen';
import { playClick, playWhoosh } from '../lib/sound';
import BotSprite from '../tour/BotSprite';
import { INTRO_FILES } from './assets';

type Props = {
  onStart: (mode: StartMode) => void;
  reducedMotion: boolean;
};

/** Long enough to read the studio line, short enough nobody waits on it. */
const MIN_LOADING_MS = 1700;
const OUT_MS = 450;
const BLOCKS = 24;
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

/**
 * The title screen, like a game booting: a pixel loading bar with real
 * progress, then the logo over the city's own art, and a menu. Starting asks
 * the browser for full screen (only allowed from a click or a key).
 */
export default function TitleScreen({ onStart, reducedMotion }: Props) {
  const [progress, setProgress] = useState(0);
  const [minDone, setMinDone] = useState(false);
  const [choice, setChoice] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const [flavour, setFlavour] = useState(0);
  const ready = progress >= 1 && minDone;

  useEffect(() => preload(setProgress), []);
  useEffect(() => {
    const t = window.setTimeout(() => setMinDone(true), reducedMotion ? 300 : MIN_LOADING_MS);
    return () => window.clearTimeout(t);
  }, [reducedMotion]);
  useEffect(() => {
    if (ready) return;
    const id = window.setInterval(() => setFlavour((f) => (f + 1) % TITLE.flavour.length), 600);
    return () => window.clearInterval(id);
  }, [ready]);

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

  useEffect(() => {
    if (!ready) return;
    const onKey = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'KeyW', 'KeyS'].includes(e.code)) {
        e.preventDefault();
        playClick();
        setChoice((c) => (c + (e.code === 'ArrowUp' || e.code === 'KeyW' ? -1 : 1) + TITLE.menu.length) % TITLE.menu.length);
      } else if (e.code === 'Enter' || e.code === 'Space' || e.code === 'NumpadEnter') {
        e.preventDefault();
        start(choice);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [ready, choice, start]);

  const still = reducedMotion ? '' : 'title-move';
  const lit = Math.round(progress * BLOCKS);

  return (
    <div className={`title-screen fixed inset-0 z-50 overflow-hidden bg-[#070912] select-none ${leaving ? 'title-leaving' : ''}`}>
      {/* The city, from the intro's own art, drifting at three depths. */}
      <div aria-hidden="true" className={`title-layer ${still}`} style={{ backgroundImage: `url(${ART}sky.png)`, height: '100%', bottom: 0, animationDuration: '240s', ['--tile' as string]: 'calc(100vh * 1.778)' }} />
      <div aria-hidden="true" className={`title-layer ${still}`} style={{ backgroundImage: `url(${ART}megacity.png)`, height: '78%', bottom: '14%', animationDuration: '160s', opacity: 0.9, ['--tile' as string]: 'calc(78vh * 2.286)' }} />
      <div aria-hidden="true" className={`title-layer ${still}`} style={{ backgroundImage: `url(${ART}skyline.png)`, height: '42%', bottom: '18%', animationDuration: '110s', ['--tile' as string]: 'calc(42vh * 4.364)' }} />
      <div aria-hidden="true" className={`title-layer ${still}`} style={{ backgroundImage: `url(${ART}buildings.png)`, height: '64%', bottom: '6%', animationDuration: '70s', ['--tile' as string]: 'calc(64vh * 2.824)' }} />
      {!reducedMotion && <div aria-hidden="true" className="title-rain absolute inset-0" />}
      <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(90deg,rgb(7_9_18/0.92)_0%,rgb(7_9_18/0.55)_45%,rgb(7_9_18/0.15)_100%)]" />
      <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(0deg,rgb(7_9_18/0.9),transparent_35%)]" />
      <div aria-hidden="true" className="lyric-scan absolute inset-0 opacity-80" />

      <div className="absolute top-4 right-4 z-10">
        <SoundToggle label="Music" />
      </div>

      <div className="relative flex h-full flex-col justify-between px-[7vw] pt-[9vh] pb-[7vh]">
        <p className="font-pixel text-[10px] tracking-[0.3em] text-ink-muted" style={reducedMotion ? undefined : { animation: 'fade-in 900ms ease-out both' }}>
          {TITLE.studio}
        </p>

        {ready ? (
          <div>
            <h1 className="title-logo font-pixel text-[clamp(44px,9vw,148px)] leading-none text-white" style={reducedMotion ? undefined : { animation: 'title-drop 700ms cubic-bezier(.2,1.6,.4,1) both' }}>
              {TITLE.name}
            </h1>
            <p className="mt-5 font-pixel text-[clamp(12px,1.6vw,22px)] tracking-[0.5em] text-accent" style={reducedMotion ? undefined : { animation: 'fade-in 500ms ease-out 450ms both' }}>
              {TITLE.subtitle}
            </p>
            <p className="mt-3 font-sign text-sm text-ink/80" style={reducedMotion ? undefined : { animation: 'fade-in 500ms ease-out 650ms both' }}>
              {TITLE.tagline}
            </p>

            <ul className="mt-[7vh] space-y-3" style={reducedMotion ? undefined : { animation: 'fade-in 500ms ease-out 900ms both' }}>
              {TITLE.menu.map((item, i) => {
                const on = i === choice;
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onMouseEnter={() => setChoice(i)}
                      onFocus={() => setChoice(i)}
                      onClick={() => start(i)}
                      aria-current={on ? 'true' : undefined}
                      className={`flex items-center gap-4 font-pixel text-[clamp(13px,1.5vw,20px)] transition-colors ${on ? 'text-white' : 'text-ink-muted hover:text-ink'}`}
                    >
                      <span className={`w-5 text-accent ${on && !reducedMotion ? 'title-blink' : ''}`} aria-hidden="true">
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
          </div>
        ) : (
          <div className="max-w-md" role="status" aria-live="polite">
            <p className="font-pixel text-[11px] tracking-[0.25em] text-white">
              {TITLE.loading} <span className="text-accent">{Math.round(progress * 100)}%</span>
            </p>
            <div className="mt-3 flex gap-1 border-2 border-white/70 p-1.5" aria-hidden="true">
              {Array.from({ length: BLOCKS }, (_, i) => (
                <span key={i} className={`h-4 flex-1 ${i < lit ? 'bg-accent' : 'bg-white/[0.06]'}`} />
              ))}
            </div>
            <p className="mt-3 font-sign text-[11px] text-ink-muted">{TITLE.flavour[flavour]}…</p>
          </div>
        )}

        <div className="flex flex-wrap items-end justify-between gap-3 font-sign text-[11px] text-ink-muted">
          {ready ? (
            <p>
              <span className={`mr-4 font-pixel text-[10px] text-white ${reducedMotion ? '' : 'title-blink'}`}>{TITLE.press}</span>
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
