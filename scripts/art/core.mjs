/**
 * Shared drawing core for the intro art: PNG encoding, the palette, ordered
 * dithering and the sprite helpers every asset module builds on.
 */
import { deflateSync } from 'node:zlib';
import { Buffer } from 'node:buffer';

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
  // Light cool greys: signage, appliances, anything that has to read as pale.
  steel: ['#4b5675', '#6a7593', '#8c97b3', '#b3bdd6', '#dfe5f2'].map(hex),
  // The two halves of a Bengaluru auto-rickshaw.
  yellow: ['#5a4a10', '#9a7d16', '#d4ad1f', '#f2cf3a', '#fff08a'].map(hex),
  green: ['#0f3a1e', '#1d6332', '#2e8f47', '#49b85f', '#8fe39a'].map(hex),
  // Street-front materials, so the near row is not all one blue-grey.
  brick: ['#1a0f14', '#2b161c', '#3d1f24', '#54302c', '#6e4a3a'].map(hex),
  teal: ['#071a1c', '#0d2a2e', '#143b40', '#1f5257', '#2f6e73'].map(hex),
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

/**
 * Nearest-neighbour upscale onto an opaque backdrop, for eyeballing sprites at
 * a size where mistakes are actually visible. Dev aid only - never published.
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

export { Px, hex, R, NEON, BAYER, clamp, dither, ditherRect, rng, outline, rimLight, blit, upscale };
