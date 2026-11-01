import Phaser from 'phaser';
import { CAFE_NAME, introPalette } from '../../config';
import { CAFE_SIGN, PROMPTS, VOICE_NOTES } from '../../content/intro';
import { playPickup, playWhoosh } from '../../lib/sound';
import { BASE_VIEW_W, VIEW_H } from '../viewport';
import { Billboard } from './Billboard';
import { Controls } from './controls';
import { blade, fascia, flicker, rooftop, ticker, wallBox, type Sign } from './Signage';
import { STREET_LANES, Traffic } from './Traffic';
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
const BUILDING_BASE = 196; // where the street-front buildings stand
const FRONT_H = 190; // street-front.png

const PLAYER_START_X = 70;
const CAFE_X = 800;
const DOOR_ZONE = 34;

/** Mirrors scripts/art/street.mjs: the cafe front and its glass. */
const CAFE_W = 192;
const CAFE_H = 128;
const WINDOW_X = [8, 114];
const WINDOW_Y = 60;
const WINDOW_SCREENS = [8, 30, 52];

const NEON = [introPalette.cyan, introPalette.magenta, introPalette.violet, introPalette.lime];
const CLINIC_GREEN = '#49b85f';

/**
 * Amogh's projects, mounted on the street-front buildings in scripts/art/
 * city.mjs - a lightbox on the brick flats, a rooftop board on the shop house,
 * another on the balcony block, a lit box with a ticker on the industrial
 * block, and a blade sign hung beside the cafe. `light` is where each one
 * washes the player in its colour.
 */
const PROJECT_SIGNS: ReadonlyArray<{ light: number; color: string; build: (s: Phaser.Scene, depth: number) => Sign }> = [
  {
    light: 46,
    color: introPalette.cyan,
    build: (s, depth) => wallBox(s, { x: 46, y: 96, label: 'VERA ERP', color: introPalette.cyan, depth }),
  },
  {
    light: 156,
    color: introPalette.magenta,
    build: (s, depth) => rooftop(s, { x: 156, y: 0, roofY: 108, label: 'SECANT', color: introPalette.magenta, depth }),
  },
  {
    light: 385,
    color: introPalette.violet,
    build: (s, depth) => rooftop(s, { x: 385, y: 0, roofY: 76, label: 'HAZEN', color: introPalette.violet, depth, casing: 1 }),
  },
  {
    light: 500,
    color: introPalette.lime,
    build: (s, depth) => wallBox(s, { x: 500, y: 64, label: 'TRUECOMMIT', color: introPalette.lime, depth }),
  },
  {
    light: 688,
    color: introPalette.cyan,
    build: (s, depth) => blade(s, { x: 688, y: 40, label: 'THROTTLE', color: introPalette.cyan, depth, wallSide: 'right' }),
  },
];

/** The shops' own signs, on the fascia band above each opening. */
const SHOP_SIGNS: ReadonlyArray<{ x: number; label: string; color: string }> = [
  { x: 40, label: 'RAMEN', color: introPalette.accent },
  { x: 156, label: 'REPAIRS', color: introPalette.cyan },
  { x: 265, label: '24/7 MART', color: introPalette.cyan },
  { x: 385, label: 'BAR', color: introPalette.magenta },
  { x: 632, label: '+ CLINIC', color: CLINIC_GREEN },
  { x: 928, label: 'KEYS', color: introPalette.accent },
];
const FASCIA_Y = 150;

/** The Wispr Flow board, bolted across the glass tower. */
const BILLBOARD_AT = { x: 266, bottomY: 124 };

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

/** Grates that breathe. */
const VENTS: ReadonlyArray<number> = [120, 470, 610];

const DEPTH = {
  sky: 0,
  megacity: 0.5,
  hazeFar: 0.6,
  skyline: 1,
  farFlyers: 1.4,
  hazeMid: 1.5,
  buildings: 2,
  skyFlyers: 2.5,
  hazeNear: 2.7,
  street: 4,
  front: 4.5,
  cables: 4.8,
  reflection: 5,
  lightPool: 6,
  cafe: 7,
  door: 8,
  cafeSign: 9,
  signs: 9.5,
  vents: 11,
  notes: 11.5,
  player: 12,
  road: 12.3,
  rainFar: 13,
  props: 14,
  rainNear: 15,
  hud: 20,
} as const;

