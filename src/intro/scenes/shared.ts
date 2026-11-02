import Phaser from 'phaser';
import { CityPostFX } from '../pipelines/CityPostFX';
import { BASE, IMAGES, SHEETS } from '../assets';

/** Helpers both intro scenes lean on: assets, lights, text and the look pass. */

export const ADD = Phaser.BlendModes.ADD;
/** Headline pixel font. Built on an 8px grid - unreadable below that. */
export const PIXEL_FONT = '"Press Start 2P", monospace';
/** Small-sign pixel font: designed to stay legible at 8px with 5px capitals. */
export const SIGN_FONT = '"Silkscreen", monospace';

/** Flat colour stand-ins, so a missing file degrades instead of breaking the scene. */
const FALLBACKS: ReadonlyArray<[string, number, number, number]> = [
  ['sky', 480, 270, 0x070912],
  ['skyline', 480, 110, 0x0c1120],
  ['buildings', 480, 170, 0x0a0f1c],
  ['cables', 480, 64, 0x000000],
  ['street', 480, 80, 0x0a0d16],
  ['cafe-front', 192, 128, 0x141b2c],
  ['door', 14, 44, 0x1b2235],
  ['billboard', 160, 84, 0x080b16],
  ['glow', 64, 64, 0xffffff],
  ['cafe-wall', 480, 270, 0x0c1120],
  ['cafe-desk', 64, 52, 0x0a0e18],
  ['cafe-chair', 26, 30, 0x121a2e],
  ['player-idle', 32, 44, 0x243253],
  ['player-walk', 32, 44, 0x243253],
  ['player-jump', 32, 44, 0x243253],
  ['player-sit', 32, 44, 0x243253],
  ['player-turn', 32, 44, 0x243253],
  ['props', 64, 120, 0x05060d],
  ['rickshaw', 60, 40, 0x2e8f47],
  ['note', 18, 16, 0xf5a35c],
  ['cafe-npc', 24, 26, 0x121a2e],
  ['cafe-counter', 128, 72, 0x121a2e],
  ['cafe-decor', 48, 64, 0x121a2e],
  ['pedestrians', 24, 44, 0x121a2e],
  ['megacity', 480, 210, 0x0c1120],
  ['haze', 4, 128, 0xffffff],
  ['street-front', 960, 190, 0x141b2c],
  ['sign-frame', 16, 16, 0x1e2840],
  ['sign-bracket', 16, 16, 0x0c1120],
  ['flyers', 64, 18, 0x8b6cff],
  ['flyers-far', 20, 6, 0x121a2e],
  ['traffic', 88, 30, 0x8b6cff],
  ['bus', 144, 36, 0x143b40],
  ['link-arm', 200, 64, 0x20243a],
  ['link-port', 110, 96, 0x0c1120],
  ['link-plug', 20, 12, 0xb3bdd6],
];

/**
 * Everything for every intro scene loads up front, in BootScene, so moving
 * between the street and the cafe never waits on the network.
 */
export function loadIntroAssets(scene: Phaser.Scene): void {
  for (const key of IMAGES) scene.load.image(key, BASE + key + '.png');
  for (const [key, frameWidth, frameHeight] of SHEETS) {
    scene.load.spritesheet(key, BASE + key + '.png', { frameWidth, frameHeight });
  }
  scene.load.on(Phaser.Loader.Events.FILE_LOAD_ERROR, (file: Phaser.Loader.File) => {
    console.warn('[intro] missing asset, using fallback:', file.key);
  });
}

export function ensureFallbacks(scene: Phaser.Scene): void {
  for (const [key, w, h, color] of FALLBACKS) {
    if (scene.textures.exists(key)) continue;
    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(color, 1).fillRect(0, 0, w, h);
    g.generateTexture(key, w, h);
    g.destroy();
  }
  if (!scene.textures.exists('rain-drop')) {
    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0xc9d8ff, 1).fillRect(0, 0, 1, 6);
    g.generateTexture('rain-drop', 1, 6);
    g.destroy();
  }
}

export const colour = (hex: string): number => Phaser.Display.Color.HexStringToColor(hex).color;

/** Linear blend of two packed RGB colours. */
export function mixColour(a: number, b: number, t: number): number {
  const k = Phaser.Math.Clamp(t, 0, 1);
  const ch = (shift: number) => {
    const from = (a >> shift) & 0xff;
    const to = (b >> shift) & 0xff;
    return Math.round(from + (to - from) * k) << shift;
  };
  return ch(16) | ch(8) | ch(0);
}

