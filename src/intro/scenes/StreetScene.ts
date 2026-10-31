import Phaser from 'phaser';
import { BROWSER_NAME, introPalette } from '../../config';
import { playWhoosh } from '../../lib/sound';
import { VIEW_H, VIEW_W } from '../viewport';
import { CityPostFX } from '../pipelines/CityPostFX';

/* Every number below is in "pixel art pixels" (the 480x270 authoring grid),
 * not screen pixels. */
const WORLD_W = 1400;
const GROUND_Y = 212; // where the player's feet sit
const STREET_TOP = 190;
const BUILDING_BASE = 196;

const PLAYER_START_X = 70;
const PLAYER_SPEED = 150; // ~7.5s of walking to reach the shop
const SHOP_X = 1230;
const DOOR_ZONE = 34;

const IDLE_BEFORE_AUTOWALK = 2500;
const IDLE_AT_DOOR_BEFORE_ENTER = 3000;

const ADD = Phaser.BlendModes.ADD;

/** Signs along the street. Easter eggs: every one is something Amogh built. */
const SIGNS: ReadonlyArray<{ x: number; y: number; label: string; color: string }> = [
  { x: 250, y: 126, label: 'VERA ERP', color: introPalette.cyan },
  { x: 440, y: 96, label: 'SECANT', color: introPalette.magenta },
  { x: 640, y: 134, label: 'HAZEN', color: introPalette.violet },
  { x: 880, y: 100, label: 'TRUECOMMIT', color: introPalette.lime },
  { x: 1060, y: 138, label: 'THROTTLE', color: introPalette.cyan },
];

/**
 * Street furniture in front of the player. Parallax above 1 is what sells the
 * depth - these slide past noticeably faster than the road.
 */
const FOREGROUND_PARALLAX = 1.25;
const PROPS: ReadonlyArray<{ x: number; frame: number }> = [
  { x: 120, frame: 0 },
  { x: 330, frame: 2 },
  { x: 560, frame: 1 },
  { x: 790, frame: 3 },
  { x: 1010, frame: 0 },
  { x: 1240, frame: 2 },
  { x: 1450, frame: 1 },
];

/** Grates that breathe. Placed between the signs so the street is never still. */
const VENTS: ReadonlyArray<number> = [310, 720, 1120];

const DEPTH = {
  sky: 0,
  skyline: 1,
  buildings: 2,
  cables: 3,
  street: 4,
  reflection: 5,
  lightPool: 6,
  shop: 7,
  door: 8,
  shopSign: 9,
  signs: 10,
  vents: 11,
  player: 12,
  rainFar: 13,
  props: 14,
  rainNear: 15,
  hud: 20,
  flood: 30,
} as const;

export type StreetSceneOptions = {
  /** Fired once the door zoom finishes - hand control back to React. */
  onEnter: () => void;
  /** Fired when the scene is up, which clears React's boot watchdog. */
  onReady: () => void;
  reducedMotion: boolean;
};

type SignParts = {
  container: Phaser.GameObjects.Container;
  lights: Phaser.GameObjects.GameObject[];
  baseAlpha: number[];
};

export class StreetScene extends Phaser.Scene {
  private opts: StreetSceneOptions;

  private sky!: Phaser.GameObjects.TileSprite;
  private skyline!: Phaser.GameObjects.TileSprite;
  private buildings!: Phaser.GameObjects.TileSprite;
  private cables!: Phaser.GameObjects.TileSprite;
  private street!: Phaser.GameObjects.TileSprite;

  private player!: Phaser.GameObjects.Sprite;
  private playerReflection!: Phaser.GameObjects.Sprite;
  private shadow!: Phaser.GameObjects.Ellipse;
  private door!: Phaser.GameObjects.Image;
  private doorway!: Phaser.GameObjects.Rectangle;
  private prompt!: Phaser.GameObjects.Text;
  private hint!: Phaser.GameObjects.Text;
  private footSplash?: Phaser.GameObjects.Particles.ParticleEmitter;

  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private keyD?: Phaser.Input.Keyboard.Key;
  private keyA?: Phaser.Input.Keyboard.Key;
  private keyEnter?: Phaser.Input.Keyboard.Key;
  private keySpace?: Phaser.Input.Keyboard.Key;

  private signs: SignParts[] = [];
  private walking = false;
  private entering = false;
  private hintDismissed = false;
  private idleFor = 0;
  private atDoorFor = 0;
  private lookAhead = 0;
  private lastFootFrame = -1;

