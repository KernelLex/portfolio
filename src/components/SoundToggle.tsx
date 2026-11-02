import { useSyncExternalStore } from 'react';
import { isSoundOn, setSoundOn, subscribeSound } from '../lib/sound';

/**
 * Sound is off until asked for (CLAUDE.md 5). The toggle lives in the frame so
 * it is reachable from the intro and from every page inside the browser.
 * `label` names it on screen where a word helps;
 * `className` replaces the default glass chip, to sit among other chrome.
 */
export default function SoundToggle({ label, className }: { label?: string; className?: string }) {
  const on = useSyncExternalStore(subscribeSound, isSoundOn, () => false);
  const what = label ? `sound and ${label.toLowerCase()}` : 'sound and music';
  const look = className ?? `glass h-8 rounded-md hover:text-accent ${label ? 'px-2.5' : 'w-8'}`;

  return (
    <button
      type="button"
      onClick={() => setSoundOn(!on)}
      aria-pressed={on}
      title={on ? `Mute ${what}` : `Unmute ${what}`}
      className={`flex items-center justify-center gap-1.5 text-ink-muted transition-colors ${look}`}
    >
      <span className="sr-only">{on ? `Mute ${what}` : `Unmute ${what}`}</span>
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
      {label && (
        <span className="font-mono text-[0.7rem]" aria-hidden="true">
          {label} {on ? 'on' : 'off'}
        </span>
      )}
    </button>
  );
}
