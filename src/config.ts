/**
 * Single source of truth for the browser's identity and visual tokens.
 * The name is referenced everywhere (intro shop sign, boot screen, tab strip,
 * address bar) so renaming the browser is a one-line change here.
 */
export const BROWSER_NAME = 'Amogh Navigator';

/** URL scheme used in the address bar, e.g. amogh://amoghpedia */
export const URL_SCHEME = 'amogh';

/** The cyber cafe at the end of the intro street. */
export const CAFE_NAME = 'CYBER CAFE';

/** The operating system on the cafe PC - named after Amogh's GitHub handle. */
export const OS_NAME = 'KernelLex OS';

/** Browser-side palette (CLAUDE.md 4). Mirrored as Tailwind tokens in index.css. */
export const theme = {
  space: '#0B0E17',
  surface: '#141A26',
  surfaceHi: '#1C2433',
  accent: '#F5A35C',
  ink: '#E9EBF2',
  inkMuted: '#8B93A7',
  hairline: 'rgba(233, 235, 242, 0.08)',
} as const;

/**
 * Intro-only palette. Loud on purpose: the neon city is the "outside".
 * `accent` is deliberately the same amber as the browser - it is the one
 * visual thread that survives the transition.
 */
export const introPalette = {
  accent: theme.accent,
  cyan: '#54E8E0',
  magenta: '#FF5FA2',
  violet: '#8B6CFF',
  lime: '#B6F34B',
  night: '#070912',
} as const;

export const storageKeys = {
  introSeen: 'amogh:intro-seen',
  soundOn: 'amogh:sound-on',
} as const;

/** Timings for the cafe PC's boot and the browser launch, in milliseconds. */
export const timings = {
  /** The boot splash's progress bar is held to this window around real loading. */
  bootMin: 800,
  bootMax: 2500,
  /** A first-time visitor left alone on the desktop gets the browser opened for them. */
  desktopAutoOpen: 7000,
  /** A returning visitor gets a beat on the desktop, then straight in. */
  returningAutoOpen: 450,
  windowOpen: 550,
} as const;
