import Phaser from 'phaser';
import { introPalette } from '../../config';
import { CAFE_INTERIOR, PROMPTS, SEAT_NUMBER, VOICE_NOTES } from '../../content/intro';
import { setMusicPlace } from '../../lib/music';
import { playClick, playDoor } from '../../lib/sound';
import { BASE_VIEW_W, VIEW_H } from '../viewport';
import { Controls } from './controls';
import type { LinkSceneData } from './LinkScene';
import type { IntroSceneOptions } from './StreetScene';
import { Walker } from './Walker';
import { PIXEL_FONT, SIGN_FONT, addLight, attachPostFX, colour, iris, isTouch, neonText, signText, uiText } from './shared';

/* Room layout, in pixel-art pixels. Mirrors scripts/art/cafe.mjs. */
const ROOM_W = 880;
const FLOOR_Y = 176;
const DESK_BASE_Y = 202;
const SIT_BASE_Y = 189;
const CHAIR_BASE_Y = 218;
const GROUND_Y = 240;
const COUNTER_X = 134;
const STATIONS = [250, 314, 378, 442, 506, 570, 634, 698, 762];
const SEAT_X = STATIONS[SEAT_NUMBER - 1];
const SEAT_ZONE = 16;

/** The way out: sliding doors in the back wall, at the left end of the room. */
const EXIT_X = 28;
const EXIT_ZONE = { min: 16, max: 58 };
const DOOR_LEAF = 14;
const DOOR_H = 44;

/** The monitor face on cafe-desk.png, relative to a station's x. */
const SCREEN = { dx: -14, y: DESK_BASE_Y - 50, w: 28, h: 18 };
const SCREEN_CY = SCREEN.y + SCREEN.h / 2;
/** Prompts sit by what they act on, clear of the hint line at the bottom. */
const SIT_PROMPT_Y = SCREEN.y - 14;
const EXIT_PROMPT = { x: 58, y: FLOOR_Y - DOOR_H - 28 };

const SCREEN_FPS = 12;

type Game = 'race' | 'shooter' | 'code' | 'platformer' | 'strategy' | 'video';

/** What everyone else is playing. The seat's entry is never drawn. */
const GAMES: ReadonlyArray<Game> = ['race', 'shooter', 'race', 'code', 'platformer', 'strategy', 'shooter', 'video', 'race'];

const C = {
  night0: 0x05060d,
  night1: 0x080b16,
  night2: 0x0c1120,
  night3: 0x121a2e,
  cyan: colour(introPalette.cyan),
  cyanDk: 0x1a8a93,
  magenta: colour(introPalette.magenta),
  violet: colour(introPalette.violet),
  violetDk: 0x4a3a96,
  lime: colour(introPalette.lime),
  amber: colour(introPalette.accent),
  steel: 0xb3bdd6,
  pale: 0xdfe5f2,
  green: 0x2e8f47,
  greenDk: 0x1d6332,
  pitch: 0x9a7d16,
  exit: 0x49b85f,
};

const GLOW: Record<Game, number> = {
  race: C.violet,
  shooter: C.magenta,
  code: C.lime,
  platformer: C.cyan,
  strategy: C.green,
  video: C.magenta,
};

const DEPTH = {
  wall: 0,
  decor: 1,
  holo: 1.2,
  lights: 1.5,
  kit: 2,
  desks: 3,
  screens: 3.1,
  screenGlow: 3.2,
  npcs: 4,
  chairs: 5,
  floorGlow: 5.5,
  player: 8,
  marker: 9,
  hud: 20,
} as const;

type Phase = 'arriving' | 'walking' | 'sitting' | 'seated' | 'linking' | 'leaving';
type Rect = { x: number; y: number; w: number; h: number };

export class CafeScene extends Phaser.Scene {
  private opts: IntroSceneOptions;
  private camW = BASE_VIEW_W;

  private walker!: Walker;
  private controls!: Controls;
  private screens!: Phaser.GameObjects.Graphics;
  private glows: Phaser.GameObjects.Image[] = [];
  private seatChair!: Phaser.GameObjects.Image;
  private marker!: Phaser.GameObjects.Container;
  private sitPrompt!: Phaser.GameObjects.Text;
  private exitPrompt!: Phaser.GameObjects.Text;
  private hint!: Phaser.GameObjects.Text;
  private doors: Phaser.GameObjects.Image[] = [];
  private clockText!: Phaser.GameObjects.Text;
  private ad!: { texts: Phaser.GameObjects.Text[]; shape: Phaser.GameObjects.Graphics };
  private cricket!: Rect;

  private phase: Phase = 'arriving';
  private seatScreen: 'off' | 'boot' = 'off';
  private clock = 0;
  private screenTick = 0;
  /** The hint line fades this long after the first input. */
  private hintUntil = Infinity;
  private camX = 0;

