/**
 * The intro is authored at a fixed low resolution and scaled up by Phaser's
 * FIT mode, which is what keeps the pixels square on any screen.
 *
 * Height is fixed so every y in the scene (ground line, building base, street)
 * stays valid. Width adapts to the display's aspect ratio instead, so a wide
 * monitor sees more street rather than black bars down the sides.
 *
 * Kept free of Phaser imports so React can read the size without pulling the
 * Phaser chunk into the initial bundle.
 */
export const VIEW_H = 270;

/** 16:9, and the width every asset is authored and tiled at. */
export const BASE_VIEW_W = 480;

/** Portrait phones get a narrower, closer view rather than a thin letterbox. */
const MIN_VIEW_W = 260;
const MAX_VIEW_W = 760;

export function viewportWidth(): number {
  if (typeof window === 'undefined') return BASE_VIEW_W;
  const aspect = window.innerWidth / Math.max(1, window.innerHeight);
  const wanted = Math.round(VIEW_H * aspect);
  return Math.min(MAX_VIEW_W, Math.max(MIN_VIEW_W, wanted));
}
