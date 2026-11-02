import { Minus, X } from 'lucide-react';
import FullscreenToggle from '../components/FullscreenToggle';
import { CHROME } from '../content/browser';
import { playClick } from '../lib/sound';
import ChromeButton from './ChromeButton';

type Props = {
  /** Shrink back into the cafe PC's taskbar. */
  onMinimize: () => void;
  /** Close the browser and return to the desktop. */
  onClose: () => void;
};

export default function WindowControls({ onMinimize, onClose }: Props) {
  const press = (fn: () => void) => () => {
    playClick();
    fn();
  };
  return (
    <div className="flex shrink-0 items-center gap-0.5">
      <FullscreenToggle className="h-8 w-8 rounded-lg hover:bg-white/[0.07] hover:text-ink" />
      <ChromeButton label={CHROME.minimise} onClick={press(onMinimize)}>
        <Minus className="h-4 w-4" strokeWidth={1.6} />
      </ChromeButton>
      <ChromeButton label={CHROME.close} onClick={press(onClose)}>
        <X className="h-4 w-4" strokeWidth={1.6} />
      </ChromeButton>
    </div>
  );
}
