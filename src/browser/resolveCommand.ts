import { URL_SCHEME } from '../config';
import { PAGE_IDS, PAGES, type PageId } from '../content/pages';
import { parseAddress } from './address';

export type Resolution = { to: string; page: PageId };

// "open", "show me", "take me to"... - asking to go somewhere.
const NAVIGATE = /^(?:please |can you |could you )?(?:open|show(?: me)?|go(?: to)?|take me(?: to)?|navigate(?: to)?|launch|visit|load|switch to|bring up|pull up|let me see|i want to see)\b/;
// Asking something, rather than asking to go somewhere.
const QUESTION = /^(?:what|whats|why|how|who|when|where|which|do|did|does|are|is|was|were|can|could|would|will|have|has|tell me|explain)\b/;

export const normalise = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/['’]/g, '')
    .replace(/[^\p{L}\p{N}\s/-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/** The page whose title or alias appears in the text; the longest phrase wins. */
export function bestPage(text: string): { page: PageId; phrase: string } | null {
  const padded = ` ${text} `;
  let best: { page: PageId; phrase: string } | null = null;
  for (const page of PAGE_IDS) {
    for (const phrase of [PAGES[page].title.toLowerCase(), ...PAGES[page].aliases]) {
      if (padded.includes(` ${phrase} `) && phrase.length > (best?.phrase.length ?? 0)) best = { page, phrase };
    }
  }
  return best;
}

const ask = (q: string): Resolution => ({ to: `ask?q=${encodeURIComponent(q)}`, page: 'ask' });

/**
 * Turn whatever was typed or dictated into the address bar into somewhere to
 * go. Wispr hands over finished sentences ("Show me your story."), so this
 * matches keywords rather than exact commands. A real address goes straight
 * there, a question goes to Ask Amogh, and so does anything unrecognised.
 */
export function resolveCommand(input: string): Resolution | null {
  const text = input.trim();
  if (!text) return null;

  // An address: amogh://work/secant, or a bare "story".
  const path = text.replace(new RegExp(`^${URL_SCHEME}://`, 'i'), '').replace(/\/+$/, '');
  const direct = !/\s/.test(path) && parseAddress(path.toLowerCase());
  if (direct) return { to: direct.raw, page: direct.page };

  const said = normalise(text);
  const navigating = NAVIGATE.test(said);
  if (!navigating && (QUESTION.test(said) || text.endsWith('?'))) return ask(text);

  const match = bestPage(said);
  if (!match) return ask(text);

  // "Ask Amogh why he picked a B.Sc." carries its own question.
  if (match.page === 'ask') {
    const rest = text.replace(new RegExp(`^.*?\\b${match.phrase}\\b[\\s,:-]*`, 'i'), '');
    if (normalise(rest).split(' ').filter(Boolean).length >= 2) return ask(rest);
  }
  return { to: match.page, page: match.page };
}
