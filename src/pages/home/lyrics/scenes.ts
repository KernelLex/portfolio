import gsap from 'gsap';
import { theme } from '../../../config';
import type { Ending, Phrase, Word } from './phrases';

/** A typeface for a phrase, as Tailwind classes. */
export type Face = { className: string };

/** The stage changes voice every phrase. */
export const FACES: ReadonlyArray<Face> = [
  { className: 'font-ui font-bold tracking-tight' },
  { className: 'font-display italic' },
  { className: 'font-condensed uppercase tracking-wide' },
  { className: 'font-mono font-medium tracking-tight' },
];

export type SceneName = 'giant' | 'stack' | 'scatter' | 'pop' | 'ribbon' | 'split';

export type SceneContext = {
  tl: gsap.core.Timeline;
  layer: HTMLElement;
  phrase: Phrase;
  face: Face;
  /** A contrasting face, for scenes with two voices. */
  alt: Face;
  w: number;
  h: number;
};

/** Speech-like pacing: longer words take longer to say. */
const wordTime = (word: Word) => Math.min(0.75, Math.max(0.26, 0.16 + 0.045 * word.text.length));
/** The breath after a phrase, by how it ended. */
const PAUSE: Record<Ending, number> = { none: 0.25, comma: 0.4, stop: 0.75, question: 0.85, exclaim: 0.85 };

function div(className: string): HTMLDivElement {
  const el = document.createElement('div');
  el.className = className;
  return el;
}

/** One word, sized and coloured by the emphasis rules. */
function wordSpan(word: Word): HTMLSpanElement {
  const span = document.createElement('span');
  span.className = 'inline-block whitespace-nowrap';
  span.textContent = word.text;
  if (word.caps) span.style.fontSize = '1.3em';
  else if (word.long) span.style.fontSize = '1.12em';
  if (word.count) span.classList.add('text-accent');
  return span;
}

/** Largest font size, from `start` down, at which an unwrapped element fits the box. */
function fit(el: HTMLElement, maxW: number, maxH: number, start: number): void {
  el.style.fontSize = `${start}px`;
  const scale = Math.min(1, maxW / Math.max(1, el.offsetWidth), maxH / Math.max(1, el.offsetHeight));
  el.style.fontSize = `${Math.max(12, Math.floor(start * scale))}px`;
}

/** The same, for a block that wraps at a fixed width: shrink until it is short enough. */
function fitWrapped(el: HTMLElement, maxH: number, start: number): void {
  let size = start;
  el.style.fontSize = `${size}px`;
  for (let i = 0; i < 20 && el.offsetHeight > maxH && size > 14; i++) {
    size *= 0.9;
    el.style.fontSize = `${size}px`;
  }
}

function centre(el: HTMLElement): void {
  el.style.left = '50%';
  el.style.top = '50%';
  gsap.set(el, { xPercent: -50, yPercent: -50 });
}

/** Numbers count up from zero as they land. */
function countUps(tl: gsap.core.Timeline, spans: HTMLElement[], words: Word[], at: number): void {
  words.forEach((word, i) => {
    const count = word.count;
    const span = spans[i];
    if (!count || !span) return;
    const format = (v: number) => {
      const n = count.locale
        ? v.toLocaleString(count.locale, { minimumFractionDigits: count.decimals, maximumFractionDigits: count.decimals })
        : v.toFixed(count.decimals);
      return `${count.prefix}${n}${count.suffix}`;
    };
    // Hold the final width so the line does not jitter as digits arrive.
    span.style.minWidth = `${span.offsetWidth}px`;
    span.style.textAlign = 'center';
    span.textContent = format(0);
    const state = { v: 0 };
    tl.to(state, {
      v: count.value,
      duration: 1,
      ease: 'power2.out',
      onUpdate: () => {
        span.textContent = format(count.decimals ? state.v : Math.round(state.v));
      },
    }, at);
  });
}

