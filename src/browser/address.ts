import { URL_SCHEME } from '../config';
import { PAGE_IDS, type PageId } from '../content/pages';

/**
 * What a tab is showing, as the path after amogh:// - "work", "work/secant",
 * "ask?q=why%20bsc". Kept as a plain string so tabs persist as JSON.
 */
export type Address = {
  raw: string;
  page: PageId;
  /** Path segments after the page, for subpages like work/secant. */
  rest: string[];
  query: URLSearchParams;
};

export const isPageId = (v: string | undefined): v is PageId => PAGE_IDS.includes(v as PageId);

export function parseAddress(raw: string): Address | null {
  const [path = '', search = ''] = raw.split('?');
  const [page, ...rest] = path.split('/').filter(Boolean);
  if (!isPageId(page)) return null;
  return { raw, page, rest, query: new URLSearchParams(search) };
}

/** The path as people read it: decoded, so a question reads as words. */
export function addressPath(raw: string): string {
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

export const addressUrl = (raw: string): string => `${URL_SCHEME}://${addressPath(raw)}`;
