# TASK-01: Intro game preloader + boot screen

> Read CLAUDE.md first. This task builds ONLY the intro flow and a placeholder browser shell.
> Timebox: ~4–5 hours. Ship a working flow with placeholder art over a perfect unfinished one.

**Status: done.** See "Outcome" at the bottom.

## Goal
A short, playable, one-lane 2D pixel side-scroller (inspired by the game Dan the Man, no copied assets). The player walks right through a loud neon cyberpunk night street, reaches a shop with the `BROWSER_NAME` sign, enters, the screen flashes white, and a calm space-themed boot screen loads into the browser shell. The game doubles as the preloader: the main site loads in the background while it runs.

## Setup
- Scaffold Vite + React + TypeScript + Tailwind (if not already done).
- Install Phaser 3 (lazy-loaded) and GSAP.
- Create `src/config.ts` with `export const BROWSER_NAME = "Amogh Navigator";` and the theme tokens from CLAUDE.md §4.
- Initialize git; add a sensible `.gitignore`.

## 1. Street scene (Phaser)
- Pixel-art rendering (`pixelArt: true`, no smoothing). Fits the viewport, scales cleanly on mobile.
- Parallax layers, back to front: night sky with faint stars → distant skyline → mid buildings with neon signs → street/foreground. Each scrolls at a different speed.
- Ambient effects: light rain particles, flickering neon signs, a cheap wet-street reflection if easy.
- Level length: ~6–8 seconds of walking at normal speed.
- Neon signs along the street (pixel font) as easter eggs: `VERA ERP`, `SECANT`, `HAZEN`, `TRUECOMMIT`, `THROTTLE`, and a billboard `WISPR FLOW`.
- The shop at the end has a glowing sign showing `BROWSER_NAME` in the **amber accent `#F5A35C`** (the color that links outside and inside) and a door. Near the door, show: `Press ↑ / Enter / Tap to enter`.
- **Assets:** use placeholder shapes/colored rectangles now, loaded by filename from `/public/assets/intro/`: `sky.png`, `skyline.png`, `buildings.png`, `street.png`, `player-idle.png`, `player-walk.png` (spritesheet), `shop.png`, `door.png`. Swapping in real licensed pixel packs later must require only dropping files in. Document expected sizes and frame counts in `/public/assets/intro/README.md`.

## 2. Controls
- Desktop: `→` / `D` to walk; `↑` / `Enter` / `Space` to enter the door. Walking left is allowed but clamped at the start.
- Mobile: tap-and-hold anywhere to walk; tap the door prompt to enter.
- No input for 2.5s → auto-walk so nobody gets stuck.
- A small control hint at the bottom that fades after the first move.

## 3. Transition (after entering)
1. Door opens, camera zooms into the doorway (~0.6s)
2. Full-screen white flash (~0.3s)
3. **Boot screen:** deep space navy `#0B0E17`, faint starfield, `BROWSER_NAME` in Space Grotesk, a thin amber progress bar tied to the main site's real loading (min 0.8s, max 2.5s)
4. Fade into the browser shell

## 4. Placeholder browser shell
`src/components/BrowserShell.tsx`: full-screen dark space background, an empty left vertical icon sidebar, a top tab strip with one tab "New Tab", and a centered "Welcome to [BROWSER_NAME]" message. Keep it minimal; TASK-02 replaces it.

## 5. UX rules
- `Skip intro →` button visible from the first frame (top-right) → jumps to the boot screen.
- After one full intro, set a localStorage flag (wrap in try/catch). Returning visitors see the boot screen only (~1s) plus a small `Replay intro` link.
- `prefers-reduced-motion` → skip the game, show the boot screen only.
- All sounds muted by default, with a small sound toggle.
- Lazy-load Phaser; the first frame must appear immediately.

## File structure
```
src/
  config.ts
  App.tsx                 → state machine: intro → transition → boot → browser
  intro/IntroGame.tsx      → React wrapper that mounts/unmounts Phaser cleanly
  intro/scenes/StreetScene.ts
  intro/Transition.tsx
  intro/BootScreen.tsx
  components/BrowserShell.tsx
public/assets/intro/README.md
```

## Done when
- [x] Full flow works: walk → enter → flash → boot → shell
- [x] Skip, returning-visitor, mobile hold-to-walk, auto-walk, and reduced-motion paths all work
- [x] Placeholder assets can be swapped by dropping files into `/public/assets/intro/`
- [x] No console errors; Phaser instance is destroyed when leaving the intro
- [x] Works at phone width

---

## Outcome

### Deviations from the spec, and why

- **Placeholder art is generated, not flat rectangles.** `scripts/gen-placeholder-assets.mjs`
  (`npm run assets:intro`) writes the eight PNGs procedurally with a dependency-free PNG
  encoder. Same filenames and sizes the spec asks for, so a licensed pack still drops
  straight in, but the street reads as a city from the first run.
