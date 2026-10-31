#!/usr/bin/env node
/**
 * Generates the placeholder pixel art for the intro street scene.
 *
 * Everything here is drawn procedurally - no third-party sprites - so there is
 * nothing to license and the scene looks like a city from the first run.
 * Real pixel packs replace these by dropping files with the same names and
 * dimensions into /public/assets/intro/ (see the README there).
 *
 *   npm run assets:intro
 */
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Buffer } from 'node:buffer';

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'assets', 'intro');

/* ---------------------------------------------------------------- png ----- */

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

/* ------------------------------------------------------------- drawing ---- */

const hex = (s) => [
  parseInt(s.slice(1, 3), 16),
  parseInt(s.slice(3, 5), 16),
  parseInt(s.slice(5, 7), 16),
];

const mix = (a, b, t) => [
  Math.round(a[0] + (b[0] - a[0]) * t),
  Math.round(a[1] + (b[1] - a[1]) * t),
  Math.round(a[2] + (b[2] - a[2]) * t),
];

/** Deterministic RNG so regenerating the assets never shuffles the city. */
function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

class Px {
  constructor(w, h) {
    this.w = w;
    this.h = h;
    this.d = new Uint8Array(w * h * 4);
  }

  set(x, y, c) {
    x |= 0;
    y |= 0;
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    const i = (y * this.w + x) * 4;
    const a = (c[3] === undefined ? 255 : c[3]) / 255;
    if (a <= 0) return;
    if (a >= 1) {
      this.d[i] = c[0];
      this.d[i + 1] = c[1];
      this.d[i + 2] = c[2];
      this.d[i + 3] = 255;
      return;
    }
    const da = this.d[i + 3] / 255;
    const oa = a + da * (1 - a);
    for (let k = 0; k < 3; k++) {
      this.d[i + k] = Math.round((c[k] * a + this.d[i + k] * da * (1 - a)) / oa);
    }
    this.d[i + 3] = Math.round(oa * 255);
  }

  rect(x, y, w, h, c) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, c);
  }

  png() {
    const stride = this.w * 4 + 1;
    const raw = Buffer.alloc(stride * this.h);
    for (let y = 0; y < this.h; y++) {
      raw[y * stride] = 0; // filter type: none
      Buffer.from(this.d.buffer, y * this.w * 4, this.w * 4).copy(raw, y * stride + 1);
    }
    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(this.w, 0);
    ihdr.writeUInt32BE(this.h, 4);
    ihdr[8] = 8; // bit depth
    ihdr[9] = 6; // colour type: RGBA
    return Buffer.concat([
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      chunk('IHDR', ihdr),
      chunk('IDAT', deflateSync(raw, { level: 9 })),
      chunk('IEND', Buffer.alloc(0)),
    ]);
  }
}

/* -------------------------------------------------------------- palette --- */

const C = {
  night: hex('#070912'),
  horizon: hex('#121a2e'),
  haze: hex('#2a1e3c'),
  far: hex('#0c1120'),
  farLit: hex('#1a2238'),
  mid: hex('#0a0f1c'),
  midFace: hex('#121a2c'),
  midEdge: hex('#1e2840'),
  accent: hex('#f5a35c'),
  cyan: hex('#54e8e0'),
  magenta: hex('#ff5fa2'),
  violet: hex('#8b6cff'),
  lime: hex('#b6f34b'),
  walk: hex('#161c2a'),
  walkTop: hex('#2a3348'),
  road: hex('#0a0d16'),
};

/* --------------------------------------------------------------- layers --- */

function sky() {
  const c = new Px(480, 270);
  const r = rng(7);
  for (let y = 0; y < 270; y++) {
    const t = Math.min(1, y / 200);
    c.rect(0, y, 480, 1, [...mix(C.night, C.horizon, t * t), 255]);
  }
  for (let y = 150; y < 270; y++) {
    c.rect(0, y, 480, 1, [...C.haze, Math.round(((y - 150) / 120) * 70)]);
  }
  for (let i = 0; i < 150; i++) {
    const x = (r() * 480) | 0;
    const y = (r() * 175) | 0;
    const a = 40 + ((r() * 170) | 0);
    c.set(x, y, [220, 230, 255, a]);
    if (r() > 0.9) c.set(x + 1, y, [220, 230, 255, (a * 0.35) | 0]);
  }
  return c;
}

function skyline() {
  const c = new Px(480, 110);
  const r = rng(21);
  let x = 0;
  while (x < 480) {
    let w = 14 + ((r() * 26) | 0);
    if (x + w > 480) w = 480 - x;
    const h = 24 + ((r() * 74) | 0);
    const top = 110 - h;
    c.rect(x, top, w, h, [...C.far, 255]);
    c.rect(x, top, w, 1, [...C.farLit, 180]);
    if (r() > 0.78 && w > 8) {
      const ax = x + ((w / 2) | 0);
      c.rect(ax, top - 6, 1, 6, [...C.far, 255]);
      c.set(ax, top - 7, [...C.magenta, 200]);
    }
    for (let wy = top + 3; wy < 108; wy += 4) {
      for (let wx = x + 2; wx < x + w - 1; wx += 3) {
        if (r() > 0.72) {
          c.set(wx, wy, [...(r() > 0.5 ? C.cyan : C.accent), 70 + ((r() * 90) | 0)]);
        }
      }
    }
    x += w;
  }
  return c;
}

