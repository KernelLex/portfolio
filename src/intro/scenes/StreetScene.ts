import Phaser from 'phaser';
import { CAFE_NAME, introPalette } from '../../config';
import { CAFE_SIGN, PROMPTS, VOICE_NOTES } from '../../content/intro';
import { playHorn, playPickup, playWhoosh } from '../../lib/sound';
import { BASE_VIEW_W, VIEW_H } from '../viewport';
import { Billboard } from './Billboard';
import { Controls } from './controls';
import { Walker } from './Walker';
import {
  ADD,
  PIXEL_FONT,
  SIGN_FONT,
  addLight,
  attachPostFX,
  colour,
  ensureFallbacks,
  isTouch,
  loadIntroAssets,
  mixColour,
  neonText,
  signText,
  uiText,
} from './shared';

/* Every number below is in "pixel art pixels" (the 270-tall authoring grid),
 * not screen pixels. */
const WORLD_W = 960;
const GROUND_Y = 212; // where the player's feet sit
const STREET_TOP = 190;
const BUILDING_BASE = 196;
const ROAD_Y = 252; // where the traffic's wheels sit

const PLAYER_START_X = 70;
const CAFE_X = 800;
const DOOR_ZONE = 34;

/** Mirrors scripts/art/street.mjs: the cafe front and its glass. */
const CAFE_W = 192;
const CAFE_H = 128;
const WINDOW_X = [8, 114];
const WINDOW_Y = 60;
const WINDOW_SCREENS = [8, 30, 52];

/**
 * The billboard stands on the shop block in buildings.png (x 140-236, roof 96
 * high), so it scrolls with that layer rather than with the street.
 */
const BILLBOARD_COLUMN = 188;
const BILLBOARD_ROOF_Y = BUILDING_BASE - 96;
const BUILDINGS_PARALLAX = 0.55;

const IDLE_BEFORE_AUTOWALK = 2500;
const IDLE_AT_DOOR_BEFORE_ENTER = 3000;

const NEON = [introPalette.cyan, introPalette.magenta, introPalette.violet, introPalette.lime];

/** Signs along the street. Easter eggs: every one is something Amogh built. */
const SIGNS: ReadonlyArray<{ x: number; y: number; label: string; color: string }> = [
  { x: 150, y: 128, label: 'VERA ERP', color: introPalette.cyan },
  { x: 285, y: 106, label: 'SECANT', color: introPalette.magenta },
  { x: 400, y: 136, label: 'HAZEN', color: introPalette.violet },
  { x: 510, y: 100, label: 'TRUECOMMIT', color: introPalette.lime },
  { x: 625, y: 134, label: 'THROTTLE', color: introPalette.cyan },
];

/**
 * Street furniture in front of the player. Parallax above 1 is what sells the
 * depth - these slide past noticeably faster than the road.
 */
const FOREGROUND_PARALLAX = 1.25;
const PROPS: ReadonlyArray<{ x: number; frame: number }> = [
  { x: 100, frame: 0 },
  { x: 250, frame: 2 },
  { x: 400, frame: 1 },
  { x: 560, frame: 3 },
  { x: 720, frame: 0 },
  { x: 880, frame: 2 },
  { x: 1040, frame: 1 },
];

/** Grates that breathe. Placed between the signs so the street is never still. */
const VENTS: ReadonlyArray<number> = [250, 470, 610];

const DEPTH = {
  sky: 0,
  skyline: 1,
  buildings: 2,
  billboard: 2.5,
  cables: 3,
  street: 4,
  reflection: 5,
  lightPool: 6,
  cafe: 7,
  door: 8,
  cafeSign: 9,
  signs: 10,
  vents: 11,
  notes: 11.5,
  player: 12,
  traffic: 12.5,
  rainFar: 13,
  props: 14,
  rainNear: 15,
  hud: 20,
} as const;

export type IntroResult = { notesFound: number; notesTotal: number };

export type IntroSceneOptions = {
  /** Fired once the PC in the cafe has powered on and the camera is inside it. */
  onEnter: (result: IntroResult) => void;
  /** Fired when the street is up, which clears React's boot watchdog. */
  onReady: () => void;
  reducedMotion: boolean;
};

type SignParts = {
  container: Phaser.GameObjects.Container;
  lights: Phaser.GameObjects.Image[];
  baseAlpha: number[];
};

