import { useEffect, useRef, useState } from 'react';
import { Mic, Square } from 'lucide-react';
import { MIC, SPEECH_LANGUAGES, type SpeechLanguage } from '../content/voice';
import { playClick } from '../lib/sound';
import { useLiveSpeech } from './useLiveSpeech';

type Props = {
  /** Words as they are heard, raw. */
  onInterim?: (text: string) => void;
  onFinal: (text: string) => void;
};

/** A microphone button for visitors without Wispr, in English, Hindi or Kannada. */
export default function FallbackMic({ onInterim, onFinal }: Props) {
  const [lang, setLang] = useState<SpeechLanguage>('en-IN');
  const speech = useLiveSpeech({ lang, onFinal });
  const report = useRef(onInterim);
  report.current = onInterim;

  useEffect(() => {
    report.current?.(speech.interim);
  }, [speech.interim]);

  if (!speech.supported) return <p className="text-[11px] text-ink-muted">{MIC.unsupported}</p>;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          aria-pressed={speech.listening}
          onClick={() => {
            playClick();
            if (speech.listening) speech.stop();
            else speech.start();
          }}
          className={`flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs transition-colors ${
            speech.listening
              ? 'border-accent/60 bg-accent/10 text-accent'
              : 'border-white/[0.1] text-ink-muted hover:border-white/20 hover:text-ink'
          }`}
        >
          {speech.listening ? <Square className="h-3 w-3" strokeWidth={2} /> : <Mic className="h-3.5 w-3.5" strokeWidth={1.8} />}
          {speech.listening ? MIC.stop : MIC.start}
        </button>
        <select
          aria-label={MIC.language}
          value={lang}
          disabled={speech.listening}
          onChange={(e) => setLang(e.target.value as SpeechLanguage)}
          className="h-8 rounded-lg border border-white/[0.1] bg-surface px-2 text-xs text-ink-muted disabled:opacity-50"
        >
          {SPEECH_LANGUAGES.map((l) => (
            <option key={l.code} value={l.code}>
              {l.label}
            </option>
          ))}
        </select>
      </div>
      <p className={`max-w-xs text-[10.5px] leading-snug ${speech.error ? 'text-accent' : 'text-ink-muted/80'}`}>
        {speech.error ?? (speech.listening ? MIC.listening : MIC.note)}
      </p>
    </div>
  );
}
