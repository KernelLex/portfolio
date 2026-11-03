/**
 * The Story, played rather than read: each chapter of Amogh's arc (CLAUDE.md 3)
 * has one small thing to do. College is framed as ownership, never blame.
 *
 * TODO(Amogh): a chapter for a mistake you made and its lesson goes between
 * "weddings" and "pivot" once you send it.
 */
export type Widget = 'fork' | 'classroom' | 'campus' | 'pitch' | 'wireframe' | 'spotlight' | 'cards' | 'merge' | 'hub' | 'plug' | 'why' | 'end';

export type Chapter = {
  id: string;
  title: string;
  body: string;
  /** What to do, shown as the chapter's objective. */
  objective: string;
  /** Shown once the objective is done. */
  done: string;
  /** Exactly what to do with the piece, for anyone unsure how to play. */
  how: string;
  widget: Widget;
};

export const STORY = {
  eyebrow: 'amogh://story',
  title: 'The Story',
  lead: 'Played, not read. Twelve chapters, one small thing to do in each.',
  objective: 'Objective',
  complete: 'Complete',
  next: 'Next chapter',
  previous: 'Previous',
  skip: 'Skip',
  chapter: (n: number, total: number) => `Chapter ${String(n).padStart(2, '0')} / ${String(total).padStart(2, '0')}`,
  keys: '← → to move between chapters',
  ctaWork: 'See the work',
  ctaAsk: 'Ask me anything',
  yourMove: 'Your move',
  doneHint: 'Press "Next chapter" or → to continue.',
  /** Shown above the first chapter until dismissed. */
  coach: {
    title: 'How to play the Story',
    steps: [
      'Each chapter has one small thing to do, in the panel on the right (below the text on a phone).',
      'Do it, and "Next chapter" unlocks. The ← → keys move between chapters too.',
      'Stuck on one? "Skip" counts it as done.',
    ],
    dismiss: 'Got it',
  },
} as const;

/** Words inside the interactive pieces. */
export const PIECES = {
  fork: { engineering: 'Engineering', bsc: 'B.Sc. Data Science', notThis: 'Not for me: I wanted room to explore.' },
  classroom: { button: 'Stop waiting' },
  campus: {
    steps: [
      { act: 'Host an event', result: 'Hosted events at RV University' },
      { act: 'Start a club', result: 'Started my own biking club' },
      { act: 'Fix the mess', result: 'Built a club and event app' },
    ],
    app: 'Club app',
    features: ['Events', 'QR check-in', 'Join a club', 'Approvals', 'Attendance'],
    paused: 'Paused: funding',
  },
  pitch: { button: 'Send a pitch', rejected: 'No', month: (n: number) => `Month ${n}`, yes: 'Secant said yes.' },
  wireframe: { hint: 'Drag, or use ← →', label: 'Secant' },
  spotlight: { hidden: 'No AI slop. Every site one of a kind.', label: 'Hazen Lights', hint: 'Move your pointer, or tap around' },
  cards: { faces: ['IIWM', 'Bogen Villa', 'A few lost clients'], back: 'Flip' },
  merge: { panels: ['HR', 'Sales', 'Projects', 'Purchase', 'Logistics', 'Finance'], hub: 'Vera ERP' },
  hub: { centre: 'Vera ERP', companies: ['Vera Enterprises', 'Schönes Leben', 'Hagan Modular'], ai: 'Private AI, on their own server' },
  plug: { module: 'HR module', erp: "Client's ERP", hint: 'Drag the plug into the socket', joined: 'Linked both ways. No credentials crossed the wire.' },
  why: ['Understand industries', 'Find what I love', 'Get better every day'],
  end: 'still building',
} as const;

