import { Suspense, lazy, useCallback, useEffect, useState } from 'react';
import { storageKeys, timings } from './config';
import { readFlag, writeFlag } from './lib/storage';
import { preloadSite } from './lib/useSitePreload';
import { useReducedMotion } from './lib/useReducedMotion';
import { playClick } from './lib/sound';
import SoundToggle from './components/SoundToggle';
import IntroGame from './intro/IntroGame';
import Transition from './intro/Transition';
import BootScreen from './intro/BootScreen';

// Lazy so the boot screen's progress bar has something real to wait on.
const BrowserShell = lazy(() => import('./components/BrowserShell'));

type Phase = 'intro' | 'boot' | 'browser';

/** Reduced motion and returning visitors both land straight on the boot screen. */
function initialPhase(): Phase {
  if (typeof window === 'undefined') return 'boot';
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) return 'boot';
  return readFlag(storageKeys.introSeen, false) ? 'boot' : 'intro';
}

export default function App() {
  const reducedMotion = useReducedMotion();
  const [phase, setPhase] = useState<Phase>(initialPhase);
  const [flashing, setFlashing] = useState(false);

  // Start fetching the browser shell immediately: that is what makes the game
  // a preloader rather than a delay.
  useEffect(() => {
    void preloadSite();
  }, []);

  const markSeen = useCallback(() => writeFlag(storageKeys.introSeen, true), []);

  const handleEnteredDoor = useCallback(() => {
    markSeen();
    setFlashing(true);
  }, [markSeen]);

  const handleSkip = useCallback(() => {
    playClick();
    markSeen();
    setPhase('boot');
  }, [markSeen]);

  const handleReplay = useCallback(() => setPhase('intro'), []);

  return (
    <div className="relative h-full w-full overflow-hidden bg-space">
      {phase === 'intro' && (
        <IntroGame onEnter={handleEnteredDoor} reducedMotion={reducedMotion} />
      )}

      {phase === 'boot' && <BootScreen onDone={() => setPhase('browser')} />}

      {phase === 'browser' && (
        <Suspense fallback={<div className="h-full w-full bg-space" />}>
          <div
            className="h-full w-full"
            style={{ animation: `fade-in ${timings.shellFadeIn}ms ease-out both` }}
          >
            <BrowserShell onReplayIntro={handleReplay} />
          </div>
        </Suspense>
      )}

      {flashing && (
        <Transition onPeak={() => setPhase('boot')} onDone={() => setFlashing(false)} />
      )}

      {/* Frame controls sit above every phase. */}
      <div className="absolute top-3 right-3 z-40 flex items-center gap-2">
        <SoundToggle />
        {phase === 'intro' && (
          <button
            type="button"
            onClick={handleSkip}
            className="glass rounded-md px-3 py-1.5 font-mono text-[0.7rem] text-ink-muted transition-colors hover:text-accent"
          >
            Skip intro →
          </button>
        )}
      </div>
    </div>
  );
}
