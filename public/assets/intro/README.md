# Intro game assets

Everything in this folder is a **placeholder**, generated procedurally by
`scripts/gen-placeholder-assets.mjs` (`npm run assets:intro`). Nothing here is
third-party art, so there is nothing to license and nothing to credit yet.

To swap in a real pixel pack: **drop files with the same names and the same
dimensions into this folder.** No code changes are needed. The scene loads
purely by filename, and falls back to flat colour blocks if a file is missing
or fails to decode.

## The scene's coordinate system

The game is authored on a fixed **480 × 270** grid and scaled up by Phaser's
`FIT` mode, so the pixels stay square on any display. Every size below is in
that grid, not in screen pixels.

| Landmark             | y   |
| -------------------- | --- |
| Building base line   | 196 |
| Street graphic top   | 190 |
| Ground (player feet) | 212 |

## Files

| File              | Size      | Notes                                                                                                                    |
| ----------------- | --------- | ------------------------------------------------------------------------------------------------------------------------ |
| `sky.png`         | 480 × 270 | Full-viewport backdrop. Scrolls at **0.05×**. Vertical gradient + stars; must tile horizontally.                           |
| `skyline.png`     | 480 × 110 | Distant silhouette. Scrolls at **0.25×**. Bottom edge sits on the building base line. Transparent above the rooftops.      |
| `buildings.png`   | 480 × 170 | Mid-ground facades with lit windows. Scrolls at **0.55×**. Bottom edge on the building base line. Transparent above.       |
| `street.png`      | 480 × 80  | Sidewalk (top 16px) + curb + road. Scrolls at **1×**. Top edge at y 190. Opaque.                                           |
| `player-idle.png` | 16 × 24   | Single frame, facing **right**. Origin is bottom-centre, so the feet are on the last row.                                  |
| `player-walk.png` | 96 × 24   | Spritesheet, **6 frames of 16 × 24**, left to right, facing **right**. Played at 10 fps. Flipped in code for walking left. |
| `shop.png`        | 160 × 120 | Storefront. Origin bottom-centre at the ground line. See anchors below.                                                    |
| `door.png`        | 24 × 40   | Closed door. Origin bottom-centre, centred on the shop. Swings open via `scaleX` — no separate open frame needed.          |

All four scrolling layers are drawn as tile sprites, so each one **must tile
seamlessly left-to-right**. Only the 480px width matters; the scene is 1400px
wide and repeats the tile.

## Shop anchors

The shop is placed with its bottom-centre at the ground line, so its top-left
corner lands at `(shopX - 80, 92)`. Within the 160 × 120 image:

- **Sign board**: x 10–150, y 24–46. The scene draws `BROWSER_NAME` centred on
  this board in amber `#F5A35C`, shrinking the font until it fits 132px. Leave
  this area dark and empty in a replacement.
- **Door recess**: x 68–92, y 80–120. `door.png` is drawn on top of it, and a
  warm amber rectangle behind it is revealed when the door opens.
- **Windows**: x 12–52 and x 108–148, y 60–98.

## Palette

The city is loud on purpose. The one colour that must survive into a
replacement is the amber accent — it is the single visual thread connecting the
neon street to the calm browser inside.

| Role         | Hex       |
| ------------ | --------- |
| **Accent**   | `#F5A35C` |
| Night / base | `#070912` |
| Cyan         | `#54E8E0` |
| Magenta      | `#FF5FA2` |
| Violet       | `#8B6CFF` |
| Lime         | `#B6F34B` |

## Licensing rule

If a real pack replaces these files, it must allow portfolio use, and the
artist gets credited in the site's credits section (CLAUDE.md §10).
