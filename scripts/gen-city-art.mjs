#!/usr/bin/env node
/**
 * Draws the intro city.
 *
 * Every pixel in /public/assets/intro/ comes out of this file - there is no
 * third-party art in the project, nothing to license and nothing to credit.
 *
 * What makes it read as pixel art rather than as a rendered gradient:
 *   - a fixed palette of 5-step ramps, with every colour snapped to one of them
 *   - ordered (Bayer 8x8) dithering wherever a value crosses between two steps
 *   - buildings assembled from hand-authored archetypes, not random rectangles
 *   - characters drawn, then rim-lit from the right, then outlined
 *
 *   npm run assets:intro
 */
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Buffer } from 'node:buffer';

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'assets', 'intro');

/* ================================================================== png === */

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

  alphaAt(x, y) {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return 0;
    return this.d[(y * this.w + x) * 4 + 3];
  }

  rect(x, y, w, h, c) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, c);
  }

  png() {
    const stride = this.w * 4 + 1;
    const raw = Buffer.alloc(stride * this.h);
    for (let y = 0; y < this.h; y++) {
      raw[y * stride] = 0;
      Buffer.from(this.d.buffer, y * this.w * 4, this.w * 4).copy(raw, y * stride + 1);
    }
    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(this.w, 0);
    ihdr.writeUInt32BE(this.h, 4);
    ihdr[8] = 8;
    ihdr[9] = 6;
    return Buffer.concat([
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      chunk('IHDR', ihdr),
      chunk('IDAT', deflateSync(raw, { level: 9 })),
      chunk('IEND', Buffer.alloc(0)),
    ]);
  }
}

/* ============================================================== palette === */

const hex = (s) => [
  parseInt(s.slice(1, 3), 16),
  parseInt(s.slice(3, 5), 16),
  parseInt(s.slice(5, 7), 16),
];

/** Five-step ramps. Nothing in this file uses a colour outside them. */
const R = {
  night: ['#05060d', '#080b16', '#0c1120', '#121a2e', '#1b2540'].map(hex),
  concrete: ['#0a0e18', '#141b2c', '#1e2840', '#2a3450', '#3a4668'].map(hex),
  amber: ['#6b3f18', '#a8651f', '#d98a3a', '#f5a35c', '#ffd3a0'].map(hex),
  cyan: ['#0f4a52', '#1a8a93', '#2fc9c9', '#54e8e0', '#a8fff8'].map(hex),
  magenta: ['#5c1335', '#a3245c', '#e03d84', '#ff5fa2', '#ffb0cf'].map(hex),
  violet: ['#2a1f52', '#4a3a96', '#6d56d6', '#8b6cff', '#c4b5ff'].map(hex),
  lime: ['#2f4a12', '#5e8a1f', '#8fc433', '#b6f34b', '#daff9a'].map(hex),
  skin: ['#8a5a3c', '#b07a52', '#d49a6e', '#e8b88c', '#ffd9b5'].map(hex),
};

const NEON = [R.cyan, R.magenta, R.violet, R.lime];

/** Bayer 8x8, normalised. This is what turns a gradient into pixel art. */
const BAYER = [
  [0, 32, 8, 40, 2, 34, 10, 42],
  [48, 16, 56, 24, 50, 18, 58, 26],
  [12, 44, 4, 36, 14, 46, 6, 38],
  [60, 28, 52, 20, 62, 30, 54, 22],
  [3, 35, 11, 43, 1, 33, 9, 41],
  [51, 19, 59, 27, 49, 17, 57, 25],
  [15, 47, 7, 39, 13, 45, 5, 37],
  [63, 31, 55, 23, 61, 29, 53, 21],
].map((row) => row.map((v) => (v + 0.5) / 64));

const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);

/**
 * Paint one pixel at a fractional position `t` along a ramp, dithering between
 * the two neighbouring steps instead of blending them.
 */
function dither(c, x, y, ramp, t, alpha = 255) {
  const v = clamp(t, 0, ramp.length - 1);
  const lo = Math.floor(v);
  const frac = v - lo;
  const idx = frac > BAYER[y & 7][x & 7] ? Math.min(ramp.length - 1, lo + 1) : lo;
  c.set(x, y, [...ramp[idx], alpha]);
}

function ditherRect(c, x, y, w, h, ramp, fn, alpha = 255) {
  for (let j = 0; j < h; j++) {
    for (let i = 0; i < w; i++) {
      dither(c, x + i, y + j, ramp, fn(i, j), alpha);
    }
  }
}

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

/* =========================================================== sprite help === */

/** Dark keyline around the silhouette - reads as drawn rather than rendered. */
function outline(c, color) {
  const src = new Uint8Array(c.d);
  const on = (x, y) => {
    if (x < 0 || y < 0 || x >= c.w || y >= c.h) return false;
    return src[(y * c.w + x) * 4 + 3] > 40;
  };
  for (let y = 0; y < c.h; y++) {
    for (let x = 0; x < c.w; x++) {
      if (on(x, y)) continue;
      if (on(x - 1, y) || on(x + 1, y) || on(x, y - 1) || on(x, y + 1)) {
        c.set(x, y, [...color, 255]);
      }
    }
  }
}

/** Catch-light down the edge facing the shop. Call before outline(). */
function rimLight(c, color, side = 1, alpha = 165) {
  const src = new Uint8Array(c.d);
  const on = (x, y) => {
    if (x < 0 || y < 0 || x >= c.w || y >= c.h) return false;
    return src[(y * c.w + x) * 4 + 3] > 40;
  };
  for (let y = 0; y < c.h; y++) {
    for (let x = 0; x < c.w; x++) {
      if (on(x, y) && !on(x + side, y)) c.set(x, y, [...color, alpha]);
    }
  }
}

