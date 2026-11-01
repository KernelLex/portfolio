import Phaser from 'phaser';

/** Shorter than this, a touch counts as a tap (jump) rather than a hold (walk). */
const TAP_MS = 200;

export type InputFrame = {
  /** Horizontal intent: -1 left, 0 none, 1 right. */
  dir: -1 | 0 | 1;
  /** ^ / W / Space / a tap - a jump in the open, the action at a door or seat. */
  up: boolean;
  /** Enter - only ever the action. */
  enter: boolean;
  /** Anything at all this frame; drives the idle timers. */
  active: boolean;
};

type Keys = Record<'left' | 'right' | 'a' | 'd', Phaser.Input.Keyboard.Key>;

const UP_CODES = new Set(['ArrowUp', 'KeyW', 'Space']);
const ENTER_CODES = new Set(['Enter', 'NumpadEnter']);

/**
 * Keyboard and touch, read once per frame.
 *
 * Touch: hold anywhere to walk, a quick tap to jump. A touch that lands on an
 * interactive object (a prompt) belongs to that object and is ignored here.
 */
export class Controls {
  private keys: Keys | null = null;
  private holding = false;
  private pressedAt = 0;
  private tapped = false;
  private upQueued = false;
  private enterQueued = false;

  constructor(scene: Phaser.Scene) {
    const kb = scene.input.keyboard;
    if (kb) {
      const K = Phaser.Input.Keyboard.KeyCodes;
      // Walking is a hold, so polling is right for it.
      this.keys = kb.addKeys({ left: K.LEFT, right: K.RIGHT, a: K.A, d: K.D }) as Keys;
      // Actions are taps, and polling loses a tap that goes down and up inside
      // one frame (Phaser clears "just pressed" on key-up). Queue them from
      // the events instead, so no press can fall between frames.
      kb.on('keydown', (e: KeyboardEvent) => {
        if (e.repeat) return;
        if (UP_CODES.has(e.code)) this.upQueued = true;
        if (ENTER_CODES.has(e.code)) this.enterQueued = true;
      });
      // Arrows and space would otherwise scroll the page behind the canvas.
      kb.addCapture([K.LEFT, K.RIGHT, K.UP, K.DOWN, K.SPACE]);
    }

    scene.input.on('pointerdown', (_p: Phaser.Input.Pointer, over: unknown[]) => {
      if (over.length) return;
      this.holding = true;
      this.pressedAt = scene.time.now;
    });
    scene.input.on('pointerup', () => {
      if (this.holding && scene.time.now - this.pressedAt < TAP_MS) this.tapped = true;
      this.holding = false;
    });
    scene.input.on('gameout', () => {
      this.holding = false;
    });
  }

  read(): InputFrame {
    const k = this.keys;
    const right = this.holding || (k !== null && (k.right.isDown || k.d.isDown));
    const left = k !== null && (k.left.isDown || k.a.isDown);
    const dir: InputFrame['dir'] = right ? 1 : left ? -1 : 0;

    const up = this.upQueued || this.tapped;
    const enter = this.enterQueued;
    this.upQueued = false;
    this.enterQueued = false;
    this.tapped = false;

    return { dir, up, enter, active: dir !== 0 || up || enter || this.holding };
  }
}
