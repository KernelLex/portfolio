/**
 * The city around the street: megastructures on the horizon, the row of
 * buildings right behind the pavement (with the shops at their feet), the
 * hardware every mounted sign hangs from, and the traffic - in the air and on
 * the road.
 */
import { Px, R, NEON, clamp, dither, ditherRect, rng, outline, rimLight, blit } from './core.mjs';

const fill = (c, x, y, w, h, col, a = 255) => c.rect(x, y, w, h, [...col, a]);

/* ============================================================ megacity === */

const MEGA_W = 480;
const MEGA_H = 210;

/** Colossal towers on the horizon, dissolving into the city glow. */
function megacity() {
  const c = new Px(MEGA_W, MEGA_H);
  const r = rng(616);
  const towers = [
    { x: 6, w: 34, h: 150 },
    { x: 46, w: 22, h: 118 },
    { x: 74, w: 76, h: 204, kind: 'arcology' },
    { x: 158, w: 26, h: 140 },
    { x: 190, w: 40, h: 176 },
    { x: 238, w: 18, h: 108 },
    { x: 264, w: 54, h: 192, kind: 'spire' },
    { x: 326, w: 30, h: 128 },
    { x: 362, w: 64, h: 168 },
    { x: 434, w: 32, h: 146 },
  ];
  const insetAt = (t, y) => {
    if (t.kind !== 'arcology') return 0;
    return Math.round((1 - (y - (MEGA_H - t.h)) / t.h) * t.w * 0.38);
  };

  for (const t of towers) {
    const top = MEGA_H - t.h;
    for (let y = top; y < MEGA_H; y++) {
      const k = (y - top) / t.h;
      const inset = insetAt(t, y);
      for (let x = t.x + inset; x < t.x + t.w - inset; x++) dither(c, x, y, R.night, 1.55 + k * 0.5);
      // the arcology's tiers glow at their edges
      if (t.kind === 'arcology' && y > top && (y - top) % 14 === 0) {
        for (let x = t.x + inset; x < t.x + t.w - inset; x++) c.set(x, y, [...R.amber[1], 110]);
      }
      c.set(t.x + inset, y, [...R.night[4], 90]);
    }
    for (let y = top + 4; y < MEGA_H - 6; y += 4) {
      const inset = insetAt(t, y);
      for (let x = t.x + inset + 2; x < t.x + t.w - inset - 1; x += 3) {
        if (r() < 0.14) c.set(x, y, [...(r() < 0.6 ? R.amber[2] : R.cyan[2]), 60 + ((r() * 70) | 0)]);
      }
    }
    if (t.kind !== 'arcology' && r() < 0.5) {
      const ramp = NEON[(r() * NEON.length) | 0];
      const sx = t.x + 3 + ((r() * (t.w - 6)) | 0);
      const len = 30 + ((r() * 50) | 0);
      for (let j = 0; j < len; j++) c.set(sx, top + 10 + j, [...ramp[2], 130]);
    }
    if (t.kind === 'spire') {
      const sx = t.x + (t.w >> 1);
      for (let j = 1; j < 26 && top - j >= 0; j++) c.set(sx, top - j, [...R.night[3], 255]);
      c.set(sx, Math.max(0, top - 26), [...R.magenta[3], 255]);
    }
    c.set(t.x + insetAt(t, top), top, [...R.magenta[3], 220]);
  }

  for (let y = MEGA_H - 70; y < MEGA_H; y++) {
    const a = Math.round(((y - (MEGA_H - 70)) / 70) * 150);
    for (let x = 0; x < MEGA_W; x++) if (c.alphaAt(x, y) > 0) c.set(x, y, [...R.night[3], a]);
  }
  return c;
}

/** Soft vertical alpha ramp; tinted and stretched in-scene as atmospheric haze. */
function haze() {
  const c = new Px(4, 128);
  for (let y = 0; y < 128; y++) c.rect(0, y, 4, 1, [255, 255, 255, Math.round(Math.pow(y / 127, 1.6) * 255)]);
  return c;
}

/* ======================================================== street front === */

/**
 * The row of buildings right behind the pavement, at the player's own depth.
 * Placed with its bottom on the building base line (screen y 196), so local
 * y = screen y - 6. Every mounted sign in StreetScene is positioned against
 * these buildings - change the layout here and the sign positions there
 * have to follow.
 */
const FRONT_W = 960;
const FRONT_H = 190;
const GROUND_TOP = 138; // ground-floor shops sit below this
const FLOOR_H = 32;

