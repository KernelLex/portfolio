import { useEffect, useReducer } from 'react';
import { storageKeys } from '../config';
import type { PageId } from '../content/pages';
import { readJSON, writeJSON } from '../lib/storage';
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
export const MAX_TABS = 6;
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

/** Saved tabs may be stale or hand-edited: keep only what still makes sense. */
function validTab(value: unknown): Tab[] {
  if (!value || typeof value !== 'object') return [];
  const { id, history, index } = value as Record<string, unknown>;
  if (typeof id !== 'string' || !/^t\d+$/.test(id) || !Array.isArray(history)) return [];
  const kept = history.filter((h): h is string => typeof h === 'string' && parseAddress(h) !== null);
  if (!kept.length) return [];
  const at = typeof index === 'number' && Number.isInteger(index) ? index : kept.length - 1;
  return [{ id, history: kept, index: Math.min(Math.max(at, 0), kept.length - 1), reloads: 0 }];
}

function restore(): TabsState {
  const saved = readJSON(storageKeys.tabs) as { tabs?: unknown; active?: unknown } | null;
  const tabs = Array.isArray(saved?.tabs) ? saved.tabs.flatMap(validTab).slice(-MAX_TABS) : [];
  if (!tabs.length) return addTab({ tabs: [], active: '', next: 1 }, HOME);
  const active = tabs.find((t) => t.id === saved?.active)?.id ?? tabs[tabs.length - 1].id;
  return { tabs, active, next: 1 + Math.max(...tabs.map((t) => Number(t.id.slice(1)))) };
}

/** The browser's tabs, each with its own history, remembered between visits. */
export function useTabs() {
  const [state, dispatch] = useReducer(reducer, undefined, restore);

  useEffect(() => {
    writeJSON(storageKeys.tabs, {
      tabs: state.tabs.map(({ id, history, index }) => ({ id, history, index })),
      active: state.active,
    });
  }, [state]);

  const tab = state.tabs.find((t) => t.id === state.active) ?? state.tabs[0];
  return { tabs: state.tabs, tab, dispatch };
}
