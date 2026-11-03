import { CLIPS, PROFILES, type Clip } from './links';

/**
 * Videos: Amogh's project walkthroughs, watched like a video site. Facts from
 * the case studies and side builds; durations are the files' real lengths.
 * No view counts or like counts: there are none to show honestly.
 */
export type Video = {
  id: string;
  clip: Clip;
  title: string;
  /** m:ss */
  duration: string;
  tags: readonly string[];
  description: readonly string[];
  link: { to: string; label: string };
  /** What "Ask Amogh" asks about. */
  topic: string;
};

export const VIDEOS_PAGE = {
  channel: 'Amogh P',
  handle: '@KernelLex',
  follow: 'Follow',
  followTitle: 'Follow Amogh on LinkedIn',
  followHref: PROFILES.linkedin.href,
  like: 'Like',
  liked: 'Liked',
  dislike: 'Dislike',
  ask: 'Ask Amogh',
  askAbout: (topic: string) => `Tell me about ${topic}`,
  upNext: 'Up next',
  autoplay: 'Autoplay',
  nextIn: (seconds: number) => `Up next in ${seconds}`,
  cancel: 'Cancel',
  playNow: 'Play now',
  more: 'Show more',
  less: 'Show less',
  noSound: 'No sound',
  hosted: 'Hosted on this site. No tracking, no ads.',
} as const;

const CASE = 'Open the case study';
const SIDE = 'See the side builds';
const NOVA = 'Nova is the product line Amogh builds with Thushaar Rangan.';
const COLLAB = 'A collaboration with Thushaar Rangan that Amogh played a part in.';

export const VIDEOS: ReadonlyArray<Video> = [
  {
    id: 'erp',
    clip: CLIPS.erp,
    title: 'Nova ERP: quote to cash to accounts, across a group of companies',
    duration: '2:13',
    tags: ['Nova', 'ERP', 'Walkthrough'],
    description: [
      'A walkthrough of Nova ERP, recorded on the Vera Enterprises workspaces.',
      'A quotation studio with a vendor price list of over 7,000 items; won quotes become projects with purchase, site inventory and service tickets; logistics with proof of delivery; Tally finances reconciled against the company’s own books to within about one percent; and an assistant that answers questions about the company’s own figures.',
      NOVA,
    ],
    link: { to: 'work/nova-erp', label: CASE },
    topic: 'Nova ERP',
  },
  {
    id: 'crm',
    clip: CLIPS.crm,
    title: 'Nova CRM: first call to last payment',
    duration: '1:40',
    tags: ['Nova', 'CRM', 'Billing'],
    description: [
      'For businesses that sell finite inventory, built first for outdoor media.',
      'One timeline per client, inventory that knows its own calendar so nothing is sold twice, and billing that survives an audit: gap-free numbering per financial year, tax withheld at source, ageing and reminders.',
      NOVA,
    ],
    link: { to: 'work/nova-crm', label: CASE },
    topic: 'Nova CRM',
  },
  {
    id: 'hrms',
    clip: CLIPS.hrms,
    title: 'Nova HRMS: the people and pay side, correct every month',
    duration: '0:42',
    tags: ['Nova', 'HRMS', 'Payroll'],
    description: [
      'Payroll gross to net, tax that reconciles to the year-end certificate, leave and hiring, and dated history on every fact.',
      'Built and automatically tested to WCAG 2.1 AA.',
      NOVA,
    ],
    link: { to: 'work/nova-hrms', label: CASE },
    topic: 'Nova HRMS',
  },
  {
    id: 'metakai',
    clip: CLIPS.metakai,
    title: 'Metakai: build the body you want',
    duration: '0:57',
    tags: ['Mobile app', 'Fitness'],
    description: [
      'A fitness app for every goal, from cutting to running: calories from your own kitchen, every set and PR, GPS runs, watch sync and a physique pass.',
      'No ads, no account, and your data stays on your phone.',
      COLLAB,
    ],
    link: { to: 'side-builds', label: SIDE },
    topic: 'Metakai',
  },
  {
    id: 'cyberbane',
    clip: CLIPS.cyberbane,
    title: 'CyberBane: Night City remembers',
    duration: '0:40',
    tags: ['Game mod', 'Cyberpunk 2077'],
    description: [
      'A reputation overhaul for Cyberpunk 2077: the street reacts to how you play, rivals come back harder, and one screen shows exactly why.',
      COLLAB,
    ],
    link: { to: 'side-builds', label: SIDE },
    topic: 'CyberBane',
  },
];
