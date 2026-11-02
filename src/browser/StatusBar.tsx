import { useSyncExternalStore } from 'react';
import { Zap } from 'lucide-react';
import { STATUS } from '../content/browser';
import { VOICE } from '../content/voice';
import { useClock } from '../lib/useClock';
import { latestVoice, subscribeVoice } from '../voice/useWisprInput';
import { addressUrl, type Address } from './address';
import { MAX_TABS } from './useTabs';

type Props = {
  address: Address;
  tabCount: number;
};

/**
 * A HUD line along the bottom of the browser: the link, the last voice input
 * and its estimated pace, where you are, and the time. Wider screens only.
 */
export default function StatusBar({ address, tabCount }: Props) {
  const voice = useSyncExternalStore(subscribeVoice, latestVoice, () => null);
  const now = useClock();

  return (
    <footer className="relative z-20 hidden h-7 shrink-0 items-center gap-5 border-t border-white/[0.06] bg-space/50 px-3.5 font-mono text-[10px] tracking-[0.14em] text-ink-muted uppercase backdrop-blur-xl sm:flex">
      <span className="flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-accent/80" aria-hidden="true" />
        {STATUS.link}
      </span>
      <span className={`flex items-center gap-1.5 ${voice ? 'text-accent' : ''}`} title={voice ? VOICE.estimated : undefined}>
        {voice && <Zap className="h-3 w-3" strokeWidth={2} aria-hidden="true" />}
        {voice ? `${VOICE.status.heard}${voice.wpm !== null ? ` · ${VOICE.wpm(voice.wpm)}` : ''}` : VOICE.status.ready}
      </span>
      <span className="min-w-0 flex-1 truncate text-center tracking-normal normal-case">{addressUrl(address.raw)}</span>
      <span>{STATUS.tabs(tabCount, MAX_TABS)}</span>
      <span className="hidden md:inline">{STATUS.private}</span>
      <time dateTime={now.toISOString()}>{now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time>
    </footer>
  );
}
