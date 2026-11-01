import Phaser from 'phaser';
import { introPalette } from '../../config';
import { LINK } from '../../content/intro';
import { playAlarm, playCableOut, playJackIn } from '../../lib/sound';
import { VIEW_H } from '../viewport';
import { ADD, PIXEL_FONT, SIGN_FONT, addLight, attachPostFX, colour } from './shared';

/** Mirrors scripts/art/link.mjs: where the cable leaves the wrist and seats in the socket. */
const WRIST_PORT = { x: 99, y: 24 };
const SOCKET = { x: 36, y: 54 };
const ARM = { w: 150, h: 64 };
const PORT = { w: 110, h: 96 };
const PLUG_W = 20;

const BAND_TOP = 66;
const BAND_H = 138;
const RED = 0xff2a3a;
const RED_DARK = 0x1a0306;
const RED_STRIPE = 0x3a0a10;

export type LinkSceneData = {
  /** Called once the screen has collapsed to black. */
  done: () => void;
  reducedMotion: boolean;
};

type Point = { x: number; y: number };

const bezier = (a: Point, c: Point, b: Point, t: number): Point => {
  const u = 1 - t;
  return { x: u * u * a.x + 2 * u * t * c.x + t * t * b.x, y: u * u * a.y + 2 * u * t * c.y + t * t * b.y };
};

/**
 * The jack-in. Played over the cafe the moment the player connects:
 *
 *   alarm    two red flashes and a shake - something is about to happen
 *   band     black bars slam in around a red cinematic strip
 *   close-up the wrist port opens, the cable whips across, the plug seats
 *   connect  sparks, a flash, LINK ESTABLISHED, data pulsing down the line
 *   collapse the bars close to a line, like a screen switching off
 *
 * It ends on black, which is exactly where the React boot sequence begins.
 */
export class LinkScene extends Phaser.Scene {
  private stripes!: Phaser.GameObjects.Graphics;
  private cable!: Phaser.GameObjects.Graphics;
  private band!: Phaser.GameObjects.Container;
  private stripeShift = 0;
  private path: { start: Point; ctrl: Point; tip: Point } | null = null;

  constructor() {
    super('link');
  }