  constructor(opts: IntroSceneOptions) {
    super('cafe');
    this.opts = opts;
  }

  create(data: { entry?: 'door' | 'pc' }): void {
    this.camW = this.scale.width;
    this.phase = 'arriving';
    this.seatScreen = 'off';
    this.glows = [];
    this.doors = [];
    this.hintUntil = Infinity;
    const cam = this.cameras.main;
    cam.setBounds(0, 0, ROOM_W, VIEW_H);
    cam.setBackgroundColor(introPalette.night);

    this.add.tileSprite(0, 0, ROOM_W, VIEW_H, 'cafe-wall').setOrigin(0, 0).setDepth(DEPTH.wall);
    this.buildExit();
    this.buildWall();
    this.buildCounter();
    this.buildStations();
    this.screens = this.add.graphics().setDepth(DEPTH.screens);

    this.walker = new Walker(this, {
      x: 60,
      groundY: GROUND_Y,
      minX: EXIT_ZONE.min,
      maxX: ROOM_W - 16,
      depth: DEPTH.player,
      reflection: { alpha: 0.12, tint: 0x9fb4e0 },
      splashes: false,
    });

    this.buildMarker();
    this.buildHud();
    this.controls = new Controls(this);
    attachPostFX(this);
    setMusicPlace('cafe');

    if (data?.entry === 'pc') this.standUp();
    else this.walkIn();
    this.drawScreens();
  }

  /* ---------------------------------------------------------------- room -- */

  /** Sliding doors back out to the street, with a green EXIT sign over them. */
  private buildExit(): void {
    this.add.rectangle(EXIT_X, FLOOR_Y, DOOR_LEAF * 2 + 6, DOOR_H + 4, C.night0).setOrigin(0.5, 1).setDepth(DEPTH.decor);
    // The street seen through the doorway when they open: rain-blue light.
    this.add.rectangle(EXIT_X, FLOOR_Y, DOOR_LEAF * 2, DOOR_H, 0x1b2540).setOrigin(0.5, 1).setDepth(DEPTH.decor);
    addLight(this, EXIT_X, FLOOR_Y - 20, C.cyan, 0.12, 0.8, 1.2, DEPTH.decor + 0.05);

    const opening = this.make.graphics({ x: 0, y: 0 }, false);
    opening.fillStyle(0xffffff).fillRect(EXIT_X - DOOR_LEAF, FLOOR_Y - DOOR_H, DOOR_LEAF * 2, DOOR_H);
    const mask = opening.createGeometryMask();
    this.doors = [0, 1].map((frame) =>
      this.add
        .image(EXIT_X + (frame ? DOOR_LEAF / 2 : -DOOR_LEAF / 2), FLOOR_Y, 'door', frame)
        .setOrigin(0.5, 1)
        .setDepth(DEPTH.decor + 0.1)
        .setMask(mask),
    );

    neonText(this, EXIT_X, FLOOR_Y - DOOR_H - 10, 'EXIT', '#49b85f', 8, SIGN_FONT).setDepth(DEPTH.decor + 0.2);
    addLight(this, EXIT_X, FLOOR_Y - DOOR_H - 10, C.exit, 0.25, 0.9, 0.4, DEPTH.decor + 0.15);
  }

  private slideDoors(open: boolean): void {
    playDoor();
    this.doors.forEach((leaf, i) => {
      const home = EXIT_X + (i ? DOOR_LEAF / 2 : -DOOR_LEAF / 2);
      this.tweens.add({
        targets: leaf,
        x: open ? home + (i ? DOOR_LEAF : -DOOR_LEAF) : home,
        duration: 320,
        ease: open ? 'Cubic.easeOut' : 'Cubic.easeInOut',
      });
    });
  }

  /**
   * A holographic panel: a faint tinted field, a bright edge with heavier
   * corner brackets, scanlines, and a flicker. Holograms are light, so these
   * are drawn here rather than as pixel art.
   */
  private holo(x: number, y: number, w: number, h: number, color: number): Phaser.GameObjects.Container {
    const field = this.add.rectangle(0, 0, w, h, color, 0.08);
    const edge = this.add.graphics();
    edge.lineStyle(1, color, 0.55).strokeRect(-w / 2, -h / 2, w, h);
    edge.lineStyle(1, color, 1);
    for (const [sx, sy] of [
      [-1, -1],
      [1, -1],
      [-1, 1],
      [1, 1],
    ]) {
      edge.lineBetween((sx * w) / 2, (sy * h) / 2, sx * (w / 2 - 4), (sy * h) / 2);
      edge.lineBetween((sx * w) / 2, (sy * h) / 2, (sx * w) / 2, sy * (h / 2 - 4));
    }
    const scan = this.add.graphics();
    scan.fillStyle(color, 0.07);
    for (let yy = -h / 2; yy < h / 2; yy += 2) scan.fillRect(-w / 2, yy, w, 1);

    const panel = this.add.container(x, y, [field, edge, scan]).setDepth(DEPTH.holo);
    addLight(this, x, y, color, 0.12, w / 30, h / 22, DEPTH.holo - 0.05);
    if (!this.opts.reducedMotion) {
      this.time.addEvent({
        delay: 1700 + Math.random() * 2400,
        loop: true,
        callback: () => {
          panel.setAlpha(0.45);
          this.time.delayedCall(60, () => panel.setAlpha(1));
        },
      });
    }
    return panel;
  }

