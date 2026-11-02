import { useSyncExternalStore } from 'react';

/**
 * The site's look: 'pixel' carries the intro's pixel art through the PC and
 * the browser; 'smooth' is the calm glass look. Remembered per visitor, and
 * applied as data-skin on <html> so the CSS can do the rest.
 */
export type Skin = 'pixel' | 'smooth';

const KEY = 'amogh:skin';
const listeners = new Set<() => void>();

function read(): Skin {
  try {
    return window.localStorage.getItem(KEY) === 'smooth' ? 'smooth' : 'pixel';
  } catch {
    return 'pixel';
  }
}

let skin: Skin = typeof window === 'undefined' ? 'pixel' : read();

function apply(): void {
  document.documentElement.dataset.skin = skin;
}

if (typeof document !== 'undefined') apply();

export const getSkin = (): Skin => skin;

export function setSkin(next: Skin): void {
  skin = next;
  apply();
  try {
    window.localStorage.setItem(KEY, next);
  } catch {
    /* a lost preference is not worth breaking the page over */
  }
  listeners.forEach((fn) => fn());
}

function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function useSkin(): Skin {
  return useSyncExternalStore(subscribe, getSkin, getSkin);
}