const FRONT = [
  { x: 0, w: 112, floors: 3, style: 'brick', ramp: 'brick', bias: 0.1, shop: 'ramen' },
  { x: 112, w: 88, floors: 1, style: 'shophouse', ramp: 'concrete', bias: 0.2, shop: 'repair' },
  { x: 200, w: 130, floors: 4, style: 'glass', ramp: 'night', bias: 0.7, shop: 'mart' },
  { x: 330, w: 110, floors: 2, style: 'balcony', ramp: 'teal', bias: 0.4, shop: 'bar' },
  { x: 440, w: 120, floors: 3, style: 'industrial', ramp: 'concrete', bias: -0.2, shop: 'garage' },
  { x: 560, w: 144, floors: 3, style: 'apartment', ramp: 'brick', bias: 0.4, shop: 'clinic' },
  { x: 704, w: 192, floors: 4, style: 'cafe', ramp: 'night', bias: 0.5, shop: null },
  { x: 896, w: 64, floors: 2, style: 'brick', ramp: 'teal', bias: 0.2, shop: 'keys' },
];

const buildingTop = (b) => Math.max(4, GROUND_TOP - b.floors * FLOOR_H - 4);

function facadeFront(c, b, top) {
  const ramp = R[b.ramp];
  const h = FRONT_H - top;
  ditherRect(c, b.x, top, b.w, h, ramp, (i, j) => {
    const down = j / h;
    const edge = i < 2 ? 0.7 : i >= b.w - 2 ? -0.6 : 0;
    // Dark up top, warmer near the street where the neon bounces back.
    return clamp(0.9 + b.bias + down * 1.4 + edge, 0.1, 4);
  });
  fill(c, b.x, top, b.w, 4, ramp[1]);
  fill(c, b.x, top, b.w, 1, ramp[4]);
  fill(c, b.x, top + 4, b.w, 1, R.night[0], 160);
}

function brickTexture(c, x0, y0, w, h) {
  for (let y = y0; y < y0 + h; y++) {
    const row = Math.floor((y - y0) / 4);
    if ((y - y0) % 4 === 3) {
      for (let x = x0; x < x0 + w; x++) c.set(x, y, [...R.night[0], 70]);
      continue;
    }
    for (let x = x0 + (row % 2 ? 4 : 0); x < x0 + w; x += 8) c.set(x, y, [...R.night[0], 55]);
  }
}

function ledge(c, b, y) {
  const ramp = R[b.ramp];
  fill(c, b.x, y, b.w, 2, ramp[2]);
  fill(c, b.x, y, b.w, 1, ramp[4]);
  fill(c, b.x, y + 2, b.w, 1, R.night[0], 150);
}

/** A residential window: lit or dark, with whatever life is behind it. */
function frontWindow(c, x, y, w, h, r) {
  fill(c, x - 1, y - 1, w + 2, h + 2, R.night[0]);
  const roll = r();
  if (roll < 0.52) {
    const ramp = roll < 0.2 ? R.cyan : roll < 0.4 ? R.amber : R.violet;
    ditherRect(c, x, y, w, h, ramp, (i, j) => 2.5 - (j / h) * 1.2 - (i === 0 ? 0.4 : 0));
    const detail = r();
    if (detail < 0.28) {
      for (let j = 2; j < h; j += 3) fill(c, x, y + j, w, 1, ramp[0], 150); // blinds
    } else if (detail < 0.52) {
      fill(c, x, y, 4, h, R.night[1], 220); // curtains drawn back
      fill(c, x + w - 3, y, 3, h, R.night[1], 220);
    } else if (detail < 0.74) {
      const px = x + 3 + ((r() * Math.max(1, w - 8)) | 0); // somebody home
      fill(c, px + 1, y + 6, 3, 3, R.night[0]);
      fill(c, px, y + 9, 5, h - 9, R.night[0]);
    } else {
      fill(c, x + 2, y + h - 5, 5, 4, R.amber[0]); // a plant on the sill
      fill(c, x + 2, y + h - 9, 5, 4, R.green[1]);
      fill(c, x + 3, y + h - 11, 3, 2, R.green[2]);
    }
  } else {
    ditherRect(c, x, y, w, h, R.night, (_i, j) => 0.6 + (1 - j / h) * 0.9);
    for (let j = 0; j < h; j++) {
      const px = x + 2 + Math.round(j * 0.4);
      if (px < x + w) c.set(px, y + j, [...R.cyan[1], 70]);
    }
  }
  fill(c, x - 1, y + h + 1, w + 2, 1, R.concrete[3]);
  // water stains running down from the sill - the detail that sells "real"
  for (let s = 0; s < 3; s++) {
    const sx = x + 1 + ((r() * Math.max(1, w - 2)) | 0);
    const len = 4 + ((r() * 9) | 0);
    for (let j = 0; j < len; j++) c.set(sx, y + h + 2 + j, [...R.night[0], Math.max(0, 90 - j * 8)]);
  }
}

