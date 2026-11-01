/**
 * The player. Drawn, rim-lit from the right, then outlined - the same three
 * steps as every other sprite in the city.
 */
import { Px, R, hex, outline, rimLight, blit } from './core.mjs';

/* =============================================================== player === */

const PLAYER_W = 32;
const PLAYER_H = 44;
const WALK_FRAMES = 8;
const IDLE_FRAMES = 4;

/**
 * Half the stride: the front foot swings between +STEP and -STEP. One full
 * cycle therefore covers 2 * 2 * STEP = 32px of ground.
 *
 * StreetScene derives the animation frame rate from that 32 and the player's
 * actual speed, which is what stops the feet skating. Change STEP here and the
 * matching constant in StreetScene has to change with it.
 */
const STEP = 8;

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
 * One pose of the character.
 *
 * `swing` is how far the front foot is ahead of the hips (-STEP..+STEP);
 * `bob` lifts the upper body; `lean` tips the torso forward.
 *
 * The upper body bobs, the feet do not - planting the feet is what stops a
 * cycle looking like a sprite being slid along the floor. The legs are drawn
 * with a transparent column between them so outline() separates them.
 */
function playerPose(swing, bob, lean = 0, legs = 'walk') {
  const c = new Px(PLAYER_W, PLAYER_H);

  // Bobbing, leaning upper body.
  const put = (x, y, col) => c.set(x + lean, y + bob, col);
  const rect = (x, y, w, h, col) => {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) put(x + i, y + j, col);
  };
  // Planted lower body.
  const fixed = (x, y, w, h, col) => {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) c.set(x + i, y + j, col);
  };

  // Legs are long enough (12px hip to ankle) to carry a real stride. In the
  // air they either tuck (knee up, foot back under) or reach for the ground.
  const leg = (hipX, off, col) => {
    if (legs === 'tuck') {
      limb(fixed, hipX, 29, hipX + 4, 33, 4, col);
      limb(fixed, hipX + 4, 33, hipX + 1, 37, 4, col);
      fixed(hipX, 37, 6, 2, [...PC.shoe, 255]);
      fixed(hipX, 38, 6, 1, [...PC.sole, 255]);
      return;
    }
    const kneeX = hipX + Math.round(off * 0.5);
    const footX = hipX + off;
    limb(fixed, hipX, 29, kneeX, 35, 4, col);
    limb(fixed, kneeX, 35, footX, 41, 4, col);
    fixed(footX - 1, 41, 6, 2, [...PC.shoe, 255]);
    fixed(footX - 1, 42, 6, 1, [...PC.sole, 255]);
  };
  const legSwing = legs === 'drop' ? 3 : swing;

  // The sleeve has to differ in value from the torso or only the hand reads.
  const arm = (shX, off, col, cuff) => {
    const elbowX = shX + Math.round(off * 0.5);
    const handX = shX + off;
    limb(rect, shX, 18, elbowX, 24, 3, col);
    limb(rect, elbowX, 24, handX, 28, 3, col);
    rect(handX, 28, 3, 1, [...cuff, 255]);
    rect(handX, 29, 2, 3, [...R.skin[1], 255]);
  };

  /* --- back leg and arm, in shade ---------------------------------------- */
  leg(11, -legSwing, [...PC.pants, 255]);
  arm(10, swing, [...PC.hoodDk, 255], R.amber[0]);

  /* --- backpack ----------------------------------------------------------- */
  rect(6, 19, 5, 10, [...PC.pack, 255]);
  rect(6, 19, 1, 10, [...R.night[1], 255]);
  rect(6, 19, 5, 1, [...PC.pack, 255]);

  /* --- torso -------------------------------------------------------------- */
  // Chest wider than the waist, and both narrower than the hood, so the lit
  // edge steps down the form instead of running as one straight stripe.
  rect(11, 17, 10, 1, [...PC.hood, 255]); // sloped shoulders
  rect(10, 18, 12, 7, [...PC.hood, 255]); // chest
  rect(10, 25, 11, 5, [...PC.hood, 255]); // waist
  rect(10, 18, 3, 12, [...PC.hoodDk, 255]); // shaded side
  rect(19, 18, 2, 11, [...PC.hoodHi, 255]); // lit side
  rect(11, 17, 10, 1, [...R.amber[2], 255]); // collar
  rect(11, 21, 9, 1, [...PC.strap, 255]); // pack strap across the chest
  rect(17, 19, 1, 10, [...PC.hoodDk, 255]); // zip
  rect(10, 29, 11, 1, [...R.night[0], 160]); // hem shadow

  /* --- hood and face ------------------------------------------------------ */
  // Crown is rounded and the neck tapers, or the head reads as a box on a box.
  rect(13, 2, 7, 1, [...PC.hood, 255]);
  rect(11, 3, 11, 1, [...PC.hood, 255]);
  rect(10, 4, 13, 10, [...PC.hood, 255]);
  rect(11, 14, 11, 2, [...PC.hood, 255]);
  rect(10, 4, 4, 11, [...PC.hoodDk, 255]); // shaded side
  rect(11, 3, 4, 1, [...PC.hoodDk, 255]);
  rect(7, 7, 3, 7, [...PC.hoodDk, 255]); // hood falling behind the neck
  rect(13, 2, 7, 1, [...PC.hoodHi, 255]); // lit crown
  rect(22, 5, 1, 10, [...PC.hoodHi, 255]); // lit hood edge by the face
  rect(16, 7, 6, 8, [...R.skin[2], 255]); // face in profile
  rect(16, 7, 6, 1, [...R.skin[0], 255]); // hood shadow on the brow
  rect(21, 9, 1, 4, [...R.skin[3], 255]); // lit nose and jaw
  rect(16, 14, 5, 1, [...R.skin[0], 255]); // jawline
  rect(19, 10, 2, 1, [...R.night[0], 255]); // eye
  rect(16, 13, 2, 1, [...PC.hoodDk, 255]); // chin strap of the hood

  /* --- front leg and arm --------------------------------------------------- */
  leg(16, legSwing, [...PC.pantsHi, 255]);
  arm(18, -swing, [...PC.hoodHi, 255], R.amber[2]);

  // Rim first (it reads as light wrapping the form), keyline second.
  rimLight(c, R.amber[3], 1, 120);
  outline(c, R.night[0]);
  return c;
}

