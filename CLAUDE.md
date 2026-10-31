# CLAUDE.md: Amogh Navigator (Wispr Flow Hiring Challenge Portfolio)

> Read this whole file before doing anything. It is the single source of truth for this project.
> Work on one TASK file at a time. Don't build features from later tasks unless asked.

---

## 1. What this project is

An interactive portfolio website for **Amogh P**, built for the **Wispr Flow Hiring Challenge with Emergent** (India growth team: internship / full-time).

The challenge brief: *"Build the most creative portfolio of yourself with voice."* Wispr Flow wants to see who the candidate really is (chances taken, mistakes learned from, what they care about, how they think), built **by voice** using Wispr Flow.

**Concept: "Amogh's Internet."** The site is a custom browser called **Amogh Navigator** (name stored in `src/config.ts` as `BROWSER_NAME`, which may change). Each browser tab is its own page and tells one part of Amogh's story.

**Entry experience:** a short playable pixel side-scroller through a **loud neon cyberpunk night city**. The player walks into a shop, the screen flashes white, and they land in a **calm, space-themed browser**. The contrast is intentional: *out of the noise, into my space.*

### Hard deadlines
- Challenge: 28 Oct – **4 Nov 2026** (submissions close)
- Shortlist: 5 Nov · Hire announced: 20 Nov
- Build window is ~3.5 days. **Scope discipline matters more than features.**

### What gets submitted
1. Public link to the portfolio (must be new, publicly accessible)
2. A video of 3 minutes max: what was built, why, and the value of using voice
3. What Amogh would do with a $3,000 work-setup grant

### How submissions are judged
1. **Creativity**: how creatively the candidate shows who they are
2. **Use of voice**: how voice brings ideas to life and what it adds to the build process
3. **Extreme ownership**: spotting opportunities, taking initiative, following through
4. **Work over credentials**: what they've made happen, not degrees
5. Clear communication in the video and the ability to build independently

**Every feature should serve at least one of these.** If it doesn't, cut it.

---

## 2. Build workflow (important)

- Amogh builds **by voice**: every prompt to Claude Code is dictated through **Wispr Flow**. Wispr verifies voice usage via the recording and Flow account activity.
- **Claude Code** builds the frontend (browser shell, all tabs, animations, game).
- **Emergent** (emergent.sh, the challenge sponsor) is used for: the **LLM backend endpoint** (Prompt Lens + Ask Amogh) and **deployment**. Code reaches Emergent via GitHub (push here → "Pull from GitHub" in Emergent).
  - Emergent credits are limited (~60, and deploying costs ~50). Keep the backend tiny.
  - Fallback if Emergent GitHub import or deploy fails: host the frontend on Vercel/Netlify.
- Keep the repo pushed to GitHub regularly.
- Frontend must work **without** the backend (graceful fallbacks, mock responses) so development isn't blocked.

---

## 3. About Amogh (content source)

- **Amogh P (Amogh Prashanth)**, Bengaluru. B.Sc. (Hons) Data Science, RV University (2023–2027), CGPA 8.24.
- Speaks **English, Kannada, Hindi, Telugu, Tamil** (relevant: Wispr India is pushing Hinglish and regional languages).
- Self-description: full-stack and systems engineer who builds software that holds when something breaks; measures what can be measured and labels what can't.
- Top 10 at multiple national-level hackathons. 7 roles before graduating.
- GitHub: github.com/KernelLex · LinkedIn: linkedin.com/in/amogh-prashanth-393b37319

### The story arc (core narrative)
1. **Why B.Sc., not engineering:** wanted freedom to explore. Loves building things that make life easier for himself and others.
2. **Turning point:** after year one the curriculum thinned out, so he stopped waiting and went into the field early. **Frame this as ownership, never as blaming the college.**
3. **The freelance grind** (Amogh + one friend, a two-person team):
   - Websites first, as an "easy market to enter". **6 months, zero clients.**
   - First client: **Secant** (architecture) → 3D interactive site. https://secant.in
   - Led to **Hazen Lights** (architectural lighting). Refused to make generic "AI slop" sites, so it got custom 3D. https://hazenlights.com
   - Wedding business: **IIWM** (wedding business school) site + **Bogen Villa** (venue) site. **Describe only, no links.**
   - Lost a few clients along the way.