function acUnit(c, x, y) {
  fill(c, x, y, 12, 8, R.steel[0]);
  fill(c, x, y, 12, 1, R.steel[2]);
  for (let j = 0; j < 5; j += 2) fill(c, x + 1, y + 2 + j, 6, 1, R.night[1]);
  fill(c, x + 8, y + 2, 3, 4, R.night[1]);
  for (let j = 0; j < 5; j++) c.set(x + 2, y + 8 + j, [...R.night[0], 110 - j * 20]);
}

function windowRow(c, b, y, w, h, r, withAc = false) {
  const n = Math.max(1, Math.floor((b.w - 10) / 26));
  const gap = (b.w - n * w) / (n + 1);
  for (let k = 0; k < n; k++) {
    const x = Math.round(b.x + gap + k * (w + gap));
    frontWindow(c, x, y, w, h, r);
    if (withAc && r() < 0.65) acUnit(c, x + w - 4, y + h + 3);
  }
}

function glassFloor(c, b, y0, r) {
  const lit = r() < 0.45;
  const ramp = lit ? (r() < 0.6 ? R.amber : R.cyan) : R.night;
  for (let x = b.x + 3; x < b.x + b.w - 3; x += 11) {
    const pw = Math.min(10, b.x + b.w - 3 - x);
    ditherRect(c, x, y0 + 3, pw, FLOOR_H - 8, ramp, (_i, j) =>
      lit ? 2.3 - j * 0.04 : 0.7 + (1 - j / (FLOOR_H - 8)) * 0.9,
    );
    if (!lit) {
      for (let j = 0; j < FLOOR_H - 8; j++) {
        const px = x + 1 + Math.round(j * 0.35);
        if (px < x + pw) c.set(px, y0 + 3 + j, [...R.cyan[1], 80]);
      }
    }
    fill(c, x + pw, y0 + 3, 1, FLOOR_H - 8, R.night[0]);
  }
  fill(c, b.x + 2, y0 + FLOOR_H - 5, b.w - 4, 3, R.night[1]);
  if (lit) {
    for (let k = 0; k < 3; k++) {
      const px = b.x + 8 + ((r() * (b.w - 20)) | 0);
      fill(c, px, y0 + 12, 3, 3, R.night[0]);
      fill(c, px - 1, y0 + 15, 5, 9, R.night[0]);
    }
  }
}

function balconyFloor(c, b, y0, r) {
  windowRow(c, b, y0 + 5, 14, 16, r);
  const slab = y0 + FLOOR_H - 6;
  fill(c, b.x + 4, slab, b.w - 8, 2, R.concrete[3]);
  fill(c, b.x + 4, slab + 2, b.w - 8, 1, R.night[0], 160);
  fill(c, b.x + 4, slab - 9, b.w - 8, 1, R.night[1]);
  for (let x = b.x + 4; x < b.x + b.w - 4; x += 3) fill(c, x, slab - 9, 1, 9, R.night[1], 230);
  // laundry on a line, and a couple of pot plants
  fill(c, b.x + 8, slab - 17, b.w - 30, 1, R.night[0], 200);
  const cloth = [R.magenta[1], R.steel[2], R.yellow[2], R.cyan[1], R.violet[2]];
  for (let k = 0; k < 4; k++) {
    const lx = b.x + 12 + k * 15 + ((r() * 4) | 0);
    fill(c, lx, slab - 16, 5, 6 + (k % 2) * 2, cloth[(k + ((r() * 3) | 0)) % cloth.length]);
  }
  for (let k = 0; k < 2; k++) {
    const px = b.x + b.w - 18 + k * 7;
    fill(c, px, slab - 4, 5, 4, R.amber[0]);
    fill(c, px - 1, slab - 9, 7, 5, R.green[1]);
    fill(c, px + 1, slab - 11, 3, 2, R.green[2]);
  }
}

function industrialFloor(c, b, y0, r) {
  for (let x = b.x + 18; x < b.x + b.w - 26; x += 18) {
    fill(c, x - 1, y0 + 5, 12, 12, R.night[0]);
    const lit = r() < 0.4;
    ditherRect(c, x, y0 + 6, 10, 10, lit ? R.cyan : R.night, (_i, j) => (lit ? 1.8 - j * 0.08 : 0.9));
    for (let k = 3; k < 10; k += 3) {
      fill(c, x + k, y0 + 6, 1, 10, R.night[0], 150);
      fill(c, x, y0 + 6 + k, 10, 1, R.night[0], 150);
    }
  }
  const dy = y0 + FLOOR_H - 10;
  fill(c, b.x, dy, b.w, 5, R.concrete[1]);
  fill(c, b.x, dy, b.w, 1, R.concrete[3]);
  for (let x = b.x + 6; x < b.x + b.w; x += 12) fill(c, x, dy, 1, 5, R.night[0]);
  const vx = b.x + b.w - 22;
  fill(c, vx, y0 + 5, 14, 12, R.night[1]);
  for (let j = 0; j < 10; j += 2) fill(c, vx + 1, y0 + 6 + j, 12, 1, R.concrete[2]);
}

