import { VIDEOS, type Video } from './links';

/**
 * Shorts: a vertical feed of project videos. Each entry can cut a moment out
 * of a longer video with start/end (seconds) once Amogh picks the moments;
 * until then each plays its whole walkthrough.
 */
export type Short = { video: Video; title: string; caption: string; slug: string; start?: number; end?: number };

export const SHORTS_PAGE = {
  title: 'Shorts',
  hint: 'Scroll or use the arrow keys',
  open: 'Open case study',
  play: 'Tap to play',
  previous: 'Previous short',
  next: 'Next short',
  note: 'Plays from YouTube in privacy-enhanced mode, only after you press play.',
} as const;

export const SHORTS: ReadonlyArray<Short> = [
  { video: VIDEOS.novaErp, title: 'Nova ERP', caption: 'Quote to cash to accounts, across a group of companies. Recorded on the Vera Enterprises workspaces.', slug: 'nova-erp' },
  { video: VIDEOS.novaCrm, title: 'Nova CRM', caption: 'First call to last payment, for businesses that sell finite inventory. Nothing sold twice.', slug: 'nova-crm' },
  { video: VIDEOS.novaHrms, title: 'Nova HRMS', caption: 'Payroll, leave, hiring and tax that reconcile every month.', slug: 'nova-hrms' },
];
