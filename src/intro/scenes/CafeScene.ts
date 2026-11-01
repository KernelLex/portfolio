import Phaser from 'phaser';
import { introPalette } from '../../config';
import { CAFE_INTERIOR, PROMPTS, SEAT_NUMBER, VOICE_NOTES } from '../../content/intro';
import { playClick } from '../../lib/sound';
import { BASE_VIEW_W, VIEW_H } from '../viewport';
import { Controls } from './controls';
import type { LinkSceneData } from './LinkScene';
import type { IntroSceneOptions } from './StreetScene';
import { Walker } from './Walker';
import { addLight, attachPostFX, colour, isTouch, neonText, signText, uiText } from './shared';

/* Room layout, in pixel-art pixels. Mirrors scripts/art/cafe.mjs. */
const ROOM_W = 800;
const DESK_BASE_Y = 202;
const SIT_BASE_Y = 189;
const CHAIR_BASE_Y = 218;
const GROUND_Y = 240;
const COUNTER_X = 134;
const STATIONS = [250, 314, 378, 442, 506, 570, 634, 698, 762];
const SEAT_X = STATIONS[SEAT_NUMBER - 1];
const SEAT_ZONE = 16;

/** The monitor face on cafe-desk.png, relative to a station's x. */
const SCREEN = { dx: -14, y: DESK_BASE_Y - 50, w: 28, h: 18 };
const SCREEN_CY = SCREEN.y + SCREEN.h / 2;
/** The TV's picture, on frame 5 of cafe-decor.png placed at (238, 68). */
const TV = { x: 218, y: 56, w: 40, h: 24 };

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
  tubes: 1.5,
  fans: 2,
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