/* -------------------------------------------------------- ground floors -- */

/** Each shop's opening, y 151-188, between a dark fascia band and the step. */
const SHOPS = {
  ramen(c, x0, x1, y0, y1, r) {
    const door = x1 - 26;
    ditherRect(c, x0 + 2, y0, door - x0 - 4, y1 - y0, R.amber, (_i, j) => 3 - j * 0.04);
    fill(c, x0 + 2, y0 + 22, door - x0 - 4, 3, R.night[0]);
    for (let x = x0 + 6; x < door - 6; x += 9) fill(c, x, y0 + 25, 3, y1 - y0 - 25, R.night[0], 220);
    fill(c, x0 + 14, y0 + 8, 4, 4, R.night[0]); // the cook
    fill(c, x0 + 12, y0 + 12, 8, 10, R.night[0]);
    fill(c, door, y0, 24, y1 - y0, R.amber[0]);
    for (let x = door + 1; x < door + 24; x += 5) fill(c, x, y0, 4, 13, R.magenta[1]); // noren
    for (const lx of [x0 + 8, door - 10]) {
      ditherRect(c, lx, y0 - 2, 6, 8, R.magenta, (_i, j) => 3 - Math.abs(j - 4) * 0.3);
      fill(c, lx + 2, y0 + 1, 2, 2, R.amber[4]);
    }
  },
  repair(c, x0, x1, y0, y1, r) {
    for (let j = 0; j < 15; j++) fill(c, x0 + 2, y0 + j, x1 - x0 - 4, 1, j % 2 ? R.concrete[1] : R.concrete[2]);
    ditherRect(c, x0 + 2, y0 + 15, x1 - x0 - 4, y1 - y0 - 15, R.cyan, (_i, j) => 1.8 - j * 0.05);
    for (let k = 0; k < 6; k++) {
      const sx = x0 + 6 + ((r() * (x1 - x0 - 16)) | 0);
      fill(c, sx, y0 + 18 + ((r() * 10) | 0), 6, 4, k % 2 ? R.lime[3] : R.cyan[4]);
    }
    fill(c, x0 + 2, y1 - 6, x1 - x0 - 4, 6, R.night[1]);
    fill(c, x0 + 30, y0 + 20, 4, 4, R.night[0]);
    fill(c, x0 + 28, y0 + 24, 8, 12, R.night[0]);
  },
  mart(c, x0, x1, y0, y1, r) {
    ditherRect(c, x0 + 2, y0, x1 - x0 - 4, y1 - y0, R.steel, (_i, j) => 3.6 - j * 0.04);
    const colours = [R.magenta, R.lime, R.amber, R.cyan, R.yellow, R.violet];
    for (const sy of [y0 + 8, y0 + 18, y0 + 28]) {
      fill(c, x0 + 4, sy + 4, x1 - x0 - 30, 1, R.night[2]);
      for (let x = x0 + 5; x < x1 - 28; x += 3) fill(c, x, sy, 2, 4, colours[((x * 7 + sy) >> 2) % colours.length][2]);
    }
    const dx = x1 - 24;
    fill(c, dx, y0, 20, y1 - y0, R.night[0]);
    ditherRect(c, dx + 1, y0 + 1, 18, y1 - y0 - 1, R.steel, () => 3.2);
    fill(c, dx + 9, y0 + 1, 1, y1 - y0 - 1, R.night[0]);
    fill(c, dx + 3, y0 + 18, 14, 1, R.green[3]);
    ditherRect(c, x0 + 2, y0, 6, y1 - y0, R.cyan, () => 3.4); // the drinks fridge
  },
  bar(c, x0, x1, y0, y1, r) {
    ditherRect(c, x0 + 2, y0, x1 - x0 - 4, y1 - y0, R.violet, (_i, j) => 1.6 - j * 0.03);
    for (const sy of [y0 + 6, y0 + 14]) {
      fill(c, x0 + 6, sy + 5, x1 - x0 - 40, 1, R.amber[1]);
      for (let x = x0 + 7; x < x1 - 36; x += 3) fill(c, x, sy + ((x >> 2) % 2), 1, 5 - ((x >> 2) % 2), [R.amber, R.green, R.cyan][(x >> 1) % 3][3]);
    }
    const dx = x1 - 26;
    fill(c, dx, y0, 22, y1 - y0, R.amber[0]);
    fill(c, dx, y0, 22, 1, R.amber[1]);
    for (let y = -6; y <= 6; y++) {
      for (let x = -6; x <= 6; x++) {
        if (x * x + y * y <= 36) c.set(dx + 11 + x, y0 + 12 + y, [...R.magenta[x * x + y * y > 20 ? 1 : 3], 255]);
      }
    }
  },
  garage(c, x0, x1, y0, y1, r) {
    for (let j = 0; j < y1 - y0; j++) fill(c, x0 + 2, y0 + j, x1 - x0 - 26, 1, j % 2 ? R.concrete[1] : R.concrete[2]);
    const tags = [R.lime[3], R.magenta[3], R.cyan[3]];
    for (let k = 0; k < 3; k++) {
      const gx = x0 + 10 + k * 22;
      for (let i = 0; i < 18; i++) {
        c.set(gx + i, y0 + 14 + Math.round(Math.sin(i * 0.7 + k) * 4), [...tags[k], 220]);
        c.set(gx + i, y0 + 15 + Math.round(Math.sin(i * 0.7 + k) * 4), [...tags[k], 140]);
      }
    }
    for (let x = x0 + 2; x < x1 - 24; x++) fill(c, x, y1 - 5, 1, 4, ((x >> 2) % 2 ? R.amber : R.night)[2]);
    fill(c, x1 - 20, y0 + 6, 16, y1 - y0 - 6, R.night[1]);
    fill(c, x1 - 8, y0 + 20, 2, 3, R.amber[3]);
  },
  clinic(c, x0, x1, y0, y1, r) {
    ditherRect(c, x0 + 2, y0, x1 - x0 - 4, y1 - y0, R.steel, (_i, j) => 3.2 - j * 0.03);
    fill(c, x0 + 8, y0 + 24, x1 - x0 - 50, 3, R.steel[1]);
    fill(c, x0 + 20, y0 + 12, 4, 4, R.night[1]);
    fill(c, x0 + 18, y0 + 16, 8, 8, R.cyan[1]);
    const dx = x1 - 30;
    fill(c, dx, y0, 26, y1 - y0, R.night[0]);
    ditherRect(c, dx + 1, y0 + 1, 24, y1 - y0 - 1, R.cyan, () => 2.6);
    fill(c, dx + 12, y0 + 1, 1, y1 - y0 - 1, R.night[0]);
  },
  keys(c, x0, x1, y0, y1, r) {
    ditherRect(c, x0 + 2, y0, x1 - x0 - 4, y1 - y0, R.amber, (_i, j) => 2.4 - j * 0.04);
    for (let x = x0 + 6; x < x1 - 6; x += 4) {
      fill(c, x, y0 + 4, 1, 4 + ((x >> 2) % 3) * 2, R.amber[4]);
    }
    fill(c, x0 + 6, y1 - 10, x1 - x0 - 12, 10, R.night[1]);
  },
};

