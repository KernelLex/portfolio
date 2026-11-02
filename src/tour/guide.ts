import { useSyncExternalStore } from 'react';

/**
 * The guide bot's state, shared by the game (Phaser) and the PC and browser
 * (React): whether the visitor is being walked through or finding their own
 * way (chosen on the title screen), where in the experience they are, how
 * far the narration for that place has got, and where Byte has been asked to
 * take them.
 */
export type GuideMode = 'tour' | 'explore';
export type Place = 'title' | 'street' | 'cafe' | 'link' | 'boot' | 'desktop' | 'browser';

type GuideState = {
  mode: GuideMode;
  place: Place;
  /** The speech bubble is showing (the bot itself always is, except in cutscenes). */
  open: boolean;
  /** Which narration line for this place the tour is on. */
  line: number;
  /** The tour has said everything for this place; the next action may go ahead. */
  narrated: boolean;
  /** Byte's answer to the visitor's last question, shown until it is dismissed. */
  said: string | null;
  /** The address Byte is taking the visitor to, until the browser opens it. */
  trip: string | null;
};

let state: GuideState = { mode: 'explore', place: 'title', open: false, line: 0, narrated: false, said: null, trip: null };
const listeners = new Set<() => void>();
const seen = new Set<Place>();

function set(patch: Partial<GuideState>): void {
  state = { ...state, ...patch };
  listeners.forEach((fn) => fn());
}

export const guide = {
  get: (): GuideState => state,
  subscribe(fn: () => void): () => void {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },

  /** The visitor has arrived somewhere new. Exploring, each place's tip shows once. */
  at(place: Place): void {
    if (state.place === place) return;
    const firstTime = !seen.has(place);
    seen.add(place);
    // On the way somewhere, Byte keeps saying where, rather than tipping each stop.
    const open = state.said !== null || (state.mode === 'explore' ? firstTime && state.trip === null : true);
    set({ place, line: 0, narrated: false, open });
  },

  /** Start (or restart) the walkthrough from wherever the visitor is. */
  tour(): void {
    set({ mode: 'tour', open: true, line: 0, narrated: false, said: null, trip: null });
  },

  explore(): void {
    seen.add(state.place);
    set({ mode: 'explore', open: true });
  },

  toggle(): void {
    if (state.mode === 'tour') guide.explore();
    else guide.tour();
  },

  setOpen(open: boolean): void {
    set(open ? { open } : { open, said: null });
  },

  /** Byte answers a question; asking takes over from the walkthrough. */
  say(said: string): void {
    seen.add(state.place);
    set({ mode: 'explore', open: true, said });
  },

  /** Take the visitor to an address in the browser, from wherever they are. */
  go(to: string): void {
    set({ trip: to });
  },

  /** The browser has the trip: hand over the address, once. */
  arrive(): string | null {
    const to = state.trip;
    if (to !== null) set({ trip: null });
    return to;
  },

  /** The tour's narration moves on; past the last line, the place is narrated. */
  advance(lines: number): void {
    if (state.line < lines - 1) set({ line: state.line + 1 });
    else if (!state.narrated) set({ narrated: true });
  },
};

/** For the game loop: is the tour driving? */
export const touring = (): boolean => state.mode === 'tour';
/** For the game loop: may the tour take the next step here? */
export const narrated = (): boolean => state.narrated;

export function useGuide(): GuideState {
  return useSyncExternalStore(guide.subscribe, guide.get, guide.get);
}