type Phase = 'walking' | 'sitting' | 'seated' | 'linking';
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
  private prompt!: Phaser.GameObjects.Text;
  private hint!: Phaser.GameObjects.Text;

  private phase: Phase = 'walking';
  private seatScreen: 'off' | 'boot' = 'off';
  private clock = 0;
  private screenTick = 0;
  private hintDismissed = false;
  private camX = 0;

  constructor(opts: IntroSceneOptions) {
    super('cafe');
    this.opts = opts;
  }

  create(): void {
    this.camW = this.scale.width;
    this.phase = 'walking';
    this.seatScreen = 'off';
    this.glows = [];
    const cam = this.cameras.main;
    cam.setBounds(0, 0, ROOM_W, VIEW_H);
    cam.setBackgroundColor(introPalette.night);
    cam.fadeIn(500, 0, 0, 0);

    this.add.tileSprite(0, 0, ROOM_W, VIEW_H, 'cafe-wall').setOrigin(0, 0).setDepth(DEPTH.wall);
    this.buildEntrance();
    this.buildDecor();
    this.buildLights();
    this.buildCounter();
    this.buildStations();
    this.screens = this.add.graphics().setDepth(DEPTH.screens);

    this.walker = new Walker(this, {
      x: 30,
      groundY: GROUND_Y,
      minX: 16,
      maxX: ROOM_W - 16,
      depth: DEPTH.player,
      reflection: { alpha: 0.12, tint: 0x9fb4e0 },
      splashes: false,
    });

    this.buildMarker();
    this.buildHud();
    this.controls = new Controls(this);
    attachPostFX(this);
    this.drawScreens();
  }

  /* ---------------------------------------------------------------- room -- */

  /** The door just walked through, the street's blue light still spilling in. */
  private buildEntrance(): void {
    this.add.rectangle(24, 176, 34, 58, C.night0).setOrigin(0.5, 1).setDepth(DEPTH.decor);
    this.add.rectangle(24, 176, 28, 52, 0x1b2540).setOrigin(0.5, 1).setDepth(DEPTH.decor);
    this.add.rectangle(24, 176, 28, 14, 0x121a2e).setOrigin(0.5, 1).setDepth(DEPTH.decor);
    addLight(this, 24, 150, C.cyan, 0.14, 0.9, 1.4, DEPTH.decor + 0.1);
    addLight(this, 40, 210, C.cyan, 0.08, 1.6, 0.4, DEPTH.floorGlow);
  }

  private buildDecor(): void {
    const piece = (frame: number, x: number, y: number) =>
      this.add.image(x, y, 'cafe-decor', frame).setDepth(DEPTH.decor);

    piece(7, 110, 82).setScale(1.3, 1);
    signText(this, 110, 74, CAFE_INTERIOR.scores[0], introPalette.accent).setDepth(DEPTH.decor);
    signText(this, 110, 87, CAFE_INTERIOR.scores[1], '#b3bdd6').setDepth(DEPTH.decor);

    piece(6, 172, 100);
    piece(5, 238, 68);
    piece(3, 452, 38);
    piece(0, 302, 104);
    piece(1, 590, 104);
    piece(0, 716, 104).setFlipX(true);
    piece(4, 652, 58);

    // The house rule every cafe has, on a plate stretched to fit it.
    piece(2, 450, 116).setScale(2.6, 1);
    signText(this, 450, 116, CAFE_INTERIOR.houseRule, '#a3245c').setDepth(DEPTH.decor);

    const neon = neonText(this, 330, 58, CAFE_INTERIOR.neon, introPalette.magenta, 10).setDepth(DEPTH.decor);
    addLight(this, 330, 58, C.magenta, 0.2, 2.2, 0.6, DEPTH.decor - 0.1);
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

    // Ceiling fans, turning slowly, as in every cafe in the city.
    if (!this.anims.exists('fan-spin') && this.textures.get('cafe-fan').frameTotal > 4) {
      this.anims.create({
        key: 'fan-spin',
        frames: this.anims.generateFrameNumbers('cafe-fan', { start: 0, end: 3 }),
        frameRate: 12,
        repeat: -1,
      });
    }
    for (const x of [300, 610]) {
      const fan = this.add.sprite(x, 2, 'cafe-fan', 0).setOrigin(0.5, 0).setDepth(DEPTH.fans);
      if (!this.opts.reducedMotion && this.anims.exists('fan-spin')) fan.play('fan-spin');
    }
  }

  /** Tube lights under the RGB strip; one of them has never worked properly. */
  private buildLights(): void {
    [200, 450, 700].forEach((x, i) => {
      const tube = this.add.rectangle(x, 24, 36, 2, C.pale).setDepth(DEPTH.tubes);
      const glow = addLight(this, x, 25, C.pale, 0.16, 1.4, 0.4, DEPTH.tubes);
      addLight(this, x, 70, C.pale, 0.04, 2.4, 2.6, DEPTH.tubes);
      if (i !== 2 || this.opts.reducedMotion) return;
      this.time.addEvent({
        delay: 1900,
        loop: true,
        callback: () => {
          const off = Math.random() < 0.6;
          tube.setAlpha(off ? 0.25 : 1);
          glow.setAlpha(off ? 0.03 : 0.16);
          this.time.delayedCall(90, () => {
            tube.setAlpha(1);
            glow.setAlpha(0.16);
          });
        },
      });
    });
  }

  private buildCounter(): void {
    const counter = this.add
      .sprite(COUNTER_X, CHAIR_BASE_Y, 'cafe-counter', 0)
      .setOrigin(0.5, 1)
      .setDepth(DEPTH.chairs);
    addLight(this, COUNTER_X - 18, 150, C.amber, 0.2, 1.6, 1.2, DEPTH.chairs + 0.1);

    if (!this.opts.reducedMotion) {
      const blink = () => {
        counter.setFrame(1);
        this.time.delayedCall(140, () => counter.setFrame(0));
        this.time.delayedCall(Phaser.Math.Between(2500, 4500), blink);
      };
      this.time.delayedCall(1800, blink);
    }

    // The cashier points you to your seat.
    this.time.delayedCall(600, () => {
      const bubble = uiText(this, COUNTER_X - 16, 128, CAFE_INTERIOR.cashier, { backing: true })
        .setDepth(DEPTH.hud)
        .setAlpha(0);
      this.tweens.add({ targets: bubble, alpha: 1, y: 124, duration: 260, ease: 'Back.easeOut' });
      this.tweens.add({ targets: bubble, alpha: 0, delay: 3400, duration: 400, onComplete: () => bubble.destroy() });
    });
  }

  /** Nine PCs, eight of them taken. */
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
        const glow = addLight(this, x, SCREEN_CY, GLOW[GAMES[i]], 0.28, 0.75, 0.55, DEPTH.screenGlow);
        this.glows.push(glow);
        addLight(this, x, 226, GLOW[GAMES[i]], 0.12, 1.1, 0.28, DEPTH.floorGlow);
      }

      // The free chair sits pushed out, waiting.
      const chair = this.add
        .image(isSeat ? x + 7 : x, CHAIR_BASE_Y, 'cafe-chair')
        .setOrigin(0.5, 1)
        .setDepth(DEPTH.chairs);
      if (isSeat) this.seatChair = chair;
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
    this.prompt = uiText(this, SEAT_X, GROUND_Y + 16, touch ? PROMPTS.sit.touch : PROMPTS.sit.keys, { backing: true })
      .setDepth(DEPTH.hud)
      .setAlpha(0);
    this.prompt.setInteractive({ useHandCursor: true });
    this.prompt.on('pointerdown', () => this.act());

    this.hint = uiText(this, this.camW / 2, VIEW_H - 14, touch ? PROMPTS.seat.touch : PROMPTS.seat.keys, {
      color: '#8b93a7',
    })
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
    if (atSeat && (input.up || input.enter)) {
      this.sit();
      return;
    }
    if (input.up) this.walker.jump();

    this.walker.update(input.dir, dt);
    this.prompt.setAlpha(Phaser.Math.Linear(this.prompt.alpha, atSeat ? 1 : 0, Math.min(1, dt * 8)));
    this.followCamera(dt);
  }

  private markInput(): void {
    if (this.hintDismissed) return;
    this.hintDismissed = true;
    this.tweens.add({ targets: this.hint, alpha: 0, duration: 450, delay: 1500 });
  }

  /** Tapping the prompt does whatever the prompt says. */
  private act(): void {
    if (this.phase === 'walking' && Math.abs(this.walker.x - SEAT_X) < SEAT_ZONE) this.sit();
    else if (this.phase === 'seated') this.jackIn();
  }

  private followCamera(dt: number): void {
    const target = Phaser.Math.Clamp(this.walker.x - this.camW * 0.4, 0, Math.max(0, ROOM_W - this.camW));
    this.camX = Phaser.Math.Linear(this.camX, target, Math.min(1, dt * 5));
    this.cameras.main.scrollX = Math.round(this.camX);
  }

  /* ---------------------------------------------------------- sequences -- */

  /** Turn away, step up to the desk, sit. */
  private sit(): void {
    this.phase = 'sitting';
    this.walker.freeze();
    playClick();
    const sprite = this.walker.sprite;
    sprite.setTint(0xffffff).setFlipX(false).setTexture('player-sit', 0);
    this.walker.reflection?.setVisible(false);
    this.tweens.add({ targets: [this.prompt, this.hint, this.marker], alpha: 0, duration: 180 });
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
        this.prompt
          .setText(touch ? PROMPTS.link.touch : PROMPTS.link.keys)
          .setPosition(SEAT_X, SCREEN.y - 14);
        this.tweens.add({ targets: this.prompt, alpha: 1, duration: 220 });
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
    this.tweens.add({ targets: this.prompt, alpha: 0, duration: 150 });

    this.add.rectangle(SEAT_X + 20, 185, 2, 1, C.lime).setOrigin(0, 0).setDepth(DEPTH.screens);
    addLight(this, SEAT_X + 21, 185, C.lime, 0.5, 0.2, 0.2, DEPTH.screenGlow);
    addLight(this, SEAT_X, SCREEN_CY, C.pale, 0.12, 0.7, 0.5, DEPTH.screenGlow);
    this.seatScreen = 'boot';
    this.drawScreens();

    const data: LinkSceneData = {
      reducedMotion: this.opts.reducedMotion,
      done: () => {
        const found = Number(this.registry.get('notesFound')) || 0;
        this.opts.onEnter({ notesFound: found, notesTotal: VOICE_NOTES.length });
      },
    };
    this.scene.launch('link', data);
  }

  /* ------------------------------------------------------------- screens -- */

  /** Every monitor, the TV and the seat's PC, redrawn at a retro frame rate. */
  private drawScreens(): void {
    const g = this.screens;
    g.clear();
    const t = this.clock;

    STATIONS.forEach((x, i) => {
      const r: Rect = { x: x + SCREEN.dx, y: SCREEN.y, w: SCREEN.w, h: SCREEN.h };
      if (x === SEAT_X) this.drawSeat(g, r, t);
      else this.drawGame(g, GAMES[i], r, t, i);
    });
    this.drawCricket(g, TV, t);
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
        g.fillStyle(C.pale).fillRect(x, y + h - 2, Math.round(((t * 2) % 10) / 10 * w), 1);
        break;
      }
    }
  }

  /** A cricket match on the TV, because of course there is. */
  private drawCricket(g: Phaser.GameObjects.Graphics, r: Rect, t: number): void {
    g.fillStyle(C.green).fillRect(r.x, r.y, r.w, r.h);
    g.fillStyle(C.greenDk).fillRect(r.x, r.y, r.w, 4);
    g.fillStyle(C.pitch).fillRect(r.x + r.w / 2 - 2, r.y + 6, 4, 12);
    const fielders: Array<[number, number]> = [[6, 8], [32, 9], [10, 17], [30, 18], [20, 5]];
    g.fillStyle(C.pale);
    for (const [fx, fy] of fielders) g.fillRect(r.x + fx + Math.round(Math.sin(t + fx) * 1), r.y + fy, 1, 2);
    const ball = (t * 0.8) % 1;
    g.fillStyle(0xff5f5f).fillRect(r.x + r.w / 2, Math.round(r.y + 6 + ball * 11), 1, 1);
    g.fillStyle(C.night0).fillRect(r.x, r.y + r.h - 4, r.w, 4);
    g.fillStyle(C.lime).fillRect(r.x + 2, r.y + r.h - 3, 8, 2);
    g.fillStyle(C.pale).fillRect(r.x + 12, r.y + r.h - 3, 12, 2);
  }
}
