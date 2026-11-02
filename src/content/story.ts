/**
 * The Story: Amogh's arc as scroll-through scenes (CLAUDE.md 3). College is
 * framed as ownership, never blame. A scene's `audio` is his recorded line,
 * e.g. 'audio/story/scene-01.mp3'; until any exist, the voice toggle stays hidden.
 *
 * TODO(Amogh): a scene for a mistake you made and its lesson goes between
 * "weddings" and "pivot" once you send it.
 */
export type SceneVisual =
  | 'paths'
  | 'classroom'
  | 'zero'
  | 'wireframe'
  | 'beams'
  | 'weddings'
  | 'merge'
  | 'hub'
  | 'link'
  | 'why'
  | 'building';

export type StoryScene = {
  id: string;
  title: string;
  body: string;
  visual: SceneVisual;
  audio?: string;
};

export const STORY = {
  eyebrow: 'amogh://story',
  title: 'The Story',
  lead: 'How six months of nothing turned into systems that real companies run on. Scroll.',
  voiceOn: 'Playing with my voice',
  voiceOff: 'Play with my voice',
  jumpTo: (title: string) => `Jump to: ${title}`,
  ctaWork: 'See the work',
  ctaAsk: 'Ask me anything',
} as const;

/** Words drawn inside the scene visuals. */
export const VISUAL_TEXT = {
  paths: { closed: 'Engineering', open: 'Freedom to explore' },
  zero: { clients: 'clients', month: (n: number) => `M${n}`, pitch: 'pitch' },
  wireframe: 'Secant',
  beams: 'Hazen Lights',
  weddings: { kept: ['IIWM', 'Bogen Villa'], lost: 'lost' },
  hub: { centre: 'Vera ERP', companies: ['Vera Enterprises', 'Schönes Leben', 'Hagan Modular'], ai: 'AI · stays on the server' },
  link: { left: "Client's ERP", right: 'HR module', note: 'no credentials over APIs' },
  why: ['understand industries', 'find what I love', 'grow'],
  building: 'still building',
} as const;

export const SCENES: ReadonlyArray<StoryScene> = [
  {
    id: 'freedom',
    title: 'I picked freedom.',
    body: 'I chose a B.Sc. over engineering because I wanted room to explore. I love building things that make life easier, for me and for other people, and I wanted to try everything.',
    visual: 'paths',
  },
  {
    id: 'quiet',
    title: 'Then the classroom got quiet.',
    body: "After the first year the curriculum thinned out. Instead of waiting for it to pick up, I took it into my own hands and went into the field early, to build real things and learn how industries actually work.",
    visual: 'classroom',
  },
  {
    id: 'zero',
    title: 'Six months. Zero clients.',
    body: 'A friend and I started with websites, because it looked like an easy market to break into. It was not. For six months we pitched and did not land a single client.',
    visual: 'zero',
  },
  {
    id: 'one-yes',
    title: 'Then: one yes.',
    body: 'Secant, an architecture firm, became our first client. We built them a 3D interactive website.',
    visual: 'wireframe',
  },
  {
    id: 'another',
    title: 'One yes became another.',
    body: 'Secant led to Hazen Lights, an architectural lighting company. No AI slop: we built custom 3D models and made every site one of a kind.',
    visual: 'beams',
  },
  {
    id: 'weddings',
    title: 'Weddings, venues, and a few lost clients.',
    body: 'Then a wedding business: a site for IIWM, its business school, and one for Bogen Villa, its venue. We lost a few clients along the way too.',
    visual: 'weddings',
  },
  {
    id: 'pivot',
    title: 'The pivot.',
    body: 'The goal was never just websites. Talking to people inside one client company, I found a director struggling to see across the several companies he ran.',
    visual: 'merge',
  },
  {
    id: 'vera',
    title: 'Vera ERP.',
    body: 'So we pitched one place for everything: every company, every employee, live data in one system, and a private AI trained on their own data that never leaves their server.',
    visual: 'hub',
  },
  {
    id: 'hrms',
    title: 'Then HRMS.',
    body: 'Another client sells his own ERP to companies without HR. He wanted an HR module linked into it, without sending credentials over APIs. We built it, and the two work together both ways.',
    visual: 'link',
  },
  {
    id: 'why',
    title: 'Why I do this.',
    body: "It isn't only for clients. It's to understand industries in depth, figure out what I actually love, and get better every day.",
    visual: 'why',
  },
  {
    id: 'still',
    title: 'Still building.',
    body: 'Side builds to learn, to fix my own problems, or just for fun. This site is one of them, and I built it by voice.',
    visual: 'building',
  },
];
