import gsap from 'gsap';
import { splitPhrases, type Phrase } from './phrases';
import { FACES, SCENES, calm, chooseScene, type SceneName } from './scenes';

export type Performance = {
  stop: () => void;
  pause: () => void;
  resume: () => void;
};

type Options = {
  reducedMotion: boolean;
  /** Each phrase as it starts, so the stage can follow its mood. */
  onPhrase?: (phrase: Phrase) => void;
  /** The last phrase has started leaving. */
  onDone?: () => void;
};

/**
 * Perform text on the stage, one phrase at a time. Each phrase gets its own
 * layer and timeline; the next one starts while the last is still leaving, so
 * the words overlap like a breath rather than waiting in line.
 */
export function perform(stage: HTMLElement, text: string, { reducedMotion, onPhrase, onDone }: Options): Performance {
  const phrases = splitPhrases(text);
  const live = new Set<gsap.core.Timeline>();
  let index = 0;
  let previous: SceneName | null = null;
  let stopped = false;
  let paused = false;

  const next = () => {
    if (stopped) return;
    if (index >= phrases.length) {
      onDone?.();
      return;
    }
    const phrase = phrases[index];
    const face = FACES[index % FACES.length];
    const alt = FACES[(index + 1) % FACES.length];
    index += 1;

    const layer = document.createElement('div');
    layer.className = 'absolute inset-0';
    stage.append(layer);
    // "?" tilts the whole layout.
    if (phrase.ending === 'question' && !reducedMotion) gsap.set(layer, { rotation: -5 });

    const tl = gsap.timeline({
      paused,
      onComplete: () => {
        live.delete(tl);
        layer.remove();
      },
    });
    live.add(tl);
    onPhrase?.(phrase);

    const ctx = { tl, layer, phrase, face, alt, w: stage.clientWidth, h: stage.clientHeight };
    if (reducedMotion) calm(ctx);
    else {
      previous = chooseScene(phrase, previous);
      SCENES[previous](ctx);
    }
    tl.call(next, undefined, 'exit+=0.22');
  };

  next();

  return {
    stop: () => {
      stopped = true;
      live.forEach((tl) => tl.kill());
      live.clear();
      stage.replaceChildren();
    },
    pause: () => {
      paused = true;
      live.forEach((tl) => tl.pause());
    },
    resume: () => {
      paused = false;
      live.forEach((tl) => tl.resume());
    },
  };
}