  create(data: LinkSceneData): void {
    const w = this.scale.width;
    const cy = BAND_TOP + BAND_H / 2;
    attachPostFX(this);

    // The close-up's layout scales with the viewport, so a narrow phone still
    // fits both ends of the cable.
    const armX = Math.round(w * 0.22 - WRIST_PORT.x);
    const armY = Math.round(cy - ARM.h / 2 - 6);
    const portX = Math.round(w * 0.78 - SOCKET.x);
    const portY = Math.round(cy - PORT.h / 2 + 4);
    const start = { x: armX + WRIST_PORT.x, y: armY + WRIST_PORT.y };
    const seat = { x: portX + SOCKET.x - PLUG_W / 2 + 2, y: portY + SOCKET.y };

    /* --- the band: red, striped, glowing, edged ----------------------- */
    this.stripes = this.add.graphics();
    const glow = addLight(this, w / 2, cy, RED, 0.32, w / 40, 2.4, 0);
    const edges = this.add.graphics();
    edges.fillStyle(RED, 1).fillRect(0, BAND_TOP, w, 2).fillRect(0, BAND_TOP + BAND_H - 2, w, 2);

    const arm = this.add.sprite(armX, armY, 'link-arm', 0).setOrigin(0, 0);
    const port = this.add.sprite(portX, portY, 'link-port', 0).setOrigin(0, 0);
    this.cable = this.add.graphics();
    const plug = this.add.image(start.x, start.y, 'link-plug').setOrigin(0.5).setVisible(false);
    const socketGlow = addLight(this, seat.x + PLUG_W / 2, seat.y, colour(introPalette.cyan), 0, 0.5, 0.5, 0);

    const fontFit = Math.min(16, Math.floor((w - 24) / LINK.established.length));
    const jacking = this.add
      .text(w / 2, BAND_TOP + 16, LINK.jacking, { fontFamily: PIXEL_FONT, fontSize: '10px', color: '#ffffff' })
      .setOrigin(0.5)
      .setShadow(0, 0, '#ff2a3a', 6, false, true)
      .setResolution(2)
      .setAlpha(0);
    const established = this.add
      .text(w / 2, BAND_TOP + 18, LINK.established, {
        fontFamily: PIXEL_FONT,
        fontSize: fontFit + 'px',
        color: '#ff4d5e',
        padding: { x: 6, y: 6 },
      })
      .setOrigin(0.5)
      .setShadow(0, 0, '#ff2a3a', 8, false, true)
      .setResolution(2)
      .setAlpha(0);
    const detail = this.add
      .text(w / 2, BAND_TOP + BAND_H - 12, LINK.detail, { fontFamily: SIGN_FONT, fontSize: '8px', color: '#ffb0cf' })
      .setOrigin(0.5)
      .setResolution(2)
      .setAlpha(0);

    this.band = this.add.container(-w, 0, [
      this.stripes,
      glow,
      edges,
      port,
      arm,
      this.cable,
      plug,
      socketGlow,
      jacking,
      established,
      detail,
    ]);
    this.drawStripes(w);
    this.band.setVisible(data.reducedMotion);

    /* --- letterbox bars, full height, starting off screen -------------- */
    // Full height so that closing them to a line later is just a move.
    const topBar = this.add.rectangle(0, 0, w, VIEW_H, 0x000000).setOrigin(0, 1);
    const bottomBar = this.add.rectangle(0, VIEW_H, w, VIEW_H, 0x000000).setOrigin(0, 0);
    // Fill at full strength and animate the object's alpha: a fill alpha of 0
    // multiplies everything after it to nothing.
    const flash = this.add.rectangle(0, BAND_TOP, w, BAND_H, 0xffffff, 1).setOrigin(0, 0).setAlpha(0);

    if (data.reducedMotion) {
      // No flashing, no shaking: the connected frame, held, then black.
      topBar.y = BAND_TOP;
      bottomBar.y = BAND_TOP + BAND_H;
      this.band.x = 0;
      arm.setFrame(2);
      port.setFrame(1);
      this.setCable(start, seat, 1, plug);
      established.setAlpha(1);
      detail.setAlpha(1);
      this.time.delayedCall(1100, () => data.done());
      return;
    }

    /* --- 0ms: the alarm ---------------------------------------------- */
    const alarm = this.add.rectangle(0, 0, w, VIEW_H, 0xff1a2e, 1).setOrigin(0, 0).setAlpha(0);
    alarm.setDepth(-1);
    playAlarm();
    this.tweens.add({ targets: alarm, alpha: 0.5, duration: 110, yoyo: true, repeat: 1, hold: 40 });
    this.scene.get('cafe')?.cameras.main.shake(260, 0.006);

    /* --- 260ms: bars slam, band slides in ----------------------------- */
    this.time.delayedCall(260, () => {
      this.tweens.add({ targets: topBar, y: BAND_TOP, duration: 220, ease: 'Cubic.easeOut' });
      this.tweens.add({ targets: bottomBar, y: BAND_TOP + BAND_H, duration: 220, ease: 'Cubic.easeOut' });
      this.band.setVisible(true);
      this.tweens.add({ targets: this.band, x: 0, duration: 260, ease: 'Cubic.easeOut' });
    });

    /* --- 560ms: the close-up arrives ---------------------------------- */
    arm.x -= 120;
    port.x += 120;
    this.time.delayedCall(560, () => {
      this.tweens.add({ targets: arm, x: armX, duration: 280, ease: 'Back.easeOut' });
      this.tweens.add({ targets: port, x: portX, duration: 280, ease: 'Back.easeOut' });
      this.tweens.add({ targets: jacking, alpha: 1, duration: 120, yoyo: true, repeat: 3, hold: 120 });
    });

    /* --- 900ms: the wrist opens, the cable whips across ---------------- */
    this.time.delayedCall(900, () => arm.setFrame(1));
    this.time.delayedCall(990, () => arm.setFrame(2));
    this.time.delayedCall(1050, () => {
      playCableOut();
      plug.setVisible(true);
      this.tweens.addCounter({
        from: 0,
        to: 1,
        duration: 520,
        ease: 'Cubic.easeInOut',
        onUpdate: (tw) => this.setCable(start, seat, tw.getValue() ?? 1, plug),
      });
    });

    /* --- 1570ms: it seats --------------------------------------------- */
    this.time.delayedCall(1570, () => {
      playJackIn();
      port.setFrame(1);
      socketGlow.setAlpha(0.6);
      this.tweens.killTweensOf(jacking);
      jacking.setAlpha(0);
      this.cameras.main.shake(140, 0.01);
      this.tweens.add({ targets: flash, alpha: { from: 0.75, to: 0 }, duration: 160 });
      this.add
        .particles(seat.x + PLUG_W / 2, seat.y, 'rain-drop', {
          lifespan: 420,
          speed: { min: 60, max: 170 },
          angle: { min: 140, max: 320 },
          gravityY: 320,
          scaleY: { min: 0.4, max: 1 },
          tint: [0xffffff, colour(introPalette.accent), colour(introPalette.cyan)],
          blendMode: ADD,
          emitting: false,
        })
        .explode(18);
      established.setScale(1.8);
      this.tweens.add({ targets: established, alpha: 1, scale: 1, duration: 180, ease: 'Back.easeOut' });
      this.tweens.add({ targets: detail, alpha: 1, duration: 200, delay: 160 });
      this.pulse(socketGlow);
    });

    /* --- 1720-2500ms: the band glitches as data floods in ------------- */
    this.time.delayedCall(1720, () => {
      for (let i = 0; i < 7; i++) {
        this.time.delayedCall(i * 110, () => {
          this.band.x = Phaser.Math.Between(-6, 6);
          established.setAlpha(Math.random() < 0.3 ? 0.4 : 1);
          this.time.delayedCall(50, () => {
            this.band.x = 0;
            established.setAlpha(1);
          });
        });
      }
    });

    /* --- 2600ms: collapse to a line, then black ------------------------ */
    this.time.delayedCall(2600, () => {
      this.tweens.add({ targets: [topBar, bottomBar], y: cy, duration: 200, ease: 'Cubic.easeIn' });
    });
    this.time.delayedCall(2800, () => {
      const line = this.add.rectangle(w / 2, cy, w, 2, 0xffffff).setOrigin(0.5);
      this.tweens.add({ targets: line, scaleX: 0, duration: 160, ease: 'Cubic.easeIn' });
    });
    this.time.delayedCall(3000, () => data.done());
  }