  /**
   * The wall art has neon tubes every 160px from x=80, so each panel sits in
   * its own bay between two of them.
   */
  private buildWall(): void {
    const label = (panel: Phaser.GameObjects.Container, x: number, y: number, text: string, color: string, font = SIGN_FONT) =>
      panel.add(this.add.text(x, y, text, { fontFamily: font, fontSize: '8px', color }).setOrigin(0.5).setResolution(2));

    const scores = this.holo(160, 64, 54, 26, C.amber);
    label(scores, 0, -5, CAFE_INTERIOR.scores[0], introPalette.accent);
    label(scores, 0, 6, CAFE_INTERIOR.scores[1], '#e9ebf2');

    // The cricket is on - on a hologram now, but of course it is still on.
    this.holo(320, 64, 48, 30, C.cyan);
    this.cricket = { x: 320 - 22, y: 64 - 13, w: 44, h: 26 };

    const neon = neonText(this, 480, 56, CAFE_INTERIOR.neon, introPalette.magenta, 10).setDepth(DEPTH.decor);
    addLight(this, 480, 56, C.magenta, 0.2, 2.2, 0.6, DEPTH.decor - 0.1);
    if (!this.opts.reducedMotion) {
      this.time.addEvent({
        delay: 2600,
        loop: true,
        callback: () => {
          neon.setAlpha(0.3);
          this.time.delayedCall(70, () => neon.setAlpha(1));
        },
      });
    }

    const ad = this.holo(640, 64, 76, 30, C.magenta);
    const shape = this.add.graphics();
    ad.add(shape);
    const adTexts = CAFE_INTERIOR.ad.map((t, i) => {
      const text = this.add
        .text(10, 0, t, { fontFamily: SIGN_FONT, fontSize: '8px', color: '#ffb0cf' })
        .setOrigin(0.5)
        .setResolution(2)
        .setAlpha(i === 0 ? 1 : 0);
      ad.add(text);
      return text;
    });
    this.ad = { texts: adTexts, shape };

    // Where "no food near the PCs" used to be: tonight's tournament.
    const cup = this.holo(800, 70, 100, 28, C.amber);
    label(cup, 7, -5, CAFE_INTERIOR.tournament[0], introPalette.accent, PIXEL_FONT);
    label(cup, 7, 7, CAFE_INTERIOR.tournament[1], '#e9ebf2');
    const trophy = this.add.graphics();
    trophy.fillStyle(C.amber, 1).fillRect(-43, -6, 6, 5).fillRect(-41, -1, 2, 3).fillRect(-43, 2, 6, 1);
    trophy.fillRect(-45, -5, 1, 3).fillRect(-36, -5, 1, 3);
    cup.add(trophy);

    const clock = this.holo(40, 60, 50, 16, C.lime);
    this.clockText = this.add
      .text(0, 0, '', { fontFamily: PIXEL_FONT, fontSize: '8px', color: introPalette.lime })
      .setOrigin(0.5)
      .setResolution(2);
    clock.add(this.clockText);
    this.tickClock();
    this.time.addEvent({ delay: 1000, loop: true, callback: () => this.tickClock() });

    // Ring lights hanging from the ceiling, breathing.
    [180, 420, 660, 840].forEach((x, i) => {
      const color = i % 2 ? C.magenta : C.cyan;
      const ring = this.add.graphics().setDepth(DEPTH.lights);
      ring.lineStyle(1, C.night3, 1).lineBetween(x, 0, x, 10);
      ring.lineStyle(2, color, 1).strokeEllipse(x, 13, 30, 6);
      const glow = addLight(this, x, 14, color, 0.25, 1.1, 0.4, DEPTH.lights);
      addLight(this, x, 60, color, 0.05, 1.8, 2.6, DEPTH.lights);
      if (!this.opts.reducedMotion) {
        this.tweens.add({ targets: [ring, glow], alpha: { from: 0.7, to: 1 }, duration: 1400 + i * 300, yoyo: true, repeat: -1 });
      }
    });

    // Hardware along the walls.
    this.add.image(60, FLOOR_Y + 2, 'cafe-decor', 2).setOrigin(0.5, 1).setDepth(DEPTH.kit);
    addLight(this, 60, FLOOR_Y - 26, C.lime, 0.12, 0.6, 0.6, DEPTH.kit);
    this.add.image(812, FLOOR_Y + 2, 'cafe-decor', 0).setOrigin(0.5, 1).setDepth(DEPTH.kit);
    addLight(this, 812, FLOOR_Y - 36, C.cyan, 0.16, 0.8, 1.2, DEPTH.kit);
    this.add.image(852, FLOOR_Y + 2, 'cafe-decor', 1).setOrigin(0.5, 1).setDepth(DEPTH.kit);
  }

