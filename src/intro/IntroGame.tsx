import { useEffect, useRef, useState } from 'react';
import type { Game } from 'phaser';
import { VIEW_H, VIEW_W } from './viewport';

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
export default function IntroGame({ onEnter, reducedMotion }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [booted, setBooted] = useState(false);

  // Keep the callback fresh without making it an effect dependency.
  const onEnterRef = useRef(onEnter);
  onEnterRef.current = onEnter;

  useEffect(() => {
    let game: Game | null = null;
    let cancelled = false;

    void (async () => {
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
        width: VIEW_W,
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
          reducedMotion,
        }),
      });

      setBooted(true);
    })();

    return () => {
      cancelled = true;
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
