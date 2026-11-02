import { useRef, useState } from 'react';
import { OS_NAME } from '../config';
import { DESKTOP_USER, START_MENU } from '../content/desktop';
import { playClick } from '../lib/sound';
import { useClock } from '../lib/useClock';
import { useDismiss } from '../lib/useDismiss';
import SoundToggle from '../components/SoundToggle';
import { APPS, type AppId, type AppMeta } from './apps';
import { OsLogo, WifiIcon } from './icons';

type Props = {
  running: ReadonlyArray<{ app: AppMeta; minimized: boolean }>;
  onActivate: (id: AppId) => void;
  onOpen: (id: AppId, from: DOMRect | null) => void;
  onLogOff: () => void;
};

export default function Taskbar({ running, onActivate, onOpen, onLogOff }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const now = useClock();

  useDismiss(menuRef, menuOpen, () => setMenuOpen(false));

  const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const date = now.toLocaleDateString([], { day: 'numeric', month: 'short' });

  return (
    <div ref={menuRef}>
      {menuOpen && (
        <nav
          aria-label="Start menu"
          className="glass absolute bottom-14 left-2 z-[950] w-64 overflow-hidden rounded-xl shadow-[0_24px_60px_rgba(0,0,0,0.55)]"
          style={{ animation: 'window-in 160ms ease-out both' }}
        >
          <div className="flex items-center gap-3 border-b border-white/[0.08] px-4 py-3">
            <OsLogo className="h-7 w-7 text-ink" />
            <div>
              <p className="text-sm text-ink">{DESKTOP_USER}</p>
              <p className="font-mono text-[10px] text-ink-muted">{OS_NAME}</p>
            </div>
          </div>
          <ul className="p-1.5">
            {APPS.map(({ id, label, Icon }) => (
              <li key={id}>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onOpen(id, null);
                  }}
                  className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-sm text-ink transition-colors hover:bg-white/[0.08]"
                >
                  <Icon className="h-6 w-6" />
                  {label}
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => {
              playClick();
              onLogOff();
            }}
            className="flex w-full items-center justify-between border-t border-white/[0.08] px-4 py-2.5 text-left text-xs text-ink-muted transition-colors hover:text-accent"
          >
            {START_MENU.logOff}
            <span className="font-mono text-[10px]">{START_MENU.logOffHint}</span>
          </button>
        </nav>
      )}

      <footer className="glass absolute inset-x-0 bottom-0 z-[900] flex h-12 items-center gap-1 rounded-none border-x-0 border-b-0 px-2">
        <button
          type="button"
          onClick={() => {
            playClick();
            setMenuOpen((v) => !v);
          }}
          aria-expanded={menuOpen}
          aria-label="Start"
          className={`grid h-9 w-9 place-items-center rounded-lg transition-colors hover:bg-white/10 ${menuOpen ? 'bg-white/10' : ''}`}
        >
          <OsLogo className="h-5 w-5 text-ink" />
        </button>

        <div className="mx-1 h-6 w-px bg-white/10" aria-hidden="true" />

        <ul className="flex min-w-0 flex-1 items-center gap-1" aria-label="Running">
          {running.map(({ app, minimized }) => (
            <li key={app.id}>
              <button
                type="button"
                data-taskbar={app.id}
                onClick={() => onActivate(app.id)}
                aria-label={minimized ? `Restore ${app.label}` : app.label}
                className="relative flex h-9 items-center gap-2 rounded-lg px-2 text-xs text-ink transition-colors hover:bg-white/10"
              >
                <app.Icon className="h-5 w-5" />
                <span className="hidden max-w-32 truncate sm:inline">{app.label}</span>
                <span
                  aria-hidden="true"
                  className={`absolute bottom-0.5 left-1/2 h-0.5 -translate-x-1/2 rounded-full bg-accent ${minimized ? 'w-1.5 opacity-60' : 'w-4'}`}
                />
              </button>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2 pr-1 text-ink-muted">
          <SoundToggle />
          <WifiIcon className="hidden h-4 w-4 sm:block" />
          <div className="text-right font-mono leading-tight">
            <p className="text-[11px] text-ink">{time}</p>
            <p className="text-[10px]">{date}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
