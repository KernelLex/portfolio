/**
 * The cyber cafe interior: back wall and floor, PC stations, chairs, the people
 * already playing, the counter, a ceiling fan, and the things on the walls.
 *
 * Stations face the camera, so the people at them are drawn from behind and
 * lit by their own screens - the iconic image of a cafe at night.
 */
import { Px, R, NEON, BAYER, ditherRect, dither, outline, blit } from './core.mjs';

/* ================================================================= wall === */

const WALL_W = 480;
const WALL_H = 270;
/** Where the back wall meets the floor. CafeScene lays the room out from it. */
const FLOOR_Y = 176;

/** Tileable backdrop: ceiling, RGB strip, panelled wall, wainscot, tiled floor. */
function cafeWall() {
  const c = new Px(WALL_W, WALL_H);

  // ceiling and cable tray
  ditherRect(c, 0, 0, WALL_W, 18, R.night, (_i, j) => 0.6 + j * 0.03);
  c.rect(0, 14, WALL_W, 1, [...R.night[2], 255]);

  // RGB strip: four 120px runs, each dithering into the next over its last 30px
  for (let x = 0; x < WALL_W; x++) {
    const seg = (x / 120) | 0;
    const t = (x % 120) / 120;
    const blend = Math.max(0, (t - 0.75) * 4);
    for (const y of [19, 20]) {
      const next = blend > BAYER[y & 7][x & 7];
      const ramp = NEON[(seg + (next ? 1 : 0)) % NEON.length];
      c.set(x, y, [...ramp[y === 19 ? 3 : 2], 255]);
    }
  }

  // panelled wall, lit faintly from the strip above
  ditherRect(c, 0, 21, WALL_W, 121, R.night, (_i, j) => 2.4 - (j / 121) * 1.0);
  for (let x = 0; x < WALL_W; x += 80) {
    c.rect(x, 21, 1, 121, [...R.night[0], 200]);
    c.rect(x + 1, 21, 1, 121, [...R.night[3], 70]);
  }
  for (let y = 26; y < 140; y += 6) {
    for (let x = 4; x < WALL_W; x += 6) c.set(x + ((y / 6) % 2) * 3, y, [...R.night[1], 120]);
  }

  // wainscot and skirting
  ditherRect(c, 0, 142, WALL_W, 34, R.night, (_i, j) => 1.3 - j * 0.01);
  c.rect(0, 142, WALL_W, 1, [...R.concrete[3], 255]);
  c.rect(0, 143, WALL_W, 1, [...R.night[0], 255]);
  for (let x = 0; x < WALL_W; x += 16) c.rect(x, 144, 1, 28, [...R.night[0], 120]);
  c.rect(0, FLOOR_Y - 4, WALL_W, 4, [...R.night[0], 255]);

  // floor tiles, grout spacing widening towards the viewer to fake depth
  ditherRect(c, 0, FLOOR_Y, WALL_W, WALL_H - FLOOR_Y, R.night, (i, j) => {
    return 1.15 + Math.sin(j * 0.12) * 0.15 + ((i / 48 + j / 30) % 2 < 1 ? 0.12 : 0);
  });
  const rows = [FLOOR_Y, 180, 186, 194, 205, 219, 237, 260];
  rows.forEach((y, k) => {
    c.rect(0, y, WALL_W, 1, [...R.night[0], 210]);
    const next = rows[k + 1] ?? WALL_H;
    const stagger = k % 2 ? 24 : 0;
    for (let x = stagger; x < WALL_W; x += 48) c.rect(x, y + 1, 1, next - y - 1, [...R.night[0], 150]);
  });
  return c;
}

/* ================================================================ desk === */

const DESK_W = 64;
const DESK_H = 52;

/**
 * A PC station facing the camera. The screen (x 18-45, y 2-19) stays dark:
 * CafeScene draws a little game on each one.
 */