  private tickClock(): void {
    const now = new Date();
    this.clockText.setText(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);
  }

  private buildCounter(): void {
    const counter = this.add
      .sprite(COUNTER_X, CHAIR_BASE_Y, 'cafe-counter', 0)
      .setOrigin(0.5, 1)
      .setDepth(DEPTH.chairs);
    addLight(this, COUNTER_X - 18, 152, C.cyan, 0.18, 1.4, 1, DEPTH.chairs + 0.1);

    const welcome = this.holo(COUNTER_X + 22, 100, 52, 14, C.cyan);
    welcome.add(
      this.add.text(0, 0, CAFE_INTERIOR.reception, { fontFamily: SIGN_FONT, fontSize: '8px', color: '#a8fff8' }).setOrigin(0.5).setResolution(2),
    );

    if (!this.opts.reducedMotion) {
      const flicker = () => {
        counter.setFrame(1);
        this.time.delayedCall(90, () => counter.setFrame(0));
        this.time.delayedCall(Phaser.Math.Between(2500, 5000), flicker);
      };
      this.time.delayedCall(1800, flicker);
    }
  }

  /** Nine stations, eight of them taken. */
  private buildStations(): void {
    if (!this.anims.exists('npc-0')) {
      for (let v = 0; v < 3; v++) {
        this.anims.create({
          key: `npc-${v}`,
          frames: this.anims.generateFrameNumbers('cafe-npc', { frames: [v * 2, v * 2 + 1] }),
          frameRate: 2,
          repeat: -1,
        });
      }
    }

    STATIONS.forEach((x, i) => {
      this.add.image(x, DESK_BASE_Y, 'cafe-desk').setOrigin(0.5, 1).setDepth(DEPTH.desks);
      const isSeat = x === SEAT_X;

      if (!isSeat) {
        const variant = i % 3;
        const npc = this.add
          .sprite(x, SIT_BASE_Y + 3, 'cafe-npc', variant * 2)
          .setOrigin(0.5, 1)
          .setFlipX(i % 2 === 1)
          .setDepth(DEPTH.npcs);
        if (!this.opts.reducedMotion) {
          npc.play({ key: `npc-${variant}`, delay: Math.random() * 900 });
          npc.anims.msPerFrame = 380 + Math.random() * 500;
        }
        this.glows.push(addLight(this, x, SCREEN_CY, GLOW[GAMES[i]], 0.28, 0.75, 0.55, DEPTH.screenGlow));
        addLight(this, x, 226, GLOW[GAMES[i]], 0.12, 1.1, 0.28, DEPTH.floorGlow);
      }

      const pod = this.add.image(x, CHAIR_BASE_Y, 'cafe-chair').setOrigin(0.5, 1).setDepth(DEPTH.chairs);
      addLight(this, x, CHAIR_BASE_Y - 1, C.cyan, 0.12, 0.6, 0.15, DEPTH.floorGlow);
      if (isSeat) this.seatChair = pod;
    });
  }