function groundFloor(c, b, r) {
  const x0 = b.x + 3;
  const x1 = b.x + b.w - 3;
  const fy = GROUND_TOP + 2;
  fill(c, x0, fy, x1 - x0, 9, R.night[0]); // fascia - signs go here
  fill(c, x0, fy + 9, x1 - x0, 1, R.concrete[3]);
  fill(c, x0, fy + 10, x1 - x0, FRONT_H - fy - 12, R.night[0]);
  SHOPS[b.shop](c, x0, x1, fy + 11, FRONT_H - 2, r);
  fill(c, b.x, FRONT_H - 2, b.w, 2, R.concrete[2]);
}

/* -------------------------------------------------------------- rooftops -- */

function rooftop(c, b, top, r) {
  if (b.style !== 'shophouse' && b.style !== 'balcony' && b.style !== 'brick') return;
  const tx = b.x + 10 + ((r() * Math.max(1, b.w - 40)) | 0);
  // water tank on legs
  fill(c, tx, top - 16, 16, 11, R.concrete[2]);
  fill(c, tx, top - 16, 16, 1, R.concrete[4]);
  fill(c, tx + 2, top - 5, 2, 5, R.night[1]);
  fill(c, tx + 12, top - 5, 2, 5, R.night[1]);
  // antenna with an aircraft light
  const ax = b.x + b.w - 12;
  fill(c, ax, top - 24, 1, 24, R.night[2]);
  fill(c, ax - 3, top - 18, 7, 1, R.night[2]);
  fill(c, ax - 2, top - 12, 5, 1, R.night[2]);
  c.set(ax, top - 25, [...R.magenta[3], 255]);
  if (b.style === 'shophouse') {
    fill(c, b.x + 4, top - 10, 18, 10, R.concrete[1]); // stair head
    fill(c, b.x + 10, top - 7, 5, 7, R.night[0]);
    fill(c, b.x + 40, top - 6, 8, 1, R.night[2]); // satellite dish
    fill(c, b.x + 41, top - 5, 6, 1, R.night[1]);
    fill(c, b.x + 43, top - 4, 1, 4, R.night[1]);
  }
}