  constructor(opts: StreetSceneOptions) {
    super('street');
    this.opts = opts;
  }

  preload(): void {
    const base = 'assets/intro/';
    for (const key of ['sky', 'skyline', 'buildings', 'cables', 'street', 'shop', 'door', 'glow']) {
      this.load.image(key, base + key + '.png');
    }
    this.load.image('player-idle', base + 'player-idle.png');
    this.load.spritesheet('player-walk', base + 'player-walk.png', {
      frameWidth: 24,
      frameHeight: 32,
    });
    this.load.spritesheet('props', base + 'props.png', { frameWidth: 64, frameHeight: 120 });

    this.load.on(Phaser.Loader.Events.FILE_LOAD_ERROR, (file: Phaser.Loader.File) => {
      console.warn('[intro] missing asset, using fallback:', file.key);
    });
  }

  create(): void {
    this.ensureFallbackTextures();
    this.rainTexture(); // the footfall splash needs it even when rain is off
    this.cameras.main.setBounds(0, 0, WORLD_W, VIEW_H);
    this.cameras.main.setBackgroundColor(introPalette.night);

    this.buildParallax();
    this.buildSigns();
    this.buildBillboard();
    this.buildShop();
    this.buildPlayer();
    this.buildProps();
    if (!this.opts.reducedMotion) {
      this.buildRain();
      this.buildVents();
    }
    this.buildHud();
    this.bindInput();
    this.attachPostFX();

    this.opts.onReady();
  }

  /* ------------------------------------------------------------ fallback -- */

  /** Flat colour stand-ins so the scene still runs if an asset fails to load. */
  private ensureFallbackTextures(): void {
    const make = (key: string, w: number, h: number, color: number) => {
      if (this.textures.exists(key)) return;
      const g = this.make.graphics({ x: 0, y: 0 }, false);
      g.fillStyle(color, 1).fillRect(0, 0, w, h);
      g.generateTexture(key, w, h);
      g.destroy();
    };
    make('sky', VIEW_W, VIEW_H, 0x070912);
    make('skyline', VIEW_W, 110, 0x0c1120);
    make('buildings', VIEW_W, 170, 0x0a0f1c);
    make('cables', VIEW_W, 64, 0x000000);
    make('street', VIEW_W, 80, 0x0a0d16);
    make('shop', 160, 120, 0x141b2c);
    make('door', 28, 44, 0x1b2235);
    make('glow', 64, 64, 0xffffff);
    make('player-idle', 24, 32, 0x243253);
    make('player-walk', 24, 32, 0x243253);
    make('props', 64, 120, 0x05060d);
  }

  /** The bloom / scanline / vignette pass. Silently skipped without WebGL. */
  private attachPostFX(): void {
    try {
      if (this.renderer.type !== Phaser.WEBGL) return;
      this.cameras.main.setPostPipeline(CityPostFX);
    } catch (err) {
      console.warn('[intro] post-processing unavailable:', err);
    }
  }

  /* ------------------------------------------------------------ parallax -- */

  private buildParallax(): void {
    // Each layer is a screen-sized tile sprite scrolled by hand, so no layer
    // needs a 1400px-wide image and the loop is seamless at any world width.
    const layer = (y: number, h: number, key: string, depth: number) =>
      this.add.tileSprite(0, y, VIEW_W, h, key).setOrigin(0, 0).setScrollFactor(0).setDepth(depth);

    this.sky = layer(0, VIEW_H, 'sky', DEPTH.sky);
    this.skyline = layer(BUILDING_BASE - 110, 110, 'skyline', DEPTH.skyline);
    this.buildings = layer(BUILDING_BASE - 170, 170, 'buildings', DEPTH.buildings);
    this.cables = layer(0, 64, 'cables', DEPTH.cables);
    this.street = layer(STREET_TOP, 80, 'street', DEPTH.street);
  }

  /* -------------------------------------------------------------- lights -- */

  /** A soft tinted disc. Every light in the city is one of these. */
  private light(
    x: number,
    y: number,
    color: number,
    alpha: number,
    scaleX: number,
    scaleY: number,
    depth: number,
  ): Phaser.GameObjects.Image {
    return this.add
      .image(x, y, 'glow')
      .setTint(color)
      .setAlpha(alpha)
      .setScale(scaleX, scaleY)
      .setBlendMode(ADD)
      .setDepth(depth);
  }

  /* --------------------------------------------------------------- signs -- */

