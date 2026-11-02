import { storageKeys } from '../config';
import { readFlag, writeFlag } from './storage';

/**
 * UI sound, muted by default (CLAUDE.md 5). Tones are synthesised with WebAudio
 * rather than shipped as files, so the site stays light and there is nothing
 * to license. Real samples could replace them behind the same API.
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

// A remembered "sound on" cannot start before the visitor interacts (autoplay
// policy), so the music would wait for the first sound effect. Wake the
// context on their first key or touch instead.
const wake = () => {
  if (ctx?.state === 'suspended') void ctx.resume();
};
window.addEventListener('pointerdown', wake, true);
window.addEventListener('keydown', wake, true);

/** The shared context, or null while sound is off. Music plays through it too. */
export function audioContext(): AudioContext | null {
  return audio();
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

let noise: AudioBuffer | null = null;

/** A soft breath of air - switching pages inside the browser. */
export function playSwoosh(): void {
  const ac = audio();
  if (!ac) return;
  if (!noise || noise.sampleRate !== ac.sampleRate) {
    noise = ac.createBuffer(1, Math.floor(ac.sampleRate * 0.3), ac.sampleRate);
    const data = noise.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }
  const src = ac.createBufferSource();
  const band = ac.createBiquadFilter();
  const vol = ac.createGain();
  const now = ac.currentTime;

  src.buffer = noise;
  band.type = 'bandpass';
  band.Q.value = 0.9;
  band.frequency.setValueAtTime(450, now);
  band.frequency.exponentialRampToValueAtTime(2400, now + 0.24);
  vol.gain.setValueAtTime(0, now);
  vol.gain.linearRampToValueAtTime(0.045, now + 0.07);
  vol.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);

  src.connect(band).connect(vol).connect(ac.destination);
  src.start(now);
  src.stop(now + 0.3);
}

/** A pneumatic sigh: the cafe's sliding doors. */
export function playDoor(): void {
  tone({ freq: 900, to: 260, duration: 0.28, type: 'sine', gain: 0.03 });
}

/** Rising two-note chime - a voice note picked up. */
export function playPickup(): void {
  tone({ freq: 660, to: 880, duration: 0.08, type: 'triangle', gain: 0.04 });
  window.setTimeout(() => tone({ freq: 990, to: 1320, duration: 0.1, type: 'triangle', gain: 0.04 }), 70);
}

/** Small upward blip for a jump. */
export function playJump(): void {
  tone({ freq: 300, to: 520, duration: 0.09, type: 'square', gain: 0.018 });
}

/** The auto-rickshaw's double beep. */
export function playHorn(): void {
  tone({ freq: 420, duration: 0.08, type: 'square', gain: 0.02 });
  window.setTimeout(() => tone({ freq: 420, duration: 0.1, type: 'square', gain: 0.02 }), 130);
}

/** Two low pulses: something is about to happen. */
export function playAlarm(): void {
  tone({ freq: 220, to: 160, duration: 0.16, type: 'sawtooth', gain: 0.03 });
  window.setTimeout(() => tone({ freq: 220, to: 160, duration: 0.16, type: 'sawtooth', gain: 0.03 }), 220);
}

/** The cable whipping out of the wrist. */
export function playCableOut(): void {
  tone({ freq: 300, to: 1400, duration: 0.42, type: 'triangle', gain: 0.025 });
}

/** The cable whipping back into the wrist: the same sweep, falling. */
export function playCableIn(): void {
  tone({ freq: 1400, to: 260, duration: 0.4, type: 'triangle', gain: 0.025 });
}

/** The plug seating: a hard click and a bright chime. */
export function playJackIn(): void {
  tone({ freq: 1600, duration: 0.03, type: 'square', gain: 0.03 });
  window.setTimeout(() => tone({ freq: 880, to: 1760, duration: 0.25, type: 'sine', gain: 0.04 }), 40);
}


/** A scanner sweeping: a soft rising chirp. */
export function playScan(): void {
  tone({ freq: 1200, to: 2400, duration: 0.18, type: 'sine', gain: 0.018 });
}

/** One tick of the sync bar. */
export function playTick(): void {
  tone({ freq: 1800, duration: 0.025, type: 'square', gain: 0.012 });
}