- **`shop.png` is 160×120, not an arbitrary size.** `BROWSER_NAME` is configurable, so the
  sign board was widened to 140px and the scene shrinks the font until the name fits.
- **The door prompt reads `Press ^ / Enter to enter`,** not `↑`. Phaser renders it in
  JetBrains Mono and the caret is guaranteed to have a glyph in every fallback font.
  Touch devices get `Tap here to enter` instead.
- **`Replay intro` lives in the browser shell header,** not on the boot screen. The boot
  screen is on for under a second, which is not long enough to click anything.
- **Added: auto-enter after 3s idle at the door.** Auto-walk alone still left a passive
  viewer parked outside the shop forever.
- **No audio files.** The sound toggle drives a small synthesised WebAudio layer
  (`src/lib/sound.ts`). Real samples can replace it behind the same API in TASK-02.

---

## Revision: the cyber cafe (1 Nov)

Amogh's direction after seeing the first version: the shop becomes a **cyber
cafe**. You walk in, sit at a computer, start it, use it like a normal PC, and
open the browser from its desktop. Plus: make it look and play like a proper
game, and make the billboard better.

### What the flow is now

1. **Street** (Phaser): walk to the cyber cafe. Collect up to five voice notes
   (facts from CLAUDE.md; two need a jump). An auto-rickshaw passes. The
   billboard is an animated LED screen: voice waveform, a line of dictation
   typing itself, then the name.
2. **Cafe** (Phaser): the cashier says which seat is free. Eight people are
   already playing; every monitor runs its own tiny game, and the TV shows
   cricket. Sit, power on, and the camera zooms into the monitor.
3. **Cafe PC** (React): BIOS lines, a boot splash with a real-preload progress
   bar, then a desktop: icons, draggable windows (readme, a terminal, recycle
   bin), a start menu, a taskbar with a live clock.
4. **Browser**: opening the icon grows the window out of it to full screen.
   Minimise sends it to the taskbar; close returns to the desktop.

### Paths

- **Skip intro** → boot splash → desktop. The browser opens itself after 7s
  idle, so nobody gets stuck.
- **Returning visitor / reduced motion** → boot splash → desktop → the browser
  opens itself almost immediately.
- **Log off** (start menu) and **Replay intro** (browser) → back to the street.

### Verified in a real browser

Headless Chrome screenshots of every phase (desktop 1600×900 and a 390×844
phone): full walk-through, jump and pickup, skip, returning visitor, minimise,
terminal commands, tap-to-open on touch. Console clean throughout.

Bugs those screenshots caught, all fixed: action-key taps lost between frames;
the browser window stranded half-grown by React's double-invoked effects; the
boot progress bar never drawing (Tailwind v4's `scale` property overriding the
inline transform — the original boot screen had the same bug); the zoom into
the monitor drifting off target; 5px pixel text rendering as mush.

---

## Revision: a whole city, and the jack-in (1 Nov)

Amogh's direction: nothing should move on its own; billboards should hang on
buildings like real ones; more buildings, futuristic cars, a whole cyberpunk
city; no prices in the cafe; and connecting to the PC should be a cyberpunk
"personal link" moment, presented like the Among Us red reveal screen.

- **Nothing moves on its own.** No auto-walk, no auto-entry, no auto-sit, and
  the desktop no longer opens the browser by itself for first-time visitors.
  Only a returning visitor gets the browser opened for them.
- **A street-front row** at the player's depth: eight buildings, each with a
  shop on the ground floor. The signs used to float at a different depth from
  the buildings and slid across them; now every one is mounted - lightboxes,
  rooftop scaffolds, a blade sign on brackets, shop fascias - and lit.
- **Depth:** megastructures on the horizon, then skyline, then mid-rise, then
  the street front, with a haze wash between each layer.
- **Traffic:** two sky lanes of distant flyers, two nearer lanes (sedan,
  flying taxi, police spinner with flashing lights), and two road lanes of
  hover cars in opposite directions, with the auto-rickshaw among them.
- **No prices:** the storefront rate, the in-cafe rates board (now a high
  score board) and the BIOS line are gone.
- **The jack-in** (`LinkScene`): a red alarm flash and shake, black bars
  slamming in around a red striped band, the wrist port opening, the cable
  whipping across into the PC's socket, sparks, LINK ESTABLISHED, data
  pulsing back down the line, then a collapse to black - which is where the
  BIOS starts. Reduced motion gets a still frame, no flashing. The style is
  borrowed, not the art or the words.

## Revision: log off to the cafe, city music, a futuristic cafe (2 Nov)

Amogh's direction: logging off should leave you in the cafe, free to walk
out; every billboard animated like the Wispr board, and the Wispr board
sharper; a night-city song on the sound toggle; a futuristic cafe and PCs;
the bar becomes a cafe; no "printouts"; a smoother way in; something better
than "no food near PCs"; a longer, better jack-in; more life in the city.

