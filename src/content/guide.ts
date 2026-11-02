import { BROWSER_NAME } from '../config';

/** Where a tip points: a page's icon, or a piece of the browser chrome. */
export type GuideTarget = `page:${string}` | 'address-bar';

export type GuideTip = {
  text: string;
  target?: GuideTarget;
  /** A recorded voice line, e.g. 'audio/guide-1.mp3'. Played only with sound on. */
  audio?: string;
};

/** The pixel guide's onboarding, shown once and reopened with "?". */
export const GUIDE_TIPS: ReadonlyArray<GuideTip> = [
  { text: `Welcome to ${BROWSER_NAME}. Every tab is a part of my life.` },
  { text: 'On the home page, hold your Wispr key and say anything.', target: 'page:home' },
  { text: 'Questions? Ask Amogh. My AI twin has answers.', target: 'page:ask' },
  { text: 'Psst… try the address bar. You can talk to it too.', target: 'address-bar' },
];

export const GUIDE = {
  name: 'Your guide',
  next: 'Next',
  done: 'Got it',
  close: 'Close the tips',
  step: (n: number, total: number) => `${n} of ${total}`,
} as const;