function holdThenExit(ctx: SceneContext, targets: gsap.TweenTarget, vars: gsap.TweenVars, at?: number): void {
  const { tl, phrase } = ctx;
  tl.to({}, { duration: PAUSE[phrase.ending] + 0.2 }, at);
  tl.addLabel('exit');
  tl.to(targets, { duration: 0.38, ease: 'power2.in', ...vars }, 'exit');
}

/** "!" lands with a punch and a small shake. */
function punch(tl: gsap.core.Timeline, el: HTMLElement, at: number): void {
  tl.fromTo(el, { x: -10 }, { x: 0, duration: 0.4, ease: 'elastic.out(1.2, 0.3)' }, at + 0.25);
}

/** One or two words, as big as the stage allows. */
function giant(ctx: SceneContext): void {
  const { tl, layer, phrase, face, w, h } = ctx;
  const box = div(`absolute flex w-max flex-col items-center leading-[0.9] ${face.className}`);
  const spans = phrase.words.map((word) => {
    const line = div('whitespace-nowrap');
    const span = wordSpan(word);
    line.append(span);
    box.append(line);
    return span;
  });
  layer.append(box);
  fit(box, w * 0.86, h * 0.74, h * 0.66);
  centre(box);

  const loud = phrase.ending === 'exclaim';
  if (loud) {
    tl.fromTo(box, { scale: 1.8, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.45, ease: 'back.out(2.2)' }, 0);
    punch(tl, box, 0);
  } else {
    tl.fromTo(
      box,
      { scale: 1.14, opacity: 0, filter: 'blur(14px)' },
      { scale: 1, opacity: 1, filter: 'blur(0px)', duration: 0.6, ease: 'expo.out' },
      0,
    );
  }
  countUps(tl, spans, phrase.words, 0.1);
  holdThenExit(ctx, box, { scale: 0.94, opacity: 0, filter: 'blur(8px)' }, Math.max(0.7, phrase.words.reduce((t, wd) => t + wordTime(wd), 0)));
}

/** A word per line, each line as wide as the stage, alternating sides. */
function stack(ctx: SceneContext): void {
  const { tl, layer, phrase, face, w, h } = ctx;
  const box = div(`absolute flex w-max flex-col leading-[0.88] ${face.className}`);
  const lineH = (h * 0.8) / phrase.words.length;
  const lines = phrase.words.map((word, i) => {
    const line = div('whitespace-nowrap');
    line.style.alignSelf = ['flex-start', 'flex-end', 'center'][i % 3];
    line.append(wordSpan(word));
    box.append(line);
    return line;
  });
  layer.append(box);
  lines.forEach((line) => fit(line, w * 0.78, lineH, lineH * 1.1));
  centre(box);

  let at = 0;
  lines.forEach((line, i) => {
    const side = i % 2 ? 1 : -1;
    tl.from(line, { x: side * w * 0.22, skewX: -side * 14, opacity: 0, duration: 0.5, ease: 'power3.out' }, at);
    at += wordTime(phrase.words[i]);
  });
  countUps(tl, lines.map((l) => l.firstElementChild as HTMLElement), phrase.words, 0);
  if (phrase.ending === 'exclaim') punch(tl, box, at - 0.2);
  holdThenExit(ctx, lines, { y: -h * 0.08, opacity: 0, stagger: 0.05 }, at + 0.2);
}

/** Words flung across the stage like a collage. */
function scatter(ctx: SceneContext): void {
  const { tl, layer, phrase, face, w, h } = ctx;
  const n = phrase.words.length;
  const band = (h * 0.82) / n;
  const tilt = phrase.ending === 'question' ? 18 : 10;
  const spans = phrase.words.map((word, i) => {
    const el = div(`absolute w-max whitespace-nowrap leading-none ${face.className}`);
    el.append(wordSpan(word));
    layer.append(el);
    fit(el, w * 0.62, band * 0.92, band * 1.05);
    const half = el.offsetWidth / 2;
    const min = half + w * 0.04;
    const max = w - half - w * 0.04;
    el.style.left = `${min < max ? min + Math.random() * (max - min) : w / 2}px`;
    el.style.top = `${h * 0.09 + band * (i + 0.5)}px`;
    gsap.set(el, { xPercent: -50, yPercent: -50, rotation: (Math.random() * 2 - 1) * tilt });
    return el;
  });

  let at = 0;
  spans.forEach((el, i) => {
    tl.from(el, { scale: 0, opacity: 0, rotation: `+=${(i % 2 ? 1 : -1) * 25}`, duration: 0.5, ease: 'back.out(1.8)' }, at);
    at += wordTime(phrase.words[i]);
  });
  countUps(tl, spans.map((s) => s.firstElementChild as HTMLElement), phrase.words, 0);
  holdThenExit(ctx, spans, { scale: 0.8, opacity: 0, y: '-=24', stagger: 0.04 }, at + 0.15);
}

