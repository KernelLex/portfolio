import { BROWSER_NAME } from '../config';
import type { PageId } from './pages';

/** The New Tab page: the kinetic lyric stage, then the speed dial. */
export const HOME = {
  eyebrow: 'into my space',
  title: `Welcome to ${BROWSER_NAME}`,
  lead: 'Every tab is one part of my story. Say something to the stage, or pick a tab below.',
  speedDial: 'Speed dial',
  elsewhere: 'Elsewhere',
  tiles: ['amoghpedia', 'story', 'work', 'prompt-lens', 'ask', 'receipts'] satisfies PageId[],
} as const;
