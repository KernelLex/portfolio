import Phaser from 'phaser';
import { ADD, PIXEL_FONT, SIGN_FONT, addLight, colour, neonText } from './shared';

/**
 * Signs that hang off buildings the way real ones do - a casing, the hardware
 * holding it up, the light it throws - and that move like the digital boards
 * on a real night street: messages roll over, bulbs chase round the casing,
 * letters light up one after another. Everything is world-space at the street
 * front's depth, so a sign never slides across its wall.
 *
 * Casings are nine-slices of sign-frame.png (frame 0 steel, 1 brass), so they
 * fit whatever they hold.
 */

const CASING_INSET = 4;
const WARM_WHITE = 0xffe9c8;
const HOLD_MS = 2600;
const SWAP_MS = 220;

export interface Animated {
  update(dt: number): void;
}

export type Sign = {
  /** Everything that should breathe and drop out together. */
  parts: Phaser.GameObjects.GameObject[];
  lights: Phaser.GameObjects.Image[];
};

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

/** A strip of 2x2 bulbs along an edge, lit in a three-step chase. */
class Bulbs implements Animated {
  private dots: Phaser.GameObjects.Rectangle[] = [];
  private tick = 0;
  private phase = 0;

  constructor(scene: Phaser.Scene, x0: number, x1: number, ys: number[], depth: number) {
    for (const y of ys) {
      for (let x = x0; x <= x1; x += 5) {
        this.dots.push(scene.add.rectangle(x, y, 2, 2, WARM_WHITE).setOrigin(0.5).setDepth(depth));
      }
    }
  }

  update(dt: number): void {
    this.tick += dt * 1000;
    if (this.tick < 120) return;
    this.tick = 0;
    this.phase = (this.phase + 1) % 3;
    this.dots.forEach((d, i) => d.setAlpha((i + this.phase) % 3 === 0 ? 1 : 0.22));
  }
}

export type LedOptions = {
  x: number;
  /** Centre of the face for a wall mount; ignored on a roof. */
  y: number;
  messages: ReadonlyArray<string>;
  color: string;
  depth: number;
  casing?: 0 | 1;
  /** Stand it on a scaffold on this roof line instead of fixing it to a wall. */
  roofY?: number;
};

/**
 * A lit sign whose face rolls through a few short messages - the project's
 * name in the headline font, then what it is - with a scan line wiping the
 * face at each change and bulbs chasing round the casing.
 */
export class LedSign implements Animated {
  private texts: Phaser.GameObjects.Text[];
  private scan: Phaser.GameObjects.Rectangle;
  private bulbs: Bulbs;
  private index = 0;
  private clock = 0;
  private faceTop: number;
  private faceH: number;
  readonly sign: Sign;

