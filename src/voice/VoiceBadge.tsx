import { Zap } from 'lucide-react';
import { VOICE } from '../content/voice';
import type { VoiceReading } from './useWisprInput';

/**
 * "⚡ Voice input detected · ~162 WPM (typing avg ~40)". Slides in when a voice
 * chunk lands and fades on its own after a few seconds.
 */
export default function VoiceBadge({ reading, className = '' }: { reading: VoiceReading | null; className?: string }) {
  if (!reading) return null;
  return (
    <p
      key={reading.at}
      role="status"
      title={VOICE.estimated}
      className={`pointer-events-none flex items-center gap-1.5 rounded-full border border-accent/30 bg-space/80 px-3 py-1 font-mono text-[11px] whitespace-nowrap text-accent ${className}`}
      style={{ animation: 'badge-life 4.6s ease-out both' }}
    >
      <Zap className="h-3 w-3" strokeWidth={2} aria-hidden="true" />
      {VOICE.detected}
      {reading.wpm !== null && (
        <span className="text-ink-muted">
          · {VOICE.wpm(reading.wpm)} ({VOICE.typingAverage})
        </span>
      )}
    </p>
  );
}