function blit(dst, src, ox, oy) {
  for (let y = 0; y < src.h; y++) {
    for (let x = 0; x < src.w; x++) {
      const i = (y * src.w + x) * 4;
      const a = src.d[i + 3];
      if (a === 0) continue;
      dst.set(ox + x, oy + y, [src.d[i], src.d[i + 1], src.d[i + 2], a]);
    }
  }
}

/* ================================================================== sky === */

const SKY_W = 480;
const SKY_H = 270;

function sky() {
  const c = new Px(SKY_W, SKY_H);
  const r = rng(1337);

  // Night gradient, dithered down the full height.
  ditherRect(c, 0, 0, SKY_W, SKY_H, R.night, (_i, j) => {
    const t = j / SKY_H;
    return 0.15 + Math.pow(t, 1.5) * 3.3;
  });

  // Stars, thinning out as the city glow rises.
  for (let i = 0; i < 220; i++) {
    const x = (r() * SKY_W) | 0;
    const y = (r() * 160) | 0;
    const fade = 1 - y / 180;
    if (r() > fade) continue;
    const bright = r();
    const a = Math.round((60 + bright * 170) * fade);
    c.set(x, y, [...R.night[4].map((v) => Math.min(255, v + 150)), a]);
    if (bright > 0.96) {
      // the occasional four-point sparkle
      c.set(x - 1, y, [...R.night[4], Math.round(a * 0.4)]);
      c.set(x + 1, y, [...R.night[4], Math.round(a * 0.4)]);
      c.set(x, y - 1, [...R.night[4], Math.round(a * 0.4)]);
      c.set(x, y + 1, [...R.night[4], Math.round(a * 0.4)]);
    }
  }

  // Low cloud bands lit from beneath by the city. Tileable: all the terms are
  // periodic over the full width.
  const bands = [
    { y: 96, h: 26, amp: 7, freq: 2, warmth: 0.35 },
    { y: 128, h: 30, amp: 5, freq: 3, warmth: 0.6 },
    { y: 158, h: 34, amp: 9, freq: 1, warmth: 0.95 },
  ];
  for (const band of bands) {
    for (let x = 0; x < SKY_W; x++) {
      const k = (x / SKY_W) * Math.PI * 2;
      const top =
        band.y + Math.sin(k * band.freq) * band.amp + Math.sin(k * (band.freq + 2) + 1.3) * 3;
      for (let j = 0; j < band.h; j++) {
        const y = Math.round(top + j);
        const depth = j / band.h;
        // Underside catches amber, the top stays cold.
        if (depth > 0.55) {
          dither(c, x, y, R.amber, 0.1 + (depth - 0.55) * 1.6, Math.round(70 * band.warmth));
        } else {
          dither(c, x, y, R.night, 2.4 + depth, 90);
        }
      }
    }
  }

  // City glow pushing up from the horizon.
  for (let y = 180; y < SKY_H; y++) {
    const t = (y - 180) / (SKY_H - 180);
    for (let x = 0; x < SKY_W; x++) {
      dither(c, x, y, R.amber, t * 0.9, Math.round(t * 46));
    }
  }
  return c;
}

/* ============================================================== skyline === */

const SKYLINE_H = 110;

function skyline() {
  const c = new Px(SKY_W, SKYLINE_H);
  const r = rng(4242);
  const widths = [38, 52, 30, 46, 64, 34, 58, 42, 50, 66];
  const heights = [62, 88, 48, 70, 100, 54, 82, 60, 74, 96];

  let x = 0;
  widths.forEach((w, n) => {
    const h = heights[n];
    const top = SKYLINE_H - h;

    // Distance haze: the base of every tower fades into the glow.
    ditherRect(c, x, top, w, h, R.night, (_i, j) => {
      const down = (top + j) / SKYLINE_H;
      return 1.1 + down * 1.5;
    });
    c.rect(x, top, w, 1, [...R.night[4], 170]);

    // Setbacks on the taller towers.
    if (h > 70) {
      const sw = Math.round(w * 0.45);
      const sh = 10 + ((r() * 14) | 0);
      ditherRect(c, x + ((w - sw) >> 1), top - sh, sw, sh, R.night, () => 1.4);
      c.rect(x + ((w - sw) >> 1), top - sh, sw, 1, [...R.night[4], 150]);
    }

    // Aircraft-warning mast.
    if (r() > 0.55) {
      const ax = x + ((w / 2) | 0);
      c.rect(ax, top - 9, 1, 9, [...R.night[1], 255]);
      c.set(ax, top - 10, [...R.magenta[3], 220]);
    }

    // Window pinpricks, sparse at this distance.
    for (let wy = top + 4; wy < SKYLINE_H - 2; wy += 4) {
      for (let wx = x + 2; wx < x + w - 1; wx += 3) {
        if (r() > 0.7) {
          const ramp = r() > 0.55 ? R.amber : R.cyan;
          c.set(wx, wy, [...ramp[2], 60 + ((r() * 120) | 0)]);
        }
      }
    }

    // One vertical neon spine per few towers.
    if (r() > 0.6) {
      const ramp = NEON[(r() * NEON.length) | 0];
      const sx = x + 2 + ((r() * (w - 4)) | 0);
      const sh = (h * 0.5) | 0;
      for (let j = 0; j < sh; j++) c.set(sx, top + 6 + j, [...ramp[2], 150]);
    }
    x += w;
  });
  return c;
}

