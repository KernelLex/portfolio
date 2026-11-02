import { useSyncExternalStore } from 'react';

/**
 * Full screen, for the whole page. Browsers only allow it from a click or a
 * key press, so the title screen's Start asks for it; a toggle covers the rest.
 * Phones that cannot (iPhone Safari) simply carry on in the browser.
 */
export function enterFullscreen(): void {
  const el = document.documentElement;
  if (document.fullscreenElement || !el.requestFullscreen) return;
  void el.requestFullscreen({ navigationUI: 'hide' }).catch(() => undefined);
}

export function toggleFullscreen(): void {
  if (document.fullscreenElement) void document.exitFullscreen().catch(() => undefined);
  else enterFullscreen();
}

export const canFullscreen = (): boolean => typeof document !== 'undefined' && Boolean(document.documentElement.requestFullscreen);

const subscribe = (fn: () => void) => {
  document.addEventListener('fullscreenchange', fn);
  return () => document.removeEventListener('fullscreenchange', fn);
};

export function useFullscreen(): boolean {
  return useSyncExternalStore(subscribe, () => Boolean(document.fullscreenElement), () => false);
}
