/**
 * The intro is authored at a fixed low resolution and scaled up by Phaser's
 * FIT mode, which is what keeps the pixels square on any screen.
 *
 * Kept in its own module (free of Phaser imports) so React can read the size
 * without pulling the Phaser chunk into the initial bundle.
 */
export const VIEW_W = 480;
export const VIEW_H = 270;
