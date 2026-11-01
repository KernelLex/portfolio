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
