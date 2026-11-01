import { Suspense, lazy, useCallback, useEffect, useState } from 'react';
import { storageKeys } from './config';
import type { ComputerEntry } from './computer/Computer';
import type { IntroStart } from './intro/scenes/BootScene';
import type { IntroResult } from './intro/scenes/StreetScene';
import { readFlag, writeFlag } from './lib/storage';
import { preloadSite } from './lib/useSitePreload';
import { useReducedMotion } from './lib/useReducedMotion';
import { playClick } from './lib/sound';
import SoundToggle from './components/SoundToggle';
import IntroGame from './intro/IntroGame';

// Lazy, and fetched while the intro plays - so the game is the preloader.
const Computer = lazy(() => import('./computer/Computer'));

type Phase = 'intro' | 'computer';

const FROM_THE_TOP: IntroStart = { scene: 'street', taken: [] };

/** Reduced motion and returning visitors go straight to the cafe PC. */
function initialPhase(): Phase {
  if (typeof window === 'undefined') return 'computer';
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return 'computer';
  return readFlag(storageKeys.introSeen, false) ? 'computer' : 'intro';
}

/**
 * The whole entry flow: the street and the cafe (Phaser), then the cafe PC
 * (React), which boots, shows a desktop, and opens the browser.
 */
export default function App() {
  const reducedMotion = useReducedMotion();
  const [start] = useState(initialPhase);
  const [phase, setPhase] = useState<Phase>(start);
  const [entry, setEntry] = useState<ComputerEntry>(start === 'intro' ? 'fresh' : 'returning');
  const [intro, setIntro] = useState<IntroResult>();
  const [introStart, setIntroStart] = useState<IntroStart>(FROM_THE_TOP);
  // A fresh PC every time you sit down at it.
  const [visit, setVisit] = useState(0);

  useEffect(() => {
    void preloadSite();
  }, []);

  const sitDown = useCallback((how: ComputerEntry, result?: IntroResult) => {
    writeFlag(storageKeys.introSeen, true);
    setEntry(how);
    setIntro(result);
    setVisit((v) => v + 1);
    setPhase('computer');
  }, []);

  const handleEntered = useCallback(
    (result?: IntroResult) => sitDown(result ? 'fresh' : 'skipped', result),
    [sitDown],
  );

  const handleSkip = useCallback(() => {
    playClick();
    sitDown('skipped');
  }, [sitDown]);

  // Logging off leaves you in the cafe, in your seat, free to walk back out.
  const handleLogOff = useCallback(() => {
    setIntroStart({ scene: 'cafe', taken: intro?.taken ?? [] });
    setPhase('intro');
  }, [intro]);

  const handleReplay = useCallback(() => {
    setIntroStart(FROM_THE_TOP);
    setPhase('intro');
  }, []);

  return (
    <div className="relative h-full w-full overflow-hidden bg-space">
      {phase === 'intro' && <IntroGame start={introStart} onEnter={handleEntered} reducedMotion={reducedMotion} />}

      {phase === 'computer' && (
        <Suspense fallback={<div className="h-full w-full bg-black" />}>
          <Computer key={visit} entry={entry} intro={intro} reducedMotion={reducedMotion}
            onLogOff={handleLogOff}
            onReplay={handleReplay}
          />
        </Suspense>
      )}

      {phase === 'intro' && (
        <div className="absolute top-3 right-3 z-40 flex items-center gap-2">
          <SoundToggle label="Music" />
          <button
            type="button"
            onClick={handleSkip}
            className="glass rounded-md px-3 py-1.5 font-mono text-[0.7rem] text-ink-muted transition-colors hover:text-accent"
          >
            {introStart.scene === 'cafe' ? 'Back to the PC →' : 'Skip intro →'}
          </button>
        </div>
      )}
    </div>
  );
}