type Note = {
  sprite: Phaser.GameObjects.Sprite;
  light: Phaser.GameObjects.Image;
  text: string;
};

export class StreetScene extends Phaser.Scene {
  private opts: IntroSceneOptions;
  private camW = BASE_VIEW_W;

  private sky!: Phaser.GameObjects.TileSprite;
  private skyline!: Phaser.GameObjects.TileSprite;
  private buildings!: Phaser.GameObjects.TileSprite;
  private cables!: Phaser.GameObjects.TileSprite;
  private street!: Phaser.GameObjects.TileSprite;

  private walker!: Walker;
  private controls!: Controls;
  private billboard!: Billboard;
  private door!: Phaser.GameObjects.Image;
  private prompt!: Phaser.GameObjects.Text;
  private hint!: Phaser.GameObjects.Text;
  private counter!: Phaser.GameObjects.Text;
  private sparkle!: Phaser.GameObjects.Particles.ParticleEmitter;

  private rickshaw!: Phaser.GameObjects.Sprite;
  private rickshawMirror!: Phaser.GameObjects.Sprite;
  private rickshawLights: Phaser.GameObjects.Image[] = [];
  private rickshawLive = false;

  private notes: Note[] = [];
  private found = 0;
  private toasts = 0;
  private entering = false;
  private hintDismissed = false;
  private idleFor = 0;
  private atDoorFor = 0;
  /** Fractional camera position. Only the rounded value reaches the camera. */
  private camX = 0;
  private lookAhead = 0;
  private layerOffset = 0;

  constructor(opts: IntroSceneOptions) {
    super('street');
    this.opts = opts;
  }

  preload(): void {
    loadIntroAssets(this);
  }

  create(): void {
    this.camW = this.scale.width;
    ensureFallbacks(this);
    this.cameras.main.setBounds(0, 0, WORLD_W, VIEW_H);
    this.cameras.main.setBackgroundColor(introPalette.night);
    this.registry.set('notesFound', 0);

    this.buildParallax();
    this.billboard = new Billboard(this, {
      textureColumn: BILLBOARD_COLUMN,
      roofY: BILLBOARD_ROOF_Y,
      depth: DEPTH.billboard,
      reducedMotion: this.opts.reducedMotion,
    });
    this.buildSigns();
    this.buildCafe();
    this.walker = new Walker(this, {
      x: PLAYER_START_X,
      groundY: GROUND_Y,
      minX: 24,
      maxX: CAFE_X - 6,
      depth: DEPTH.player,
      reflection: { alpha: 0.2, tint: 0x7fa8e0 },
      splashes: true,
    });
    this.buildNotes();
    this.buildProps();
    this.buildRickshaw();
    if (!this.opts.reducedMotion) {
      this.buildRain();
      this.buildVents();
    }
    this.buildHud();
    this.controls = new Controls(this);
    attachPostFX(this);
    this.followCamera(1, 0);

    this.opts.onReady();
  }

  /* ------------------------------------------------------------ parallax -- */

  private buildParallax(): void {
    // Each layer is a viewport-sized tile sprite scrolled by hand, so no layer
    // needs a world-wide image and the loop is seamless at any world width.
    const layer = (y: number, h: number, key: string, depth: number) =>
      this.add.tileSprite(0, y, this.camW, h, key).setOrigin(0, 0).setScrollFactor(0).setDepth(depth);

    this.sky = layer(0, VIEW_H, 'sky', DEPTH.sky);
    this.skyline = layer(BUILDING_BASE - 110, 110, 'skyline', DEPTH.skyline);
    this.buildings = layer(BUILDING_BASE - 170, 170, 'buildings', DEPTH.buildings);
    this.cables = layer(0, 64, 'cables', DEPTH.cables);
    this.street = layer(STREET_TOP, 80, 'street', DEPTH.street);
  }

  /* --------------------------------------------------------------- signs -- */

  private buildSigns(): void {
    for (const sign of SIGNS) this.neonSign(sign.x, sign.y, sign.label, sign.color);
  }

