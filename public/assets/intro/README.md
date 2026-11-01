# Intro art

Every pixel in this folder is drawn by code in `scripts/art/`
(`npm run assets:intro`). There is **no third-party art in this project** —
nothing to license, nothing to credit, and the whole intro regenerates
deterministically.

| Module                       | Draws                                                            |
| ---------------------------- | ---------------------------------------------------------------- |
| `scripts/art/core.mjs`       | PNG encoder, the palette ramps, Bayer dithering, outline and rim |
| `scripts/art/street.mjs`     | sky, skyline, buildings, cables, street, props, cafe front, door, billboard, auto-rickshaw, voice note, glow |
| `scripts/art/characters.mjs` | the player: idle, walk, jump, and the back view for sitting      |
| `scripts/art/cafe.mjs`       | cafe wall and floor, desk, chair, people playing, counter, fan, wall decor |

To swap in a bought or commissioned pack instead: **drop files with the same
names and frame sizes into this folder.** No code changes needed. Both scenes
load by filename and fall back to flat colour blocks if a file is missing.

## How the art is made

1. **Fixed ramps.** Eleven five-step colour ramps (night, concrete, amber,
   cyan, magenta, violet, lime, skin, steel, yellow, green). Nothing uses a
   colour outside them.
2. **Ordered dithering.** Any value between two ramp steps is dithered with a
   Bayer 8×8 matrix, never alpha-blended.
3. **Rim light, then outline.** Sprites are drawn, given a catch-light down the
   edge facing the light, then a dark keyline around the silhouette.

Inspect any sprite enlarged:

```bash
node scripts/gen-city-art.mjs --preview=8 --out=<dir> --only=player
```

## Coordinates

Both scenes are authored 270px tall and scaled up by Phaser's `FIT` mode. The
width follows the screen's aspect ratio (260–760px) — the four tiled street
layers are 480 wide and repeat to fill whatever width the screen gives.

| Street landmark       | y   | Cafe landmark            | y   |
| --------------------- | --- | ------------------------ | --- |
| Building base line    | 196 | Wall meets floor         | 176 |
| Street graphic top    | 190 | Seated people (bottom)   | 189 |
| Player's feet         | 212 | Desks stand on           | 202 |
| Traffic wheels        | 252 | Chairs stand on          | 218 |
|                       |     | Player's feet            | 240 |

## Street

| File             | Size      | Frames      | Notes                                                                       |
| ---------------- | --------- | ----------- | --------------------------------------------------------------------------- |
| `sky.png`        | 480 × 270 | —           | Night gradient, stars, cloud bands lit from below. Tiles horizontally.      |
| `skyline.png`    | 480 × 110 | —           | Distant towers, 0.25× parallax. Tiles.                                      |
| `buildings.png`  | 480 × 170 | —           | Five building archetypes, 0.55× parallax. Tiles. The billboard stands on the shop block (x 140–236). |
| `cables.png`     | 480 × 64  | —           | Overhead wires catching neon, 1.1× parallax. Tiles.                         |
| `street.png`     | 480 × 80  | —           | Pavement, kerb, wet asphalt, puddles. 1×. Tiles.                            |
| `props.png`      | 256 × 120 | 4 × 64×120  | Lamp, railing, bollards, crate. Foreground at 1.25×.                        |
| `cafe-front.png` | 192 × 128 | —           | The cyber cafe. See anchors below.                                          |
| `door.png`       | 28 × 44   | —           | Cafe door. Swings open via `scaleX`.                                        |
| `billboard.png`  | 128 × 90  | —           | Rooftop LED billboard frame. The face (x 6–121, y 6–52) is drawn in-scene.  |
| `rickshaw.png`   | 120 × 40  | 2 × 60×40   | A Bengaluru auto, facing right, two frames of wheel.                        |
| `note.png`       | 72 × 16   | 4 × 18×16   | The collectible voice note: a mic, its sound rings pulsing.                 |
| `glow.png`       | 64 × 64   | —           | Soft white disc, tinted for every light. Not pixel art by design.           |

### Cafe front anchors

Bottom-centre at the ground line. Within the 192 × 128 image:

- **Sign board**: x 8–184, y 18–48. The scene prints `CAFE_NAME` and the
  services line on it.
- **Windows**: x 8–78 and 114–184, y 60–110, each with three little screens at
  x +8, +30, +52 (y +18). The scene lays a flickering glow over each one.
- **Door recess**: x 80–112, y 81–128. `door.png` sits on top.

## Player

| File              | Size     | Frames     | Notes                                                                 |
| ----------------- | -------- | ---------- | --------------------------------------------------------------------- |
| `player-idle.png` | 128 × 44 | 4 × 32×44  | A slow breath, facing right.                                          |
| `player-walk.png` | 256 × 44 | 8 × 32×44  | Facing right. Frames 0 and 4 are the contact poses. See stride below. |
| `player-jump.png` | 64 × 44  | 2 × 32×44  | 0 rising (tucked), 1 falling (legs reaching down).                    |
| `player-sit.png`  | 64 × 44  | 2 × 32×44  | Back view. 0 standing, turned to the desk. 1 seated: head and shoulders only, at the bottom of the cell. |

### Stride — read this before replacing the walk sheet

The walk cycle covers **32px of ground per loop** (`STEP = 8` in
`characters.mjs`). `Walker.ts` derives the animation rate from that and the
player's live speed, which is the only thing stopping the feet from skating.
A replacement with a different stride must update `STRIDE_PER_CYCLE` in
`src/intro/scenes/Walker.ts`.

## Cafe interior

| File               | Size      | Frames      | Notes                                                                 |
| ------------------ | --------- | ----------- | --------------------------------------------------------------------- |
| `cafe-wall.png`    | 480 × 270 | —           | Ceiling, RGB strip, panelled wall, wainscot, tiled floor. Tiles.      |
| `cafe-desk.png`    | 64 × 52   | —           | A station facing the camera. Screen (x 18–45, y 2–19) is drawn in-scene. |
| `cafe-chair.png`   | 26 × 30   | —           | Gaming chair from behind. Drawn in front of whoever sits in it.       |
| `cafe-npc.png`     | 144 × 26  | 6 × 24×26   | Three people from behind, two frames each (lean in, work the mouse).  |
| `cafe-counter.png` | 256 × 72  | 2 × 128×72  | Front counter and cashier. Frame 1 blinks.                            |
| `cafe-fan.png`     | 256 × 20  | 4 × 64×20   | Ceiling fan, side on.                                                 |
| `cafe-decor.png`   | 384 × 40  | 8 × 48×40   | 0 space poster, 1 sunset poster, 2 sign plate, 3 AC unit, 4 clock, 5 TV (picture drawn in-scene), 6 snack shelf, 7 rates board. |

## Palette

| Role         | Hex       |
| ------------ | --------- |
| **Accent**   | `#F5A35C` |
| Night / base | `#05060D` |
| Cyan         | `#54E8E0` |
| Magenta      | `#FF5FA2` |
| Violet       | `#8B6CFF` |
| Lime         | `#B6F34B` |

The amber accent is the one colour that must survive any replacement — it
connects the neon street to the calm desktop and browser inside.

## Licensing rule

If a bought pack ever replaces these files, it must allow portfolio use, and
the artist gets credited in the site's credits section (CLAUDE.md §10).
