import Phaser from 'phaser';
import { introPalette } from '../../config';
import { BILLBOARD } from '../../content/intro';
import { ADD, PIXEL_FONT, SIGN_FONT, addLight, colour } from './shared';

/** The LED face inside billboard.png (see scripts/art/street.mjs). */
const FACE = { x: 6, y: 6, w: 148, h: 60 };
const ART_W = 160;
const ART_H = 84;
const BULB_XS = Array.from({ length: 25 }, (_, i) => 8 + i * 6);

const BARS = 28;
const BAR_W = 3;
const BAR_GAP = 2;

type Mode = 'wave' | 'type' | 'brand';
const SEQUENCE: ReadonlyArray<{ mode: Mode; ms: number }> = [
  { mode: 'wave', ms: 3400 },
  { mode: 'type', ms: 4200 },
  { mode: 'brand', ms: 3600 },
];
const GLITCH_MS = 180;
const CHAR_MS = 65;

export type BillboardOptions = {
  /** World x of the billboard's centre. */
  x: number;
  /** Where its struts meet the building. */
  bottomY: number;
  depth: number;
  reducedMotion: boolean;
};

/**
 * The LED board for the challenge's host, bolted across the glass tower: a
 * live voice waveform, a line of dictation typing itself out, then the name.
 *
 * Kept sharp on purpose: no dot-matrix overlay and no blurred text shadows
 * (the bloom pass supplies the glow), and the brand set in Silkscreen at
 * exactly twice its native size so every stroke lands on a whole pixel.
 */
export class Billboard {
  private face: Phaser.GameObjects.Container;
  private bars: Phaser.GameObjects.Graphics;
  private listening: Phaser.GameObjects.Text;
  private dot: Phaser.GameObjects.Rectangle;
  private lines: Phaser.GameObjects.Text[];
  private cursor: Phaser.GameObjects.Rectangle;
  private brand: Phaser.GameObjects.Text;
  private tagline: Phaser.GameObjects.Text;
  private eq: Phaser.GameObjects.Graphics;
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
    const cx = FACE.x + FACE.w / 2;
    const cy = FACE.y + FACE.h / 2;

    this.bars = scene.add.graphics();
    this.listening = scene.add
      .text(cx + 5, FACE.y + 8, BILLBOARD.listening, { fontFamily: SIGN_FONT, fontSize: '8px', color: '#e9ebf2' })
      .setOrigin(0.5)
      .setResolution(2);
    this.dot = scene.add.rectangle(cx - this.listening.width / 2 - 1, FACE.y + 8, 3, 3, colour(introPalette.magenta));

    this.lines = BILLBOARD.dictation.map((line, i) =>
      scene.add
        .text(FACE.x + 10, FACE.y + (i === 0 ? 16 : 34), line, {
          fontFamily: i === 0 ? PIXEL_FONT : SIGN_FONT,
          fontSize: '8px',
          color: i === 0 ? introPalette.accent : '#e9ebf2',
        })
        .setResolution(2),
    );
    this.cursor = scene.add.rectangle(0, 0, 3, 8, amber).setOrigin(0, 0);

    this.brand = scene.add
      .text(cx, cy - 6, BILLBOARD.brand, { fontFamily: SIGN_FONT, fontSize: '16px', color: introPalette.accent })
      .setOrigin(0.5)
      .setResolution(2);
    this.tagline = scene.add
      .text(cx, cy + 14, BILLBOARD.tagline, { fontFamily: SIGN_FONT, fontSize: '8px', color: '#b3bdd6' })
      .setOrigin(0.5)
      .setResolution(2);
    this.eq = scene.add.graphics();
    this.shine = scene.add.rectangle(FACE.x, FACE.y, 6, FACE.h, 0xffffff, 0.3).setOrigin(0, 0).setBlendMode(ADD);

    this.face = scene.add.container(0, 0, [
      this.bars,
      this.dot,
      this.listening,
      ...this.lines,
      this.cursor,
      this.brand,
      this.tagline,
      this.eq,
      this.shine,
    ]);

    // Fine horizontal scanlines: enough to read as a screen, not enough to blur.
    const scan = scene.add.graphics();
    scan.fillStyle(0x000000, 0.16);
    for (let y = FACE.y + 1; y < FACE.y + FACE.h; y += 2) scan.fillRect(FACE.x, y, FACE.w, 1);

    this.bulbs = BULB_XS.map((x) => scene.add.rectangle(x, 0, 2, 2, amber).setOrigin(0, 0));

    this.halo = addLight(scene, ART_W / 2, cy, amber, 0.2, 4, 1.8, 0);
    const lamps = [37, 123].map((x) => addLight(scene, x, cy + 8, 0xffe2b8, 0.12, 0.8, 1.5, 0));
    const frame = scene.add.image(0, 0, 'billboard').setOrigin(0, 0);
    const edge = addLight(scene, ART_W / 2, cy, colour(introPalette.cyan), 0.06, 2.8, 1.1, 0);

