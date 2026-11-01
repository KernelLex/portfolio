import Phaser from 'phaser';
import { introPalette } from '../../config';
import { playHorn } from '../../lib/sound';
import { addLight, colour } from './shared';

/**
 * Everything that moves through the city on its own: flying cars in the sky
 * lanes and hover cars (plus the odd old auto-rickshaw) on the road.
 *
 * Each lane has its own parallax, so far lanes drift and near lanes rush. A
 * vehicle spawns just outside the visible stretch of its lane and is removed
 * once it leaves the other side.
 */

export type LaneSpec = {
  /** Screen y of the vehicle's bottom edge. */
  y: number;
  parallax: number;
  dir: 1 | -1;
  speed: [number, number];
  /** Seconds between vehicles. */
  every: [number, number];
  depth: number;
  /** What can appear in this lane: a texture and how many frames it has. */
  kinds: ReadonlyArray<{ texture: string; frame: number; anim?: string }>;
  /** Headlights, tail-light trail, reflection in the wet road. */
  lights: 'far' | 'sky' | 'road';
  reflectY?: number;
};

type Vehicle = {
  sprite: Phaser.GameObjects.Sprite;
  head: Phaser.GameObjects.Image;
  tail: Phaser.GameObjects.Image;
  trail: Phaser.GameObjects.Image;
  beam?: Phaser.GameObjects.Image;
  siren?: [Phaser.GameObjects.Image, Phaser.GameObjects.Image];
  mirror?: Phaser.GameObjects.Sprite;
  speed: number;
};

type Lane = LaneSpec & { wait: number; live: Vehicle[] };

const WARM = 0xffe9a8;

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

  update(dt: number, scrollX: number): void {
    this.clock += dt;
    for (const lane of this.lanes) {
      lane.wait -= dt;
      if (lane.wait <= 0) {
        this.spawn(lane, scrollX);
        lane.wait = Phaser.Math.FloatBetween(lane.every[0], lane.every[1]);
      }
      const left = scrollX * lane.parallax;
      lane.live = lane.live.filter((v) => {
        v.sprite.x += lane.dir * v.speed * dt;
        this.dress(lane, v);
        const gone = lane.dir > 0 ? v.sprite.x - v.sprite.width > left + this.viewWidth : v.sprite.x + v.sprite.width < left;
        if (gone) this.remove(v);
        return !gone;
      });
    }
  }

  private spawn(lane: Lane, scrollX: number): void {
    const kind = Phaser.Utils.Array.GetRandom(lane.kinds as Lane['kinds'][number][]);
    const left = scrollX * lane.parallax;
    const s = this.scene;
    const sprite = s.add
      .sprite(0, lane.y, kind.texture, kind.frame)
      .setOrigin(0.5, 1)
      .setScrollFactor(lane.parallax)
      .setFlipX(lane.dir < 0) // all art faces right
      .setDepth(lane.depth);
    sprite.x = lane.dir > 0 ? left - sprite.width : left + this.viewWidth + sprite.width;
    if (kind.anim && s.anims.exists(kind.anim)) sprite.play(kind.anim);

    const light = (color: number, alpha: number, sx: number, sy: number, depth = lane.depth + 0.05) =>
      addLight(s, 0, 0, color, alpha, sx, sy, depth).setScrollFactor(lane.parallax);
    const far = lane.lights === 'far';
    const v: Vehicle = {
      sprite,
      head: light(WARM, far ? 0.5 : 0.55, far ? 0.12 : 0.5, far ? 0.12 : 0.3),
      tail: light(colour(introPalette.magenta), far ? 0.5 : 0.45, far ? 0.1 : 0.28, far ? 0.1 : 0.22),
      trail: light(colour(introPalette.magenta), far ? 0.12 : 0.16, far ? 0.6 : 1.4, far ? 0.06 : 0.12, lane.depth - 0.05),
      speed: Phaser.Math.FloatBetween(lane.speed[0], lane.speed[1]),
    };
    if (lane.lights === 'road') {
      v.beam = light(WARM, 0.22, 2.4, 0.32, 6);
      v.mirror = s.add
        .sprite(sprite.x, lane.reflectY ?? lane.y + 1, kind.texture, kind.frame)
        .setOrigin(0.5, 0)
        .setFlip(lane.dir < 0, true)
        .setAlpha(0.16)
        .setTint(0x7fa8e0)
        .setDepth(5);
      if (kind.anim && s.anims.exists(kind.anim)) v.mirror.play(kind.anim);
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
    const { sprite } = v;
    const half = sprite.width / 2;
    const front = sprite.x + lane.dir * (half - 2);
    const back = sprite.x - lane.dir * (half - 2);
    const midY = sprite.y - sprite.height * 0.45;
    v.head.setPosition(front, midY);
    v.tail.setPosition(back, midY);
    v.trail.setPosition(back - lane.dir * half * 0.9, midY);
    v.beam?.setPosition(front + lane.dir * 46, lane.y - 2);
    if (v.mirror) v.mirror.x = sprite.x;
    if (v.siren) {
      const on = Math.floor(this.clock * 6) % 2 === 0;
      v.siren[0].setPosition(sprite.x - 3, sprite.y - sprite.height + 1).setAlpha(on ? 0.7 : 0);
      v.siren[1].setPosition(sprite.x + 3, sprite.y - sprite.height + 1).setAlpha(on ? 0 : 0.7);
    }
  }

  private remove(v: Vehicle): void {
    for (const o of [v.sprite, v.head, v.tail, v.trail, v.beam, v.mirror, ...(v.siren ?? [])]) o?.destroy();
  }
}

/** The lanes the street uses, back to front. */
export const STREET_LANES = (depths: { far: number; sky: number; road: number }): LaneSpec[] => {
  const far = [0, 1, 2].map((frame) => ({ texture: 'flyers-far', frame }));
  const sky = [0, 1, 2].map((frame) => ({ texture: 'flyers', frame }));
  const road = [0, 1, 2].map((frame) => ({ texture: 'traffic', frame }));
  return [
    { y: 36, parallax: 0.3, dir: 1, speed: [30, 48], every: [1.6, 3.4], depth: depths.far, kinds: far, lights: 'far' },
    { y: 52, parallax: 0.3, dir: -1, speed: [34, 52], every: [1.8, 3.8], depth: depths.far, kinds: far, lights: 'far' },
    { y: 40, parallax: 0.65, dir: -1, speed: [80, 120], every: [3.2, 6], depth: depths.sky, kinds: sky, lights: 'sky' },
    { y: 58, parallax: 0.65, dir: 1, speed: [70, 110], every: [3.6, 6.5], depth: depths.sky, kinds: sky, lights: 'sky' },
    { y: 238, parallax: 1, dir: 1, speed: [150, 210], every: [3, 6.5], depth: depths.road, kinds: road, lights: 'road', reflectY: 239 },
    {
      y: 262,
      parallax: 1,
      dir: -1,
      speed: [160, 220],
      every: [3.5, 7],
      depth: depths.road + 0.4,
      kinds: [...road, { texture: 'rickshaw', frame: 0, anim: 'rickshaw-roll' }],
      lights: 'road',
      reflectY: 263,
    },
  ];
};

