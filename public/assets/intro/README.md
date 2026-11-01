# Intro art

Every pixel in this folder is drawn by code in `scripts/art/`
(`npm run assets:intro`). There is **no third-party art in this project** —
nothing to license, nothing to credit, and the whole intro regenerates
deterministically.

| Module                       | Draws                                                            |
| ---------------------------- | ---------------------------------------------------------------- |
| `scripts/art/core.mjs`       | PNG encoder, the palette ramps, Bayer dithering, outline and rim |
| `scripts/art/street.mjs`     | sky, skyline, buildings, cables, street, props, cafe front, door, billboard, auto-rickshaw, voice note, glow |
| `scripts/art/characters.mjs` | the player in techwear: idle, walk, jump, seated, and front and back views for doorways |
| `scripts/art/cafe.mjs`       | the futuristic cafe: wall and floor, desk, pod chair, people playing, counter, hardware |
| `scripts/art/city.mjs`       | megastructures, haze, the street-front row of buildings and shops, sign casings and brackets, flying cars, road cars, pedestrians |
| `scripts/art/link.mjs`       | the jack-in close-up: sleeve, chrome wrist implant with its port, the hand; the PC's I/O panel; the plug |

To swap in a bought or commissioned pack instead: **drop files with the same
names and frame sizes into this folder.** No code changes needed. Both scenes
load by filename and fall back to flat colour blocks if a file is missing.

## How the art is made

1. **Fixed ramps.** Thirteen five-step colour ramps (night, concrete, amber,
   cyan, magenta, violet, lime, skin, steel, yellow, green, brick, teal).
   Nothing uses a colour outside them.
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
| `door.png`       | 28 × 44   | 2 × 14×44   | Sliding glass doors: 0 left leaf, 1 right leaf. Masked to the opening and slid apart in-scene (street and cafe). |
| `billboard.png`  | 160 × 84  | —           | LED billboard frame bolted to the glass tower: bulb sockets every 6px from x 8, catwalk, lamps, struts. The face (x 6–153, y 6–65) is drawn in-scene. |
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

## The city around the street

| File               | Size      | Frames      | Notes                                                                 |
| ------------------ | --------- | ----------- | --------------------------------------------------------------------- |
| `megacity.png`     | 480 × 210 | —           | Colossal towers on the horizon, 0.12× parallax, behind a haze wash. Tiles. |
| `haze.png`         | 4 × 128   | —           | Alpha ramp, tinted and stretched in-scene between the layers. Not pixel art by design. |
| `street-front.png` | 960 × 190 | —           | The row of buildings right behind the pavement, at the player's depth. Bottom on the building base line (196). |
| `sign-frame.png`   | 32 × 16   | 2 × 16×16   | Nine-slice sign casings (4px borders): 0 steel, 1 brass.             |
| `sign-bracket.png` | 16 × 16   | —           | Wall bracket for projecting blade signs.                              |
| `flyers.png`       | 320 × 18  | 5 × 64×18   | Sky traffic: 0 sedan, 1 flying taxi, 2 police spinner (frame 2 flashes in-scene), 3 cargo drone with a slung container, 4 racer. |
| `flyers-far.png`   | 60 × 6    | 3 × 20×6    | The same three, distant.                                              |
| `traffic.png`      | 528 × 30  | 6 × 88×30   | Road traffic: 0 sedan, 1 wedge pickup, 2 sports, 3 hover bike and rider (48px long, centred), 4 delivery van, 5 chrome coupe. All face right. |
| `bus.png`          | 144 × 36  | —           | The night bus: lit windows, passengers, destination board. Faces right. |
| `pedestrians.png`  | 672 × 44  | 28 × 24×44  | Seven kinds of people, four walk frames each (frame 1 of each is the standing pose): cyan umbrella, magenta umbrella, runner in an LED mask, courier with a lit box, trench coat and visor, phone and headphones, delivery robot. They walk the back of the pavement and stop short of the player. |

### Street-front layout

Eight buildings, each with a shop on the ground floor (screen y 146–196):

