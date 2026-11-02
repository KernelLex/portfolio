import { createContext, useContext } from 'react';
import type { Address } from './address';

export type BrowserApi = {
  /** What the current tab is showing. */
  address: Address;
  /** Go somewhere in the current tab, e.g. "work/secant". */
  navigate: (to: string) => void;
  /** Focus the tab already showing that page, or open it in a new one. */
  open: (to: string) => void;
};

export const BrowserContext = createContext<BrowserApi | null>(null);

/** For pages: where am I, and how do I link to the rest of the browser. */
export function useBrowser(): BrowserApi {
  const api = useContext(BrowserContext);
  if (!api) throw new Error('useBrowser must be used inside the browser shell');
  return api;
}
