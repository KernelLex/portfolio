import { BROWSER_NAME } from '../config';
import type { Place } from '../tour/guide';
import type { PageId } from './pages';

/** Byte, the guide bot: it asks how the visitor wants to go, then tours or tips. */
export const GUIDE = {
  name: 'Byte',
  label: 'Byte, your guide',
  choose: {
    text: "Hey, I'm Byte. Want me to walk you through Amogh's world, or would you rather explore it yourself?",
    tour: 'Take the tour',
    explore: 'Explore on my own',
  },
  shortcut: 'Ctrl+B',
  shortcutHint: 'Ctrl+B starts the walkthrough any time. Esc stops it.',
  gotIt: 'Got it',
  startTour: 'Walk me through it',
  exitTour: 'Stop the tour',
  next: 'Next',
  reopen: 'Ask Byte for help',
} as const;

/** Exploring: one tip per place, shown the first time the visitor gets there. */
export const TIPS: Record<Place, { keys: string; touch: string } | null> = {
  street: {
    keys: 'Hold → to walk and Space to jump. Grab the voice notes, then head into the cyber cafe at the end of the street.',
    touch: 'Hold the screen to walk and tap to jump. Grab the voice notes, then head into the cyber cafe at the end of the street.',
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
    keys: 'Every tab is a part of his story. Pick one from the sidebar, or tell the address bar where to go, like "open client work".',
    touch: 'Every tab is a part of his story. Pick one from the bar at the bottom.',
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
    { page: 'amoghpedia', text: 'His profile, game style: stats, skills and achievements at a glance.' },
    { page: 'shorts', text: 'Shorts: quick videos of what he has built. Swipe through them.' },
    { page: 'ask', text: 'Ask Amogh: questions go to his AI twin, which answers from what he told it.' },
    { page: 'home', text: "That's the tour. Explore anything you like, and press Ctrl+B to see it again." },
  ] satisfies { page: PageId; text: string }[],
} as const;

export const tourLines = (place: Place): readonly string[] =>
  place === 'browser' ? TOUR.browser.map((s) => s.text) : place === 'street' || place === 'cafe' || place === 'desktop' ? TOUR[place] : [];
