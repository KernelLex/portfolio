import { useEffect, useState } from 'react';

/**
 * The intro doubles as the preloader: while the player walks, the cafe PC, the
 * browser shell and the web fonts download. The PC's boot splash ties its
 * progress bar to this promise, so the bar reflects real work, not a timer.
 */
let pending: Promise<void> | null = null;

export function preloadSite(): Promise<void> {
  if (!pending) {
    pending = Promise.allSettled([
      import('../computer/Computer'),
      import('../components/BrowserShell'),
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
