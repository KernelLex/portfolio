import { Film, SquareX, type LucideIcon } from 'lucide-react';
import { SETTINGS } from '../content/browser';
import { playClick } from '../lib/sound';

export type SettingsActions = {
  onReplayIntro: () => void;
  onCloseAll: () => void;
};

type Props = SettingsActions & {
  /** Close whatever menu this list sits in. */
  onDone: () => void;
};

/** The settings menu's contents, shared by the sidebar popover and the phone's "More" sheet. */
export default function SettingsList({ onReplayIntro, onCloseAll, onDone }: Props) {
  const item = (Icon: LucideIcon, label: string, run: () => void) => (
    <li>
      <button
        type="button"
        onClick={() => {
          playClick();
          onDone();
          run();
        }}
        className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-sm text-ink transition-colors hover:bg-white/[0.07]"
      >
        <Icon className="h-4 w-4 text-ink-muted" strokeWidth={1.6} />
        {label}
      </button>
    </li>
  );

  return (
    <>
      <ul className="p-1.5">
        {item(Film, SETTINGS.replay, onReplayIntro)}
        {item(SquareX, SETTINGS.closeAll, onCloseAll)}
      </ul>
      <p className="border-t border-white/[0.08] px-4 py-3 text-[11px] leading-relaxed text-ink-muted">{SETTINGS.privacy}</p>
    </>
  );
}