  constructor(
    private scene: Phaser.Scene,
    o: LedOptions,
  ) {
    const num = colour(o.color);
    this.texts = o.messages.map((m, i) =>
      scene.add
        .text(0, 0, m, {
          fontFamily: i === 0 ? PIXEL_FONT : SIGN_FONT,
          fontSize: '8px',
          color: o.color,
          padding: { x: 3, y: 3 },
        })
        .setShadow(0, 0, o.color, 3, false, true)
        .setOrigin(0.5)
        .setResolution(2)
        .setDepth(o.depth + 0.1),
    );
    const faceW = Math.max(...this.texts.map((t) => t.width)) + 6;
    this.faceH = 15;
    const w = faceW + CASING_INSET * 2;
    const h = this.faceH + CASING_INSET * 2;

    const legH = 14;
    const cy = o.roofY !== undefined ? o.roofY - legH - h / 2 : o.y;
    this.faceTop = cy - this.faceH / 2;
    const box = casing(scene, o.x, cy, w, h, o.casing ?? 0, o.depth);

    const parts: Phaser.GameObjects.GameObject[] = [box, ...this.texts];
    if (o.roofY !== undefined) parts.push(this.scaffold(o.x, cy + h / 2, w, o.roofY, o.depth));

    // Messages clip to the face, so the roll-over reads as an LED panel.
    const shape = scene.make.graphics({ x: 0, y: 0 }, false);
    shape.fillStyle(0xffffff).fillRect(o.x - faceW / 2, this.faceTop, faceW, this.faceH);
    const mask = shape.createGeometryMask();
    this.texts.forEach((t, i) => {
      t.setPosition(o.x, cy).setMask(mask).setAlpha(i === 0 ? 1 : 0);
    });

    this.scan = scene.add
      .rectangle(o.x, this.faceTop, faceW, 1, 0xffffff, 1)
      .setAlpha(0)
      .setBlendMode(ADD)
      .setDepth(o.depth + 0.2)
      .setMask(mask);

    this.bulbs = new Bulbs(scene, o.x - w / 2 + 3, o.x + w / 2 - 3, [cy - h / 2 + 1, cy + h / 2 - 1], o.depth + 0.15);

    const lights = [
      addLight(scene, o.x, cy, num, 0.3, w / 26, h / 14, o.depth - 0.1),
      addLight(scene, o.x, cy + h * 1.4, num, 0.1, w / 40, 0.9, o.depth - 0.1),
      ...[-1, 1].map((side) => addLight(scene, o.x + side * (w / 2 - 10), cy - h / 2 + 4, WARM_WHITE, 0.14, 0.45, 0.55, o.depth + 0.15)),
    ];
    this.sign = { parts, lights };
  }

  private scaffold(x: number, bottom: number, w: number, roofY: number, depth: number): Phaser.GameObjects.Graphics {
    const g = this.scene.add.graphics().setDepth(depth - 0.05);
    const legs = [x - w / 3, x + w / 3];
    const legH = roofY - bottom;
    g.fillStyle(0x080b16, 1);
    for (const lx of legs) g.fillRect(Math.round(lx) - 1, bottom, 2, legH);
    g.fillRect(Math.round(x - w / 2), bottom, Math.round(w), 2);
    g.lineStyle(1, 0x121a2e, 1);
    g.lineBetween(legs[0], bottom + 2, legs[1], roofY - 1);
    g.lineBetween(legs[1], bottom + 2, legs[0], roofY - 1);
    g.fillStyle(0x1b2540, 1);
    for (const lx of legs) g.fillRect(Math.round(lx) - 1, bottom, 1, legH);
    return g;
  }

  update(dt: number): void {
    this.bulbs.update(dt);
    if (this.texts.length < 2) return;
    this.clock += dt * 1000;
    if (this.clock < HOLD_MS) return;
    this.clock = 0;

    const out = this.texts[this.index];
    this.index = (this.index + 1) % this.texts.length;
    const into = this.texts[this.index];
    const y = out.y;
    this.scene.tweens.add({ targets: out, y: y - 8, alpha: 0, duration: SWAP_MS, ease: 'Quad.easeIn', onComplete: () => out.setY(y) });
    into.setY(y + 8).setAlpha(0);
    this.scene.tweens.add({ targets: into, y, alpha: 1, duration: SWAP_MS, delay: SWAP_MS * 0.6, ease: 'Quad.easeOut' });
    this.scan.setY(this.faceTop).setAlpha(0.7);
    this.scene.tweens.add({ targets: this.scan, y: this.faceTop + this.faceH, alpha: 0, duration: SWAP_MS * 1.6 });
  }
}

/**
 * A vertical sign on brackets, sticking out from the corner of a building.
 * Its letters light one after another down the blade, then the whole sign
 * flashes, then it settles - the classic chase.
 */
export class Blade implements Animated {
  private letters: Phaser.GameObjects.Text[] = [];
  private clock = 0;
  readonly sign: Sign;

