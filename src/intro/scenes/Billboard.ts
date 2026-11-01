import Phaser from 'phaser';
import { introPalette } from '../../config';
import { BILLBOARD } from '../../content/intro';
import { ADD, PIXEL_FONT, SIGN_FONT, addLight, colour } from './shared';

/** The LED face inside billboard.png (see scripts/art/street.mjs). */
const FACE = { x: 6, y: 6, w: 116, h: 47 };
const ART_W = 128;
const ART_H = 90;
const BULB_XS = Array.from({ length: 19 }, (_, i) => 8 + i * 6);

const BARS = 22;
const BAR_W = 3;
const BAR_GAP = 2;

type Mode = 'wave' | 'type' | 'brand';
const SEQUENCE: ReadonlyArray<{ mode: Mode; ms: number }> = [
  { mode: 'wave', ms: 3400 },
  { mode: 'type', ms: 3800 },
  { mode: 'brand', ms: 3200 },
];
const GLITCH_MS = 170;
/** The two dictation lines: a headline, then small print. */
const LINE_FONTS = [PIXEL_FONT, SIGN_FONT];
const CURSOR_H = [7, 6];

export type BillboardOptions = {
  /** Column of buildings.png the billboard stands on. */
  textureColumn: number;
  /** Screen y of that building's roof. */
  roofY: number;
  depth: number;
  reducedMotion: boolean;
};

/**
 * Rooftop LED billboard for the challenge's host: a voice waveform, a line
 * of dictation typing itself out, then the name. It rides the mid-building
 * parallax layer, so the scene passes it the layer's offset each frame
 * instead of letting the camera move it - that keeps it locked to its roof.
 */
export class Billboard {
  private root: Phaser.GameObjects.Container;
  private face: Phaser.GameObjects.Container;
  private bars: Phaser.GameObjects.Graphics;
  private listening: Phaser.GameObjects.Text;
  private dot: Phaser.GameObjects.Rectangle;
  private lines: Phaser.GameObjects.Text[];
  private cursor: Phaser.GameObjects.Rectangle;
  private brand: Phaser.GameObjects.Text;
  private tagline: Phaser.GameObjects.Text;
  private shine: Phaser.GameObjects.Rectangle;
  private bulbs: Phaser.GameObjects.Rectangle[];
  private halo: Phaser.GameObjects.Image;

  private step = 0;
  private stepTime = 0;
  private clock = 0;
  private bulbTick = 0;
  private bulbPhase = 0;

  constructor(
    scene: Phaser.Scene,
    private opts: BillboardOptions,
  ) {
    const amber = colour(introPalette.accent);
    const cyan = colour(introPalette.cyan);
    const local = (x: number, y: number) => ({ x: FACE.x + x, y: FACE.y + y });

    // Face content lives in its own container so a glitch can jolt it alone.
    this.bars = scene.add.graphics();

    const top = local(FACE.w / 2, 5);
    this.listening = scene.add
      .text(top.x + 4, top.y, BILLBOARD.listening, { fontFamily: SIGN_FONT, fontSize: '8px', color: '#e9ebf2' })
      .setOrigin(0.5, 0)
      .setResolution(2);
    this.dot = scene.add.rectangle(top.x - this.listening.width / 2 - 2, top.y + 2.5, 3, 3, colour(introPalette.magenta));

    this.lines = BILLBOARD.dictation.map((line, i) =>
      scene.add
        .text(local(8, 0).x, local(0, i === 0 ? 12 : 28).y, line, {
          fontFamily: LINE_FONTS[i],
          fontSize: '8px',
          color: i === 0 ? introPalette.accent : '#e9ebf2',
        })
        .setResolution(2),
    );
    this.cursor = scene.add.rectangle(0, 0, 4, 7, amber).setOrigin(0, 0);

    const mid = local(FACE.w / 2, FACE.h / 2);
    this.brand = scene.add
      .text(mid.x, mid.y - 5, BILLBOARD.brand, { fontFamily: PIXEL_FONT, fontSize: '10px', color: introPalette.accent })
      .setOrigin(0.5)
      .setShadow(0, 0, introPalette.accent, 4, false, true)
      .setResolution(2);
    this.tagline = scene.add
      .text(mid.x, mid.y + 11, BILLBOARD.tagline, { fontFamily: SIGN_FONT, fontSize: '8px', color: '#8b93a7' })
      .setOrigin(0.5)
      .setResolution(2);
    this.shine = scene.add
      .rectangle(FACE.x, FACE.y, 5, FACE.h, 0xffffff, 0.35)
      .setOrigin(0, 0)
      .setBlendMode(ADD);

    this.face = scene.add.container(0, 0, [
      this.bars,
      this.dot,
      this.listening,
      ...this.lines,
      this.cursor,
      this.brand,
      this.tagline,
      this.shine,
    ]);

    // LED pitch laid over the content, so text reads as lit diodes.
    if (!scene.textures.exists('led-grid')) {
      const g = scene.make.graphics({ x: 0, y: 0 }, false);
      g.fillStyle(0x000000, 0.55).fillRect(1, 0, 1, 2).fillRect(0, 1, 1, 1);
      g.generateTexture('led-grid', 2, 2);
      g.destroy();
    }
    const grid = scene.add.tileSprite(FACE.x, FACE.y, FACE.w, FACE.h, 'led-grid').setOrigin(0, 0);

    this.bulbs = BULB_XS.map((x) => scene.add.rectangle(x, 0, 2, 2, amber).setOrigin(0, 0));

    // Two lamps on the catwalk wash the face from below; a halo sits behind.
    this.halo = addLight(scene, ART_W / 2, 30, amber, 0.18, 3.2, 1.4, 0);
    const lamps = [21, 107].map((x) => addLight(scene, x, 40, 0xffe2b8, 0.12, 0.7, 1.3, 0));
    const frame = scene.add.image(0, 0, 'billboard').setOrigin(0, 0);
    const cyanEdge = addLight(scene, ART_W / 2, FACE.y + FACE.h / 2, cyan, 0.06, 2.2, 0.9, 0);

    this.root = scene.add
      .container(0, opts.roofY - ART_H, [this.halo, frame, ...lamps, cyanEdge, this.face, grid, ...this.bulbs])
      .setScrollFactor(0)
      .setDepth(opts.depth);

    this.show(opts.reducedMotion ? 'brand' : SEQUENCE[0].mode);
  }

