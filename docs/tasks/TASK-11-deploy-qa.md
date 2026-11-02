# TASK-11: Deploy + final QA

> Start this by Tuesday night at the latest, even if extras aren't done.

## Deploy
1. Push everything to GitHub (frontend + `backend/`).
2. **Emergent:** new task → GitHub button → Pull from GitHub → this repo. Ask the agent to run the FastAPI backend and serve the built frontend (`npm run build` → static files). Set env vars (LLM key, model, allowed origin). Deploy. Keep spare credits for fixes.
3. **Fallback:** frontend on Vercel/Netlify (free), backend on Emergent or Render; set `VITE_API_URL` on the frontend.
4. Confirm the public URL works logged-out, in an incognito window, and on a phone over mobile data.

## QA checklist
- [ ] Intro: first visit, skip, returning visitor, mobile tap-and-hold, reduced motion
- [ ] Every sidebar page opens; address-bar voice navigation works
- [ ] Home lyric stage works with real Wispr Flow dictation
- [ ] Prompt Lens + Ask Amogh work against the deployed backend (and the offline fallback if the backend is down)
- [ ] No `[TODO]` left visible anywhere on the live site (search the codebase)
- [ ] No IIWM / Bogen Villa links; Vera numbers confirmed by Amogh
- [ ] All external links open correctly
- [ ] Lighthouse: performance reasonable, accessibility ≥ 90
- [ ] Page title, favicon, and social preview image (og:image) set
- [ ] Credits section lists every third-party asset + license
- [ ] No API keys in the frontend bundle

## Done when
The public link is live, tested on desktop + phone, and ready to submit.