| x       | Building                      | Shop       | Mounted sign (StreetScene)        |
| ------- | ----------------------------- | ---------- | --------------------------------- |
| 0–112   | brick flats, fire escape      | ramen      | VERA ERP lightbox                 |
| 112–200 | low shop house, rooftop clutter | repairs  | SECANT on a rooftop scaffold      |
| 200–350 | glass office tower            | 24/7 mart  | the Wispr Flow LED billboard      |
| 350–440 | balconies, laundry, plants    | chai & coffee | HAZEN on a rooftop scaffold    |
| 440–560 | industrial, ducts, vents      | garage     | TRUECOMMIT lightbox + ticker      |
| 560–704 | brick flats with AC units     | clinic     | THROTTLE blade sign, beside the cafe |
| 704–896 | the cafe tower                | (cafe-front.png) | CYBER CAFE, NET blade high up |
| 896–960 | narrow block                  | keys       | —                                 |

Change a building's position or height in `city.mjs` and the sign positions in
`StreetScene.ts` have to follow.

## Player

| File              | Size     | Frames     | Notes                                                                 |
| ----------------- | -------- | ---------- | --------------------------------------------------------------------- |
| `player-idle.png` | 128 × 44 | 4 × 32×44  | A slow breath, facing right.                                          |
| `player-walk.png` | 256 × 44 | 8 × 32×44  | Facing right. Frames 0 and 4 are the contact poses. See stride below. |
| `player-jump.png` | 64 × 44  | 2 × 32×44  | 0 rising (tucked), 1 falling (legs reaching down).                    |
| `player-sit.png`  | 64 × 44  | 2 × 32×44  | Back view. 0 standing, turned to the desk. 1 seated: head and shoulders only, at the bottom of the cell. |
| `player-turn.png` | 128 × 44 | 4 × 32×44  | Walking through doorways: 0–1 back view (stand, step), 2–3 front view (stand, step). |

### Stride — read this before replacing the walk sheet

The walk cycle covers **32px of ground per loop** (`STEP = 8` in
`characters.mjs`). `Walker.ts` derives the animation rate from that and the
player's live speed, which is the only thing stopping the feet from skating.
A replacement with a different stride must update `STRIDE_PER_CYCLE` in
`src/intro/scenes/Walker.ts`.

## Cafe interior

| File               | Size      | Frames      | Notes                                                                 |
| ------------------ | --------- | ----------- | --------------------------------------------------------------------- |
| `cafe-wall.png`    | 480 × 270 | —           | Ceiling light slots, RGB strip, hex-panel wall, neon tubes at x 80 / 240 / 400, lit wainscot, neon grid floor. Tiles. The scene hangs one holo panel per bay between tubes. |
| `cafe-desk.png`    | 64 × 52   | —           | A station facing the camera: frameless display, glowing slab edge, projected keyboard, glass PC core (power LED at 52, 35). Screen (x 18–45, y 2–19) is drawn in-scene. |
| `cafe-chair.png`   | 26 × 30   | —           | Egg pod from behind, cyan trim. Drawn in front of whoever sits in it. |
| `cafe-npc.png`     | 144 × 26  | 6 × 24×26   | Three people from behind (neck implant, lit headphones), two frames each. |
| `cafe-counter.png` | 256 × 72  | 2 × 128×72  | Light-lined counter and the cashier in an AR visor. Frame 1 flickers the visor. |
| `cafe-decor.png`   | 144 × 64  | 3 × 48×64   | Floor-standing hardware: 0 drinks machine, 1 server rack, 2 planter with a glowing plant. |

The holo panels (scores, the cricket, the ad, CYBER CUP, the clock, WELCOME),
the ring lights and the EXIT sign are light, not objects, so `CafeScene.ts`
draws them.

## Jack-in close-up

| File            | Size      | Frames      | Notes                                                                 |
| --------------- | --------- | ----------- | --------------------------------------------------------------------- |
| `link-arm.png`  | 800 × 64  | 4 × 200×64  | Sleeve (long enough to run off the screen), chrome wrist implant, hand. 0 port closed, 1 panel sliding back, 2 port open and glowing, 3 open with the fingers twitching. The cable leaves at (125, 25); the implant's light strip is at (125, 35). |
| `link-port.png` | 220 × 96  | 2 × 110×96  | The PC's I/O panel. 0 socket waiting (amber), 1 connected (cyan). The plug seats at (36, 54). |
| `link-plug.png` | 20 × 12   | —           | The plug on the end of the cable.                                     |

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
