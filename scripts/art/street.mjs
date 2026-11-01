/**
 * The neon street: sky, skyline, building archetypes, cables, pavement, street
 * furniture and the lights that every one of them is tinted from.
 */
import { Px, R, NEON, clamp, dither, ditherRect, rng, outline, rimLight, blit, hex } from './core.mjs';

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

  // rooftop: a stair-head shed and a water tank on legs. (The street's big LED
  // billboard stands on the roof next door, so this one stays low.)
  c.rect(x + 8, top - 12, 22, 12, [...R.concrete[1], 255]);
  c.rect(x + 8, top - 12, 22, 1, [...R.concrete[3], 255]);
  c.rect(x + 15, top - 8, 6, 8, [...R.night[0], 255]);
  const tx = x + w - 30;
  c.rect(tx, top - 20, 16, 10, [...R.concrete[2], 255]);
  c.rect(tx, top - 20, 16, 1, [...R.concrete[4], 255]);
  for (const lx of [tx + 2, tx + 12]) c.rect(lx, top - 10, 2, 10, [...R.night[1], 255]);
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
      // the wire catches neon from the street below
      c.set(x, Math.round(y) - 1, [...NEON[((x / 120) | 0) % NEON.length][1], 120]);
    }
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
    rimLight(cell, R.amber[3], 1, 90);
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

/* =========================================================== cafe front === */

const DOOR_W = 28;
const DOOR_H = 44;

const CAFE_W = 192;
const CAFE_H = 128;

/**
 * Glass storefront geometry. StreetScene mirrors these numbers to place the
 * flickering screen glows, so change them together.
 */
const WINDOW_X = [8, 114];
const WINDOW_Y = 60;
const WINDOW_W = 70;
const WINDOW_H = 50;
const WINDOW_SCREENS = [8, 30, 52]; // x of each little monitor inside a window

/** One pane of glass, looking in on three people at glowing screens. */
function cafeWindow(c, x, y, w, h, flip) {
  c.rect(x - 1, y - 1, w + 2, h + 2, [...R.night[0], 255]);
  ditherRect(c, x, y, w, h, R.night, (_i, j) => 1.9 - (j / h) * 1.2);

  // ceiling tube and the LED strip along the back wall
  ditherRect(c, x + 6, y + 3, w - 12, 1, R.cyan, () => 3.4);
  for (let i = 0; i < w; i++) {
    c.set(x + i, y + 8, [...NEON[((i / 18) | 0) % NEON.length][2], 150]);
  }

  // desk line, behind the people
  c.rect(x, y + 27, w, 2, [...R.concrete[2], 255]);

  WINDOW_SCREENS.forEach((sx, n) => {
    const ramp = NEON[(n + (flip ? 2 : 0)) % NEON.length];
    const mx = x + sx;
    const my = y + 18;
    c.rect(mx - 1, my - 1, 12, 9, [...R.night[0], 255]);
    ditherRect(c, mx, my, 10, 7, ramp, (_i, j) => 3.1 - j * 0.25);
    // whoever is playing: a head over the bottom of the screen, then shoulders
    c.rect(mx + 3, my + 4, 5, 1, [...R.night[0], 255]);
    c.rect(mx + 2, my + 5, 7, 6, [...R.night[0], 255]);
    c.rect(mx - 1, my + 11, 13, 10, [...R.night[0], 255]);
  });

  // two glints across the glass
  for (let k = 0; k < 2; k++) {
    const gx = x + 12 + k * 30;
    for (let j = 0; j < h; j++) {
      const px = gx + Math.round(j * 0.45);
      if (px < x + w) c.set(px, y + j, [...R.cyan[4], 18]);
    }
  }
  c.rect(x + (w >> 1), y, 1, h, [...R.night[0], 255]); // mullion
}

/**
 * The cyber cafe at the end of the street. The sign board is left dark for the
 * scene to print CAFE_NAME on, and the scene animates the screens behind the
 * glass.
 */
