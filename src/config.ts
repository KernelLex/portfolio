/**
 * Single source of truth for the browser's identity and visual tokens.
 * The name is referenced everywhere (intro shop sign, boot screen, tab strip,
 * address bar) so renaming the browser is a one-line change here.
 */
export const BROWSER_NAME = 'Amogh Navigator';

/** URL scheme used in the address bar, e.g. amogh://amoghpedia */
export const URL_SCHEME = 'amogh';

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

/** Timings for the intro -> browser handoff, in milliseconds. */
export const timings = {
  doorZoom: 600,
  whiteFlash: 300,
  bootMin: 800,
  bootMax: 2500,
  shellFadeIn: 500,
} as const;