/* ============================================================ buildings === */

const BUILD_H = 170;

/** Facade shading: lit from the left, darkening downward into the street. */
function facade(c, x, top, w, h, bias = 0) {
  ditherRect(c, x, top, w, h, R.concrete, (i, j) => {
    const across = i / w;
    const down = j / h;
    return clamp(2.9 + bias - across * 1.5 - down * 0.6, 0.15, 4);
  });
  c.rect(x, top, w, 1, [...R.concrete[4], 255]);
  c.rect(x, top, 1, h, [...R.concrete[4], 110]);
  c.rect(x + w - 1, top, 1, h, [...R.night[0], 150]);
}

function windows(c, x, w, top, bottom, r, { step = 11, cols = 10, lit = 0.52 } = {}) {
  for (let wy = top; wy < bottom - 10; wy += step) {
    for (let wx = x + 4; wx + 8 < x + w - 3; wx += cols) {
      c.rect(wx - 1, wy - 1, 9, 10, [...R.night[0], 255]);
      const roll = r();
      if (roll > 1 - lit) {
        const ramp = roll > 0.78 ? R.amber : r() > 0.5 ? R.cyan : R.violet;
        const level = 1.6 + r() * 1.4;
        ditherRect(c, wx, wy, 7, 8, ramp, (_i, j) => level - (j / 8) * 1.1);
        // somebody home
        if (r() > 0.84) c.rect(wx + 1 + ((r() * 3) | 0), wy + 3, 2, 5, [...R.night[0], 230]);
        // half-drawn curtain
        if (r() > 0.72) c.rect(wx, wy, 2 + ((r() * 2) | 0), 8, [...R.night[1], 210]);
      } else {
        c.rect(wx, wy, 7, 8, [...R.night[1], 255]);
        c.rect(wx, wy, 7, 2, [...R.night[3], 180]); // sky caught in the glass
      }
      c.rect(wx - 1, wy + 9, 9, 1, [...R.concrete[3], 255]); // sill
    }
  }
}

function fireEscape(c, x, w, top, bottom) {
  const steel = [...R.night[1], 255];
  const rail = [...R.night[2], 255];
  for (let fy = top + 24; fy < bottom - 12; fy += 22) {
    c.rect(x + 3, fy, w - 6, 1, steel); // platform
    c.rect(x + 3, fy + 1, w - 6, 1, [...R.night[0], 160]);
    c.rect(x + 3, fy - 7, w - 6, 1, rail); // handrail
    for (let rx = x + 3; rx < x + w - 3; rx += 3) c.rect(rx, fy - 7, 1, 7, rail);
    // ladder down to the next platform
    const lx = x + w - 9;
    for (let ly = fy + 2; ly < fy + 20; ly += 3) c.rect(lx, ly, 5, 1, steel);
    c.rect(lx, fy + 2, 1, 18, steel);
    c.rect(lx + 5, fy + 2, 1, 18, steel);
  }
}

function archTenement(c, x, w, h, r) {
  const top = BUILD_H - h;
  facade(c, x, top, w, h);
  c.rect(x - 1, top - 3, w + 2, 3, [...R.concrete[1], 255]); // cornice
  c.rect(x - 1, top - 3, w + 2, 1, [...R.concrete[4], 200]);
  windows(c, x, w, top + 8, BUILD_H, r, { step: 22, cols: 11, lit: 0.6 });
  fireEscape(c, x, w, top, BUILD_H);
  // rooftop water tank
  const tw = 14;
  c.rect(x + 8, top - 13, tw, 10, [...R.concrete[1], 255]);
  c.rect(x + 8, top - 13, tw, 1, [...R.concrete[3], 255]);
  for (let i = 0; i < 3; i++) c.rect(x + 9 + i * 5, top - 3, 2, 3, [...R.night[1], 255]);
}

function archTower(c, x, w, h, r) {
  const top = BUILD_H - h;
  facade(c, x, top, w, h, 0.3);
  // continuous vertical glazing instead of punched windows
  for (let sx = x + 4; sx + 3 < x + w - 3; sx += 8) {
    for (let sy = top + 6; sy < BUILD_H - 6; sy += 1) {
      const on = Math.sin((sy + sx) * 0.7) > -0.2 && r() > 0.12;
      if (on) dither(c, sx, sy, R.cyan, 0.9 + Math.sin(sy * 0.3) * 0.5, 120);
      c.set(sx + 3, sy, [...R.night[0], 200]);
    }
  }
  // vertical neon banner, stacked blocks reading as signage
  const bx = x + w - 12;
  c.rect(bx - 1, top + 10, 9, h - 26, [...R.night[0], 255]);
  for (let by = top + 13; by < BUILD_H - 20; by += 9) {
    const ramp = NEON[((by / 9) | 0) % NEON.length];
    ditherRect(c, bx, by, 7, 6, ramp, (i, j) => (i === 0 || j === 0 || i === 6 ? 1.4 : 3.2));
  }
  c.rect(x + ((w / 2) | 0), top - 12, 1, 12, [...R.night[1], 255]);
  c.set(x + ((w / 2) | 0), top - 13, [...R.magenta[3], 230]);
}

