import { Suspense, lazy, useCallback, useEffect, useState } from 'react';
import type { ComputerEntry } from './computer/Computer';
import type { IntroStart } from './intro/scenes/BootScene';
import type { IntroResult } from './intro/scenes/StreetScene';
import { preloadSite } from './lib/useSitePreload';
import { useSkin } from './lib/skin';
import { useReducedMotion } from './lib/useReducedMotion';
import { playClick } from './lib/sound';
import SoundToggle from './components/SoundToggle';
import IntroGame from './intro/IntroGame';
import GuideBot from './tour/GuideBot';
import { guide } from './tour/guide';
import TitleScreen from './intro/TitleScreen';
import FullscreenOffer from './components/FullscreenOffer';
import FullscreenToggle from './components/FullscreenToggle';
import type { StartMode } from './content/title';

// Lazy, and fetched while the intro plays - so the game is the preloader.
const Computer = lazy(() => import('./computer/Computer'));

type Phase = 'title' | 'intro' | 'computer';

const FROM_THE_TOP: IntroStart = { scene: 'street', taken: [] };


/**
 * The whole entry flow: the street and the cafe (Phaser), then the cafe PC
 * (React), which boots, shows a desktop, and opens the browser.
 */
export default function App() {
  const reducedMotion = useReducedMotion();
  const skin = useSkin();
  // Every visit starts at the title screen, then the street, so everyone gets the whole walk in.
  const [phase, setPhase] = useState<Phase>('title');
  const [entry, setEntry] = useState<ComputerEntry>('fresh');
  const [intro, setIntro] = useState<IntroResult>();
  const [introStart, setIntroStart] = useState<IntroStart>(FROM_THE_TOP);
  // A fresh PC every time you sit down at it.
  const [visit, setVisit] = useState(0);

  useEffect(() => {
    void preloadSite();
  }, []);

  const sitDown = useCallback((how: ComputerEntry, result?: IntroResult) => {
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

  // The title menu picks the mode. Only a visitor who asked their system for
  // reduced motion skips the game and goes straight to the PC.
  const handleStart = useCallback(
    (mode: StartMode) => {
      if (mode === 'tour') guide.tour();
      else guide.explore();
      if (reducedMotion) sitDown('returning');
      else setPhase('intro');
    },
    [reducedMotion, sitDown],
  );

  // Byte was asked where something is: from the street or the cafe, that means
  // skipping ahead to the PC, which opens the browser at the answer.
  useEffect(() => {
    if (phase !== 'intro') return;
    return guide.subscribe(() => {
      if (guide.get().trip) sitDown('skipped');
    });
  }, [phase, sitDown]);

  const handleReplay = useCallback(() => {
    setIntroStart(FROM_THE_TOP);
    setPhase('intro');
  }, []);

  return (
    <div className="relative h-full w-full overflow-hidden bg-space">
      {phase === 'title' && <TitleScreen onStart={handleStart} reducedMotion={reducedMotion} />}

      {phase === 'intro' && <IntroGame start={introStart} onEnter={handleEntered} reducedMotion={reducedMotion} />}

      {phase === 'computer' && (
        <Suspense fallback={<div className="h-full w-full bg-black" />}>
          <Computer key={visit} entry={entry} intro={intro} reducedMotion={reducedMotion}
            onLogOff={handleLogOff}
            onReplay={handleReplay}
          />
        </Suspense>
      )}

      <GuideBot />
      <FullscreenOffer />
      {skin === 'pixel' && phase === 'computer' && <div aria-hidden="true" className="pixel-crt" />}

      {phase === 'intro' && (
        <div className="absolute top-3 right-3 z-40 flex items-center gap-2">
          <SoundToggle label="Music" />
          <FullscreenToggle />
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
