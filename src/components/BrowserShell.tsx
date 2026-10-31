import { BROWSER_NAME, URL_SCHEME } from '../config';
import { playClick } from '../lib/sound';

type Props = {
  /** Lets a returning visitor watch the intro they skipped. */
  onReplayIntro: () => void;
};

/**
 * Placeholder shell - TASK-02 replaces this with the real browser chrome
 * (working tabs, voice address bar, starfield wallpaper, guide figure).
 * It exists now so the intro has somewhere to land, and because it is the
 * chunk the boot screen's progress bar is actually waiting on.
 */
export default function BrowserShell({ onReplayIntro }: Props) {
  return (
    <div className="flex h-full w-full flex-col bg-space text-ink">
      {/* tab strip */}
      <header className="flex items-center gap-2 border-b border-white/[0.08] px-3 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="h-2 w-2 shrink-0 rounded-full bg-accent/70" aria-hidden="true" />
          <div className="glass truncate rounded-md px-3 py-1.5 text-xs text-ink">New Tab</div>
        </div>

        <div className="ml-auto flex items-center gap-3">
          <code className="hidden font-mono text-[0.7rem] text-ink-muted sm:block">
            {URL_SCHEME}://new-tab
          </code>
          <button
            type="button"
            onClick={() => {
              playClick();
              onReplayIntro();
            }}
            className="rounded-md px-2 py-1 font-mono text-[0.7rem] text-ink-muted transition-colors hover:text-accent"
          >
            Replay intro
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* icon sidebar - desktop only; TASK-02 turns this into a bottom bar on phones */}
        <nav
          aria-label="Pages"
          className="hidden w-14 shrink-0 flex-col items-center gap-3 border-r border-white/[0.08] py-4 sm:flex"
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <span
              key={i}
              aria-hidden="true"
              className="h-8 w-8 rounded-lg border border-white/[0.08] bg-white/[0.02]"
            />
          ))}
        </nav>

        <main className="grid min-w-0 flex-1 place-items-center p-6">
          <div className="text-center">
            <p className="font-mono text-[0.7rem] tracking-[0.25em] text-accent uppercase">
              into my space
            </p>
            <h1 className="mt-4 font-display text-4xl leading-tight text-ink sm:text-5xl">
              Welcome to {BROWSER_NAME}
            </h1>
            <p className="mt-4 text-sm text-ink-muted">
              Every tab is one part of the story. The rest arrives in TASK-02.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
