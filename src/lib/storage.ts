/**
 * localStorage is unavailable in private windows, with blocked site data, and
 * inside some embedded webviews - and it throws rather than returning null.
 * Everything here degrades to the supplied default instead of breaking a page.
 */
export function readFlag(key: string, fallback: boolean): boolean {
  try {
    const raw = window.localStorage.getItem(key);
    return raw === null ? fallback : raw === '1';
  } catch {
    return fallback;
  }
}

export function writeFlag(key: string, value: boolean): void {
  try {
    window.localStorage.setItem(key, value ? '1' : '0');
  } catch {
    /* no-op: a lost preference is not worth breaking the page over */
  }
}