/* ------------------------------------------------------------ assembly --- */

function drawBuilding(c, b, r) {
  const top = buildingTop(b);
  facadeFront(c, b, top);
  if (b.style === 'brick') brickTexture(c, b.x, top + 5, b.w, GROUND_TOP - top - 5);

  for (let k = 1; k <= b.floors; k++) {
    const y0 = GROUND_TOP - k * FLOOR_H + 2;
    if (y0 < top + 4) continue;
    switch (b.style) {
      case 'glass':
        glassFloor(c, b, y0, r);
        break;
      case 'balcony':
        balconyFloor(c, b, y0, r);
        break;
      case 'industrial':
        industrialFloor(c, b, y0, r);
        break;
      case 'apartment':
        windowRow(c, b, y0 + 5, 14, 17, r, true);
        break;
      case 'cafe':
        // only the floors above the cafe front show; its cornice starts at y 68
        if (y0 + 22 < 68) windowRow(c, b, y0 + 5, 16, 17, r);
        break;
      default:
        windowRow(c, b, y0 + 5, 14, 18, r);
    }
    ledge(c, b, GROUND_TOP - k * FLOOR_H);
  }

  if (b.style === 'brick') {
    // fire escape down the right-hand side
    const fx = b.x + b.w - 34;
    for (let k = 1; k <= b.floors; k++) {
      const y = GROUND_TOP - (k - 1) * FLOOR_H - 4;
      fill(c, fx, y, 30, 1, R.night[0]);
      fill(c, fx, y - 7, 30, 1, R.night[1]);
      for (let x = fx; x < fx + 30; x += 3) fill(c, x, y - 7, 1, 7, R.night[1]);
      for (let j = 0; j < FLOOR_H - 8; j += 3) fill(c, fx + 24, y - 4 - j - 7, 5, 1, R.night[1]);
    }
  }
  if (b.style === 'industrial') {
    for (const px of [b.x + 5, b.x + 9]) {
      fill(c, px, buildingTop(b) + 5, 2, GROUND_TOP - top - 5, R.concrete[2]);
      fill(c, px, buildingTop(b) + 5, 1, GROUND_TOP - top - 5, R.concrete[4]);
    }
    for (let x = b.x; x < b.x + b.w; x++) fill(c, x, top + 5, 1, 4, ((x >> 2) % 2 ? R.amber : R.night)[2]);
  }
  if (b.style === 'cafe') {
    for (let j = top + 6; j < 60; j++) dither(c, b.x + 6, j, j < 34 ? R.cyan : R.magenta, 3.3);
    fill(c, b.x, 60, b.w, 2, R.amber[2]);
  }
  if (b.shop) groundFloor(c, b, r);
  // drainpipe down the right edge
  fill(c, b.x + b.w - 3, top + 5, 2, GROUND_TOP - top - 5, R.night[1]);
  for (let y = top + 12; y < GROUND_TOP; y += 16) fill(c, b.x + b.w - 4, y, 4, 1, R.night[2]);
  rooftop(c, b, top, r);
}

/** Wires draped from building to building across the facades. */
const WIRES = [
  { x0: 30, x1: 150, y: 76, sag: 10 },
  { x0: 96, x1: 262, y: 100, sag: 14 },
  { x0: 300, x1: 470, y: 70, sag: 18 },
  { x0: 420, x1: 600, y: 112, sag: 12 },
  { x0: 580, x1: 760, y: 92, sag: 16 },
  { x0: 820, x1: 958, y: 54, sag: 10 },
];

function streetFront() {
  const c = new Px(FRONT_W, FRONT_H);
  const r = rng(1984);
  for (const b of FRONT) drawBuilding(c, b, r);
  for (const wire of WIRES) {
    for (let x = wire.x0; x <= wire.x1; x++) {
      const t = (x - wire.x0) / (wire.x1 - wire.x0);
      const y = Math.round(wire.y + wire.sag * 4 * t * (1 - t));
      c.set(x, y, [...R.night[0], 230]);
      c.set(x, y - 1, [...NEON[((x / 90) | 0) % NEON.length][1], 90]);
    }
  }
  return c;
}

/* ======================================================= sign hardware === */

/**
 * Nine-slice casings for mounted signs, 16x16 with 4px borders: frame 0 steel,
 * frame 1 brass. Corners carry the bolts; the flat face stretches cleanly.
 */
