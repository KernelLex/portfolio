import Phaser from 'phaser';
import { introPalette } from '../../config';
import { playHorn } from '../../lib/sound';
import { addLight, colour } from './shared';

/**
 * Everything that moves through the city on its own: flying cars in the sky
 * lanes, hover cars, bikes, vans and the night bus (plus the odd old
 * auto-rickshaw) on the road, and people on the pavement behind the player.
 *
 * Each lane has its own parallax, so far lanes drift and near lanes rush. A
 * vehicle spawns just outside the visible stretch of its lane and is removed
 * once it leaves the other side.
 */

type Kind = {
  texture: string;
  frame: number;
  anim?: string;
  /** The light someone carries: an umbrella rim, a mask, a screen. */
  glow?: number;
  /** Where that light sits, down from the top of the sprite. */
  glowY?: number;
  /** Umbrellas throw a wide pool; masks and screens a small one. */
  glowWide?: boolean;
  /** Body length when it is shorter than the frame (a bike in a car cell). */
  length?: number;
  /** Multiplies the lane's speed: the bus lumbers, the bike flies. */
  pace?: number;
};

export type LaneSpec = {
  /** Screen y of the vehicle's bottom edge. */
  y: number;
  parallax: number;
  dir: 1 | -1;
  speed: [number, number];
  /** Seconds between vehicles. */
  every: [number, number];
  depth: number;
  kinds: ReadonlyArray<Kind>;
  /** Headlights and tail-light trail (plus a road reflection), or a person's own light. */
  lights: 'far' | 'sky' | 'road' | 'people';
  reflectY?: number;
};

type Vehicle = {
  kind: Kind;
  sprite: Phaser.GameObjects.Sprite;
  head?: Phaser.GameObjects.Image;
  tail?: Phaser.GameObjects.Image;
  trail?: Phaser.GameObjects.Image;
  carried?: Phaser.GameObjects.Image;
  beam?: Phaser.GameObjects.Image;
  siren?: [Phaser.GameObjects.Image, Phaser.GameObjects.Image];
  mirror?: Phaser.GameObjects.Sprite;
  speed: number;
  /** People only: how long they have stood waiting for the player to move. */
  waited: number;
  /** People only: gave up waiting and are walking on past behind the player. */
  passing: boolean;
};

type Lane = LaneSpec & { wait: number; live: Vehicle[]; last?: Kind };

const WARM = 0xffe9a8;

/**
 * People slow down as they come up behind the player and stop short rather
 * than walk through them, then carry on past if the player stays put.
 */
const YIELD = { stop: 26, ease: 20, patience: 1.4 };
/** People are further back than the player, so slightly dimmer. */
const PEOPLE_TINT = 0xc4c8dc;

export class Traffic {
  private lanes: Lane[];
  private clock = 0;

  constructor(
    private scene: Phaser.Scene,
    specs: ReadonlyArray<LaneSpec>,
    private viewWidth: number,
  ) {
    // Stagger the first arrivals so the sky is not empty at the start.
    this.lanes = specs.map((s, i) => ({ ...s, wait: 0.4 + i * 0.7, live: [] }));
  }

  /** `playerX` lets the people on the pavement give the player room. */
  update(dt: number, scrollX: number, playerX?: number): void {
    this.clock += dt;
    for (const lane of this.lanes) {
      lane.wait -= dt;
      if (lane.wait <= 0) {
        this.spawn(lane, scrollX);
        lane.wait = Phaser.Math.FloatBetween(lane.every[0], lane.every[1]);
      }
      const left = scrollX * lane.parallax;
      lane.live = lane.live.filter((v) => {
        const pace = lane.lights === 'people' ? this.yieldTo(lane, v, playerX, dt) : 1;
        v.sprite.x += lane.dir * v.speed * pace * dt;
        this.dress(lane, v);
        const gone = lane.dir > 0 ? v.sprite.x - v.sprite.width > left + this.viewWidth : v.sprite.x + v.sprite.width < left;
        if (gone) this.remove(v);
        return !gone;
      });
    }
  }

