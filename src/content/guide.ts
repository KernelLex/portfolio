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
  askLabel: 'Ask Byte where something is',
  askPlaceholder: 'Where is his résumé?',
  askSend: 'Ask',
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
} as const;

/** Phrases Byte acts on itself, before looking for a page. Lower case. */
export const BYTE_TOPICS = {
  tour: ['tour', 'walkthrough', 'walk through', 'walk me through', 'guide me', 'show me around'],
  fullscreen: ['full screen', 'fullscreen'],
  me: ['who are you', 'what are you', 'your name', 'byte'],
  inside: ['browser', 'navigator', 'the computer', 'his computer', 'pc', 'skip', 'skip the game', 'skip the intro'],
  contact: ['contact', 'email', 'reach him', 'reach out', 'hire', 'linkedin', 'github', 'socials'],
  /** How to play: answered with the tip for wherever the visitor is. */
  controls: ['controls', 'how do i play', 'how to play', 'how do i walk', 'how do i move', 'how do i jump', 'jump', 'sit down', 'jack in'],
} as const;

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
    keys: `Amogh's PC. Double-click ${BROWSER_NAME} to open his browser. The terminal knows a few tricks too.`,
    touch: `Amogh's PC. Tap ${BROWSER_NAME} to open his browser.`,
  },
  browser: {
    keys: 'Every tab is a part of his story. Pick one from the sidebar, or ask me where something is, like "where is his résumé?", and I will take you there.',
    touch: 'Every tab is a part of his story. Pick one from the bar at the bottom, or ask me where something is and I will take you there.',
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
    'This is KernelLex OS, his PC. The terminal has a few tricks; try neofetch later.',
    `Everything lives in his browser, ${BROWSER_NAME}. Opening it now.`,
  ],
  browser: [
    { page: 'home', text: 'New Tab: say anything and the stage performs your words as moving type.' },
    { page: 'story', text: 'The Story: from six months of zero clients to systems companies run on. Play through it.' },
    { page: 'work', text: 'Client Work: real businesses and real builds, with live sites you can open right here.' },
    { page: 'amoghpedia', text: 'His Player Profile: stats, loadout, achievements and quests at a glance. The full wiki is one click away.' },
    { page: 'shorts', text: 'Shorts: quick videos of what he has built. Swipe through them.' },
    { page: 'ask', text: 'Ask Amogh: questions go to his AI twin, which answers from what he told it.' },
    { page: 'home', text: "That's the tour. Ask me where anything is and I'll take you there, or press Ctrl+B to see it again." },
  ] satisfies { page: PageId; text: string }[],
} as const;

export const tourLines = (place: Place): readonly string[] =>
  place === 'browser' ? TOUR.browser.map((s) => s.text) : place === 'street' || place === 'cafe' || place === 'desktop' ? TOUR[place] : [];
