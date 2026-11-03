import { BROWSER_NAME } from '../config';
import type { Place } from '../tour/guide';
import type { PageId } from './pages';

/** Byte, the guide bot: it walks the visitor through, or tips those exploring. */
export const GUIDE = {
  name: 'Byte',
  label: 'Byte, your guide',
  shortcut: 'Ctrl+B',
  shortcutHint: 'Ctrl+B starts the walkthrough any time. Esc stops it.',
  gotIt: 'Got it',
  startTour: 'Walk me through it',
  exitTour: 'Stop the tour',
  next: 'Next',
  reopen: 'Ask Byte for help',
  drag: 'Drag me anywhere',
  hi: (name: string) => `Hi ${name}!`,
  clickMe: 'Click me for help',
  tapMe: 'Tap me for help',
  askLabel: 'Ask Byte where something is',
  askPlaceholder: 'Where is his résumé?',
  askSend: 'Ask',
  list: 'What can I ask?',
  hideList: 'Hide the list',
  groups: { places: 'Places', work: 'Client work', actions: 'Things I can do' },
  listTwin: 'Anything else about Amogh goes to his AI twin.',
} as const;

/**
 * Byte's answers to "where is...?". It knows the site, not Amogh's life, so
 * anything else goes to his AI twin. `going` names the page and its address
 * before taking the visitor there.
 */
export const BYTE_ANSWERS = {
  going: (title: string, address: string, blurb: string) => `Found it: ${title}, at ${address}. ${blurb} Taking you there.`,
  caseStudy: (name: string, address: string) => `${name} has its own case study in Client Work, at ${address}. Taking you there.`,
  toTwin: (address: string) => `I know my way around, not his whole life. His AI twin can answer that, so I'm passing your question to Ask Amogh, at ${address}.`,
  tour: 'Starting the walkthrough from right here.',
  fullscreen: 'Done: full screen toggled. Esc leaves it.',
  me: "I'm Byte, the guide. Ask me where anything is and I'll take you there, or press Ctrl+B for the walkthrough.",
  inside: (address: string) => `Straight into his browser, ${BROWSER_NAME}, at ${address}.`,
  contact: (address: string) => `His LinkedIn and GitHub are on the Player Profile, at ${address}. Taking you there.`,
  help: 'Here is everywhere I can take you. Tap one, or ask in your own words.',
  download: 'Downloading his résumé (PDF) now. It is also a click away in the Terminal on his PC, and on the Player Profile.',
  notHere: 'Those controls are for the street and the cafe. In here, just ask me where to go.',
} as const;

/** What a question can lead to: a page, a case study, or something Byte does itself. */
export type ByteTarget =
  | { kind: 'page'; page: PageId }
  | { kind: 'study'; slug: string }
  | { kind: 'contact' | 'download' | 'tour' | 'fullscreen' | 'browser' | 'me' | 'help' | 'controls' };

export type ByteEntry = {
  target: ByteTarget;
  group: keyof typeof GUIDE.groups;
  /** In Byte's list. Case studies take their name from Client Work. */
  label?: string;
  /** A question that works: shown in the list, and asked when tapped. */
  example: string;
  /** Words and phrases that point here on their own. Lower case. */
  strong: readonly string[];
  /** Words that only point here alongside "where", "open", "show"... */
  weak?: readonly string[];
};

/**
 * Everywhere Byte can take a visitor, and what it listens for. Matching is
 * forgiving: plurals, small typos and any word order still land, so these
 * lists hold meanings rather than every phrasing. Earlier entries win ties.
 */