function archShopBlock(c, x, w, h, r) {
  const top = BUILD_H - h;
  facade(c, x, top, w, h, -0.2);
  windows(c, x, w, top + 8, BUILD_H - 42, r, { step: 16, cols: 12, lit: 0.45 });

  // ground floor: shutter bays and awnings
  const bayTop = BUILD_H - 40;
  c.rect(x + 2, bayTop - 2, w - 4, 2, [...R.concrete[0], 255]);
  for (let bx = x + 4; bx + 20 < x + w; bx += 24) {
    const lit = r() > 0.45;
    if (lit) {
      ditherRect(c, bx, bayTop, 20, 30, R.amber, (_i, j) => 2.4 - (j / 30) * 1.6);
      // shelving silhouettes inside
      c.rect(bx + 2, bayTop + 6, 16, 1, [...R.night[0], 220]);
      c.rect(bx + 2, bayTop + 14, 16, 1, [...R.night[0], 220]);
      c.rect(bx + 5, bayTop + 18, 4, 12, [...R.night[0], 200]);
    } else {
      // rolled-down shutter
      for (let j = 0; j < 30; j += 2) c.rect(bx, bayTop + j, 20, 1, [...R.concrete[1], 255]);
      for (let j = 1; j < 30; j += 2) c.rect(bx, bayTop + j, 20, 1, [...R.night[1], 255]);
    }
    // scalloped awning
    for (let i = 0; i < 20; i += 4) {
      const ramp = NEON[(bx + i) % NEON.length === 0 ? 0 : ((bx / 4 + i) | 0) % NEON.length];
      c.rect(bx + i, bayTop - 6, 4, 5, [...ramp[1], 220]);
      c.rect(bx + i, bayTop - 1, 4, 1, [...ramp[3], 180]);
    }
    c.rect(bx - 1, bayTop - 7, 22, 1, [...R.concrete[3], 255]);
  }

  // drainpipe
  const px = x + w - 5;
  c.rect(px, top + 4, 2, h - 6, [...R.night[1], 255]);
  for (let j = top + 10; j < BUILD_H; j += 18) c.rect(px - 1, j, 4, 2, [...R.night[2], 255]);
}

function archBillboard(c, x, w, h, r) {
  const top = BUILD_H - h;
  facade(c, x, top, w, h, 0.1);
  windows(c, x, w, top + 10, BUILD_H, r, { step: 14, cols: 11, lit: 0.4 });

  // rooftop frame with cross-bracing
  const bh = 30;
  const by = top - bh - 6;
  const ramp = NEON[(r() * NEON.length) | 0];
  c.rect(x + 4, by, w - 8, bh, [...R.night[0], 255]);
  ditherRect(c, x + 6, by + 2, w - 12, bh - 4, ramp, (i, j) => {
    const edge = i < 2 || j < 2 || i > w - 15 || j > bh - 7;
    return edge ? 3.4 : 1.1 + Math.sin(i * 0.4) * 0.5;
  });
  // horizontal text-like bars
  c.rect(x + 10, by + 9, w - 20, 3, [...R.night[0], 210]);
  c.rect(x + 10, by + 16, (w - 20) * 0.6, 3, [...R.night[0], 210]);
  // legs and braces
  for (const lx of [x + 8, x + w - 10]) c.rect(lx, by + bh, 2, 6, [...R.night[1], 255]);
  for (let i = 0; i < 6; i++) {
    c.set(x + 9 + i, by + bh + i, [...R.night[1], 255]);
    c.set(x + w - 10 - i, by + bh + i, [...R.night[1], 255]);
  }
  // satellite dishes
  for (const dx of [x + 16, x + w - 24]) {
    c.rect(dx, top - 5, 6, 1, [...R.night[2], 255]);
    c.rect(dx + 1, top - 4, 4, 1, [...R.night[1], 255]);
    c.rect(dx + 2, top - 3, 1, 3, [...R.night[1], 255]);
  }
}

function archVentBlock(c, x, w, h, r) {
  const top = BUILD_H - h;
  facade(c, x, top, w, h, -0.4);

  // big ducting running up the face
  const dx = x + 6;
  c.rect(dx, top + 6, 10, h - 8, [...R.concrete[1], 255]);
  c.rect(dx, top + 6, 1, h - 8, [...R.concrete[3], 255]);
  c.rect(dx + 9, top + 6, 1, h - 8, [...R.night[0], 255]);
  for (let j = top + 10; j < BUILD_H; j += 7) c.rect(dx, j, 10, 1, [...R.night[1], 200]);

  // barred windows
  for (let wy = top + 12; wy < BUILD_H - 14; wy += 20) {
    const wx = x + 22;
    c.rect(wx - 1, wy - 1, 14, 12, [...R.night[0], 255]);
    const ramp = r() > 0.6 ? R.lime : R.cyan;
    ditherRect(c, wx, wy, 12, 10, ramp, (_i, j) => 1.3 - (j / 10) * 0.8);
    for (let i = 0; i < 12; i += 3) c.rect(wx + i, wy, 1, 10, [...R.night[0], 255]);
  }

  // extractor fans
  for (const fy of [top + 20, top + 60]) {
    const fx = x + w - 18;
    c.rect(fx, fy, 12, 12, [...R.night[1], 255]);
    c.rect(fx + 1, fy + 1, 10, 10, [...R.night[0], 255]);
    c.rect(fx + 5, fy + 1, 2, 10, [...R.night[2], 255]);
    c.rect(fx + 1, fy + 5, 10, 2, [...R.night[2], 255]);
  }

  // a splash of paint on the lower wall
  const gx = x + 20;
  const ramp = NEON[(r() * NEON.length) | 0];
  for (let i = 0; i < 26; i++) {
    const gy = BUILD_H - 16 + Math.round(Math.sin(i * 0.6) * 3);
    c.rect(gx + i, gy, 1, 2 + ((r() * 3) | 0), [...ramp[1], 150]);
  }
}