export type IntroResult = { notesFound: number; notesTotal: number };

export type IntroSceneOptions = {
  /** Fired once the player has jacked in to the cafe PC. */
  onEnter: (result: IntroResult) => void;
  /** Fired when the street is up, which clears React's boot watchdog. */
  onReady: () => void;
  reducedMotion: boolean;
};

type Note = {
  sprite: Phaser.GameObjects.Sprite;
  light: Phaser.GameObjects.Image;
  text: string;
};

export class StreetScene extends Phaser.Scene {
  private opts: IntroSceneOptions;
  private camW = BASE_VIEW_W;

  private layers: Array<{ sprite: Phaser.GameObjects.TileSprite; parallax: number }> = [];

  private walker!: Walker;
  private controls!: Controls;
  private billboard!: Billboard;
  private traffic!: Traffic;
  private tickers: Array<{ update: (dt: number) => void }> = [];
  private door!: Phaser.GameObjects.Image;
  private prompt!: Phaser.GameObjects.Text;
  private hint!: Phaser.GameObjects.Text;
  private counter!: Phaser.GameObjects.Text;
  private sparkle!: Phaser.GameObjects.Particles.ParticleEmitter;

  private notes: Note[] = [];
  private found = 0;
  private toasts = 0;
  private entering = false;
  private hintDismissed = false;
  /** Fractional camera position. Only the rounded value reaches the camera. */
  private camX = 0;
  private lookAhead = 0;

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
    this.makeAnims();

    this.buildCity();
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
    this.traffic = new Traffic(
      this,
      STREET_LANES({ far: DEPTH.farFlyers, sky: DEPTH.skyFlyers, road: DEPTH.road }),
      this.camW,
    );
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

  private makeAnims(): void {
    if (!this.anims.exists('rickshaw-roll') && this.textures.get('rickshaw').frameTotal > 2) {
      this.anims.create({
        key: 'rickshaw-roll',
        frames: this.anims.generateFrameNumbers('rickshaw', { start: 0, end: 1 }),
        frameRate: 14,
        repeat: -1,
      });
    }
    if (!this.anims.exists('note-pulse') && this.textures.get('note').frameTotal > 4) {
      this.anims.create({
        key: 'note-pulse',
        frames: this.anims.generateFrameNumbers('note', { start: 0, end: 3 }),
        frameRate: 7,
        repeat: -1,
      });
    }
  }

  /* ---------------------------------------------------------------- city -- */

  /**
   * Back to front: sky, megastructures, skyline, mid-rise blocks, then the
   * street front at the player's own depth. A wash of haze between each layer
   * pushes the far ones back - that is most of what makes the city feel deep.
   */
  private buildCity(): void {
    const layer = (y: number, h: number, key: string, depth: number, parallax: number) => {
      const sprite = this.add.tileSprite(0, y, this.camW, h, key).setOrigin(0, 0).setScrollFactor(0).setDepth(depth);
      this.layers.push({ sprite, parallax });
    };
    const haze = (y: number, h: number, tint: number, alpha: number, depth: number) =>
      this.add
        .image(0, y, 'haze')
        .setOrigin(0, 0)
        .setDisplaySize(this.camW, h)
        .setScrollFactor(0)
        .setTint(tint)
        .setAlpha(alpha)
        .setDepth(depth);

    layer(0, VIEW_H, 'sky', DEPTH.sky, 0.04);
    layer(-22, 210, 'megacity', DEPTH.megacity, 0.12);
    haze(40, 156, 0x1b2540, 0.6, DEPTH.hazeFar);
    layer(BUILDING_BASE - 110, 110, 'skyline', DEPTH.skyline, 0.25);
    haze(96, 100, 0x1b2540, 0.35, DEPTH.hazeMid);
    layer(BUILDING_BASE - 170, 170, 'buildings', DEPTH.buildings, 0.55);
    haze(108, 88, 0x2a1e3c, 0.35, DEPTH.hazeNear);
    layer(0, 64, 'cables', DEPTH.cables, 1.1);
    layer(STREET_TOP, 80, 'street', DEPTH.street, 1);

    // The street front, and its lit ground floors mirrored in the wet road.
    this.add.image(0, BUILDING_BASE, 'street-front').setOrigin(0, 1).setDepth(DEPTH.front);
    this.add
      .image(0, GROUND_Y, 'street-front')
      .setOrigin(0, 0)
      .setFlipY(true)
      .setAlpha(0.1)
      .setTint(0x7fa8e0)
      .setDepth(DEPTH.reflection)
      .setCrop(0, FRONT_H - 70, WORLD_W, 70);
  }