  /** 1 at full stride, easing to 0 just short of the player; the walk cycle follows. */
  private yieldTo(lane: Lane, v: Vehicle, playerX: number | undefined, dt: number): number {
    const ahead = playerX === undefined ? 0 : (playerX - v.sprite.x) * lane.dir;
    let pace = 1;
    if (!v.passing && ahead > 0) {
      pace = Phaser.Math.Clamp((ahead - YIELD.stop) / YIELD.ease, 0, 1);
      if (pace < 0.05) {
        v.waited += dt;
        if (v.waited > YIELD.patience) v.passing = true;
      }
    }
    const anims = v.sprite.anims;
    if (pace < 0.05) {
      if (anims.isPlaying) anims.pause();
      // the standing pose, not whatever stride they froze in
      v.sprite.setFrame(v.kind.frame + 1);
    } else {
      if (anims.isPaused) anims.resume();
      anims.timeScale = pace;
    }
    return pace;
  }

  private spawn(lane: Lane, scrollX: number): void {
    // Never the same thing twice in a row: two identical couriers read as clones.
    const options = lane.kinds.length > 1 ? lane.kinds.filter((k) => k !== lane.last) : lane.kinds;
    const kind = Phaser.Utils.Array.GetRandom(options as Kind[]);
    lane.last = kind;
    const left = scrollX * lane.parallax;
    const s = this.scene;
    const sprite = s.add
      .sprite(0, lane.y, kind.texture, kind.frame)
      .setOrigin(0.5, 1)
      .setScrollFactor(lane.parallax)
      .setFlipX(lane.dir < 0) // all art faces right
      .setDepth(lane.depth);
    sprite.x = lane.dir > 0 ? left - sprite.width : left + this.viewWidth + sprite.width;
    const anim = kind.anim ? s.anims.get(kind.anim) : undefined;
    // Out of step with each other; the start frame must exist in this
    // animation (the rickshaw has two), or Phaser throws and the loop dies.
    if (anim) sprite.play({ key: anim.key, startFrame: Phaser.Math.Between(0, anim.frames.length - 1) });

    const light = (color: number, alpha: number, sx: number, sy: number, depth = lane.depth + 0.05) =>
      addLight(s, 0, 0, color, alpha, sx, sy, depth).setScrollFactor(lane.parallax);
    const far = lane.lights === 'far';
    const speed = Phaser.Math.FloatBetween(lane.speed[0], lane.speed[1]) * (kind.pace ?? 1);
    const base = { kind, sprite, speed, waited: 0, passing: false };
    let v: Vehicle;
    if (lane.lights === 'people') {
      sprite.setTint(PEOPLE_TINT);
      const wide = kind.glowWide ?? false;
      v = { ...base, carried: light(kind.glow ?? WARM, wide ? 0.3 : 0.35, wide ? 0.5 : 0.18, wide ? 0.22 : 0.18) };
    } else {
      v = {
        ...base,
        head: light(WARM, far ? 0.5 : 0.55, far ? 0.12 : 0.5, far ? 0.12 : 0.3),
        tail: light(colour(introPalette.magenta), far ? 0.5 : 0.45, far ? 0.1 : 0.28, far ? 0.1 : 0.22),
        trail: light(colour(introPalette.magenta), far ? 0.12 : 0.16, far ? 0.6 : 1.4, far ? 0.06 : 0.12, lane.depth - 0.05),
      };
    }
    if (lane.lights === 'road') {
      v.beam = light(WARM, 0.22, 2.4, 0.32, 6);
      v.mirror = s.add
        .sprite(sprite.x, lane.reflectY ?? lane.y + 1, kind.texture, kind.frame)
        .setOrigin(0.5, 0)
        .setFlip(lane.dir < 0, true)
        .setAlpha(0.16)
        .setTint(0x7fa8e0)
        .setDepth(5);
      if (anim) v.mirror.play(anim.key);
    }
    // The police spinner (frame 2 of either flyer sheet) flashes red and blue.
    if (kind.frame === 2 && kind.texture.startsWith('flyers')) {
      const size = far ? 0.12 : 0.3;
      v.siren = [light(colour(introPalette.magenta), 0, size, size), light(0x4d7dff, 0, size, size)];
    }
    if (kind.texture === 'rickshaw') playHorn();
    lane.live.push(v);
    this.dress(lane, v);
  }

