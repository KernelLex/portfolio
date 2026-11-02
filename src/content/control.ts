import { RECEIPTS } from './receipts';
import { SIDE_BUILDS } from './sideBuilds';
import { CLIENT_WORK, NOVA_PRODUCTS } from './work';

/**
 * Every number here is counted from the site's own content, or is a fact on
 * record (CLAUDE.md 3). Nothing is typed in by hand to look impressive.
 */
export const CONTROL = {
  eyebrow: 'amogh://control',
  title: 'Amogh Control',
  lead: 'The numbers, as gauges. Each one is counted from what is on this site.',
  wpmTitle: 'Your voice speed',
  wpmHint: 'Click here, hold your Wispr key and say a sentence.',
  wpmLabel: 'Speak here to test your speed',
  wpmNone: 'Waiting for a voice chunk',
  wpmTyping: 'typing avg 40',
  wpmEstimated: 'estimated from how the text arrived',
  recovered: 'Recovered by TrueCommit, on real paid invoices',
} as const;

export const GAUGES = [
  { label: 'Client projects', value: CLIENT_WORK.length },
  { label: 'Nova products', value: NOVA_PRODUCTS.length },
  { label: 'Side builds', value: SIDE_BUILDS.length },
  { label: 'Roles before graduating', value: 7 },
  { label: 'Languages spoken', value: 5 },
  { label: 'Voice receipts', value: RECEIPTS.length },
];
