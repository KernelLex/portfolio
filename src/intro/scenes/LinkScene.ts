import Phaser from 'phaser';
import { introPalette } from '../../config';
import { LINK } from '../../content/intro';
import { setMusicPlace } from '../../lib/music';
import { playAlarm, playCableOut, playClick, playJackIn, playScan, playTick } from '../../lib/sound';
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
const BAND_BOTTOM = BAND_TOP + BAND_H;
/** How far band-wide shapes run past each edge of the screen. */
const OVERHANG = 16;
const RED = 0xff2a3a;
const RED_DARK = 0x1a0306;
const RED_STRIPE = 0x3a0a10;
const CYAN = colour(introPalette.cyan);
const AMBER = colour(introPalette.accent);

/** The cue sheet, in ms from the moment the player jacks in. */
const T = {
  alarmEnd: 900,
  band: 900,
  closeUp: 1150,
  scan: 1500,
  found: 2250,
  cable: 2600,
  seat: 3220,
  syncEnd: 4450,
  glitch: 4500,
  collapse: 4850,
  line: 5050,
  done: 5250,
} as const;
const CABLE_MS = T.seat - T.cable;
const SYNC_MS = T.syncEnd - T.seat - 80;

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
 * The jack-in, played over the cafe the moment the player connects:
 *
 *   alarm    the room flashes red and a hazard banner slams across: LINK REQUEST
 *   band     black bars close in around a red cinematic strip
 *   scan     brackets lock onto the wrist; a scan line finds the port
 *   cable    the port opens and the cable whips across into the PC
 *   sync     sparks, LINK ESTABLISHED, data streaming up the line, a sync bar
 *   collapse an RGB glitch, then the bars close to a line, like a screen going off
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
    this.path = null;
    attachPostFX(this);
    setMusicPlace(null);

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
    // Everything band-wide overhangs both sides, so a glitch jolt never shows the cafe.
    edges.fillStyle(RED, 1).fillRect(-OVERHANG, BAND_TOP, w + OVERHANG * 2, 2).fillRect(-OVERHANG, BAND_BOTTOM - 2, w + OVERHANG * 2, 2);

    const arm = this.add.sprite(armX, armY, 'link-arm', 0).setOrigin(0, 0);
    const port = this.add.sprite(portX, portY, 'link-port', 0).setOrigin(0, 0);
    this.cable = this.add.graphics();
    const plug = this.add.image(start.x, start.y, 'link-plug').setOrigin(0.5).setVisible(false);
    const socketGlow = addLight(this, seat.x + PLUG_W / 2, seat.y, CYAN, 0, 0.5, 0.5, 0);
    const scanner = this.add.graphics();
    const scanLine = this.add.rectangle(0, 0, 1, 1, CYAN, 0.8).setOrigin(0, 0.5).setBlendMode(ADD).setVisible(false);

    const status = this.add
      .text(w / 2, BAND_TOP + 16, '', { fontFamily: PIXEL_FONT, fontSize: '8px', color: '#ffffff' })
      .setOrigin(0.5)
      .setShadow(0, 0, '#ff2a3a', 6, false, true)
      .setResolution(2);

    const fontFit = Math.min(16, Math.floor((w - 24) / LINK.established.length));
    const headline = (color: string) =>
      this.add
        .text(w / 2, BAND_TOP + 18, LINK.established, {
          fontFamily: PIXEL_FONT,
          fontSize: fontFit + 'px',
          color,
          padding: { x: 6, y: 6 },
        })
        .setOrigin(0.5)
        .setResolution(2)
        .setAlpha(0);
    // Two ghost copies, split apart in red and cyan when the signal glitches.
    const splitRed = headline('#ff2a3a').setBlendMode(ADD);
    const splitCyan = headline(introPalette.cyan).setBlendMode(ADD);
    const established = headline('#ff4d5e').setShadow(0, 0, '#ff2a3a', 8, false, true);

    this.band = this.add.container(-w, 0, [
      this.stripes,
      glow,
      edges,
      port,
      arm,
      this.cable,
      plug,
      socketGlow,
      scanner,
      scanLine,
      status,
      splitRed,
      splitCyan,
      established,
    ]);
    this.drawStripes(w);
    this.band.setVisible(data.reducedMotion);

    /* --- letterbox bars, full height, starting off screen -------------- */
    // Full height so that closing them to a line later is just a move.
    const topBar = this.add.rectangle(0, 0, w, VIEW_H, 0x000000).setOrigin(0, 1);
    const bottomBar = this.add.rectangle(0, VIEW_H, w, VIEW_H, 0x000000).setOrigin(0, 0);

    // Read-outs in the lower letterbox: the handshake and the sync bar.
    const barW = Math.min(150, w - 110);
    const barX = Math.round(w / 2 - barW / 2);
    const syncY = BAND_BOTTOM + 20;
    const sync = this.add.graphics();
    const syncLabel = this.add
      .text(barX - 6, syncY, LINK.sync, { fontFamily: SIGN_FONT, fontSize: '8px', color: '#ffb0cf' })
      .setOrigin(1, 0.5)
      .setResolution(2);
    const syncPct = this.add
      .text(barX + barW + 6, syncY, '0%', { fontFamily: SIGN_FONT, fontSize: '8px', color: '#e9ebf2' })
      .setOrigin(0, 0.5)
      .setResolution(2);
    const detail = this.add
      .text(w / 2, syncY + 18, LINK.detail, { fontFamily: SIGN_FONT, fontSize: '8px', color: '#8b93a7' })
      .setOrigin(0.5)
      .setResolution(2);
    const readouts = [sync, syncLabel, syncPct, detail];
    readouts.forEach((o) => o.setAlpha(0));
    const drawSync = (k: number) => {
      sync.clear();
      sync.lineStyle(1, RED, 0.8).strokeRect(barX - 1.5, syncY - 3.5, barW + 3, 7);
      // Segmented, like a power meter: every third pixel column left dark.
      const filled = Math.round(barW * k);
      sync.fillStyle(k >= 1 ? CYAN : RED, 1);
      for (let x = 0; x < filled; x += 3) sync.fillRect(barX + x, syncY - 2, Math.min(2, filled - x), 4);
      syncPct.setText(`${Math.round(k * 100)}%`);
    };

    // Fill at full strength and animate the object's alpha: a fill alpha of 0
    // multiplies everything after it to nothing.
    const flash = this.add.rectangle(0, BAND_TOP, w, BAND_H, 0xffffff, 1).setOrigin(0, 0).setAlpha(0);
    const slices = this.add.graphics();

    if (data.reducedMotion) {
      // No flashing, no shaking: the connected frame, held, then black.
      topBar.y = BAND_TOP;
      bottomBar.y = BAND_BOTTOM;
      this.band.x = 0;
      arm.setFrame(2);
      port.setFrame(1);
      this.setCable(start, seat, 1, plug);
      established.setAlpha(1);
      drawSync(1);
      readouts.forEach((o) => o.setAlpha(1));
      this.time.delayedCall(1400, () => data.done());
      return;
    }

    /* --- the alarm: red room, hazard banner --------------------------- */
    const alarm = this.add.rectangle(0, 0, w, VIEW_H, 0xff1a2e, 1).setOrigin(0, 0).setAlpha(0).setDepth(-1);
    const banner = this.hazardBanner(w);
    playAlarm();
    this.time.delayedCall(450, playAlarm);
    this.tweens.add({ targets: alarm, alpha: 0.55, duration: 120, yoyo: true, repeat: 2, hold: 60 });
    this.scene.get('cafe')?.cameras.main.shake(T.alarmEnd - 100, 0.005);
    banner.x = w;
    this.tweens.add({ targets: banner, x: 0, duration: 170, delay: 60, ease: 'Cubic.easeOut' });
    this.tweens.add({ targets: banner, x: -w, duration: 160, delay: T.alarmEnd - 170, ease: 'Cubic.easeIn' });

    /* --- the band ----------------------------------------------------- */
    this.time.delayedCall(T.band, () => {
      this.tweens.add({ targets: topBar, y: BAND_TOP, duration: 220, ease: 'Cubic.easeOut' });
      this.tweens.add({ targets: bottomBar, y: BAND_BOTTOM, duration: 220, ease: 'Cubic.easeOut' });
      this.band.setVisible(true);
      this.tweens.add({ targets: this.band, x: 0, duration: 260, ease: 'Cubic.easeOut' });
    });

    /* --- the close-up arrives ----------------------------------------- */
    arm.x -= 120;
    port.x += 120;
    this.time.delayedCall(T.closeUp, () => {
      this.tweens.add({ targets: arm, x: armX, duration: 300, ease: 'Back.easeOut' });
      this.tweens.add({ targets: port, x: portX, duration: 300, ease: 'Back.easeOut' });
    });

    /* --- scan: brackets close on the wrist, a line sweeps it ---------- */
    const blink = (text: string, color: string) => {
      this.tweens.killTweensOf(status);
      status.setText(text).setColor(color).setAlpha(1);
      this.tweens.add({ targets: status, alpha: 0.25, duration: 140, yoyo: true, repeat: -1, hold: 160 });
    };
    this.time.delayedCall(T.scan, () => {
      playScan();
      this.time.delayedCall(360, playScan);
      blink(LINK.scanning, '#ffffff');
      const box = { w: 96, h: 60 };
      scanLine.setVisible(true);
      this.tweens.add({
        targets: box,
        w: 26,
        h: 16,
        duration: T.found - T.scan - 60,
        ease: 'Cubic.easeInOut',
        onUpdate: () => this.drawBrackets(scanner, start, box.w, box.h, CYAN),
      });
      this.tweens.addCounter({
        from: 0,
        to: 1,
        duration: (T.found - T.scan) / 2,
        yoyo: true,
        onUpdate: (tw) => {
          const k = tw.getValue() ?? 0;
          const h = box.h;
          scanLine.setPosition(start.x - box.w / 2, start.y - h / 2 + k * h).setSize(box.w, 1);
        },
      });
    });

    /* --- found: the brackets lock, the wrist opens --------------------- */
    this.time.delayedCall(T.found, () => {
      playClick();
      scanLine.setVisible(false);
      blink(LINK.found, introPalette.cyan);
      this.drawBrackets(scanner, start, 26, 16, AMBER);
      this.tweens.add({ targets: scanner, alpha: { from: 1, to: 0.3 }, duration: 90, yoyo: true, repeat: 2 });
    });
    this.time.delayedCall(T.found + 100, () => arm.setFrame(1));
    this.time.delayedCall(T.found + 200, () => arm.setFrame(2));

    /* --- the cable whips across --------------------------------------- */
    this.time.delayedCall(T.cable, () => {
      playCableOut();
      blink(LINK.jacking, '#ffffff');
      this.tweens.killTweensOf(scanner);
      this.tweens.add({ targets: scanner, alpha: 0, duration: 160 });
      plug.setVisible(true);
      this.tweens.addCounter({
        from: 0,
        to: 1,
        duration: CABLE_MS,
        ease: 'Cubic.easeInOut',
        onUpdate: (tw) => this.setCable(start, seat, tw.getValue() ?? 1, plug),
      });
    });

    /* --- it seats: sparks, the headline, data, sync ------------------- */
    this.time.delayedCall(T.seat, () => {
      playJackIn();
      port.setFrame(1);
      socketGlow.setAlpha(0.6);
      this.tweens.killTweensOf(status);
      status.setAlpha(0);
      this.cameras.main.shake(140, 0.01);
      this.tweens.add({ targets: flash, alpha: { from: 0.75, to: 0 }, duration: 160 });
      this.sparks(seat.x + PLUG_W / 2, seat.y);
      established.setScale(1.8);
      this.tweens.add({ targets: established, alpha: 1, scale: 1, duration: 180, ease: 'Back.easeOut' });
      this.tweens.add({ targets: readouts, alpha: 1, duration: 200, delay: 120 });
      drawSync(0);

      const stream = this.time.addEvent({ delay: 240, loop: true, callback: () => this.pulse() });
      this.time.delayedCall(T.glitch - T.seat, () => stream.remove());
      this.tweens.add({ targets: socketGlow, alpha: { from: 0.7, to: 0.35 }, duration: 220, yoyo: true, repeat: 4 });

      let lastTick = -1;
      this.tweens.addCounter({
        from: 0,
        to: 1,
        duration: SYNC_MS,
        delay: 80,
        ease: 'Sine.easeInOut',
        onUpdate: (tw) => {
          const k = tw.getValue() ?? 0;
          drawSync(k);
          const tick = Math.floor(k * 10);
          if (tick !== lastTick) {
            lastTick = tick;
            playTick();
          }
        },
      });

      // The odd jolt as the data floods in.
      for (let i = 0; i < 4; i++) {
        this.time.delayedCall(260 + i * 280, () => this.jolt(established, 5));
      }
    });

    /* --- glitch out ---------------------------------------------------- */
    this.time.delayedCall(T.glitch, () => {
      for (let i = 0; i < 8; i++) {
        this.time.delayedCall(i * 40, () => {
          const dx = Phaser.Math.Between(2, 4);
          splitRed.setAlpha(0.8).setX(w / 2 - dx);
          splitCyan.setAlpha(0.8).setX(w / 2 + dx);
          this.band.x = Phaser.Math.Between(-8, 8);
          slices.clear();
          for (let k = 0; k < 5; k++) {
            const y = Phaser.Math.Between(BAND_TOP, BAND_BOTTOM - 8);
            slices.fillStyle([RED, CYAN, 0x000000][k % 3], k % 3 === 2 ? 1 : 0.5);
            slices.fillRect(Phaser.Math.Between(-20, 20), y, w + 40, Phaser.Math.Between(1, 7));
          }
        });
      }
      this.time.delayedCall(330, () => {
        slices.clear();
        splitRed.setAlpha(0);
        splitCyan.setAlpha(0);
        this.band.x = 0;
      });
    });

    /* --- collapse to a line, then black -------------------------------- */
    this.time.delayedCall(T.collapse, () => {
      this.tweens.add({ targets: readouts, alpha: 0, duration: 120 });
      this.tweens.add({ targets: [topBar, bottomBar], y: cy, duration: 200, ease: 'Cubic.easeIn' });
    });
    this.time.delayedCall(T.line, () => {
      const line = this.add.rectangle(w / 2, cy, w, 2, 0xffffff).setOrigin(0.5);
      this.tweens.add({ targets: line, scaleX: 0, duration: 160, ease: 'Cubic.easeIn' });
    });
    this.time.delayedCall(T.done, () => data.done());
  }

  update(_time: number, delta: number): void {
    // The stripes drift, so the band never reads as a still frame.
    this.stripeShift = (this.stripeShift + delta * 0.03) % 16;
    this.drawStripes(this.scale.width);
  }

  /**
   * The alarm's banner: a black strip edged in red-and-black hazard stripes,
   * the request in big pixel lettering between two warning signs.
   */
  private hazardBanner(w: number): Phaser.GameObjects.Container {
    const h = 46;
    const top = Math.round(VIEW_H / 2 - h / 2);
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.92).fillRect(0, top, w, h);
    for (const y of [top, top + h - 5]) {
      g.fillStyle(RED, 1).fillRect(0, y, w, 5);
      g.fillStyle(0x000000, 1);
      for (let x = -10; x < w; x += 10) g.fillTriangle(x, y + 5, x + 5, y + 5, x + 10, y);
    }

    const size = Math.min(16, Math.floor((w - 70) / LINK.request.length));
    const text = this.add
      .text(w / 2, VIEW_H / 2, LINK.request, { fontFamily: PIXEL_FONT, fontSize: size + 'px', color: '#ffffff', padding: { x: 6, y: 6 } })
      .setOrigin(0.5)
      .setShadow(0, 0, '#ff2a3a', 8, false, true)
      .setResolution(2);

    const signs = this.add.graphics();
    for (const side of [-1, 1]) {
      const x = w / 2 + side * (text.width / 2 + 2);
      const y = VIEW_H / 2;
      signs.fillStyle(RED, 1).fillTriangle(x - 8, y + 7, x + 8, y + 7, x, y - 8);
      signs.fillStyle(0x000000, 1).fillRect(x - 1, y - 3, 2, 6).fillRect(x - 1, y + 4, 2, 2);
    }
    this.tweens.add({ targets: [text, signs], alpha: 0.4, duration: 110, yoyo: true, repeat: -1, hold: 110 });
    return this.add.container(0, 0, [g, text, signs]);
  }

  private drawStripes(w: number): void {
    const g = this.stripes;
    g.clear();
    g.fillStyle(RED_DARK, 1).fillRect(-OVERHANG, BAND_TOP, w + OVERHANG * 2, BAND_H);
    g.fillStyle(RED_STRIPE, 1);
    for (let x = -BAND_H - OVERHANG - 16 + this.stripeShift; x < w + OVERHANG; x += 16) {
      g.fillTriangle(x, BAND_BOTTOM, x + 6, BAND_BOTTOM, x + BAND_H + 6, BAND_TOP);
      g.fillTriangle(x, BAND_BOTTOM, x + BAND_H + 6, BAND_TOP, x + BAND_H, BAND_TOP);
    }
  }

  /** Four corner brackets around `at`, the box a targeting reticle locks with. */
  private drawBrackets(g: Phaser.GameObjects.Graphics, at: Point, w: number, h: number, color: number): void {
    const l = Math.round(at.x - w / 2);
    const r = Math.round(at.x + w / 2);
    const t = Math.round(at.y - h / 2);
    const b = Math.round(at.y + h / 2);
    const arm = 5;
    g.clear().fillStyle(color, 1);
    for (const [x, y, dx, dy] of [
      [l, t, 1, 1],
      [r, t, -1, 1],
      [l, b, 1, -1],
      [r, b, -1, -1],
    ]) {
      g.fillRect(dx > 0 ? x : x - arm + 1, y, arm, 1);
      g.fillRect(x, dy > 0 ? y : y - arm + 1, 1, arm);
    }
    g.fillRect(Math.round(at.x), Math.round(at.y), 1, 1);
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
    g.lineStyle(1, AMBER, 0.9).strokePoints(
      points.map((p) => ({ x: p.x, y: p.y - 1 })),
      false,
    );

    const before = bezier(start, ctrl, tip, 0.94);
    plug.setPosition(tip.x, tip.y).setRotation(Math.atan2(tip.y - before.y, tip.x - before.x));
  }

  private sparks(x: number, y: number): void {
    this.add
      .particles(x, y, 'rain-drop', {
        lifespan: 460,
        speed: { min: 60, max: 180 },
        angle: { min: 140, max: 320 },
        gravityY: 320,
        scaleY: { min: 0.4, max: 1 },
        tint: [0xffffff, AMBER, CYAN],
        blendMode: ADD,
        emitting: false,
      })
      .explode(22);
  }

  /** One packet of data running back up the cable, from the socket to the wrist. */
  private pulse(): void {
    if (!this.path) return;
    const { start, ctrl, tip } = this.path;
    const dot = addLight(this, tip.x, tip.y, Math.random() < 0.3 ? AMBER : CYAN, 0.9, 0.16, 0.16, 0);
    this.band.add(dot);
    this.tweens.addCounter({
      from: 1,
      to: 0,
      duration: 420,
      onUpdate: (tw) => {
        const p = bezier(start, ctrl, tip, tw.getValue() ?? 0);
        dot.setPosition(p.x, p.y);
      },
      onComplete: () => dot.destroy(),
    });
  }

  /** A single-frame jolt: the band skips sideways and the headline drops out. */
  private jolt(headline: Phaser.GameObjects.Text, by: number): void {
    this.band.x = Phaser.Math.Between(-by, by);
    headline.setAlpha(Math.random() < 0.4 ? 0.4 : 1);
    this.time.delayedCall(50, () => {
      this.band.x = 0;
      headline.setAlpha(1);
    });
  }
}
