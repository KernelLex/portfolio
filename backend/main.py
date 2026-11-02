"""
The portfolio's backend: two small endpoints that call Claude.

  POST /api/ask          {message, history} -> {reply, suggestedTab}
  GET  /api/health

In production this one server also serves the built site (../dist), so the
site and the API share an address. The API key lives only here (ANTHROPIC_API_KEY). The frontend works without
this server too: it falls back to offline answers, labelled as such. Spend is
bounded three ways: per-IP and daily request caps here, and a monthly limit
set on the key in the Anthropic console.
"""

import json
import logging
import os
import time
from functools import cache
from collections import defaultdict, deque
from pathlib import Path
from typing import Literal

import anthropic
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

HERE = Path(__file__).parent


def load_env_file(path: Path) -> None:
    """Read KEY=value lines from the gitignored backend/.env, without overriding real environment variables."""
    if not path.exists():
        return
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            key, value = line.split("=", 1)
            os.environ.setdefault(key.strip(), value.strip().strip("\"'"))


load_env_file(HERE / ".env")

MODEL = os.environ.get("LLM_MODEL", "claude-haiku-5-5")
RATE_LIMIT = int(os.environ.get("RATE_LIMIT", "20"))
RATE_WINDOW = int(os.environ.get("RATE_WINDOW_SECONDS", "600"))
DAILY_LIMIT = int(os.environ.get("DAILY_LIMIT", "300"))
ORIGINS = [o.strip() for o in os.environ.get("ALLOWED_ORIGINS", "http://localhost:5173").split(",") if o.strip()]
LIFE_STORY = Path(os.environ.get("LIFE_STORY_PATH", HERE.parent / "content" / "life-story.md"))

ASK_SYSTEM = (HERE / "prompts" / "ask-amogh.md").read_text(encoding="utf-8") + "\n" + LIFE_STORY.read_text(encoding="utf-8")

TABS = ["story", "work", "amoghpedia", "side-builds", "shorts", "none"]
ASK_SCHEMA = {
    "type": "object",
    "properties": {
        "reply": {"type": "string"},
        "suggestedTab": {"type": "string", "enum": TABS},
    },
    "required": ["reply", "suggestedTab"],
    "additionalProperties": False,
}

app = FastAPI(title="Amogh Navigator API")
app.add_middleware(CORSMiddleware, allow_origins=ORIGINS, allow_methods=["GET", "POST"], allow_headers=["Content-Type"])

# Per-IP sliding window, in memory: enough to stop anyone burning the credits.
hits: dict[str, deque[float]] = defaultdict(deque)
# And a ceiling for the whole site per day, so a crowd cannot either. Past it,
# the site quietly falls back to its offline answers.
today = {"day": "", "count": 0}


def rate_limit(request: Request) -> None:
    day = time.strftime("%Y-%m-%d")
    if today["day"] != day:
        today.update(day=day, count=0)
    if today["count"] >= DAILY_LIMIT:
        raise HTTPException(status_code=429, detail="The AI twin is resting for today. Try again tomorrow.")
    ip = request.headers.get("x-forwarded-for", "").split(",")[0].strip() or (request.client.host if request.client else "?")
    now = time.monotonic()
    window = hits[ip]
    while window and now - window[0] > RATE_WINDOW:
        window.popleft()
    if len(window) >= RATE_LIMIT:
        raise HTTPException(status_code=429, detail="Too many requests. Try again in a few minutes.")
    window.append(now)
    today["count"] += 1


@cache
def claude() -> anthropic.Anthropic:
    """Created on first use, so the server starts (and /api/health answers) before a key is set."""
    return anthropic.Anthropic()


def ask_claude(system: str, messages: list[dict], max_tokens: int, output_format: dict | None = None) -> str:
    """One Messages API call. Refusals fall back server-side; a refusal that survives that becomes a 422."""
    output_config: dict = {"effort": "low"}
    if output_format:
        output_config["format"] = output_format
    try:
        response = claude().beta.messages.create(
            model=MODEL,
            max_tokens=max_tokens,
            system=system,
            messages=messages,
            output_config=output_config,
            betas=["server-side-fallback-2026-07-01"],
            fallbacks="default",
        )
    except anthropic.RateLimitError as err:
        raise HTTPException(status_code=503, detail="The model is busy. Try again shortly.") from err
    except anthropic.APIStatusError as err:
        raise HTTPException(status_code=502, detail=f"Model error ({err.status_code}).") from err
    except anthropic.APIConnectionError as err:
        raise HTTPException(status_code=502, detail="Could not reach the model.") from err
    except (anthropic.AnthropicError, TypeError) as err:
        # The SDK raises TypeError when it finds no credentials at all.
        logging.exception("Claude call failed")
        raise HTTPException(status_code=503, detail="The model is not configured.") from err

    if response.stop_reason == "refusal":
        raise HTTPException(status_code=422, detail="That one is outside what I can help with here.")
    text = next((block.text for block in response.content if block.type == "text"), "")
    if not text:
        raise HTTPException(status_code=502, detail="The model returned nothing.")
    return text


class Turn(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=2000)


class AskIn(BaseModel):
    message: str = Field(min_length=1, max_length=1000)
    history: list[Turn] = Field(default_factory=list, max_length=12)


@app.get("/api/health")
def health() -> dict:
    return {"ok": True, "model": MODEL}


@app.post("/api/ask")
def ask(body: AskIn, request: Request) -> dict:
    rate_limit(request)
    # The API needs alternating turns that start with the visitor.
    messages: list[dict] = []
    for turn in body.history:
        if not messages and turn.role != "user":
            continue
        if messages and messages[-1]["role"] == turn.role:
            messages[-1]["content"] += "\n\n" + turn.content
        else:
            messages.append({"role": turn.role, "content": turn.content})
    if messages and messages[-1]["role"] == "user":
        messages[-1]["content"] += "\n\n" + body.message
    else:
        messages.append({"role": "user", "content": body.message})

    raw = ask_claude(ASK_SYSTEM, messages, max_tokens=800, output_format={"type": "json_schema", "schema": ASK_SCHEMA})
    data = json.loads(raw)
    tab = data.get("suggestedTab")
    return {"reply": data["reply"], "suggestedTab": tab if tab in TABS and tab != "none" else None}


# One server for everything: the built site at /, the API beside it. Mounted
# last, so the /api routes above match first.
DIST = Path(os.environ.get("SITE_DIR", HERE.parent / "dist"))
if DIST.is_dir():
    app.mount("/", StaticFiles(directory=DIST, html=True), name="site")
