import { useEffect, useRef, useState } from 'react';
import type { Game } from 'phaser';
import { VIEW_H, viewportWidth } from './viewport';

type Props = {
  /** Called once the door zoom has finished playing. */
  onEnter: () => void;
  reducedMotion: boolean;
};

/**
 * Mounts the Phaser street scene and guarantees it is torn down again.
 *
 * Phaser is imported lazily so the first paint never waits on it, and the whole
 * effect is written to survive React's double-invoked mount in development -
 * a stray second Game would otherwise leave an orphaned canvas and a running
 * render loop behind.
 */
/**
 * If the scene has not finished starting by now, something is wrong with
 * WebGL, the assets or the engine - move the visitor along rather than leave
 * them on a black rectangle.
 */
const BOOT_WATCHDOG_MS = 6000;

export default function IntroGame({ onEnter, reducedMotion }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [booted, setBooted] = useState(false);

  // Keep the callback fresh without making it an effect dependency.
  const onEnterRef = useRef(onEnter);
  onEnterRef.current = onEnter;

  useEffect(() => {
    let game: Game | null = null;
    let cancelled = false;

    const bail = (reason: string, err?: unknown) => {
      if (cancelled) return;
      console.warn('[intro] skipping the street scene:', reason, err ?? '');
      onEnterRef.current();
    };

    const watchdog = window.setTimeout(() => bail('scene did not start in time'), BOOT_WATCHDOG_MS);

    void (async () => {
      try {
        // Phaser measures text at creation time, so the pixel font has to be
        // resident first or every sign is laid out with fallback metrics.
        try {
          await Promise.all([
            document.fonts.load('8px "Press Start 2P"'),
            document.fonts.load('9px "JetBrains Mono"'),
          ]);
        } catch {
          /* fall back to monospace metrics */
        }

        const [{ default: Phaser }, { StreetScene }] = await Promise.all([
          import('phaser'),
          import('./scenes/StreetScene'),
        ]);

        if (cancelled || !hostRef.current) return;

        game = new Phaser.Game({
          type: Phaser.AUTO,
          parent: hostRef.current,
          // Height is fixed so the scene's y coordinates stay valid; width
          // follows the display's aspect so a wide screen sees more street
          // instead of black bars.
          width: viewportWidth(),
          height: VIEW_H,
          pixelArt: true,
          roundPixels: true,
          backgroundColor: '#070912',
          scale: {
            mode: Phaser.Scale.FIT,
            autoCenter: Phaser.Scale.CENTER_BOTH,
          },
          // Sound goes through our own muted-by-default WebAudio layer instead.
          audio: { noAudio: true },
          scene: new StreetScene({
            onEnter: () => onEnterRef.current(),
            onReady: () => {
              window.clearTimeout(watchdog);
              if (!cancelled) setBooted(true);
            },
            reducedMotion,
          }),
        });
      } catch (err) {
        window.clearTimeout(watchdog);
        bail('failed to start', err);
      }
    })();

    return () => {
      cancelled = true;
      window.clearTimeout(watchdog);
      game?.destroy(true);
      game = null;
    };
  }, [reducedMotion]);

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#070912]">
      <div ref={hostRef} className="h-full w-full" />
      {!booted && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <span className="font-mono text-xs tracking-widest text-ink-muted">loading street…</span>
        </div>
      )}
    </div>
  );
}