  /** Lights, trail, reflection and siren follow the body. */
  private dress(lane: Lane, v: Vehicle): void {
    const { sprite, kind } = v;
    const half = (kind.length ?? sprite.width) / 2;
    const front = sprite.x + lane.dir * (half - 2);
    const back = sprite.x - lane.dir * (half - 2);
    const midY = sprite.y - sprite.height * 0.45;
    v.head?.setPosition(front, midY);
    v.tail?.setPosition(back, midY);
    v.trail?.setPosition(back - lane.dir * half * 0.9, midY);
    v.carried?.setPosition(sprite.x, sprite.y - sprite.height + (kind.glowY ?? 8));
    v.beam?.setPosition(front + lane.dir * 46, lane.y - 2);
    if (v.mirror) v.mirror.x = sprite.x;
    if (v.siren) {
      const on = Math.floor(this.clock * 6) % 2 === 0;
      v.siren[0].setPosition(sprite.x - 3, sprite.y - sprite.height + 1).setAlpha(on ? 0.7 : 0);
      v.siren[1].setPosition(sprite.x + 3, sprite.y - sprite.height + 1).setAlpha(on ? 0 : 0.7);
    }
  }

  private remove(v: Vehicle): void {
    for (const o of [v.sprite, v.head, v.tail, v.trail, v.carried, v.beam, v.mirror, ...(v.siren ?? [])]) o?.destroy();
  }
}

/** Mirrors scripts/art/city.mjs: seven kinds of people, four walk frames each. */
const PEOPLE: ReadonlyArray<Omit<Kind, 'texture' | 'frame' | 'anim'>> = [
  { glow: colour(introPalette.cyan), glowY: 8, glowWide: true },
  { glow: colour(introPalette.magenta), glowY: 8, glowWide: true },
  { glow: colour(introPalette.lime), glowY: 10 },
  { glow: colour(introPalette.accent), glowY: 19 },
  { glow: colour(introPalette.cyan), glowY: 9 },
  { glow: colour(introPalette.cyan), glowY: 20 },
  { glow: colour(introPalette.cyan), glowY: 33, pace: 0.8 },
];
export const PEOPLE_KINDS = PEOPLE.length;
const PED_FRAMES = 4;

/** Where the people walk: the back of the pavement, behind the player's feet. */
const PAVEMENT_BACK = 203;

/** The lanes the street uses, back to front. */
export const STREET_LANES = (depths: { far: number; sky: number; road: number; pavement: number }): LaneSpec[] => {
  const far = [0, 1, 2].map((frame) => ({ texture: 'flyers-far', frame }));
  const sky = [0, 1, 2, 3, 4].map((frame) => ({ texture: 'flyers', frame }));
  const road: Kind[] = [
    ...[0, 1, 2, 4, 5].map((frame) => ({ texture: 'traffic', frame })),
    { texture: 'traffic', frame: 3, length: 48, pace: 1.2 },
  ];
  const bus: Kind = { texture: 'bus', frame: 0, pace: 0.65 };
  const people: Kind[] = PEOPLE.map((p, k) => ({ ...p, texture: 'pedestrians', frame: k * PED_FRAMES, anim: `ped-${k}` }));
  return [
    { y: PAVEMENT_BACK, parallax: 1, dir: -1, speed: [24, 32], every: [6, 11], depth: depths.pavement, kinds: people, lights: 'people' },
    { y: PAVEMENT_BACK, parallax: 1, dir: 1, speed: [22, 30], every: [7, 12], depth: depths.pavement, kinds: people.slice().reverse(), lights: 'people' },
    { y: 36, parallax: 0.3, dir: 1, speed: [30, 48], every: [1.6, 3.4], depth: depths.far, kinds: far, lights: 'far' },
    { y: 52, parallax: 0.3, dir: -1, speed: [34, 52], every: [1.8, 3.8], depth: depths.far, kinds: far, lights: 'far' },
    { y: 40, parallax: 0.65, dir: -1, speed: [80, 120], every: [3, 5.5], depth: depths.sky, kinds: sky, lights: 'sky' },
    { y: 58, parallax: 0.65, dir: 1, speed: [70, 110], every: [3.2, 6], depth: depths.sky, kinds: sky, lights: 'sky' },
    {
      y: 238,
      parallax: 1,
      dir: 1,
      speed: [150, 210],
      every: [2.6, 5.5],
      depth: depths.road,
      kinds: [...road, bus],
      lights: 'road',
      reflectY: 239,
    },
    {
      y: 262,
      parallax: 1,
      dir: -1,
      speed: [160, 220],
      every: [3, 6],
      depth: depths.road + 0.4,
      kinds: [...road, { texture: 'rickshaw', frame: 0, anim: 'rickshaw-roll' }],
      lights: 'road',
      reflectY: 263,
    },
  ];
};
