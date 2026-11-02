import { useRef, useState, type ReactNode } from 'react';
import { Plus, X } from 'lucide-react';
import { NavigatorIcon } from '../computer/icons';
import { CHROME } from '../content/browser';
import { playClick } from '../lib/sound';
import { useDismiss } from '../lib/useDismiss';
import { pageEntry } from '../pages/registry';
import { addressUrl } from './address';
import { currentOf, pageOf, type Tab } from './useTabs';

type Props = {
  tabs: ReadonlyArray<Tab>;
  activeId: string;
  onActivate: (id: string) => void;
  onClose: (id: string) => void;
  onNew: () => void;
  controls: ReactNode;
};

/** On a phone the tab strip collapses to the current page; tap it to see every tab. */
export default function MobileHeader({ tabs, activeId, onActivate, onClose, onNew, controls }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useDismiss(ref, open, () => setOpen(false));

  const active = tabs.find((t) => t.id === activeId) ?? tabs[0];
  const page = pageEntry(pageOf(active));
  const pick = (fn: () => void) => () => {
    setOpen(false);
    fn();
  };

  return (
    <div className="flex h-11 items-center gap-1.5 pr-1 pl-3 sm:hidden">
      <NavigatorIcon className="h-6 w-6 shrink-0" />
      <div ref={ref} className="relative min-w-0 flex-1">
        <button
          type="button"
          aria-expanded={open}
          aria-label={`${page.title}. ${CHROME.tabCount(tabs.length)}`}
          onClick={() => {
            playClick();
            setOpen((v) => !v);
          }}
          className="flex max-w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-ink transition-colors hover:bg-white/[0.06]"
        >
          <page.icon className="h-4 w-4 shrink-0 text-accent" strokeWidth={1.7} />
          <span className="truncate">{page.title}</span>
          <span className="grid h-5 min-w-5 shrink-0 place-items-center rounded-md border border-ink-muted/40 px-1 font-mono text-[10px] text-ink-muted">
            {tabs.length}
          </span>
        </button>

        {open && (
          <div
            className="absolute top-full left-0 z-30 mt-1 w-[min(20rem,calc(100vw-1.5rem))] overflow-hidden rounded-xl border border-white/[0.08] bg-surface shadow-[0_24px_60px_rgba(0,0,0,0.55)]"
            style={{ animation: 'window-in 160ms ease-out both' }}
          >
            <p className="px-3 pt-2.5 pb-1 font-mono text-[10px] tracking-[0.18em] text-ink-muted uppercase">{CHROME.tabs}</p>
            <ul className="p-1.5">
              {tabs.map((tab) => {
                const entry = pageEntry(pageOf(tab));
                const on = tab.id === activeId;
                return (
                  <li key={tab.id} className={`flex items-center rounded-lg ${on ? 'bg-white/[0.06]' : ''}`}>
                    <button
                      type="button"
                      aria-current={on ? 'page' : undefined}
                      onClick={pick(() => onActivate(tab.id))}
                      className="flex min-w-0 flex-1 items-center gap-3 px-2.5 py-2 text-left"
                    >
                      <entry.icon className={`h-4 w-4 shrink-0 ${on ? 'text-accent' : 'text-ink-muted'}`} strokeWidth={1.7} />
                      <span className="min-w-0">
                        <span className="block truncate text-sm text-ink">{entry.title}</span>
                        <span className="block truncate font-mono text-[10.5px] text-ink-muted">{addressUrl(currentOf(tab))}</span>
                      </span>
                    </button>
                    <button
                      type="button"
                      aria-label={CHROME.closeTab(entry.title)}
                      onClick={() => onClose(tab.id)}
                      className="mr-1 grid h-8 w-8 shrink-0 place-items-center rounded-md text-ink-muted hover:bg-white/10 hover:text-ink"
                    >
                      <X className="h-3.5 w-3.5" strokeWidth={2} />
                    </button>
                  </li>
                );
              })}
            </ul>
            <button
              type="button"
              onClick={pick(onNew)}
              className="flex w-full items-center gap-3 border-t border-white/[0.08] px-4 py-2.5 text-left text-sm text-ink-muted transition-colors hover:text-ink"
            >
              <Plus className="h-4 w-4" strokeWidth={1.7} />
              {CHROME.newTab}
            </button>
          </div>
        )}
      </div>
      {controls}
    </div>
  );
}
