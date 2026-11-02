import { BROWSER_NAME } from '../config';

/** Words in the browser's own chrome: buttons, menus, the address bar. */
export const CHROME = {
  pages: 'Pages',
  tabs: 'Open tabs',
  newTab: 'New tab',
  closeTab: (title: string) => `Close ${title}`,
  back: 'Back',
  forward: 'Forward',
  reload: 'Reload',
  minimise: 'Minimise',
  close: 'Close',
  tips: 'Show the tips',
  settings: 'Settings',
  more: 'More',
  tabCount: (n: number) => `${n} open tab${n === 1 ? '' : 's'}`,
  loading: 'Loading',
} as const;

export const ADDRESS = {
  label: 'Address bar: type or say where to go',
  placeholder: 'Say or type where to go',
  hint: 'Hold your Wispr key and say where to go, like "open client work".',
  wispr: 'Wispr-ready: hold your Wispr key and talk',
  go: (title: string) => `Go to ${title}`,
  ask: 'Ask Amogh',
  voice: 'Voice input detected',
  /** Shown beside the detector, which only sees how the text arrived. */
  voiceNote: 'a guess from how fast the text arrived',
} as const;

/** The thin status line along the bottom of the browser, on wider screens. */
export const STATUS = {
  link: 'Link stable',
  tabs: (n: number, max: number) => `Tabs ${n}/${max}`,
  private: 'No trackers',
} as const;

export const SETTINGS = {
  pixelOn: 'Pixel skin: on',
  pixelOff: 'Pixel skin: off',
  replay: 'Replay the intro',
  closeAll: 'Close all tabs',
  privacy: 'No trackers, no analytics. Sound stays off until you turn it on.',
} as const;

/** Embedded media and the in-browser site viewer. */
export const MEDIA = {
  play: (title: string) => `Play ${title}`,
  openHere: 'Open in Navigator',
  liveSite: 'Live site, shown inside Navigator',
  newTab: 'Open in a new tab',
  notAllowed: 'Navigator only opens the sites linked from this portfolio.',
} as const;

export const UNDER_CONSTRUCTION = {
  badge: '🚧 Under construction',
  note: `This tab is still being built, by voice, like the rest of ${BROWSER_NAME}.`,
  asked: 'You asked',
  askNote: 'Ask Amogh will answer this once it is live.',
  back: 'Back to New Tab',
} as const;
