import { CLIPS, type Clip } from './links';

/** Shorts: a vertical feed of Amogh's project videos. */
export type Short = { clip: Clip; caption: string; link: { to: string; label: string } };

export const SHORTS_PAGE = {
  title: 'Shorts',
  hint: 'Scroll, swipe or use the arrow keys',
  soundOn: 'Sound on',
  soundOff: 'Tap for sound',
  noSound: 'No sound on this one',
  previous: 'Previous short',
  next: 'Next short',
} as const;

const CASE = 'Open the case study';

export const SHORTS: ReadonlyArray<Short & { id: string }> = [
  { id: 'metakai', clip: CLIPS.metakai, caption: 'Build the body you want. No ads, no account, and your data stays on your phone.', link: { to: 'side-builds', label: 'See the side builds' } },
  { id: 'erp', clip: CLIPS.erp, caption: 'Nova ERP: quote to cash to accounts, across a group of companies.', link: { to: 'work/nova-erp', label: CASE } },
  { id: 'crm', clip: CLIPS.crm, caption: 'Nova CRM: first call to last payment, for businesses that sell finite inventory.', link: { to: 'work/nova-crm', label: CASE } },
  { id: 'cyberbane', clip: CLIPS.cyberbane, caption: 'A reputation overhaul for Cyberpunk 2077. Night City remembers.', link: { to: 'side-builds', label: 'See the side builds' } },
  { id: 'hrms', clip: CLIPS.hrms, caption: 'Nova HRMS: the people and pay side, correct every month.', link: { to: 'work/nova-hrms', label: CASE } },
];