  private buildSigns(): void {
    for (const sign of SIGNS) {
      this.signs.push(this.neonSign(sign.x, sign.y, sign.label, sign.color, 8));
    }
  }

  private neonSign(x: number, y: number, label: string, color: string, size: number): SignParts {
    const num = Phaser.Display.Color.HexStringToColor(color).color;
    const style = {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: size + 'px',
      color,
    };

    const text = this.add.text(0, 0, label, style).setOrigin(0.5).setResolution(1);
    const w = text.width + 12;
    const h = text.height + 8;

    const panel = this.add.rectangle(0, 0, w, h, 0x05070c, 0.8);
    const edge = this.add.rectangle(0, 0, w, h).setStrokeStyle(1, num, 0.55);
    const tube = this.add
      .text(0, 0, label, style)
      .setOrigin(0.5)
      .setResolution(1)
      .setAlpha(0.5)
      .setScale(1.08)
      .setBlendMode(ADD);
    const arm = this.add.rectangle(0, h / 2 + 3, 2, 6, num, 0.4);

    const container = this.add
      .container(x, y, [panel, edge, arm, tube, text])
      .setDepth(DEPTH.signs);

    // Halo around the sign itself, a pool of it on the wet road, and a smear
    // between the two.
    const halo = this.light(x, y, num, 0.3, w / 26, h / 18, DEPTH.signs - 1);
    const pool = this.light(x, GROUND_Y + 14, num, 0.26, w / 22, 0.5, DEPTH.lightPool);
    const smear = this.add
      .rectangle(x, GROUND_Y + 30, Math.max(6, w * 0.45), 52, num, 0.06)
      .setBlendMode(ADD)
      .setDepth(DEPTH.lightPool);

    const lights = [halo, pool, smear];
    const parts: SignParts = {
      container,
      lights,
      baseAlpha: [0.3, 0.26, 0.06],
    };
    if (!this.opts.reducedMotion) this.flicker(parts);
    return parts;
  }

