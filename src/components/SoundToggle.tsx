import { useSyncExternalStore } from 'react';
import { isSoundOn, setSoundOn, subscribeSound } from '../lib/sound';

/**
 * Sound is off until asked for (CLAUDE.md 5). The toggle lives in the frame so
 * it is reachable from the intro and from every page inside the browser.
 */
export default function SoundToggle() {
  const on = useSyncExternalStore(subscribeSound, isSoundOn, () => false);

  return (
    <button
      type="button"
      onClick={() => setSoundOn(!on)}
      aria-pressed={on}
      title={on ? 'Mute interface sounds' : 'Unmute interface sounds'}
      className="glass grid h-8 w-8 place-items-center rounded-md text-ink-muted transition-colors hover:text-accent"
    >
      <span className="sr-only">{on ? 'Mute interface sounds' : 'Unmute interface sounds'}</span>
      <svg
        viewBox="0 0 16 16"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M3 6h2.5L9 3v10L5.5 10H3z" />
        {on ? <path d="M11.5 5.5a3.5 3.5 0 0 1 0 5" /> : <path d="M11.5 6.5l3 3m0-3l-3 3" />}
      </svg>
    </button>
  );
}
