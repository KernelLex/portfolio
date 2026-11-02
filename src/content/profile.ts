import { PROFILES } from './links';
import type { PageId } from './pages';
import { SIDE_BUILDS } from './sideBuilds';
import { CLIENT_WORK, NOVA_PRODUCTS } from './work';

/**
 * The Player Profile: Amogh as a game character sheet, so nobody has to read
 * a résumé. Facts only from CLAUDE.md section 3 and his life story; counts are
 * taken from the site's own content.
 */
export const PROFILE = {
  views: { profile: 'Profile', wiki: 'Wiki' },
  viewsLabel: 'How to read this page',
  name: 'AMOGH P',
  handle: 'KernelLex',
  className: 'Full-stack & systems engineer',
  tagline: 'Builds software that holds when something breaks.',
  base: 'Bengaluru, India',
  party: 'Party of 2: him and a friend',
  status: 'Open to full-time and freelance work',
  languages: ['English', 'Kannada', 'Hindi', 'Telugu', 'Tamil'],
  links: [PROFILES.github, PROFILES.linkedin],
  headings: {
    stats: 'Stats',
    loadout: 'Loadout',
    achievements: 'Achievements',
    quests: 'Quest log',
    inventory: 'Inventory',
    languages: 'Languages',
  },
  questHint: 'Click a quest to open it',
} as const;

export const STATS: ReadonlyArray<{ label: string; value: number }> = [
  { label: 'Client projects', value: CLIENT_WORK.length },
  { label: 'Products shipped', value: NOVA_PRODUCTS.length },
  { label: 'Side builds', value: SIDE_BUILDS.length },
  { label: 'Roles before graduating', value: 7 },
  { label: 'Languages', value: 5 },
];

export const LOADOUT: ReadonlyArray<{ slot: string; items: readonly string[] }> = [
  { slot: 'Frontend', items: ['React', 'TypeScript', 'Tailwind', 'Next.js', 'Three.js', 'GSAP'] },
  { slot: 'Systems', items: ['ERPNext v15', 'Frappe HRMS', 'Drizzle', 'libSQL', 'Redis + Lua', 'Tally sync'] },
  { slot: 'AI', items: ['Local LLMs (Ollama)', 'Bounded agents', 'FinBERT', 'SHAP', 'YOLOv5'] },
  { slot: 'Infra', items: ['Bare-metal Ubuntu', 'nginx', 'Cloudflare Tunnel', 'Home server'] },
];

export type Achievement = { title: string; detail: string; rare?: boolean };

export const ACHIEVEMENTS: ReadonlyArray<Achievement> = [
  { title: 'Persistence', detail: 'Six months of zero clients, then the first yes.', rare: true },
  { title: '₹2,15,867 recovered', detail: 'TrueCommit, on five real Razorpay invoices, all paid.', rare: true },
  { title: 'National top 10', detail: 'Top 10 at multiple national-level hackathons.' },
  { title: 'Seven roles', detail: 'Seven roles before graduating.' },
  { title: 'No AI slop', detail: 'Custom 3D for every client site.' },
  { title: 'One place', detail: 'An ERP for a whole group of companies, with a private AI.' },
  { title: 'Polyglot', detail: 'Speaks five languages.' },
  { title: 'Voice-built', detail: 'Built this site by speaking every prompt.' },
];

export type Quest = { title: string; detail: string; to?: PageId | `work/${string}`; when?: string };

export const QUESTS: ReadonlyArray<Quest> = [
  { title: 'Picked freedom', detail: 'B.Sc. (Hons) Data Science at RV University, to explore.', to: 'story', when: '2023' },
  { title: 'Into the field', detail: 'Stopped waiting after year one and went out to build.', to: 'story' },
  { title: 'Six months, zero', detail: 'Websites with a friend. Not one client, for six months.', to: 'story' },
  { title: 'First client', detail: 'Secant: a 3D interactive site for an architecture firm.', to: 'work/secant' },
  { title: 'No AI slop', detail: 'Hazen Lights: custom 3D, one of a kind.', to: 'work/hazen' },
  { title: 'The pivot', detail: 'Vera ERP: one system for a group of companies.', to: 'work/vera-erp' },
  { title: 'HRMS', detail: "An HR module plugged into a client's own ERP.", to: 'work/hrms' },
  { title: 'Buildathon', detail: 'TrueCommit at the Razorpay AI Buildathon.', to: 'side-builds', when: '2026' },
  { title: 'Still building', detail: 'Nova, side builds, and this site.', to: 'work' },
];

export const INVENTORY: ReadonlyArray<{ item: string; use: string }> = [
  { item: 'Zerodha Kite', use: 'Trading, still learning stop-losses and GTT orders' },
  { item: 'Bambu Lab P1S', use: '3D printing' },
  { item: 'Home server', use: 'Runs his own' },
  { item: 'Jewellery idea', use: 'A side business in waiting' },
];
