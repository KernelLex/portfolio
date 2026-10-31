# Intro city art

Every pixel in this folder is drawn by `scripts/gen-city-art.mjs`
(`npm run assets:intro`). There is **no third-party art in this project** —
nothing to license, nothing to credit, and the whole city regenerates
deterministically from code.

To swap in a bought or commissioned pixel pack instead: **drop files with the
same names and dimensions into this folder.** No code changes needed. The scene
loads purely by filename and falls back to flat colour blocks if a file is
missing or fails to decode.

## How the art is made

Three rules keep it inside the medium rather than looking like rendered
gradients:

1. **Fixed ramps.** Eight five-step colour ramps (night, concrete, amber, cyan,
   magenta, violet, lime, skin). Nothing uses a colour outside them.
2. **Ordered dithering.** Any value falling between two ramp steps is dithered
   with a Bayer 8×8 matrix, never alpha-blended. This is what makes the skies,
   facades and window glows read as pixel art.
3. **Rim light, then outline.** Characters and street furniture are drawn, then
   given an amber catch-light down the edge facing the shop, then a dark
   keyline around the silhouette.

Buildings are assembled from five hand-authored archetypes — tenement with fire
escape, glazed tower with a neon banner, shop block with shutters and awnings,
rooftop billboard with scaffolding, and a service block with ducting and vents —
not from randomised rectangles.

### Inspecting sprites

```bash
node scripts/gen-city-art.mjs --preview=9 --out=<dir> --only=player
```

Writes nearest-neighbour upscales on an opaque backdrop so mistakes are visible.
Dev aid only; previews are never published.

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

| File              | Size      | Scroll | Notes                                                                                                            |
| ----------------- | --------- | ------ | ---------------------------------------------------------------------------------------------------------------- |
| `sky.png`         | 480 × 270 | 0.05×  | Full-viewport backdrop: dithered night gradient, stars, cloud bands lit from beneath. Must tile horizontally.      |
| `skyline.png`     | 480 × 110 | 0.25×  | Distant silhouettes, hazed toward the base. Bottom edge on the building base line; transparent above the rooftops. |
| `buildings.png`   | 480 × 170 | 0.55×  | Mid-ground archetypes. Bottom edge on the building base line; transparent above.                                   |
| `cables.png`      | 480 × 64  | 1.10×  | Overhead power lines and two paper lanterns. Drawn at the top of the viewport. Sag is periodic so the tile loops.  |
| `street.png`      | 480 × 80  | 1.00×  | Pavement (top 18px), kerb, wet asphalt, lane dashes, puddles. Top edge at y 190. Opaque.                           |
| `props.png`       | 256 × 120 | 1.25×  | Spritesheet, **4 frames of 64 × 120**: 0 street lamp, 1 railing, 2 bollards + rubbish, 3 crate + weeds.            |
| `shop.png`        | 160 × 120 | 1.00×  | Storefront. Origin bottom-centre at the ground line. See anchors below.                                            |
| `door.png`        | 28 × 44   | 1.00×  | Closed door, centred on the shop. Swings open via `scaleX` — no separate open frame.                               |
| `player-idle.png` | 24 × 32   | 1.00×  | Single frame, facing **right**. Origin bottom-centre, feet on the last row.                                        |
| `player-walk.png` | 192 × 32  | 1.00×  | Spritesheet, **8 frames of 24 × 32**, facing **right**. Played at 12 fps. Frames 0 and 4 are the contact poses.    |
| `glow.png`        | 64 × 64   | —      | Soft white disc. Tinted, scaled and additively blended for every light in the city. Not pixel art by design.       |

The four tiled layers (`sky`, `skyline`, `buildings`, `street`) and `cables`
**must tile seamlessly left-to-right**. Only the 480px width matters; the scene
is 1400px wide and repeats each tile.

`props.png` frames are placed as individual world objects, not tiled, so they
never visibly repeat. Frame 0 gets an amber light attached in the scene.

## Shop anchors

The shop is placed with its bottom-centre at the ground line, so its top-left
corner lands at `(shopX - 80, 92)`. Within the 160 × 120 image:

- **Sign board**: x 10–150, y 22–46, ringed by a neon tube. The scene prints
  `BROWSER_NAME` across it in amber, shrinking the font until it fits 130px.
  Leave this area dark and empty in a replacement.
- **Door recess**: x 66–94, y 73–120. `door.png` is drawn on top of it, and a
  warm amber rectangle behind it is revealed when the door opens.
- **Windows**: x 12–54 and x 106–148, y 61–101.

## Palette

The city is loud on purpose. The one colour that must survive into a
replacement is the amber accent — it is the single visual thread connecting the
neon street to the calm browser inside.

| Role         | Hex       |
| ------------ | --------- |
| **Accent**   | `#F5A35C` |
| Night / base | `#05060D` |
| Cyan         | `#54E8E0` |
| Magenta      | `#FF5FA2` |
| Violet       | `#8B6CFF` |
| Lime         | `#B6F34B` |

## Licensing rule

If a bought pack ever replaces these files, it must allow portfolio use, and
the artist gets credited in the site's credits section (CLAUDE.md §10).