/** The sentence, word by word, each one lit amber as it is said. */
function pop(ctx: SceneContext): void {
  const { tl, layer, phrase, face, w, h } = ctx;
  const box = div(`absolute flex flex-wrap items-baseline justify-center gap-x-[0.26em] text-center leading-[1.02] ${face.className}`);
  box.style.width = `${w * 0.84}px`;
  const spans = phrase.words.map((word) => {
    const span = wordSpan(word);
    box.append(span);
    return span;
  });
  layer.append(box);
  fitWrapped(box, h * 0.72, h * 0.3);
  centre(box);

  let at = 0;
  spans.forEach((span, i) => {
    const rest = getComputedStyle(span).color;
    tl.fromTo(span, { y: '0.45em', opacity: 0, color: theme.accent }, { y: 0, opacity: 1, duration: 0.32, ease: 'power3.out' }, at);
    tl.to(span, { color: rest, duration: 0.45, ease: 'power1.out' }, at + wordTime(phrase.words[i]));
    at += wordTime(phrase.words[i]);
  });
  countUps(tl, spans, phrase.words, 0);
  if (phrase.ending === 'exclaim') punch(tl, box, at - 0.2);
  holdThenExit(ctx, box, { y: -h * 0.06, opacity: 0 }, at + 0.25);
}

/** The phrase slides through on a tilted band, a ghost of it running the other way behind. */
function ribbon(ctx: SceneContext): void {
  const { tl, layer, phrase, face, w, h } = ctx;
  const make = (ghost: boolean) => {
    const band = div(
      `absolute top-1/2 left-[-10%] w-[120%] overflow-hidden py-[0.1em] ${ghost ? 'opacity-50' : 'border-y border-white/10 bg-white/[0.035]'}`,
    );
    const track = div(`w-max whitespace-nowrap leading-none ${face.className}`);
    track.style.fontSize = `${h * (ghost ? 0.2 : 0.27)}px`;
    if (ghost) {
      track.style.color = 'transparent';
      track.style.setProperty('-webkit-text-stroke', '1px rgb(233 235 242 / 0.35)');
    }
    phrase.words.forEach((word, i) => {
      if (i) track.append(document.createTextNode(' '));
      track.append(wordSpan(word));
    });
    band.append(track);
    layer.append(band);
    gsap.set(band, { yPercent: ghost ? 40 : -50, rotation: ghost ? 4 : -5 });
    return { band, track };
  };
  const back = make(true);
  const front = make(false);
  const bandW = front.band.offsetWidth;
  const travel = bandW + front.track.offsetWidth;
  const duration = Math.max(2.2, travel / (w * 0.6));

  tl.fromTo([front.band, back.band], { opacity: 0 }, { opacity: (i) => (i ? 0.5 : 1), duration: 0.3 }, 0);
  tl.fromTo(front.track, { x: bandW }, { x: -front.track.offsetWidth, duration, ease: 'none' }, 0);
  tl.fromTo(back.track, { x: -back.track.offsetWidth }, { x: bandW, duration, ease: 'none' }, 0);
  tl.addLabel('exit', duration - 0.4);
  tl.to([front.band, back.band], { opacity: 0, duration: 0.4, ease: 'power1.in' }, 'exit');
}