function cafeFront() {
  const c = new Px(CAFE_W, CAFE_H);

  facade(c, 4, 14, CAFE_W - 8, CAFE_H - 14, 0.1);
  c.rect(0, 6, CAFE_W, 9, [...R.concrete[1], 255]);
  c.rect(0, 6, CAFE_W, 1, [...R.concrete[4], 230]);
  c.rect(0, 14, CAFE_W, 1, [...R.night[0], 220]);

  // Sign board, ringed by an amber tube that spills a little onto the board.
  c.rect(8, 18, 176, 30, [...R.night[0], 255]);
  const tube = (x, y, w, h) => {
    ditherRect(c, x, y, w, 1, R.amber, () => 3.6);
    ditherRect(c, x, y + h - 1, w, 1, R.amber, () => 3.6);
    ditherRect(c, x, y, 1, h, R.amber, () => 3.6);
    ditherRect(c, x + w - 1, y, 1, h, R.amber, () => 3.6);
  };
  tube(8, 18, 176, 30);
  for (let j = 1; j < 29; j++) {
    const falloff = Math.min(j, 29 - j);
    ditherRect(c, 9, 18 + j, 174, 1, R.amber, () => 0.4, Math.max(0, 64 - falloff * 14));
  }

  // Awning.
  for (let i = 0; i < CAFE_W; i += 10) {
    ditherRect(c, i, 50, 5, 7, R.amber, (_x, j) => 2.2 - j * 0.12);
    ditherRect(c, i + 5, 50, 5, 7, R.night, () => 1.2);
  }
  c.rect(0, 50, CAFE_W, 1, [...R.amber[4], 230]);
  c.rect(0, 57, CAFE_W, 1, [...R.night[0], 220]);

  WINDOW_X.forEach((wx, i) => cafeWindow(c, wx, WINDOW_Y, WINDOW_W, WINDOW_H, i === 1));

  // Low wall under the glass.
  ditherRect(c, 4, 112, CAFE_W - 8, 16, R.concrete, (i, j) => 1.6 - j * 0.04 + ((i >> 3) % 2) * 0.2);
  c.rect(4, 112, CAFE_W - 8, 1, [...R.concrete[4], 220]);

  // Door recess - door.png is drawn on top, centred and bottom aligned.
  const dx = (CAFE_W - DOOR_W) >> 1;
  c.rect(dx - 2, CAFE_H - DOOR_H - 3, DOOR_W + 4, DOOR_H + 3, [...R.night[0], 255]);
  ditherRect(c, dx - 2, CAFE_H - DOOR_H - 4, DOOR_W + 4, 1, R.amber, () => 2.6);
  c.rect(dx - 14, CAFE_H - 3, 12, 3, [...R.concrete[2], 255]);
  c.rect(dx + DOOR_W + 2, CAFE_H - 3, 12, 3, [...R.concrete[2], 255]);
  return c;
}

/* ============================================================ billboard === */

const BB_W = 160;
const BB_H = 84;

/**
 * The Wispr Flow board: a big LED face (x 6-153, y 6-65) in a steel bezel,
 * bulb sockets along the top, a catwalk underneath with two lamps aimed up,
 * and struts bracing it back to the tower it is bolted to. The face is left
 * dark - StreetScene animates it.
 */
function billboard() {
  const c = new Px(BB_W, BB_H);
  const steel = [...R.night[1], 255];
  const lit = [...R.night[3], 255];

  // struts back to the wall, and the catwalk with its railing
  for (const [x0, dir] of [
    [22, 1],
    [138, -1],
  ]) {
    for (let i = 0; i < 8; i++) c.rect(x0 + dir * i, 76 + i, 2, 1, steel);
  }
  c.rect(8, 76, 144, 3, steel);
  c.rect(8, 76, 144, 1, lit);
  c.rect(8, 70, 144, 1, steel);
  for (let x = 8; x <= 151; x += 6) c.rect(x, 70, 1, 6, steel);
  for (const lx of [34, 120]) {
    c.rect(lx, 71, 6, 5, steel);
    ditherRect(c, lx + 1, 71, 4, 1, R.amber, () => 3.8);
  }

  // bezel and the dark face
  c.rect(2, 2, 156, 68, steel);
  c.rect(2, 2, 156, 1, lit);
  c.rect(2, 2, 1, 68, lit);
  c.rect(157, 2, 1, 68, [...R.night[0], 255]);
  c.rect(5, 5, 150, 62, [...R.night[0], 255]);

  for (let x = 8; x <= 152; x += 6) c.rect(x, 0, 2, 2, [...R.night[0], 255]);
  return c;
}

/* ============================================================= rickshaw === */

const RICK_W = 60;
const RICK_H = 40;

/** A Bengaluru auto-rickshaw, side on, facing right. Two frames of wheel. */
function rickshawFrame(f) {
  const c = new Px(RICK_W, RICK_H);
  const black = [...R.night[0], 255];

  // canvas canopy
  c.rect(18, 0, 27, 1, black);
  c.rect(14, 1, 35, 1, black);
  c.rect(12, 2, 39, 3, [...R.night[1], 255]);
  c.rect(14, 1, 35, 1, [...R.night[3], 255]);
  c.rect(10, 3, 5, 17, [...R.night[1], 255]); // rear of the canopy
  c.rect(47, 4, 2, 15, black); // windscreen pillar
  ditherRect(c, 49, 5, 3, 11, R.cyan, (_i, j) => 1.2 - j * 0.05);

  // open side: driver up front, passenger bench behind
  c.rect(15, 5, 32, 13, [...R.night[1], 255]);
  c.rect(16, 10, 6, 8, [...R.night[2], 255]);
  c.rect(36, 6, 5, 5, [...R.skin[0], 255]);
  c.rect(35, 11, 7, 7, [...R.night[2], 255]);
  c.rect(43, 13, 4, 1, [...R.steel[1], 255]); // handlebar

  // yellow band over a green body
  ditherRect(c, 8, 18, 46, 5, R.yellow, (_i, j) => 3.4 - j * 0.2);
  ditherRect(c, 7, 23, 49, 9, R.green, (_i, j) => 2.6 - j * 0.18);
  c.rect(7, 23, 49, 1, [...R.green[4], 200]);

  // rounded nose with its headlight
  for (let j = 0; j < 13; j++) {
    const reach = Math.round(Math.sin((j / 12) * Math.PI) * 4);
    ditherRect(c, 54, 19 + j, 1 + reach, 1, j < 5 ? R.yellow : R.green, () => 2.6);
  }
  ditherRect(c, 56, 21, 2, 3, R.yellow, () => 4);
  c.rect(7, 25, 2, 3, [...R.magenta[3], 255]); // tail light

  // front mudguard
  c.rect(45, 30, 12, 2, black);

  const wheel = (cx, cy, rad) => {
    for (let y = -rad; y <= rad; y++) {
      for (let x = -rad; x <= rad; x++) {
        const d = Math.hypot(x, y);
        if (d > rad + 0.3) continue;
        c.set(cx + x, cy + y, d > rad - 1.6 ? black : [...R.steel[0], 255]);
      }
    }
    const angles = f === 0 ? [0, Math.PI / 2] : [Math.PI / 4, (3 * Math.PI) / 4];
    for (const a of angles) {
      for (let t = -(rad - 2); t <= rad - 2; t++) {
        c.set(cx + Math.round(Math.cos(a) * t), cy + Math.round(Math.sin(a) * t), [...R.steel[3], 255]);
      }
    }
  };
  wheel(17, 34, 5);
  wheel(51, 35, 4);

  outline(c, R.night[0]);
  return c;
}

