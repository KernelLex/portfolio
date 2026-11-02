import { useCallback, useEffect, useRef, useState } from 'react';
import { MIC, type SpeechLanguage } from '../content/voice';

// The Web Speech API is not in TypeScript's DOM types, and Chrome still prefixes it.
type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: { results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
};
type RecognitionCtor = new () => Recognition;

function recognizer(): RecognitionCtor | undefined {
  if (typeof window === 'undefined') return undefined;
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}

type Options = {
  lang: SpeechLanguage;
  /** The whole utterance, once the visitor stops. */
  onFinal: (text: string) => void;
};

/**
 * Live words while speaking, via the browser's own speech recognition: the raw,
 * as-heard text that Wispr's cleaned-up output can be compared against, and a
 * microphone for visitors who do not have Wispr.
 */
export function useLiveSpeech({ lang, onFinal }: Options) {
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState('');
  const [error, setError] = useState<string | null>(null);
  const active = useRef<Recognition | null>(null);
  const heard = useRef('');
  const finish = useRef(onFinal);
  finish.current = onFinal;

  const start = useCallback(() => {
    const Ctor = recognizer();
    if (!Ctor || active.current) return;
    const rec = new Ctor();
    rec.lang = lang;
    rec.continuous = true;
    rec.interimResults = true;
    heard.current = '';
    setInterim('');
    setError(null);

    rec.onresult = (e) => {
      let done = '';
      let pending = '';
      for (let i = 0; i < e.results.length; i++) {
        if (e.results[i].isFinal) done += e.results[i][0].transcript;
        else pending += e.results[i][0].transcript;
      }
      heard.current = done;
      setInterim(`${done} ${pending}`.trim());
    };
    rec.onerror = (e) => {
      if (e.error === 'no-speech' || e.error === 'aborted') return;
      setError(e.error === 'not-allowed' || e.error === 'service-not-allowed' ? MIC.denied : MIC.failed);
    };
    rec.onend = () => {
      active.current = null;
      setListening(false);
      setInterim('');
      const text = heard.current.trim();
      if (text) finish.current(text);
    };

    active.current = rec;
    try {
      rec.start();
      setListening(true);
    } catch {
      active.current = null;
      setError(MIC.failed);
    }
  }, [lang]);

  const stop = useCallback(() => active.current?.stop(), []);

  useEffect(
    () => () => {
      const rec = active.current;
      if (!rec) return;
      rec.onend = null;
      rec.abort();
    },
    [],
  );

  return { supported: !!recognizer(), listening, interim, error, start, stop };
}