    scene.add
      .container(opts.x - ART_W / 2, opts.bottomY - ART_H, [this.halo, frame, ...lamps, edge, this.face, scan, ...this.bulbs])
      .setDepth(opts.depth);

    this.show(opts.reducedMotion ? 'brand' : SEQUENCE[0].mode);
  }

  update(dt: number): void {
    if (this.opts.reducedMotion) return;
    const ms = dt * 1000;
    this.clock += dt;
    this.stepTime += ms;

    if (this.stepTime >= SEQUENCE[this.step].ms) {
      this.step = (this.step + 1) % SEQUENCE.length;
      this.stepTime = 0;
      this.show(SEQUENCE[this.step].mode);
    }

    // A jolt as the panel switches content.
    const glitching = this.stepTime < GLITCH_MS;
    this.face.x = glitching ? Phaser.Math.Between(-3, 3) : 0;
    this.face.alpha = glitching ? Phaser.Math.FloatBetween(0.35, 1) : 1;

    const mode = SEQUENCE[this.step].mode;
    if (mode === 'wave') this.drawWave();
    if (mode === 'type') this.typeOut();
    if (mode === 'brand') this.drawBrand();

    this.bulbTick += ms;
    if (this.bulbTick > 100) {
      this.bulbTick = 0;
      this.bulbPhase = (this.bulbPhase + 1) % 3;
      this.bulbs.forEach((b, i) => b.setAlpha((i + this.bulbPhase) % 3 === 0 ? 1 : 0.2));
    }
    this.halo.setAlpha(0.17 + Math.sin(this.clock * 2.4) * 0.04);
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
    this.eq.setVisible(brand);
    this.shine.setVisible(brand && !this.opts.reducedMotion);
    if (wave) this.drawWave();
    if (brand) this.drawBrand();
  }

  /** Bars mirrored about a centre line, enveloped so speech swells mid-phrase. */
  private drawWave(): void {
    const g = this.bars;
    const t = this.clock;
    const span = BARS * (BAR_W + BAR_GAP) - BAR_GAP;
    const x0 = FACE.x + (FACE.w - span) / 2;
    const cy = FACE.y + FACE.h / 2 + 5;
    const syllable = 0.55 + 0.45 * Math.abs(Math.sin(t * 3.1));
    g.clear();
    for (let i = 0; i < BARS; i++) {
      const centre = 1 - Math.abs(i - (BARS - 1) / 2) / (BARS / 2);
      const wobble = Math.abs(Math.sin(t * 7.3 + i * 0.7) * Math.sin(t * 2.9 + i * 0.31));
      const half = Math.max(1, Math.round((2 + 19 * wobble * centre) * syllable));
      g.fillStyle(half > 11 ? colour(introPalette.accent) : half > 5 ? colour(introPalette.magenta) : colour(introPalette.cyan), 1);
      g.fillRect(Math.round(x0 + i * (BAR_W + BAR_GAP)), Math.round(cy - half), BAR_W, half * 2);
    }
    this.dot.setAlpha(Math.sin(t * 6) > 0 ? 1 : 0.2);
  }

  /** Reveal the dictation a character at a time, the cursor riding the end. */
  private typeOut(): void {
    let budget = Math.floor(Math.max(0, this.stepTime - 250) / CHAR_MS);
    let at = 0;
    this.lines.forEach((line, i) => {
      const full = BILLBOARD.dictation[i];
      const shown = Math.min(full.length, Math.max(0, budget));
      budget -= full.length;
      if (line.text.length !== shown) line.setText(full.slice(0, shown));
      if (shown > 0) at = i;
    });
    const line = this.lines[at];
    this.cursor.setPosition(line.x + (line.text.length ? line.width : 0) + 1, line.y);
    this.cursor.setSize(3, at === 0 ? 8 : 7);
    this.cursor.setAlpha(Math.floor(this.stepTime / 260) % 2 ? 1 : 0.15);
  }

  /** The name, a shine passing over it, and little level meters either side. */
  private drawBrand(): void {
    this.shine.x = FACE.x + ((this.stepTime / 1200) % 1.5) * FACE.w - 12;
    const g = this.eq;
    g.clear();
    const t = this.clock;
    for (const side of [-1, 1]) {
      const bx = FACE.x + FACE.w / 2 + side * (this.brand.width / 2 + 10);
      for (let k = 0; k < 3; k++) {
        const h = 3 + Math.round(Math.abs(Math.sin(t * (5 + k) + k + side)) * 9);
        g.fillStyle(colour(k === 1 ? introPalette.accent : introPalette.cyan), 1);
        g.fillRect(Math.round(bx + side * k * 4 - 1), Math.round(FACE.y + FACE.h / 2 - 6 + 6 - h / 2), 2, h);
      }
    }
  }
}