  private neonSign(x: number, y: number, label: string, color: string): void {
    const num = colour(color);
    const text = neonText(this, 0, 0, label, color, 8);
    // Text width includes its 6px glow padding on each side.
    const w = text.width;
    const h = text.height - 4;

    const panel = this.add.rectangle(0, 0, w, h, 0x05070c, 0.82);
    const edge = this.add.rectangle(0, 0, w, h).setStrokeStyle(1, num, 0.55);
    const bracket = this.add.rectangle(0, h / 2 + 3, 2, 6, num, 0.4);
    const container = this.add.container(x, y, [panel, edge, bracket, text]).setDepth(DEPTH.signs);

    // Halo round the sign, a pool of it on the wet street, and a smear between.
    const halo = addLight(this, x, y, num, 0.28, w / 26, h / 18, DEPTH.signs - 1);
    const pool = addLight(this, x, GROUND_Y + 6, num, 0.24, w / 22, 0.62, DEPTH.lightPool);
    const smear = addLight(this, x, GROUND_Y + 32, num, 0.1, w / 46, 1.1, DEPTH.lightPool);

    if (!this.opts.reducedMotion) {
      this.flicker({ container, lights: [halo, pool, smear], baseAlpha: [0.28, 0.24, 0.1] });
    }
  }

  /** Neon never sits still: a slow breathe plus the occasional dropout. */
  private flicker(parts: SignParts): void {
    const apply = (k: number) => {
      parts.container.setAlpha(k);
      parts.lights.forEach((light, i) => light.setAlpha(parts.baseAlpha[i] * k));
    };

    this.tweens.addCounter({
      from: 0.82,
      to: 1,
      duration: 900 + Math.random() * 1400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      onUpdate: (tween) => apply(tween.getValue() ?? 1),
    });

    this.time.addEvent({
      delay: 2200 + Math.random() * 3600,
      loop: true,
      callback: () => {
        apply(0.22);
        this.time.delayedCall(60, () => apply(0.9));
        this.time.delayedCall(140, () => apply(0.3));
        this.time.delayedCall(210, () => apply(1));
      },
    });
  }

  /* ---------------------------------------------------------------- cafe -- */

  private buildCafe(): void {
    const amber = colour(introPalette.accent);
    const top = GROUND_Y - CAFE_H;
    const left = CAFE_X - CAFE_W / 2;

    this.add.image(CAFE_X, GROUND_Y, 'cafe-front').setOrigin(0.5, 1).setDepth(DEPTH.cafe);
    this.add
      .image(CAFE_X, GROUND_Y + 1, 'cafe-front')
      .setOrigin(0.5, 0)
      .setFlipY(true)
      .setAlpha(0.16)
      .setTint(0x7fa8e0)
      .setDepth(DEPTH.reflection);

    // Warm light inside, seen when the door swings open.
    this.add.rectangle(CAFE_X, GROUND_Y, 28, 44, amber, 1).setOrigin(0.5, 1).setDepth(DEPTH.cafe);
    this.door = this.add.image(CAFE_X, GROUND_Y, 'door').setOrigin(0.5, 1).setDepth(DEPTH.door);

    // The sign. The name is configurable, so shrink to fit rather than assume.
    const name = neonText(this, CAFE_X, top + 28, CAFE_NAME, introPalette.accent, 12).setDepth(DEPTH.cafeSign);
    for (let size = 11; name.width > 176 && size >= 6; size--) name.setFontSize(size + 'px');
    signText(this, CAFE_X, top + 41, CAFE_SIGN.services, introPalette.cyan).setDepth(DEPTH.cafeSign);
    signText(this, left + 43, top + 120, CAFE_SIGN.rate, introPalette.accent).setDepth(DEPTH.cafeSign);

    const open = neonText(this, left + 150, top + 103, CAFE_SIGN.open, introPalette.magenta, 8, SIGN_FONT).setDepth(
      DEPTH.cafeSign,
    );
    if (!this.opts.reducedMotion) {
      this.time.addEvent({
        delay: 300,
        loop: true,
        callback: () => open.setAlpha(Math.random() < 0.12 ? 0.25 : 1),
      });
    }

    // The screens behind the glass glow and flicker like they are in use.
    WINDOW_X.forEach((wx, w) => {
      WINDOW_SCREENS.forEach((sx, n) => {
        const glow = addLight(
          this,
          left + wx + sx + 5,
          top + WINDOW_Y + 21,
          colour(NEON[(n + (w ? 2 : 0)) % NEON.length]),
          0.34,
          0.34,
          0.26,
          DEPTH.cafeSign,
        );
        if (this.opts.reducedMotion) return;
        this.tweens.add({
          targets: glow,
          alpha: { from: 0.2, to: 0.42 },
          duration: 300 + Math.random() * 700,
          yoyo: true,
          repeat: -1,
          ease: 'Stepped',
          easeParams: [3],
        });
      });
    });

    // Light from the sign and the windows, pooling on the pavement - the last
    // thing seen before the cut.
    addLight(this, CAFE_X, top + 33, amber, 0.3, 5.4, 0.8, DEPTH.cafeSign - 1);
    addLight(this, CAFE_X, GROUND_Y + 12, amber, 0.32, 6.2, 0.8, DEPTH.lightPool);
    addLight(this, CAFE_X, GROUND_Y + 2, amber, 0.4, 1.2, 0.5, DEPTH.lightPool);
  }