function buildings() {
  const c = new Px(SKY_W, BUILD_H);
  const r = rng(90210);
  // Hand-laid so the silhouette has rhythm. Widths sum to exactly 480 so the
  // layer tiles seamlessly.
  const layout = [
    [archTenement, 86, 128],
    [archTower, 54, 170],
    [archShopBlock, 96, 96],
    [archBillboard, 78, 112],
    [archVentBlock, 70, 104],
    [archTenement, 96, 140],
  ];
  let x = 0;
  for (const [fn, w, h] of layout) {
    fn(c, x, w, h, r);
    x += w;
  }
  return c;
}

/* =============================================================== cables === */

const CABLE_H = 64;

function cables() {
  const c = new Px(SKY_W, CABLE_H);
  // Sag is periodic over the full width, so the ends meet when tiled.
  const lines = [
    { base: 10, sag: 12, thick: 1 },
    { base: 22, sag: 18, thick: 2 },
    { base: 34, sag: 9, thick: 1 },
  ];
  for (const line of lines) {
    for (let x = 0; x < SKY_W; x++) {
      const y = line.base + (line.sag * (1 - Math.cos((2 * Math.PI * x) / SKY_W))) / 2;
      for (let t = 0; t < line.thick; t++) {
        c.set(x, Math.round(y) + t, [...R.night[0], 235]);
      }
      c.set(x, Math.round(y) - 1, [...R.night[3], 70]); // thin sky catch
    }
  }
  // Paper lanterns strung from the middle line.
  for (const lx of [118, 302]) {
    const y = 22 + (18 * (1 - Math.cos((2 * Math.PI * lx) / SKY_W))) / 2;
    const top = Math.round(y) + 2;
    c.rect(lx, top, 1, 4, [...R.night[0], 255]);
    ditherRect(c, lx - 3, top + 4, 7, 8, R.amber, (i, j) => {
      const edge = i === 0 || i === 6 || j === 0 || j === 7;
      return edge ? 1.2 : 3.3 - j * 0.12;
    });
  }
  return c;
}

/* =============================================================== street === */

const STREET_H = 80;

function street() {
  const c = new Px(SKY_W, STREET_H);
  const r = rng(777);

  // Pavement.
  ditherRect(c, 0, 0, SKY_W, 18, R.concrete, (_i, j) => 1.9 - (j / 18) * 0.5);
  c.rect(0, 0, SKY_W, 1, [...R.concrete[4], 220]);
  for (let x = 0; x < SKY_W; x += 16) c.rect(x, 1, 1, 17, [...R.night[1], 170]);
  for (let x = 0; x < SKY_W; x += 48) {
    c.rect(x + 6, 9, 10, 1, [...R.night[1], 120]); // hairline cracks
  }

  // Drain grate.
  c.rect(196, 4, 18, 11, [...R.night[1], 255]);
  for (let i = 0; i < 18; i += 3) c.rect(196 + i, 4, 2, 11, [...R.night[0], 255]);

  // Kerb.
  c.rect(0, 18, SKY_W, 1, [...R.concrete[4], 190]);
  c.rect(0, 19, SKY_W, 3, [...R.night[0], 255]);

  // Asphalt, wet. The sheen bands are dithered so they stay in the medium.
  ditherRect(c, 0, 22, SKY_W, STREET_H - 22, R.night, (i, j) => {
    const sheen = Math.sin((j / 9) * Math.PI) * 0.7;
    return clamp(0.9 + sheen + Math.sin((i + j) * 0.9) * 0.14, 0, 4);
  });

  // Lane dashes, period divides 480.
  for (let x = 0; x < SKY_W; x += 48) {
    ditherRect(c, x, 54, 22, 2, R.amber, () => 1.1, 150);
  }

  // Manhole.
  for (let i = 0; i < 22; i++) {
    for (let j = 0; j < 7; j++) {
      const dx = (i - 10.5) / 11;
      const dy = (j - 3) / 3.5;
      if (dx * dx + dy * dy > 1) continue;
      dither(c, 318 + i, 40 + j, R.night, 1.6 + dy * 0.6);
    }
  }

  // Puddles: dark bodies with a bright dithered rim. The scene paints the
  // neon reflections on top of these.
  const puddles = [
    { x: 64, y: 44, w: 54, h: 12 },
    { x: 238, y: 62, w: 76, h: 14 },
    { x: 392, y: 34, w: 46, h: 10 },
  ];
  for (const p of puddles) {
    for (let i = 0; i < p.w; i++) {
      for (let j = 0; j < p.h; j++) {
        const dx = (i - p.w / 2) / (p.w / 2);
        const dy = (j - p.h / 2) / (p.h / 2);
        const d = dx * dx + dy * dy + Math.sin(i * 0.4) * 0.06;
        if (d > 1) continue;
        if (d > 0.82) dither(c, p.x + i, p.y + j, R.night, 2.6);
        else dither(c, p.x + i, p.y + j, R.night, 0.2 + (1 - d) * 0.5);
      }
    }
  }

  // Grit.
  for (let i = 0; i < 160; i++) {
    const x = (r() * SKY_W) | 0;
    const y = 24 + ((r() * (STREET_H - 26)) | 0);
    c.set(x, y, [...R.night[2], 60 + ((r() * 70) | 0)]);
  }
  return c;
}