4. **The pivot, from websites to real problems:** while doing websites, he talked to people inside a client company and found a director struggling to see across his multiple companies. He pitched and built **Vera ERP**, one place for everything plus a private AI trained on company data.
5. **HRMS client:** a client who sells his own ERP wanted a separate HR module linked into it without passing credentials over APIs. Built and delivered.
6. **Why he does it:** not just for clients. To understand industries in depth, find his own interests, and grow.
7. **Side builds:** constantly building small projects to learn, to solve his own problems, or just for fun.

### Projects (details for case studies)
- **Vera ERP:** multi-company ERP (Vera Enterprises, Schönes Leben, Hagan Modular). ERPNext v15 + Frappe HRMS headless behind a React/TS/Tailwind SPA. HR, sales → quotation → projects, purchase, logistics, Tally finances, Google Drive docs. Local Ollama AI assistant (data never leaves the server). Jibble attendance. Bare-metal Ubuntu + nginx + Cloudflare Tunnel. **Usage: ~41 employees on the system, ~10 active users, one company used as the test bed. Main testing phase. (Confirm wording with Amogh before publishing numbers.)**
- **HRMS:** Indian HR suite: payroll, leave, hiring, performance, income tax incl. Form 16, bitemporal records, dual-approval bank changes, WCAG 2.1 AA. Next.js, Drizzle, libSQL. (Repo link to be provided.)
- **TrueCommit** (Razorpay AI Buildathon 2026, Track 03): bounded autonomous revenue-recovery agent. "The LLM sees and speaks but never spends." 7 agents, hash-chained ledger, 20-rule gate. **5 real Razorpay invoices, all paid, ₹2,15,867 captured.** Live: truecommit-tawny.vercel.app
- **Promise Keeper:** earlier measured version: 88.6% promise extraction, 721 tests, honest simulated-vs-real labelling.
- **Throttle:** production email scheduler, zero loss across restarts, Redis Lua rate limiting, circuit breaker proven in a real SMTP outage. Live: throttle-delta.vercel.app
- **Avika:** free offline Android app for Bengaluru parents of children with disabilities (clinics, sensory-friendly venues, schemes, UDID). No account, ads, or analytics.
- **CropRadar:** Telegram bot giving farmers crop-disease risk; diagnoses leaf photos in English and Kannada.
- **Trading Strategy Engine:** prices + news + macro + Reddit → FinBERT sentiment → LLM hypotheses → backtests with SHAP.
- **LeadScope:** ethical B2B prospect research dashboard.
- Internships: Gojeta (automation), RVU (app dev, research: YOLOv5), ChaturManas (web), Internshub (AI), MasterCom (data).
- Interests: trading (Zerodha Kite), 3D printing (Bambu Lab P1S), home server, jewelry business idea.

### Content still pending from Amogh
- Project video catalog + links (for Shorts)
- HRMS repo link
- Mistakes he personally made (for The Story / Incognito)
- Photos, voiceover recordings, guide-character voice lines
- Final browser name

**Never invent facts, numbers, clients, or quotes.** Use clearly marked placeholders (`[TODO: ...]`) when content is missing.

---

## 4. Design system

### Two worlds
| | Intro game (outside) | Browser (inside) |
|---|---|---|
| Mood | Loud neon cyberpunk night city | Calm, deep space |
| Style | Pixel art, rain, flickering neon, parallax | Frosted glass, hairlines, slow motion |
| Link between them | The shared **amber accent** appears in both (e.g. the shop sign) | |

### Browser palette
- Background: deep space navy `#0B0E17` (not pure black); elevated surfaces slightly lighter
- Accent: **amber `#F5A35C`**, used sparingly. No neon glows inside the browser.
- Text: off-white primary, muted gray secondary
- Surfaces: frosted glass panels (`backdrop-blur`), 1px hairline borders at low opacity
- Define colors as CSS variables / Tailwind theme tokens

### Typography (Google Fonts)
- UI: **Space Grotesk** (or Sora)
- Big story moments + Amoghpedia headings: **Instrument Serif** (or Fraunces)
- URLs, stats, logs: **JetBrains Mono**
- Intro game: a pixel font

