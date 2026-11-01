import { BROWSER_NAME, URL_SCHEME } from '../config';
import { playClick } from '../lib/sound';
import SoundToggle from './SoundToggle';

type Props = {
  /** Shrink back into the cafe PC's taskbar. */
  onMinimize: () => void;
  /** Close the browser and return to the desktop. */
  onClose: () => void;
  /** Log off the PC and walk the street again. */
  onReplayIntro: () => void;
};

/**
 * Placeholder shell - TASK-02 replaces this with the real browser chrome
 * (working tabs, voice address bar, starfield wallpaper, guide figure).
 * It exists now so the cafe PC has a browser to open, and because it is the
 * chunk the boot splash's progress bar is actually waiting on.
 */
export default function BrowserShell({ onMinimize, onClose, onReplayIntro }: Props) {
  return (
    <div className="flex h-full w-full flex-col bg-space text-ink">
      {/* tab strip */}
      <header className="flex items-center gap-2 border-b border-white/[0.08] px-3 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="h-2 w-2 shrink-0 rounded-full bg-accent/70" aria-hidden="true" />
          <div className="glass truncate rounded-md px-3 py-1.5 text-xs text-ink">New Tab</div>
        </div>

        <div className="ml-auto flex items-center gap-1.5">
          <code className="mr-2 hidden font-mono text-[0.7rem] text-ink-muted sm:block">{URL_SCHEME}://new-tab</code>
          <button
            type="button"
            onClick={() => {
              playClick();
              onReplayIntro();
            }}
            className="mr-1 rounded-md px-2 py-1 font-mono text-[0.7rem] text-ink-muted transition-colors hover:text-accent"
          >
            Replay intro
          </button>
          <SoundToggle />
          <WindowButton label="Minimise" onClick={onMinimize}>
            <path d="M2.5 6h7" />
          </WindowButton>
          <WindowButton label="Close" onClick={onClose}>
            <path d="M3 3l6 6M9 3L3 9" />
          </WindowButton>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* icon sidebar - desktop only; TASK-02 turns this into a bottom bar on phones */}
        <nav
          aria-label="Pages"
          className="hidden w-14 shrink-0 flex-col items-center gap-3 border-r border-white/[0.08] py-4 sm:flex"
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <span key={i} aria-hidden="true" className="h-8 w-8 rounded-lg border border-white/[0.08] bg-white/[0.02]" />
          ))}
        </nav>

        <main className="grid min-w-0 flex-1 place-items-center p-6">
          <div className="text-center">
            <p className="font-mono text-[0.7rem] tracking-[0.25em] text-accent uppercase">into my space</p>
            <h1 className="mt-4 font-display text-4xl leading-tight text-ink sm:text-5xl">Welcome to {BROWSER_NAME}</h1>
            <p className="mt-4 text-sm text-ink-muted">Every tab is one part of the story. The rest arrives in TASK-02.</p>
          </div>
        </main>
      </div>
    </div>
  );
}

function WindowButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={() => {
        playClick();
        onClick();
      }}
      className="grid h-8 w-8 place-items-center rounded-md text-ink-muted transition-colors hover:bg-white/10 hover:text-ink"
    >
      <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
        {children}
      </svg>
    </button>
  );
}
