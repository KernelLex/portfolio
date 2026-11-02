import { addressUrl } from '../browser/address';
import { normalise } from '../browser/resolveCommand';
import { BYTE_ANSWERS, BYTE_NAVIGATE, BYTE_PLACES, GUIDE, TIPS, type ByteEntry, type ByteTarget } from '../content/guide';
import { PAGES } from '../content/pages';
import { ALL_WORK } from '../content/work';
import type { Place } from './guide';

export type ByteAction = { kind: 'go'; to: string } | { kind: 'download' } | { kind: 'tour' } | { kind: 'fullscreen' } | { kind: 'help' } | { kind: 'none' };
export type ByteAnswer = { text: string; action: ByteAction };

const STRONG = 3;
const WEAK = 1;
/** Below this, a match needs the visitor to have asked to go somewhere. */
const ENOUGH = 2;

const inGame = (place: Place) => place === 'street' || place === 'cafe';

/** "videos" and "video", "started" and "start": the same word for matching. */
function stem(word: string): string {
  if (word.length > 4 && word.endsWith('ies')) return `${word.slice(0, -3)}y`;
  if (word.length > 5 && word.endsWith('ing')) return word.slice(0, -3);
  if (word.length > 4 && word.endsWith('ed')) return word.slice(0, -2);
  if (word.length > 3 && word.endsWith('s') && !word.endsWith('ss')) return word.slice(0, -1);
  return word;
}

const words = (text: string) => normalise(text).split(/[\s/-]+/).filter(Boolean).map(stem);

/** Edits between two words, a swapped pair counting as one ("reusme"). */
function distance(a: string, b: string): number {
  const d = Array.from({ length: a.length + 1 }, (_, i) => Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)));
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
    }
  }
  return d[a.length][b.length];
}

/** Short words must be exact; longer ones forgive a typo, very long ones two. */
function same(token: string, key: string): boolean {
  if (token === key) return true;
  if (key.length < 5 || Math.abs(token.length - key.length) > 2) return false;
  return distance(token, key) <= (key.length >= 8 ? 2 : 1);
}

type Keyed = { entry: ByteEntry; keys: Array<{ parts: string[]; weight: number }> };

const KEYED: Keyed[] = BYTE_PLACES.map((entry) => ({
  entry,
  keys: [...entry.strong.map((k) => ({ parts: words(k), weight: STRONG })), ...(entry.weak ?? []).map((k) => ({ parts: words(k), weight: WEAK }))],
}));

/** Every word of a phrase has to be there, in any order; longer phrases count for more. */
function score({ keys }: Keyed, tokens: string[]): number {
  let total = 0;
  for (const { parts, weight } of keys) {
    if (parts.every((part) => tokens.some((t) => same(t, part)))) total += weight * parts.length;
  }
  return total;
}

const studyOf = (slug: string) => ALL_WORK.find((s) => s.slug === slug);

/** What Byte says about a destination, and what it does. */
function respond(target: ByteTarget, place: Place, touch: boolean): ByteAnswer {
  const go = (text: string, to: string): ByteAnswer => ({ text, action: { kind: 'go', to } });
  switch (target.kind) {
    case 'page': {
      const copy = PAGES[target.page];
      return go(BYTE_ANSWERS.going(copy.title, addressUrl(target.page), copy.blurb), target.page);
    }
    case 'study': {
      const to = `work/${target.slug}`;
      return go(BYTE_ANSWERS.caseStudy(studyOf(target.slug)?.name ?? PAGES.work.title, addressUrl(to)), to);
    }
    case 'contact':
      return go(BYTE_ANSWERS.contact(addressUrl('amoghpedia')), 'amoghpedia');
    case 'download':
      return { text: BYTE_ANSWERS.download, action: { kind: 'download' } };
    case 'browser':
      return go(BYTE_ANSWERS.inside(addressUrl('home')), 'home');
    case 'tour':
      return { text: BYTE_ANSWERS.tour, action: { kind: 'tour' } };
    case 'fullscreen':
      return { text: BYTE_ANSWERS.fullscreen, action: { kind: 'fullscreen' } };
    case 'help':
      return { text: BYTE_ANSWERS.help, action: { kind: 'help' } };
    case 'me':
      return { text: BYTE_ANSWERS.me, action: { kind: 'none' } };
    case 'controls': {
      const tip = TIPS[place];
      return { text: tip && inGame(place) ? (touch ? tip.touch : tip.keys) : BYTE_ANSWERS.notHere, action: { kind: 'none' } };
    }
  }
}

/**
 * Byte's reply to anything typed or dictated into its bubble. Every place it
 * knows is scored against the question; the best one wins, and in the game
 * "controls" means how to play. What it cannot place goes to Ask Amogh as a
 * question, so nothing asked is a dead end.
 */
export function answer(question: string, place: Place, touch: boolean): ByteAnswer {
  const tokens = words(question);
  const navigating = tokens.some((t) => BYTE_NAVIGATE.some((n) => t === stem(n)));
  // In the game, "controls" are how to play, not the Amogh Control page.
  const ordered = inGame(place) ? [...KEYED].sort((a, b) => Number(b.entry.target.kind === 'controls') - Number(a.entry.target.kind === 'controls')) : KEYED;

  let best: { keyed: Keyed; score: number } | null = null;
  for (const keyed of ordered) {
    const s = score(keyed, tokens);
    if (s > (best?.score ?? 0)) best = { keyed, score: s };
  }
  if (best && (best.score >= ENOUGH || navigating)) return respond(best.keyed.entry.target, place, touch);

  const to = `ask?q=${encodeURIComponent(question.trim())}`;
  return { text: BYTE_ANSWERS.toTwin(addressUrl('ask')), action: { kind: 'go', to } };
}

export type MenuItem = { label: string; example: string };

/** Byte's list of everything it can do, grouped, for wherever the visitor is. */
export function byteMenu(place: Place): Array<{ title: string; items: MenuItem[] }> {
  return (Object.keys(GUIDE.groups) as Array<keyof typeof GUIDE.groups>).map((group) => ({
    title: GUIDE.groups[group],
    items: BYTE_PLACES.filter((e) => e.group === group && (e.target.kind !== 'controls' || inGame(place))).map((e) => ({
      label: e.label ?? (e.target.kind === 'study' ? (studyOf(e.target.slug)?.name ?? '') : ''),
      example: e.example,
    })),
  }));
}
