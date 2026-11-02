import { useRef, useState } from 'react';
import { CircleHelp, Ellipsis } from 'lucide-react';
import SoundToggle from '../components/SoundToggle';
import { CHROME } from '../content/browser';
import type { PageId } from '../content/pages';
import { playClick } from '../lib/sound';
import { useDismiss } from '../lib/useDismiss';
import { MOBILE_MAIN, PAGE_LIST, pageEntry } from '../pages/registry';
import SettingsList, { type SettingsActions } from './SettingsList';

type Props = SettingsActions & {
  active: PageId;
  onOpen: (id: PageId) => void;
  onTips: () => void;
};

const TAB =
  'flex min-w-0 flex-1 flex-col items-center justify-center gap-1 text-[10px] leading-none transition-colors';

/** The sidebar, on a phone: five pages along the bottom, the rest behind "More". */
export default function MobileBar({ active, onOpen, onTips, onReplayIntro, onCloseAll }: Props) {
  const [more, setMore] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useDismiss(ref, more, () => setMore(false));

  const rest = PAGE_LIST.filter((p) => !MOBILE_MAIN.includes(p.id));
  const inMore = rest.some((p) => p.id === active);
  const close = () => setMore(false);

  return (
    <div ref={ref} className="relative z-20 shrink-0 sm:hidden">
      {more && (
        <div
          className="absolute inset-x-2 bottom-full mb-2 overflow-hidden rounded-2xl border border-white/[0.08] bg-surface shadow-[0_24px_60px_rgba(0,0,0,0.55)]"
          style={{ animation: 'window-in 160ms ease-out both' }}
        >
          <ul className="grid grid-cols-3 gap-1 p-2">
            {rest.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  data-guide={`page:${p.id}`}
                  aria-current={p.id === active ? 'page' : undefined}
                  onClick={() => {
                    close();
                    onOpen(p.id);
                  }}
                  className={`flex w-full flex-col items-center gap-2 rounded-xl px-1 py-3 text-center text-[11px] transition-colors hover:bg-white/[0.06] ${
                    p.id === active ? 'text-accent' : 'text-ink'
                  }`}
                >
                  <p.icon className="h-5 w-5" strokeWidth={1.6} />
                  {p.title}
                </button>
              </li>
            ))}
          </ul>
          <div className="flex items-center gap-2 border-t border-white/[0.08] px-3 py-2">
            <SoundToggle />
            <button
              type="button"
              onClick={() => {
                close();
                onTips();
              }}
              className="glass flex h-8 items-center gap-1.5 rounded-md px-2.5 text-xs text-ink-muted transition-colors hover:text-accent"
            >
              <CircleHelp className="h-4 w-4" strokeWidth={1.6} />
              {CHROME.tips}
            </button>
          </div>
          <div className="border-t border-white/[0.08]">
            <SettingsList onReplayIntro={onReplayIntro} onCloseAll={onCloseAll} onDone={close} />
          </div>
        </div>
      )}

      <nav aria-label={CHROME.pages} className="border-t border-white/[0.06] bg-space/70 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl">
        <div className="flex h-14 items-stretch px-1">
          {MOBILE_MAIN.map((id) => {
            const p = pageEntry(id);
            const on = id === active;
            return (
              <button
                key={id}
                type="button"
                data-guide={`page:${id}`}
                aria-current={on ? 'page' : undefined}
                onClick={() => onOpen(id)}
                className={`${TAB} ${on ? 'text-accent' : 'text-ink-muted hover:text-ink'}`}
              >
                <p.icon className="h-5 w-5" strokeWidth={1.6} />
                <span className="max-w-full truncate px-0.5">{p.short ?? p.title}</span>
              </button>
            );
          })}
          <button
            type="button"
            aria-expanded={more}
            onClick={() => {
              playClick();
              setMore((v) => !v);
            }}
            className={`${TAB} ${more || inMore ? 'text-accent' : 'text-ink-muted hover:text-ink'}`}
          >
            <Ellipsis className="h-5 w-5" strokeWidth={1.6} />
            {CHROME.more}
          </button>
        </div>
      </nav>
    </div>
  );
}
