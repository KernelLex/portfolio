import { useSyncExternalStore } from 'react';

/**
 * Full screen, for the whole page. Browsers only allow it from a click or a
 * key press, so the title screen's Start asks for it; a toggle covers the rest.
 * Phones that cannot (iPhone Safari) simply carry on in the browser.
 *
 * Once the visitor has chosen full screen, it is theirs to keep. Opening a
 * link in a new tab or switching away takes it with it, and it comes back at
 * their next click or key on returning (browsers need that gesture). Any other
 * exit - Esc, most likely - is respected, with an offer to go back. Only the
 * toggle turns it off for good.
 */

/** A click on a link this recent took the visitor away, even if the tab has not hidden yet. */
const LEAVE_MS = 2000;

/** The visitor chose full screen and has not turned it off with the toggle. */
let wanted = false;
/** Full screen was lost to leaving the page: restore it at the next gesture. */
let owed = false;
/** Full screen was left on the page itself: offer it back. */
let offered = false;
let leftAt = 0;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((fn) => fn());

function request(): void {
  const el = document.documentElement;
  if (document.fullscreenElement || !el.requestFullscreen) return;
  void el.requestFullscreen({ navigationUI: 'hide' }).catch(() => undefined);
}

export function enterFullscreen(): void {
  wanted = true;
  request();
}

export function toggleFullscreen(): void {
  if (document.fullscreenElement) {
    wanted = false;
    void document.exitFullscreen().catch(() => undefined);
  } else enterFullscreen();
}

/** The offer to go back was turned down. */
export function declineFullscreen(): void {
  wanted = false;
  offered = false;
  notify();
}

export const canFullscreen = (): boolean => typeof document !== 'undefined' && Boolean(document.documentElement.requestFullscreen);

if (typeof document !== 'undefined' && canFullscreen()) {
  const away = () => {
    leftAt = Date.now();
  };
  document.addEventListener(
    'click',
    (e) => {
      const link = (e.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null;
      if (link && (link.target === '_blank' || link.origin !== location.origin)) away();
    },
    true,
  );
  window.addEventListener('blur', away);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) away();
  });

  document.addEventListener('fullscreenchange', () => {
    if (document.fullscreenElement) {
      owed = false;
      offered = false;
    } else if (wanted) {
      const left = document.hidden || !document.hasFocus() || Date.now() - leftAt < LEAVE_MS;
      owed = left;
      offered = !left;
    }
    notify();
  });

  // Back on the page: the first click or key brings full screen back with it.
  const restore = () => {
    if (owed && wanted && !document.hidden) {
      owed = false;
      request();
    }
  };
  window.addEventListener('pointerup', restore, true);
  window.addEventListener('keydown', restore, true);
}

const subscribe = (fn: () => void) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

export function useFullscreen(): boolean {
  return useSyncExternalStore(subscribe, () => Boolean(document.fullscreenElement), () => false);
}

/** Full screen was left on the page itself, and can be offered back. */
export function useFullscreenOffer(): boolean {
  return useSyncExternalStore(subscribe, () => offered && !document.fullscreenElement, () => false);
}