  /* --------------------------------------------------------------- signs -- */

  private buildSigns(): void {
    for (const sign of PROJECT_SIGNS) {
      const built = sign.build(this, DEPTH.signs);
      // and its colour pooling on the pavement below
      built.lights.push(addLight(this, sign.light, GROUND_Y + 6, colour(sign.color), 0.22, 1.6, 0.6, DEPTH.lightPool));
      if (!this.opts.reducedMotion) flicker(this, built);
    }

    this.tickers.push(
      ticker(this, { x: 500, y: 80, w: 92, text: 'REVENUE RECOVERY AGENT', color: introPalette.lime, depth: DEPTH.signs }),
    );

    for (const shop of SHOP_SIGNS) {
      const sign = fascia(this, { x: shop.x, y: FASCIA_Y, label: shop.label, color: shop.color, depth: DEPTH.signs, groundY: GROUND_Y });
      if (!this.opts.reducedMotion && Math.random() < 0.5) flicker(this, sign);
    }

    // A cyan blade high on the cafe tower, catching the eye from down the street.
    const net = blade(this, { x: 884, y: 18, label: 'NET', color: introPalette.cyan, depth: DEPTH.signs, wallSide: 'left' });
    if (!this.opts.reducedMotion) flicker(this, net);

    this.billboard = new Billboard(this, {
      x: BILLBOARD_AT.x,
      bottomY: BILLBOARD_AT.bottomY,
      depth: DEPTH.signs,
      reducedMotion: this.opts.reducedMotion,
    });
  }

  /* ---------------------------------------------------------------- cafe -- */

