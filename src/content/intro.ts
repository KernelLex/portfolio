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
  services: 'GAMING / VR PODS / NET',
  open: 'OPEN 24 HRS',
} as const;

/** The player's seat, numbered left to right. The PC's BIOS repeats it. */
export const SEAT_NUMBER = 3;

export const CAFE_INTERIOR = {
  cashier: `Seat ${SEAT_NUMBER} is free!`,
  neon: 'GAME ZONE',
  scores: ['TOP SCORE', 'AMG 9999'],
  tournament: ['CYBER CUP', 'TONIGHT'],
  reception: 'WELCOME',
  ad: ['VR PODS', 'NOW OPEN'],
  seatLabel: 'YOUR SEAT',
} as const;

/**
 * What each of Amogh's street billboards cycles through. All from CLAUDE.md
 * section 3: what each project is, nothing invented.
 */
export const BILLBOARD_MESSAGES = {
  vera: ['VERA ERP', 'ONE PLACE', 'PRIVATE AI'],
  secant: ['SECANT', 'ARCHITECTURE', 'IN 3D'],
  hazen: ['HAZEN', 'LIGHTING', 'IN 3D'],
  truecommit: ['TRUECOMMIT', '5 INVOICES', 'ALL PAID'],
} as const;

/** The jack-in cutscene's lettering. */
export const LINK = {
  request: 'LINK REQUEST',
  scanning: 'SCANNING WRIST',
  found: 'PORT FOUND',
  jacking: 'JACKING IN',
  established: 'LINK ESTABLISHED',
  sync: 'SYNC',
  detail: `WRIST LINK  >  SEAT 0${SEAT_NUMBER}  >  HANDSHAKE OK`,
  /** Typed out beside the wrist while it is scanned. */
  readout: ['USER   AMOGH P', 'IMPLANT   WRIST', `SEAT   0${SEAT_NUMBER}`],
  /** The jack-out, played on logging off: the same close-up, in reverse. */
  disconnecting: 'DISCONNECTING',
  jackingOut: 'JACKING OUT',
  closed: 'LINK CLOSED',
  terminated: 'LINK TERMINATED',
} as const;

/** Shown under the game on a phone held upright. */
export const ROTATE_HINT = 'Turn your phone sideways for the whole street';

export const PROMPTS = {
  walk: { keys: 'Hold  >  to walk   Space to jump', touch: 'Hold to walk   Tap to jump' },
  enter: { keys: 'Press  ^  to go in', touch: 'Tap to go in' },
  seat: { keys: 'Walk to the free seat', touch: 'Walk to the free seat' },
  sit: { keys: 'Press  ^  to sit', touch: 'Tap to sit' },
  exit: { keys: 'Press  ^  to go out', touch: 'Tap to go out' },
  /** Back in the seat after logging off the PC. */
  loggedOff: { keys: 'Walk left to go out, or sit back down', touch: 'Hold the left side to walk back out' },
  link: { keys: 'Press  ^  to jack in', touch: 'Tap to jack in' },
} as const;
