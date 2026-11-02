import { Mic } from 'lucide-react';
import { VOICE } from '../content/voice';

/** The small "Hold your Wispr key and talk" label that sits by every voice-ready field. */
export default function WisprHint({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 font-mono text-[11px] text-ink-muted ${className}`}>
      <Mic className="h-3 w-3 text-accent" strokeWidth={2} aria-hidden="true" />
      {VOICE.hint}
    </span>
  );
}
