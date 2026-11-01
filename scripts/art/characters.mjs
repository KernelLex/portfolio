/**
 * The player, in techwear: a graphite jacket with glowing seams, a cyan visor,
 * a tech pack with an antenna and an LED strip, knee pads and light-up soles.
 * The amber collar is the accent the whole site shares. Drawn, rim-lit from
 * the right, then outlined - the same three steps as every other sprite in
 * the city.
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
  hood: hex('#20243a'),
  hoodHi: hex('#363d5e'),
  hoodDk: hex('#12141f'),
  pack: hex('#1b1f30'),
  packHi: hex('#2c3350'),
  strap: hex('#6b3f18'),
  // Cargo pants sit lighter than the jacket, or the legs merge into the torso.
  pants: hex('#2e3a57'),
  pantsHi: hex('#415073'),
  knee: hex('#4b5675'),
  shoe: hex('#0e1220'),
  toe: hex('#8c97b3'),
};
/** The glow: seams, visor, wristband, soles. */
const GLOW = R.cyan;

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
  const leg = (hipX, off, col, pad, sole) => {
    if (legs === 'tuck') {
      limb(fixed, hipX, 29, hipX + 4, 33, 4, col);
      limb(fixed, hipX + 4, 33, hipX + 1, 37, 4, col);
      fixed(hipX + 3, 32, 3, 2, [...pad, 255]);
      fixed(hipX, 37, 6, 2, [...PC.shoe, 255]);
      fixed(hipX + 4, 37, 2, 1, [...PC.toe, 255]);
      fixed(hipX, 38, 6, 1, [...sole, 255]);
      return;
    }
    const kneeX = hipX + Math.round(off * 0.5);
    const footX = hipX + off;
    limb(fixed, hipX, 29, kneeX, 35, 4, col);
    limb(fixed, kneeX, 35, footX, 41, 4, col);
    fixed(kneeX, 34, 4, 2, [...pad, 255]);
    fixed(footX - 1, 41, 6, 2, [...PC.shoe, 255]);
    fixed(footX + 3, 41, 2, 1, [...PC.toe, 255]);
    fixed(footX - 1, 42, 6, 1, [...sole, 255]);
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
  leg(11, -legSwing, [...PC.pants, 255], PC.hoodDk, GLOW[1]);
  arm(10, swing, [...PC.hoodDk, 255], R.amber[0]);

  /* --- tech pack, with an LED strip and an antenna ------------------------- */
  rect(5, 18, 6, 11, [...PC.pack, 255]);
  rect(6, 18, 4, 1, [...PC.packHi, 255]);
  rect(5, 20, 1, 7, [...R.magenta[3], 255]);
  rect(8, 13, 1, 5, [...R.steel[1], 255]);
  rect(8, 12, 1, 1, [...R.magenta[4], 255]);

  /* --- torso -------------------------------------------------------------- */
  // Chest wider than the waist, and both narrower than the hood, so the lit
  // edge steps down the form instead of running as one straight stripe.
  rect(11, 17, 10, 1, [...PC.hood, 255]); // sloped shoulders
  rect(10, 18, 12, 7, [...PC.hood, 255]); // chest
  rect(10, 25, 11, 5, [...PC.hood, 255]); // waist
  rect(10, 18, 3, 12, [...PC.hoodDk, 255]); // shaded side
  rect(19, 18, 2, 11, [...PC.hoodHi, 255]); // lit side
  rect(11, 16, 10, 1, [...R.amber[1], 255]); // high collar
  rect(11, 17, 10, 1, [...R.amber[2], 255]);
  rect(11, 21, 9, 1, [...PC.strap, 255]); // pack strap across the chest
  rect(17, 18, 1, 10, [...GLOW[2], 255]); // glowing zip seam
  rect(12, 24, 5, 1, [...GLOW[1], 255]); // chest panel seam
  rect(10, 28, 11, 1, [...R.night[1], 255]); // belt
  rect(18, 28, 2, 1, [...R.amber[3], 255]); // buckle
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
  rect(21, 11, 1, 3, [...R.skin[3], 255]); // lit nose and jaw
  rect(16, 14, 5, 1, [...R.skin[0], 255]); // jawline
  rect(16, 13, 2, 1, [...PC.hoodDk, 255]); // chin strap of the hood
  // the visor: a band of light across the eyes, its arm running back to the ear
  rect(16, 9, 7, 1, [...GLOW[4], 255]);
  rect(16, 10, 7, 1, [...GLOW[2], 255]);
  rect(13, 10, 3, 1, [...GLOW[1], 255]);
  rect(12, 9, 1, 2, [...R.amber[3], 255]); // comms bud

  /* --- front leg and arm --------------------------------------------------- */
  leg(16, legSwing, [...PC.pantsHi, 255], PC.knee, GLOW[3]);
  arm(18, -swing, [...PC.hoodHi, 255], GLOW[3]); // the wristband: where the link port is

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
 * Seen from behind: at the desk, and walking away through a door. `seated`
 * drops the figure into the bottom of the cell as head and shoulders only -
 * the chair, drawn in front by the scene, covers everything below. `step`
 * lifts the left foot, for a two-frame walk away from the camera.
 */
function playerBack(mode) {
  const c = new Px(PLAYER_W, PLAYER_H);
  const seated = mode === 'seated';
  const oy = seated ? 20 : mode === 'step' ? -1 : 0;
  const rect = (x, y, w, h, col) => c.rect(x, y + oy, w, h, [...col, 255]);
  const ground = (x, y, w, h, col) => c.rect(x, y, w, h, [...col, 255]);

  // hood, rounded at the crown, seam down the middle
  rect(13, 2, 6, 1, PC.hood);
  rect(11, 3, 10, 1, PC.hood);
  rect(10, 4, 12, 11, PC.hood);
  rect(11, 15, 10, 1, PC.hood);
  rect(10, 4, 3, 11, PC.hoodDk);
  rect(20, 5, 2, 9, PC.hoodHi);
  rect(16, 3, 1, 11, PC.hoodDk);
  // the visor's strap round the back of the head, with its clasp
  rect(10, 10, 12, 1, GLOW[1]);
  rect(15, 10, 2, 1, GLOW[3]);
  rect(10, 15, 12, 1, R.amber[1]); // high collar
  rect(10, 16, 12, 1, R.amber[2]);

  if (seated) {
    // shoulders, elbows out towards the keyboard
    rect(7, 17, 18, 7, PC.hood);
    rect(7, 17, 4, 7, PC.hoodDk);
    rect(21, 18, 3, 6, PC.hoodHi);
    rect(4, 19, 3, 4, PC.hoodDk);
    rect(25, 19, 3, 4, PC.hoodHi);
    rect(15, 17, 2, 7, GLOW[1]); // the seam down the back
  } else {
    rect(8, 17, 16, 13, PC.hood);
    rect(8, 17, 4, 13, PC.hoodDk);
    rect(21, 18, 3, 11, PC.hoodHi);
    // the tech pack: LED strip, antenna, straps
    rect(11, 18, 10, 10, PC.pack);
    rect(11, 18, 10, 2, PC.packHi);
    rect(12, 24, 8, 1, R.magenta[3]);
    rect(12, 13, 1, 5, R.steel[1]);
    rect(12, 12, 1, 1, R.magenta[4]);
    rect(11, 17, 1, 2, PC.strap);
    rect(20, 17, 1, 2, PC.strap);
    rect(8, 28, 16, 1, R.night[1]); // belt
    // arms at the sides, the wristband on the right
    rect(6, 18, 2, 10, PC.hoodDk);
    rect(24, 18, 2, 10, PC.hoodHi);
    rect(6, 28, 2, 2, R.skin[1]);
    rect(24, 27, 2, 1, GLOW[3]);
    rect(24, 28, 2, 2, R.skin[1]);
    // legs: the left lifts on the step frame
    const lift = mode === 'step' ? 2 : 0;
    ground(11, 30, 4, 11 - lift, PC.pants);
    ground(10, 41 - lift, 5, 2, PC.shoe);
    ground(10, 43 - lift, 5, 1, GLOW[2]);
    ground(17, 30, 4, 11, PC.pantsHi);
    ground(17, 41, 5, 2, PC.shoe);
    ground(17, 43, 5, 1, GLOW[2]);
  }

  rimLight(c, R.amber[3], 1, 110);
  outline(c, R.night[0]);
  return c;
}

/**
 * Facing the camera, for stepping out of a doorway. `step` lifts the right
 * foot, for a two-frame walk towards the viewer.
 */
function playerFront(step) {
  const c = new Px(PLAYER_W, PLAYER_H);
  const rect = (x, y, w, h, col) => c.rect(x, y, w, h, [...col, 255]);

  // hood framing the face
  rect(13, 2, 6, 1, PC.hood);
  rect(11, 3, 10, 1, PC.hood);
  rect(10, 4, 12, 11, PC.hood);
  rect(11, 15, 10, 1, PC.hood);
  rect(10, 4, 2, 11, PC.hoodDk);
  rect(20, 4, 2, 11, PC.hoodHi);
  rect(13, 2, 6, 1, PC.hoodHi);
  rect(12, 5, 8, 10, R.skin[2]);
  rect(12, 5, 8, 1, R.skin[0]); // hood shadow on the brow
  rect(18, 6, 2, 8, R.skin[3]); // the lit cheek
  rect(15, 11, 1, 1, R.skin[1]); // nose
  rect(15, 13, 2, 1, R.skin[0]); // mouth
  // the visor, edge to edge, with a glint
  rect(11, 8, 10, 1, GLOW[4]);
  rect(11, 9, 10, 1, GLOW[2]);
  rect(18, 8, 1, 1, R.steel[4]);
  rect(10, 15, 12, 1, R.amber[2]); // high collar, open at the throat
  rect(15, 15, 2, 1, PC.hoodDk);

  // jacket: glowing zip, pack straps, belt and buckle
  rect(9, 16, 14, 13, PC.hood);
  rect(9, 16, 2, 13, PC.hoodDk);
  rect(21, 16, 2, 13, PC.hoodHi);
  rect(12, 16, 1, 11, PC.strap);
  rect(19, 16, 1, 11, PC.strap);
  rect(15, 16, 2, 12, GLOW[2]);
  rect(10, 21, 2, 1, GLOW[1]);
  rect(20, 21, 2, 1, GLOW[1]);
  rect(9, 28, 14, 1, R.night[1]);
  rect(15, 28, 2, 1, R.amber[3]);

  // arms; the wristband on the left of the picture is the right wrist
  rect(6, 17, 3, 10, PC.hoodDk);
  rect(23, 17, 3, 10, PC.hoodHi);
  rect(6, 27, 3, 1, GLOW[3]);
  rect(23, 27, 3, 1, R.amber[0]);
  rect(6, 28, 3, 2, R.skin[1]);
  rect(23, 28, 3, 2, R.skin[2]);

  // legs, knee pads, shoes with toe caps and lit soles
  const lift = step ? 2 : 0;
  rect(11, 29, 4, 12, PC.pants);
  rect(11, 34, 4, 2, PC.knee);
  rect(10, 41, 5, 2, PC.shoe);
  rect(11, 41, 3, 1, PC.toe);
  rect(10, 43, 5, 1, GLOW[2]);
  rect(17, 29, 4, 12 - lift, PC.pantsHi);
  rect(17, 34 - lift, 4, 2, PC.knee);
  rect(17, 41 - lift, 5, 2, PC.shoe);
  rect(18, 41 - lift, 3, 1, PC.toe);
  rect(17, 43 - lift, 5, 1, GLOW[2]);

  rimLight(c, R.amber[3], 1, 110);
  outline(c, R.night[0]);
  return c;
}

/** Frame 0: standing, turned away. Frame 1: sitting at the desk. */
function playerSit() {
  const sheet = new Px(PLAYER_W * 2, PLAYER_H);
  blit(sheet, playerBack('stand'), 0, 0);
  blit(sheet, playerBack('seated'), PLAYER_W, 0);
  return sheet;
}

/** Walking through doors: 0-1 away from the camera, 2-3 towards it. */
function playerTurn() {
  const sheet = new Px(PLAYER_W * 4, PLAYER_H);
  blit(sheet, playerBack('stand'), 0, 0);
  blit(sheet, playerBack('step'), PLAYER_W, 0);
  blit(sheet, playerFront(false), PLAYER_W * 2, 0);
  blit(sheet, playerFront(true), PLAYER_W * 3, 0);
  return sheet;
}

export { playerIdle, playerWalk, playerJump, playerSit, playerTurn };
