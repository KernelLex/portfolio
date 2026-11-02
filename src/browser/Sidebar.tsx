import { useRef, useState, type SyntheticEvent } from 'react';
import { CircleHelp, Settings } from 'lucide-react';
import SoundToggle from '../components/SoundToggle';
import { NavigatorIcon } from '../computer/icons';
import { CHROME } from '../content/browser';
import type { PageId } from '../content/pages';
import { playClick } from '../lib/sound';
import { useDismiss } from '../lib/useDismiss';
import { PAGE_LIST, type PageEntry } from '../pages/registry';
import SettingsList, { type SettingsActions } from './SettingsList';

type Props = SettingsActions & {
  active: PageId;
  onOpen: (id: PageId) => void;
  onTips: () => void;
};

const ICON_BUTTON =
  'grid h-10 w-10 place-items-center rounded-xl text-ink-muted transition-colors hover:bg-white/[0.06] hover:text-ink';

/**
 * The slim icon rail down the left: one icon per page, the core story first and
 * the extras below a hairline. Desktop only - phones get MobileBar instead.
 */
export default function Sidebar({ active, onOpen, onTips, onReplayIntro, onCloseAll }: Props) {
  const navRef = useRef<HTMLElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);
  const [label, setLabel] = useState<{ text: string; y: number } | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  useDismiss(settingsRef, settingsOpen, () => setSettingsOpen(false));

  // One shared tooltip, placed beside whichever icon is hovered or focused, so
  // the icon list can scroll on short screens without clipping it.
  const showLabel = (text: string) => (e: SyntheticEvent<HTMLElement>) => {
    const nav = navRef.current?.getBoundingClientRect();
    const r = e.currentTarget.getBoundingClientRect();
    if (nav) setLabel({ text, y: r.top - nav.top + r.height / 2 });
  };
  const hideLabel = () => setLabel(null);
  const labelled = (text: string) => ({
    onPointerEnter: showLabel(text),
    onPointerLeave: hideLabel,
    onFocus: showLabel(text),
    onBlur: hideLabel,
  });

  const item = (page: PageEntry) => {
    const on = page.id === active;
    return (
      <li key={page.id} className="relative flex w-full justify-center">
        {on && <span aria-hidden="true" className="absolute top-1/2 left-0 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-accent" />}
        <button
          type="button"
          data-guide={`page:${page.id}`}
          aria-label={page.title}
          aria-current={on ? 'page' : undefined}
          onClick={() => onOpen(page.id)}
          {...labelled(page.title)}
          className={`${ICON_BUTTON} ${on ? 'bg-accent/[0.09] !text-accent' : ''}`}
        >
          <page.icon className="h-[18px] w-[18px]" strokeWidth={1.6} />
        </button>
      </li>
    );
  };

  return (
    <nav
      ref={navRef}
      aria-label={CHROME.pages}
      className="relative z-20 hidden w-14 shrink-0 flex-col items-center border-r border-white/[0.06] bg-space/50 backdrop-blur-xl sm:flex"
    >
      <div className="grid h-12 w-full shrink-0 place-items-center">
        <NavigatorIcon className="h-7 w-7" />
      </div>

      <ul className="flex min-h-0 w-full flex-1 flex-col items-center gap-1 overflow-y-auto py-2 [scrollbar-width:none]">
        {PAGE_LIST.filter((p) => p.priority === 'must').map(item)}
        <li aria-hidden="true" className="my-1.5 h-px w-6 shrink-0 bg-white/[0.08]" />
        {PAGE_LIST.filter((p) => p.priority === 'nice').map(item)}
      </ul>

      <div className="flex shrink-0 flex-col items-center gap-1 pt-2 pb-3">
        {/* Named by its own title, which also says whether it is on. */}
        <SoundToggle className={ICON_BUTTON} />
        <button type="button" aria-label={CHROME.tips} onClick={onTips} {...labelled(CHROME.tips)} className={ICON_BUTTON}>
          <CircleHelp className="h-[18px] w-[18px]" strokeWidth={1.6} />
        </button>
        <div ref={settingsRef} className="relative">
          <button
            type="button"
            aria-label={CHROME.settings}
            aria-expanded={settingsOpen}
            onClick={() => {
              playClick();
              hideLabel();
              setSettingsOpen((v) => !v);
            }}
            {...labelled(CHROME.settings)}
            className={`${ICON_BUTTON} ${settingsOpen ? 'bg-white/[0.07] text-ink' : ''}`}
          >
            <Settings className="h-[18px] w-[18px]" strokeWidth={1.6} />
          </button>
          {settingsOpen && (
            <div
              className="absolute bottom-0 left-full ml-3 w-64 overflow-hidden rounded-xl border border-white/[0.08] bg-surface shadow-[0_24px_60px_rgba(0,0,0,0.55)]"
              style={{ animation: 'window-in 160ms ease-out both' }}
            >
              <SettingsList onReplayIntro={onReplayIntro} onCloseAll={onCloseAll} onDone={() => setSettingsOpen(false)} />
            </div>
          )}
        </div>
      </div>

      {label && !settingsOpen && (
        <div
          role="tooltip"
          className="pointer-events-none absolute left-full z-30 ml-2 -translate-y-1/2 rounded-md border border-white/[0.08] bg-surface-hi px-2 py-1 text-xs whitespace-nowrap text-ink shadow-lg"
          style={{ top: label.y, animation: 'hint-in 140ms ease-out both' }}
        >
          {label.text}
        </div>
      )}
    </nav>
  );
}
