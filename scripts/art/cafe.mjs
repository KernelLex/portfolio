/**
 * The cyber cafe interior, set some years from now: hex-panelled walls, a neon
 * grid floor, holographic workstations, egg-shaped gaming pods, the people
 * already playing, a reception counter, and the hardware along the walls.
 *
 * Stations face the camera, so the people at them are drawn from behind and
 * lit by their own screens. Holographic panels are drawn in the scene, not
 * here - holograms are light, not pixels.
 */
import { Px, R, NEON, BAYER, ditherRect, dither, outline, blit } from './core.mjs';

const fill = (c, x, y, w, h, col, a = 255) => c.rect(x, y, w, h, [...col, a]);

/* ================================================================= wall === */

const WALL_W = 480;
const WALL_H = 270;
/** Where the back wall meets the floor. CafeScene lays the room out from it. */
const FLOOR_Y = 176;

/** Draw one hexagonal wall panel outline, centred on (cx, cy). */
function hex(c, cx, cy, col) {
  for (let i = -3; i <= 3; i++) {
    c.set(cx + i, cy - 7, col);
    c.set(cx + i, cy + 7, col);
  }
  for (let j = -3; j <= 3; j++) {
    c.set(cx - 7, cy + j, col);
    c.set(cx + 7, cy + j, col);
  }
  for (let k = 0; k < 4; k++) {
    c.set(cx + 4 + k, cy - 7 + k + 1, col);
    c.set(cx - 4 - k, cy - 7 + k + 1, col);
    c.set(cx + 4 + k, cy + 7 - k - 1, col);
    c.set(cx - 4 - k, cy + 7 - k - 1, col);
  }
}

/** Tileable backdrop: ceiling, RGB strip, hex-panel wall, light-lined wainscot, neon grid floor. */
function cafeWall() {
  const c = new Px(WALL_W, WALL_H);

  // ceiling with recessed light slots
  ditherRect(c, 0, 0, WALL_W, 18, R.night, (_i, j) => 0.6 + j * 0.03);
  for (let x = 20; x < WALL_W; x += 120) fill(c, x, 9, 40, 2, R.cyan[1], 200);
  fill(c, 0, 16, WALL_W, 1, R.night[2]);

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

  // hex-panelled wall, some panels faintly lit from within
  ditherRect(c, 0, 21, WALL_W, 121, R.night, (_i, j) => 2.3 - (j / 121) * 0.9);
  let row = 0;
  for (let cy = 30; cy < 138; cy += 14, row++) {
    for (let cx = row % 2 ? 8 : 0; cx < WALL_W + 8; cx += 16) {
      const lit = (cx * 7 + cy * 13) % 23 === 0;
      hex(c, ((cx % WALL_W) + WALL_W) % WALL_W, cy, lit ? [...R.cyan[2], 150] : [...R.night[4], 120]);
    }
  }
  // vertical neon tubes
  [80, 240, 400].forEach((x, k) => {
    const ramp = k % 2 ? R.magenta : R.cyan;
    for (let y = 26; y < 138; y++) {
      dither(c, x, y, ramp, 3.6);
      c.set(x - 1, y, [...ramp[2], 120]);
      c.set(x + 1, y, [...ramp[2], 120]);
    }
  });

  // wainscot with a light line, then the skirting
  ditherRect(c, 0, 142, WALL_W, 34, R.night, (_i, j) => 1.2 - j * 0.01);
  fill(c, 0, 142, WALL_W, 1, R.night[4]);
  fill(c, 0, 150, WALL_W, 1, R.cyan[2], 170);
  fill(c, 0, FLOOR_Y - 4, WALL_W, 4, R.night[0]);

  // glossy floor with a neon grid, rows widening towards the viewer
  ditherRect(c, 0, FLOOR_Y, WALL_W, WALL_H - FLOOR_Y, R.night, (_i, j) => 0.7 + Math.sin(j * 0.12) * 0.15);
  const rows = [FLOOR_Y, 180, 186, 194, 205, 219, 237, 260];
  rows.forEach((y, k) => {
    fill(c, 0, y, WALL_W, 1, R.cyan[1], 70 + k * 12);
    const next = rows[k + 1] ?? WALL_H;
    for (let x = 0; x < WALL_W; x += 48) fill(c, x, y + 1, 1, next - y - 1, R.cyan[1], 45);
  });
  return c;
}

