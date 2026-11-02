# TASK-04: Amoghpedia (playful, polished Wikipedia-style page)

> Read CLAUDE.md §3 (content) first. Timebox: ~2 hours. Content lives in `src/content/amoghpedia.ts`.

## Goal
An interactive, encyclopedia-style article about Amogh. Familiar structure, nicer to look at, with playful touches. Original styling in the space theme: Instrument Serif headings, comfortable reading width, glass infobox. Do not copy Wikipedia's logo or exact look.

## Layout
- **Title:** "Amogh P" with a subtitle like "From Amoghpedia, the free encyclopedia nobody asked for".
- **Infobox (right on desktop, top on mobile):** photo `[TODO: photo at /public/images/amogh.jpg]`; Born/Based: Bengaluru, India; Education: B.Sc. (Hons) Data Science, RV University (2023–2027); Occupation: full-stack & systems engineer, freelancer, Software Developer at Vera; Languages: English, Kannada, Hindi, Telugu, Tamil; Known for: Vera ERP, TrueCommit (₹2,15,867 recovered), 3D client websites; Team size: 2 (him + a friend).
- **Contents box:** sticky on desktop; links scroll to sections with a smooth highlight.
- **Sections:**
  1. Early life and education (why B.Sc. over engineering: freedom to explore)
  2. Going into the field (curriculum thinned after year one → took ownership; ownership framing only)
  3. Freelance career (6 months, zero clients → Secant → Hazen Lights → IIWM, Bogen Villa)
  4. The pivot to systems (Vera ERP, HRMS)
  5. Side projects (short list, each linking to Side Builds)
  6. Hackathons (top 10 at multiple national hackathons; Razorpay AI Buildathon 2026)
  7. Personal life (trading on Zerodha Kite, 3D printing with a Bambu Lab P1S, a home server, a jewelry business idea)
  8. Philosophy ("software that holds when something breaks"; "measure what can be measured, label what can't")
  9. See also: links that open other tabs (The Story, Client Work, Ask Amogh…)
- **Citations:** superscript [1], [2]… Hover/tap shows a popover with the source (a live link, GitHub repo, or "Source: Amogh's own memory").
- **Playful touches (3–5, tasteful):** e.g. "[citation needed]" on "makes the best chai in the team"; an "This article has multiple issues: the subject keeps shipping new projects" banner; "last edited 4 minutes ago by Amogh (voice)". Mark every joke line `[TODO: confirm]` so Amogh approves them.
- **Hover link previews:** hovering an internal link shows a small preview card of that tab.

## Rules
- Only facts from CLAUDE.md §3. Anything missing → `[TODO: ...]`.
- No IIWM / Bogen Villa links. Vera numbers stay `[TODO: confirm]` until Amogh approves.

## Done when
- [ ] All sections render from the content file
- [ ] Infobox, contents, citations, previews, See also all work
- [ ] Reads well on a phone