function signFrame() {
  const sheet = new Px(32, 16);
  const draw = (ox, casing, lit, bolt) => {
    fill(sheet, ox, 0, 16, 16, R.night[0]);
    fill(sheet, ox + 1, 1, 14, 14, casing);
    fill(sheet, ox + 1, 1, 14, 1, lit);
    fill(sheet, ox + 1, 1, 1, 14, lit);
    fill(sheet, ox + 1, 14, 14, 1, R.night[0], 200);
    fill(sheet, ox + 14, 1, 1, 14, R.night[0], 200);
    fill(sheet, ox + 3, 3, 10, 10, R.night[0]); // recessed face, shadowed lip
    fill(sheet, ox + 12, 3, 1, 10, lit, 120);
    fill(sheet, ox + 3, 12, 10, 1, lit, 120);
    fill(sheet, ox + 4, 4, 8, 8, R.night[0]);
    for (const [bx, by] of [
      [2, 2],
      [13, 2],
      [2, 13],
      [13, 13],
    ]) {
      sheet.set(ox + bx, by, [...bolt, 255]);
    }
  };
  draw(0, R.concrete[2], R.concrete[4], R.steel[2]);
  draw(16, R.amber[1], R.amber[3], R.amber[4]);
  return sheet;
}

/** A wall bracket for a projecting (blade) sign: plate on the wall, arm, brace. */
function signBracket() {
  const c = new Px(16, 16);
  const steel = R.night[2];
  const lit = R.night[4];
  fill(c, 0, 0, 2, 16, steel);
  fill(c, 0, 0, 1, 16, lit);
  fill(c, 2, 6, 14, 2, steel);
  fill(c, 2, 6, 14, 1, lit);
  for (let i = 0; i < 9; i++) c.set(2 + i, 14 - Math.round(i * 0.75), [...steel, 255]);
  outline(c, R.night[0]);
  return c;
}

/* ============================================================== flyers === */

const FLYER_W = 64;
const FLYER_H = 18;

/** Hover traffic in the sky lanes: a sedan, a flying taxi, a police spinner. */
function flyerFrame(kind) {
  const c = new Px(FLYER_W, FLYER_H);
  if (kind === 0) {
    for (let j = 0; j < 3; j++) ditherRect(c, 24 - j * 2, 5 + j, 18 + j * 4, 1, R.cyan, () => 1.8 - j * 0.3);
    fill(c, 12, 8, 44, 1, R.violet[3]);
    ditherRect(c, 6, 9, 54, 4, R.violet, (_i, j) => 1.9 - j * 0.3);
    fill(c, 58, 10, 4, 2, R.violet[1]);
    fill(c, 4, 10, 2, 3, R.violet[1]);
    fill(c, 8, 12, 50, 1, R.cyan[3]);
    fill(c, 10, 13, 46, 2, R.night[0]);
    fill(c, 14, 15, 7, 1, R.cyan[3]);
    fill(c, 44, 15, 7, 1, R.cyan[3]);
    fill(c, 60, 9, 2, 1, R.yellow[4]);
    fill(c, 3, 10, 2, 1, R.magenta[3]);
  } else if (kind === 1) {
    ditherRect(c, 4, 4, 54, 10, R.yellow, (_i, j) => 3.2 - j * 0.15);
    ditherRect(c, 46, 5, 9, 4, R.cyan, () => 1.6);
    for (let x = 10; x < 44; x += 9) fill(c, x, 5, 7, 3, R.night[2]);
    for (let x = 4; x < 58; x += 2) fill(c, x, 10, 1, 1, R.night[0]); // checker stripe
    fill(c, 24, 2, 8, 2, R.yellow[4]); // roof light
    fill(c, 6, 14, 48, 1, R.night[0]);
    fill(c, 10, 15, 8, 1, R.amber[3]);
    fill(c, 42, 15, 8, 1, R.amber[3]);
    fill(c, 58, 9, 2, 2, R.yellow[4]);
    fill(c, 3, 8, 1, 3, R.magenta[3]);
  } else {
    for (let j = 0; j < 3; j++) ditherRect(c, 22 - j * 2, 6 + j, 20 + j * 4, 1, R.night, () => 2.5);
    ditherRect(c, 6, 9, 54, 3, R.steel, (_i, j) => 3.4 - j * 0.4);
    ditherRect(c, 6, 12, 54, 2, R.night, () => 1);
    fill(c, 26, 4, 6, 2, R.magenta[3]);
    fill(c, 32, 4, 6, 2, R.cyan[3]);
    fill(c, 10, 14, 44, 1, R.night[0]);
    fill(c, 13, 15, 8, 1, R.cyan[3]);
    fill(c, 43, 15, 8, 1, R.cyan[3]);
    fill(c, 59, 10, 2, 1, R.yellow[4]);
    fill(c, 3, 10, 2, 1, R.magenta[3]);
  }
  outline(c, R.night[0]);
  return c;
}