/** Two halves of the phrase in two voices, either side of a line drawn across. */
function split(ctx: SceneContext): void {
  const { tl, layer, phrase, face, alt, w, h } = ctx;
  const half = Math.ceil(phrase.words.length / 2);
  const parts = [phrase.words.slice(0, half), phrase.words.slice(half)];
  const rule = div('absolute top-1/2 left-[8%] h-px w-[84%] origin-left bg-accent/60');
  layer.append(rule);

  const lines = parts.map((words, i) => {
    const line = div(`absolute w-max whitespace-nowrap leading-none ${i ? alt.className : face.className}`);
    words.forEach((word, j) => {
      if (j) line.append(document.createTextNode(' '));
      line.append(wordSpan(word));
    });
    layer.append(line);
    fit(line, w * 0.84, h * 0.32, h * 0.3);
    line.style.top = i ? `${h * 0.56}px` : `${h * 0.44 - line.offsetHeight}px`;
    line.style.left = i ? `${w * 0.92 - line.offsetWidth}px` : `${w * 0.08}px`;
    return line;
  });

  tl.fromTo(rule, { scaleX: 0 }, { scaleX: 1, duration: 0.6, ease: 'expo.out' }, 0);
  const topTime = parts[0].reduce((t, wd) => t + wordTime(wd), 0);
  tl.from(lines[0], { x: -w * 0.25, opacity: 0, duration: 0.55, ease: 'power3.out' }, 0.1);
  tl.from(lines[1], { x: w * 0.25, opacity: 0, duration: 0.55, ease: 'power3.out' }, 0.1 + topTime);
  const spans = lines.flatMap((l) => [...l.querySelectorAll('span')] as HTMLElement[]);
  countUps(tl, spans, [...parts[0], ...parts[1]], 0.1);
  const said = phrase.words.reduce((t, wd) => t + wordTime(wd), 0);
  tl.to({}, { duration: PAUSE[phrase.ending] + 0.2 }, 0.3 + said);
  tl.addLabel('exit');
  tl.to(lines[0], { x: -w * 0.15, opacity: 0, duration: 0.38, ease: 'power2.in' }, 'exit');
  tl.to(lines[1], { x: w * 0.15, opacity: 0, duration: 0.38, ease: 'power2.in' }, 'exit');
  tl.to(rule, { scaleX: 0, transformOrigin: 'right center', duration: 0.38, ease: 'power2.in' }, 'exit');
}

/** Reduced motion: the phrase simply fades in and out, nothing moves. */
export function calm(ctx: SceneContext): void {
  const { tl, layer, phrase, face, w, h } = ctx;
  const box = div(`absolute flex flex-wrap justify-center gap-x-[0.26em] text-center leading-tight ${face.className}`);
  box.style.width = `${w * 0.84}px`;
  phrase.words.forEach((word) => box.append(wordSpan(word)));
  layer.append(box);
  fitWrapped(box, h * 0.6, h * 0.2);
  centre(box);
  tl.fromTo(box, { opacity: 0 }, { opacity: 1, duration: 0.4 }, 0);
  holdThenExit(ctx, box, { opacity: 0 }, 0.4 + phrase.words.reduce((t, wd) => t + wordTime(wd), 0));
}

export const SCENES: Record<SceneName, (ctx: SceneContext) => void> = { giant, stack, scatter, pop, ribbon, split };

/** Rules first, then a little chance - and never the same scene twice running. */
export function chooseScene(phrase: Phrase, previous: SceneName | null): SceneName {
  const n = phrase.words.length;
  const options: SceneName[] =
    n <= 2 ? ['giant']
    : phrase.ending === 'question' ? ['scatter', 'stack']
    : n === 3 ? ['stack', 'pop', 'scatter']
    : n === 4 ? ['stack', 'split', 'pop', 'ribbon']
    : ['pop', 'ribbon', 'split', 'scatter'];
  const fresh = options.filter((o) => o !== previous);
  const pool = fresh.length ? fresh : options;
  return pool[Math.floor(Math.random() * pool.length)];
}
