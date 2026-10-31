import { useEffect, useState } from 'react';

/**
 * The intro doubles as the preloader: while the player walks, the browser shell
 * chunk and the web fonts download. The boot screen's progress bar is tied to
 * this promise, so the bar reflects real work rather than a fake timer.
 */
let pending: Promise<void> | null = null;

export function preloadSite(): Promise<void> {
  if (!pending) {
    pending = Promise.allSettled([
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
