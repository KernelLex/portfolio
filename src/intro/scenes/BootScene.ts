import Phaser from 'phaser';
import { ensureFallbacks, loadIntroAssets } from './shared';

/** Where a run of the intro begins, and which voice notes were already found. */
export type IntroStart = {
  scene: 'street' | 'cafe';
  taken: ReadonlyArray<number>;
};

/**
 * Loads everything once, then starts the street - or, after logging off the
 * cafe PC, the cafe with the player still in their seat.
 */
export class BootScene extends Phaser.Scene {
  constructor(
    private start: IntroStart,
    private onReady: () => void,
  ) {
    super('boot');
  }

  preload(): void {
    loadIntroAssets(this);
  }

  create(): void {
    ensureFallbacks(this);
    this.registry.set('notesTaken', [...this.start.taken]);
    this.onReady();
    this.scene.start(this.start.scene, { entry: this.start.scene === 'cafe' ? 'pc' : 'start' });
  }
}