function rickshaw() {
  const sheet = new Px(RICK_W * 2, RICK_H);
  for (let f = 0; f < 2; f++) blit(sheet, rickshawFrame(f), f * RICK_W, 0);
  return sheet;
}

/* ================================================================= note === */

const NOTE_W = 18;
const NOTE_H = 16;

/** The collectible: a little mic, its sound rings pulsing out over 4 frames. */
function noteFrame(f) {
  const c = new Px(NOTE_W, NOTE_H);
  const ox = 1;

  // capsule with grille
  for (let y = 1; y <= 9; y++) {
    const inset = y === 1 || y === 9 ? 1 : 0;
    ditherRect(c, ox + 5 + inset, y, 6 - inset * 2, 1, R.amber, (i) => 3.6 - i * 0.35);
  }
  for (const y of [3, 5, 7]) c.rect(ox + 6, y, 4, 1, [...R.amber[1], 255]);
  c.set(ox + 6, 2 + f * 2, [...R.amber[4], 255]); // travelling glint

  // cradle and stand
  c.rect(ox + 3, 6, 1, 4, [...R.amber[2], 255]);
  c.rect(ox + 12, 6, 1, 4, [...R.amber[2], 255]);
  c.rect(ox + 4, 10, 8, 1, [...R.amber[2], 255]);
  c.rect(ox + 7, 11, 2, 2, [...R.amber[2], 255]);
  c.rect(ox + 5, 13, 6, 1, [...R.amber[3], 255]);

  // sound rings
  if (f >= 1) {
    c.rect(ox + 1, 4, 1, 3, [...R.cyan[3], 255]);
    c.rect(ox + 14, 4, 1, 3, [...R.cyan[3], 255]);
  }
  if (f >= 2) {
    c.rect(ox - 1, 3, 1, 5, [...R.cyan[2], 200]);
    c.rect(ox + 16, 3, 1, 5, [...R.cyan[2], 200]);
  }

  outline(c, R.night[0]);
  return c;
}

function note() {
  const sheet = new Px(NOTE_W * 4, NOTE_H);
  for (let f = 0; f < 4; f++) blit(sheet, noteFrame(f), f * NOTE_W, 0);
  return sheet;
}

/**
 * The cafe's automatic sliding doors: two glass leaves, frame 0 left and
 * frame 1 right, warm light through the tint and a cyan strip on the edges
 * that meet. The scene slides them apart.
 */
function door() {
  const c = new Px(DOOR_W, DOOR_H);
  const leaf = (ox, meetsOnRight) => {
    const w = DOOR_W / 2;
    c.rect(ox, 0, w, DOOR_H, [...R.night[0], 255]);
    ditherRect(c, ox + 1, 1, w - 2, DOOR_H - 2, R.amber, (_i, j) => 2.2 - j * 0.02);
    for (let j = 0; j < DOOR_H; j++) {
      const x = ox + 2 + Math.round(j * 0.22);
      if (x < ox + w - 1) c.set(x, j, [...R.cyan[4], 45]);
    }
    c.rect(meetsOnRight ? ox + w - 1 : ox, 2, 1, DOOR_H - 4, [...R.cyan[3], 255]);
    c.rect(ox + 1, DOOR_H - 5, w - 2, 4, [...R.concrete[2], 255]);
    c.rect(ox + 1, DOOR_H - 5, w - 2, 1, [...R.concrete[4], 255]);
    c.rect(ox + 1, 18, w - 2, 1, [...R.night[1], 200]);
  };
  leaf(0, true);
  leaf(DOOR_W / 2, false);
  return c;
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

export { sky, skyline, buildings, cables, street, props, cafeFront, door, billboard, rickshaw, note, glow, facade };