### Motion
- GSAP, slow ease-out, smooth. Nothing aggressively flashing or pulsing inside the browser.
- Respect `prefers-reduced-motion` everywhere.

### Layout inspiration
**Opera GX's layout** (left icon sidebar, top tab strip, speed-dial home, control panel with gauges, live wallpaper, UI sounds), **without** its neon gamer styling, and **without copying Opera's logo, red color, icons, or UI skin.** Everything is original.

### Responsive
- Desktop-first, but must work on phones: the left sidebar becomes a bottom tab bar; the game uses tap-and-hold.

---

## 5. Site map

### Global components (present in the browser on every page)
| Component | Behavior |
|---|---|
| **Browser frame** | Window chrome, tab strip, address bar showing `amogh://<page>`, back/forward |
| **Left icon sidebar** | One icon per page; hover shows label; click opens the page as a tab |
| **Tab strip** | Multiple pages can be open as tabs; switch/close like a real browser |
| **Voice address bar** | Wispr-ready input; typing or speaking "open client work" navigates (simple keyword matching) |
| **Wispr-ready hints** | 🎙️ badge on every text input |
| **Wispr detector + WPM meter** | Detects voice-style input and shows live WPM (see §6) |
| **Fallback mic** | Web Speech API button for visitors without Wispr |
| **Live wallpaper** | Subtle slow Three.js starfield with slight mouse parallax. Must never compete with content. |
| **UI sounds** | Soft clicks/whoosh, **muted by default**, toggle in the frame |
| **Guide figure** | The pixel character from the intro; 3–4 dismissible onboarding tips; reopen via "?" |
| **Retro easter egg** | Hidden shortcut switches the site into a Netscape / Windows 98 skin (stretch goal) |

### Pages / tabs
| Priority | Tab | Contents |
|---|---|---|
| 🔴 Must | **New Tab (home)** | **Kinetic lyric stage** (Cotodama Lyric Speaker-inspired): visitor speaks through Wispr, and their words animate as expressive typography. A demo line auto-plays on load. Quick-link tiles to the other pages below. |
| 🔴 Must | **Amoghpedia** | Interactive Wikipedia-style article. **Tone: playful but polished.** Infobox (photo, education, languages, known for), sections, hover citations, playful "[citation needed]" jokes, "See also" links to other tabs. |
| 🔴 Must | **The Story** | Scroll-driven animated story with Amogh's voiceover, following the arc in §3. |
| 🔴 Must | **Client Work** | Case-study cards, each with its own subpage: Secant, Hazen Lights, IIWM, Bogen Villa (no links for these two), Vera ERP, HRMS. Format: problem → what we built → result → link/video. |
| 🔴 Must | **Prompt Lens** | Voice-to-prompt tool (see §6). |
| 🔴 Must | **Ask Amogh** | AI twin chat answering from a life-story knowledge doc. Talks like Amogh, admits what it doesn't know, links to relevant tabs, clearly labelled as AI. |
| 🔴 Must | **Voice Receipts** | Build log: raw Wispr dictation → the prompt → what got built. Proof of voice-first building. |
| 🟡 Nice | **Shorts** | Vertical swipe feed of project videos (Reels/Shorts-style, but original styling) |
| 🟡 Nice | **Side Builds** | Grid: TrueCommit, Throttle, Avika, CropRadar, Trading Engine, LeadScope |
| 🟡 Nice | **Amogh Control** | GX-control-style dashboard: gauges for projects shipped, clients, ₹2.16L recovered, 5 languages, live visitor WPM |
| 🟢 Optional | **Incognito** | Mistakes + lessons (can be folded into The Story) |
| 🟢 Optional | **Wrapped** | Year-in-review stat cards |
| 🟢 Optional | **Campaign** | One growth idea for Wispr Flow India (high value for a growth role) |

---

## 6. Voice / Wispr Flow features (no Wispr API)

The Wispr Flow API is enterprise/partner-only and not available. **Key fact: Wispr Flow types its finished, cleaned-up text into whatever text box is focused, after the user releases the hotkey.** Wispr does not stream words live. The site is designed around this.

