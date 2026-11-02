# TASK-09: Voice Receipts (proof of voice-first building)

> Timebox: ~1.5 hours. Content in `src/content/receipts.ts`.

**Status (2 Nov):** Real prompts copied verbatim from the Claude Code session logs, each linked to its commit in the public repo (`src/content/receipts.ts`).

## Goal
A build log proving the site was built by voice. Each entry shows: **what Amogh said (raw Wispr dictation) → the prompt that went to Claude Code / Emergent → what got built.**

## Entry fields
`{ id, date, tool: "Claude Code" | "Emergent" | "Prompt Lens", spoken: string, prompt?: string, result: string, screenshot?: string, clip?: string, wpm?: number }`

## Layout
- A vertical timeline in JetBrains Mono, styled like a terminal/receipt in the space theme.
- Each entry is a card: date + tool chip; a "🎙️ Said" block (raw dictation, filler words included); an arrow; a "⚙️ Built" block (result + optional screenshot/clip).
- Top summary stats (computed from entries): total entries, total spoken words, average WPM if available, "% of prompts spoken: 100%".
- Filter by tool.
- A short intro line: "Every prompt that built this site was spoken through Wispr Flow. Here are the receipts."

## Content
- Seed 3 example entries marked `[TODO: replace with real Wispr transcripts]`.
- Amogh will paste real transcripts from his Wispr Flow history and add screenshots to `/public/images/receipts/`.

## Done when
- [ ] Timeline + stats + filter render from content
- [ ] Adding an entry = editing one content file only
- [ ] Works on phone width