  /* --------------------------------------------------------------- notes -- */

  private buildNotes(): void {
    const amber = colour(introPalette.accent);
    if (!this.anims.exists('note-pulse') && this.textures.get('note').frameTotal > 4) {
      this.anims.create({
        key: 'note-pulse',
        frames: this.anims.generateFrameNumbers('note', { start: 0, end: 3 }),
        frameRate: 7,
        repeat: -1,
      });
    }

    for (const note of VOICE_NOTES) {
      const y = GROUND_Y - (note.high ? 62 : 24);
      const sprite = this.add.sprite(note.x, y, 'note').setDepth(DEPTH.notes);
      if (this.anims.exists('note-pulse')) sprite.play('note-pulse');
      const light = addLight(this, note.x, y, amber, 0.3, 0.55, 0.55, DEPTH.notes - 0.1);
      if (!this.opts.reducedMotion) {
        this.tweens.add({
          targets: [sprite, light],
          y: y - 3,
          duration: 900,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
          delay: Math.random() * 400,
        });
      }
      this.notes.push({ sprite, light, text: note.text });
    }

    this.sparkle = this.add
      .particles(0, 0, 'glow', {
        lifespan: 520,
        speed: { min: 30, max: 90 },
        scale: { start: 0.14, end: 0 },
        alpha: { start: 0.9, end: 0 },
        tint: [amber, colour(introPalette.cyan)],
        blendMode: ADD,
        emitting: false,
      })
      .setDepth(DEPTH.hud - 1);
  }

  private collectNotes(): void {
    const body = this.walker.bodySpan();
    for (const note of this.notes) {
      const { sprite } = note;
      if (!sprite.active) continue;
      if (Math.abs(sprite.x - this.walker.x) > 13) continue;
      if (sprite.y + 6 < body.top || sprite.y - 6 > body.bottom) continue;
      this.take(note);
    }
  }

  private take(note: Note): void {
    const { sprite, light } = note;
    sprite.setActive(false);
    playPickup();
    this.sparkle.explode(12, sprite.x, sprite.y);
    this.tweens.killTweensOf([sprite, light]);
    this.tweens.add({
      targets: [sprite, light],
      y: sprite.y - 12,
      alpha: 0,
      scale: 1.6,
      duration: 320,
      ease: 'Quad.easeOut',
      onComplete: () => {
        sprite.destroy();
        light.destroy();
      },
    });

    this.found += 1;
    this.registry.set('notesFound', this.found);
    const total = this.notes.length;
    this.counter.setText(`${this.found}/${total}`);
    this.toast(note.text);
    if (this.found === total) {
      this.counter.setColor(introPalette.lime);
      this.time.delayedCall(1400, () => this.toast(`All ${total} voice notes found`));
    }
  }

  /**
   * A fact arrives as a toast along the bottom, over the empty road - never
   * over the player or the signs - stacking upward while others still show.
   */
  private toast(text: string): void {
    this.tweens.killTweensOf(this.hint);
    this.hint.setAlpha(0);

    const icon = this.add.image(0, 0, 'note', 0);
    // Wraps on a narrow (portrait phone) viewport instead of running off it.
    const label = uiText(this, 0, 0, text, { wrap: this.camW - 56 }).setOrigin(0, 0.5);
    const inner = icon.width + 4 + label.width;
    icon.x = -inner / 2 + icon.width / 2;
    label.x = -inner / 2 + icon.width + 4;
    const plate = this.add
      .rectangle(0, 0, inner + 14, Math.max(18, label.height + 6), 0x05070c, 0.86)
      .setStrokeStyle(1, colour(introPalette.accent), 0.45);

    const y = VIEW_H - 18 - this.toasts * (label.height + 10);
    const toast = this.add
      .container(this.camW / 2, y + 10, [plate, icon, label])
      .setScrollFactor(0)
      .setDepth(DEPTH.hud)
      .setAlpha(0);
    this.toasts += 1;

    this.tweens.add({ targets: toast, y, alpha: 1, duration: 240, ease: 'Back.easeOut' });
    this.tweens.add({
      targets: toast,
      alpha: 0,
      y: y + 6,
      delay: 2600,
      duration: 400,
      onComplete: () => {
        this.toasts -= 1;
        toast.destroy();
      },
    });
  }

