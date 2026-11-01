/**
 * Close-up art for the jack-in cutscene: the player's forearm with a wrist
 * port, the PC's I/O panel and its socket, and the plug on the cable between
 * them. Drawn far larger than anything in the street, because the cutscene is
 * a close-up.
 */
import { Px, R, hex, dither, ditherRect, outline, rimLight, blit } from './core.mjs';

const fill = (c, x, y, w, h, col, a = 255) => c.rect(x, y, w, h, [...col, a]);

/** The jacket colours from characters.mjs, so the sleeve matches the player. */
const JACKET = [hex('#151827'), hex('#262b40'), hex('#3a4163')];

const ARM_W = 200;
const ARM_H = 64;
const CY = 34; // the arm's centre line

/**
 * Where the cable leaves the wrist, in the arm sprite's own pixels. The
 * cutscene anchors the cable here.
 */
export const WRIST_PORT = { x: 125, y: 25 };

/**
 * Left to right: sleeve and cuff, the chrome wrist implant, the hand. The
 * sleeve is long so that it always runs off the left of the screen.
 */
const CUFF = { x0: 106, x1: 114 };
const IMPLANT = { x0: 114, x1: 136 };
const KNUCKLES = 166;

const lerp = (a, b, t) => a + (b - a) * t;

/** Fill a column between two edges, shading each pixel by how far down it sits. */
function column(x, top, bottom, shade) {
  for (let y = top; y <= bottom; y++) shade(y, bottom > top ? (y - top) / (bottom - top) : 0);
}

/** Sleeve, then cuff: techwear with a lit seam, bunching where it meets the wrist. */
function sleeve(c) {
  for (let x = 0; x < CUFF.x1; x++) {
    const cuff = x >= CUFF.x0;
    const top = cuff ? 19 : Math.round(lerp(15, 18, x / CUFF.x0));
    const bottom = cuff ? 48 : Math.round(lerp(53, 49, x / CUFF.x0));
    column(x, top, bottom, (y, rel) => {
      // lit from above, the brightest band a quarter of the way down
      let t = 2.15 - Math.abs(rel - 0.24) * 2.7;
      if (cuff) t -= 0.7;
      // fabric bunching into the cuff, and creases towards the elbow
      const bunch = !cuff && x > CUFF.x0 - 16 && Math.abs(((x + Math.sin(y * 0.45) * 2) % 6) - 3) < 0.6 && rel > 0.12 && rel < 0.9;
      const crease = !cuff && x < CUFF.x0 * 0.4 && Math.abs(((x * 0.8 + y * 0.6) % 19) - 9) < 0.7 && rel > 0.2 && rel < 0.85;
      if (bunch || crease) t -= 0.9;
      if (cuff && x % 2 === 0) t += 0.35; // ribbing
      dither(c, x, y, JACKET, t);
    });
    if (!cuff) {
      // the glowing seam that runs the length of the sleeve
      c.set(x, top + 5, [...R.cyan[2], 255]);
      c.set(x, top + 6, [...R.cyan[0], 150]);
    }
  }
  // amber cuff edge, the accent the player wears at the collar
  for (let y = 19; y <= 48; y++) {
    c.set(CUFF.x1 - 2, y, [...R.amber[2], 255]);
    c.set(CUFF.x1 - 1, y, [...R.amber[y < 24 ? 4 : 3], 255]);
  }
}