function buildings() {
  const c = new Px(480, 170);
  const r = rng(99);
  let x = 0;
  while (x < 480) {
    let w = 40 + ((r() * 52) | 0);
    if (480 - (x + w) < 28) w = 480 - x;
    if (w <= 0) break;
    const h = 70 + ((r() * 98) | 0);
    const top = 170 - h;

    c.rect(x, top, w, h, [...C.mid, 255]);
    c.rect(x + 1, top + 1, w - 2, h - 1, [...C.midFace, 255]);
    c.rect(x, top, w, 1, [...C.midEdge, 255]);
    c.rect(x, top, 1, h, [...C.midEdge, 120]);
    c.rect(x + w - 1, top, 1, h, [0, 0, 0, 120]);

    for (let wy = top + 4; wy < 167; wy += 6) {
      for (let wx = x + 3; wx < x + w - 3; wx += 5) {
        const on = r();
        if (on > 0.55) {
          const col = on > 0.85 ? C.accent : on > 0.7 ? C.cyan : C.farLit;
          c.rect(wx, wy, 3, 3, [...col, 90 + ((r() * 110) | 0)]);
        } else {
          c.rect(wx, wy, 3, 3, [8, 12, 22, 255]);
        }
      }
    }

    if (r() > 0.5) {
      const col = [C.cyan, C.magenta, C.violet, C.lime][(r() * 4) | 0];
      const sx = x + 2 + ((r() * Math.max(1, w - 6)) | 0);
      const sh = (h * 0.55) | 0;
      c.rect(sx, top + 6, 1, sh, [...col, 230]);
      c.rect(sx - 1, top + 6, 1, sh, [...col, 60]);
      c.rect(sx + 1, top + 6, 1, sh, [...col, 60]);
    }

    if (w > 50) {
      const bw = 10 + ((r() * 14) | 0);
      c.rect(x + 6, top - 5, bw, 5, [...C.mid, 255]);
      c.rect(x + 6, top - 5, bw, 1, [...C.midEdge, 200]);
    }
    x += w;
  }
  return c;
}

function street() {
  const c = new Px(480, 80);
  c.rect(0, 0, 480, 16, [...C.walk, 255]);
  c.rect(0, 0, 480, 1, [...C.walkTop, 255]);
  for (let x = 0; x < 480; x += 12) c.rect(x, 1, 1, 15, [10, 14, 24, 160]);
  c.rect(0, 16, 480, 2, [6, 9, 16, 255]);
  c.rect(0, 18, 480, 62, [...C.road, 255]);

  for (let y = 18; y < 80; y++) {
    const a = Math.round(10 + 22 * Math.sin((y - 18) / 10));
    if (a > 0) c.rect(0, y, 480, 1, [40, 60, 96, a]);
  }

  // Wet-street reflections. The period divides 480 so the tile seam is invisible.
  const cols = [C.cyan, C.magenta, C.accent, C.violet];
  for (let i = 0; i < 10; i++) {
    const x = (i * 48 + 6) % 480;
    const col = cols[i % 4];
    for (let y = 20; y < 76; y++) {
      const a = Math.max(0, 58 - (y - 20) * 1.1) | 0;
      c.rect(x, y, 2, 1, [...col, a]);
    }
  }

  for (let x = 0; x < 480; x += 48) c.rect(x, 52, 24, 1, [...C.accent, 70]);
  return c;
}

/* --------------------------------------------------------------- player --- */

const P = {
  out: hex('#05070c'),
  hair: hex('#15161f'),
  skin: hex('#e2ae86'),
  coat: hex('#243253'),
  coatHi: hex('#33446e'),
  trim: hex('#f5a35c'),
  pants: hex('#1a2234'),
  shoe: hex('#0a0d14'),
};