  /* --------------------------------------------------------------- props -- */

  private buildProps(): void {
    const amber = colour(introPalette.accent);
    for (const prop of PROPS) {
      this.add
        .image(prop.x, VIEW_H + 6, 'props', prop.frame)
        .setOrigin(0.5, 1)
        .setScrollFactor(FOREGROUND_PARALLAX)
        .setDepth(DEPTH.props);

      // Frame 0 is the street lamp: give it something to cast.
      if (prop.frame === 0) {
        addLight(this, prop.x + 20, VIEW_H - 97, amber, 0.4, 1.3, 1.3, DEPTH.props - 1).setScrollFactor(
          FOREGROUND_PARALLAX,
        );
        addLight(this, prop.x + 20, VIEW_H - 40, amber, 0.14, 2.2, 2.4, DEPTH.props - 1).setScrollFactor(
          FOREGROUND_PARALLAX,
        );
      }
    }
  }

  /* ------------------------------------------------------------ rickshaw -- */

  /** A Bengaluru auto passes on the near lane every so often, horn and all. */
  private buildRickshaw(): void {
    if (!this.anims.exists('rickshaw-roll') && this.textures.get('rickshaw').frameTotal > 2) {
      this.anims.create({
        key: 'rickshaw-roll',
        frames: this.anims.generateFrameNumbers('rickshaw', { start: 0, end: 1 }),
        frameRate: 14,
        repeat: -1,
      });
    }

    this.rickshaw = this.add
      .sprite(-200, ROAD_Y, 'rickshaw')
      .setOrigin(0.5, 1)
      .setFlipX(true)
      .setDepth(DEPTH.traffic)
      .setVisible(false);
    this.rickshawMirror = this.add
      .sprite(-200, ROAD_Y + 1, 'rickshaw')
      .setOrigin(0.5, 0)
      .setFlip(true, true)
      .setAlpha(0.18)
      .setTint(0x7fa8e0)
      .setDepth(DEPTH.reflection)
      .setVisible(false);

    const warm = 0xffe9a8;
    this.rickshawLights = [
      addLight(this, 0, 0, warm, 0.55, 0.9, 0.5, DEPTH.traffic + 0.1), // headlamp
      addLight(this, 0, 0, warm, 0.22, 2.6, 0.35, DEPTH.lightPool), // beam on the road
      addLight(this, 0, 0, colour(introPalette.magenta), 0.45, 0.35, 0.35, DEPTH.traffic + 0.1), // tail
    ];
    this.rickshawLights.forEach((l) => l.setVisible(false));

    this.time.delayedCall(1800, () => this.spawnRickshaw());
  }

  private spawnRickshaw(): void {
    if (this.entering) return;
    const x = this.cameras.main.scrollX + this.camW + 70;
    for (const s of [this.rickshaw, this.rickshawMirror]) {
      s.setPosition(x, s.y).setVisible(true);
      if (this.anims.exists('rickshaw-roll')) s.play('rickshaw-roll');
    }
    this.rickshawLights.forEach((l) => l.setVisible(true));
    this.rickshawLive = true;
    playHorn();
  }

  private updateRickshaw(dt: number): void {
    if (!this.rickshawLive) return;
    const x = this.rickshaw.x - 170 * dt;
    this.rickshaw.x = x;
    this.rickshawMirror.x = x;
    const [head, beam, tail] = this.rickshawLights;
    head.setPosition(x - 31, ROAD_Y - 15);
    beam.setPosition(x - 76, ROAD_Y - 3);
    tail.setPosition(x + 30, ROAD_Y - 13);

    if (x < this.cameras.main.scrollX - 90) {
      this.rickshawLive = false;
      for (const s of [this.rickshaw, this.rickshawMirror]) s.setVisible(false).stop();
      this.rickshawLights.forEach((l) => l.setVisible(false));
      this.time.delayedCall(Phaser.Math.Between(8000, 12000), () => this.spawnRickshaw());
    }
  }