/** The chrome implant around the wrist, with the port set into its top. */
function implant(c, f) {
  const { x0, x1 } = IMPLANT;
  for (let x = x0; x < x1; x++) {
    const top = 24;
    const bottom = x < x0 + 11 ? 42 : 41;
    column(x, top, bottom, (y, rel) => {
      // polished metal: a hard specular band near the top, deep shadow below
      const t = rel < 0.2 ? 4 - rel * 4 : 3.3 - (rel - 0.2) * 3.6;
      dither(c, x, y, R.steel, t);
    });
    c.set(x, top + 7, [...R.steel[4], 255]);
    // the light strip that runs round the implant
    const strip = Math.round(top + (bottom - top) * 0.66);
    c.set(x, strip, [...R.cyan[3], 255]);
    c.set(x, strip + 1, [...R.cyan[1], 200]);
  }
  // panel seams and bolts
  for (const sx of [x0 + 1, x1 - 1]) {
    for (let y = 25; y <= 40; y++) c.set(sx, y, [...R.night[2], 255]);
  }
  for (const [bx, by] of [
    [x0 + 3, 38],
    [x1 - 4, 37],
  ]) {
    c.set(bx, by, [...R.steel[4], 255]);
    c.set(bx + 1, by + 1, [...R.steel[0], 255]);
  }

  // the port, 14 x 6, centred on WRIST_PORT
  const px = WRIST_PORT.x - 7;
  const py = 24;
  fill(c, px - 1, py - 1, 16, 1, R.steel[0]);
  if (f === 0) {
    fill(c, px, py, 14, 6, R.steel[2]);
    fill(c, px, py, 14, 1, R.steel[4]);
    fill(c, px, py + 5, 14, 1, R.steel[0]);
    fill(c, px + 6, py + 2, 2, 2, R.amber[3]);
  } else {
    fill(c, px, py, 14, 6, R.night[0]);
    if (f === 1) {
      fill(c, px + 7, py - 1, 7, 6, R.steel[2]);
      fill(c, px + 7, py - 1, 7, 1, R.steel[4]);
    } else {
      // contacts glowing in the recess, a cyan ring around the edge
      ditherRect(c, px + 2, py + 2, 10, 2, R.amber, (i) => 3.9 - Math.abs(i - 5) * 0.2);
      for (let i = 0; i < 5; i++) c.set(px + 3 + i * 2, py + 3, [...R.cyan[4], 255]);
      fill(c, px, py, 14, 1, R.cyan[2]);
      fill(c, px, py + 5, 14, 1, R.cyan[1]);
    }
  }
}

/**
 * The hand, side on, palm down, reaching for the PC: about three times as
 * long as it is deep, as a hand is. `curl` bends the fingers further - 0
 * relaxed, 1 the twitch as the signal hits.
 */
function hand(c, curl) {
  const x0 = IMPLANT.x1;
  const kn = KNUCKLES;
  const tip = KNUCKLES + 30 - curl * 2;
  // the red band the scene plays over this lights the underside
  const bounce = (x, y) => c.set(x, y, [...R.magenta[1], 110]);

  // back of the hand: a low dome from the wrist to the knuckles
  const arc = (x) => Math.sin(((x - x0) / (kn - x0)) * Math.PI);
  for (let x = x0; x < kn; x++) {
    const top = Math.round(25 - arc(x) * 1.6);
    const bottom = Math.round(lerp(40, 36, (x - x0) / (kn - x0)) + arc(x) * 1.2);
    column(x, top, bottom, (y, rel) => {
      let t = 3.5 - rel * 2.4;
      // tendons running down to the knuckles
      if (x > x0 + 6 && x < kn - 4 && y === top + 3) t += 0.3;
      dither(c, x, y, R.skin, t);
    });
    bounce(x, bottom);
  }
  c.set(kn - 3, 24, [...R.skin[4], 255]);
  c.set(kn - 2, 24, [...R.skin[4], 255]);

  // four fingers as they look from the side: the index whole on top, the
  // others behind it, each a sliver lower, darker and shorter
  const rows = [0, 0, 0, 0, 1, 1, 2, 2, 3, 3];
  const reach = [0, 2, 5, 8];
  for (let x = kn; x <= tip; x++) {
    const k = (x - kn) / (tip - kn);
    const top = Math.round(26 + k * k * (3 + curl * 3));
    rows.forEach((band, r) => {
      const end = tip - reach[band];
      if (x > end) return;
      const first = r === rows.indexOf(band);
      const last = r === rows.lastIndexOf(band);
      if (x === end && (first || last)) return; // round the tip
      if (band === 0 && first && x === end - 1) return;
      const y = top + r;
      // the gaps between fingers only open up towards the tips
      if (band > 0 && first) {
        if (x >= end - 9) c.set(x, y, [...R.skin[1], 255]);
        else dither(c, x, y, R.skin, 1.9);
        return;
      }
      else if (band === 0 && r < 2 && x >= end - 3) c.set(x, y, [...R.skin[4], 255]); // nail
      else dither(c, x, y, R.skin, 3.35 - (r - rows.indexOf(band)) * 0.5 - band * 0.45);
      if (last && band === 3) bounce(x, y);
    });
    // the two finger joints, a crease and a slight break in the line
    if (x === kn + 10 || x === kn + 20) c.set(x, top, [...R.skin[1], 255]);
  }

  // the thumb, nearer the viewer: a muscled base under the palm, tapering
  // forward along the fingers
  const thumbTip = KNUCKLES + 8 - curl;
  for (let x = x0 + 4; x <= thumbTip; x++) {
    const k = (x - x0 - 4) / (thumbTip - x0 - 4);
    let top = Math.round(lerp(36, 35, k));
    let bottom = Math.round(lerp(44, 39, k));
    if (x >= thumbTip - 1) {
      top += 1;
      bottom -= 1;
    }
    column(x, top, bottom, (y, rel) => {
      if (y === top && x > x0 + 10) c.set(x, y, [...R.skin[1], 255]);
      else if (x >= thumbTip - 2 && rel < 0.4) c.set(x, y, [...R.skin[4], 255]);
      else dither(c, x, y, R.skin, 3.2 - rel * 2);
    });
    bounce(x, bottom);
  }
}