  private buildCafe(): void {
    const amber = colour(introPalette.accent);
    const top = BUILDING_BASE - CAFE_H;
    const left = CAFE_X - CAFE_W / 2;

    this.add.image(CAFE_X, BUILDING_BASE, 'cafe-front').setOrigin(0.5, 1).setDepth(DEPTH.cafe);
    this.add
      .image(CAFE_X, GROUND_Y, 'cafe-front')
      .setOrigin(0.5, 0)
      .setFlipY(true)
      .setAlpha(0.14)
      .setTint(0x7fa8e0)
      .setDepth(DEPTH.reflection)
      .setCrop(0, CAFE_H - 70, CAFE_W, 70);

    // Warm light inside, seen when the door swings open.
    this.add.rectangle(CAFE_X, BUILDING_BASE, 28, 44, amber, 1).setOrigin(0.5, 1).setDepth(DEPTH.cafe);
    this.door = this.add.image(CAFE_X, BUILDING_BASE, 'door').setOrigin(0.5, 1).setDepth(DEPTH.door);

    // The name is configurable, so shrink to fit rather than assume.
    const name = neonText(this, CAFE_X, top + 28, CAFE_NAME, introPalette.accent, 12).setDepth(DEPTH.cafeSign);
    for (let size = 11; name.width > 176 && size >= 6; size--) name.setFontSize(size + 'px');
    signText(this, CAFE_X, top + 41, CAFE_SIGN.services, introPalette.cyan).setDepth(DEPTH.cafeSign);

    const open = neonText(this, left + 150, top + 103, CAFE_SIGN.open, introPalette.magenta, 8, SIGN_FONT).setDepth(
      DEPTH.cafeSign,
    );
    if (!this.opts.reducedMotion) {
      this.time.addEvent({ delay: 300, loop: true, callback: () => open.setAlpha(Math.random() < 0.12 ? 0.25 : 1) });
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

    addLight(this, CAFE_X, top + 33, amber, 0.3, 5.4, 0.8, DEPTH.cafeSign - 1);
    addLight(this, CAFE_X, GROUND_Y + 8, amber, 0.32, 6.2, 0.8, DEPTH.lightPool);
    addLight(this, CAFE_X, BUILDING_BASE + 2, amber, 0.4, 1.2, 0.5, DEPTH.lightPool);
  }

  /* --------------------------------------------------------------- notes -- */

  private buildNotes(): void {
    const amber = colour(introPalette.accent);
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

      // Frame 0 is the street lamp: a lit head and a cone through the rain.
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

  /* ---------------------------------------------------------------- rain -- */

  private buildRain(): void {
    const w = this.camW;
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
        .particles(x, BUILDING_BASE, 'glow', {
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
      backing: true,
    })
      .setScrollFactor(0)
      .setDepth(DEPTH.hud);

    this.add
      .rectangle(6, 5, 46, 18, 0x05070c, 0.82)
      .setOrigin(0, 0)
      .setStrokeStyle(1, colour(introPalette.accent), 0.4)
      .setScrollFactor(0)
      .setDepth(DEPTH.hud);
    this.add.image(16, 14, 'note', 0).setScrollFactor(0).setDepth(DEPTH.hud);
    this.counter = this.add
      .text(28, 14, `0/${this.notes.length}`, { fontFamily: PIXEL_FONT, fontSize: '8px', color: '#e9ebf2' })
      .setOrigin(0, 0.5)
      .setResolution(2)
      .setScrollFactor(0)
      .setDepth(DEPTH.hud);
  }

  private markInput(): void {
    if (this.hintDismissed) return;
    this.hintDismissed = true;
    this.tweens.add({ targets: this.hint, alpha: 0, duration: 450, delay: 1500, ease: 'Sine.easeIn' });
  }

  /* -------------------------------------------------------------- update -- */

  update(_time: number, delta: number): void {
    const dt = Math.min(0.05, delta / 1000); // a tab-out must not teleport anyone
    this.traffic.update(dt, this.cameras.main.scrollX);
    this.billboard.update(dt);
    for (const t of this.tickers) t.update(dt);
    if (this.entering) return;

    // Nothing here moves unless the player moves it.
    const input = this.controls.read();
    if (input.active) this.markInput();

    const atDoor = Math.abs(this.walker.x - CAFE_X) < DOOR_ZONE && !this.walker.airborne;
    if (atDoor && (input.up || input.enter)) {
      this.enterCafe();
      return;
    }
    if (input.up) this.walker.jump();

    this.walker.update(input.dir, dt);
    this.collectNotes();
    this.lightPlayer();
    this.prompt.setAlpha(Phaser.Math.Linear(this.prompt.alpha, atDoor ? 1 : 0, Math.min(1, dt * 8)));
    this.followCamera(dt, input.dir);
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
    for (const sign of PROJECT_SIGNS) consider(sign.light, colour(sign.color), 100, 0.5);
    consider(BILLBOARD_AT.x, colour(introPalette.accent), 90, 0.35);
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
    this.lookAhead = Phaser.Math.Linear(this.lookAhead, dir * 42, Math.min(1, dt * 1.6));
    const target = Phaser.Math.Clamp(this.walker.x - this.camW / 3 + this.lookAhead, 0, Math.max(0, WORLD_W - this.camW));
    this.camX = Phaser.Math.Linear(this.camX, target, Math.min(1, dt * 6));
    const scroll = Math.round(this.camX);
    this.cameras.main.scrollX = scroll;
    for (const { sprite, parallax } of this.layers) sprite.tilePositionX = Math.round(scroll * parallax);
  }

  /* --------------------------------------------------------------- enter -- */

  private enterCafe(): void {
    if (this.entering) return;
    this.entering = true;
    this.walker.freeze();
    playWhoosh();

    this.tweens.add({ targets: [this.prompt, this.hint], alpha: 0, duration: 200 });
    this.tweens.add({ targets: this.door, scaleX: 0.12, x: CAFE_X - 11, duration: 260, ease: 'Back.easeIn' });
    // Step up off the pavement and through the door.
    this.tweens.add({
      targets: [this.walker.sprite, this.walker.shadow, this.walker.reflection],
      x: CAFE_X,
      alpha: 0,
      duration: 420,
      delay: 140,
      ease: 'Sine.easeIn',
    });
    this.tweens.add({ targets: this.walker.sprite, y: BUILDING_BASE + 2, scale: 0.92, duration: 420, delay: 140 });

    const cam = this.cameras.main;
    cam.pan(CAFE_X, BUILDING_BASE - 40, 800, 'Sine.easeInOut');
    cam.zoomTo(1.5, 800, 'Sine.easeIn');
    this.time.delayedCall(350, () => cam.fadeOut(450, 0, 0, 0));
    cam.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.start('cafe'));
  }
}