  /* ---------------------------------------------------------------- rain -- */

  private buildRain(): void {
    const w = this.camW;

    // Far rain: slower, dimmer, behind the player.
    this.add
      .particles(0, 0, 'rain-drop', {
        x: { min: -60, max: w + 60 },
        y: -12,
        lifespan: 1500,
        speedY: { min: 200, max: 280 },
        speedX: { min: -50, max: -28 },
        scaleY: { min: 0.5, max: 0.9 },
        alpha: { min: 0.04, max: 0.12 },
        quantity: 3,
        frequency: 30,
        blendMode: ADD,
      })
      .setScrollFactor(0)
      .setDepth(DEPTH.rainFar);

    // Near rain: fast, long, in front of everything.
    this.add
      .particles(0, 0, 'rain-drop', {
        x: { min: -80, max: w + 80 },
        y: -16,
        lifespan: 900,
        speedY: { min: 420, max: 560 },
        speedX: { min: -110, max: -70 },
        scaleY: { min: 1.4, max: 2.6 },
        alpha: { min: 0.08, max: 0.22 },
        quantity: 2,
        frequency: 36,
        blendMode: ADD,
      })
      .setScrollFactor(0)
      .setDepth(DEPTH.rainNear);

    // Rain bouncing off the road.
    this.add
      .particles(0, 0, 'rain-drop', {
        x: { min: 0, max: w },
        y: { min: GROUND_Y + 2, max: VIEW_H - 6 },
        lifespan: 260,
        speedY: { min: -70, max: -30 },
        speedX: { min: -24, max: 24 },
        gravityY: 340,
        scaleX: 1,
        scaleY: { start: 0.35, end: 0.1 },
        alpha: { start: 0.3, end: 0 },
        quantity: 2,
        frequency: 55,
        blendMode: ADD,
      })
      .setScrollFactor(0)
      .setDepth(DEPTH.rainFar);
  }

  private buildVents(): void {
    for (const x of VENTS) {
      this.add
        .particles(x, GROUND_Y - 2, 'glow', {
          lifespan: 3000,
          speedY: { min: -26, max: -12 },
          speedX: { min: -8, max: 8 },
          scale: { start: 0.2, end: 0.95 },
          alpha: { start: 0.11, end: 0 },
          tint: 0x93a6c8,
          quantity: 1,
          frequency: 450,
        })
        .setDepth(DEPTH.vents);
    }
  }

  /* ----------------------------------------------------------------- hud -- */

  private buildHud(): void {
    const touch = isTouch(this);

    this.prompt = uiText(this, CAFE_X, GROUND_Y + 20, touch ? PROMPTS.enter.touch : PROMPTS.enter.keys, {
      backing: true,
    })
      .setDepth(DEPTH.hud)
      .setAlpha(0);
    this.prompt.setInteractive({ useHandCursor: true });
    this.prompt.on('pointerdown', () => this.enterCafe());

    this.hint = uiText(this, this.camW / 2, VIEW_H - 16, touch ? PROMPTS.walk.touch : PROMPTS.walk.keys, {
      color: '#8b93a7',
    })
      .setScrollFactor(0)
      .setDepth(DEPTH.hud);

    // Voice-note tally, top left (the frame's own controls sit top right).
    this.add.image(16, 14, 'note', 0).setScrollFactor(0).setDepth(DEPTH.hud);
    this.counter = this.add
      .text(28, 14, `0/${this.notes.length}`, { fontFamily: PIXEL_FONT, fontSize: '8px', color: '#e9ebf2' })
      .setOrigin(0, 0.5)
      .setResolution(2)
      .setScrollFactor(0)
      .setDepth(DEPTH.hud);
  }

  private markInput(): void {
    this.idleFor = 0;
    if (this.hintDismissed) return;
    this.hintDismissed = true;
    this.tweens.add({ targets: this.hint, alpha: 0, duration: 450, delay: 1200, ease: 'Sine.easeIn' });
  }

  /* -------------------------------------------------------------- update -- */

