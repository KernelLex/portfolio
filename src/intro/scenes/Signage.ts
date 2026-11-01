import Phaser from 'phaser';
import { ADD, PIXEL_FONT, SIGN_FONT, addLight, colour, neonText } from './shared';

/**
 * Signs that hang off buildings the way real ones do: a casing, the hardware
 * holding it up, and the light it throws. Everything is world-space at the
 * street front's depth, so a sign never slides across its wall.
 *
 * Casings are nine-slices of sign-frame.png (frame 0 steel, 1 brass), so they
 * fit whatever text they hold.
 */

const CASING_INSET = 4;
const WARM_WHITE = 0xffe9c8;

export type Sign = {
  /** Everything that should breathe and drop out together. */
  parts: Phaser.GameObjects.GameObject[];
  lights: Phaser.GameObjects.Image[];
};

type Base = { x: number; y: number; label: string; color: string; depth: number; casing?: 0 | 1 };

function casing(
  scene: Phaser.Scene,
  x: number,
  y: number,
  w: number,
  h: number,
  frame: 0 | 1,
  depth: number,
): Phaser.GameObjects.NineSlice {
  return scene.add
    .nineslice(x, y, 'sign-frame', frame, Math.round(w), Math.round(h), CASING_INSET, CASING_INSET, CASING_INSET, CASING_INSET)
    .setDepth(depth);
}

/**
 * Two pools of warm light across the top of a sign, as if lamps above it
 * were washing its face. (Drawn lamp heads read as dark blobs at this size,
 * so only their light is shown.)
 */
function spotlights(scene: Phaser.Scene, x: number, top: number, w: number, depth: number): Phaser.GameObjects.Image[] {
  return [-1, 1].map((side) =>
    addLight(scene, x + side * (w / 2 - 10), top + 4, WARM_WHITE, 0.16, 0.45, 0.55, depth + 0.15),
  );
}

/** A backlit box bolted flat to a wall, lit from above. */
export function wallBox(scene: Phaser.Scene, o: Base & { size?: number; spots?: boolean }): Sign {
  const num = colour(o.color);
  const text = neonText(scene, o.x, o.y, o.label, o.color, o.size ?? 8).setDepth(o.depth + 0.1);
  const w = text.width + 2;
  const h = text.height - 2;
  const box = casing(scene, o.x, o.y, w, h, o.casing ?? 0, o.depth);
  const lights = [
    addLight(scene, o.x, o.y, num, 0.3, w / 26, h / 16, o.depth - 0.1), // halo on the wall
    addLight(scene, o.x, o.y + h * 1.4, num, 0.1, w / 40, 0.9, o.depth - 0.1), // spill down the facade
  ];
  if (o.spots !== false) lights.push(...spotlights(scene, o.x, o.y - h / 2, w, o.depth));
  return { parts: [box, text], lights };
}

/** A vertical sign on brackets, sticking out from the corner of a building. */
export function blade(scene: Phaser.Scene, o: Base & { wallSide: 'left' | 'right' }): Sign {
  const num = colour(o.color);
  const text = scene.add
    .text(o.x, o.y, o.label.split('').join('\n'), {
      fontFamily: PIXEL_FONT,
      fontSize: '8px',
      color: o.color,
      align: 'center',
      lineSpacing: 4,
      padding: { x: 6, y: 6 },
    })
    .setShadow(0, 0, o.color, 5, false, true)
    .setOrigin(0.5, 0)
    .setResolution(2)
    .setDepth(o.depth + 0.1);
  const w = 22;
  const h = text.height;
  const box = casing(scene, o.x, o.y + h / 2, w, h, o.casing ?? 0, o.depth);

  // Brackets reach from the wall to the sign, top and bottom.
  const toWall = o.wallSide === 'left' ? -1 : 1;
  for (const by of [o.y + 8, o.y + h - 10]) {
    scene.add
      .image(o.x + toWall * (w / 2 + 8), by, 'sign-bracket')
      .setFlipX(toWall > 0)
      .setDepth(o.depth - 0.05);
  }
  const lights = [
    addLight(scene, o.x, o.y + h / 2, num, 0.32, 0.9, h / 18, o.depth - 0.1),
    addLight(scene, o.x + toWall * 14, o.y + h / 2, num, 0.12, 0.7, h / 22, o.depth - 0.2), // on the wall
  ];
  return { parts: [box, text], lights };
}

