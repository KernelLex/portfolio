import { BROWSER_NAME, OS_NAME } from '../config';
import { SEAT_NUMBER } from './intro';

/**
 * Words on the cafe PC. The BIOS lines are props for a fictional machine; the
 * terminal's answers about Amogh are facts from CLAUDE.md section 3.
 */

export const DESKTOP_USER = 'amogh';

export const APP_LABELS = {
  navigator: BROWSER_NAME,
  readme: 'readme.txt',
  terminal: 'Terminal',
  trash: 'Recycle Bin',
} as const;

export function bootLines(notes?: { found: number; total: number }): string[] {
  const seat = String(SEAT_NUMBER).padStart(2, '0');
  const lines = [
    'KernelLex BIOS  -  cyber cafe build',
    `Seat ${seat}`,
    '',
    'Memory check .............. OK',
    'Graphics .................. OK',
    'Network ................... OK',
    'Wrist link ................ CONNECTED',
    'Voice input ............... Wispr ready',
  ];
  if (notes) lines.push(`Voice notes found ......... ${notes.found}/${notes.total}`);
  lines.push('', `Booting ${OS_NAME}`);
  return lines;
}

export const README = [
  "Hi, I'm Amogh.",
  '',
  'This computer is the way in. Everything worth seeing',
  `lives in ${BROWSER_NAME} - open it from the desktop.`,
  '',
  'Built by voice, with Wispr Flow.',
].join('\n');

export const DESKTOP_HINT = {
  mouse: `Double-click ${BROWSER_NAME}`,
  touch: `Tap ${BROWSER_NAME}`,
};

export const TERMINAL = {
  prompt: `${DESKTOP_USER}@kernellex:~$`,
  banner: [
    String.raw` _  __                    _ _`,
    String.raw`| |/ /___ _ _ _ _  ___ __| | |   _____ __`,
    String.raw`| ' </ -_) '_| ' \/ -_) _| | |__/ -_) \ /`,
    String.raw`|_|\_\___|_| |_||_\___|_|_|____\___/_\_\ `,
  ],
  welcome: [`${OS_NAME} terminal.`, 'Type "help" to see what this can do, or try "neofetch".'],
  voiceHint: 'Hold your Wispr key and talk - try "open navigator".',
  help: [
    'help        this list',
    'neofetch    this machine, and who is at it',
    'whoami      who built this',
    'ls          projects on this machine',
    'languages   what I speak',
    'open        open ' + BROWSER_NAME,
    'date        the time here',
    'clear       clear the screen',
  ],
  whoami: [
    'Amogh P - Bengaluru.',
    'Full-stack and systems engineer who builds software',
    'that holds when something breaks.',
  ],
  projects: ['vera-erp/', 'hrms/', 'truecommit/', 'throttle/', 'avika/', 'cropradar/', 'trading-engine/', 'leadscope/'],
  /** ls prints this many to a row, padded into columns. */
  projectColumns: 4,
  languages: 'English  Kannada  Hindi  Telugu  Tamil',
  opening: `Opening ${BROWSER_NAME}...`,
  sudo: 'Nice try.',
  notFound: (cmd: string) => `command not found: ${cmd}. Try "help".`,
};

/** neofetch: the logo beside facts about the seat and the person in it. */
export const NEOFETCH = {
  logo: [
    String.raw`    .-----.    `,
    String.raw`   /  .-.  \   `,
    String.raw`  |  ( o )  |  `,
    String.raw`   \  '-'  /   `,
    String.raw`    '-----'    `,
  ],
  rows: (session: string, display: string): [string, string][] => [
    ['OS', OS_NAME],
    ['Host', `Cyber cafe, seat ${String(SEAT_NUMBER).padStart(2, '0')}`],
    ['Shell', 'voice (Wispr Flow)'],
    ['Session', session],
    ['Display', display],
    ['Languages', 'English, Kannada, Hindi, Telugu, Tamil'],
    ['Builds', 'Vera ERP, Nova, TrueCommit, Throttle, Avika'],
  ],
};

export const SYSTEM_PANEL = {
  label: 'System',
  session: 'Session',
  frameRate: 'Frame rate',
  display: 'Display',
  zone: 'Time zone',
  voice: 'Voice input',
  ready: 'Wispr ready',
};

export const TRASH_EMPTY = 'Recycle Bin is empty.';

export const START_MENU = {
  logOff: 'Log off',
  logOffHint: 'back to the cafe',
};