  constructor(scene: Phaser.Scene, o: { x: number; y: number; label: string; color: string; depth: number; wallSide: 'left' | 'right'; casing?: 0 | 1 }) {
    const num = colour(o.color);
    const pitch = 12;
    const h = o.label.length * pitch + 10;
    const w = 22;
    const box = casing(scene, o.x, o.y + h / 2, w, h, o.casing ?? 0, o.depth);
    o.label.split('').forEach((ch, i) => {
      this.letters.push(
        scene.add
          .text(o.x, o.y + 6 + i * pitch + pitch / 2, ch, { fontFamily: PIXEL_FONT, fontSize: '8px', color: o.color, padding: { x: 3, y: 3 } })
          .setShadow(0, 0, o.color, 3, false, true)
          .setOrigin(0.5)
          .setResolution(2)
          .setDepth(o.depth + 0.1),
      );
    });

    const toWall = o.wallSide === 'left' ? -1 : 1;
    for (const by of [o.y + 8, o.y + h - 10]) {
      scene.add.image(o.x + toWall * (w / 2 + 8), by, 'sign-bracket').setFlipX(toWall > 0).setDepth(o.depth - 0.05);
    }
    const lights = [
      addLight(scene, o.x, o.y + h / 2, num, 0.32, 0.9, h / 18, o.depth - 0.1),
      addLight(scene, o.x + toWall * 14, o.y + h / 2, num, 0.12, 0.7, h / 22, o.depth - 0.2),
    ];
    this.sign = { parts: [box, ...this.letters], lights };
  }

  update(dt: number): void {
    this.clock += dt * 1000;
    const n = this.letters.length;
    const lightUp = n * 140;
    const cycle = lightUp + 1600;
    const t = this.clock % cycle;
    this.letters.forEach((l, i) => {
      if (t < lightUp) l.setAlpha(t > i * 140 ? 1 : 0.25);
      else if (t < lightUp + 600) l.setAlpha(Math.floor((t - lightUp) / 150) % 2 ? 0.35 : 1);
      else l.setAlpha(1);
    });
  }
}

/** Neon lettering on a shop's fascia band, spilling onto the pavement. */
export function fascia(scene: Phaser.Scene, o: { x: number; y: number; label: string; color: string; depth: number; groundY: number }): Sign {
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
export class Ticker implements Animated {
  private label: Phaser.GameObjects.Text;
  private start: number;
  private left: number;

  constructor(scene: Phaser.Scene, o: { x: number; y: number; w: number; text: string; color: string; depth: number }) {
    scene.add.rectangle(o.x, o.y, o.w, 10, 0x05060d, 0.95).setStrokeStyle(1, 0x1e2840).setDepth(o.depth);
    this.label = scene.add
      .text(o.x + o.w / 2, o.y, o.text, { fontFamily: SIGN_FONT, fontSize: '8px', color: o.color })
      .setOrigin(0, 0.5)
      .setResolution(2)
      .setDepth(o.depth + 0.1);
    const shape = scene.make.graphics({ x: 0, y: 0 }, false);
    shape.fillStyle(0xffffff).fillRect(o.x - o.w / 2 + 1, o.y - 5, o.w - 2, 10);
    this.label.setMask(shape.createGeometryMask());
    addLight(scene, o.x, o.y, colour(o.color), 0.12, o.w / 40, 0.3, o.depth - 0.1);
    this.start = o.x + o.w / 2;
    this.left = o.x - o.w / 2;
  }

  update(dt: number): void {
    this.label.x -= 24 * dt;
    if (this.label.x + this.label.width < this.left) this.label.x = this.start;
  }
}

/** Neon never sits still: a slow breathe plus the occasional dropout. */
export function flicker(scene: Phaser.Scene, sign: Sign): void {
  const base = sign.lights.map((l) => l.alpha);
  const apply = (k: number) => {
    for (const p of sign.parts) (p as unknown as Phaser.GameObjects.Components.Alpha).setAlpha?.(k);
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

/** For animated signs, flicker only their light - their faces have their own motion. */
export function flickerLights(scene: Phaser.Scene, sign: Sign): void {
  flicker(scene, { parts: [], lights: sign.lights });
}