/**
 * Contact, down, passing, up - twice, once per leg. Travelling 2*2*STEP of
 * ground per loop.
 */
const WALK_SWING = [STEP, STEP / 2, 0, -STEP / 2, -STEP, -STEP / 2, 0, STEP / 2];
const WALK_BOB = [0, 1, 0, -1, 0, 1, 0, -1];

function playerWalk() {
  const sheet = new Px(PLAYER_W * WALK_FRAMES, PLAYER_H);
  for (let f = 0; f < WALK_FRAMES; f++) {
    // Leaning into the rain while moving.
    blit(sheet, playerPose(WALK_SWING[f], WALK_BOB[f], 1), f * PLAYER_W, 0);
  }
  return sheet;
}

/** Standing still is still moving: a slow breath, barely a pixel of it. */
const IDLE_BOB = [0, 0, 1, 1];

function playerIdle() {
  const sheet = new Px(PLAYER_W * IDLE_FRAMES, PLAYER_H);
  for (let f = 0; f < IDLE_FRAMES; f++) {
    blit(sheet, playerPose(2, IDLE_BOB[f], 0), f * PLAYER_W, 0);
  }
  return sheet;
}

/** Rising (tucked, arms out for balance) and falling (legs reaching down). */
function playerJump() {
  const sheet = new Px(PLAYER_W * 2, PLAYER_H);
  blit(sheet, playerPose(3, -1, 1, 'tuck'), 0, 0);
  blit(sheet, playerPose(2, 0, 1, 'drop'), PLAYER_W, 0);
  return sheet;
}

/**
 * Seen from behind, for the moment at the desk. `seated` drops the figure
 * into the bottom of the cell as head and shoulders only: the chair, drawn in
 * front by the scene, covers everything below.
 */
function playerBack(seated) {
  const c = new Px(PLAYER_W, PLAYER_H);
  const oy = seated ? 20 : 0;
  const rect = (x, y, w, h, col) => c.rect(x, y + oy, w, h, [...col, 255]);

  // hood, rounded at the crown, seam down the middle
  rect(13, 2, 6, 1, PC.hood);
  rect(11, 3, 10, 1, PC.hood);
  rect(10, 4, 12, 11, PC.hood);
  rect(11, 15, 10, 1, PC.hood);
  rect(10, 4, 3, 11, PC.hoodDk);
  rect(20, 5, 2, 9, PC.hoodHi);
  rect(16, 3, 1, 11, PC.hoodDk);
  rect(10, 16, 12, 1, R.amber[2]); // collar

  if (seated) {
    // shoulders, elbows out towards the keyboard
    rect(7, 17, 18, 7, PC.hood);
    rect(7, 17, 4, 7, PC.hoodDk);
    rect(21, 18, 3, 6, PC.hoodHi);
    rect(4, 19, 3, 4, PC.hoodDk);
    rect(25, 19, 3, 4, PC.hoodHi);
  } else {
    rect(8, 17, 16, 13, PC.hood);
    rect(8, 17, 4, 13, PC.hoodDk);
    rect(21, 18, 3, 11, PC.hoodHi);
    // the backpack, finally seen properly
    rect(11, 18, 10, 10, PC.pack);
    rect(11, 18, 10, 2, R.night[2]);
    rect(11, 17, 1, 2, PC.strap);
    rect(20, 17, 1, 2, PC.strap);
    // arms at the sides
    rect(6, 18, 2, 10, PC.hoodDk);
    rect(24, 18, 2, 10, PC.hoodHi);
    rect(6, 28, 2, 2, R.skin[1]);
    rect(24, 28, 2, 2, R.skin[1]);
    // legs
    rect(11, 30, 4, 11, PC.pants);
    rect(17, 30, 4, 11, PC.pantsHi);
    rect(10, 41, 5, 2, PC.shoe);
    rect(17, 41, 5, 2, PC.shoe);
  }

  rimLight(c, R.amber[3], 1, 110);
  outline(c, R.night[0]);
  return c;
}

/** Frame 0: standing, turned away. Frame 1: sitting at the desk. */
function playerSit() {
  const sheet = new Px(PLAYER_W * 2, PLAYER_H);
  blit(sheet, playerBack(false), 0, 0);
  blit(sheet, playerBack(true), PLAYER_W, 0);
  return sheet;
}

export { playerIdle, playerWalk, playerJump, playerSit };
