# TASK-05: The Story (scroll-driven animated story)

> Read CLAUDE.md §3 story arc first. Timebox: ~3 hours. Content in `src/content/story.ts`.

## Goal
A scroll-driven animated story of Amogh's journey with optional voiceover. It should feel like a short animated film the visitor scrolls through. GSAP ScrollTrigger, space theme, Instrument Serif for big lines.

## Scenes (one full-height section each; text pinned while visuals animate)
1. **"I picked freedom."** Chose B.Sc. over engineering to explore. Visual: paths splitting; he takes the open one.
2. **"Then the classroom got quiet."** After year one the curriculum thinned, so he stopped waiting. Ownership framing only, no blame.
3. **"Six months. Zero clients."** A counter stuck at 0, crossed-out pitches, months ticking by. This is the hardest moment; give it weight.
4. **"Then: one yes."** Secant → a 3D wireframe building assembles (lightweight SVG/CSS or a tiny Three.js line model).
5. **"One yes became another."** Hazen Lights → light beams sweep on. Line: "No AI slop. Every site one of a kind."
6. **"Weddings, venues, and a few lost clients."** IIWM + Bogen Villa (no links), plus honesty about lost clients.
7. **"The pivot."** While building websites, he listened to people inside the company and found a director drowning across multiple companies. Visual: scattered dashboards merge into one.
8. **"Vera ERP."** One place for every company, plus a private AI trained on their data. Numbers marked `[TODO: confirm]`.
9. **"Then HRMS."** An HR module that plugs into a client's own ERP without passing credentials over APIs.
10. **"Why I do this."** Not just for clients: to understand industries, find what he loves, and grow.
11. **"Still building."** Ends with buttons: "See the work →" (Client Work) and "Ask me anything →" (Ask Amogh).
12. **Mistakes slot:** `[TODO: Amogh's personal mistake + lesson]`, inserted between scenes 6 and 7 once provided.

## Voiceover
- One audio file per scene at `/public/audio/story/scene-XX.mp3` (optional; if missing, skip silently).
- A "🔊 Play with my voice" toggle (off by default). When on, each scene's audio plays as it enters view and stops when it leaves.
- Show captions with the same text (accessibility + muted users).

## Extras
- Progress bar at the top (amber), with scene dots to jump around.
- Reduced motion → static sections with simple fades.
- Phone: no heavy pinning; stacked scenes with light animations.

## Done when
- [ ] All scenes render from the content file with smooth scroll animation
- [ ] Voiceover toggle works with placeholder/missing audio handled gracefully
- [ ] Ends with working CTAs; works on phone width
