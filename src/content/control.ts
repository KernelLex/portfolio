import { LIVE } from './links';
import { SIDE_BUILDS } from './sideBuilds';
import { CLIENT_WORK, NOVA_PRODUCTS } from './work';

/**
 * Amogh Control: the numbers as gauges, each opening onto what is behind it.
 * Counts come from the site's own content; the rest are facts from CLAUDE.md 3.
 */
export const CONTROL = {
  eyebrow: 'amogh://control',
  title: 'Amogh Control',
  lead: 'The numbers, as gauges. Open any one to see what is behind it.',
  open: 'Open',
  close: 'Close',
  wpmTitle: 'Your voice speed',
  wpmHint: 'Click here, hold your Wispr key and say a sentence.',
  wpmLabel: 'Speak here to test your speed',
  wpmNone: 'Waiting for a voice chunk',
  wpmTyping: 'typing avg 40',
  wpmEstimated: 'estimated from how the text arrived',
} as const;

/** Where an item leads: a tab in Navigator, or a site in a new browser tab. */
export type GaugeItem = { label: string; note?: string; to?: string; href?: string };

export type Gauge = { id: string; label: string; value: number; summary: string; items: GaugeItem[] };

const liveClients = [LIVE.secant, LIVE.hazen, LIVE.vera];

export const GAUGES: ReadonlyArray<Gauge> = [
  {
    id: 'clients',
    label: 'Client projects',
    value: CLIENT_WORK.length,
    summary: 'Real businesses and real builds: websites first, then the systems they run on.',
    items: CLIENT_WORK.map((c) => ({ label: c.name, note: c.kind, to: `work/${c.slug}` })),
  },
  {
    id: 'products',
    label: 'Nova products',
    value: NOVA_PRODUCTS.length,
    summary: 'ERP, CRM and HRMS, built and running, with Thushaar Rangan.',
    items: NOVA_PRODUCTS.map((p) => ({ label: p.name, note: p.hook, to: `work/${p.slug}` })),
  },
  {
    id: 'builds',
    label: 'Side builds',
    value: SIDE_BUILDS.length,
    summary: 'Built to learn, to fix his own problems, or just for fun.',
    items: SIDE_BUILDS.map((b) => ({ label: b.name, note: b.hook.split('. ')[0], to: 'side-builds' })),
  },
  {
    id: 'roles',
    label: 'Roles before graduating',
    value: 7,
    summary: 'Into the field early, instead of waiting. Roles include:',
    items: [
      { label: 'Vera', note: 'Software Developer' },
      { label: 'Freelance', note: 'A two-person team with a friend', to: 'work' },
      { label: 'Gojeta', note: 'Automation' },
      { label: 'RV University', note: 'App development, and YOLOv5 research' },
      { label: 'ChaturManas', note: 'Web' },
      { label: 'Internshub', note: 'AI' },
      { label: 'MasterCom', note: 'Data' },
    ],
  },
  {
    id: 'languages',
    label: 'Languages',
    value: 5,
    summary: 'He speaks all five. Say something on the home page in Hindi or Kannada and watch it perform.',
    items: [
      { label: 'English', note: 'Hello', to: 'home' },
      { label: 'Kannada', note: 'Namaskara', to: 'home' },
      { label: 'Hindi', note: 'Namaste', to: 'home' },
      { label: 'Telugu', note: 'Namaskaram', to: 'home' },
      { label: 'Tamil', note: 'Vanakkam', to: 'home' },
    ],
  },
  {
    id: 'live',
    label: 'Live client sites',
    value: liveClients.length,
    summary: 'Open them right here in Navigator, or in a new tab.',
    items: liveClients.map((site) => ({
      label: site.label,
      note: site.frameable ? 'Opens inside Navigator' : 'Opens in a new tab',
      ...(site.frameable ? { to: `web?url=${encodeURIComponent(site.href)}` } : { href: site.href }),
    })),
  },
];