function desk() {
  const c = new Px(DESK_W, DESK_H);

  // monitor and stand
  c.rect(16, 0, 32, 22, [...R.night[0], 255]);
  c.rect(16, 0, 32, 1, [...R.night[3], 255]);
  c.rect(18, 2, 28, 18, [...R.night[0], 255]);
  c.rect(30, 22, 4, 4, [...R.night[1], 255]);
  c.rect(25, 26, 14, 1, [...R.night[2], 255]);

  // desk top, keyboard with backlit keys, mouse
  c.rect(1, 27, 62, 3, [...R.concrete[2], 255]);
  c.rect(1, 27, 62, 1, [...R.concrete[4], 255]);
  c.rect(21, 26, 22, 1, [...R.night[0], 255]);
  for (let x = 22; x < 42; x += 2) c.set(x, 26, [...R.cyan[1], 220]);
  c.rect(46, 26, 3, 1, [...R.night[0], 255]);

  // body, and the tower underneath with its RGB strip
  c.rect(2, 30, 4, 22, [...R.concrete[1], 255]);
  c.rect(58, 30, 4, 22, [...R.concrete[1], 255]);
  c.rect(6, 30, 52, 12, [...R.night[1], 255]);
  c.rect(44, 32, 12, 20, [...R.night[0], 255]);
  c.rect(45, 33, 10, 18, [...R.night[1], 255]);
  for (let j = 0; j < 16; j++) dither(c, 47, 34 + j, j < 8 ? R.cyan : R.magenta, 3.2);
  c.rect(52, 35, 2, 1, [...R.night[2], 255]); // power LED, off until the scene lights it

  outline(c, R.night[0]);
  return c;
}

/* =============================================================== chair === */

const CHAIR_W = 26;
const CHAIR_H = 30;

/** Gaming chair from behind. Drawn in front of whoever is sitting in it. */
function chair() {
  const c = new Px(CHAIR_W, CHAIR_H);

  c.rect(6, 0, 14, 1, [...R.night[2], 255]);
  c.rect(5, 1, 16, 1, [...R.night[2], 255]);
  ditherRect(c, 4, 2, 18, 16, R.night, (_i, j) => 2.3 - j * 0.07);
  c.rect(5, 2, 1, 15, [...R.magenta[1], 255]);
  c.rect(20, 2, 1, 15, [...R.magenta[1], 255]);
  c.rect(13, 3, 1, 14, [...R.night[0], 140]);

  // armrests
  c.rect(1, 12, 3, 2, [...R.night[1], 255]);
  c.rect(1, 14, 1, 4, [...R.night[1], 255]);
  c.rect(22, 12, 3, 2, [...R.night[1], 255]);
  c.rect(24, 14, 1, 4, [...R.night[1], 255]);

  // seat edge, gas lift, star base
  c.rect(3, 18, 20, 3, [...R.night[2], 255]);
  c.rect(3, 18, 20, 1, [...R.night[3], 255]);
  c.rect(12, 21, 2, 5, [...R.steel[0], 255]);
  c.rect(3, 26, 20, 1, [...R.night[1], 255]);
  for (const wx of [2, 11, 21]) c.rect(wx, 27, 3, 2, [...R.night[0], 255]);

  outline(c, R.night[0]);
  return c;
}

/* ================================================================= npc === */

const NPC_W = 24;
const NPC_H = 26;

const NPC_VARIANTS = [
  // red hoodie, headphones on
  { hair: R.night[0], top: R.magenta[1], dark: R.magenta[0], lit: R.magenta[2], phones: true, cap: null },
  // grey tee, brown hair
  { hair: R.amber[0], top: R.steel[0], dark: R.night[3], lit: R.steel[1], phones: false, cap: null },
  // green jacket, cap on backwards
  { hair: R.night[0], top: R.green[1], dark: R.green[0], lit: R.green[2], phones: false, cap: R.violet[1] },
];

/** Somebody already playing, from behind. Frame 1 leans in and works the mouse. */
function npcFrame(v, f) {
  const c = new Px(NPC_W, NPC_H);
  const lean = f === 1 ? 1 : 0;
  const px = (x, y, w, h, col) => c.rect(x, y, w, h, [...col, 255]);

  // back and shoulders
  px(2, 13, 20, 13, v.top);
  px(2, 13, 4, 13, v.dark);
  px(19, 14, 3, 12, v.lit);
  // elbows out towards keyboard and mouse
  px(0, 15, 3, 5, v.dark);
  px(21, 15 - f, 3, 5, v.lit);

  // neck and the back of the head
  px(10, 11, 4, 2, R.skin[1]);
  px(8, 1 + lean, 8, 1, v.hair);
  px(7, 2 + lean, 10, 8, v.hair);
  px(8, 10 + lean, 8, 1, v.hair);
  px(6, 5 + lean, 1, 2, R.skin[1]);
  px(17, 5 + lean, 1, 2, R.skin[1]);

  if (v.cap) {
    px(7, 1 + lean, 10, 4, v.cap);
    px(9, 5 + lean, 6, 1, R.night[0]);
  }
  if (v.phones) {
    px(7, 0 + lean, 10, 1, R.night[1]);
    px(5, 4 + lean, 2, 5, R.night[1]);
    px(17, 4 + lean, 2, 5, R.night[1]);
    px(5, 6 + lean, 1, 1, R.cyan[3]);
  }

  outline(c, R.night[0]);
  return c;
}

