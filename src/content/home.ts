import { BROWSER_NAME } from '../config';
import type { PageId } from './pages';

/** The New Tab page. TASK-03 puts the kinetic lyric stage above the speed dial. */
export const HOME = {
  eyebrow: 'into my space',
  title: `Welcome to ${BROWSER_NAME}`,
  lead: 'Every tab is one part of my story. Pick one, or tell the address bar where to go.',
  speedDial: 'Speed dial',
  tiles: ['amoghpedia', 'story', 'work', 'prompt-lens', 'ask', 'receipts'] satisfies PageId[],
} as const;
