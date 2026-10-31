import Phaser from 'phaser';
import { BROWSER_NAME, introPalette } from '../../config';
import { playWhoosh } from '../../lib/sound';
import { VIEW_H, VIEW_W } from '../viewport';

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

/** Signs along the street. Easter eggs: every one is something Amogh built. */
const SIGNS: ReadonlyArray<{ x: number; y: number; label: string; color: string }> = [
  { x: 250, y: 126, label: 'VERA ERP', color: introPalette.cyan },
  { x: 440, y: 96, label: 'SECANT', color: introPalette.magenta },
  { x: 640, y: 134, label: 'HAZEN', color: introPalette.violet },
  { x: 880, y: 100, label: 'TRUECOMMIT', color: introPalette.lime },
  { x: 1060, y: 138, label: 'THROTTLE', color: introPalette.cyan },
];

export type StreetSceneOptions = {
  /** Fired once the door zoom finishes - hand control back to React. */
  onEnter: () => void;
  reducedMotion: boolean;
};

type SignParts = {
  container: Phaser.GameObjects.Container;
  reflections: Phaser.GameObjects.Rectangle[];
};

export class StreetScene extends Phaser.Scene {
  private opts: StreetSceneOptions;

  private sky!: Phaser.GameObjects.TileSprite;
  private skyline!: Phaser.GameObjects.TileSprite;
  private buildings!: Phaser.GameObjects.TileSprite;
  private street!: Phaser.GameObjects.TileSprite;

  private player!: Phaser.GameObjects.Sprite;
  private shadow!: Phaser.GameObjects.Ellipse;
  private door!: Phaser.GameObjects.Image;
  private doorway!: Phaser.GameObjects.Rectangle;
  private prompt!: Phaser.GameObjects.Text;
  private hint!: Phaser.GameObjects.Text;

  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keyD!: Phaser.Input.Keyboard.Key;
  private keyA!: Phaser.Input.Keyboard.Key;
  private keyEnter!: Phaser.Input.Keyboard.Key;
  private keySpace!: Phaser.Input.Keyboard.Key;

  private signs: SignParts[] = [];
  private walking = false;
  private entering = false;
  private hintDismissed = false;
  private idleFor = 0;
  private atDoorFor = 0;

  constructor(opts: StreetSceneOptions) {
    super('street');
    this.opts = opts;
  }

  preload(): void {
    const base = 'assets/intro/';
    this.load.image('sky', base + 'sky.png');
    this.load.image('skyline', base + 'skyline.png');
    this.load.image('buildings', base + 'buildings.png');
    this.load.image('street', base + 'street.png');
    this.load.image('shop', base + 'shop.png');
    this.load.image('door', base + 'door.png');
    this.load.image('player-idle', base + 'player-idle.png');
    this.load.spritesheet('player-walk', base + 'player-walk.png', {
      frameWidth: 16,
      frameHeight: 24,
    });

    // A missing or corrupt file must not leave a black screen.
    this.load.on(Phaser.Loader.Events.FILE_LOAD_ERROR, (file: Phaser.Loader.File) => {
      console.warn('[intro] missing asset, using fallback:', file.key);
    });
  }

  create(): void {
    this.ensureFallbackTextures();
    this.cameras.main.setBounds(0, 0, WORLD_W, VIEW_H);
    this.cameras.main.setBackgroundColor(introPalette.night);

    this.buildParallax();
    this.buildSigns();
    this.buildBillboard();
    this.buildShop();
    this.buildPlayer();
    if (!this.opts.reducedMotion) this.buildRain();
    this.buildHud();
    this.bindInput();
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
    make('street', VIEW_W, 80, 0x0a0d16);
    make('shop', 160, 120, 0x141b2c);
    make('door', 24, 40, 0x1b2235);
    make('player-idle', 16, 24, 0x243253);
    make('player-walk', 16, 24, 0x243253);
  }

  /* ------------------------------------------------------------ parallax -- */

  private buildParallax(): void {
    // Each layer is a screen-sized tile sprite scrolled by hand, so no layer
    // needs a 1400px-wide image and the loop is seamless at any world width.
    this.sky = this.add.tileSprite(0, 0, VIEW_W, VIEW_H, 'sky').setOrigin(0, 0).setScrollFactor(0);
    this.skyline = this.add
      .tileSprite(0, BUILDING_BASE - 110, VIEW_W, 110, 'skyline')
      .setOrigin(0, 0)
      .setScrollFactor(0);
    this.buildings = this.add
      .tileSprite(0, BUILDING_BASE - 170, VIEW_W, 170, 'buildings')
      .setOrigin(0, 0)
      .setScrollFactor(0);
    this.street = this.add
      .tileSprite(0, STREET_TOP, VIEW_W, 80, 'street')
      .setOrigin(0, 0)
      .setScrollFactor(0);

    this.sky.setDepth(0);
    this.skyline.setDepth(1);
    this.buildings.setDepth(2);
    this.street.setDepth(3);
  }