  private buildMarker(): void {
    const arrow = this.add.triangle(0, 0, 0, 0, 8, 0, 4, 5, C.amber).setOrigin(0.5, 0);
    const label = signText(this, 0, -9, CAFE_INTERIOR.seatLabel, introPalette.accent);
    this.marker = this.add.container(SEAT_X, 140, [label, arrow]).setDepth(DEPTH.marker);
    addLight(this, SEAT_X, 224, C.amber, 0.22, 1.2, 0.35, DEPTH.floorGlow);
    if (!this.opts.reducedMotion) {
      this.tweens.add({ targets: this.marker, y: 136, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
  }

  private buildHud(): void {
    const touch = isTouch(this);
    this.sitPrompt = uiText(this, SEAT_X, SIT_PROMPT_Y, touch ? PROMPTS.sit.touch : PROMPTS.sit.keys, { backing: true })
      .setDepth(DEPTH.hud)
      .setAlpha(0);
    this.sitPrompt.setInteractive({ useHandCursor: true }).on('pointerdown', () => this.act('sit'));

    this.exitPrompt = uiText(this, EXIT_PROMPT.x, EXIT_PROMPT.y, touch ? PROMPTS.exit.touch : PROMPTS.exit.keys, { backing: true })
      .setDepth(DEPTH.hud)
      .setAlpha(0);
    this.exitPrompt.setInteractive({ useHandCursor: true }).on('pointerdown', () => this.act('exit'));

    this.hint = uiText(this, this.camW / 2, VIEW_H - 14, touch ? PROMPTS.seat.touch : PROMPTS.seat.keys, { color: '#8b93a7' })
      .setScrollFactor(0)
      .setDepth(DEPTH.hud);
  }

  /* -------------------------------------------------------------- update -- */

  update(_time: number, delta: number): void {
    const dt = Math.min(0.05, delta / 1000);
    this.clock += dt;
    this.screenTick += delta;
    if (this.screenTick > 1000 / SCREEN_FPS && !this.opts.reducedMotion) {
      this.screenTick = 0;
      this.drawScreens();
      this.animateAd();
    }
    this.glows.forEach((g, i) => g.setAlpha(0.24 + Math.sin(this.clock * 5 + i * 1.7) * 0.05));

    if (this.phase !== 'walking' && this.phase !== 'seated') return;

    // Nothing in the cafe moves unless the player moves it.
    const input = this.controls.read();
    if (input.active) this.markInput();

    if (this.phase === 'seated') {
      if (input.up || input.enter) this.jackIn();
      return;
    }

    const atSeat = Math.abs(this.walker.x - SEAT_X) < SEAT_ZONE && !this.walker.airborne;
    const atExit = this.walker.x < EXIT_ZONE.max && !this.walker.airborne;
    if (atSeat && (input.up || input.enter)) {
      this.sit();
      return;
    }
    if (atExit && (input.up || input.enter)) {
      this.leave();
      return;
    }
    if (input.up) this.walker.jump();

    this.walker.update(input.dir, dt);
    const fade = Math.min(1, dt * 8);
    this.sitPrompt.setAlpha(Phaser.Math.Linear(this.sitPrompt.alpha, atSeat ? 1 : 0, fade));
    // At the seat, the prompt takes the marker's place.
    this.marker.setAlpha(1 - this.sitPrompt.alpha);
    this.exitPrompt.setAlpha(Phaser.Math.Linear(this.exitPrompt.alpha, atExit ? 1 : 0, fade));
    this.hint.setAlpha(Phaser.Math.Linear(this.hint.alpha, this.clock < this.hintUntil ? 1 : 0, dt * 3));
    this.followCamera(dt);
  }

  private markInput(): void {
    if (this.hintUntil === Infinity) this.hintUntil = this.clock + 1.5;
  }

  /** Tapping a prompt does whatever the prompt says. */
  private act(which: 'sit' | 'exit'): void {
    if (which === 'exit' && this.phase === 'walking') this.leave();
    else if (which === 'sit' && this.phase === 'walking' && Math.abs(this.walker.x - SEAT_X) < SEAT_ZONE) this.sit();
    else if (which === 'sit' && this.phase === 'seated') this.jackIn();
  }

  private followCamera(dt: number, snap = false): void {
    const target = Phaser.Math.Clamp(this.walker.x - this.camW * 0.4, 0, Math.max(0, ROOM_W - this.camW));
    this.camX = snap ? target : Phaser.Math.Linear(this.camX, target, Math.min(1, dt * 5));
    this.cameras.main.scrollX = Math.round(this.camX);
  }

  /* ---------------------------------------------------------- sequences -- */

  /** Arriving from the street: the doors part and the player steps in. */
  private walkIn(): void {
    const w = this.walker;
    w.freeze();
    w.sprite.setPosition(EXIT_X, FLOOR_Y + 4).setScale(0.82).setAlpha(0);
    w.shadow.setAlpha(0);
    w.reflection?.setAlpha(0);
    w.syncDressing();
    this.followCamera(1, true);

    iris(this, EXIT_X, FLOOR_Y - 22, 'open', 650);
    this.time.delayedCall(200, () => this.slideDoors(true));
    this.time.delayedCall(420, () => {
      w.stride(1);
      this.tweens.add({
        targets: w.sprite,
        x: 64,
        y: GROUND_Y,
        scale: 1,
        alpha: 1,
        duration: 620,
        ease: 'Sine.easeOut',
        onUpdate: () => w.syncDressing(),
        onComplete: () => {
          w.rest();
          this.slideDoors(false);
          w.unfreeze();
          this.phase = 'walking';
        },
      });
      this.tweens.add({ targets: w.shadow, alpha: 1, duration: 620 });
      if (w.reflection) this.tweens.add({ targets: w.reflection, alpha: 0.12, duration: 620 });
    });
    this.cashierHello();
  }

  /** Back from the PC after logging off: still in the seat, then up and free. */
  private standUp(): void {
    const w = this.walker;
    const sprite = w.sprite;
    w.freeze();
    sprite.setTexture('player-sit', 1).setPosition(SEAT_X, SIT_BASE_Y).setDepth(DEPTH.npcs);
    this.seatChair.setX(SEAT_X);
    w.shadow.setAlpha(0);
    w.reflection?.setAlpha(0);
    this.marker.setAlpha(0);
    this.hint.setAlpha(0);
    this.seatScreen = 'boot';
    sprite.x = SEAT_X;
    this.camX = Phaser.Math.Clamp(SEAT_X - this.camW / 2, 0, Math.max(0, ROOM_W - this.camW));
    this.cameras.main.scrollX = Math.round(this.camX);

    iris(this, SEAT_X, SCREEN_CY, 'open', 700);
    this.time.delayedCall(800, () => {
      this.seatScreen = 'off';
      this.drawScreens();
      playClick();
      sprite.setTexture('player-sit', 0).setPosition(SEAT_X, CHAIR_BASE_Y - 2).setDepth(DEPTH.player);
      this.tweens.add({ targets: this.seatChair, x: SEAT_X + 7, duration: 260, ease: 'Quad.easeOut' });
      this.tweens.add({
        targets: sprite,
        y: GROUND_Y,
        duration: 320,
        ease: 'Quad.easeIn',
        onUpdate: () => w.syncDressing(),
        onComplete: () => {
          sprite.setFlipX(true);
          w.rest();
          this.tweens.add({ targets: w.shadow, alpha: 1, duration: 300 });
          if (w.reflection) this.tweens.add({ targets: w.reflection, alpha: 0.12, duration: 300 });
          this.hint.setText(isTouch(this) ? PROMPTS.loggedOff.touch : PROMPTS.loggedOff.keys);
          w.unfreeze();
          this.phase = 'walking';
        },
      });
    });
  }

  /** Out through the doors, and back to the street. */
  private leave(): void {
    this.phase = 'leaving';
    const w = this.walker;
    w.freeze();
    this.tweens.add({ targets: [this.exitPrompt, this.hint], alpha: 0, duration: 150 });
    this.slideDoors(true);
    w.stride(-1);
    this.tweens.add({
      targets: w.sprite,
      x: EXIT_X,
      y: FLOOR_Y + 4,
      scale: 0.82,
      duration: 560,
      ease: 'Sine.easeIn',
      onUpdate: () => w.syncDressing(),
    });
    this.tweens.add({ targets: w.sprite, alpha: 0, duration: 220, delay: 360 });
    this.tweens.add({ targets: [w.shadow, w.reflection], alpha: 0, duration: 300 });
    this.time.delayedCall(640, () => this.slideDoors(false));
    this.time.delayedCall(700, () => iris(this, EXIT_X, FLOOR_Y - 22, 'close', 600, () => this.scene.start('street', { entry: 'cafe' })));
  }

  /** The cashier points you to your seat. */
  private cashierHello(): void {
    this.time.delayedCall(900, () => {
      const bubble = uiText(this, COUNTER_X - 16, 128, CAFE_INTERIOR.cashier, { backing: true })
        .setDepth(DEPTH.hud)
        .setAlpha(0);
      this.tweens.add({ targets: bubble, alpha: 1, y: 124, duration: 260, ease: 'Back.easeOut' });
      this.tweens.add({ targets: bubble, alpha: 0, delay: 3400, duration: 400, onComplete: () => bubble.destroy() });
    });
  }

  /** Turn away, step up to the desk, sit. */
  private sit(): void {
    this.phase = 'sitting';
    this.walker.freeze();
    playClick();
    const sprite = this.walker.sprite;
    sprite.setTint(0xffffff).setFlipX(false).setTexture('player-sit', 0);
    this.walker.reflection?.setVisible(false);
    this.tweens.add({ targets: [this.sitPrompt, this.hint, this.marker], alpha: 0, duration: 180 });
    this.tweens.add({ targets: [sprite, this.walker.shadow], x: SEAT_X, duration: 120 });

    this.tweens.add({
      targets: sprite,
      y: CHAIR_BASE_Y - 2,
      duration: 280,
      delay: 120,
      ease: 'Quad.easeOut',
      onComplete: () => {
        sprite.setTexture('player-sit', 1).setPosition(SEAT_X, SIT_BASE_Y).setDepth(DEPTH.npcs);
        this.walker.shadow.setVisible(false);
        this.tweens.add({ targets: this.seatChair, x: SEAT_X, duration: 220, ease: 'Quad.easeOut' });

        const touch = isTouch(this);
        this.sitPrompt.setText(touch ? PROMPTS.link.touch : PROMPTS.link.keys);
        this.tweens.add({ targets: this.sitPrompt, alpha: 1, duration: 220 });
        this.phase = 'seated';
      },
    });
  }

  /**
   * The PC wakes under the alarm - power LED, a lit screen - and the jack-in
   * cutscene plays over it. That ends on black, which is where the React boot
   * sequence begins.
   */
  private jackIn(): void {
    this.phase = 'linking';
    this.tweens.add({ targets: this.sitPrompt, alpha: 0, duration: 150 });

    this.add.rectangle(SEAT_X + 20, 185, 2, 1, C.lime).setOrigin(0, 0).setDepth(DEPTH.screens);
    addLight(this, SEAT_X + 21, 185, C.lime, 0.5, 0.2, 0.2, DEPTH.screenGlow);
    addLight(this, SEAT_X, SCREEN_CY, C.pale, 0.12, 0.7, 0.5, DEPTH.screenGlow);
    this.seatScreen = 'boot';
    this.drawScreens();

    const data: LinkSceneData = {
      reducedMotion: this.opts.reducedMotion,
      done: () => {
        const taken = [...((this.registry.get('notesTaken') as number[] | undefined) ?? [])];
        this.opts.onEnter({ notesFound: taken.length, notesTotal: VOICE_NOTES.length, taken });
      },
    };
    this.scene.launch('link', data);
  }

  /* ------------------------------------------------------------- screens -- */

  /** The ad panel turns a wireframe diamond and swaps its line every few seconds. */
  private animateAd(): void {
    const g = this.ad.shape;
    const a = this.clock * 1.6;
    g.clear().lineStyle(1, C.magenta, 0.9);
    const w = Math.abs(Math.cos(a)) * 7 + 1;
    g.strokePoints([{ x: -27, y: -9 }, { x: -27 + w, y: 0 }, { x: -27, y: 9 }, { x: -27 - w, y: 0 }], true);
    g.lineBetween(-27 - w, 0, -27 + w, 0);
    const which = Math.floor(this.clock / 2.5) % this.ad.texts.length;
    this.ad.texts.forEach((t, i) => t.setAlpha(i === which ? 1 : 0));
  }

  /** Every monitor, the cricket and the seat's PC, redrawn at a retro frame rate. */
  private drawScreens(): void {
    const g = this.screens;
    g.clear();
    const t = this.clock;

    STATIONS.forEach((x, i) => {
      const r: Rect = { x: x + SCREEN.dx, y: SCREEN.y, w: SCREEN.w, h: SCREEN.h };
      if (x === SEAT_X) this.drawSeat(g, r, t);
      else this.drawGame(g, GAMES[i], r, t, i);
    });
    this.drawCricket(g, this.cricket, t);
  }

  private drawSeat(g: Phaser.GameObjects.Graphics, r: Rect, t: number): void {
    g.fillStyle(C.night0).fillRect(r.x, r.y, r.w, r.h);
    if (this.seatScreen === 'off') {
      // standby light on the bezel
      if (Math.sin(t * 2.5) > 0) g.fillStyle(C.amber).fillRect(r.x + r.w - 2, r.y + r.h, 1, 1);
      return;
    }
    // booting: a blinking cursor and the first lines of the BIOS
    if (Math.floor(t * 4) % 2 === 0) g.fillStyle(C.steel).fillRect(r.x + 2, r.y + 2, 2, 1);
    g.fillStyle(0x6a7593).fillRect(r.x + 2, r.y + 5, 14, 1).fillRect(r.x + 2, r.y + 7, 9, 1);
  }

  private drawGame(g: Phaser.GameObjects.Graphics, game: Game, r: Rect, t: number, seed: number): void {
    const { x, y, w, h } = r;
    switch (game) {
      case 'race': {
        g.fillStyle(C.violetDk).fillRect(x, y, w, 6);
        g.fillStyle(C.night2).fillRect(x, y + 6, w, h - 6);
        for (let row = 0; row < h - 6; row++) {
          const half = 2 + row * 0.9;
          const band = Math.floor(row * 0.6 - t * 14);
          g.fillStyle(band % 2 === 0 ? C.night3 : C.night1).fillRect(x + w / 2 - half, y + 6 + row, half * 2, 1);
          if (Math.floor(row * 0.5 - t * 10) % 3 === 0) g.fillStyle(C.amber).fillRect(x + w / 2, y + 6 + row, 1, 1);
        }
        g.fillStyle(C.magenta).fillRect(x + w / 2 - 3 + Math.round(Math.sin(t * 2 + seed) * 4), y + h - 4, 6, 3);
        break;
      }
      case 'shooter': {
        g.fillStyle(C.night1).fillRect(x, y, w, h);
        g.fillStyle(C.night3).fillRect(x, y + h - 5, w, 5);
        for (let k = 0; k < 3; k++) {
          const ex = x + 4 + ((k * 9 + t * 10 + seed * 5) % (w - 8));
          g.fillStyle(C.magenta).fillRect(Math.round(ex), y + 3 + k * 3 + Math.round(Math.sin(t * 3 + k) * 2), 2, 2);
        }
        g.fillStyle(C.cyan).fillRect(x + w / 2 - 3, y + h / 2, 7, 1).fillRect(x + w / 2, y + h / 2 - 3, 1, 7);
        if (Math.sin(t * 9 + seed) > 0.85) g.fillStyle(C.amber).fillRect(x + w / 2 - 2, y + h - 6, 4, 3);
        break;
      }
      case 'code': {
        g.fillStyle(C.night0).fillRect(x, y, w, h);
        const scroll = Math.floor(t * 3);
        for (let row = 0; row < 5; row++) {
          const n = row + scroll + seed;
          const indent = (n * 13) % 3;
          const len = 5 + ((n * 37) % 15);
          g.fillStyle([C.lime, C.cyan, C.violet][n % 3]).fillRect(x + 2 + indent * 3, y + 2 + row * 3, Math.min(len, w - 4 - indent * 3), 1);
        }
        if (Math.floor(t * 3) % 2 === 0) g.fillStyle(C.pale).fillRect(x + 3, y + h - 3, 2, 1);
        break;
      }
      case 'platformer': {
        g.fillStyle(C.cyanDk).fillRect(x, y, w, h);
        g.fillStyle(C.green).fillRect(x, y + h - 4, w, 4);
        g.fillStyle(C.greenDk).fillRect(x, y + h - 4, w, 1);
        for (let k = 0; k < 3; k++) {
          const bx = x + (((k * 11 + seed * 7 - t * 12) % (w + 6)) + (w + 6)) % (w + 6) - 3;
          g.fillStyle(C.amber).fillRect(Math.round(bx), y + h - 9 - (k % 2) * 4, 3, 3);
        }
        g.fillStyle(C.pale).fillRect(x + 6, y + h - 7 - Math.round(Math.abs(Math.sin(t * 4)) * 5), 2, 3);
        break;
      }
      case 'strategy': {
        g.fillStyle(C.greenDk).fillRect(x, y, w, h);
        g.fillStyle(C.night2);
        for (let gx = x + 4; gx < x + w; gx += 6) g.fillRect(gx, y, 1, h);
        for (let gy = y + 4; gy < y + h; gy += 6) g.fillRect(x, gy, w, 1);
        for (let k = 0; k < 5; k++) {
          const ux = x + 3 + ((k * 7 + Math.floor(t * 2) * (k % 2 ? 1 : -1) + 40) % (w - 6));
          g.fillStyle(k % 2 ? C.amber : C.magenta).fillRect(ux, y + 3 + k * 3, 2, 2);
        }
        if (Math.floor(t * 2) % 2 === 0) g.lineStyle(1, C.cyan).strokeRect(x + 10, y + 5, 8, 7);
        break;
      }
      case 'video': {
        g.fillStyle(C.violetDk).fillRect(x, y, w, h);
        g.fillStyle(C.magenta).fillCircle(x + w / 2 + Math.sin(t * 1.3) * 7, y + h / 2 + Math.cos(t) * 3, 5);
        g.fillStyle(C.amber).fillCircle(x + w / 2 + Math.cos(t * 0.9) * 8, y + h / 2 + Math.sin(t * 1.7) * 3, 3);
        g.fillStyle(C.night1).fillRect(x, y + h - 2, w, 2);
        g.fillStyle(C.pale).fillRect(x, y + h - 2, Math.round((((t * 2) % 10) / 10) * w), 1);
        break;
      }
    }
  }

  /** A cricket match, holographic now, because of course it is still on. */
  private drawCricket(g: Phaser.GameObjects.Graphics, r: Rect, t: number): void {
    g.fillStyle(C.green, 0.75).fillRect(r.x, r.y, r.w, r.h);
    g.fillStyle(C.greenDk, 0.75).fillRect(r.x, r.y, r.w, 4);
    g.fillStyle(C.pitch, 0.9).fillRect(r.x + r.w / 2 - 2, r.y + 6, 4, 12);
    const fielders: Array<[number, number]> = [
      [6, 8],
      [36, 9],
      [10, 17],
      [32, 18],
      [22, 5],
    ];
    g.fillStyle(C.pale);
    for (const [fx, fy] of fielders) g.fillRect(r.x + fx + Math.round(Math.sin(t + fx) * 1), r.y + fy, 1, 2);
    const ball = (t * 0.8) % 1;
    g.fillStyle(0xff5f5f).fillRect(r.x + r.w / 2, Math.round(r.y + 6 + ball * 11), 1, 1);
    g.fillStyle(C.night0, 0.8).fillRect(r.x, r.y + r.h - 4, r.w, 4);
    g.fillStyle(C.lime).fillRect(r.x + 2, r.y + r.h - 3, 8, 2);
    g.fillStyle(C.pale).fillRect(r.x + 12, r.y + r.h - 3, 12, 2);
  }
}