- **Log off → the cafe.** The start menu's Log off restarts the game in the
  cafe with the player still in seat 3. They stand up and can sit back down
  or walk left to the EXIT and out to the street, where the doors open and
  they step back onto the pavement. Voice notes already found stay found.
  The browser's "replay intro" still starts from the top of the street.
  A `BootScene` now loads everything once and starts whichever scene the
  visit begins in.
- **Doors and irises.** The cafe has sliding glass doors at both ends of the
  trip. Going in: the doors part, the player steps into the light, an iris
  closes on the doorway and opens again inside. Coming out is the reverse.
- **Every sign animated.** VERA ERP, SECANT, HAZEN and TRUECOMMIT are LED
  boards that roll through what each project is, with chasing bulbs and a
  scan line; THROTTLE lights letter by letter. The Wispr Flow board is
  bigger, set in Silkscreen at exactly 2× so every stroke lands on a whole
  pixel, with no dot-matrix overlay or blurred shadows: waveform, dictation
  typing itself out, then the name with level meters and a shine.
- **City life.** Pedestrians under lit umbrellas on the pavement,
  searchlights sweeping the clouds, drones, and a wireframe hologram globe
  turning above the rooftops.
- **Music.** A synthwave loop synthesised live with WebAudio (no files, nothing
  to license): drums, bass, arpeggio, pad, a lead every other loop, and rain.
  Inside the cafe it is muffled behind a low-pass filter; it stops for the
  jack-in. It follows the sound toggle, which is still off by default and is
  labelled "Music" in the intro.
- **A futuristic cafe.** Hex-panel walls with neon tubes, a neon grid floor,
  ring lights, frameless displays on glass PC cores, egg pods, a cashier in
  an AR visor, a drinks machine, a server rack, a glowing planter. The wall
  signs are holograms: top score, the cricket (still on), a VR pods ad, a
  clock, WELCOME, and CYBER CUP TONIGHT where "no food near PCs" used to be.
  The street's bar is now CHAI & COFFEE; the cafe sign reads
  GAMING / VR PODS / NET.
- **Jack-in, ~5s.** A red room with a hazard banner (LINK REQUEST), the band,
  targeting brackets closing on the wrist with a scan line (SCANNING WRIST →
  PORT FOUND), the port opening, the cable, LINK ESTABLISHED with data
  streaming up the line and a sync bar to 100%, then an RGB slice glitch and
  the collapse to black. Reduced motion still gets a single held frame.
- **Touch:** holding near the left edge now walks left, so a phone can get
  back to the cafe's exit.

Verified in headless Chrome at 1600×900 and on a touch phone in landscape:
the full flow (street → doors → cafe → seat → jack-in → desktop), and log off
→ seat → stand up → exit → street → back in. No console errors.

## Revision: a cyberpunk player, real people, a proper exit (2 Nov)

Amogh's direction: a better hand in the jack-in, and improve it further;
pedestrians that are different from each other and do not overlap the
player; a more cyberpunk player; a nicer way out of the cafe; more cars; a
cafe clock that tells the real time.

- **The player, in techwear.** Graphite jacket with a glowing zip seam, a
  cyan visor across the eyes with a comms bud, the amber high collar, a tech
  pack with a magenta LED strip and an antenna, a glowing wristband (where
  the link port is), knee pads, light-up soles. New front and back views so
  the player can face the camera or turn away in doorways.
- **The hand.** Redrawn at a hand's real proportions, about three times as
  long as it is deep: back of the hand domed to the knuckles, four fingers
  stacked as they look side on, the thumb along the underside, nails. The
  wrist is now a chrome implant with the port set into it and a light strip
  round it; the sleeve is long enough to run off the screen on any width.
- **The jack-in, further.** Data falling in the background of the band, the
  scan typing out what it reads (user, implant, seat) on a leader line, the
  implant's strip lighting as the scan finds it and flashing as each packet
  arrives, and the fingers twitching as the link takes.
- **Doors, both ways.** Going in: walk to the doors, turn your back, they
  part, you walk in and they close in front of you, then the iris. Coming
  out: the iris opens on the doors, they part, you step out facing the
  camera, they close behind you, you turn to the street. Same in the cafe,
  where rain falls past the open doorway and the street's light spills
  across the floor.
- **People.** Seven kinds: two under umbrellas, a runner in an LED mask, a
  courier with a lit box, a trench coat with a visor, someone lost in their
  phone, and a delivery robot. They walk the back of the pavement, behind
  the player, slow down and stop short instead of walking through them, and
  carry on past only if the player stays put. Never the same kind twice in
  a row.
- **Traffic.** On the road: a hover bike, a delivery van, a chrome coupe and
  a night bus join the sedan, pickup, sports car and auto. In the sky: a
  cargo drone and a racer.
- **The clock** shows the visitor's own time to the second, 12-hour, with
  the day and date.

Verified in headless Chrome at 1600×900 and on a touch phone in landscape:
both door sequences, log off → exit → street, the jack-in, people yielding.
No console errors.