function flyers() {
  const sheet = new Px(FLYER_W * 3, FLYER_H);
  for (let k = 0; k < 3; k++) blit(sheet, flyerFrame(k), k * FLYER_W, 0);
  return sheet;
}

/** Distant versions for the far lane: barely more than a body and two lights. */
function flyersFar() {
  const sheet = new Px(20 * 3, 6);
  const bodies = [R.night[3], R.yellow[1], R.steel[1]];
  for (let k = 0; k < 3; k++) {
    const ox = k * 20;
    fill(sheet, ox + 2, 2, 15, 2, bodies[k]);
    fill(sheet, ox + 7, 1, 6, 1, R.cyan[1]);
    fill(sheet, ox + 17, 2, 1, 1, R.yellow[4]);
    fill(sheet, ox + 1, 2, 1, 1, R.magenta[3]);
    fill(sheet, ox + 5, 4, 3, 1, R.cyan[2]);
    fill(sheet, ox + 12, 4, 3, 1, R.cyan[2]);
    if (k === 2) {
      sheet.set(ox + 9, 0, [...R.magenta[3], 255]);
      sheet.set(ox + 10, 0, [...R.cyan[3], 255]);
    }
  }
  return sheet;
}

/* ============================================================= traffic === */

const CAR_W = 88;
const CAR_H = 30;

/** Road hover cars, facing right: a sedan, a wedge pickup, a low sports car. */
function carFrame(kind) {
  const c = new Px(CAR_W, CAR_H);
  if (kind === 0) {
    for (let j = 0; j < 5; j++) ditherRect(c, 30 - j * 3, 7 + j, 30 + j * 6, 1, R.cyan, () => 1.4 - j * 0.15);
    fill(c, 28, 7, 30, 1, R.cyan[3]);
    ditherRect(c, 6, 12, 78, 9, R.violet, (_i, j) => 2.2 - j * 0.18);
    fill(c, 8, 12, 74, 1, R.violet[4]);
    fill(c, 36, 13, 1, 7, R.violet[0]);
    fill(c, 58, 13, 1, 7, R.violet[0]);
    fill(c, 84, 14, 2, 5, R.violet[1]);
    fill(c, 82, 14, 4, 2, R.yellow[4]);
    fill(c, 4, 14, 3, 3, R.magenta[3]);
    fill(c, 8, 20, 74, 1, R.cyan[3]);
  } else if (kind === 1) {
    for (let x = 8; x <= 84; x++) {
      const topY = x < 46 ? 18 - Math.round(((x - 8) * 12) / 38) : 6 + Math.round(((x - 46) * 8) / 38);
      for (let y = topY; y <= 22; y++) dither(c, x, y, R.steel, 3 - (y - topY) * 0.12);
    }
    for (let x = 30; x < 64; x++) {
      const topY = x < 46 ? 18 - Math.round(((x - 8) * 12) / 38) : 6 + Math.round(((x - 46) * 8) / 38);
      fill(c, x, topY + 1, 1, 3, R.night[2]);
    }
    fill(c, 82, 13, 4, 1, R.steel[4]);
    fill(c, 7, 16, 4, 2, R.magenta[3]);
    fill(c, 10, 21, 72, 1, R.amber[2]);
  } else {
    for (let j = 0; j < 4; j++) ditherRect(c, 38 - j * 3, 10 + j, 22 + j * 6, 1, R.night, () => 2.6);
    ditherRect(c, 4, 14, 82, 8, R.magenta, (_i, j) => 2.3 - j * 0.2);
    fill(c, 6, 14, 78, 1, R.magenta[4]);
    fill(c, 4, 9, 10, 2, R.night[1]); // rear wing
    fill(c, 8, 11, 2, 3, R.night[1]);
    fill(c, 82, 16, 4, 2, R.yellow[4]);
    fill(c, 3, 16, 2, 3, R.magenta[4]);
    fill(c, 6, 21, 78, 1, R.magenta[3]);
  }
  // hover pods in place of wheels
  for (const px of [12, 60]) {
    fill(c, px, 22, 16, 3, R.night[1]);
    fill(c, px + 1, 25, 14, 1, kind === 2 ? R.magenta[3] : R.cyan[3]);
  }
  rimLight(c, R.cyan[2], -1, 70);
  outline(c, R.night[0]);
  return c;
}

function traffic() {
  const sheet = new Px(CAR_W * 3, CAR_H);
  for (let k = 0; k < 3; k++) blit(sheet, carFrame(k), k * CAR_W, 0);
  return sheet;
}

export { megacity, haze, streetFront, signFrame, signBracket, flyers, flyersFar, traffic };
