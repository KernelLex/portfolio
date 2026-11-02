import { useEffect, useReducer } from 'react';
import type { PageId } from '../content/pages';
import { parseAddress } from './address';

export type Tab = {
  id: string;
  /** Addresses this tab has visited, for back and forward. */
  history: string[];
  index: number;
  /** Bumped by reload, to remount the page. Not persisted. */
  reloads: number;
};

type TabsState = { tabs: Tab[]; active: string; next: number };

export type TabAction =
  /** Focus the tab already showing that page, or open a new one. */
  | { type: 'open'; to: string }
  /** Go somewhere in the current tab. */
  | { type: 'navigate'; to: string }
  | { type: 'go'; delta: -1 | 1 }
  | { type: 'reload' }
  | { type: 'activate'; id: string }
  | { type: 'close'; id: string }
  | { type: 'reset' };

/** Past this, the oldest tab closes to make room. */
export const MAX_TABS = 10;
/** The browser opens with every page in a tab, New Tab in front. */
const START_TABS: ReadonlyArray<PageId> = ['home', 'story', 'work', 'amoghpedia', 'side-builds', 'shorts', 'ask', 'control'];
const HISTORY_LIMIT = 30;
const HOME = 'home';

export const currentOf = (tab: Tab): string => tab.history[tab.index];
/** Tabs only ever hold valid addresses; home is a formality for the type. */
export const pageOf = (tab: Tab): PageId => parseAddress(currentOf(tab))?.page ?? 'home';

function addTab(state: TabsState, to: string): TabsState {
  const tab: Tab = { id: `t${state.next}`, history: [to], index: 0, reloads: 0 };
  return { tabs: [...state.tabs.slice(-(MAX_TABS - 1)), tab], active: tab.id, next: state.next + 1 };
}

function updateTab(state: TabsState, id: string, fn: (t: Tab) => Tab): TabsState {
  return { ...state, tabs: state.tabs.map((t) => (t.id === id ? fn(t) : t)) };
}

function push(tab: Tab, to: string): Tab {
  if (currentOf(tab) === to) return tab;
  const history = [...tab.history.slice(0, tab.index + 1), to].slice(-HISTORY_LIMIT);
  return { ...tab, history, index: history.length - 1 };
}

function reducer(state: TabsState, action: TabAction): TabsState {
  switch (action.type) {
    case 'open': {
      const page = parseAddress(action.to)?.page;
      if (!page) return state;
      const existing = state.tabs.find((t) => pageOf(t) === page);
      if (!existing) return addTab(state, action.to);
      // A bare page focuses its tab wherever it is; anything deeper goes there.
      const moved = action.to === page ? state : updateTab(state, existing.id, (t) => push(t, action.to));
      return { ...moved, active: existing.id };
    }
    case 'navigate':
      if (!parseAddress(action.to)) return state;
      return updateTab(state, state.active, (t) => push(t, action.to));
    case 'go':
      return updateTab(state, state.active, (t) => {
        const index = t.index + action.delta;
        return index < 0 || index >= t.history.length ? t : { ...t, index };
      });
    case 'reload':
      return updateTab(state, state.active, (t) => ({ ...t, reloads: t.reloads + 1 }));
    case 'activate':
      return state.tabs.some((t) => t.id === action.id) ? { ...state, active: action.id } : state;
    case 'close': {
      const i = state.tabs.findIndex((t) => t.id === action.id);
      if (i < 0) return state;
      const tabs = state.tabs.filter((t) => t.id !== action.id);
      // A browser always has a tab: closing the last one leaves a New Tab.
      if (!tabs.length) return addTab({ ...state, tabs: [] }, HOME);
      const active = state.active === action.id ? tabs[Math.min(i, tabs.length - 1)].id : state.active;
      return { ...state, tabs, active };
    }
    case 'reset':
      return addTab({ ...state, tabs: [] }, HOME);
  }
}

function fresh(): TabsState {
  const opened = START_TABS.reduce((state, page) => addTab(state, page), { tabs: [], active: '', next: 1 } as TabsState);
  return { ...opened, active: opened.tabs[0].id };
}

/**
 * Tabs live in memory only: logging off the PC and back on keeps them, and a
 * reload starts clean, with the walk in from the street.
 */
let remembered: TabsState | null = null;

/** The browser's tabs, each with its own history. */
export function useTabs() {
  const [state, dispatch] = useReducer(reducer, undefined, () => remembered ?? fresh());

  useEffect(() => {
    remembered = state;
  }, [state]);

  const tab = state.tabs.find((t) => t.id === state.active) ?? state.tabs[0];
  return { tabs: state.tabs, tab, dispatch };
}