/* ================================================================ props === */

const PROP_W = 64;
const PROP_H = 120;
const PROP_COUNT = 4;

/** Near-black street furniture, rim-lit from the right by the shop ahead. */
function props() {
  const sheet = new Px(PROP_W * PROP_COUNT, PROP_H);

  const makeCell = (draw) => {
    const cell = new Px(PROP_W, PROP_H);
    draw(cell);
    rimLight(cell, R.amber[3], 1, 150);
    outline(cell, R.night[0]);
    return cell;
  };

  // 0: street lamp, arm reaching right
  const lamp = makeCell((c) => {
    c.rect(28, 10, 4, PROP_H - 10, [...R.night[1], 255]);
    c.rect(28, PROP_H - 6, 10, 6, [...R.night[1], 255]);
    c.rect(32, 10, 18, 3, [...R.night[1], 255]);
    c.rect(46, 13, 12, 7, [...R.night[1], 255]);
    ditherRect(c, 48, 15, 8, 4, R.amber, (_i, j) => 3.6 - j * 0.5);
    for (let i = 0; i < 5; i++) c.set(33 + i, 13 + i, [...R.night[1], 255]); // brace
  });

  // 1: railing
  const railing = makeCell((c) => {
    c.rect(0, 74, PROP_W, 3, [...R.night[1], 255]);
    c.rect(0, 88, PROP_W, 2, [...R.night[1], 255]);
    for (let x = 2; x < PROP_W; x += 7) c.rect(x, 74, 2, PROP_H - 74, [...R.night[1], 255]);
  });

  // 2: bollards and bagged rubbish
  const clutter = makeCell((c) => {
    for (const bx of [6, 20]) {
      c.rect(bx, 92, 5, PROP_H - 92, [...R.night[1], 255]);
      c.rect(bx - 1, 90, 7, 3, [...R.night[2], 255]);
    }
    for (const [bx, bw, bh] of [
      [36, 16, 20],
      [50, 12, 16],
    ]) {
      for (let j = 0; j < bh; j++) {
        const inset = Math.round(Math.sin((j / bh) * Math.PI) * -2) + 2;
        c.rect(bx + inset, PROP_H - bh + j, bw - inset * 2, 1, [...R.night[1], 255]);
      }
    }
  });

  // 3: crate and weeds
  const crate = makeCell((c) => {
    c.rect(14, 96, 26, 24, [...R.night[1], 255]);
    c.rect(14, 96, 26, 2, [...R.night[2], 255]);
    c.rect(14, 106, 26, 1, [...R.night[0], 255]);
    c.rect(26, 96, 1, 24, [...R.night[0], 255]);
    for (let i = 0; i < 9; i++) {
      const wx = 44 + i * 2;
      const hgt = 8 + ((i * 7) % 11);
      for (let j = 0; j < hgt; j++) {
        c.set(wx + Math.round(Math.sin(j * 0.5) * 1.5), PROP_H - 1 - j, [...R.night[1], 255]);
      }
    }
  });

  [lamp, railing, clutter, crate].forEach((cell, i) => blit(sheet, cell, i * PROP_W, 0));
  return sheet;
}

/* ================================================================= shop === */

const SHOP_W = 160;
const SHOP_H = 120;
const DOOR_W = 28;
const DOOR_H = 44;

function shop() {
  const c = new Px(SHOP_W, SHOP_H);

  // Body.
  facade(c, 5, 16, SHOP_W - 10, SHOP_H - 16, 0.2);
  c.rect(0, 8, SHOP_W, 9, [...R.concrete[1], 255]);
  c.rect(0, 8, SHOP_W, 1, [...R.concrete[4], 230]);
  c.rect(0, 16, SHOP_W, 1, [...R.night[0], 220]);

  // Sign board. The scene prints BROWSER_NAME across this, so it stays empty.
  c.rect(10, 22, 140, 24, [...R.night[0], 255]);
  // neon tube running round the board
  const tube = (x, y, w, h) => {
    ditherRect(c, x, y, w, 1, R.amber, () => 3.6);
    ditherRect(c, x, y + h - 1, w, 1, R.amber, () => 3.6);
    ditherRect(c, x, y, 1, h, R.amber, () => 3.6);
    ditherRect(c, x + w - 1, y, 1, h, R.amber, () => 3.6);
  };
  tube(10, 22, 140, 24);
  // soft spill from the tube onto the board
  for (let j = 1; j < 23; j++) {
    const falloff = Math.min(j, 23 - j);
    ditherRect(c, 11, 22 + j, 138, 1, R.amber, () => 0.4, Math.max(0, 70 - falloff * 16));
  }

  // Awning.
  for (let i = 0; i < SHOP_W; i += 10) {
    ditherRect(c, i, 48, 5, 8, R.amber, (_x, j) => 2.2 - j * 0.12);
    ditherRect(c, i + 5, 48, 5, 8, R.night, () => 1.2);
  }
  c.rect(0, 48, SHOP_W, 1, [...R.amber[4], 230]);
  c.rect(0, 56, SHOP_W, 1, [...R.night[0], 220]);

  // Windows. Warm inside - the first glimpse of the calm interior.
  for (const wx of [12, 106]) {
    c.rect(wx - 1, 61, 44, 40, [...R.night[0], 255]);
    ditherRect(c, wx, 62, 42, 38, R.amber, (_i, j) => 2.5 - (j / 38) * 1.5);
    // counter and shelving silhouettes
    c.rect(wx + 2, 80, 38, 2, [...R.night[0], 230]);
    c.rect(wx + 4, 68, 16, 1, [...R.night[0], 200]);
    c.rect(wx + 6, 82, 6, 18, [...R.night[0], 210]);
    c.rect(wx + 20, 62, 1, 38, [...R.night[0], 255]); // mullion
    c.rect(wx, 74, 42, 1, [...R.night[0], 255]);
  }

  // Door recess - door.png is drawn on top, bottom aligned.
  const dx = (SHOP_W - DOOR_W) >> 1;
  c.rect(dx - 2, SHOP_H - DOOR_H - 3, DOOR_W + 4, DOOR_H + 3, [...R.night[0], 255]);
  ditherRect(c, dx - 2, SHOP_H - DOOR_H - 4, DOOR_W + 4, 1, R.amber, () => 2.6);

  // Steps.
  c.rect(dx - 14, SHOP_H - 3, 12, 3, [...R.concrete[2], 255]);
  c.rect(dx + DOOR_W + 2, SHOP_H - 3, 12, 3, [...R.concrete[2], 255]);
  return c;
}

