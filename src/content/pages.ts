/**
 * Every page of the browser, in words: what its tab is called, the line that
 * sums it up, and the phrases the voice address bar recognises for it.
 * Facts only from CLAUDE.md section 3.
 */
export const PAGE_IDS = [
  'home',
  'amoghpedia',
  'story',
  'work',
  'ask',
  'shorts',
  'side-builds',
  'control',
  'web',
] as const;

export type PageId = (typeof PAGE_IDS)[number];

export type PageCopy = {
  title: string;
  /** For tight spots like the phone's bottom bar. */
  short?: string;
  blurb: string;
  /** Lower case. Longer phrases win, so "client work" beats "work". */
  aliases: readonly string[];
};

export const PAGES: Record<PageId, PageCopy> = {
  home: {
    title: 'New Tab',
    short: 'Home',
    blurb: 'Start here.',
    aliases: ['home', 'home page', 'new tab', 'start page', 'lyric stage', 'speed dial'],
  },
  amoghpedia: {
    title: 'Amoghpedia',
    blurb: 'The encyclopedia entry nobody asked for.',
    aliases: ['amoghpedia', 'amogh pedia', 'wiki', 'wikipedia', 'encyclopedia', 'about', 'about amogh', 'about you', 'bio', 'biography'],
  },
  story: {
    title: 'The Story',
    blurb: 'From picking freedom to building systems, one scroll at a time.',
    aliases: ['story', 'your story', 'life story', 'journey', 'how it started', 'background'],
  },
  work: {
    title: 'Client Work',
    blurb: 'Case studies: Vera ERP, HRMS, Secant, Hazen Lights and more.',
    aliases: ['client work', 'clients', 'client', 'work', 'case studies', 'case study', 'portfolio', 'vera', 'vera erp', 'erp', 'hrms', 'secant', 'hazen', 'hazen lights', 'websites', 'nova', 'nova erp', 'nova crm', 'nova hrms', 'crm'],
  },
  ask: {
    title: 'Ask Amogh',
    blurb: 'Chat with my AI twin. It is an AI, not me.',
    aliases: ['ask amogh', 'ask', 'ai twin', 'twin', 'chat', 'chatbot', 'talk to amogh', 'talk to you'],
  },
  shorts: {
    title: 'Shorts',
    blurb: 'Project videos, one swipe at a time.',
    aliases: ['shorts', 'short', 'videos', 'video', 'reels', 'clips'],
  },
  'side-builds': {
    title: 'Side Builds',
    blurb: 'TrueCommit, Throttle, Avika, CropRadar and more.',
    aliases: ['side builds', 'side build', 'side projects', 'side project', 'projects', 'builds', 'truecommit', 'true commit', 'promise keeper', 'throttle', 'avika', 'cropradar', 'crop radar', 'trading engine', 'leadscope', 'lead scope'],
  },
  web: {
    title: 'Live site',
    blurb: 'A live site, opened inside Navigator.',
    aliases: [],
  },
  control: {
    title: 'Amogh Control',
    blurb: 'The numbers, as gauges.',
    aliases: ['amogh control', 'control', 'control panel', 'dashboard', 'stats', 'gauges', 'numbers'],
  },
};