  /** `layerOffset` is the mid-building layer's tilePositionX this frame. */
  update(dt: number, layerOffset: number): void {
    this.root.x = this.opts.textureColumn - layerOffset - ART_W / 2;
    if (this.opts.reducedMotion) return;

    const ms = dt * 1000;
    this.clock += dt;
    this.stepTime += ms;

    const current = SEQUENCE[this.step];
    if (this.stepTime >= current.ms) {
      this.step = (this.step + 1) % SEQUENCE.length;
      this.stepTime = 0;
      this.show(SEQUENCE[this.step].mode);
    }

    // A brief jolt as the panel switches content.
    const glitching = this.stepTime < GLITCH_MS;
    this.face.x = glitching ? Phaser.Math.Between(-2, 2) : 0;
    this.face.alpha = glitching ? Phaser.Math.FloatBetween(0.4, 1) : 1;

    const mode = SEQUENCE[this.step].mode;
    if (mode === 'wave') this.drawWave();
    if (mode === 'type') this.typeOut();
    if (mode === 'brand') this.shine.x = FACE.x + ((this.stepTime / 1100) % 1.6) * FACE.w - 10;

    this.bulbTick += ms;
    if (this.bulbTick > 110) {
      this.bulbTick = 0;
      this.bulbPhase = (this.bulbPhase + 1) % 3;
      this.bulbs.forEach((b, i) => b.setAlpha((i + this.bulbPhase) % 3 === 0 ? 1 : 0.25));
    }
    this.halo.setAlpha(0.15 + Math.sin(this.clock * 2.4) * 0.03);
  }

  private show(mode: Mode): void {
    const wave = mode === 'wave';
    const type = mode === 'type';
    const brand = mode === 'brand';
    this.bars.setVisible(wave);
    this.listening.setVisible(wave);
    this.dot.setVisible(wave);
    this.lines.forEach((l, i) => l.setVisible(type).setText(type ? '' : BILLBOARD.dictation[i]));
    this.cursor.setVisible(type);
    this.brand.setVisible(brand);
    this.tagline.setVisible(brand);
    this.shine.setVisible(brand && !this.opts.reducedMotion);
    if (wave) this.drawWave();
  }

  /** Bars mirrored about a centre line, enveloped so speech swells mid-phrase. */
  private drawWave(): void {
    const g = this.bars;
    const t = this.clock;
    const span = BARS * (BAR_W + BAR_GAP) - BAR_GAP;
    const x0 = FACE.x + (FACE.w - span) / 2;
    const cy = FACE.y + FACE.h / 2 + 4;
    const syllable = 0.55 + 0.45 * Math.abs(Math.sin(t * 3.1));

    g.clear();
    for (let i = 0; i < BARS; i++) {
      const centre = 1 - Math.abs(i - (BARS - 1) / 2) / (BARS / 2);
      const wobble = Math.abs(Math.sin(t * 7.3 + i * 0.7) * Math.sin(t * 2.9 + i * 0.31));
      const half = Math.max(1, Math.round((2 + 13 * wobble * centre) * syllable));
      g.fillStyle(half > 8 ? colour(introPalette.accent) : colour(introPalette.cyan), 1);
      g.fillRect(Math.round(x0 + i * (BAR_W + BAR_GAP)), Math.round(cy - half), BAR_W, half * 2);
    }
    this.dot.setAlpha(Math.sin(t * 6) > 0 ? 1 : 0.2);
  }

  /** Reveal the dictation a character at a time, the cursor riding the end. */
  private typeOut(): void {
    const charMs = 70;
    let budget = Math.floor(Math.max(0, this.stepTime - 250) / charMs);
    let at = 0;
    this.lines.forEach((line, i) => {
      const full = BILLBOARD.dictation[i];
      const shown = Math.min(full.length, Math.max(0, budget));
      budget -= full.length;
      // Re-render only when the visible slice actually changes.
      if (line.text.length !== shown) line.setText(full.slice(0, shown));
      if (shown > 0) at = i;
    });
    const line = this.lines[at];
    const width = line.text.length ? line.width : 0;
    this.cursor.setPosition(line.x + width + 1, line.y);
    this.cursor.setSize(3, CURSOR_H[at]);
    this.cursor.setAlpha(Math.floor(this.stepTime / 260) % 2 ? 1 : 0.15);
  }
}
