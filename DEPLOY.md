# Deploying Amogh Navigator

One server runs everything: the FastAPI app in `backend/` serves the built site
from `dist/` and the API at `/api` on the same address. There is no separate
frontend host, no database, and nothing else to configure.

## Build and run

```bash
# 1. Build the site (Node 20.19+ or 22.12+)
npm ci
npm run build                 # writes dist/

# 2. Run the server (Python 3.11+)
cd backend
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}
```

Open the server's address: the site loads at `/`, and `/api/health` answers `{"ok": true, ...}`.

## Environment

| Variable | Value |
| --- | --- |
| `ANTHROPIC_API_KEY` | The key, set in the host's secret settings. Never in a file in the repo. |
| `LLM_MODEL` | `claude-haiku-5-5` (the default) |
| `DAILY_LIMIT` | Questions per day for the whole site, default `300` |
| `RATE_LIMIT` / `RATE_WINDOW_SECONDS` | Per visitor, default `20` per `600` seconds |
| `SITE_URL` | Optional: the public address, e.g. `https://amogh.example.app`. Without it the server uses the address it was reached on. Only the share card's image link uses it. |

`VITE_API_URL` is not needed: the site calls `/api` on its own address.
Also set a monthly spend limit on the key in the Anthropic console.

## On Emergent (deployment only)

1. New task, GitHub button, pull `KernelLex/portfolio`.
2. Tell the agent: "Deploy this repository as it is. Run `npm ci && npm run build`, then
   `pip install -r backend/requirements.txt` and start `uvicorn main:app` from `backend/`
   on the port the platform gives. Do not change any code."
3. Add `ANTHROPIC_API_KEY` (and `LLM_MODEL=claude-haiku-5-5`) as environment secrets.
4. Deploy, then check the public URL: the title screen loads, `/api/health` answers,
   and Ask Amogh replies without "offline mode".
5. Paste the URL into the LinkedIn Post Inspector and an X post draft: the card
   should show the title screen image.

Pushing to GitHub does not update the live site by itself: after a push, pull the
latest into the Emergent task and deploy again.

If the deploy fails, the same two commands run on Render or Railway unchanged.
