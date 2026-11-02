# Amogh Navigator API

Two small endpoints that call Claude, for Prompt Lens and Ask Amogh. The site works
without this server (it labels its answers "offline mode"), so it is optional for
local development.

| Endpoint | Body | Returns |
| --- | --- | --- |
| `POST /api/prompt-lens` | `{ text, mode }` (mode: coding, research, writing, image, general) | `{ prompt }` |
| `POST /api/ask` | `{ message, history: [{ role, content }] }` | `{ reply, suggestedTab }` |
| `GET /api/health` | | `{ ok, model }` |

- Model: `LLM_MODEL`, default `claude-opus-5-5`. Set `claude-haiku-5-5` to spend the least.
- Refusals fall back to another model server-side (`fallbacks: "default"`); one that still
  refuses comes back as a 422 with a short message.
- Ask Amogh answers only from `../content/life-story.md` (`LIFE_STORY_PATH` to override),
  with the rules in `prompts/ask-amogh.md`. Prompt Lens follows `prompts/prompt-lens.md`.
- Rate limit: `RATE_LIMIT` requests per IP per `RATE_WINDOW_SECONDS` (default 20 per 10 min).
- CORS: only the origins in `ALLOWED_ORIGINS`.

## Run locally

```bash
cd backend
python -m venv .venv && . .venv/Scripts/activate   # macOS/Linux: . .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env                               # then put your key in backend/.env
uvicorn main:app --reload --port 8000
```

`backend/.env` is gitignored and read at startup; real environment variables win over it.
Never commit it, and never put the key in a `VITE_` variable: those are built into the public site.

Then point the site at the API with `VITE_API_URL=http://localhost:8000` in a `.env.local`
at the repo root (also gitignored), and run `npm run dev`.

## Deploy on Emergent

1. Push the repo to GitHub.
2. In Emergent: new task, GitHub button, Pull from GitHub, choose this repo.
3. Ask the agent to run this FastAPI app (`uvicorn main:app` from `backend/`) and to serve
   the built frontend (`npm run build`, static files in `dist/`).
4. Set the environment: `ANTHROPIC_API_KEY`, `LLM_MODEL`, `ALLOWED_ORIGINS` (the public site
   URL), and build the frontend with `VITE_API_URL` set to the API's public URL.
5. Deploy. Check `GET /api/health`, then try both pages on the live site.