  /** Neon never sits still: a slow breathe plus the occasional dropout. */
  private flicker(parts: SignParts): void {
    const apply = (k: number) => {
      parts.container.setAlpha(k);
      parts.lights.forEach((light, i) => {
        (light as Phaser.GameObjects.Image).setAlpha(parts.baseAlpha[i] * k);
      });
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

  /** The one sign that is not Amogh's: a billboard for the people reading this. */
  private buildBillboard(): void {
    const x = 760;
    const y = 58;
    const num = Phaser.Display.Color.HexStringToColor(introPalette.accent).color;

    const text = this.add
      .text(0, 0, 'WISPR FLOW', {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '12px',
        color: introPalette.accent,
      })
      .setOrigin(0.5)
      .setResolution(1);

    const w = text.width + 28;
    const h = text.height + 26;

    const panel = this.add.rectangle(0, 0, w, h, 0x06080f, 0.92);
    const edge = this.add.rectangle(0, 0, w, h).setStrokeStyle(1, num, 0.7);
    const sub = this.add
      .text(0, h / 2 - 9, 'SPEAK. IT WRITES.', {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '5px',
        color: '#8b93a7',
      })
      .setOrigin(0.5)
      .setResolution(1);
    const legL = this.add.rectangle(-w / 4, h / 2 + 11, 2, 22, num, 0.22);
    const legR = this.add.rectangle(w / 4, h / 2 + 11, 2, 22, num, 0.22);

    this.add.container(x, y, [legL, legR, panel, edge, text, sub]).setDepth(DEPTH.signs);
    this.light(x, y, num, 0.22, w / 30, h / 22, DEPTH.signs - 1);
  }

  /* ---------------------------------------------------------------- shop -- */

  private buildShop(): void {
    const shop = this.add.image(SHOP_X, GROUND_Y, 'shop').setOrigin(0.5, 1).setDepth(DEPTH.shop);
    const amber = Phaser.Display.Color.HexStringToColor(introPalette.accent).color;

    // The shopfront mirrored in the wet pavement.
    this.add
      .image(SHOP_X, GROUND_Y + 1, 'shop')
      .setOrigin(0.5, 0)
      .setFlipY(true)
      .setAlpha(0.16)
      .setTint(0x7fa8e0)
      .setDepth(DEPTH.reflection);

    // Warm interior light behind the door - revealed when the door swings open.
    this.doorway = this.add
      .rectangle(SHOP_X, GROUND_Y, 28, 44, amber, 1)
      .setOrigin(0.5, 1)
      .setDepth(DEPTH.shop);

    this.door = this.add.image(SHOP_X, GROUND_Y, 'door').setOrigin(0.5, 1).setDepth(DEPTH.door);

    // The shop sign: BROWSER_NAME in the amber that carries into the browser.
    const boardY = GROUND_Y - shop.height + 34;
    const signStyle = {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '8px',
      color: introPalette.accent,
    };
    const sign = this.add
      .text(SHOP_X, boardY, BROWSER_NAME.toUpperCase(), signStyle)
      .setOrigin(0.5)
      .setResolution(1)
      .setDepth(DEPTH.shopSign);

    // The name is configurable, so shrink to fit rather than assume it fits.
    let size = 8;
    while (sign.width > 130 && size > 4) {
      size -= 1;
      sign.setFontSize(size + 'px');
    }

    const tube = this.add
      .text(SHOP_X, boardY, BROWSER_NAME.toUpperCase(), { ...signStyle, fontSize: size + 'px' })
      .setOrigin(0.5)
      .setResolution(1)
      .setAlpha(0.5)
      .setScale(1.06)
      .setBlendMode(ADD)
      .setDepth(DEPTH.shopSign);

    if (!this.opts.reducedMotion) {
      this.tweens.add({
        targets: tube,
        alpha: { from: 0.3, to: 0.7 },
        duration: 1800,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }

    // Light from the sign, the windows, and the amber pool it throws onto the
    // pavement - the last thing seen before the cut.
    this.light(SHOP_X, boardY, amber, 0.3, 4.6, 0.7, DEPTH.shopSign - 1);
    this.light(SHOP_X - 48, GROUND_Y - 42, amber, 0.2, 1.8, 1.2, DEPTH.shop - 1);
    this.light(SHOP_X + 48, GROUND_Y - 42, amber, 0.2, 1.8, 1.2, DEPTH.shop - 1);
    this.light(SHOP_X, GROUND_Y + 16, amber, 0.34, 5.5, 0.72, DEPTH.lightPool);
    this.light(SHOP_X, GROUND_Y + 2, amber, 0.4, 1.2, 0.5, DEPTH.lightPool);
  }

  /* -------------------------------------------------------------- player -- */

  private buildPlayer(): void {
    if (!this.anims.exists('walk') && this.textures.get('player-walk').frameTotal > 1) {
      this.anims.create({
        key: 'walk',
        frames: this.anims.generateFrameNumbers('player-walk', { start: 0, end: 7 }),
        frameRate: 12,
        repeat: -1,
      });
    }

    // Mirrored in the wet pavement, dimmed and cooled.
    this.playerReflection = this.add
      .sprite(PLAYER_START_X, GROUND_Y + 1, 'player-idle')
      .setOrigin(0.5, 0)
      .setFlipY(true)
      .setAlpha(0.2)
      .setTint(0x7fa8e0)
      .setDepth(DEPTH.reflection);

    this.shadow = this.add
      .ellipse(PLAYER_START_X, GROUND_Y - 1, 18, 5, 0x000000, 0.4)
      .setDepth(DEPTH.player - 1);

    this.player = this.add
      .sprite(PLAYER_START_X, GROUND_Y, 'player-idle')
      .setOrigin(0.5, 1)
      .setDepth(DEPTH.player);

    // Water kicked up on each footfall.
    this.footSplash = this.add
      .particles(0, 0, 'rain-drop', {
        lifespan: 320,
        speedY: { min: -60, max: -25 },
        speedX: { min: -30, max: 30 },
        gravityY: 340,
        scaleX: 1,
        scaleY: { start: 0.4, end: 0.1 },
        alpha: { start: 0.4, end: 0 },
        blendMode: ADD,
        emitting: false,
      })
      .setDepth(DEPTH.player - 1);
  }

  /* --------------------------------------------------------------- props -- */

  private buildProps(): void {
    const amber = Phaser.Display.Color.HexStringToColor(introPalette.accent).color;

    for (const prop of PROPS) {
      this.add
        .image(prop.x, VIEW_H + 6, 'props', prop.frame)
        .setOrigin(0.5, 1)
        .setScrollFactor(FOREGROUND_PARALLAX)
        .setDepth(DEPTH.props);

      // Frame 0 is the street lamp: give it something to cast.
      if (prop.frame === 0) {
        this.light(prop.x + 20, VIEW_H - 97, amber, 0.4, 1.3, 1.3, DEPTH.props - 1).setScrollFactor(
          FOREGROUND_PARALLAX,
        );
        this.light(prop.x + 20, VIEW_H - 40, amber, 0.14, 2.2, 2.4, DEPTH.props - 1).setScrollFactor(
          FOREGROUND_PARALLAX,
        );
      }
    }
  }

  /* ---------------------------------------------------------------- rain -- */

  private rainTexture(): void {
    if (this.textures.exists('rain-drop')) return;
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0xc9d8ff, 1).fillRect(0, 0, 1, 6);
    g.generateTexture('rain-drop', 1, 6);
    g.destroy();
  }

  private buildRain(): void {
    this.rainTexture();

    // Far rain: slower, dimmer, behind the player.
    this.add
      .particles(0, 0, 'rain-drop', {
        x: { min: -60, max: VIEW_W + 60 },
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
        x: { min: -80, max: VIEW_W + 80 },
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

    // Rain hitting the road.
    this.add
      .particles(0, 0, 'rain-drop', {
        x: { min: 0, max: VIEW_W },
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
    const touch = this.sys.game.device.input.touch;

    this.prompt = this.add
      .text(SHOP_X, GROUND_Y + 20, touch ? 'Tap here to enter' : 'Press  ^  /  Enter  to enter', {
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: '9px',
        color: '#e9ebf2',
        backgroundColor: 'rgba(5,7,12,0.78)',
        padding: { x: 6, y: 4 },
      })
      .setOrigin(0.5)
      .setResolution(2)
      .setDepth(DEPTH.hud)
      .setAlpha(0);

    this.prompt.setInteractive({ useHandCursor: true });
    this.prompt.on('pointerdown', (p: Phaser.Input.Pointer) => {
      p.event.stopPropagation();
      this.enterDoor();
    });

    this.hint = this.add
      .text(VIEW_W / 2, VIEW_H - 16, touch ? 'Tap and hold to walk' : 'Hold  >  or  D  to walk', {
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: '9px',
        color: '#8b93a7',
      })
      .setOrigin(0.5)
      .setResolution(2)
      .setScrollFactor(0)
      .setDepth(DEPTH.hud);
  }

  /* --------------------------------------------------------------- input -- */

  private bindInput(): void {
    const kb = this.input.keyboard;
    if (kb) {
      this.cursors = kb.createCursorKeys();
      this.keyD = kb.addKey(Phaser.Input.Keyboard.KeyCodes.D);
      this.keyA = kb.addKey(Phaser.Input.Keyboard.KeyCodes.A);
      this.keyEnter = kb.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
      this.keySpace = kb.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

      // Arrow keys and space would otherwise scroll the page behind the canvas.
      kb.addCapture([
        Phaser.Input.Keyboard.KeyCodes.LEFT,
        Phaser.Input.Keyboard.KeyCodes.RIGHT,
        Phaser.Input.Keyboard.KeyCodes.UP,
        Phaser.Input.Keyboard.KeyCodes.SPACE,
      ]);
    }

    this.input.on('pointerdown', () => {
      this.markInput();
      this.walking = true;
    });
    this.input.on('pointerup', () => {
      this.walking = false;
    });
    this.input.on('gameout', () => {
      this.walking = false;
    });
  }

  private markInput(): void {
    this.idleFor = 0;
    if (!this.hintDismissed) {
      this.hintDismissed = true;
      this.tweens.add({ targets: this.hint, alpha: 0, duration: 450, ease: 'Sine.easeIn' });
    }
  }

  /* --------------------------------------------------------------- update - */

  update(_time: number, delta: number): void {
    if (this.entering) return;

    const dt = delta / 1000;
    const pressedRight =
      this.walking || this.cursors?.right?.isDown === true || this.keyD?.isDown === true;
    const pressedLeft = this.cursors?.left?.isDown === true || this.keyA?.isDown === true;
    const pressedEnter =
      this.cursors?.up?.isDown === true ||
      this.keyEnter?.isDown === true ||
      this.keySpace?.isDown === true;

    if (pressedRight || pressedLeft || pressedEnter) this.markInput();

    this.idleFor += delta;
    // Nobody should be able to get stuck on the first screen. This also covers
    // the visitor who never touches anything: idleFor just keeps climbing.
    const autoWalk = this.idleFor > IDLE_BEFORE_AUTOWALK;

    let dir = 0;
    if (pressedRight) dir = 1;
    else if (pressedLeft) dir = -1;
    else if (autoWalk) dir = 1;

    const maxX = SHOP_X - 6;
    if (dir !== 0) {
      this.player.x = Phaser.Math.Clamp(this.player.x + dir * PLAYER_SPEED * dt, 24, maxX);
      this.player.setFlipX(dir < 0);
      if (this.player.anims.currentAnim?.key !== 'walk' && this.anims.exists('walk')) {
        this.player.play('walk');
      }
      this.splashOnFootfall();
    } else if (this.player.anims.isPlaying) {
      this.player.stop();
      this.player.setTexture('player-idle');
      this.lastFootFrame = -1;
    }

    this.syncPlayerDressing();

    const inDoorZone = Math.abs(this.player.x - SHOP_X) < DOOR_ZONE;
    this.prompt.setAlpha(
      Phaser.Math.Linear(this.prompt.alpha, inDoorZone ? 1 : 0, Math.min(1, dt * 8)),
    );

    if (inDoorZone && pressedEnter) {
      this.enterDoor();
      return;
    }

    // A passive viewer who reaches the door should still see the whole flow.
    if (inDoorZone && !pressedRight && !pressedLeft) {
      this.atDoorFor += delta;
      if (this.atDoorFor > IDLE_AT_DOOR_BEFORE_ENTER) {
        this.enterDoor();
        return;
      }
    } else {
      this.atDoorFor = 0;
    }

    this.followCamera(dt, dir);
  }

  /** Shadow and mirror image track the player every frame. */
  private syncPlayerDressing(): void {
    this.shadow.x = this.player.x;

    const ref = this.playerReflection;
    ref.setTexture(this.player.texture.key, this.player.frame.name);
    ref.setFlipY(true);
    ref.setFlipX(this.player.flipX);
    ref.x = this.player.x;
  }

  /** Kick up water on the two contact frames of the walk cycle. */
  private splashOnFootfall(): void {
    const frame = Number(this.player.frame.name);
    if (Number.isNaN(frame)) return;
    const isContact = frame === 0 || frame === 4;
    if (isContact && frame !== this.lastFootFrame) {
      this.footSplash?.explode(3, this.player.x, GROUND_Y - 1);
    }
    this.lastFootFrame = frame;
  }

  private followCamera(dt: number, dir: number): void {
    const cam = this.cameras.main;
    // Lead the camera in the direction of travel so the player is not centred
    // on their own nose while walking.
    this.lookAhead = Phaser.Math.Linear(this.lookAhead, dir * 42, Math.min(1, dt * 1.6));
    const target = Phaser.Math.Clamp(
      this.player.x - VIEW_W / 3 + this.lookAhead,
      0,
      WORLD_W - VIEW_W,
    );
    cam.scrollX = Phaser.Math.Linear(cam.scrollX, target, Math.min(1, dt * 6));

    this.sky.tilePositionX = cam.scrollX * 0.05;
    this.skyline.tilePositionX = cam.scrollX * 0.25;
    this.buildings.tilePositionX = cam.scrollX * 0.55;
    this.cables.tilePositionX = cam.scrollX * 1.1;
    this.street.tilePositionX = cam.scrollX;
  }

  /* ------------------------------------------------------------- door ----- */

  private enterDoor(): void {
    if (this.entering) return;
    this.entering = true;
    this.walking = false;

    playWhoosh();

    this.player.stop();
    this.player.setTexture('player-idle');
    this.tweens.add({ targets: [this.prompt, this.hint], alpha: 0, duration: 200 });

    // The door swings inward and the player steps through.
    this.tweens.add({
      targets: this.door,
      scaleX: 0.12,
      x: SHOP_X - 11,
      duration: 260,
      ease: 'Back.easeIn',
    });
    this.tweens.add({
      targets: [this.player, this.playerReflection, this.shadow],
      x: SHOP_X,
      alpha: 0,
      duration: 420,
      delay: 160,
      ease: 'Sine.easeIn',
    });

    const cam = this.cameras.main;
    cam.pan(SHOP_X, GROUND_Y - 24, 600, 'Sine.easeInOut');
    cam.zoomTo(4.5, 600, 'Sine.easeInOut');

    // The interior light grows to fill the frame, handing off to the flash.
    // Lifted above the rain so nothing streaks across it.
    this.doorway.setDepth(DEPTH.flood);
    this.tweens.add({
      targets: this.doorway,
      scaleX: 9,
      scaleY: 4.5,
      duration: 600,
      ease: 'Quad.easeIn',
    });

    this.time.delayedCall(600, () => this.opts.onEnter());
  }
}
