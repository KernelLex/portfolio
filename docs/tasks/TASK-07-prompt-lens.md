# TASK-07: Prompt Lens (voice → engineered prompt)

> Read CLAUDE.md §6–7 first. Uses the voice utilities from TASK-03. Timebox: ~2–3 hours.

## Goal
Speak a messy idea through Wispr Flow and get a clean, structured, prompt-engineered prompt back. Show the full pipeline: **raw speech → Wispr clean text → engineered prompt.** This is Amogh's own tool, and it was used to build this site.

## Layout (three panels; stacked on mobile)
1. **🎙️ Live speech (raw):** optional; uses `useLiveSpeech` to stream interim words while the visitor speaks (filler words and all). A "Start live view" button; note that it only works in Chrome/Edge.
2. **⚡ Wispr Flow (clean):** a Wispr-ready textarea ("Hold your Wispr key and ramble about what you want an AI to do"). Shows `VoiceBadge` + WPM. Typing also works.
3. **✨ Engineered prompt:** the output, in sections: Role · Context · Task · Constraints · Output format · Examples (if useful) · Clarifying questions (if the input is vague). Buttons: Copy, Open in ChatGPT, Open in Claude (open a new tab with the prompt in the URL where supported; otherwise copy + open).

## Controls
- Mode picker: Coding · Research · Writing · Image · General
- "Enhance" button (also auto-runs ~1s after a Wispr voice chunk lands)
- A "Before / after" toggle that highlights what was added

## Backend
- `POST {VITE_API_URL}/api/prompt-lens` with `{ text, mode }` → `{ prompt }`.
- If `VITE_API_URL` is unset or the call fails: use a **local rule-based fallback** that fills the sections from the text with a template, clearly labelled "offline mode".
- The system prompt for the backend lives in `backend/prompts/prompt-lens.md` (write it): rewrite the user's spoken idea into a structured prompt; keep their intent; never add facts; ask clarifying questions when the input is vague; output in the section format above.

## Footer note
"Built by Amogh because raw speech makes messy prompts. He used it to build this site." Link: "See the receipts →" (Voice Receipts).

## Done when
- [ ] Wispr/typed input → engineered prompt (backend or offline fallback)
- [ ] Live raw view works in Chrome; degrades gracefully elsewhere
- [ ] Copy / open buttons work; works on phone width
