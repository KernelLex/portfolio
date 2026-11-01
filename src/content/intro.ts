/**
 * Words that appear inside the intro game. Kept out of the scenes so copy can
 * change without touching Phaser code.
 *
 * Every voice note is a fact from CLAUDE.md section 3 - nothing invented.
 */

export type VoiceNote = {
  /** World x on the street. */
  x: number;
  /** High notes need a jump to reach. */
  high: boolean;
  text: string;
};

export const VOICE_NOTES: ReadonlyArray<VoiceNote> = [
  { x: 205, high: false, text: '7 roles before graduating' },
  { x: 335, high: true, text: 'Top 10 at national hackathons' },
  { x: 455, high: false, text: 'Speaks 5 languages' },
  { x: 565, high: true, text: '6 months, zero clients. Then Secant.' },
  { x: 675, high: false, text: 'Rs 2,15,867 recovered on real invoices' },
];

export const BILLBOARD = {
  listening: 'LISTENING',
  dictation: ['HOLD. SPEAK.', 'IT TYPES FOR YOU'],
  brand: 'WISPR FLOW',
  tagline: 'SPEAK. IT WRITES.',
} as const;

export const CAFE_SIGN = {
  services: 'GAMING / INTERNET / PRINTOUTS',
  open: 'OPEN 24 HRS',
  rate: 'RS.30/HR',
} as const;

/** The player's seat, numbered left to right. The PC's BIOS repeats it. */
export const SEAT_NUMBER = 3;

export const CAFE_INTERIOR = {
  cashier: `Seat ${SEAT_NUMBER} is free!`,
  houseRule: 'NO FOOD NEAR PCS',
  neon: 'GAME ZONE',
  rates: ['RATES', 'RS30/HR'],
  seatLabel: 'YOUR SEAT',
} as const;

/** Shown under the game on a phone held upright. */
export const ROTATE_HINT = 'Turn your phone sideways for the whole street';

export const PROMPTS = {
  walk: { keys: 'Hold  >  to walk   Space to jump', touch: 'Hold to walk   Tap to jump' },
  enter: { keys: 'Press  ^  to go in', touch: 'Tap to go in' },
  seat: { keys: 'Walk to the free seat', touch: 'Walk to the free seat' },
  sit: { keys: 'Press  ^  to sit', touch: 'Tap to sit' },
  power: { keys: 'Press  ^  to power on', touch: 'Tap to power on' },
} as const;