export const CHAPTERS: ReadonlyArray<Chapter> = [
  {
    id: 'freedom',
    title: 'I picked freedom.',
    body: 'Engineering looked like a corridor. I wanted room to explore, and to build things that make life easier for me and for other people.',
    objective: 'Choose a path',
    done: 'B.Sc. it is.',
    how: 'Click the B.Sc. door on the right. The engineering one is locked.',
    widget: 'fork',
  },
  {
    id: 'quiet',
    title: 'Then the classroom got quiet.',
    body: 'After the first year the curriculum thinned out. I could wait for it to pick up, or take it into my own hands.',
    objective: 'Stop waiting',
    done: 'Out into the field, early.',
    how: 'Press "Stop waiting" and watch one desk leave the room.',
    widget: 'classroom',
  },
  {
    id: 'campus',
    title: 'Meanwhile, on campus.',
    body: 'I hosted events at RV University and started my own biking club. Getting people to show up is outreach, and I am into it. Running clubs showed me how messy club and event management was, so I built an app for it. It stopped when the funding did, but the habit stuck: get into things, bring people in, fix what is broken.',
    objective: 'Host, start, build',
    done: 'Outreach, and a problem worth solving.',
    how: 'Click the three steps in order, starting at the top.',
    widget: 'campus',
  },
  {
    id: 'zero',
    title: 'Six months. Zero clients.',
    body: 'A friend and I started with websites, because it looked like an easy market. It was not.',
    objective: 'Keep pitching',
    done: 'Six months of no. Then one yes.',
    how: 'Press "Send a pitch" once for each month, until month six.',
    widget: 'pitch',
  },
  {
    id: 'secant',
    title: 'Then: one yes.',
    body: 'Secant, an architecture firm, became our first client. We built them a 3D interactive website.',
    objective: 'Look around the building',
    done: 'First client, first 3D site.',
    how: 'Drag across the building to turn it, or use the ← → keys.',
    widget: 'wireframe',
  },
  {
    id: 'hazen',
    title: 'One yes became another.',
    body: 'Secant led to Hazen Lights, an architectural lighting company. I refused to make another generic site.',
    objective: 'Find what is hiding in the dark',
    done: 'Custom 3D, one of a kind.',
    how: 'Move your pointer, or your finger, around the dark box until the hidden line shows.',
    widget: 'spotlight',
  },
  {
    id: 'weddings',
    title: 'Weddings, venues, and a few lost clients.',
    body: 'A wedding business came next: its business school and its venue. Not every client stayed.',
    objective: 'Flip all three',
    done: 'Wins, and a few losses.',
    how: 'Click all three cards to flip them over.',
    widget: 'cards',
  },
  {
    id: 'pivot',
    title: 'The pivot.',
    body: 'Inside one client company I met a director struggling to see across the several companies he ran. Everything lived in different places.',
    objective: 'Bring it all into one place',
    done: 'One system instead of six.',
    how: 'Click each of the six scattered boxes to pull it into Vera ERP.',
    widget: 'merge',
  },
  {
    id: 'vera',
    title: 'Vera ERP.',
    body: 'One place for every company in the group, live data for the director, and a private AI that never leaves their server.',
    objective: 'Connect the three companies',
    done: 'One ERP, three companies.',
    how: 'Click each of the three companies to connect it to the centre.',
    widget: 'hub',
  },
  {
    id: 'hrms',
    title: 'Then HRMS.',
    body: 'Another client sells his own ERP to companies without HR. He wanted an HR module linked into it, without sending credentials over APIs.',
    objective: 'Plug the HR module in',
    done: 'Built and delivered.',
    how: 'Drag the plug across and drop it into the socket.',
    widget: 'plug',
  },
  {
    id: 'why',
    title: 'Why I do this.',
    body: "It isn't only for clients.",
    objective: 'Light all three',
    done: 'That is the why.',
    how: 'Click each of the three reasons to light it up.',
    widget: 'why',
  },
  {
    id: 'still',
    title: 'Still building.',
    body: 'Side builds to learn, to fix my own problems, or just for fun. This site is one of them, and I built it by voice.',
    objective: 'Keep going',
    done: 'To be continued.',
    how: 'Nothing to do here: just watch it type.',
    widget: 'end',
  },
];
