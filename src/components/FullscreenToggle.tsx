import { Maximize2, Minimize2 } from 'lucide-react';
import { canFullscreen, toggleFullscreen, useFullscreen } from '../lib/fullscreen';
import { playClick } from '../lib/sound';

const LABEL = { enter: 'Full screen', exit: 'Exit full screen' } as const;

/** Full screen on and off. `className` replaces the default glass chip. */
export default function FullscreenToggle({ className }: { className?: string }) {
  const full = useFullscreen();
  if (!canFullscreen()) return null;
  const label = full ? LABEL.exit : LABEL.enter;
  return (
    <button
      type="button"
      onClick={() => {
        playClick();
        toggleFullscreen();
      }}
      aria-label={label}
      title={label}
      className={`flex items-center justify-center text-ink-muted transition-colors ${className ?? 'glass h-8 w-8 rounded-md hover:text-accent'}`}
    >
      {full ? <Minimize2 className="h-4 w-4" strokeWidth={1.6} /> : <Maximize2 className="h-4 w-4" strokeWidth={1.6} />}
    </button>
  );
}
