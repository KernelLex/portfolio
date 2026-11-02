import { useEffect, useRef, useState } from 'react';
import { AudioLines, Square } from 'lucide-react';
import { LYRICS } from '../../content/lyrics';
import { SPEECH_LANGUAGES, type SpeechLanguage } from '../../content/voice';
import { playClick } from '../../lib/sound';
import { useLiveSpeech } from '../../voice/useLiveSpeech';

type Props = {
  /** Words being heard right now, not yet settled. */
  onHearing: (text: string) => void;
  /** A phrase the recogniser has settled on. */
  onPhrase: (text: string) => void;
};

/**
 * The stage's live mic. Wispr only types once the key is released, so the
 * words-as-you-speak view comes from the browser's own recogniser, running
 * alongside it until switched off.
 */
export default function LiveWords({ onHearing, onPhrase }: Props) {
  const [lang, setLang] = useState<SpeechLanguage>('en-IN');
  const speech = useLiveSpeech({ lang, onUtterance: onPhrase, keepAlive: true });
  const report = useRef(onHearing);
  report.current = onHearing;

  useEffect(() => {
    report.current(speech.interim);
  }, [speech.interim]);

  if (!speech.supported) return <p className="max-w-xs text-[11px] text-ink-muted">{LYRICS.live.unsupported}</p>;

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
          className={`flex h-9 items-center gap-2 rounded-lg border px-3 text-xs transition-colors ${
            speech.listening ? 'border-accent/60 bg-accent/10 text-accent' : 'border-white/[0.12] text-ink hover:border-white/25'
          }`}
        >
          {speech.listening ? <Square className="h-3 w-3" strokeWidth={2} /> : <AudioLines className="h-4 w-4" strokeWidth={1.8} />}
          {speech.listening ? LYRICS.live.on : LYRICS.live.off}
        </button>
        <select
          aria-label={LYRICS.live.language}
          value={lang}
          disabled={speech.listening}
          onChange={(e) => setLang(e.target.value as SpeechLanguage)}
          className="h-9 rounded-lg border border-white/[0.1] bg-surface px-2 text-xs text-ink-muted disabled:opacity-50"
        >
          {SPEECH_LANGUAGES.map((l) => (
            <option key={l.code} value={l.code}>
              {l.label}
            </option>
          ))}
        </select>
      </div>
      <p className={`max-w-xs text-[10.5px] leading-snug ${speech.error ? 'text-accent' : 'text-ink-muted/80'}`}>{speech.error ?? LYRICS.live.note}</p>
    </div>
  );
}