/* ================================================================ desk === */

const DESK_W = 64;
const DESK_H = 52;

/**
 * A holographic workstation facing the camera. The screen (x 18-45, y 2-19)
 * stays dark: CafeScene draws a little game on each one. The PC is a glass
 * core under the desk; its power LED sits at (52, 35).
 */
function desk() {
  const c = new Px(DESK_W, DESK_H);

  // frameless display: dark glass edged with light, on a thin lit stem
  fill(c, 17, 1, 30, 20, R.cyan[1]);
  fill(c, 18, 2, 28, 18, R.night[0]);
  fill(c, 17, 1, 30, 1, R.cyan[3]);
  fill(c, 31, 21, 2, 5, R.cyan[1]);

  // floating slab with a glowing front edge, and a projected keyboard
  ditherRect(c, 2, 26, 60, 3, R.steel, (_i, j) => 1.6 - j * 0.5);
  fill(c, 2, 26, 60, 1, R.steel[3]);
  fill(c, 2, 29, 60, 1, R.cyan[3]);
  for (let x = 20; x < 44; x += 2) c.set(x, 25, [...R.cyan[3], 200]);
  fill(c, 46, 25, 3, 1, R.cyan[2]);

  // one pedestal, ringed in light where it meets the floor
  fill(c, 28, 30, 8, 20, R.night[1]);
  fill(c, 28, 30, 1, 20, R.night[3]);
  fill(c, 25, 50, 14, 1, R.cyan[2]);

  // the PC: a glass core with light running through it
  fill(c, 46, 32, 9, 19, R.night[0]);
  ditherRect(c, 47, 33, 7, 17, R.night, () => 1.4);
  for (let j = 0; j < 16; j++) dither(c, 50, 34 + j, j < 8 ? R.cyan : R.magenta, 3.4);
  fill(c, 52, 35, 2, 1, R.night[2]); // power LED, off until the scene lights it

  outline(c, R.night[0]);
  return c;
}

/* ================================================================ pod === */

const POD_W = 26;
const POD_H = 30;

/** An egg-shaped gaming pod from behind, trimmed in light. Drawn in front of its occupant. */
function chair() {
  const c = new Px(POD_W, POD_H);
  for (let j = 0; j < 24; j++) {
    const k = j / 23;
    const half = Math.round(7 + Math.sin(Math.min(1, k * 1.25) * Math.PI * 0.5) * 5 - Math.max(0, k - 0.8) * 10);
    for (let i = -half; i < half; i++) dither(c, 13 + i, j, R.night, 2.4 - Math.abs(i) / half - k * 0.4);
    c.set(13 - half, j, [...R.cyan[3], 255]);
    c.set(13 + half - 1, j, [...R.cyan[3], 255]);
  }
  fill(c, 7, 0, 12, 1, R.cyan[3]);
  fill(c, 12, 3, 2, 18, R.night[0], 160); // seam
  fill(c, 11, 24, 4, 4, R.night[1]); // pedestal
  fill(c, 6, 28, 14, 1, R.cyan[2]);
  fill(c, 8, 29, 10, 1, R.cyan[1]);
  outline(c, R.night[0]);
  return c;
}

/* ================================================================= npc === */

const NPC_W = 24;
const NPC_H = 26;

const NPC_VARIANTS = [
  // red hoodie, headphones with lit rings
  { hair: R.night[0], top: R.magenta[1], dark: R.magenta[0], lit: R.magenta[2], phones: true, cap: null, streak: null },
  // grey jacket, a neon streak in the hair
  { hair: R.amber[0], top: R.steel[0], dark: R.night[3], lit: R.steel[1], phones: false, cap: null, streak: R.magenta[3] },
  // green jacket, cap on backwards with a lit strap
  { hair: R.night[0], top: R.green[1], dark: R.green[0], lit: R.green[2], phones: false, cap: R.violet[1], streak: null },
];