export const BYTE_PLACES: ReadonlyArray<ByteEntry> = [
  {
    target: { kind: 'page', page: 'amoghpedia' },
    group: 'places',
    label: 'Player Profile (his résumé)',
    example: "Where's his résumé?",
    strong: ['resume', 'cv', 'profile', 'player profile', 'amoghpedia', 'wiki', 'wikipedia', 'bio', 'biography', 'about him', 'about amogh', 'who is amogh', 'who is he', 'skills', 'achievements', 'education', 'qualifications', 'experience', 'internships', 'tech stack', 'loadout'],
    weak: ['about', 'stack', 'tech', 'languages', 'college', 'degree', 'quests', 'stats', 'roles'],
  },
  {
    target: { kind: 'contact' },
    group: 'places',
    label: 'Contact (LinkedIn, GitHub)',
    example: 'How do I contact him?',
    strong: ['contact', 'email', 'reach him', 'reach out', 'get in touch', 'hire', 'hiring', 'linkedin', 'linked in', 'github', 'socials', 'connect with'],
    weak: ['reach', 'mail', 'social', 'connect'],
  },
  {
    target: { kind: 'page', page: 'story' },
    group: 'places',
    label: 'The Story',
    example: 'Tell me his story',
    strong: ['story', 'journey', 'life story', 'how it started', 'how he started', 'how did he start', 'background', 'timeline', 'history', 'origin', 'zero clients', 'biking club', 'biking', 'bike club', 'club app', 'campus', 'clubs', 'events he hosted', 'outreach'],
    weak: ['began', 'beginning', 'chapters', 'mission', 'path', 'events', 'club', 'rvu', 'marketing'],
  },
  {
    target: { kind: 'page', page: 'work' },
    group: 'places',
    label: 'Client Work',
    example: 'Show me his client work',
    strong: ['client work', 'clients', 'case studies', 'work', 'portfolio', 'freelance', 'freelancing', 'nova', 'products'],
    weak: ['business', 'companies', 'company', 'customers', 'websites', 'live sites', 'erp'],
  },
  {
    target: { kind: 'page', page: 'side-builds' },
    group: 'places',
    label: 'Side Builds',
    example: 'Where are his side projects?',
    strong: ['side builds', 'side projects', 'projects', 'builds', 'hackathons', 'buildathon', 'truecommit', 'true commit', 'throttle', 'avika', 'cropradar', 'crop radar', 'leadscope', 'lead scope', 'promise keeper', 'metakai', 'cyberbane', 'razorpay', 'trading engine'],
    weak: ['built', 'made', 'apps', 'tools', 'experiments'],
  },
  {
    target: { kind: 'page', page: 'videos' },
    group: 'places',
    label: 'Videos',
    example: 'Show me the videos',
    strong: ['videos', 'youtube', 'walkthrough video', 'shorts', 'reels', 'clips', 'demos', 'watch'],
    weak: ['film', 'youtube', 'recording', 'footage'],
  },
  {
    target: { kind: 'page', page: 'ask' },
    group: 'places',
    label: 'Ask Amogh (AI twin)',
    example: 'I want to chat with his AI twin',
    strong: ['ask amogh', 'ai twin', 'twin', 'chat', 'chatbot', 'talk to amogh', 'talk to him', 'ask him', 'ask a question'],
    weak: ['ask', 'talk', 'questions', 'ai', 'conversation'],
  },
  {
    target: { kind: 'page', page: 'control' },
    group: 'places',
    label: 'Amogh Control (the numbers)',
    example: 'Open the dashboard',
    strong: ['amogh control', 'control', 'control panel', 'dashboard', 'gauges', 'numbers', 'metrics', 'wpm', 'words per minute', 'typing speed', 'voice speed', 'speed test'],
    weak: ['stats', 'speed', 'how many', 'count'],
  },
  {
    target: { kind: 'page', page: 'home' },
    group: 'places',
    label: 'New Tab (the lyric stage)',
    example: 'Take me home',
    strong: ['home', 'new tab', 'start page', 'homepage', 'lyric stage', 'lyrics', 'kinetic', 'speed dial', 'main page'],
    weak: ['stage', 'typography', 'start'],
  },
  { target: { kind: 'study', slug: 'vera-erp' }, group: 'work', example: 'Show me Vera ERP', strong: ['vera', 'vera erp', 'vera enterprises', 'schones leben', 'hagan modular'], weak: ['erp', 'director', 'ollama'] },
  { target: { kind: 'study', slug: 'hrms' }, group: 'work', example: 'Where is the HRMS?', strong: ['hrms', 'hrms module', 'hr module', 'hr system', 'hr software', 'payroll', 'form 16'], weak: ['hr', 'leave'] },
  { target: { kind: 'study', slug: 'secant' }, group: 'work', example: 'Open Secant', strong: ['secant', 'first client'], weak: ['architecture', 'architect'] },
  { target: { kind: 'study', slug: 'hazen' }, group: 'work', example: 'Show me Hazen Lights', strong: ['hazen', 'hazen lights', 'hazenlights'], weak: ['lighting', 'lights', 'ecommerce'] },
  { target: { kind: 'study', slug: 'iiwm' }, group: 'work', example: 'Where is IIWM?', strong: ['iiwm', 'wedding school', 'business school'], weak: ['wedding'] },
  { target: { kind: 'study', slug: 'bogen-villa' }, group: 'work', example: 'Open Bogen Villa', strong: ['bogen', 'bogen villa', 'villa', 'venue'], weak: ['wedding'] },
  { target: { kind: 'study', slug: 'nova-erp' }, group: 'work', example: 'Show me Nova ERP', strong: ['nova erp'] },
  { target: { kind: 'study', slug: 'nova-crm' }, group: 'work', example: 'Show me Nova CRM', strong: ['crm', 'nova crm', 'sales pipeline'] },
  { target: { kind: 'study', slug: 'nova-hrms' }, group: 'work', example: 'Show me Nova HRMS', strong: ['nova hrms'] },
  { target: { kind: 'download' }, group: 'actions', label: 'Download his résumé (PDF)', example: 'Download his résumé', strong: ['download resume', 'download cv', 'download his resume', 'resume pdf', 'cv pdf', 'pdf'], weak: ['download'] },
  { target: { kind: 'tour' }, group: 'actions', label: 'Start the walkthrough', example: 'Give me the tour', strong: ['tour', 'walkthrough', 'walk through', 'walk me through', 'guide me', 'show me around', 'guided tour'] },
  { target: { kind: 'browser' }, group: 'actions', label: 'Skip to his browser', example: 'Skip to the browser', strong: ['browser', 'navigator', 'skip', 'skip intro', 'skip the game', 'pc'], weak: ['computer', 'desktop'] },
  { target: { kind: 'fullscreen' }, group: 'actions', label: 'Full screen on or off', example: 'Full screen', strong: ['full screen', 'fullscreen', 'maximise', 'maximize'], weak: ['bigger'] },
  { target: { kind: 'controls' }, group: 'actions', label: 'How to play', example: 'How do I play?', strong: ['controls', 'how to play', 'how do i play', 'how do i walk', 'how do i move', 'how do i jump', 'jump', 'sit down', 'jack in'], weak: ['walk', 'move', 'play'] },
  { target: { kind: 'me' }, group: 'actions', label: 'Who Byte is', example: 'Who are you?', strong: ['who are you', 'what are you', 'your name', 'byte', 'who is byte'] },
  { target: { kind: 'help' }, group: 'actions', label: 'This list', example: 'What can I ask?', strong: ['help', 'commands', 'what can you do', 'what can i ask', 'what can i say', 'options', 'list'] },
];

