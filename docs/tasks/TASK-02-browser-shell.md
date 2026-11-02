# TASK-02: Browser shell (replace the placeholder)

> Read CLAUDE.md first (§4 design system, §5 global components). Timebox: ~3 hours.

**Status: done (2 Nov).** See "Outcome" at the bottom.

## Goal
Replace the placeholder `BrowserShell.tsx` with the real "Amogh Navigator" browser: an Opera GX-style layout (left icon sidebar, top tab strip, address bar) in the calm deep-space style. Original design, no Opera assets.

## Build
1. **Theme tokens:** CSS variables + Tailwind theme from CLAUDE.md §4 (navy `#0B0E17`, amber `#F5A35C`, off-white text, muted gray, glass surfaces, hairline borders). Load Space Grotesk, Instrument Serif, and JetBrains Mono.
2. **Page registry** `src/pages/registry.ts`: one entry per page `{ id, title, icon, url: "amogh://<id>", component (lazy), priority }`. Pages: `home, amoghpedia, story, work, prompt-lens, ask, receipts, shorts, side-builds, control`. Pages not built yet render a tasteful "Under construction 🚧" placeholder.
3. **Left icon sidebar:** a slim vertical strip with an icon per page (lucide-react icons), a tooltip label on hover, and an amber indicator on the active page. Bottom of the sidebar: sound toggle, "?" (guide), settings.
4. **Tab strip:** opening a page adds a tab (or focuses the existing one); tabs can be closed and switched. "New Tab" = home. Persist open tabs in localStorage (try/catch). Max ~6 tabs, oldest closes first.
5. **Address bar:** shows `amogh://<id>` in JetBrains Mono, with back/forward/reload buttons that work on tab history. It's a **voice address bar**: a Wispr-ready input where typing or dictating e.g. "open client work" / "show me your story" / "ask amogh" navigates by simple keyword matching against page titles + aliases. Unknown input → open Ask Amogh with that text prefilled.
6. **Live wallpaper:** a lazy-loaded React Three Fiber starfield behind everything: slow drift, slight mouse parallax, very subtle. Paused when the tab is hidden; static gradient under reduced motion.
7. **UI sounds:** soft click on tab open, whoosh on page switch. Muted by default; tiny files in `/public/sounds/`.
8. **Guide figure:** the pixel character from the intro, bottom-left, with a speech bubble. 4 tips on first visit, one at a time, each dismissible ("Next" / "Got it"):
   - "Welcome to Amogh Navigator. Every tab is a part of my life."
   - "On the home page, hold your Wispr key and say anything."
   - "Questions? Ask Amogh, my AI twin, has answers."
   - "Psst… try the address bar. You can talk to it too."
   Reopen via the "?" button. Seen-state in localStorage. Optional voice-line audio at `/public/audio/guide-1.mp3`… (play only if sound is on).
9. **Mobile:** sidebar becomes a bottom tab bar (5 main icons + "more"); the tab strip collapses to the current page title; the address bar stays.
10. **Page transitions:** a quick fade/slide between pages (GSAP), disabled under reduced motion.

## Done when
- [ ] All registered pages open as tabs from the sidebar and the address bar
- [ ] Voice/text navigation works for each page's title + aliases
- [ ] Wallpaper, sounds, and guide behave as specified
- [ ] Looks right on desktop and phone width; keyboard navigable with visible focus

---

## Outcome

Code lives in `src/browser/` (the shell), `src/pages/` (registry, New Tab, the
under-construction stand-in) and `src/voice/detect.ts`. Words are in
`src/content/pages.ts`, `browser.ts`, `guide.ts` and `home.ts`.

### Deviations from the spec, and why

- **Starfield is plain three.js, not React Three Fiber.** R3F printed a
  `THREE.Clock` deprecation warning with current three.js, and the starfield is
  one draw call. Plain three gives a smaller chunk (~132 KB gzip, lazy) and
  direct control of the render loop. CLAUDE.md §8 allows either.
- **Sounds stay synthesised** (`playClick` on tab open/close, a new noise-based
  `playSwoosh` on page change). Nothing to license, nothing to download.
- **Address bar routing:** questions ("Why did you…?", "Tell me about…") go to
  Ask Amogh with the question prefilled even when they mention a page; nav verbs
  ("open", "show me", "take me to") go to the page. A Wispr chunk navigates on
  its own after 0.9s because Wispr does not press Enter.
- **Voice detection** (`src/voice/detect.ts`) counts a single insert *or* a burst
  of inserts under 40ms apart, 12+ characters. That covers Wispr whether it
  pastes or types: still to be confirmed with real Wispr on Windows.
- **Tabs:** the sidebar and speed dial focus a tab already showing that page; the
  address bar navigates the current tab (real browser history: back, forward,
  reload). "+" focuses or opens New Tab.
- **The guide shows only while its tips are open** so it never covers page
  content; "?" brings it back. Each tip rings the part of the browser it is about.
  Voice lines: add `audio: 'audio/guide-1.mp3'` to a tip in `content/guide.ts`.
- **Settings** holds Replay the intro, Close all tabs, and a one-line privacy note.
- **Home** is a welcome plus speed dial for now; TASK-03 puts the lyric stage on top.

### Verified
- Typecheck and production build pass.
- Desktop and phone flows screenshot-tested: tabs, sidebar, tooltips, guide,
  voice-style insert → auto-navigate, back/forward, question → Ask, settings,
  More sheet, tab switcher.
- Starfield stops drawing when minimised (0 draws/s) and is absent under
  reduced motion. Tab churn soak: event listeners flat, no DOM growth beyond
  Chrome's own undo history for typed text.
- Intro → cafe → PC → browser, and log off → cafe → street, still clean.

