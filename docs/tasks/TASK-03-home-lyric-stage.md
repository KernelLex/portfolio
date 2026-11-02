# TASK-03: Home page: kinetic lyric stage + voice detection

> Read CLAUDE.md §6 first. Timebox: ~3–4 hours. This is the hero, so polish matters.

**Status: done (2 Nov).** See "Outcome" at the bottom.

## Goal
The home page (New Tab) is a stage where whatever the visitor says through Wispr Flow is performed as expressive kinetic typography, inspired by the Cotodama Lyric Speaker (original design, nothing copied). Below the stage: quick-link tiles to the main pages.

## Shared voice utilities (build first, reused by other pages)
`src/voice/`:
- `useWisprInput()`: hook for any textarea/input. Detects voice-style insertion: a single `input`/`beforeinput` event inserting ≥ ~15 characters (and not a paste from the clipboard event) → `isVoice = true`. Returns `{ text, isVoice, lastChunk, wpm }`.
- **WPM estimate:** words in the chunk ÷ time since the field gained focus or the last chunk (clamp to sensible bounds). Label it "estimated".
- `VoiceBadge`: "⚡ Voice input detected · ~162 WPM (typing avg ~40)". Animates in, fades after 4s.
- `useLiveSpeech(lang)`: Web Speech API wrapper with `interimResults: true` → `{ interim, final, start, stop, supported }`. Languages: en-IN default, hi-IN, kn-IN selectable.
- `FallbackMic`: a button using `useLiveSpeech` for visitors without Wispr. Small note: "Uses your browser's speech recognition."
- `WisprHint`: a small "🎙️ Hold your Wispr key and talk" label.

## Lyric stage
1. A full-width stage area. A hidden-but-focused textarea captures Wispr text when the stage is clicked/focused (show "Click here, then hold your Wispr key and speak").
2. On new text: split into phrases (at punctuation, or every 3–6 words) → words.
3. Each phrase plays as a **scene** (GSAP timeline), picked by rules + randomness:
   - Giant single word (1–2 word phrases)
   - Vertical stack
   - Scatter collage
   - Word-by-word pop
   - Sliding ribbon
   - Split screen (two halves)
4. **Emphasis rules:** long words larger/heavier; `?` → tilted layout; `!` → punch-in + slight shake; numbers count up; ALL CAPS → max size.
5. **Fonts:** rotate between Space Grotesk (bold), Instrument Serif (italic), JetBrains Mono, and one condensed display face, switching per phrase.
6. **Pacing:** each word's duration is based on its length; pauses at commas/full stops; the whole performance auto-advances.
7. **Mood color:** a small keyword list (happy/excited/sad/calm) shifts the stage's background gradient within the space palette. Amber stays the main accent.
8. **Demo on load:** if nobody has spoken yet, auto-play: "Six months. Zero clients. Then everything changed." Loop gently until the visitor speaks.
9. **Live preview (optional, if time):** a "Live mode" toggle uses `useLiveSpeech` to show raw interim words faintly while speaking, then Wispr's clean text performs on release.
10. A small "Replay" button and a "Try saying something in Hindi or Kannada" hint.

## Quick links below the stage
Tiles for Amoghpedia, The Story, Client Work, Prompt Lens, Ask Amogh, Voice Receipts. Glass cards, amber hover. Each opens its tab.

## Done when
- [ ] Speaking through Wispr (or typing a sentence in one paste-like chunk) triggers a performance
- [ ] At least 5 distinct scenes; emphasis rules visible
- [ ] Voice badge + WPM appear on voice input
- [ ] Demo line plays on load; reduced motion → simple fade-in text
- [ ] Works on phone width

---

## Outcome

Stage: `src/pages/home/LyricStage.tsx`; engine in `src/pages/home/lyrics/`
(`phrases.ts` splits and scores text, `scenes.ts` has the six scenes,
`perform.ts` runs them). Words in `src/content/lyrics.ts`. Voice kit in
`src/voice/` (`useWisprInput`, `VoiceBadge`, `useLiveSpeech`, `FallbackMic`,
`WisprHint`), reused by the address bar.

- Six scenes: giant word, vertical stack, scatter collage, word-by-word pop,
  sliding ribbon (with a ghost ribbon behind), split screen. Never the same
  scene twice running.
- Emphasis: long words bigger, ALL CAPS biggest, "?" tilts the layout, "!"
  punches in with a shake, numbers count up in amber (Indian digit grouping
  kept: 2,15,867).
- Four faces rotate per phrase: Space Grotesk bold, Instrument Serif italic,
  Big Shoulders Display (the condensed face, added to the fonts), JetBrains Mono.
- Mood: a phrase with a keyword tints the stage (bright, low, calm).
- The demo loops until the visitor speaks; the stage pauses while scrolled away.
- Deviation: the text field is visible under the stage rather than hidden, so
  typing and screen readers work; clicking the stage focuses it.
- The fallback mic says honestly that Chrome's recogniser sends audio to Google;
  the site itself never records or stores audio.
- WPM: words over time since focus or the last chunk, shown only between 60 and
  400 WPM and labelled estimated. A status bar at the bottom of the browser shows
  the last voice reading.
- Soak: a minute of demo loops and a 40-word dictation leave no layers behind;
  console clean. Reduced motion performs as plain fades.
