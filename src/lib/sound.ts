import { storageKeys } from '../config';
import { readFlag, writeFlag } from './storage';

/**
 * UI sound, muted by default (CLAUDE.md 5). Tones are synthesised with WebAudio
 * rather than shipped as files, so the intro stays light and there is nothing
 * to license. TASK-02 can swap these for real samples behind the same API.
 */
let enabled = readFlag(storageKeys.soundOn, false);
let ctx: AudioContext | null = null;
const listeners = new Set<() => void>();

function audio(): AudioContext | null {
  if (!enabled) return null;
  if (!ctx) {
    try {
      ctx = new AudioContext();
    } catch {
      return null;
    }
  }
  // Browsers suspend the context until a user gesture; resume lazily.
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

export function isSoundOn(): boolean {
  return enabled;
}

export function setSoundOn(value: boolean): void {
  if (enabled === value) return;
  enabled = value;
  writeFlag(storageKeys.soundOn, value);
  listeners.forEach((fn) => fn());
  if (value) playClick();
}

export function subscribeSound(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

type ToneOptions = {
  freq: number;
  to?: number;
  duration: number;
  type?: OscillatorType;
  gain?: number;
};

function tone({ freq, to, duration, type = 'sine', gain = 0.05 }: ToneOptions): void {
  const ac = audio();
  if (!ac) return;
  const osc = ac.createOscillator();
  const vol = ac.createGain();
  const now = ac.currentTime;

  osc.type = type;
  osc.frequency.setValueAtTime(freq, now);
  if (to !== undefined) osc.frequency.exponentialRampToValueAtTime(to, now + duration);

  vol.gain.setValueAtTime(0, now);
  vol.gain.linearRampToValueAtTime(gain, now + 0.01);
  vol.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  osc.connect(vol).connect(ac.destination);
  osc.start(now);
  osc.stop(now + duration + 0.02);
}

/** Soft, short - for buttons and tabs. */
export function playClick(): void {
  tone({ freq: 880, to: 620, duration: 0.07, type: 'triangle', gain: 0.04 });
}

/** Longer downward sweep - for entering the door / changing worlds. */
export function playWhoosh(): void {
  tone({ freq: 520, to: 90, duration: 0.55, type: 'sawtooth', gain: 0.035 });
}
