# TASK-06: Client Work (case studies)

> Read CLAUDE.md §3 projects first. Timebox: ~2 hours. Content in `src/content/work.ts`.

## Goal
A grid of case-study cards; each opens its own subpage (`amogh://work/<slug>`) inside the same tab.

## Case studies
| Slug | Name | Link | Notes |
|---|---|---|---|
| vera-erp | Vera ERP | `[TODO: confirm public link]` | Flagship. Problem: a director couldn't see across multiple companies. Built: one ERP + private AI on local Ollama. Usage numbers `[TODO: confirm]`. |
| hrms | HRMS module | `[TODO: repo/live link from Amogh]` | HR module that plugs into a client's own ERP without passing credentials over APIs. |
| secant | Secant | https://secant.in | First client after 6 months of zero. 3D interactive architecture site (WebGL, GSAP, Three.js). |
| hazen | Hazen Lights | https://hazenlights.com | Lighting brand + e-commerce with custom 3D animation. "No AI slop." |
| iiwm | IIWM Bangalore | **no link** | Wedding business school marketing site, "Atelier" editorial design. |
| bogen-villa | Bogen Villa | **no link** | Wedding venue website. |

## Card
Cover image `[TODO: /public/images/work/<slug>.jpg]` (fallback: a gradient with the name in big type), name, one-line hook, tags (stack/industry), "Live" or "Private client" badge.

## Subpage template
1. Hero: name, hook, badges, live link button (if any) or "Private client: link not shared"
2. **Problem** → **What we built** → **Result** (only real outcomes; `[TODO]` if unknown)
3. Video/screens: an embedded video if `[TODO: video URL]` is provided, otherwise screenshots/gallery
4. Stack chips
5. "What I learned" (one line, `[TODO]` if not provided)
6. Next/previous case study links + "Ask Amogh about this →" (opens Ask Amogh prefilled with "Tell me about <name>")

## Done when
- [ ] Grid + all 6 subpages render from content
- [ ] No links for IIWM and Bogen Villa
- [ ] Missing media handled gracefully; works on phone width