function door() {
  const c = new Px(DOOR_W, DOOR_H);
  ditherRect(c, 0, 0, DOOR_W, DOOR_H, R.concrete, (i, j) => 2.4 - (i / DOOR_W) * 0.9 - j * 0.012);
  c.rect(0, 0, DOOR_W, 1, [...R.concrete[4], 255]);
  c.rect(DOOR_W - 1, 0, 1, DOOR_H, [...R.night[0], 200]);

  // Glazed upper panel with warm light behind it.
  c.rect(3, 4, DOOR_W - 6, 18, [...R.night[0], 255]);
  ditherRect(c, 4, 5, DOOR_W - 8, 16, R.amber, (_i, j) => 3.2 - j * 0.1);
  c.rect(DOOR_W >> 1, 4, 1, 18, [...R.night[0], 255]);
  c.rect(4, 12, DOOR_W - 8, 1, [...R.night[0], 200]);

  // Lower panel, kick plate, handle.
  c.rect(4, 26, DOOR_W - 8, 12, [...R.night[1], 180]);
  c.rect(4, 26, DOOR_W - 8, 1, [...R.concrete[3], 200]);
  c.rect(2, DOOR_H - 4, DOOR_W - 4, 3, [...R.concrete[1], 255]);
  ditherRect(c, DOOR_W - 7, 23, 2, 5, R.amber, () => 3.8);
  return c;
}

/* =============================================================== player === */

const PLAYER_W = 24;
const PLAYER_H = 32;
const WALK_FRAMES = 8;

const PC = {
  hood: hex('#223052'),
  hoodHi: hex('#35486f'),
  hoodDk: hex('#111a2c'),
  pack: hex('#4a2f3e'),
  strap: hex('#6b3f18'),
  // Jeans sit lighter than the jacket, or the legs merge into the torso.
  pants: hex('#2e3a57'),
  pantsHi: hex('#415073'),
  shoe: hex('#0e1220'),
  sole: hex('#55618a'),
};

/** Taper a limb from (x0,y0) to (x1,y1), one row at a time. */
function limb(rect, x0, y0, x1, y1, w, col) {
  const steps = Math.max(1, y1 - y0);
  for (let s = 0; s <= steps; s++) {
    rect(Math.round(x0 + (x1 - x0) * (s / steps)), y0 + s, w, 1, col);
  }
}

/**
 * phase -1 is the idle pose; 0..7 is the walk cycle.
 *
 * The upper body bobs, the feet do not - planting the feet is what stops the
 * cycle looking like a sprite being slid along the floor. Legs are drawn with
 * a transparent column between them so outline() can separate them.
 */
