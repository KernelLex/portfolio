/**
 * Wispr Flow types its finished, cleaned-up text after the hotkey is released:
 * in one insertion, or as a burst far faster than anyone types. Keystrokes
 * arrive one at a time. So text that lands as a chunk is voice-style input.
 *
 * A heuristic, not proof - a paste lands the same way - and the interface says
 * so wherever it reports a detection.
 */
export type VoiceChunk = { text: string; at: number };

/** Inserts closer together than this count as one burst. Fast typing is ~80ms a key. */
const BURST_GAP_MS = 40;
const MIN_CHARS = 12;

type Field = HTMLInputElement | HTMLTextAreaElement;

export function watchVoiceInput(el: Field, onChunk: (chunk: VoiceChunk) => void): () => void {
  let before: { length: number; start: number; end: number } | null = null;
  let burst = '';
  let timer = 0;

  const onBeforeInput = () => {
    const end = el.value.length;
    before = { length: end, start: el.selectionStart ?? end, end: el.selectionEnd ?? end };
  };

  const onInput = () => {
    if (!before) return;
    const kept = before.length - (before.end - before.start);
    const added = el.value.slice(before.start, before.start + Math.max(0, el.value.length - kept));
    before = null;
    window.clearTimeout(timer);
    if (!added) {
      burst = '';
      return;
    }
    burst += added;
    timer = window.setTimeout(() => {
      if (burst.trim().length >= MIN_CHARS) onChunk({ text: burst, at: performance.now() });
      burst = '';
    }, BURST_GAP_MS);
  };

  el.addEventListener('beforeinput', onBeforeInput);
  el.addEventListener('input', onInput);
  return () => {
    window.clearTimeout(timer);
    el.removeEventListener('beforeinput', onBeforeInput);
    el.removeEventListener('input', onInput);
  };
}
