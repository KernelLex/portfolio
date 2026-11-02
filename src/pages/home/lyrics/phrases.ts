import { MOOD_WORDS, type Mood } from '../../../content/lyrics';

export type CountUp = {
  prefix: string;
  value: number;
  decimals: number;
  /** How the original grouped its digits: 2,15,867 is Indian, 215,867 is not. */
  locale: 'en-IN' | 'en-US' | null;
  suffix: string;
};

export type Word = {
  text: string;
  long: boolean;
  caps: boolean;
  count: CountUp | null;
};

export type Ending = 'none' | 'comma' | 'stop' | 'question' | 'exclaim';

export type Phrase = {
  words: Word[];
  ending: Ending;
  mood: Mood | null;
};

/** A phrase never runs past this many words; longer clauses split evenly. */
const MAX_WORDS = 5;
/** Enough for a long dictation without turning into a feature film. */
const MAX_PHRASES = 30;
const NUMBER = /^([₹$€£#]?)(\d{1,3}(?:,\d{2,3})+|\d+)(\.\d+)?(%|[kKmMx+])?$/;

function countUp(token: string): CountUp | null {
  const m = NUMBER.exec(token);
  if (!m) return null;
  const [, prefix, whole, fraction = '', suffix = ''] = m;
  const value = Number(whole.replace(/,/g, '') + fraction);
  if (!Number.isFinite(value) || value < 2) return null;
  const locale = whole.includes(',') ? (/,\d{2}(?=,)/.test(whole) ? 'en-IN' : 'en-US') : null;
  return { prefix, value, decimals: fraction ? fraction.length - 1 : 0, locale, suffix };
}

function toWord(raw: string): Word {
  // Lyrics drop the soft punctuation but keep ? and !, which they perform.
  const text = raw.replace(/^["“‘(]+/u, '').replace(/["”’)]+$/u, '').replace(/[.,;:…—–]+$/u, '');
  const letters = (text.match(/\p{L}/gu) ?? []).length;
  return {
    text,
    long: letters >= 8,
    caps: letters >= 2 && text === text.toUpperCase() && text !== text.toLowerCase(),
    count: countUp(text.replace(/[?!]+$/, '')),
  };
}

function endingOf(raw: string): Ending | null {
  const t = raw.replace(/["”’)]+$/u, '');
  if (/\?$/.test(t)) return 'question';
  if (/!$/.test(t)) return 'exclaim';
  if (/[.…;:]$/u.test(t)) return 'stop';
  if (/[,—–]$/u.test(t)) return 'comma';
  return null;
}

function moodOf(words: Word[]): Mood | null {
  const plain = words.map((w) => w.text.toLowerCase().replace(/[^\p{L}]/gu, ''));
  for (const mood of ['bright', 'low', 'calm'] as const) {
    if (plain.some((w) => MOOD_WORDS[mood].includes(w))) return mood;
  }
  return null;
}

/**
 * Break spoken text into the phrases the stage performs: at punctuation first,
 * then into even runs of at most five words, so a breathless sentence still
 * lands in readable beats.
 */
export function splitPhrases(input: string): Phrase[] {
  const tokens = input.replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);
  const clauses: { tokens: string[]; ending: Ending }[] = [];
  let current: string[] = [];
  for (const token of tokens) {
    current.push(token);
    const ending = endingOf(token);
    if (ending) {
      clauses.push({ tokens: current, ending });
      current = [];
    }
  }
  if (current.length) clauses.push({ tokens: current, ending: 'stop' });

  const phrases: Phrase[] = [];
  for (const clause of clauses) {
    const size = Math.ceil(clause.tokens.length / Math.ceil(clause.tokens.length / MAX_WORDS));
    for (let i = 0; i < clause.tokens.length; i += size) {
      const words = clause.tokens.slice(i, i + size).map(toWord).filter((w) => w.text);
      if (!words.length) continue;
      phrases.push({ words, ending: i + size >= clause.tokens.length ? clause.ending : 'none', mood: moodOf(words) });
    }
  }
  return phrases.slice(0, MAX_PHRASES);
}
