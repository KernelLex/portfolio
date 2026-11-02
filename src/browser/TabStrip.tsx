import type { KeyboardEvent, ReactNode } from 'react';
import { Plus, X } from 'lucide-react';
import { CHROME } from '../content/browser';
import { pageEntry, titleOf } from '../pages/registry';
import ChromeButton from './ChromeButton';
import { currentOf, pageOf, type Tab } from './useTabs';

type Props = {
  tabs: ReadonlyArray<Tab>;
  activeId: string;
  onActivate: (id: string) => void;
  onClose: (id: string) => void;
  onNew: () => void;
  /** The window's own buttons, at the far end of the strip. */
  controls: ReactNode;
};

/**
 * The row of tabs. Arrow keys move between them, Delete closes one, and a
 * middle click closes one, like any browser. Desktop only - phones collapse
 * this to the current page's title (MobileHeader).
 */
export default function TabStrip({ tabs, activeId, onActivate, onClose, onNew, controls }: Props) {
  const onKeyDown = (e: KeyboardEvent, i: number) => {
    if (e.key === 'Delete') {
      onClose(tabs[i].id);
      return;
    }
    const step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const next = tabs[(i + step + tabs.length) % tabs.length];
    onActivate(next.id);
    document.getElementById(`tab-${next.id}`)?.focus();
  };

  return (
    <div className="hidden h-10 items-end gap-2 pt-1.5 pr-1.5 pl-2 sm:flex">
      <div role="tablist" aria-label={CHROME.tabs} className="flex min-w-0 flex-1 items-end gap-1">
        {tabs.map((tab, i) => {
          const page = pageEntry(pageOf(tab));
          const title = titleOf(currentOf(tab));
          const on = tab.id === activeId;
          return (
            <div
              key={tab.id}
              className={`chamfer-top group relative flex h-8 min-w-12 flex-1 basis-0 items-center transition-colors sm:max-w-52 ${
                on ? 'bg-white/[0.06] text-ink' : 'text-ink-muted hover:bg-white/[0.03] hover:text-ink'
              }`}
            >
              {on && <span aria-hidden="true" className="absolute inset-x-2.5 top-0 h-px bg-gradient-to-r from-accent/0 via-accent to-accent/0" />}
              <button
                type="button"
                role="tab"
                id={`tab-${tab.id}`}
                aria-selected={on}
                aria-controls="page-panel"
                tabIndex={on ? 0 : -1}
                onClick={() => onActivate(tab.id)}
                onAuxClick={(e) => e.button === 1 && onClose(tab.id)}
                onKeyDown={(e) => onKeyDown(e, i)}
                className="flex h-full min-w-0 flex-1 items-center gap-2 pr-1 pl-3.5 text-left text-xs"
              >
                <page.icon className={`h-3.5 w-3.5 shrink-0 ${on ? 'text-accent' : ''}`} strokeWidth={1.7} />
                <span className="truncate">{title}</span>
              </button>
              <button
                type="button"
                aria-label={CHROME.closeTab(title)}
                onClick={() => onClose(tab.id)}
                className={`mr-1.5 grid h-5 w-5 shrink-0 place-items-center rounded text-ink-muted transition hover:bg-white/10 hover:text-ink focus-visible:opacity-100 ${
                  on ? '' : 'opacity-0 group-hover:opacity-100'
                }`}
              >
                <X className="h-3 w-3" strokeWidth={2} />
              </button>
            </div>
          );
        })}
        <ChromeButton label={CHROME.newTab} onClick={onNew} className="mb-0.5 h-7 w-7">
          <Plus className="h-4 w-4" strokeWidth={1.6} />
        </ChromeButton>
      </div>
      <div className="self-center">{controls}</div>
    </div>
  );
}
