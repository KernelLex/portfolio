/**
 * Close-up art for the jack-in cutscene: the player's forearm with a wrist
 * port, the PC's I/O panel and its socket, and the plug on the cable between
 * them. Drawn far larger than anything in the street, because the cutscene is
 * a close-up.
 */
import { Px, R, hex, dither, ditherRect, outline, rimLight, blit } from './core.mjs';

const fill = (c, x, y, w, h, col, a = 255) => c.rect(x, y, w, h, [...col, a]);

/** The hoodie colours from characters.mjs, so the sleeve matches the player. */
const SLEEVE = { base: hex('#223052'), lit: hex('#35486f'), dark: hex('#111a2c') };

const ARM_W = 150;
const ARM_H = 64;
const CY = 34; // the arm's centre line

/**
 * Where the cable leaves the wrist, in the arm sprite's own pixels. The
 * cutscene anchors the cable here.
 */
export const WRIST_PORT = { x: 99, y: CY - 10 };

/** frame 0: wrist closed. 1: the panel sliding back. 2: open, port glowing. */
function armFrame(f) {
  const c = new Px(ARM_W, ARM_H);

  // sleeve, entering from the left edge, with folds in the fabric
  for (let x = 0; x < 84; x++) {
    const th = Math.round(34 - x * 0.05);
    const top = CY - (th >> 1);
    for (let j = 0; j < th; j++) {
      const k = j / th;
      const col = k < 0.18 ? SLEEVE.lit : k > 0.78 ? SLEEVE.dark : SLEEVE.base;
      c.set(x, top + j, [...col, 255]);
      if (Math.sin((x + j * 0.6) * 0.18) > 0.85) c.set(x, top + j, [...SLEEVE.dark, 130]);
    }
  }
  // amber cuff
  for (let x = 82; x < 90; x++) {
    for (let j = 0; j < 30; j++) dither(c, x, CY - 15 + j, R.amber, 2.9 - (j / 30) * 1.7);
  }
  // wrist, back of the hand, thumb, curled fingers
  for (let x = 90; x < 108; x++) {
    for (let j = 0; j < 22; j++) dither(c, x, CY - 12 + j, R.skin, 3.2 - (j / 22) * 2);
  }
  for (let x = 108; x < 134; x++) {
    const th = 22 + Math.round((x - 108) * 0.1);
    for (let j = 0; j < th; j++) dither(c, x, CY - 12 + j, R.skin, 3.3 - (j / th) * 2.1);
  }
  for (let x = 112; x < 128; x++) {
    for (let j = 0; j < 5; j++) dither(c, x, CY - 16 + j, R.skin, 3.4 - j * 0.2);
  }
  for (let x = 134; x < 148; x++) {
    const th = 16 - Math.round((x - 134) * 0.3);
    for (let j = 0; j < th; j++) dither(c, x, CY - 6 + j, R.skin, 3 - (j / th) * 1.8);
  }
  for (const kx of [134, 139, 143]) fill(c, kx, CY - 4, 1, 12, R.skin[0], 160);
  for (const fy of [CY - 2, CY + 2, CY + 6]) fill(c, 134, fy, 13, 1, R.skin[0], 150);
  for (const fy of [CY - 4, CY, CY + 4]) fill(c, 145, fy, 2, 2, R.skin[4], 200);
  fill(c, 128, CY - 12, 6, 1, R.skin[4], 200);

  // the port, set into the top of the wrist
  const px = 92;
  const py = CY - 12;
  if (f === 0) {
    fill(c, px, py + 1, 14, 1, R.skin[0], 200);
    fill(c, px, py + 5, 14, 1, R.skin[0], 200);
    fill(c, px, py + 1, 1, 5, R.skin[0], 200);
    fill(c, px + 13, py + 1, 1, 5, R.skin[0], 200);
    c.set(px + 7, py + 3, [...R.amber[2], 255]);
  } else {
    const open = f === 1 ? 7 : 14;
    fill(c, px, py, open, 6, R.night[0]);
    if (f === 1) fill(c, px + open, py - 1, 14 - open, 2, R.skin[1]);
    if (f === 2) {
      ditherRect(c, px + 2, py + 1, 10, 3, R.amber, (i) => 3.9 - Math.abs(i - 5) * 0.2);
      for (let i = 0; i < 4; i++) c.set(px + 3 + i * 2, py + 2, [...R.cyan[4], 255]);
    }
  }

  rimLight(c, R.cyan[3], 1, 90);
  outline(c, R.night[0]);
  return c;
}

function linkArm() {
  const sheet = new Px(ARM_W * 3, ARM_H);
  for (let f = 0; f < 3; f++) blit(sheet, armFrame(f), f * ARM_W, 0);
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