/** A box on a scaffold, standing on a roof. */
export function rooftop(scene: Phaser.Scene, o: Base & { roofY: number }): Sign {
  const num = colour(o.color);
  const legH = 14;
  const text = neonText(scene, o.x, 0, o.label, o.color, 8).setDepth(o.depth + 0.1);
  const w = text.width + 6;
  const h = text.height + 2;
  const cy = o.roofY - legH - h / 2;
  text.y = cy;
  const box = casing(scene, o.x, cy, w, h, o.casing ?? 0, o.depth);

  const g = scene.add.graphics().setDepth(o.depth - 0.05);
  const bottom = cy + h / 2;
  const legs = [o.x - w / 3, o.x + w / 3];
  g.fillStyle(0x080b16, 1);
  for (const lx of legs) g.fillRect(Math.round(lx) - 1, bottom, 2, legH);
  g.fillRect(Math.round(o.x - w / 2), bottom, Math.round(w), 2); // catwalk
  g.lineStyle(1, 0x121a2e, 1);
  g.lineBetween(legs[0], bottom + 2, legs[1], o.roofY - 1);
  g.lineBetween(legs[1], bottom + 2, legs[0], o.roofY - 1);
  g.fillStyle(0x1b2540, 1);
  for (const lx of legs) g.fillRect(Math.round(lx) - 1, bottom, 1, legH);

  const lights = [
    addLight(scene, o.x, cy, num, 0.3, w / 26, h / 16, o.depth - 0.1),
    ...spotlights(scene, o.x, cy - h / 2, w, o.depth),
  ];
  return { parts: [box, text, g], lights };
}

/** Neon lettering on a shop's fascia band, spilling onto the pavement. */
export function fascia(scene: Phaser.Scene, o: Base & { groundY: number }): Sign {
  const num = colour(o.color);
  const text = neonText(scene, o.x, o.y, o.label, o.color, 8, SIGN_FONT).setDepth(o.depth + 0.1);
  const lights = [
    addLight(scene, o.x, o.y, num, 0.22, text.width / 30, 0.4, o.depth),
    addLight(scene, o.x, o.groundY + 6, num, 0.18, text.width / 26, 0.5, 6),
  ];
  return { parts: [text], lights };
}

/**
 * A strip of LED text scrolling right to left under a sign, clipped to its
 * window by a mask so it reads as a ticker rather than a sliding label.
 */
export function ticker(
  scene: Phaser.Scene,
  o: { x: number; y: number; w: number; text: string; color: string; depth: number },
): { update: (dt: number) => void } {
  scene.add.rectangle(o.x, o.y, o.w, 10, 0x05060d, 0.95).setStrokeStyle(1, 0x1e2840).setDepth(o.depth);
  const label = scene.add
    .text(o.x + o.w / 2, o.y, o.text, { fontFamily: SIGN_FONT, fontSize: '8px', color: o.color })
    .setOrigin(0, 0.5)
    .setResolution(2)
    .setDepth(o.depth + 0.1);
  const shape = scene.make.graphics({ x: 0, y: 0 }, false);
  shape.fillStyle(0xffffff).fillRect(o.x - o.w / 2 + 1, o.y - 5, o.w - 2, 10);
  label.setMask(shape.createGeometryMask());
  addLight(scene, o.x, o.y, colour(o.color), 0.12, o.w / 40, 0.3, o.depth - 0.1).setBlendMode(ADD);

  const start = o.x + o.w / 2;
  return {
    update: (dt: number) => {
      label.x -= 24 * dt;
      if (label.x + label.width < o.x - o.w / 2) label.x = start;
    },
  };
}

/** Neon never sits still: a slow breathe plus the occasional dropout. */
export function flicker(scene: Phaser.Scene, sign: Sign): void {
  const base = sign.lights.map((l) => l.alpha);
  const apply = (k: number) => {
    for (const p of sign.parts) (p as unknown as Phaser.GameObjects.Components.Alpha).setAlpha(k);
    sign.lights.forEach((l, i) => l.setAlpha(base[i] * k));
  };
  scene.tweens.addCounter({
    from: 0.84,
    to: 1,
    duration: 900 + Math.random() * 1400,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.easeInOut',
    onUpdate: (tween) => apply(tween.getValue() ?? 1),
  });
  scene.time.addEvent({
    delay: 2400 + Math.random() * 4200,
    loop: true,
    callback: () => {
      apply(0.25);
      scene.time.delayedCall(60, () => apply(0.9));
      scene.time.delayedCall(140, () => apply(0.35));
      scene.time.delayedCall(210, () => apply(1));
    },
  });
}
