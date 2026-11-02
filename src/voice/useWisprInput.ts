import { useEffect, useRef, useState, type RefObject } from 'react';
import { watchVoiceInput } from './detect';

export type VoiceReading = {
  text: string;
  words: number;
  /** Estimated, and null when the timing cannot support an honest guess. */
  wpm: number | null;
  at: number;
};

/** Below this the clock mostly measured silence; above it, a paste rather than a voice. */
const WPM_RANGE = [60, 400] as const;
const MIN_WINDOW_MS = 1500;

export const countWords = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;

/**
 * Words per minute for a chunk: its words over the time since the field was
 * focused or the last chunk landed. Wispr only hands over finished text, so
 * this is the closest honest measure there is - and it is labelled estimated.
 */
function estimateWpm(words: number, ms: number): number | null {
  if (ms < MIN_WINDOW_MS) return null;
  const wpm = Math.round(words / (ms / 60_000));
  return wpm >= WPM_RANGE[0] && wpm <= WPM_RANGE[1] ? wpm : null;
}

// The latest reading from any field, for the browser's status bar.
let latest: VoiceReading | null = null;
const listeners = new Set<() => void>();

export const latestVoice = () => latest;
export function subscribeVoice(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/**
 * Make a text field Wispr-aware: spot voice-style chunks as they land, estimate
 * their pace, and report them. Returns the field's most recent reading.
 */
export function useWisprInput(
  ref: RefObject<HTMLInputElement | HTMLTextAreaElement | null>,
  onVoice?: (reading: VoiceReading) => void,
): VoiceReading | null {
  const [reading, setReading] = useState<VoiceReading | null>(null);
  const callback = useRef(onVoice);
  callback.current = onVoice;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let since = document.activeElement === el ? performance.now() : 0;
    const onFocus = () => {
      since = performance.now();
    };
    el.addEventListener('focus', onFocus);

    const stop = watchVoiceInput(el, (chunk) => {
      const words = countWords(chunk.text);
      const next = { text: chunk.text, words, wpm: since ? estimateWpm(words, chunk.at - since) : null, at: chunk.at };
      since = chunk.at;
      latest = next;
      listeners.forEach((fn) => fn());
      setReading(next);
      callback.current?.(next);
    });

    return () => {
      stop();
      el.removeEventListener('focus', onFocus);
    };
  }, [ref]);

  return reading;
}