  update(_time: number, delta: number): void {
    // The stripes drift, so the band never reads as a still frame.
    this.stripeShift = (this.stripeShift + delta * 0.03) % 16;
    this.drawStripes(this.scale.width);
  }

  private drawStripes(w: number): void {
    const g = this.stripes;
    g.clear();
    g.fillStyle(RED_DARK, 1).fillRect(0, BAND_TOP, w, BAND_H);
    g.fillStyle(RED_STRIPE, 1);
    for (let x = -BAND_H - 16 + this.stripeShift; x < w; x += 16) {
      g.fillTriangle(x, BAND_TOP + BAND_H, x + 6, BAND_TOP + BAND_H, x + BAND_H + 6, BAND_TOP);
      g.fillTriangle(x, BAND_TOP + BAND_H, x + BAND_H + 6, BAND_TOP, x + BAND_H, BAND_TOP);
    }
  }

  /** Position the plug `k` of the way along the throw and redraw the cable to it. */
  private setCable(start: Point, seat: Point, k: number, plug: Phaser.GameObjects.Image): void {
    // The cable whips up out of the wrist and drops into the socket.
    const tip = {
      x: start.x + (seat.x - start.x) * k,
      y: start.y + (seat.y - start.y) * k - Math.sin(k * Math.PI) * 26,
    };
    // Arched up off the wrist and over the back of the hand, settling into a
    // drop towards the socket - never lying across the knuckles.
    const ctrl = { x: start.x + (tip.x - start.x) * 0.3, y: Math.min(start.y, tip.y) - 30 + 14 * (1 - k) };
    this.path = { start, ctrl, tip };

    const points: Point[] = [];
    for (let i = 0; i <= 24; i++) points.push(bezier(start, ctrl, tip, i / 24));
    const g = this.cable;
    g.clear();
    g.lineStyle(3, 0x05060d, 1).strokePoints(points, false);
    g.lineStyle(1, colour(introPalette.accent), 0.9).strokePoints(
      points.map((p) => ({ x: p.x, y: p.y - 1 })),
      false,
    );

    const before = bezier(start, ctrl, tip, 0.94);
    plug.setPosition(tip.x, tip.y).setRotation(Math.atan2(tip.y - before.y, tip.x - before.x));
  }

  /** Data running back up the cable from the socket to the wrist, three times. */
  private pulse(socketGlow: Phaser.GameObjects.Image): void {
    if (!this.path) return;
    const { start, ctrl, tip } = this.path;
    for (let i = 0; i < 3; i++) {
      const dot = addLight(this, tip.x, tip.y, colour(introPalette.cyan), 0.9, 0.16, 0.16, 0);
      this.band.add(dot);
      this.tweens.addCounter({
        from: 1,
        to: 0,
        duration: 420,
        delay: 120 + i * 220,
        onUpdate: (tw) => {
          const p = bezier(start, ctrl, tip, tw.getValue() ?? 0);
          dot.setPosition(p.x, p.y);
        },
        onComplete: () => dot.destroy(),
      });
    }
    this.tweens.add({ targets: socketGlow, alpha: { from: 0.7, to: 0.35 }, duration: 220, yoyo: true, repeat: 3 });
  }
}