/** frame -1 = idle, 0..5 = walk cycle. Sprite is 16x24, feet on the last row. */
function drawPlayer(c, ox, frame) {
  const bob = frame < 0 ? 0 : [0, -1, 0, 0, -1, 0][frame];
  const swing = frame < 0 ? 0 : [-2, -1, 0, 2, 1, 0][frame];
  const put = (x, y, col) => c.set(ox + x, y + bob, col);
  const rect = (x, y, w, h, col) => {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) put(x + i, y + j, col);
  };

  // legs first so the coat overlaps the hips
  const back = Math.round(-swing * 0.8);
  const front = Math.round(swing * 0.8);
  rect(5 + back, 17, 3, 5, [...P.pants, 255]);
  rect(4 + back, 22, 5, 2, [...P.shoe, 255]);
  rect(8 + front, 17, 3, 5, [...P.pants, 255]);
  rect(8 + front, 22, 5, 2, [...P.shoe, 255]);

  // torso
  rect(4, 9, 9, 9, [...P.coat, 255]);
  rect(5, 10, 4, 7, [...P.coatHi, 255]);
  rect(4, 9, 9, 1, [...P.trim, 255]);
  rect(12, 9, 1, 9, [...P.trim, 110]);

  // head
  rect(5, 2, 7, 7, [...P.skin, 255]);
  rect(5, 1, 7, 3, [...P.hair, 255]);
  rect(4, 2, 1, 5, [...P.hair, 255]);
  put(10, 5, [...P.out, 255]);

  // swinging front arm
  const arm = Math.max(0, swing);
  rect(12, 10 + arm, 2, 5, [...P.coat, 255]);
  put(13, 15 + arm, [...P.skin, 255]);
}

function playerIdle() {
  const c = new Px(16, 24);
  drawPlayer(c, 0, -1);
  return c;
}

function playerWalk() {
  const c = new Px(96, 24);
  for (let f = 0; f < 6; f++) drawPlayer(c, f * 16, f);
  return c;
}

/* ----------------------------------------------------------------- shop --- */

function shop() {
  const W = 160;
  const H = 120;
  const c = new Px(W, H);
  const wall = hex('#141b2c');
  const wallHi = hex('#20293f');
  const dark = hex('#0a0e18');

  c.rect(5, 18, W - 10, H - 18, [...wall, 255]);
  c.rect(5, 18, W - 10, 1, [...wallHi, 255]);
  c.rect(5, 18, 1, H - 18, [...wallHi, 160]);
  c.rect(W - 6, 18, 1, H - 18, [0, 0, 0, 140]);

  // cornice
  c.rect(0, 10, W, 9, [...dark, 255]);
  c.rect(0, 10, W, 1, [...C.accent, 120]);

  // sign board, 140 wide - Phaser draws BROWSER_NAME on top of this
  c.rect(10, 24, 140, 22, [8, 11, 19, 255]);
  c.rect(10, 24, 140, 1, [...C.accent, 200]);
  c.rect(10, 45, 140, 1, [...C.accent, 90]);

  // awning
  for (let i = 0; i < W; i += 8) c.rect(i, 48, 4, 7, [...C.accent, 150]);
  c.rect(0, 48, W, 1, [...C.accent, 200]);

  // windows, warm inside - the first hint of the calm interior
  for (const wx of [12, 108]) {
    c.rect(wx, 60, 40, 38, [...dark, 255]);
    c.rect(wx + 2, 62, 36, 34, [...C.accent, 38]);
    c.rect(wx + 2, 62, 36, 1, [...C.accent, 90]);
    c.rect(wx + 19, 60, 1, 38, [6, 9, 16, 255]);
    c.rect(wx, 78, 40, 1, [6, 9, 16, 255]);
  }

  // door recess - door.png sits here, centred and bottom aligned
  c.rect(68, 80, 24, 40, [5, 7, 12, 255]);
  c.rect(67, 79, 26, 1, [...C.accent, 120]);

  // steps either side of the door
  c.rect(54, 117, 14, 3, [...wallHi, 255]);
  c.rect(92, 117, 14, 3, [...wallHi, 255]);
  return c;
}

function door() {
  const c = new Px(24, 40);
  const panel = hex('#1b2235');
  const panelHi = hex('#2a3450');

  c.rect(0, 0, 24, 40, [...panel, 255]);
  c.rect(0, 0, 24, 1, [...panelHi, 255]);
  c.rect(0, 0, 1, 40, [...panelHi, 180]);
  c.rect(23, 0, 1, 40, [0, 0, 0, 160]);

  c.rect(4, 4, 16, 14, [...C.accent, 70]);
  c.rect(4, 4, 16, 1, [...C.accent, 180]);
  c.rect(11, 4, 1, 14, [10, 14, 22, 255]);

  c.rect(4, 22, 16, 14, [...panelHi, 120]);
  c.rect(19, 20, 2, 4, [...C.accent, 230]);
  return c;
}

/* ----------------------------------------------------------------- main --- */

const assets = {
  'sky.png': sky,
  'skyline.png': skyline,
  'buildings.png': buildings,
  'street.png': street,
  'player-idle.png': playerIdle,
  'player-walk.png': playerWalk,
  'shop.png': shop,
  'door.png': door,
};

mkdirSync(OUT_DIR, { recursive: true });
for (const [name, make] of Object.entries(assets)) {
  const img = make();
  writeFileSync(join(OUT_DIR, name), img.png());
  console.log('  ' + name.padEnd(18) + img.w + 'x' + img.h);
}
console.log('\n' + Object.keys(assets).length + ' placeholder assets written to public/assets/intro/');
