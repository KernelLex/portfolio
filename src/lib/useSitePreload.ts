import { useEffect, useState } from 'react';

/**
 * The intro doubles as the preloader: while the player walks, the cafe PC, the
 * browser shell, its home page and the web fonts download. The PC's boot
 * splash ties its progress bar to this promise, so the bar reflects real work,
 * not a timer. The starfield is fetched alongside but never waited for: the
 * browser fades it in whenever it lands.
 */
let pending: Promise<void> | null = null;

export function preloadSite(): Promise<void> {
  if (!pending) {
    void import('../browser/Starfield').catch(() => undefined);
    pending = Promise.allSettled([
      import('../computer/Computer'),
      import('../browser/BrowserShell'),
      import('../pages/home/Home'),
      typeof document !== 'undefined' && 'fonts' in document
        ? document.fonts.ready
        : Promise.resolve(),
    ]).then(() => undefined);
  }
  return pending;
}

export function useSitePreload(): boolean {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    void preloadSite().then(() => {
      if (alive) setReady(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  return ready;
}
