import Phaser from 'phaser';
import { playJump } from '../../lib/sound';
import { ADD } from './shared';

/**
 * Movement. Speed and stride are locked together: the walk sheet covers
 * STRIDE_PER_CYCLE pixels of ground per loop, so playing it at
 * (speed / STRIDE_PER_CYCLE) loops per second is the only rate at which the
 * feet do not skate. WALK_FPS is that rate at full speed; the animation's
 * timeScale follows the live speed for everything in between.
 */
export const PLAYER_SPEED = 88;
const PLAYER_ACCEL = 420;
const PLAYER_FRICTION = 620;
const STRIDE_PER_CYCLE = 32; // must match STEP * 4 in scripts/art/characters.mjs
const WALK_FRAMES = 8;
const WALK_FPS = (PLAYER_SPEED / STRIDE_PER_CYCLE) * WALK_FRAMES;
/** Below this the walk reads as a shuffle, so switch to the idle breath. */
const MOVING_THRESHOLD = 5;

/** A ~29px hop with ~0.6s of air - enough to reach the high voice notes. */
const JUMP_VELOCITY = 190;
const GRAVITY = 620;

export const PLAYER_HEIGHT = 44;

export type WalkerOptions = {
  x: number;
  groundY: number;
  minX: number;
  maxX: number;
  depth: number;
  /** Mirror image in a wet or polished floor. */
  reflection: { alpha: number; tint: number } | null;
  /** Kick up water on footfalls and landings. */
  splashes: boolean;
};

function ensureAnims(scene: Phaser.Scene): void {
  const anims = scene.anims;
  if (!anims.exists('walk') && scene.textures.get('player-walk').frameTotal > WALK_FRAMES) {
    anims.create({
      key: 'walk',
      frames: anims.generateFrameNumbers('player-walk', { start: 0, end: WALK_FRAMES - 1 }),
      frameRate: WALK_FPS,
      repeat: -1,
    });
  }
  if (!anims.exists('idle') && scene.textures.get('player-idle').frameTotal > 4) {
    anims.create({
      key: 'idle',
      frames: anims.generateFrameNumbers('player-idle', { start: 0, end: 3 }),
      frameRate: 4,
      repeat: -1,
    });
  }
}

/**
 * The player: sprite, shadow, mirror image and splashes, with weighted
 * walking and a jump. Scenes feed it intent; it owns the physics and the
 * animation.
 */
export class Walker {
  readonly sprite: Phaser.GameObjects.Sprite;
  readonly shadow: Phaser.GameObjects.Ellipse;
  readonly reflection: Phaser.GameObjects.Sprite | null;
  private splash: Phaser.GameObjects.Particles.ParticleEmitter | null = null;

  velocity = 0;
  private vy = 0;
  private height = 0;
  private frozen = false;
  private lastFootFrame = -1;

  constructor(
    private scene: Phaser.Scene,
    private opts: WalkerOptions,
  ) {
    ensureAnims(scene);

    this.reflection = opts.reflection
      ? scene.add
          .sprite(opts.x, opts.groundY + 1, 'player-idle')
          .setOrigin(0.5, 0)
          .setFlipY(true)
          .setAlpha(opts.reflection.alpha)
          .setTint(opts.reflection.tint)
          .setDepth(opts.depth - 2)
      : null;

    this.shadow = scene.add
      .ellipse(opts.x, opts.groundY - 1, 20, 5, 0x000000, 0.4)
      .setDepth(opts.depth - 1);

    this.sprite = scene.add.sprite(opts.x, opts.groundY, 'player-idle').setOrigin(0.5, 1).setDepth(opts.depth);
    if (scene.anims.exists('idle')) this.sprite.play('idle');

    if (opts.splashes) {
      this.splash = scene.add
        .particles(0, 0, 'rain-drop', {
          lifespan: 320,
          speedY: { min: -60, max: -25 },
          speedX: { min: -30, max: 30 },
          gravityY: 340,
          scaleX: 1,
          scaleY: { start: 0.4, end: 0.1 },
          alpha: { start: 0.45, end: 0 },
          blendMode: ADD,
          emitting: false,
        })
        .setDepth(opts.depth - 1);
    }
  }

  get x(): number {
    return this.sprite.x;
  }

  get airborne(): boolean {
    return this.height > 0;
  }

  /** Vertical extent of the body this frame, for pickups. */
  bodySpan(): { top: number; bottom: number } {
    const bottom = this.opts.groundY - this.height;
    return { top: bottom - PLAYER_HEIGHT, bottom };
  }

  setBounds(minX: number, maxX: number): void {
    this.opts.minX = minX;
    this.opts.maxX = maxX;
  }

