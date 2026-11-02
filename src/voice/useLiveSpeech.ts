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
  /** Everything heard, once listening stops. */
  onFinal?: (text: string) => void;
  /** Each phrase as soon as the recogniser settles on it. */
  onUtterance?: (text: string) => void;
  /** Keep listening across the recogniser's own pauses, until stop() is called. */
  keepAlive?: boolean;
};

/**
 * Live words while speaking, via the browser's own speech recognition: the raw,
 * as-heard text that Wispr's cleaned-up output can be compared against, and a
 * microphone for visitors who do not have Wispr.
 */
export function useLiveSpeech({ lang, onFinal, onUtterance, keepAlive = false }: Options) {
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState('');
  const [error, setError] = useState<string | null>(null);
  const active = useRef<Recognition | null>(null);
  const wanted = useRef(false);
  const heard = useRef('');
  const handlers = useRef({ onFinal, onUtterance });
  handlers.current = { onFinal, onUtterance };

  const run = useCallback(() => {
    const Ctor = recognizer();
    if (!Ctor || active.current) return;
    const rec = new Ctor();
    rec.lang = lang;
    rec.continuous = true;
    rec.interimResults = true;
    let emitted = 0;

    rec.onresult = (e) => {
      let pending = '';
      for (let i = 0; i < e.results.length; i++) {
        const text = e.results[i][0].transcript;
        if (!e.results[i].isFinal) pending += text;
        else if (i >= emitted) {
          emitted = i + 1;
          heard.current = `${heard.current} ${text}`.trim();
          handlers.current.onUtterance?.(text.trim());
        }
      }
      setInterim(pending.trim());
    };
    rec.onerror = (e) => {
      if (e.error === 'no-speech' || e.error === 'aborted') return;
      wanted.current = false;
      setError(e.error === 'not-allowed' || e.error === 'service-not-allowed' ? MIC.denied : MIC.failed);
    };
    rec.onend = () => {
      active.current = null;
      setInterim('');
      // Chrome ends a session after a pause; carry on if the visitor has not stopped.
      if (keepAlive && wanted.current) {
        run();
        return;
      }
      setListening(false);
      const text = heard.current.trim();
      if (text) handlers.current.onFinal?.(text);
    };

    active.current = rec;
    try {
      rec.start();
      setListening(true);
    } catch {
      active.current = null;
      wanted.current = false;
      setListening(false);
      setError(MIC.failed);
    }
  }, [lang, keepAlive]);

  const start = useCallback(() => {
    wanted.current = true;
    heard.current = '';
    setInterim('');
    setError(null);
    run();
  }, [run]);

  const stop = useCallback(() => {
    wanted.current = false;
    active.current?.stop();
  }, []);

  useEffect(
    () => () => {
      wanted.current = false;
      const rec = active.current;
      if (!rec) return;
      rec.onend = null;
      rec.abort();
    },
    [],
  );

  return { supported: !!recognizer(), listening, interim, error, start, stop };
}
