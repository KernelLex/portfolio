import { addressUrl } from '../browser/address';
import { bestPage, normalise } from '../browser/resolveCommand';
import { BYTE_ANSWERS, BYTE_TOPICS, TIPS } from '../content/guide';
import { PAGES } from '../content/pages';
import { ALL_WORK } from '../content/work';
import type { Place } from './guide';

export type ByteAction = { kind: 'go'; to: string } | { kind: 'tour' } | { kind: 'fullscreen' } | { kind: 'none' };
export type ByteAnswer = { text: string; action: ByteAction };

const has = (said: string, phrases: readonly string[]) => phrases.some((p) => ` ${said} `.includes(` ${p} `));

/** A case study named in the question: "where is Hazen Lights?" opens work/hazen. */
function caseStudy(said: string): { name: string; to: string } | null {
  let best: { name: string; to: string; length: number } | null = null;
  for (const study of ALL_WORK) {
    for (const phrase of [normalise(study.name), study.slug.replace(/-/g, ' ')]) {
      if (` ${said} `.includes(` ${phrase} `) && phrase.length > (best?.length ?? 0)) best = { name: study.name, to: `work/${study.slug}`, length: phrase.length };
    }
  }
  return best;
}

const go = (text: string, to: string): ByteAnswer => ({ text, action: { kind: 'go', to } });

/**
 * Byte's reply to anything typed or dictated into its bubble. It knows the
 * site: a page or a case study it names and opens; what it cannot place goes
 * to Ask Amogh as a question, so nothing asked is a dead end.
 */
export function answer(question: string, place: Place, touch: boolean): ByteAnswer {
  const said = normalise(question);

  if (has(said, BYTE_TOPICS.tour)) return { text: BYTE_ANSWERS.tour, action: { kind: 'tour' } };
  if (has(said, BYTE_TOPICS.fullscreen)) return { text: BYTE_ANSWERS.fullscreen, action: { kind: 'fullscreen' } };
  if (has(said, BYTE_TOPICS.me)) return { text: BYTE_ANSWERS.me, action: { kind: 'none' } };
  if (has(said, BYTE_TOPICS.contact)) return go(BYTE_ANSWERS.contact(addressUrl('amoghpedia')), 'amoghpedia');

  const study = caseStudy(said);
  if (study) return go(BYTE_ANSWERS.caseStudy(study.name, addressUrl(study.to)), study.to);

  const page = bestPage(said);
  if (page && page.page !== 'web') {
    const copy = PAGES[page.page];
    return go(BYTE_ANSWERS.going(copy.title, addressUrl(page.page), copy.blurb), page.page);
  }

  const tip = TIPS[place];
  if (tip && (place === 'street' || place === 'cafe') && has(said, BYTE_TOPICS.controls)) return { text: touch ? tip.touch : tip.keys, action: { kind: 'none' } };
  if (has(said, BYTE_TOPICS.inside)) return go(BYTE_ANSWERS.inside(addressUrl('home')), 'home');

  const to = `ask?q=${encodeURIComponent(question.trim())}`;
  return go(BYTE_ANSWERS.toTwin(addressUrl('ask')), to);
}
