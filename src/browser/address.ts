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

let asked = 0;

/**
 * A question for Ask Amogh. Each one gets its own address (the &n= tag), so
 * asking the same thing again - from a case study, Byte or the address bar -
 * really asks again instead of landing on an answer already given.
 */
export function askAddress(question: string): string {
  asked += 1;
  return `ask?q=${encodeURIComponent(question.trim())}&n=${Date.now().toString(36)}${asked}`;
}

/** The question an Ask address carries. */
export const askedIn = (raw: string): string => new URLSearchParams(raw.split('?')[1] ?? '').get('q') ?? '';

/** The path as people read it: decoded, so a question reads as words, without the &n= tag. */
export function addressPath(raw: string): string {
  const shown = raw.replace(/&n=[^&]*/, '');
  try {
    return decodeURIComponent(shown);
  } catch {
    return shown;
  }
}

export const addressUrl = (raw: string): string => `${URL_SCHEME}://${addressPath(raw)}`;