  update(_time: number, delta: number): void {
    const dt = Math.min(0.05, delta / 1000); // a tab-out must not teleport anyone
    this.updateRickshaw(dt);

    if (this.entering) {
      this.billboard.update(dt, this.layerOffset);
      return;
    }

    const input = this.controls.read();
    if (input.active) this.markInput();
    this.idleFor += delta;

    const atDoor = Math.abs(this.walker.x - CAFE_X) < DOOR_ZONE && !this.walker.airborne;
    if (atDoor && (input.up || input.enter)) {
      this.enterCafe();
      return;
    }
    if (input.up) this.walker.jump();

    // Nobody should get stuck on the first screen, including the visitor who
    // never touches anything: idleFor just keeps climbing.
    const dir = input.dir !== 0 ? input.dir : this.idleFor > IDLE_BEFORE_AUTOWALK ? 1 : 0;
    this.walker.update(dir, dt);
    this.collectNotes();
    this.lightPlayer();

    this.prompt.setAlpha(Phaser.Math.Linear(this.prompt.alpha, atDoor ? 1 : 0, Math.min(1, dt * 8)));

    // A passive viewer who reaches the door should still see the whole flow.
    this.atDoorFor = atDoor && input.dir === 0 ? this.atDoorFor + delta : 0;
    if (this.atDoorFor > IDLE_AT_DOOR_BEFORE_ENTER) {
      this.enterCafe();
      return;
    }

    this.followCamera(dt, dir);
    this.billboard.update(dt, this.layerOffset);
  }

  /** Walking under a sign washes the player in its colour. */
  private lightPlayer(): void {
    let strength = 0;
    let tint = 0xffffff;
    const consider = (x: number, color: number, reach: number, power: number) => {
      const k = Math.max(0, 1 - Math.abs(this.walker.x - x) / reach) * power;
      if (k > strength) {
        strength = k;
        tint = color;
      }
    };
    for (const sign of SIGNS) consider(sign.x, colour(sign.color), 110, 0.5);
    consider(CAFE_X, colour(introPalette.accent), 160, 0.6);
    this.walker.sprite.setTint(mixColour(0xffffff, mixColour(tint, 0xffffff, 0.4), strength));
  }

  /**
   * The camera tracks a fractional position but only ever hands the camera
   * whole numbers. roundPixels snaps sprites to whole pixels, so a fractional
   * scroll makes sprites and backgrounds round inconsistently - which is
   * exactly what reads as jitter.
   */
  private followCamera(dt: number, dir: number): void {
    // Lead the direction of travel so the player is not centred on their nose.
    this.lookAhead = Phaser.Math.Linear(this.lookAhead, dir * 42, Math.min(1, dt * 1.6));
    const target = Phaser.Math.Clamp(
      this.walker.x - this.camW / 3 + this.lookAhead,
      0,
      Math.max(0, WORLD_W - this.camW),
    );
    this.camX = Phaser.Math.Linear(this.camX, target, Math.min(1, dt * 6));
    const scroll = Math.round(this.camX);
    this.cameras.main.scrollX = scroll;

    this.layerOffset = Math.round(scroll * BUILDINGS_PARALLAX);
    this.sky.tilePositionX = Math.round(scroll * 0.05);
    this.skyline.tilePositionX = Math.round(scroll * 0.25);
    this.buildings.tilePositionX = this.layerOffset;
    this.cables.tilePositionX = Math.round(scroll * 1.1);
    this.street.tilePositionX = scroll;
  }

  /* --------------------------------------------------------------- enter -- */

  private enterCafe(): void {
    if (this.entering) return;
    this.entering = true;
    this.walker.freeze();
    playWhoosh();

    this.tweens.add({ targets: [this.prompt, this.hint], alpha: 0, duration: 200 });
    this.tweens.add({ targets: this.door, scaleX: 0.12, x: CAFE_X - 11, duration: 260, ease: 'Back.easeIn' });
    this.tweens.add({
      targets: [this.walker.sprite, this.walker.shadow, this.walker.reflection],
      x: CAFE_X,
      alpha: 0,
      duration: 420,
      delay: 140,
      ease: 'Sine.easeIn',
    });

    const cam = this.cameras.main;
    cam.pan(CAFE_X, GROUND_Y - 30, 800, 'Sine.easeInOut');
    cam.zoomTo(1.5, 800, 'Sine.easeIn');
    this.time.delayedCall(350, () => cam.fadeOut(450, 0, 0, 0));
    cam.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.start('cafe'));
  }
}
