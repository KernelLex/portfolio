/**
 * Every image the intro loads, kept free of Phaser so the title screen can
 * preload them (and show real progress) before the engine itself arrives.
 */
export const BASE = 'assets/intro/';

/** [key, frame width, frame height] for every spritesheet the intro uses. */
export const SHEETS: ReadonlyArray<[string, number, number]> = [
  ['player-idle', 32, 44],
  ['player-walk', 32, 44],
  ['player-jump', 32, 44],
  ['player-sit', 32, 44],
  ['player-turn', 32, 44],
  ['props', 64, 120],
  ['rickshaw', 60, 40],
  ['note', 18, 16],
  ['cafe-npc', 24, 26],
  ['cafe-counter', 128, 72],
  ['cafe-decor', 48, 64],
  ['door', 14, 44],
  ['pedestrians', 24, 44],
  ['sign-frame', 16, 16],
  ['flyers', 64, 18],
  ['flyers-far', 20, 6],
  ['traffic', 88, 30],
  ['link-arm', 200, 64],
  ['link-port', 110, 96],
];

export const IMAGES: ReadonlyArray<string> = [
  'sky',
  'skyline',
  'buildings',
  'cables',
  'street',
  'cafe-front',
  'billboard',
  'glow',
  'cafe-wall',
  'cafe-desk',
  'cafe-chair',
  'megacity',
  'haze',
  'street-front',
  'link-plug',
  'bus',
  'sign-bracket',
];


/** Every file, as a URL relative to the page. */
export const INTRO_FILES: ReadonlyArray<string> = [...IMAGES, ...SHEETS.map(([key]) => key)].map((key) => `${BASE}${key}.png`);