function npcs() {
  const sheet = new Px(NPC_W * 6, NPC_H);
  NPC_VARIANTS.forEach((v, i) => {
    for (let f = 0; f < 2; f++) blit(sheet, npcFrame(v, f), (i * 2 + f) * NPC_W, 0);
  });
  return sheet;
}

/* ============================================================= counter === */

const COUNTER_W = 128;
const COUNTER_H = 72;

/** The front counter and whoever runs the place. Frame 1 blinks. */
function counterFrame(blink) {
  const c = new Px(COUNTER_W, COUNTER_H);
  const px = (x, y, w, h, col) => c.rect(x, y, w, h, [...col, 255]);
  const cx = 46;

  // cashier, chest up
  ditherRect(c, cx - 11, 22, 22, 14, R.cyan, (_i, j) => 1.4 - j * 0.05);
  px(cx - 2, 18, 4, 4, R.skin[1]);
  ditherRect(c, cx - 6, 5, 12, 13, R.skin, (i) => 2.6 - i * 0.08);
  px(cx - 7, 3, 14, 4, R.night[0]);
  px(cx - 7, 6, 2, 5, R.night[0]);
  px(cx + 5, 6, 2, 4, R.night[0]);
  if (blink) {
    px(cx - 4, 10, 2, 1, R.skin[0]);
    px(cx + 2, 10, 2, 1, R.skin[0]);
  } else {
    px(cx - 4, 9, 2, 2, R.night[0]);
    px(cx + 2, 9, 2, 2, R.night[0]);
  }
  px(cx - 2, 14, 4, 1, R.skin[0]);

  // the till's monitor, its back to us, and a bell
  px(70, 14, 24, 18, R.night[1]);
  px(70, 14, 24, 1, R.night[3]);
  px(80, 32, 4, 2, R.night[1]);
  ditherRect(c, 104, 30, 7, 4, R.amber, (_i, j) => 3.4 - j * 0.4);
  px(107, 29, 1, 1, R.amber[3]);

  // counter top, and a front panel with an LED strip
  px(0, 34, COUNTER_W, 4, R.concrete[3]);
  px(0, 34, COUNTER_W, 1, R.concrete[4]);
  ditherRect(c, 2, 38, COUNTER_W - 4, 34, R.night, (i, j) => 1.6 - j * 0.02 + ((i >> 4) % 2) * 0.15);
  ditherRect(c, 2, 39, COUNTER_W - 4, 1, R.cyan, () => 3.3);

  outline(c, R.night[0]);
  return c;
}

function counter() {
  const sheet = new Px(COUNTER_W * 2, COUNTER_H);
  blit(sheet, counterFrame(false), 0, 0);
  blit(sheet, counterFrame(true), COUNTER_W, 0);
  return sheet;
}

/* =================================================================== fan == */

const FAN_W = 64;
const FAN_H = 20;

/** Ceiling fan, side on. Four frames of blade reach read as a spin. */
function fanFrame(f) {
  const c = new Px(FAN_W, FAN_H);
  c.rect(31, 0, 2, 8, [...R.night[2], 255]);
  c.rect(26, 8, 12, 4, [...R.night[2], 255]);
  c.rect(26, 8, 12, 1, [...R.night[3], 255]);
  const reach = [30, 19, 6, 19][f];
  c.rect(32 - reach, 11, reach * 2, 2, [...R.night[1], 255]);
  c.rect(32 - reach, 11, 2, 1, [...R.night[3], 255]);
  c.rect(29, 12, 6, 3, [...R.steel[1], 255]);
  outline(c, R.night[0]);
  return c;
}

function fan() {
  const sheet = new Px(FAN_W * 4, FAN_H);
  for (let f = 0; f < 4; f++) blit(sheet, fanFrame(f), f * FAN_W, 0);
  return sheet;
}

/* ================================================================ decor === */

const DECOR_W = 48;
const DECOR_H = 40;