/** Words that mean "take me somewhere", which let a weak match count. Lower case. */
export const BYTE_NAVIGATE = ['where', 'wheres', 'open', 'show', 'take', 'go', 'find', 'see', 'navigate', 'bring', 'visit', 'view', 'look', 'page', 'tab', 'section', 'link'] as const;

/** Exploring: one tip per place, shown the first time the visitor gets there. */
export const TIPS: Record<Place, { keys: string; touch: string } | null> = {
  title: null,
  street: {
    keys: 'Hold → to walk and Space to jump. Grab the voice notes, then head into the cyber cafe at the end of the street. Ask me where anything is, and drag me anywhere.',
    touch: 'Hold the screen to walk and tap to jump. Grab the voice notes, then head into the cyber cafe at the end of the street. Ask me where anything is.',
  },
  cafe: {
    keys: 'Walk to seat 3, press ↑ to sit, then ↑ again to jack in.',
    touch: 'Walk to seat 3 and tap to sit, then tap again to jack in.',
  },
  link: null,
  boot: null,
  desktop: {
    keys: `Amogh's PC. Double-click ${BROWSER_NAME} to open his browser. The Terminal has a Download résumé button, and "help" lists everything it can do.`,
    touch: `Amogh's PC. Tap ${BROWSER_NAME} to open his browser, or the Terminal to download his résumé.`,
  },
  browser: {
    keys: 'Every page is already open as a tab along the top: click one to switch. The sidebar has them too, or ask me where something is, like "where is his résumé?", and I will take you there.',
    touch: 'Every page is already open. Switch with the bar at the bottom, or ask me where something is and I will take you there.',
  },
};

/** The walkthrough's narration. Facts only from CLAUDE.md section 3. */
export const TOUR = {
  street: [
    "This is Amogh's city: loud, neon, never quiet.",
    'The neon signs are his projects. The billboard is Wispr Flow, the tool he built this whole site with, by voice.',
    'His world is inside the cyber cafe at the end of the street. Follow me.',
  ],
  cafe: ['Seat 3 is his. Every other seat is taken.', 'Now the fun part: his wrist plugs straight into the PC.'],
  desktop: [
    'This is KernelLex OS, his PC. The Terminal downloads his résumé, and "help" shows all its tricks.',
    `Everything lives in his browser, ${BROWSER_NAME}. Opening it now.`,
  ],
  browser: [
    { page: 'home', text: 'Every page is already open as a tab. New Tab first: say anything and the stage performs your words as moving type.' },
    { page: 'story', text: 'The Story: from six months of zero clients to systems companies run on. Play through it.' },
    { page: 'work', text: 'Client Work: real businesses and real builds, with live sites you can open right here.' },
    { page: 'amoghpedia', text: 'His Player Profile: stats, loadout, achievements and quests at a glance. The full wiki is one click away.' },
    { page: 'videos', text: 'Videos: walkthroughs of what he has built. Play one, then pick the next from Up next.' },
    { page: 'ask', text: 'Ask Amogh: questions go to his AI twin, which answers from what he told it.' },
    { page: 'home', text: "That's the tour. Ask me where anything is and I'll take you there, or press Ctrl+B to see it again." },
  ] satisfies { page: PageId; text: string }[],
} as const;

export const tourLines = (place: Place): readonly string[] =>
  place === 'browser' ? TOUR.browser.map((s) => s.text) : place === 'street' || place === 'cafe' || place === 'desktop' ? TOUR[place] : [];