  /* --------------------------------------------------------------- signs -- */

  private buildSigns(): void {
    for (const sign of SIGNS) {
      this.signs.push(this.neonSign(sign.x, sign.y, sign.label, sign.color, 8));
    }
  }

  private neonSign(x: number, y: number, label: string, color: string, size: number): SignParts {
    const num = Phaser.Display.Color.HexStringToColor(color).color;

    const text = this.add
      .text(0, 0, label, {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: size + 'px',
        color,
      })
      .setOrigin(0.5)
      .setResolution(1);

    const w = text.width + 12;
    const h = text.height + 8;

    const panel = this.add.rectangle(0, 0, w, h, 0x05070c, 0.78);
    const edge = this.add.rectangle(0, 0, w, h).setStrokeStyle(1, num, 0.5);
    const glow = this.add
      .text(0, 0, label, {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: size + 'px',
        color,
      })
      .setOrigin(0.5)
      .setResolution(1)
      .setAlpha(0.45)
      .setScale(1.08)
      .setBlendMode(Phaser.BlendModes.ADD);

    // A short bracket tying the sign back to the building face.
    const arm = this.add.rectangle(0, h / 2 + 3, 2, 6, num, 0.35);

    const container = this.add.container(x, y, [panel, edge, arm, glow, text]).setDepth(4);

    // Wet-street reflection: a few stacked strips fading out towards the viewer.
    const reflections: Phaser.GameObjects.Rectangle[] = [];
    for (let i = 0; i < 4; i++) {
      const strip = this.add
        .rectangle(x, GROUND_Y + 10 + i * 11, w * (1 + i * 0.12), 11, num, 0.1 - i * 0.022)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setDepth(4);
      reflections.push(strip);
    }

    const parts: SignParts = { container, reflections };
    if (!this.opts.reducedMotion) this.flicker(parts);
    return parts;
  }