/** Original game posters - no real titles, nothing borrowed. */
function posterSpace(c) {
  c.rect(6, 2, 36, 36, [...R.magenta[2], 255]);
  c.rect(7, 3, 34, 34, [...R.night[0], 255]);
  for (let i = 0; i < 18; i++) c.set(8 + ((i * 13) % 32), 4 + ((i * 7) % 22), [...R.steel[3], 200]);
  for (let j = 0; j < 9; j++) c.rect(24 - j, 10 + j, 1 + j * 2, 1, [...R.cyan[3 - (j >> 2)], 255]);
  c.rect(22, 19, 4, 2, [...R.amber[3], 255]);
  c.rect(10, 28, 28, 2, [...R.amber[3], 255]);
  c.rect(14, 32, 20, 1, [...R.steel[2], 255]);
}

function posterSun(c) {
  c.rect(6, 2, 36, 36, [...R.cyan[2], 255]);
  ditherRect(c, 7, 3, 34, 34, R.violet, (_i, j) => 0.4 + (j / 34) * 2.6);
  for (let y = 0; y < 12; y++) {
    for (let x = 0; x < 12; x++) {
      if (Math.hypot(x - 5.5, y - 5.5) < 6) c.set(18 + x, 9 + y, [...R.amber[y < 6 ? 4 : 3], 255]);
    }
  }
  for (let x = 7; x < 41; x++) {
    const h = 6 + Math.round(Math.abs(Math.sin(x * 0.35)) * 6);
    c.rect(x, 26 - h, 1, h, [...R.night[1], 255]);
  }
  c.rect(7, 26, 34, 11, [...R.night[0], 255]);
  for (let y = 28; y < 37; y += 3) c.rect(7, y, 34, 1, [...R.magenta[2], 255]);
}

/** Blank plate - the scene prints the house rule on it. */
function signPlate(c) {
  c.rect(4, 12, 40, 16, [...R.magenta[2], 255]);
  c.rect(5, 13, 38, 14, [...R.steel[4], 255]);
}

function acUnit(c) {
  ditherRect(c, 2, 12, 44, 16, R.steel, (_i, j) => 3.6 - j * 0.08);
  c.rect(2, 12, 44, 1, [...R.steel[4], 255]);
  c.rect(4, 24, 40, 1, [...R.steel[1], 255]);
  c.rect(4, 26, 40, 1, [...R.steel[0], 255]);
  c.rect(40, 15, 2, 1, [...R.lime[3], 255]);
  outline(c, R.night[0]);
}

function wallClock(c) {
  for (let y = 0; y < 20; y++) {
    for (let x = 0; x < 20; x++) {
      const d = Math.hypot(x - 9.5, y - 9.5);
      if (d > 9.6) continue;
      c.set(14 + x, 10 + y, [...(d > 8.2 ? R.night[1] : R.steel[4]), 255]);
    }
  }
  for (const [x, y] of [[23, 12], [23, 27], [15, 19], [31, 19]]) c.set(x + 1, y + 1, [...R.night[1], 255]);
  c.rect(24, 13, 1, 7, [...R.night[0], 255]);
  c.rect(24, 19, 5, 1, [...R.night[0], 255]);
}

/** Screen left black - the scene puts a cricket match on it. */
function tv(c) {
  c.rect(2, 6, 44, 28, [...R.night[0], 255]);
  c.rect(2, 6, 44, 1, [...R.night[3], 255]);
  c.rect(4, 8, 40, 24, [...R.night[0], 255]);
  c.rect(22, 34, 4, 3, [...R.night[1], 255]);
}

function snackShelf(c) {
  const colours = [R.magenta, R.lime, R.amber, R.cyan, R.yellow, R.violet];
  for (const y of [18, 34]) {
    c.rect(2, y, 44, 2, [...R.concrete[3], 255]);
    for (let i = 0; i < 7; i++) {
      const ramp = colours[(i + y) % colours.length];
      const h = 7 + ((i * 5 + y) % 5);
      ditherRect(c, 4 + i * 6, y - h, 5, h, ramp, (_x, j) => 2.8 - j * 0.15);
    }
  }
  outline(c, R.night[0]);
}

/** Dark board with an amber edge - the scene writes the rates on it. */
function rateBoard(c) {
  c.rect(4, 4, 40, 32, [...R.amber[2], 255]);
  c.rect(5, 5, 38, 30, [...R.night[0], 255]);
}

function decor() {
  const frames = [posterSpace, posterSun, signPlate, acUnit, wallClock, tv, snackShelf, rateBoard];
  const sheet = new Px(DECOR_W * frames.length, DECOR_H);
  frames.forEach((draw, i) => {
    const cell = new Px(DECOR_W, DECOR_H);
    draw(cell);
    blit(sheet, cell, i * DECOR_W, 0);
  });
  return sheet;
}

export { cafeWall, desk, chair, npcs, counter, fan, decor };