/** A soft tinted disc. Every light in the intro is one of these. */
export function addLight(
  scene: Phaser.Scene,
  x: number,
  y: number,
  color: number,
  alpha: number,
  scaleX: number,
  scaleY: number,
  depth: number,
): Phaser.GameObjects.Image {
  return scene.add
    .image(x, y, 'glow')
    .setTint(color)
    .setAlpha(alpha)
    .setScale(scaleX, scaleY)
    .setBlendMode(ADD)
    .setDepth(depth);
}

/**
 * Neon lettering. The glow is a blurred canvas shadow baked into the text
 * itself - a scaled duplicate never lines up with the original at this
 * resolution and reads as a double image.
 */
export function neonText(
  scene: Phaser.Scene,
  x: number,
  y: number,
  text: string,
  color: string,
  size: number,
  font = PIXEL_FONT,
): Phaser.GameObjects.Text {
  return scene.add
    .text(x, y, text, {
      fontFamily: font,
      fontSize: size + 'px',
      color,
      padding: { x: 6, y: 6 },
    })
    .setShadow(0, 0, color, 5, false, true)
    .setOrigin(0.5)
    .setResolution(2);
}

/** Small lettering on in-world signs: plates, menus, captions. */
export function signText(
  scene: Phaser.Scene,
  x: number,
  y: number,
  text: string,
  color: string,
): Phaser.GameObjects.Text {
  return scene.add
    .text(x, y, text, { fontFamily: SIGN_FONT, fontSize: '8px', color })
    .setOrigin(0.5)
    .setResolution(2);
}

/**
 * Small UI line inside the game: prompts, hints, pop-ups. Pixel lettering
 * too - the canvas is 480x270 and scaled up, so a smooth font is rasterised
 * at that size first and smears.
 */
export function uiText(
  scene: Phaser.Scene,
  x: number,
  y: number,
  text: string,
  options: { color?: string; backing?: boolean; size?: number; wrap?: number } = {},
): Phaser.GameObjects.Text {
  return scene.add
    .text(x, y, text, {
      fontFamily: SIGN_FONT,
      fontSize: (options.size ?? 8) + 'px',
      color: options.color ?? '#e9ebf2',
      backgroundColor: options.backing ? 'rgba(5,7,12,0.82)' : undefined,
      padding: options.backing ? { x: 6, y: 4 } : undefined,
      align: 'center',
      wordWrap: options.wrap ? { width: options.wrap } : undefined,
    })
    .setOrigin(0.5)
    .setResolution(2);
}

export const isTouch = (scene: Phaser.Scene): boolean => scene.sys.game.device.input.touch;

/** The bloom / scanline / vignette pass. Silently skipped without WebGL. */
export function attachPostFX(scene: Phaser.Scene): void {
  try {
    if (scene.renderer.type !== Phaser.WEBGL) return;
    scene.cameras.main.setPostPipeline(CityPostFX);
  } catch (err) {
    console.warn('[intro] post-processing unavailable:', err);
  }
}

/**
 * An iris: the view shrinks to a circle on a point and closes (or opens back
 * out from one). Classic, clean, and it says exactly where you are going.
 * Needs WebGL for the inverted mask; falls back to a camera fade without it.
 */
export function iris(
  scene: Phaser.Scene,
  worldX: number,
  worldY: number,
  mode: 'open' | 'close',
  duration: number,
  done?: () => void,
): void {
  const cam = scene.cameras.main;
  if (scene.renderer.type !== Phaser.WEBGL) {
    if (mode === 'open') cam.fadeIn(duration, 0, 0, 0);
    else cam.fadeOut(duration, 0, 0, 0);
    if (done) scene.time.delayedCall(duration, done);
    return;
  }

  const w = scene.scale.width;
  const h = scene.scale.height;
  const cx = (worldX - cam.scrollX) * cam.zoom;
  const cy = (worldY - cam.scrollY) * cam.zoom;
  const far = Math.hypot(Math.max(cx, w - cx), Math.max(cy, h - cy)) + 4;

  const cover = scene.add.rectangle(0, 0, w, h, 0x000000).setOrigin(0, 0).setScrollFactor(0).setDepth(1000);
  const hole = scene.make.graphics({ x: 0, y: 0 }, false).setScrollFactor(0);
  const mask = hole.createGeometryMask();
  mask.setInvertAlpha(true);
  cover.setMask(mask);

  const draw = (r: number) => hole.clear().fillStyle(0xffffff).fillCircle(cx, cy, Math.max(0, r));
  draw(mode === 'open' ? 0 : far);
  scene.tweens.addCounter({
    from: mode === 'open' ? 0 : far,
    to: mode === 'open' ? far : 0,
    duration,
    ease: mode === 'open' ? 'Cubic.easeOut' : 'Cubic.easeIn',
    onUpdate: (tw) => draw(tw.getValue() ?? 0),
    onComplete: () => {
      if (mode === 'open') {
        cover.destroy();
        hole.destroy();
      }
      done?.();
    },
  });
}