function playerFrame(phase) {
  const c = new Px(PLAYER_W, PLAYER_H);
  const idle = phase < 0;
  const bob = idle ? 0 : [0, 1, 0, -1, 0, 1, 0, -1][phase];
  const spread = idle ? 2 : [4, 2, 0, -2, -4, -2, 0, 2][phase];

  // Bobbing upper body.
  const put = (x, y, col) => c.set(x, y + bob, col);
  const rect = (x, y, w, h, col) => {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) put(x + i, y + j, col);
  };
  // Planted lower body.
  const fixed = (x, y, w, h, col) => {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) c.set(x + i, y + j, col);
  };

  /* --- back leg, in shade ------------------------------------------------ */
  limb(fixed, 8, 21, 8 - spread, 25, 3, [...PC.pants, 255]);
  limb(fixed, 8 - Math.round(spread * 0.45), 25, 8 - spread, 29, 3, [...PC.pants, 255]);
  fixed(7 - spread, 29, 5, 2, [...PC.shoe, 255]);

  /* --- back arm ----------------------------------------------------------- */
  limb(rect, 8, 13, 8 + spread, 17, 3, [...PC.hoodDk, 255]);
  limb(rect, 8 + Math.round(spread * 0.4), 17, 8 + spread, 20, 3, [...PC.hoodDk, 255]);

  /* --- backpack ----------------------------------------------------------- */
  rect(5, 14, 4, 7, [...PC.pack, 255]);
  rect(5, 14, 1, 7, [...R.night[1], 255]);

  /* --- torso -------------------------------------------------------------- */
  // Chest is one pixel narrower than the hood and the waist narrower again, so
  // the lit edge steps down the form instead of running as a straight stripe.
  rect(8, 12, 8, 7, [...PC.hood, 255]); // chest
  rect(8, 19, 7, 3, [...PC.hood, 255]); // waist, reaching past the hips
  rect(8, 12, 2, 10, [...PC.hoodDk, 255]);
  rect(14, 13, 1, 6, [...PC.hoodHi, 255]);
  rect(8, 12, 8, 1, [...R.amber[2], 255]); // collar
  rect(9, 15, 6, 1, [...PC.strap, 255]); // pack strap across the chest
  rect(12, 14, 1, 8, [...PC.hoodDk, 255]); // zip

  /* --- hood and face ------------------------------------------------------ */
  rect(8, 2, 9, 11, [...PC.hood, 255]);
  rect(8, 2, 3, 11, [...PC.hoodDk, 255]);
  rect(6, 5, 2, 6, [...PC.hoodDk, 255]); // hood falling behind the neck
  rect(10, 2, 7, 1, [...PC.hoodHi, 255]); // lit crown
  rect(16, 3, 1, 9, [...PC.hoodHi, 255]); // lit hood edge by the face
  rect(12, 5, 4, 6, [...R.skin[2], 255]); // face in profile
  rect(12, 5, 4, 1, [...R.skin[0], 255]); // hood shadow on the brow
  rect(15, 7, 1, 3, [...R.skin[3], 255]); // lit nose and jaw
  put(14, 7, [...R.night[0], 255]); // eye

  /* --- front leg ---------------------------------------------------------- */
  limb(fixed, 13, 21, 13 + spread, 25, 3, [...PC.pantsHi, 255]);
  limb(fixed, 13 + Math.round(spread * 0.45), 25, 13 + spread, 29, 3, [...PC.pantsHi, 255]);
  fixed(12 + spread, 29, 5, 2, [...PC.shoe, 255]);
  fixed(12 + spread, 30, 5, 1, [...PC.sole, 255]);

  /* --- front arm ---------------------------------------------------------- */
  limb(rect, 14, 13, 14 - spread, 17, 3, [...PC.hood, 255]);
  limb(rect, 14 - Math.round(spread * 0.4), 17, 14 - spread, 20, 3, [...PC.hood, 255]);
  rect(14 - spread, 20, 3, 2, [...R.skin[1], 255]); // hand

  // Rim first (it reads as light wrapping the form), keyline second.
  rimLight(c, R.amber[3], 1, 120);
  outline(c, R.night[0]);
  return c;
}

function playerIdle() {
  return playerFrame(-1);
}

function playerWalk() {
  const sheet = new Px(PLAYER_W * WALK_FRAMES, PLAYER_H);
  for (let f = 0; f < WALK_FRAMES; f++) blit(sheet, playerFrame(f), f * PLAYER_W, 0);
  return sheet;
}

/* ================================================================= glow === */

/** Soft white disc. Tinted and scaled in-scene for every light in the city. */
function glow() {
  const S = 64;
  const c = new Px(S, S);
  const mid = (S - 1) / 2;
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const d = Math.hypot(x - mid, y - mid) / (S / 2);
      if (d >= 1) continue;
      c.set(x, y, [255, 255, 255, Math.round(Math.pow(1 - d, 2.6) * 255)]);
    }
  }
  return c;
}

/* ================================================================== main == */

const assets = {
  'sky.png': sky,
  'skyline.png': skyline,
  'buildings.png': buildings,
  'cables.png': cables,
  'street.png': street,
  'props.png': props,
  'shop.png': shop,
  'door.png': door,
  'player-idle.png': playerIdle,
  'player-walk.png': playerWalk,
  'glow.png': glow,
};

/**
 * Nearest-neighbour upscale onto an opaque backdrop, for eyeballing sprites at
 * a size where mistakes are actually visible. Dev aid only - never published.
 *   node scripts/gen-city-art.mjs --preview=8 --out=<dir> [--only=player-walk]
 */
function upscale(img, scale) {
  const out = new Px(img.w * scale, img.h * scale);
  out.rect(0, 0, out.w, out.h, [11, 14, 23, 255]);
  for (let y = 0; y < img.h; y++) {
    for (let x = 0; x < img.w; x++) {
      const i = (y * img.w + x) * 4;
      const a = img.d[i + 3];
      if (a === 0) continue;
      out.rect(x * scale, y * scale, scale, scale, [img.d[i], img.d[i + 1], img.d[i + 2], a]);
    }
  }
  return out;
}

const arg = (name) => {
  const hit = process.argv.find((a) => a.startsWith('--' + name + '='));
  return hit ? hit.slice(name.length + 3) : null;
};

const previewScale = Number(arg('preview')) || 0;
const previewDir = arg('out');
const only = arg('only');

mkdirSync(OUT_DIR, { recursive: true });
if (previewScale && previewDir) mkdirSync(previewDir, { recursive: true });

let total = 0;
for (const [name, make] of Object.entries(assets)) {
  if (only && !name.startsWith(only)) continue;
  const img = make();
  const buf = img.png();
  writeFileSync(join(OUT_DIR, name), buf);
  total += buf.length;
  console.log(
    '  ' +
      name.padEnd(18) +
      (img.w + 'x' + img.h).padEnd(10) +
      (buf.length / 1024).toFixed(1) +
      ' kB',
  );
  if (previewScale && previewDir) {
    writeFileSync(join(previewDir, name), upscale(img, previewScale).png());
  }
}
console.log(
  '\n' + Object.keys(assets).length + ' assets, ' + (total / 1024).toFixed(1) + ' kB total',
);