/** Somebody already playing, from behind. Frame 1 leans in and works the mouse. */
function npcFrame(v, f) {
  const c = new Px(NPC_W, NPC_H);
  const lean = f === 1 ? 1 : 0;
  const px = (x, y, w, h, col) => fill(c, x, y, w, h, col);

  px(2, 13, 20, 13, v.top);
  px(2, 13, 4, 13, v.dark);
  px(19, 14, 3, 12, v.lit);
  px(0, 15, 3, 5, v.dark);
  px(21, 15 - f, 3, 5, v.lit);

  px(10, 11, 4, 2, R.skin[1]);
  c.set(12, 12, [...R.cyan[3], 255]); // neck implant
  px(8, 1 + lean, 8, 1, v.hair);
  px(7, 2 + lean, 10, 8, v.hair);
  px(8, 10 + lean, 8, 1, v.hair);
  px(6, 5 + lean, 1, 2, R.skin[1]);
  px(17, 5 + lean, 1, 2, R.skin[1]);

  if (v.streak) px(11, 2 + lean, 2, 8, v.streak);
  if (v.cap) {
    px(7, 1 + lean, 10, 4, v.cap);
    px(9, 5 + lean, 6, 1, R.cyan[3]);
  }
  if (v.phones) {
    px(7, 0 + lean, 10, 1, R.night[1]);
    px(5, 4 + lean, 2, 5, R.night[1]);
    px(17, 4 + lean, 2, 5, R.night[1]);
    px(5, 5 + lean, 1, 3, R.cyan[3]);
    px(18, 5 + lean, 1, 3, R.cyan[3]);
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

/**
 * Reception: a pale counter lined with light, and whoever runs the place in an
 * AR visor. Frame 1 is the visor flickering. The holo display above the
 * counter is drawn in the scene.
 */
function counterFrame(flicker) {
  const c = new Px(COUNTER_W, COUNTER_H);
  const px = (x, y, w, h, col) => fill(c, x, y, w, h, col);
  const cx = 46;

  // jacket with rounded shoulders and a lit collar, hands resting on the counter
  for (let j = 0; j < 13; j++) {
    const half = j === 0 ? 9 : j === 1 ? 11 : 13;
    for (let x = cx - half; x < cx + half; x++) dither(c, x, 22 + j, R.violet, 2.1 - j * 0.07 - Math.abs(x - cx) * 0.03);
  }
  px(cx - 9, 22, 18, 1, R.cyan[3]);
  px(cx, 23, 1, 12, R.cyan[2]);
  px(cx - 13, 26, 1, 8, R.violet[0]);
  px(cx + 12, 26, 1, 8, R.violet[0]);
  px(cx - 13, 31, 5, 3, R.skin[2]);
  px(cx + 8, 31, 5, 3, R.skin[2]);
  px(cx - 2, 18, 4, 4, R.skin[1]);
  ditherRect(c, cx - 6, 5, 12, 13, R.skin, (i) => 2.6 - i * 0.08);
  // undercut with a magenta streak
  px(cx - 7, 2, 14, 5, R.night[0]);
  px(cx - 7, 6, 2, 4, R.night[0]);
  px(cx + 5, 6, 2, 3, R.night[0]);
  px(cx - 2, 2, 4, 2, R.magenta[3]);
  // AR visor across the eyes
  px(cx - 7, 9, 14, 2, flicker ? R.cyan[1] : R.cyan[3]);
  px(cx - 7, 9, 14, 1, flicker ? R.cyan[0] : R.cyan[4]);
  px(cx - 2, 14, 4, 1, R.skin[0]);

  // the counter: pale top, dark glass front, two lines of light
  ditherRect(c, 0, 34, COUNTER_W, 4, R.steel, (_i, j) => 3.4 - j * 0.4);
  px(0, 34, COUNTER_W, 1, R.steel[4]);
  ditherRect(c, 2, 38, COUNTER_W - 4, 34, R.night, (_i, j) => 1.5 - j * 0.02);
  px(2, 44, COUNTER_W - 4, 1, R.cyan[3]);
  px(2, 62, COUNTER_W - 4, 1, R.magenta[2]);

  outline(c, R.night[0]);
  return c;
}

function counter() {
  const sheet = new Px(COUNTER_W * 2, COUNTER_H);
  blit(sheet, counterFrame(false), 0, 0);
  blit(sheet, counterFrame(true), COUNTER_W, 0);
  return sheet;
}

/* ============================================================== hardware === */

const KIT_W = 48;
const KIT_H = 64;

function vendingMachine(c) {
  ditherRect(c, 8, 2, 32, 62, R.night, (i) => 2 - i * 0.02);
  fill(c, 8, 2, 32, 1, R.night[4]);
  // glass front with lit rows of drinks
  fill(c, 11, 6, 20, 40, R.night[0]);
  ditherRect(c, 12, 7, 18, 38, R.cyan, (_i, j) => 1.4 - j * 0.015);
  const colours = [R.magenta, R.lime, R.amber, R.cyan, R.yellow, R.violet];
  for (let row = 0; row < 5; row++) {
    for (let k = 0; k < 4; k++) fill(c, 13 + k * 4, 10 + row * 7, 3, 5, colours[(row + k) % colours.length][3]);
    fill(c, 12, 15 + row * 7, 18, 1, R.night[1]);
  }
  // display and keypad
  fill(c, 33, 8, 5, 4, R.lime[3]);
  for (let j = 0; j < 3; j++) for (let i = 0; i < 2; i++) fill(c, 33 + i * 3, 15 + j * 3, 2, 2, R.night[3]);
  fill(c, 12, 50, 18, 6, R.night[0]); // drop slot
  fill(c, 12, 50, 18, 1, R.cyan[2]);
}

function serverRack(c) {
  ditherRect(c, 10, 4, 28, 60, R.night, () => 1.3);
  fill(c, 10, 4, 28, 1, R.night[4]);
  for (let y = 8; y < 60; y += 6) {
    fill(c, 12, y, 24, 4, R.night[2]);
    fill(c, 12, y, 24, 1, R.night[3]);
    for (let x = 14; x < 22; x += 2) c.set(x, y + 2, [...[R.lime, R.cyan, R.amber][(x + y) % 3][3], 255]);
    for (let x = 24; x < 35; x += 2) c.set(x, y + 2, [...R.night[0], 255]);
  }
}

function planter(c) {
  ditherRect(c, 16, 46, 16, 18, R.steel, (i) => 2.8 - i * 0.1);
  fill(c, 16, 46, 16, 1, R.steel[4]);
  fill(c, 16, 52, 16, 1, R.cyan[2]);
  // a plant that glows
  for (let k = 0; k < 7; k++) {
    const x0 = 24 + Math.round(Math.sin(k * 1.7) * 7);
    for (let j = 0; j < 14 + (k % 3) * 4; j++) {
      const x = x0 + Math.round(Math.sin(j * 0.35 + k) * 2);
      c.set(x, 46 - j, [...(k % 2 ? R.cyan[2] : R.lime[2]), 255]);
      if (j % 4 === 0) c.set(x + 1, 46 - j, [...(k % 2 ? R.cyan[3] : R.lime[3]), 255]);
    }
  }
}

/** 0: drinks machine. 1: server rack. 2: a planter with a glowing plant. */
function decor() {
  const frames = [vendingMachine, serverRack, planter];
  const sheet = new Px(KIT_W * frames.length, KIT_H);
  frames.forEach((draw, i) => {
    const cell = new Px(KIT_W, KIT_H);
    draw(cell);
    outline(cell, R.night[0]);
    blit(sheet, cell, i * KIT_W, 0);
  });
  return sheet;
}

export { cafeWall, desk, chair, npcs, counter, decor };