1. **Wispr-ready inputs:** every input expects voice. Visible hint: "Hold your Wispr key and talk."
2. **Wispr detector:** Wispr inserts a whole chunk in one input event; typing arrives key by key. Detect large single-event insertions (e.g. `InputEvent` with many characters at once) → show "⚡ Voice input detected". Present it as a heuristic, not proof.
3. **WPM meter:** estimate words per minute from voice input and compare to the ~40 WPM typing average.
4. **Live words view:** the browser Web Speech API (`interimResults: true`) shows raw words *while* speaking (Chrome/Edge; en-IN, hi-IN, kn-IN). Show it alongside Wispr's clean output: **raw speech → Wispr clean → engineered prompt.** Optional: run both at once (test mic sharing early).
5. **Prompt Lens:** messy spoken idea → structured prompt (role, context, task, constraints, output format, examples, clarifying questions if vague). Mode picker (coding / research / writing / image). Before/after view. Copy + open in ChatGPT/Claude. LLM call goes through the Emergent backend endpoint; mock response if offline.
6. **Kinetic lyric stage (home):** hidden textarea captures Wispr text → split into phrases/words → GSAP "scenes" (giant single word, vertical stack, scatter, word-by-word pop, sliding ribbon, split screen). Rule-based emphasis: long words bigger, `?` tilted, `!` punch-in, numbers count up, short phrases huge and centered. Font switches between phrases. Speech-like pacing with pauses at punctuation. Mood color from a small keyword list. Original design, inspired by Cotodama, not copied.
7. **Fallback mic** everywhere for visitors without Wispr.

---

## 7. Backend (Emergent, minimal)

- One small API with two endpoints:
  - `POST /api/prompt-lens`: `{ text, mode }` → `{ prompt }`
  - `POST /api/ask`: `{ message, history }` → `{ reply, suggestedTab? }`, grounded in `content/life-story.md`
- API keys live only on the backend.
- Frontend reads the backend URL from an env var, and falls back to mock responses when unset.

---

## 8. Tech stack

- **Vite + React + TypeScript + Tailwind**
- **GSAP** for animation
- **Phaser 3** (lazy-loaded) for the intro game
- **Three.js / React Three Fiber** for the starfield wallpaper
- **React Router** (or a simple tab state machine) for pages
- Content in `src/content/*.ts` or `content/*.md`, separate from components, so text edits never require touching component code
- Browser storage (`localStorage`) only for small conveniences (intro seen, sound on/off, open tabs), always wrapped in try/catch

---

## 9. Build order

1. **Intro game preloader + boot screen** → lands on a placeholder browser shell (TASK-01)
2. **Browser shell:** sidebar, tabs, address bar, wallpaper, sounds, guide figure
3. **Core pages:** Home lyric stage, Amoghpedia, The Story, Client Work, Prompt Lens, Ask Amogh, Voice Receipts
4. **Extras:** Shorts, Side Builds, Amogh Control, retro easter egg, Incognito, Wrapped, Campaign
5. Backend on Emergent → deploy → final QA (mobile, performance, links)

Timebox each stage. A finished smaller site beats an unfinished bigger one.

---

## 10. Rules

- **IP:** no copied assets, logos, sprites, or layouts from Opera GX, Dan the Man, Spotify, YouTube, Instagram, Cotodama, or any reference image. Inspiration only. Use only assets whose license allows portfolio use, and credit artists in a credits section.
- **Honesty:** never invent facts or numbers. Mark simulated or estimated things as such. Placeholders use `[TODO: ...]`.
- **College framing:** ownership, never blame.
- **AI twin:** clearly labelled as AI.
- **Privacy:** no analytics or trackers. No audio uploaded anywhere. Say so on screen where the mic is used.
- **Performance:** first frame fast; lazy-load heavy parts (Phaser, Three.js, videos); keep the intro light.
- **Accessibility:** keyboard navigable, visible focus states, reduced-motion support, alt text, sufficient contrast.
- **Mobile:** every page must be usable on a phone.
- **Code quality:** small focused components, typed props, no dead code, content separated from layout.

---

## 11. Project commands

```bash
npm install
npm run dev            # Vite dev server on :5173
npm run build          # typecheck + production build
npm run preview        # serve the production build
npm run assets:intro   # regenerate the placeholder pixel art for the intro
```