/**
 * frame 0: wrist closed. 1: the port panel sliding back. 2: open, glowing.
 * 3: open, the fingers twitching as the link takes.
 */
function armFrame(f) {
  const c = new Px(ARM_W, ARM_H);
  sleeve(c);
  hand(c, f === 3 ? 1 : 0);
  implant(c, Math.min(f, 2));

  rimLight(c, R.cyan[3], 1, 90);
  outline(c, R.night[0]);
  return c;
}

function linkArm() {
  const sheet = new Px(ARM_W * 4, ARM_H);
  for (let f = 0; f < 4; f++) blit(sheet, armFrame(f), f * ARM_W, 0);
  return sheet;
}

const PORT_W = 110;
const PORT_H = 96;

/** Where the plug seats, in the port sprite's own pixels. */
export const SOCKET = { x: 36, y: 54 };

/** The PC's I/O panel, close up. frame 0: socket waiting. 1: connected. */
function portFrame(f) {
  const c = new Px(PORT_W, PORT_H);
  ditherRect(c, 0, 0, PORT_W, PORT_H, R.night, (i, j) => 1.8 + Math.sin(j * 0.9) * 0.15 - (i / PORT_W) * 0.5);
  fill(c, 0, 0, PORT_W, 1, R.concrete[3]);
  fill(c, 0, 0, 1, PORT_H, R.concrete[3]);
  fill(c, 0, PORT_H - 1, PORT_W, 1, R.night[0]);
  fill(c, PORT_W - 1, 0, 1, PORT_H, R.night[0]);

  for (let y = 10; y < 30; y += 3) {
    fill(c, 12, y, 70, 1, R.night[0]);
    fill(c, 12, y + 1, 70, 1, R.night[3], 120);
  }
  for (let j = 0; j < 80; j++) dither(c, PORT_W - 10, 8 + j, j < 40 ? R.cyan : R.magenta, 3.2);

  // the socket housing and its glowing ring
  fill(c, SOCKET.x - 14, SOCKET.y - 10, 28, 20, R.concrete[1]);
  fill(c, SOCKET.x - 14, SOCKET.y - 10, 28, 1, R.concrete[3]);
  fill(c, SOCKET.x - 14, SOCKET.y - 10, 1, 20, R.concrete[3]);
  const ring = f === 0 ? R.amber : R.cyan;
  ditherRect(c, SOCKET.x - 10, SOCKET.y - 6, 20, 12, ring, () => (f === 0 ? 1.8 : 3.4));
  fill(c, SOCKET.x - 8, SOCKET.y - 4, 16, 8, R.night[0]);
  for (let i = 0; i < 5; i++) fill(c, SOCKET.x - 6 + i * 3, SOCKET.y - 1, 1, 2, f === 0 ? R.amber[1] : R.cyan[4]);

  // label plate, status LEDs, screws
  fill(c, 60, 70, 34, 14, R.steel[1]);
  for (let j = 0; j < 3; j++) fill(c, 63, 73 + j * 3, 18 + ((j * 7) % 9), 1, R.night[1]);
  fill(c, 60, 50, 3, 2, f === 0 ? R.amber[3] : R.lime[3]);
  fill(c, 66, 50, 3, 2, f === 0 ? R.night[2] : R.lime[3]);
  for (const [sx, sy] of [
    [4, 4],
    [PORT_W - 14, 4],
    [4, PORT_H - 6],
    [PORT_W - 14, PORT_H - 6],
  ]) {
    fill(c, sx, sy, 2, 2, R.steel[2]);
  }
  return c;
}

function linkPort() {
  const sheet = new Px(PORT_W * 2, PORT_H);
  for (let f = 0; f < 2; f++) blit(sheet, portFrame(f), f * PORT_W, 0);
  return sheet;
}

/** The plug on the end of the cable, facing right towards the socket. */
function linkPlug() {
  const c = new Px(20, 12);
  fill(c, 0, 5, 6, 2, R.night[0]);
  ditherRect(c, 6, 2, 11, 8, R.steel, (_i, j) => 3 - j * 0.25);
  fill(c, 6, 2, 2, 8, R.amber[3]);
  fill(c, 17, 4, 3, 4, R.steel[4]);
  outline(c, R.night[0]);
  return c;
}

export { linkArm, linkPort, linkPlug };
