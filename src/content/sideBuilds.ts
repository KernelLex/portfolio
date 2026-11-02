import { CLIPS, LIVE, PROFILES, type Clip, type LiveSite } from './links';

/** Side Builds: what Amogh builds to learn, to fix his own problems, or for fun. Facts from CLAUDE.md 3. */
export type SideBuild = {
  name: string;
  hook: string;
  detail: string;
  stack: readonly string[];
  live?: LiveSite;
  /** A number worth showing, only where one is on record. */
  stat?: { value: string; label: string };
  /** Its short, in the Shorts feed. */
  short?: { id: string; clip: Clip };
};

export const SIDE_BUILDS_PAGE = {
  eyebrow: 'amogh://side-builds',
  title: 'Side Builds',
  lead: 'Small projects, built to learn, to solve my own problems, or just for fun.',
  github: PROFILES.github,
  githubLabel: 'More on GitHub',
  watch: 'Watch the short',
  ask: (name: string) => `Tell me about ${name}`,
  askButton: 'Ask about this',
} as const;

export const SIDE_BUILDS: ReadonlyArray<SideBuild> = [
  {
    name: 'Metakai',
    hook: 'Build the body you want: a fitness app for every goal, from cutting to running. A collaboration with Thushaar Rangan.',
    detail: 'Calories from your own kitchen, every set and PR, GPS runs, watch sync and a physique pass. No ads, no account, and your data stays on your phone.',
    stack: ['Mobile app', 'Fitness', 'On-device data'],
    short: { id: 'metakai', clip: CLIPS.metakai },
  },
  {
    name: 'CyberBane',
    hook: 'A reputation overhaul for Cyberpunk 2077: Night City remembers what you do. A collaboration with Thushaar Rangan.',
    detail: 'The street reacts to how you work, rivals come back harder, and one screen shows exactly why.',
    stack: ['Game mod', 'Cyberpunk 2077'],
    short: { id: 'cyberbane', clip: CLIPS.cyberbane },
  },
  {
    name: 'TrueCommit',
    hook: 'A bounded autonomous revenue-recovery agent. The LLM sees and speaks but never spends.',
    detail: 'Built for the Razorpay AI Buildathon 2026 (Track 03): seven agents, a hash-chained ledger and a 20-rule gate. Five real Razorpay invoices, all paid.',
    stack: ['Agents', 'Razorpay', 'Hash-chained ledger'],
    live: LIVE.truecommit,
    stat: { value: '₹2,15,867', label: 'captured' },
  },
  {
    name: 'Promise Keeper',
    hook: 'The earlier, measured version of the idea.',
    detail: 'Measured promise extraction at 88.6%, with 721 tests and honest labels on what was simulated and what was real.',
    stack: ['NLP', 'Testing'],
    stat: { value: '88.6%', label: 'promise extraction' },
  },
  {
    name: 'Throttle',
    hook: 'A production email scheduler that loses nothing across restarts.',
    detail: 'Redis Lua rate limiting and a circuit breaker proven in a real SMTP outage.',
    stack: ['Redis', 'Lua', 'Queues'],
    live: LIVE.throttle,
  },
  {
    name: 'Avika',
    hook: 'A free offline Android app for Bengaluru parents of children with disabilities.',
    detail: 'Clinics, sensory-friendly venues, schemes and UDID, in one place. No account, no ads, no analytics.',
    stack: ['Android', 'Offline-first'],
  },
  {
    name: 'CropRadar',
    hook: 'A Telegram bot that gives farmers crop-disease risk.',
    detail: 'Diagnoses leaf photos, in English and Kannada.',
    stack: ['Telegram bot', 'Vision', 'Kannada'],
  },
  {
    name: 'Trading Strategy Engine',
    hook: 'From prices, news, macro data and Reddit to tested trading hypotheses.',
    detail: 'FinBERT sentiment, LLM-generated hypotheses, and backtests explained with SHAP.',
    stack: ['FinBERT', 'LLMs', 'Backtesting', 'SHAP'],
  },
  {
    name: 'LeadScope',
    hook: 'An ethical B2B prospect research dashboard.',
    detail: 'Research on companies and prospects, built to stay on the right side of privacy.',
    stack: ['Dashboard', 'Research'],
  },
];
