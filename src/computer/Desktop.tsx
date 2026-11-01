import { useRef, useState } from 'react';
import { DESKTOP_HINT } from '../content/desktop';
import type { AppId, AppMeta } from './apps';

type Props = {
  apps: ReadonlyArray<AppMeta>;
  onOpen: (id: AppId, from: DOMRect) => void;
  /** Point first-timers at the browser until they have opened it. */
  showHint: boolean;
};

/**
 * Desktop icons, behaving like the real thing: click selects, double-click
 * opens, Enter opens. On a touchscreen a single tap opens, because nobody
 * double-taps a phone.
 */
export default function Desktop({ apps, onOpen, showHint }: Props) {
  const [selected, setSelected] = useState<AppId | null>(null);
  const pointerType = useRef('mouse');
  const coarse = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;

  const open = (id: AppId, el: HTMLElement) => onOpen(id, el.getBoundingClientRect());

  return (
    <div className="absolute inset-0 bottom-12" onPointerDown={(e) => e.target === e.currentTarget && setSelected(null)}>
      <ul className="flex h-full w-max flex-col flex-wrap content-start gap-1 p-3 sm:p-4" aria-label="Desktop">
        {apps.map(({ id, label, Icon }) => (
          <li key={id} className="relative">
            <button
              type="button"
              data-app={id}
              onPointerDown={(e) => {
                pointerType.current = e.pointerType;
              }}
              onClick={(e) => {
                setSelected(id);
                if (pointerType.current === 'touch') open(id, e.currentTarget);
              }}
              onDoubleClick={(e) => open(id, e.currentTarget)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') open(id, e.currentTarget);
              }}
              aria-label={`Open ${label}`}
              className={`flex w-[84px] flex-col items-center gap-1.5 rounded-lg px-1 py-2 text-center transition-colors ${
                selected === id ? 'bg-white/[0.12] ring-1 ring-white/20' : 'hover:bg-white/[0.06]'
              }`}
            >
              <span className="relative">
                <Icon className="h-11 w-11 drop-shadow-[0_4px_10px_rgba(0,0,0,0.45)]" />
                {showHint && id === 'navigator' && (
                  <span
                    aria-hidden="true"
                    className="absolute -inset-2 rounded-2xl ring-2 ring-accent/70"
                    style={{ animation: 'icon-pulse 1.8s ease-out infinite' }}
                  />
                )}
              </span>
              <span className="text-[11px] leading-tight text-ink [text-shadow:0_1px_3px_rgba(0,0,0,0.9)]">
                {label}
              </span>
            </button>

            {showHint && id === 'navigator' && (
              <span
                role="status"
                className="glass pointer-events-none absolute top-5 left-[92px] rounded-md px-2.5 py-1.5 text-xs whitespace-nowrap text-ink"
                style={{ animation: 'hint-in 400ms 900ms ease-out both' }}
              >
                <span aria-hidden="true" className="mr-1 text-accent">
                  ←
                </span>
                {coarse ? DESKTOP_HINT.touch : DESKTOP_HINT.mouse}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