  jump(): void {
    if (this.frozen || this.height > 0) return;
    this.vy = JUMP_VELOCITY;
    this.height = 0.01;
    playJump();
  }

  /** Hand the sprite to a scripted sequence: no physics, no animation. */
  freeze(): void {
    this.frozen = true;
    this.velocity = 0;
    this.sprite.anims.stop();
  }

  /** Hand control back after a scripted sequence. */
  unfreeze(): void {
    this.frozen = false;
  }

  /** During a scripted move: walk at full pace, facing `dir`. */
  stride(dir: -1 | 1): void {
    this.sprite.setFlipX(dir < 0);
    if (this.scene.anims.exists('walk')) this.sprite.play('walk', true);
    this.sprite.anims.timeScale = 1;
  }

  /** During a scripted move: stand on the idle breath. */
  rest(): void {
    this.play('idle');
    this.sprite.anims.timeScale = 1;
  }

  /** Keep the shadow and mirror image in step with a scripted move. */
  syncDressing(): void {
    this.dress();
  }

  update(dir: number, dt: number): void {
    if (this.frozen) return;

    if (dir !== 0) {
      this.velocity = Phaser.Math.Clamp(
        this.velocity + dir * PLAYER_ACCEL * dt,
        -PLAYER_SPEED,
        PLAYER_SPEED,
      );
    } else {
      const drop = PLAYER_FRICTION * dt;
      this.velocity =
        Math.abs(this.velocity) <= drop ? 0 : this.velocity - Math.sign(this.velocity) * drop;
    }

    if (this.velocity !== 0) {
      const next = this.sprite.x + this.velocity * dt;
      this.sprite.x = Phaser.Math.Clamp(next, this.opts.minX, this.opts.maxX);
      // Walking into either end should stop, not grind at full speed.
      if (this.sprite.x !== next) this.velocity = 0;
    }

    if (this.height > 0) {
      this.vy -= GRAVITY * dt;
      this.height += this.vy * dt;
      if (this.height <= 0) this.land();
    }
    this.sprite.y = this.opts.groundY - this.height;

    this.animate();
    this.dress();
  }

  private land(): void {
    this.height = 0;
    this.vy = 0;
    // A touch of squash sells the weight of the landing.
    this.scene.tweens.add({
      targets: this.sprite,
      scaleX: { from: 1.12, to: 1 },
      scaleY: { from: 0.88, to: 1 },
      duration: 160,
      ease: 'Quad.easeOut',
    });
    this.splash?.explode(6, this.sprite.x, this.opts.groundY - 1);
  }

  /**
   * Playback rate tracks ground speed, so one loop of the cycle always covers
   * exactly STRIDE_PER_CYCLE pixels however fast the player is going.
   */
  private animate(): void {
    const anims = this.sprite.anims;
    const speed = Math.abs(this.velocity);
    if (speed > MOVING_THRESHOLD) this.sprite.setFlipX(this.velocity < 0);

    if (this.height > 0) {
      anims.stop();
      this.sprite.setTexture('player-jump', this.vy > 0 ? 0 : 1);
      return;
    }

    if (speed > MOVING_THRESHOLD) {
      if (!anims.isPlaying || anims.currentAnim?.key !== 'walk') this.play('walk');
      anims.timeScale = speed / PLAYER_SPEED;
      this.splashOnFootfall();
      return;
    }

    if (!anims.isPlaying || anims.currentAnim?.key !== 'idle') {
      this.play('idle');
      this.lastFootFrame = -1;
    }
    anims.timeScale = 1;
  }

  private play(key: string): void {
    if (this.scene.anims.exists(key)) this.sprite.play(key);
  }

  /** Water kicked up on the two contact frames of the walk cycle. */
  private splashOnFootfall(): void {
    if (!this.splash) return;
    const frame = Number(this.sprite.frame.name);
    if (Number.isNaN(frame)) return;
    if ((frame === 0 || frame === 4) && frame !== this.lastFootFrame) {
      this.splash.explode(3, this.sprite.x, this.opts.groundY - 1);
    }
    this.lastFootFrame = frame;
  }

  /** Shadow and mirror image track the sprite every frame. */
  private dress(): void {
    const lift = Phaser.Math.Clamp(this.height / 30, 0, 1);
    this.shadow.x = this.sprite.x;
    this.shadow.setScale(1 - lift * 0.4);
    this.shadow.setAlpha(1 - lift * 0.5);

    const ref = this.reflection;
    if (!ref) return;
    ref.setTexture(this.sprite.texture.key, this.sprite.frame.name);
    ref.setFlipY(true);
    ref.setFlipX(this.sprite.flipX);
    ref.setScale(this.sprite.scaleX, this.sprite.scaleY);
    ref.x = this.sprite.x;
    ref.y = this.opts.groundY + 1 + this.height;
  }
}