  /** Neon never sits still: a slow breathe plus the occasional dropout. */
  private flicker(parts: SignParts): void {
    const apply = (alpha: number) => {
      parts.container.setAlpha(alpha);
      parts.reflections.forEach((r, i) => r.setAlpha((0.1 - i * 0.022) * alpha));
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
    const y = 62;
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

    const panel = this.add.rectangle(0, 0, w, h, 0x06080f, 0.9);
    const edge = this.add.rectangle(0, 0, w, h).setStrokeStyle(1, num, 0.65);
    const sub = this.add
      .text(0, h / 2 - 9, 'SPEAK. IT WRITES.', {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '5px',
        color: '#8b93a7',
      })
      .setOrigin(0.5)
      .setResolution(1);

    // legs down to the rooftop
    const legL = this.add.rectangle(-w / 4, h / 2 + 10, 2, 20, num, 0.2);
    const legR = this.add.rectangle(w / 4, h / 2 + 10, 2, 20, num, 0.2);

    this.add.container(x, y, [legL, legR, panel, edge, text, sub]).setDepth(4);
  }

  /* ---------------------------------------------------------------- shop -- */

  private buildShop(): void {
    const shop = this.add.image(SHOP_X, GROUND_Y, 'shop').setOrigin(0.5, 1).setDepth(5);

    // Warm interior light behind the door - revealed when the door swings open.
    this.doorway = this.add
      .rectangle(SHOP_X, GROUND_Y, 24, 40, 0xf5a35c, 1)
      .setOrigin(0.5, 1)
      .setDepth(5);

    this.door = this.add.image(SHOP_X, GROUND_Y, 'door').setOrigin(0.5, 1).setDepth(6);

    // The shop sign: BROWSER_NAME in the amber that carries into the browser.
    const boardTop = GROUND_Y - shop.height + 24;
    const sign = this.add
      .text(SHOP_X, boardTop + 11, BROWSER_NAME.toUpperCase(), {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '8px',
        color: introPalette.accent,
      })
      .setOrigin(0.5)
      .setResolution(1)
      .setDepth(7);

    // The name is configurable, so shrink to fit rather than assume it fits.
    const maxWidth = 132;
    let size = 8;
    while (sign.width > maxWidth && size > 4) {
      size -= 1;
      sign.setFontSize(size + 'px');
    }

    const glow = this.add
      .text(SHOP_X, boardTop + 11, BROWSER_NAME.toUpperCase(), {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: size + 'px',
        color: introPalette.accent,
      })
      .setOrigin(0.5)
      .setResolution(1)
      .setAlpha(0.5)
      .setScale(1.06)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(7);

    if (!this.opts.reducedMotion) {
      this.tweens.add({
        targets: glow,
        alpha: { from: 0.28, to: 0.65 },
        duration: 1800,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }

    // Amber pool spilling onto the wet pavement outside the shop.
    for (let i = 0; i < 4; i++) {
      this.add
        .rectangle(SHOP_X, GROUND_Y + 8 + i * 12, 150 + i * 26, 12, 0xf5a35c, 0.13 - i * 0.028)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setDepth(5);
    }
  }

  /* -------------------------------------------------------------- player -- */

  private buildPlayer(): void {
    if (!this.anims.exists('walk') && this.textures.get('player-walk').frameTotal > 1) {
      this.anims.create({
        key: 'walk',
        frames: this.anims.generateFrameNumbers('player-walk', { start: 0, end: 5 }),
        frameRate: 10,
        repeat: -1,
      });
    }

    this.shadow = this.add
      .ellipse(PLAYER_START_X, GROUND_Y - 1, 16, 4, 0x000000, 0.35)
      .setDepth(7);

    this.player = this.add
      .sprite(PLAYER_START_X, GROUND_Y, 'player-idle')
      .setOrigin(0.5, 1)
      .setDepth(8);
  }

  /* ---------------------------------------------------------------- rain -- */

  private buildRain(): void {
    if (!this.textures.exists('rain-drop')) {
      const g = this.make.graphics({ x: 0, y: 0 }, false);
      g.fillStyle(0xc9d8ff, 1).fillRect(0, 0, 1, 6);
      g.generateTexture('rain-drop', 1, 6);
      g.destroy();
    }

    this.add
      .particles(0, 0, 'rain-drop', {
        x: { min: -60, max: VIEW_W + 60 },
        y: -12,
        lifespan: 1100,
        speedY: { min: 320, max: 430 },
        speedX: { min: -80, max: -45 },
        scaleY: { min: 0.7, max: 1.7 },
        alpha: { min: 0.06, max: 0.26 },
        quantity: 3,
        frequency: 26,
        blendMode: Phaser.BlendModes.ADD,
      })
      .setScrollFactor(0)
      .setDepth(9);
  }

  /* ----------------------------------------------------------------- hud -- */

  private buildHud(): void {
    const touch = this.sys.game.device.input.touch;

    this.prompt = this.add
      .text(SHOP_X, GROUND_Y + 16, touch ? 'Tap here to enter' : 'Press  ^  /  Enter  to enter', {
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: '9px',
        color: '#e9ebf2',
        backgroundColor: 'rgba(5,7,12,0.72)',
        padding: { x: 6, y: 4 },
      })
      .setOrigin(0.5)
      .setResolution(2)
      .setDepth(10)
      .setAlpha(0);

    this.prompt.setInteractive({ useHandCursor: true });
    this.prompt.on('pointerdown', (p: Phaser.Input.Pointer) => {
      p.event.stopPropagation();
      this.enterDoor();
    });

    this.hint = this.add
      .text(
        VIEW_W / 2,
        VIEW_H - 16,
        touch ? 'Tap and hold to walk' : 'Hold  >  or  D  to walk',
        {
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: '9px',
          color: '#8b93a7',
        },
      )
      .setOrigin(0.5)
      .setResolution(2)
      .setScrollFactor(0)
      .setDepth(10);
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

    // Tap-and-hold anywhere walks right.
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
    } else if (this.player.anims.isPlaying) {
      this.player.stop();
      this.player.setTexture('player-idle');
    }

    this.shadow.x = this.player.x;

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

    this.followCamera(dt);
  }

  private followCamera(dt: number): void {
    const cam = this.cameras.main;
    const target = Phaser.Math.Clamp(this.player.x - VIEW_W / 3, 0, WORLD_W - VIEW_W);
    cam.scrollX = Phaser.Math.Linear(cam.scrollX, target, Math.min(1, dt * 6));

    this.sky.tilePositionX = cam.scrollX * 0.05;
    this.skyline.tilePositionX = cam.scrollX * 0.25;
    this.buildings.tilePositionX = cam.scrollX * 0.55;
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
      x: SHOP_X - 9,
      duration: 260,
      ease: 'Back.easeIn',
    });
    this.tweens.add({
      targets: [this.player, this.shadow],
      x: SHOP_X,
      alpha: 0,
      duration: 420,
      delay: 160,
      ease: 'Sine.easeIn',
    });

    const cam = this.cameras.main;
    cam.pan(SHOP_X, GROUND_Y - 22, 600, 'Sine.easeInOut');
    cam.zoomTo(4.5, 600, 'Sine.easeInOut');

    // The interior light grows to fill the frame, handing off to the flash.
    // Lifted above the rain and the player so nothing streaks across it.
    this.doorway.setDepth(20);
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
